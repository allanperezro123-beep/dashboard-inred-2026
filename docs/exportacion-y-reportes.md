# Exportación y reportes

## Qué hace

El dashboard no solo permite analizar tickets en pantalla; también puede sacar esa información hacia archivos que el equipo ya sabe usar.

La exportación está pensada para que una vista filtrada del tablero se pueda llevar a CSV o Excel sin rehacer el trabajo manualmente.

## Cómo funciona

Desde cada tabla visible en el frontend se puede exportar el conjunto actual de filas.
Eso significa que la exportación respeta los filtros y el contexto de la vista que el usuario está viendo en ese momento.

## Formatos

- CSV: útil para intercambio rápido y sistemas externos.
- Excel: útil para lectura ejecutiva, archivo histórico y seguimiento operativo.

## Diseño del Excel exportado

El archivo Excel generado no es una copia plana de la tabla.
Se organiza con varias hojas para separar la información por nivel de lectura:

- `Informe`
- `Datos completos`
- `Seguimiento de Casos`
- `Glosario de columnas`

Además, el libro usa colores de pestaña y encabezados con formato para que se vea más profesional y sea más fácil de navegar.

## Qué facilita

- Compartir resultados con personas que siguen trabajando en Excel.
- Crear cortes de seguimiento sin rehacer el archivo a mano.
- Mantener una versión exportable del análisis visual.
- Dar un puente entre el tablero moderno y el flujo operativo tradicional.
