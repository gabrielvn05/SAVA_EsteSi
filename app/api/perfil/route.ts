import { apiError, apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { dispatchQuery } from "@/lib/cqrs/bus";
import { getPerfilQuery } from "@/lib/cqrs/queries/get-perfil";

export const GET = withApiHandler(async () => {
  const result = await dispatchQuery(getPerfilQuery, undefined);
  if (!result.ok) return apiError("UNAUTHORIZED", result.error, 401);
  return apiSuccess(result.data);
});
