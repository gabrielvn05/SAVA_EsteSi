"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile, hasCapability, requireAuth } from "@/lib/auth";
import { estadoTrasRevisionSecretaria } from "@/lib/solicitud-workflow";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import { buildOficioDocxBuffer } from "@/lib/certificado/build-oficio-docx";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";
import { fetchDecanoOficioDestinatario } from "@/lib/certificado/fetch-decano-oficio";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import { sendTemporaryPasswordEmail } from "@/lib/email";
import { dispatchCommand } from "@/lib/cqrs/bus";
import { crearSolicitudCommand } from "@/lib/cqrs/commands/crear-solicitud";
import { validateAccountRequestForm } from "@/lib/account-request";
import { logEvent } from "@/lib/logging/logger";
import {
  camposInstitucionalesDesdeSolicitudCuenta,
  detalleInstitucionalDesdePerfil,
  perfilInstitucionalCompleto,
  resolverPerfilInstitucional
} from "@/lib/perfil-institucional";
import { buildCodigoTramite, nombreArchivoOficio } from "@/lib/codigo-tramite";
import { fetchSolicitudParaUsuario } from "@/lib/solicitud-access";

function normalizeFileName(fileName: string) {
  return fileName.replaceAll(/[^a-zA-Z0-9.\-_]/g, "_");
}

function getTextField(formData: FormData, field: string, fallback = "") {
  const value = formData.get(field);
  return typeof value === "string" ? value : fallback;
}

function generateTemporaryPassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  const random = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(random, (n) => alphabet[n % alphabet.length]).join("");
}

