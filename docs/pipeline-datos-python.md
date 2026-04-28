# Pipeline de datos Python

## Qué hace

El script `scripts/build_dashboard_data.py` es la capa que convierte el Excel operativo en un dataset listo para consumir desde el frontend.
Su trabajo es leer, limpiar, enriquecer y resumir la información para que el navegador no tenga que hacer ese procesamiento cada vez.

## Entrada

- Un archivo `.xlsx` de seguimiento de tickets.
- Opcionalmente, la ruta de un archivo específico.
- Si no se indica nada, el script busca el Excel más reciente en `datos/`.

## Procesamiento principal

### 1. Lectura del libro

El script usa `openpyxl` para abrir el Excel en modo lectura y recorrer las filas de cada hoja.
Los datos se toman a nivel de encabezados, así que el libro debe conservar nombres de columnas consistentes.

### 2. Normalización

Durante la lectura se limpian valores, textos, fechas y números para que todos los tickets sigan una estructura homogénea.
Esto reduce diferencias entre filas y evita que cada visual tenga que corregir formatos por su cuenta.

### 3. Enriquecimiento territorial

Se construye una referencia geográfica para departamentos y municipios.
La idea es que el dashboard pueda mostrar distribución territorial con una base más estable, incluso cuando el municipio exacto no existe en el índice geográfico.

### 4. Cálculo operativo

El pipeline agrega y deriva campos como:

- días de parada
- cumplimiento SLA
- antigüedad de tickets
- cobertura de comentarios
- tickets abiertos y cerrados
- eventos de parada asociados

### 5. Capa textual / NLP

Los comentarios se analizan con reglas y patrones de negocio para inferir temas y alertas narrativas.
Eso permite ver si un ticket tiene señales de falta de solución, problemas de contacto, brechas de SLA o incidencias de infraestructura.

### 6. Salidas generadas

El script produce dos archivos:

- `public/data/dashboard-data.json`: fuente principal que consume React.
- `data/dashboard-data.js`: salida legacy mantenida como respaldo.

## Qué facilita

- Centraliza toda la lógica analítica en un solo punto.
- Evita repetir fórmulas dentro de la interfaz.
- Hace que el dashboard cargue rápido porque el navegador recibe datos ya preparados.
- Permite que el equipo siga usando Excel como insumo, pero con una capa mucho más robusta de análisis.
- Deja el proceso documentado y repetible para cada nueva actualización.
