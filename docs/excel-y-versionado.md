# Excel fuente y versionado

## Qué papel cumple el Excel

Antes del dashboard, el seguimiento de tickets se hacía directamente en Excel.
Ese archivo contenía la información operativa, los estados, las fechas, los comentarios y los campos necesarios para controlar el avance de cada caso.

El dashboard no elimina esa lógica; la ordena y la presenta de otra forma.
Por eso el Excel sigue siendo importante: es la fuente de entrada que alimenta el análisis.

## Cómo usar la carpeta `datos/`

La carpeta `datos/` está pensada para guardar los Excel que se van actualizando con el tiempo.
Puedes dejar varios archivos allí para conservar historial.
El iniciador toma el `.xlsx` más reciente por fecha de modificación, así que el flujo diario es simple:

1. Guardas el Excel nuevo en `datos/`.
2. Ejecutas `python iniciar_dashboard.py`.
3. El dashboard usa automáticamente ese archivo.

Si quieres forzar un archivo concreto, también puedes pasarlo por parámetro.

## Recomendación de nombres

Conviene nombrar los archivos con fecha para que el historial sea fácil de seguir:

- `tickets_2026-04-20.xlsx`
- `tickets_2026-04-27.xlsx`
- `tickets_2026-05-03.xlsx`

Eso permite mantener copias anteriores como respaldo y facilita comparar cortes entre periodos.

## Estructura esperada del libro

El parser actual lee el libro en un orden concreto:

- La primera hoja se usa como base de tickets.
- La segunda hoja se usa como eventos de parada.

Por eso, si cambia la estructura del Excel, también puede requerir ajustes en el script de preparación de datos.

Además, los nombres de las columnas importan, porque el pipeline trabaja por encabezados para construir los campos analíticos.

## Qué facilita

- Mantener el proceso de trabajo que el equipo ya conocía.
- Evitar que el Excel se convierta en una fuente caótica de versiones sueltas.
- Conservar respaldo histórico sin perder el archivo vigente.
- Separar el archivo de operación del archivo ya procesado para el dashboard.
- Reducir errores por usar copias viejas o fórmulas manuales desactualizadas.