export async function crearSolicitud(formData: FormData) {
  const { user } = await requireAuth();
  const supabase = createSupabaseServerClient();
  const archivo = formData.get("justificativo") as File | null;

  let justificativoPath: string | null = null;
  let justificativoNombre: string | null = null;

  // El justificativo es opcional (dependiendo del tipo de trámite).
  if (archivo && archivo.size > 0) {
    const archivoPath = `${user.id}/${Date.now()}_${normalizeFileName(archivo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("justificativos")
      .upload(archivoPath, archivo, { upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    justificativoPath = archivoPath;
    justificativoNombre = archivo.name;
  }

  const result = await dispatchCommand(crearSolicitudCommand, {
    userId: user.id,
    tipo: getTextField(formData, "tipo", "justificacion"),
    fechaInicio: getTextField(formData, "fecha_inicio"),
    fechaFin: getTextField(formData, "fecha_fin"),
    motivo: getTextField(formData, "motivo"),
    justificativoPath,
    justificativoNombre
  });
  if (!result.ok) throw new Error(result.error);
  logEvent("audit", "info", "Solicitud creada vía action", { solicitudId: result.data.id });

  revalidatePath("/solicitudes");
  redirect("/solicitudes");
}

export async function actualizarSolicitud(id: string, formData: FormData) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esStaff =
    profile.rol === "secretaria" || profile.rol === "decano" || profile.rol === "superusuario";
  const supabase = createSupabaseServerClient();

  const fechaInicioValue = getTextField(formData, "fecha_inicio");
  const fechaInicioError = validateFechaInicioMaxTresMeses(fechaInicioValue);
  if (fechaInicioError) throw new Error(fechaInicioError);

  const actual = await fetchSolicitudParaUsuario(
    id,
    user.id,
    esStaff,
    "id, justificativo_path, justificativo_nombre, creado_por, estado"
  );

  if (!actual) throw new Error("No se encontró la solicitud.");
  if (actual.creado_por !== user.id) throw new Error("Solo puedes editar tus propias solicitudes.");
  if (actual.estado !== "en_revision_secretaria") {
    throw new Error("Esta solicitud ya no puede editarse porque avanzó en el proceso de aprobación.");
  }

  let justificativoPath = actual.justificativo_path;
  let justificativoNombre = actual.justificativo_nombre;
  const nuevoArchivo = formData.get("justificativo") as File | null;

  if (nuevoArchivo && nuevoArchivo.size > 0) {
    const nuevoPath = `${user.id}/${Date.now()}_${normalizeFileName(nuevoArchivo.name)}`;
    const { error: uploadError } = await supabase.storage.from("justificativos").upload(nuevoPath, nuevoArchivo, {
      upsert: false
    });
    if (uploadError) throw new Error(uploadError.message);
    justificativoPath = nuevoPath;
    justificativoNombre = nuevoArchivo.name;
  }

  // Cliente admin: el UPDATE con sesión anon dispara RLS recursivo en Postgres ("stack depth limit exceeded").
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("solicitudes")
    .update({
      tipo: getTextField(formData, "tipo", "justificacion"),
      fecha_inicio: fechaInicioValue,
      fecha_fin: getTextField(formData, "fecha_fin"),
      motivo: getTextField(formData, "motivo"),
      justificativo_path: justificativoPath,
      justificativo_nombre: justificativoNombre
    })
    .eq("id", id)
    .eq("creado_por", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/solicitudes");
  revalidatePath(`/solicitudes/${id}`);
  redirect("/solicitudes");
}

export async function revisarSolicitud(id: string, aprobado: boolean, observacion: string) {
  const { user } = await requireAuth();
  const puedeRevisar = await hasCapability(user.id, "revisar_solicitudes");
  if (!puedeRevisar) throw new Error("No tienes permisos para revisar.");
  if (!aprobado && !observacion.trim()) throw new Error("Debe indicar el motivo del rechazo.");

  const admin = createSupabaseAdminClient();
  const { data: solicitud, error: solErr } = await admin.from("solicitudes").select("creado_por").eq("id", id).single();
  if (solErr || !solicitud) throw new Error("No se encontró la solicitud.");

  const creador = await getUserProfile(solicitud.creado_por);
  if (solicitud.creado_por === user.id) {
    throw new Error("No puedes revisar una solicitud creada por ti mismo.");
  }

  const nuevoEstado = estadoTrasRevisionSecretaria(creador.rol, aprobado);
  const ahora = new Date().toISOString();

  const { error } = await admin
    .from("solicitudes")
    .update({
      estado: nuevoEstado,
      revisado_por: user.id,
      observaciones_secretaria: observacion || null,
      ...(nuevoEstado === "aprobada" && creador.rol === "decano"
        ? { firmado_por: user.id, fecha_firma: ahora, observaciones_decano: observacion || null }
        : {})
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/solicitudes");
  revalidatePath("/solicitudes/proceso-aprobacion");
  revalidatePath(`/solicitudes/${id}`);
}

export async function firmarSolicitud(id: string, aprobado: boolean, observacion: string) {
  const { user } = await requireAuth();
  const puedeAprobar = await hasCapability(user.id, "aprobar_solicitudes");
  if (!puedeAprobar) throw new Error("No tienes permisos para aprobar.");
  if (!aprobado && !observacion.trim()) throw new Error("Debe indicar el motivo del rechazo.");

  const admin = createSupabaseAdminClient();
  const { data: solicitud, error: solErr } = await admin.from("solicitudes").select("creado_por").eq("id", id).single();
  if (solErr || !solicitud) throw new Error("No se encontró la solicitud.");
  if (solicitud.creado_por === user.id) {
    throw new Error("No puedes firmar una solicitud creada por ti mismo.");
  }

  const { error } = await admin
    .from("solicitudes")
    .update({
      estado: aprobado ? "aprobada" : "rechazada",
      firmado_por: user.id,
      observaciones_decano: observacion || null,
      fecha_firma: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/solicitudes");
  revalidatePath("/solicitudes/proceso-aprobacion");
  revalidatePath(`/solicitudes/${id}`);
}

export async function crearUsuarioInterno(formData: FormData) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol !== "superusuario") {
    throw new Error("Solo el superusuario puede crear usuarios.");
  }

  const supabase = createSupabaseAdminClient();
  const email = getTextField(formData, "email");
  const password = getTextField(formData, "password");
  const nombres = getTextField(formData, "nombres");
  const apellidos = getTextField(formData, "apellidos");
  const rol = getTextField(formData, "rol", "administrativo");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) throw new Error(error?.message || "No se pudo crear usuario.");

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email,
    nombres,
    apellidos,
    rol,
    activo: true
  });

  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/usuarios");
}

export async function delegarCapacidad(formData: FormData) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol !== "superusuario") {
    throw new Error("Solo el superusuario puede delegar capacidades.");
  }

  const supabase = createSupabaseServerClient();
  const userId = getTextField(formData, "user_id");
  const capability = getTextField(formData, "capability");

  const { error } = await supabase
    .from("user_capabilities")
    .upsert({ user_id: userId, capability, otorgado_por: user.id }, { onConflict: "user_id,capability" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}

export async function solicitarCuenta(formData: FormData) {
  const validation = validateAccountRequestForm({
    email: getTextField(formData, "email"),
    nombres: getTextField(formData, "nombres"),
    apellidos: getTextField(formData, "apellidos"),
    cedula: getTextField(formData, "cedula"),
    celular: getTextField(formData, "celular"),
    carrera: getTextField(formData, "carrera"),
    jornada: "",
    rol_solicitado: getTextField(formData, "rol_solicitado", "administrativo")
  });

  if (!validation.ok) {
    redirect(`/solicitar-cuenta?aviso=${validation.aviso}`);
  }

  const { email: rawEmail, nombres, apellidos, cedula, celular, carrera, jornada, rol_solicitado: rolSolicitado } =
    validation.data;

  const admin = createSupabaseAdminClient();

  const { data: perfilExistente } = await admin.from("profiles").select("id").eq("email", rawEmail).maybeSingle();
  if (perfilExistente) {
    redirect("/solicitar-cuenta?aviso=usuario_existe");
  }

  const { data: pendiente } = await admin
    .from("account_requests")
    .select("id")
    .eq("email", rawEmail)
    .eq("status", "pendiente")
    .maybeSingle();
  if (pendiente) {
    redirect("/solicitar-cuenta?aviso=solicitud_pendiente");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("account_requests").insert({
    email: rawEmail,
    nombres,
    apellidos,
    cedula,
    celular,
    carrera,
    jornada,
    rol_solicitado: rolSolicitado,
    motivo: null
  });

  if (error) {
    const dup =
      error.code === "23505" ||
      /account_requests_email_status_key|duplicate key/i.test(error.message ?? "");
    if (dup) {
      redirect("/solicitar-cuenta?aviso=solicitud_pendiente");
    }
    redirect(`/solicitar-cuenta?aviso=error&detalle=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?solicitud=ok");
}

export async function aprobarSolicitudCuenta(formData: FormData) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol !== "superusuario" && profile.rol !== "decano") {
    throw new Error("Solo el Decano o Superusuario pueden aceptar solicitudes de cuenta y crear usuarios.");
  }

  const requestId = getTextField(formData, "request_id");
  const admin = createSupabaseAdminClient();
  const { data: req, error: reqErr } = await admin
    .from("account_requests")
    .select("id, email, nombres, apellidos, cedula, celular, carrera, jornada, rol_solicitado, status")
    .eq("id", requestId)
    .single();

  if (reqErr || !req) throw new Error("No se encontro la solicitud.");
  if (req.status !== "pendiente") return;
  const request = req;
  const datosInst = camposInstitucionalesDesdeSolicitudCuenta(request);

  const tempPassword = generateTemporaryPassword(12);
  const { data, error } = await admin.auth.admin.createUser({
    email: request.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      nombres: request.nombres,
      apellidos: request.apellidos,
      rol: request.rol_solicitado,
      cedula: datosInst.cedula,
      celular: datosInst.celular,
      carrera: datosInst.carrera,
      jornada: datosInst.jornada,
      force_password_change: true
    }
  });
  async function sendTempPasswordOrThrow() {
    await sendTemporaryPasswordEmail({
      to: request.email,
      fullName: `${request.nombres} ${request.apellidos}`,
      temporaryPassword: tempPassword
    });
  }

  // Si el correo ya existe en Auth, no explotamos la UI.
  // Se resetea clave temporal, se fuerza cambio de contraseña y se aprueba.
  if (error && /already been registered|already registered|email address has already/i.test(error.message || "")) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", request.email.trim().toLowerCase())
      .maybeSingle();

    let existingUserId = existingProfile?.id ?? null;

    // Fallback: puede existir en Auth pero no en profiles (trigger previo ausente o migración antigua).
    if (!existingUserId) {
      let authUserId: string | null = null;
      for (let page = 1; page <= 20 && !authUserId; page++) {
        const { data: usersPage, error: usersErr } = await admin.auth.admin.listUsers({
          page,
          perPage: 100
        });
        if (usersErr) {
          throw new Error(`No se pudo consultar usuarios en Auth: ${usersErr.message}`);
        }
        const match = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === request.email.trim().toLowerCase());
        if (match?.id) authUserId = match.id;
        if (usersPage.users.length < 100) break;
      }

      if (!authUserId) {
        throw new Error("El correo ya existe en Auth, pero no se pudo localizar su ID para reasignar clave temporal.");
      }

      existingUserId = authUserId;
      // Si faltaba profile, lo creamos para mantener integridad de datos.
      await admin.from("profiles").upsert({
        id: existingUserId,
        email: request.email.trim().toLowerCase(),
        nombres: request.nombres,
        apellidos: request.apellidos,
        rol: request.rol_solicitado,
        activo: true,
        ...datosInst
      });
    }

    const { error: resetErr } = await admin.auth.admin.updateUserById(existingUserId, {
      password: tempPassword,
      user_metadata: {
        nombres: request.nombres,
        apellidos: request.apellidos,
        rol: request.rol_solicitado,
        cedula: datosInst.cedula,
        celular: datosInst.celular,
        carrera: datosInst.carrera,
        jornada: datosInst.jornada,
        force_password_change: true
      }
    });
    if (resetErr) throw new Error(`No se pudo actualizar clave temporal del usuario existente: ${resetErr.message}`);

    await admin
      .from("profiles")
      .update({
        nombres: request.nombres,
        apellidos: request.apellidos,
        rol: request.rol_solicitado,
        activo: true,
        ...datosInst
      })
      .eq("id", existingUserId);

    try {
      await sendTempPasswordOrThrow();
    } catch (mailError) {
      const message = mailError instanceof Error ? mailError.message : "No se pudo enviar correo.";
      throw new Error(`No se pudo enviar el correo con la clave temporal: ${message}`);
    }

    const { error: updRegisteredErr } = await admin
      .from("account_requests")
      .update({
        status: "aprobada",
        rechazo_comentario: null,
        handled_by: user.id,
        handled_at: new Date().toISOString()
      })
      .eq("id", requestId);
    if (updRegisteredErr) throw new Error(updRegisteredErr.message);
    revalidatePath("/admin/solicitudes-cuenta");
    return;
  }

  if (error || !data.user) throw new Error(error?.message || "No se pudo crear usuario.");

  await admin.from("profiles").upsert({
    id: data.user.id,
    email: request.email,
    nombres: request.nombres,
    apellidos: request.apellidos,
    rol: request.rol_solicitado,
    activo: true,
    ...datosInst
  });

  try {
    await sendTempPasswordOrThrow();
  } catch (mailError) {
    await admin.auth.admin.deleteUser(data.user.id);
    const message = mailError instanceof Error ? mailError.message : "No se pudo enviar correo.";
    throw new Error(`No se pudo enviar el correo con la clave temporal: ${message}`);
  }

  const { error: updErr } = await admin
    .from("account_requests")
    .update({ status: "aprobada", handled_by: user.id, handled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/admin/solicitudes-cuenta");
}

export async function cambiarClaveInicial(formData: FormData) {
  const { supabase } = await requireAuth({ skipPasswordChangeCheck: true });
  const newPassword = getTextField(formData, "new_password");
  const confirmPassword = getTextField(formData, "confirm_password");

  if (newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("La confirmación de contraseña no coincide.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const userMetadata = { ...(user.user_metadata ?? {}), force_password_change: false };
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    data: userMetadata
  });
  if (error) throw new Error(error.message);

  redirect("/dashboard");
}

export async function rechazarSolicitudCuenta(formData: FormData) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol !== "decano" && profile.rol !== "secretaria" && profile.rol !== "superusuario") {
    throw new Error("No tienes permisos para rechazar solicitudes de cuenta.");
  }

  const requestId = getTextField(formData, "request_id");
  const comentario = getTextField(formData, "comentario", "").trim();
  if (profile.rol === "secretaria" && !comentario) {
    throw new Error("Debes agregar un comentario al rechazar la solicitud.");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("account_requests")
    .update({
      status: "rechazada",
      rechazo_comentario: comentario || null,
      handled_by: user.id,
      handled_at: new Date().toISOString()
    })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/solicitudes-cuenta");
}

