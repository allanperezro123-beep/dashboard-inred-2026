# Documentación del dashboard

Este directorio agrupa la explicación de la infraestructura, el flujo de datos y el diseño del dashboard.

La idea es que cualquier persona pueda entender de dónde sale la información, cómo se procesa y qué resuelve frente al Excel operativo que se usaba antes para llevar el seguimiento de tickets.

## Lectura recomendada

1. [Arquitectura general](arquitectura-general.md)
2. [Excel fuente y versionado](excel-y-versionado.md)
3. [Pipeline de datos Python](pipeline-datos-python.md)
4. [Frontend React, componentes y diseño](frontend-interaccion-y-diseno.md)
5. [Operación diaria y runner](operacion-y-runner.md)
6. [Exportación y reportes](exportacion-y-reportes.md)
7. [Índice de componentes](indice-de-componentes.md)

## Flujo resumido

```mermaid
flowchart LR
    A[Excel operativo] --> B[datos/]
    B --> C[iniciar_dashboard.py]
    C --> D[scripts/build_dashboard_data.py]
    D --> E[public/data/dashboard-data.json]
    E --> F[React + Vite]
    F --> G[Dashboard]
```

## Idea central

El dashboard no reemplaza el Excel de inmediato; lo toma como entrada, lo convierte en un dataset analítico y lo presenta en una interfaz visual para seguimiento, lectura ejecutiva y exportación.
