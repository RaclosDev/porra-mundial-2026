// Worker sencillo: proxy de FCTV33 + quitar bloqueos + fullscreen + comunicación con padre
const UPSTREAM = "https://fctv33hd.yachts";

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const target = UPSTREAM + url.pathname + url.search;

  // Petición al upstream
  const res = await fetch(target, {
    method: request.method,
    headers: { "Host": new URL(UPSTREAM).host },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "follow",
  });

  // Cabeceras limpias (quitar bloqueos de iframe y CORS)
  const headers = new Headers(res.headers);
  headers.delete("X-Frame-Options");
  headers.delete("Content-Security-Policy");
  headers.delete("Permissions-Policy");
  headers.delete("Feature-Policy");
  headers.set("Access-Control-Allow-Origin", "*");

  const ct = res.headers.get("Content-Type") || "";

  // Solo tocar HTML
  if (ct.includes("text/html")) {
    let html = await res.text();

    // Reescribir links al upstream para que pasen por el Worker
    const workerOrigin = new URL(request.url).origin;
    html = html.replace(new RegExp("https?://" + new URL(UPSTREAM).host, "g"), workerOrigin);

    // Meter allowfullscreen en todos los iframes
    html = html.replace(/<iframe /gi, '<iframe allowfullscreen="true" allow="fullscreen" ');

    // Abrir links en la misma pestaña (no _blank)
    html = html.replace(/target\s*=\s*["']_blank["']/gi, 'target="_self"');

    // Inyectar script que avisa al padre de la URL actual (para "Abrir en pestaña nueva")
    const injection = `<script>
try { window.parent.postMessage({ type: 'FCTV_CURRENT_URL', url: location.href }, '*'); } catch(e) {}
</script>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', injection + '</head>');
    } else if (html.includes('</HEAD>')) {
      html = html.replace('</HEAD>', injection + '</HEAD>');
    } else {
      html = injection + html;
    }

    headers.set("Permissions-Policy", "fullscreen=*");
    headers.set("Content-Type", "text/html; charset=utf-8");

    return new Response(html, { status: res.status, headers });
  }

  // Recursos (JS, CSS, imágenes…) → pasar tal cual con cabeceras limpias
  return new Response(res.body, { status: res.status, headers });
}