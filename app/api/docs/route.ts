import { NextResponse } from "next/server";

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>SAVA API - Documentación</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/api/openapi", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
