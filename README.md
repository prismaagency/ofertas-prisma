# Prisma Agency — GitHub Pages

## Estructura

- `index.html` — inicio, buscador/filtros, destinos, testimonios, feed, cotización y countdown.
- `login.html` — login/registro con Email/Password y Google.
- `perfil.html` — wishlist y seguimiento de cotizaciones.
- `styles.css` — estilos globales responsive.
- `app.js` — lógica de la página principal.
- `auth.js` — Firebase Authentication.
- `profile.js` — sesión, wishlist y cotizaciones del panel.
- `destinations.js` — catálogo de destinos.
- `firebase-config.example.js` — plantilla de configuración.

## Firebase

La autenticación está preparada con Firebase modular SDK por CDN.

1. Crea una Web App en Firebase.
2. Habilita Email/Password y Google en Authentication.
3. Añade tu dominio GitHub Pages en los dominios autorizados.
4. Sustituye los valores `REEMPLAZAR_*` de `auth.js` y `profile.js`.
5. Publica los archivos en GitHub Pages.

La configuración web de Firebase no es un secreto; las reglas de seguridad reales deben implementarse en Firebase si posteriormente guardas datos en Firestore/Storage.

## Datos actuales

El catálogo conserva los destinos, precios y servicios del código base entregado. Los filtros de fecha usan un rango genérico 2026–2027 porque el código original no proporcionaba fechas reales de disponibilidad. Sustituye `dateFrom`/`dateTo` en `destinations.js` cuando tengas inventario real.

## Persistencia actual

- Wishlist: `localStorage`.
- Cotizaciones del formulario: `localStorage`.
- Firebase: autenticación.

Para producción, si quieres que un cliente pueda ver sus cotizaciones desde varios dispositivos, mueve las cotizaciones a Firestore y aplica reglas por `request.auth.uid`.
