# Panel administrativo de Prisma Agency

## 1. Crear/usar la cuenta administradora
En Firebase Console > Authentication > Users, crea o usa una cuenta con Email/Password. Copia exactamente su correo.

## 2. Configurar el panel
Abre `admin.js` y cambia:
`const ADMIN_EMAIL="REEMPLAZA_CON_TU_EMAIL_ADMIN";`
por el correo real del administrador.

## 3. Activar Firestore
Firebase Console > Firestore Database > Create database. Para producción, usa las reglas del archivo `FIRESTORE-RULES.txt`.
Antes de publicar las reglas, sustituye `REEMPLAZA_CON_TU_EMAIL_ADMIN` por el mismo correo del administrador.

## 4. Publicar
Sube todos los archivos del ZIP a GitHub Pages. El panel está en:
`/admin.html`

## 5. Crear las ofertas iniciales
Desde el panel crea:
- Canadá — USD 7,500
- Nicaragua — USD 1,250

Marca ambas como activas.

## 6. Configurar el contador
En "Contador Flash" selecciona la fecha y hora exactas en que quieres que termine. La página pública usará ese contador. Al llegar a cero, las ofertas se ocultan y el contador reinicia el ciclo.

## Importante
No es necesario cambiar `firebase-config.js`; el proyecto ya contiene la configuración de la Web App Firebase. Las reglas controlan quién puede escribir en Firestore.
