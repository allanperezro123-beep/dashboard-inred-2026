# Índice de componentes

Este archivo sirve como mapa rápido de la base de código.

## Frontend

- `src/App.jsx`: orquestación principal de la interfaz.
- `src/main.jsx`: punto de entrada de React.
- `src/components/Sidebar.jsx`: navegación y filtros.
- `src/components/DataTable.jsx`: tablas con exportación.
- `src/components/DrillPanel.jsx`: drill-down rápido desde KPIs.
- `src/components/DetailDrawer.jsx`: ficha detallada de un ticket.
- `src/components/Charts.jsx`: visualizaciones y gráficos.

## Datos y lógica

- `scripts/build_dashboard_data.py`: convierte el Excel en dataset analítico.
- `src/lib/analytics.js`: cálculos, filtros, formatos y agregaciones.
- `src/lib/exporters.js`: exportaciones CSV y Excel.

## Estilos

- `src/styles/app.css`: estilos base del panel principal.
- `src/styles/index.css`: sistema visual global del dashboard.

## Operación

- `iniciar_dashboard.py`: arranque rápido del dashboard.
- `datos/`: carpeta de trabajo para los Excel actualizados.
- `public/data/dashboard-data.json`: dataset consumido por la app.
