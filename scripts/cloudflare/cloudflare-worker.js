const UPSTREAM = "https://fctv33hd.yachts";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const upstreamUrl = UPSTREAM + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.set("Host", new URL(UPSTREAM).host);
  headers.delete("Origin");
  headers.delete("Referer");

  const upstreamRequest = new Request(upstreamUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? request.body
      : undefined,
    redirect: "follow",
  });

  const response = await fetch(upstreamRequest);
  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("text/html")) {
    let body = await response.text();

    // 1. Elimina target="_blank" estáticos en el HTML
    body = body.replace(/target\s*=\s*["']_blank["']/gi, 'target="_self"');

    // 2. Inyección blindada: se ejecuta ANTES que cualquier script del sitio
    //    - Object.defineProperty hace que window.open NO pueda ser sobreescrito
    //    - MutationObserver vigila el DOM y parchea enlaces dinámicos al instante
    //    - El listener de 'click' captura cualquier clic antes de que se propague
    const injection = `<script>
(function() {
  // ── Bloquear window.open de forma permanente ──────────────────────
  // writable:false + configurable:false = nadie puede sobreescribirlo
  var _navigateSelf = function(url) {
    if (url && typeof url === 'string' && url !== '' && !url.startsWith('javascript:') && !url.startsWith('about:')) {
      window.location.href = url;
    }
    // Devolvemos un objeto con las propiedades mínimas que los scripts esperan
    return { closed: false, focus: function(){}, location: { href: url } };
  };

  try {
    Object.defineProperty(window, 'open', {
      value: _navigateSelf,
      writable: false,
      configurable: false
    });
  } catch(e) {
    window.open = _navigateSelf;
  }

  // ── base target _self para todos los enlaces ──────────────────────
  document.write('<base target="_self">');

  // ── MutationObserver: parchea enlaces generados por JS ────────────
  function patchLinks(root) {
    (root || document).querySelectorAll('a[target="_blank"], a[target="blank"]').forEach(function(a) {
      a.setAttribute('target', '_self');
      a.removeAttribute('rel');
    });
  }

  // Observer que vigila cambios en el DOM
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          // Si el propio nodo es un enlace
          if (node.tagName === 'A') {
            if (node.target === '_blank' || node.target === 'blank') {
              node.setAttribute('target', '_self');
            }
          }
          // Si contiene enlaces dentro
          patchLinks(node);
        }
      });
    });
  });

  // Arranca el observer cuando el DOM esté listo
  function startObserver() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    patchLinks(); // Parchea los que ya existan
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // ── Interceptor de clics como red de seguridad final ─────────────
  // useCapture:true = se ejecuta ANTES que el handler del sitio
  document.addEventListener('click', function(e) {
    var el = e.target;
    // Sube por el DOM hasta encontrar un <a>
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (el && el.tagName === 'A') {
      if (el.target === '_blank' || el.target === 'blank') {
        el.setAttribute('target', '_self');
      }
    }
  }, true);

})();
<\/script>`;

    // Insertamos ANTES de cualquier otro script, al inicio del <head>
    if (body.includes('<head>')) {
      body = body.replace('<head>', '<head>' + injection);
    } else if (body.includes('<HEAD>')) {
      body = body.replace('<HEAD>', '<HEAD>' + injection);
    } else {
      // Fallback: al inicio del body
      body = body.replace('<body', injection + '<body');
    }

    // 3. Reescribe URLs absolutas para que pasen por el Worker
    const workerOrigin = new URL(request.url).origin;
    body = body.replace(
      new RegExp(`https?://${new URL(UPSTREAM).host}`, "g"),
      workerOrigin
    );

    // 2.5. INYECTAR FULLSCREEN EN TODOS SUS IFRAMES INTERNOS
    // FCTV33 suele cargar el reproductor final en otro iframe. Si ese iframe no tiene allowfullscreen, falla.
    body = body.replace(/<iframe /gi, '<iframe allow="autoplay; fullscreen; picture-in-picture" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" ');

    // 4. Cabeceras limpias
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("X-Frame-Options");
    newHeaders.delete("Content-Security-Policy");
    newHeaders.set("Content-Type", "text/html; charset=utf-8");
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(body, {
      status: response.status,
      headers: newHeaders,
    });
  }

  // Recursos no-HTML: pasa tal cual pero sin cabeceras de bloqueo
  const newHeaders = new Headers(response.headers);
  newHeaders.delete("X-Frame-Options");
  newHeaders.delete("Content-Security-Policy");
  newHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}