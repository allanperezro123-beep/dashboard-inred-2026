# ⚙️ Configurar Secrets para la Automatización en la Nube

El dashboard ya está en GitHub y se desplegará automáticamente. Solo faltan **2 pasos finales** para activar la sincronización con Google Drive.

---

## ✅ Estado actual

| Secret | Estado |
|---|---|
| `FIREBASE_TOKEN` | ✅ Configurado |
| `DASHBOARD_DRIVE_FOLDER` | ❌ Falta configurar |
| `DASHBOARD_GOOGLE_CREDENTIALS_JSON` | ❌ Falta configurar |

---

## Paso 1 — Obtener el ID de la carpeta de Google Drive

1. Abre la carpeta de Drive donde tu equipo subirá los archivos Excel
2. Copia el ID de la URL. Ejemplo:  
   `https://drive.google.com/drive/folders/`**`1ABC_xyz_TU_ID_AQUI`**  
   El ID es todo lo que viene después de `/folders/`

---

## Paso 2 — Crear una Cuenta de Servicio de Google (si no tienes el JSON)

> Si ya tienes el archivo `.json` de service account, salta al Paso 3.

1. Ve a https://console.cloud.google.com/iam-admin/serviceaccounts
2. Selecciona tu proyecto `dashboard-tickets-operaciones`
3. Clic en **"+ Crear cuenta de servicio"**
4. Nombre: `dashboard-drive-reader`, clic en **Crear y continuar**
5. Rol: **Visualizador de Drive** (o "Viewer") — clic en **Continuar** y **Listo**
6. Haz clic en la cuenta de servicio recién creada
7. Pestaña **"Claves"** → **"Agregar clave"** → **"Crear nueva clave"** → tipo **JSON**
8. Se descargará un archivo `.json` — guárdalo en lugar seguro

**Luego:** Comparte la carpeta de Drive con el email de la cuenta de servicio  
(el email tiene formato: `nombre@tu-proyecto.iam.gserviceaccount.com`)

---

## Paso 3 — Agregar los 2 secrets en GitHub

Ve a: https://github.com/allanperezro123-beep/dashboard-inred-2026/settings/secrets/actions

### Secret 1: `DASHBOARD_DRIVE_FOLDER`
- Nombre: `DASHBOARD_DRIVE_FOLDER`
- Valor: el ID de la carpeta de Drive (solo el ID, sin URL)

### Secret 2: `DASHBOARD_GOOGLE_CREDENTIALS_JSON`
- Nombre: `DASHBOARD_GOOGLE_CREDENTIALS_JSON`
- Valor: **el contenido completo** del archivo `.json` de la cuenta de servicio  
  (Abre el JSON con el Bloc de notas, selecciona todo `Ctrl+A`, copia `Ctrl+C`, pega en el campo del secret)

---

## Paso 4 — Activar el workflow manualmente (primera vez)

Una vez configurados los secrets:

1. Ve a: https://github.com/allanperezro123-beep/dashboard-inred-2026/actions
2. Haz clic en **"Sync Drive and Deploy Dashboard"**
3. Clic en **"Run workflow"** → **"Run workflow"**
4. Espera ~3 minutos y el dashboard se actualizará automáticamente

A partir de ahí, **el workflow corre cada 30 minutos** sin que nadie tenga que hacer nada. 🚀

---

## ¿Cómo actualiza tu equipo los datos?

Solo tienen que **subir el archivo Excel** a la carpeta compartida de Drive.  
El dashboard se actualiza solo en máximo 30 minutos.

**URL del dashboard:** https://dashboard-tickets-operaciones.web.app
