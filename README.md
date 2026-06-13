# 🏆 Porra Mundial 2026

¡Bienvenido al repositorio oficial de la **Porra Mundial 2026**! 
Una aplicación web moderna, interactiva y en tiempo real para gestionar pronósticos, predicciones y la clasificación de un grupo de amigos durante la Copa del Mundo de la FIFA 2026.

## ✨ Características Principales

La aplicación está diseñada con una estética premium *Glassmorphism* (efecto cristal) y cuenta con un sinfín de herramientas automáticas para que los participantes solo tengan que preocuparse de disfrutar del fútbol.

### 📡 Actualizaciones en Tiempo Real
- **Sincronización Automática API**: Se conecta automáticamente a la API oficial del Mundial mediante un proxy para obtener los resultados en directo cada 30 segundos.
- **Partidos en Curso (LIVE)**: Muestra en la parte superior los partidos que se están jugando ahora mismo.
- **Aviso de "PRÓXIMO"**: Cuando faltan 30 minutos o menos para un partido, aparece automáticamente en el radar de directos para que los usuarios puedan ir ocupando sus asientos virtuales.
- **Radar del Torneo**: Historial de los últimos resultados y calendario de los próximos partidos, siempre actualizado.
- **Sonido de Gol**: ¡Si tienes la pestaña abierta, el sistema hará sonar una alerta cada vez que haya un gol en un partido en directo!

### 📊 Clasificación y Tablas Inteligentes
- **Clasificación Global**: Ranking general de los participantes basado en los puntos que han obtenido por acertar las posiciones de fase de grupos, eliminatorias y máximo goleador.
- **Tabla de Grupos Virtual**: Clasificación en directo de los 12 grupos del mundial. 
- **Desempates Automáticos**: Si hay empate a puntos, el sistema revisa la *diferencia de goles*, *goles a favor* y el *enfrentamiento directo* automáticamente.
- **Penalización por Inactividad**: Los equipos que aún no han jugado su primer partido (`mp === 0`) se colocan automáticamente en el fondo de su grupo para no alterar la clasificación provisional ("cero empates fantasma").
- **Compartir por WhatsApp**: Botón integrado que genera una captura instantánea del ranking (`html2canvas`) para enviarla al grupo de amigos con un solo clic.

### 📺 Reproductor Integrado (FCTV33 / RTVE / Acestream)
- **Watch Party Integrada**: Los usuarios pueden ver los partidos en directo sin salir de la página de la porra.
- **Bypass de Seguridad**: Utiliza un *Cloudflare Worker* personalizado para saltarse las restricciones CORS y X-Frame-Options, permitiendo incrustar canales como FCTV33 a pantalla completa de manera nativa.

### 🛠️ Panel de Administración Oculto
Los administradores pueden acceder a funciones exclusivas tecleando su contraseña secreta en el buscador de usuarios:
- Sincronización manual forzada con la API.
- Alteración manual de la posición de selecciones en caso de empates complejos.
- Guardado en la nube de la base de datos oficial en Firebase.
- Botón de inyección de "Gol Falso" para probar el sistema de sonido en vivo.

## 🚀 Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Vanilla con diseño moderno) y JavaScript ES6.
- **Backend/Base de Datos:** Firebase Realtime Database.
- **API y Proxy:** Cloudflare Workers para el bypass de iframes y CORS Proxy para las llamadas a la API externa.
- **Generación de Imágenes:** `html2canvas` para compartir resúmenes.

## 📂 Estructura de Archivos (Para subir al Hosting)

Para actualizar o desplegar el proyecto, solo necesitas asegurarte de subir los siguientes archivos principales:

- `index.html`: Toda la estructura web, interfaces y estilos CSS inyectados/linkeados.
- `main.js`: El motor principal de la aplicación, cálculos de puntuaciones, conexión a Firebase, y manipulación del DOM.
- `style.css`: La hoja de estilos principal (animaciones, diseño responsive y glassmorphism).
- `cloudflare-worker.js`: El script que debe estar alojado en el entorno de Cloudflare para manejar los streams en directo.

## 💡 Cómo Usar

1. Clona el repositorio y súbelo a tu proveedor de hosting preferido (Vercel, Netlify, o simplemente por FTP).
2. Asegúrate de configurar tus credenciales de Firebase dentro del script de configuración en `index.html` / `main.js`.
3. Despliega el `cloudflare-worker.js` en tu cuenta de Cloudflare y actualiza la URL en el código si es necesario.
4. ¡Disfruta del torneo!

---
*Hecho con ❤️ y mucho código para vivir el Mundial 2026 al máximo.*
