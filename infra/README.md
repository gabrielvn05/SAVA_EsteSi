# Infraestructura — Orquestación DIIT

## Docker Compose (obligatorio)

La orquestación local y de despliegue base usa `docker-compose.yml` en la raíz del proyecto:

- **postgres**: PostgreSQL 16 con esquema y auditoría
- **app**: aplicación Next.js (imagen multi-stage)

```bash
docker compose up -d --build
```

## Aspire Dev

Los lineamientos DIIT recomiendan **Aspire Dev** para orquestación, observabilidad y despliegue estandarizado. Este proyecto Node.js/Next.js puede integrarse a un AppHost Aspire institucional cuando la DIIT lo provea.

Mientras tanto, Docker Compose cumple el requisito de contenedorización y documentación de infraestructura en código.

## Ambientes

| Ambiente | Administración |
|----------|----------------|
| Desarrollo | Equipo de desarrollo (local / Docker) |
| Pruebas | DIIT |
| Producción | DIIT |
