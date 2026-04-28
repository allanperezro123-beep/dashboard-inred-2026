# Arquitectura general

## Qué es

El dashboard es una capa analítica sobre el Excel operativo que antes se usaba manualmente para el seguimiento de tickets.
En lugar de seguir calculando KPIs y revisando estados dentro de una hoja de cálculo aislada, el proceso ahora convierte ese Excel en un modelo de datos que se puede filtrar, explorar y presentar de forma visual.

La aplicación está pensada como un tablero de análisis, no como un sistema transaccional.
Eso significa que el Excel sigue siendo la fuente de entrada, pero la lectura diaria ocurre en el dashboard.

## Capas principales

| Capa | Archivo o carpeta | Función | Qué facilita |
| --- | --- | --- | --- |
| Fuente operativa | `datos/` | Guarda el Excel actualizado que antes se usaba para control manual | Mantener el proceso conocido sin perder el historial |
| Iniciador | `iniciar_dashboard.py` | Detecta el Excel más reciente, regenera el dataset y arranca la app | Un solo comando para empezar a trabajar |
| Preparación de datos | `scripts/build_dashboard_data.py` | Limpia, normaliza y enriquece la información del Excel | Métricas coherentes y comparables |
| Dataset analítico | `public/data/dashboard-data.json` | Archivo que consume el frontend | Carga rápida en el navegador |
| Frontend | `src/App.jsx` y `src/components/` | Renderiza vistas, filtros, tablas, mapas y paneles de detalle | Exploración interactiva por ticket, territorio o tema |
| Exportación | `src/lib/exporters.js` | Genera CSV y Excel desde tablas visibles | Compartir hallazgos con quien sigue trabajando en Excel |

## Flujo de trabajo

1. Se deja el Excel actualizado en `datos/`.
2. `iniciar_dashboard.py` toma el archivo más reciente o uno específico si se le pasa por argumento.
3. `scripts/build_dashboard_data.py` procesa el libro, normaliza campos y genera el dataset analítico.
4. El frontend carga `public/data/dashboard-data.json` desde el navegador.
5. El usuario filtra, explora, abre detalles y exporta información.

## Vistas funcionales

El dashboard se organiza en cuatro vistas internas:

- General: visión ejecutiva con volumen, distribución territorial y principales temas.
- SLA / Parada: foco en cumplimiento, tiempo de parada y brechas.
- Operación / Mantenimiento: seguimiento de responsables, grupos de escalamiento y estado operativo.
- Texto + NLP: lectura de comentarios, señales narrativas y temas detectados.

## Qué resuelve

- Evita hacer cálculo manual de métricas cada vez que se revisa el Excel.
- Reduce la dependencia de fórmulas dispersas o hojas separadas.
- Permite pasar de una lectura fila por fila a una lectura guiada por indicadores.
- Conserva el Excel como base de trabajo para que la transición sea natural.
- Mejora la trazabilidad porque cada ticket puede abrirse desde un KPI, una tabla o un panel de detalle.