const TIPOS_JUSTIFICACION_WIZARD = new Set(["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"]);

export type CrearSolicitudWizardResult = { ok: true } | { ok: false; error: string };

export async function crearSolicitudDesdeWizard(formData: FormData): Promise<CrearSolicitudWizardResult> {
  try {
    const { user } = await requireAuth();
    const supabase = createSupabaseServerClient();

    const tipo = getTextField(formData, "tipo");
    if (!TIPOS_JUSTIFICACION_WIZARD.has(tipo)) {
      return { ok: false, error: "Tipo de solicitud inválido." };
    }

    const fecha_inicio = getTextField(formData, "fecha_inicio");
    const fecha_fin = getTextField(formData, "fecha_fin");
    const motivo = getTextField(formData, "motivo");
    const detalleJson = getTextField(formData, "detalle_json", "{}");

    const fechaInicioError = validateFechaInicioMaxTresMeses(fecha_inicio);
    if (fechaInicioError) return { ok: false, error: fechaInicioError };
    if (!motivo.trim()) return { ok: false, error: "El motivo es obligatorio." };
    if (!fecha_fin || fecha_fin < fecha_inicio) return { ok: false, error: "El rango de fechas no es válido." };

    let detalle: Record<string, unknown> = {};
    try {
      detalle = JSON.parse(detalleJson) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "No se pudo leer el detalle de la solicitud." };
    }

    const profile = await getUserProfile(user.id);
    const institucional = resolverPerfilInstitucional(profile);
    if (!perfilInstitucionalCompleto(institucional)) {
      return {
        ok: false,
        error:
          "Tu perfil no tiene cédula o carrera registradas. Contacta a Secretaría para actualizar los datos de tu cuenta."
      };
    }
    detalle = { ...detalle, ...detalleInstitucionalDesdePerfil(institucional) };

    const codigoTramite = buildCodigoTramite(tipo, profile.nombres, profile.apellidos);
    detalle = { ...detalle, codigo_tramite: codigoTramite };

    const destinatario = await fetchDecanoOficioDestinatario();
    const tipoPersonal = parseTipoPersonal(detalle.tipo_personal);

    let docxBuffer: Buffer;
    try {
      docxBuffer = await buildOficioDocxBuffer(
        {
          solicitante: {
            nombres: profile.nombres,
            apellidos: profile.apellidos,
            email: user.email ?? ""
          },
          tipo: tipo as CertificadoTipo,
          tipo_personal: tipoPersonal,
          fecha_inicio,
          fecha_fin,
          motivo,
          detalle
        },
        destinatario
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo generar el oficio institucional.";
      return { ok: false, error: msg };
    }

    const nombreOficio = nombreArchivoOficio(codigoTramite);
    const oficioPath = `${user.id}/${Date.now()}_${nombreOficio}`;
    const { error: oficioUploadError } = await supabase.storage
      .from("justificativos")
      .upload(oficioPath, docxBuffer, {
        upsert: false,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
    if (oficioUploadError) return { ok: false, error: oficioUploadError.message };

    const justificativoPath = oficioPath;
    const justificativoNombre = nombreOficio;

    const archivos = formData
      .getAll("justificativo")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (archivos.length > 0) {
      const anexos: Array<{ path: string; nombre: string }> = [];
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const anexoPath = `${user.id}/${Date.now()}_${i}_${normalizeFileName(archivo.name)}`;
        const { error: anexoError } = await supabase.storage.from("justificativos").upload(anexoPath, archivo, {
          upsert: false
        });
        if (anexoError) return { ok: false, error: anexoError.message };
        anexos.push({ path: anexoPath, nombre: archivo.name });
      }
      detalle = {
        ...detalle,
        anexos,
        anexo_path: anexos[0].path,
        anexo_nombre: anexos[0].nombre
      };
    } else if (tipo === "enfermedad") {
      return { ok: false, error: "Debe adjuntar el documento de respaldo (certificado o soporte médico)." };
    }

    if (tipo === "falta_marcado" && typeof detalle.jornada === "string" && detalle.jornada.trim()) {
      const admin = createSupabaseAdminClient();
      await admin.from("profiles").update({ jornada: detalle.jornada }).eq("id", user.id);
    }

    const { error } = await supabase.from("solicitudes").insert({
      creado_por: user.id,
      tipo,
      fecha_inicio,
      fecha_fin,
      motivo,
      detalle,
      justificativo_path: justificativoPath,
      justificativo_nombre: justificativoNombre,
      estado: "en_revision_secretaria"
    });

    if (error) {
      let msg = error.message;
      if (/solicitud_tipo|invalid input value for enum/i.test(msg)) {
        msg = `${msg} Actualiza el enum en Supabase ejecutando el script sql/fix-solicitud-tipo-enum.sql (o sql/supabase-hotfix-rls-y-detalle.sql).`;
      }
      return { ok: false, error: msg };
    }

    revalidatePath("/solicitudes");
    revalidatePath("/solicitudes/proceso-aprobacion");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo crear la solicitud.";
    return { ok: false, error: msg };
  }
}
