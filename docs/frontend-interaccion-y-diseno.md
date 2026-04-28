# Frontend, componentes y diseño

## Qué hace el frontend

La aplicación React es la capa de exploración del dashboard.
Toma el dataset generado por Python y lo convierte en una experiencia interactiva para revisar tickets, comparar KPIs, explorar territorios y abrir cada caso con detalle.

El frontend no recalcula toda la lógica de negocio desde cero: consume el dataset preparado y se enfoca en la interacción.
Eso hace que la experiencia sea más rápida y más fácil de mantener.

## Estructura principal

### `src/main.jsx`

Arranca React y monta la aplicación en el nodo raíz.

### `src/App.jsx`

Es el orquestador principal.
Ahí viven el estado de la vista, los filtros, la búsqueda textual, el ticket seleccionado, el panel de drill-down y la carga del dataset.

También coordina las cuatro vistas del tablero:

- General
- SLA / Parada
- Operación / Mantenimiento
- Texto + NLP

### `src/components/Sidebar.jsx`

Agrupa navegación, filtros y flags rápidos.
Sirve para cambiar de vista y acotar el universo de tickets sin perder contexto.

### `src/components/DataTable.jsx`

Muestra tablas exportables y conecta las acciones de descarga a CSV o Excel.
Es clave para quienes necesitan sacar una vista puntual y seguir trabajando en Office.

### `src/components/DrillPanel.jsx`

Abre un panel de análisis rápido con un subconjunto de tickets cuando se hace clic sobre un KPI, una alerta o una categoría.
Facilita el paso de una métrica agregada a los casos concretos.

### `src/components/DetailDrawer.jsx`

Presenta la ficha completa de un ticket con narrativa automática, datos operativos, comentarios y señales NLP.
Es la vista más cercana al caso individual.

### `src/components/Charts.jsx`

Contiene los gráficos y visualizaciones del dashboard:

- `GeoMap` para la lectura territorial.
- `LineChart` para tendencias temporales.
- `BarList`, `StackedRows` y `Histogram` para distribuciones y rankings.
- `SignalCloud` para frases y señales textuales.
- `IsoBar3D`, `Pie3D` y `DonutRing3D` para las visualizaciones 3D del tablero.

## Diseño visual

El diseño busca ser más cercano a una pieza editorial de análisis que a una tabla administrativa tradicional.
Se apoya en:

- una paleta cálida con verdes petróleo, terracotas y neutros suaves
- tarjetas con efecto de superficie y bordes redondeados
- jerarquía tipográfica clara con títulos grandes y datos destacados
- fondo con textura y gradientes suaves para dar profundidad
- animaciones discretas para entrada de paneles y realce al pasar el mouse
- gráficos 3D agrandados y reorganizados para aprovechar mejor el espacio

Ese enfoque ayuda a que el tablero se vea más profesional sin perder claridad operativa.

## Interacción

La experiencia está pensada para que una persona pase de una visión general a un ticket específico en pocos clics:

1. Filtra por fecha, territorio, operador o prioridad.
2. Cambia de vista según el tipo de análisis.
3. Abre un KPI o una categoría para ver el drill-down.
4. Selecciona un ticket para revisar el detalle completo.
5. Exporta la tabla si necesita compartir el resultado.

## Exportación

Las tablas del frontend pueden exportarse a CSV y Excel.
Eso facilita seguir usando el flujo de trabajo tradicional cuando el equipo necesita enviar resultados, consolidar cortes o revisar información fuera del navegador.

## Qué facilita

- Lectura rápida para perfiles técnicos y no técnicos.
- Menos dependencia de revisar manualmente cientos de filas.
- Más claridad para presentar resultados en reuniones.
- Navegación directa desde KPI hasta ticket.
- Un diseño más pulido para que el dashboard también sirva como pieza de exposición ejecutiva.
