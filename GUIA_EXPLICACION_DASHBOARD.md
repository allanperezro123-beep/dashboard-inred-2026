# Guia rapida para explicar el dashboard

## 1. Que es este proyecto

Este dashboard es una aplicacion web hecha con React + Vite para analizar tickets operativos y eventos de parada. Toma un Excel como fuente principal, lo transforma en un dataset enriquecido y luego lo presenta en una interfaz visual, rapida e interactiva.

La idea central es simple: convertir una tabla pesada en una herramienta de decision. En lugar de revisar filas una por una en Excel, el usuario puede filtrar, comparar, explorar territorio, ver KPIs, revisar comentarios y abrir el detalle de cada ticket en segundos.

## 2. Explicacion en 30 segundos

Si te piden resumirlo rapido, puedes decir esto:

> Este dashboard convierte el Excel operativo en una plataforma interactiva de analisis. El frontend esta hecho en React y muestra KPIs, mapas, tablas y alertas. La capa de datos esta automatizada con Python, que lee el Excel, lo limpia, lo enriquece con geografia y analisis textual, y genera un JSON que consume la app. Asi se reduce el trabajo manual, se gana velocidad y se pueden tomar decisiones con mas contexto.

## 3. Como esta armado por dentro

### Flujo general

1. El usuario deja el Excel actualizado en la carpeta `datos/`.
2. El script `scripts/build_dashboard_data.py` lee y procesa ese archivo.
3. El script genera `public/data/dashboard-data.json`.
4. La app React carga ese JSON desde el frontend.
5. El usuario interactua con filtros, graficas, tablas y paneles de detalle.

### Idea importante para explicar

Aunque mucha gente le llama "backend", en realidad aqui no hay un servidor tradicional con base de datos y API. La parte "backend" es un pipeline de preparacion de datos en Python. Su trabajo es limpiar, enriquecer y dejar listo el dataset para que el frontend lo consuma.

## 4. Frontend

El frontend esta construido con React 19 y Vite. Es la capa visual y de interaccion del sistema.

### Que hace el frontend

- Muestra el dashboard principal.
- Permite cambiar entre cuatro vistas: General, SLA / Parada, Operacion / Mantenimiento y Texto + NLP.
- Aplica filtros globales por fecha, territorio, operador, proyecto, prioridad, estado y otros campos.
- Calcula y muestra KPIs ejecutivos.
- Presenta graficas, mapa, tablas y un panel lateral de detalle.
- Permite buscar texto y resaltar alertas narrativas.

### Componentes principales

- `src/App.jsx`: orquesta el estado general, carga de datos, filtros y vistas.
- `src/components/Charts.jsx`: graficas y visualizaciones.
- `src/components/DataTable.jsx`: tabla principal de tickets.
- `src/components/DetailDrawer.jsx`: detalle ejecutivo del ticket seleccionado.
- `src/components/DrillPanel.jsx`: exploracion por KPI o por segmento.
- `src/components/Sidebar.jsx`: filtros y navegacion por vistas.
- `src/styles/app.css`: estilo visual de toda la experiencia.

### Como describir la UI

Puedes decir que la UI no esta pensada solo para mostrar datos, sino para analizar. El usuario puede pasar de una vista ejecutiva a un detalle especifico sin salir de la misma pantalla.

## 5. Capa de datos o "backend"

La parte de datos esta en Python y funciona como un procesador ETL ligero.

### Archivo clave

- `scripts/build_dashboard_data.py`

### Que hace ese script

- Lee el Excel con `openpyxl`.
- Identifica hojas y registros.
- Limpia valores y normaliza campos.
- Calcula geografia con apoyo de `geonamescache`.
- Construye informacion territorial por departamento y municipio.
- Detecta temas y alertas textuales con reglas NLP basadas en patrones.
- Genera un JSON final listo para el frontend.

### Salidas del pipeline

- `public/data/dashboard-data.json`: archivo principal que consume React.
- `data/dashboard-data.js`: respaldo legacy.

### Por que esto importa

La app no depende de formulas manuales ni de pivotes hechos a mano en Excel. La logica de negocio queda automatizada y reproducible. Si el Excel cambia, se vuelve a generar el dataset y el dashboard se actualiza.

## 6. Funciones principales del dashboard

### Vista General

Sirve para tener una foto ejecutiva del estado operativo:

- volumen total de tickets,
- backlog,
- MTTR,
- cumplimiento de SLA,
- dias de parada,
- alertas narrativas,
- distribucion por territorio y estado.

### Vista SLA / Parada

Se enfoca en cumplimiento y criticidad operativa:

- tickets con parada,
- brechas de SLA,
- duracion de la parada,
- histogramas y tendencias,
- impacto territorial.

### Vista Operacion / Mantenimiento

Ayuda a entender la carga operativa y de mantenimiento:

- asignaciones,
- grupos de escalamiento,
- estados de mantenimiento,
- concentracion por categoria,
- ranking de responsables o equipos.

### Vista Texto + NLP

Es la parte que convierte comentarios sueltos en señales utiles:

- clasifica temas dominantes,
- detecta alertas narrativas,
- resalta tickets con problemas de contacto, energia, infraestructura o SLA,
- permite buscar por texto y encontrar patrones rapidos.

## 7. Que hace mejor que Excel

### 1. Interaccion inmediata

En Excel normalmente tienes que filtrar, ordenar, usar formulas, tablas dinamicas o buscar manualmente. Aqui todo eso ya esta preparado y a un click de distancia.

### 2. Menos error manual

Excel depende mucho de que alguien arme bien las formulas, cruce las tablas y mantenga el archivo. En el dashboard la logica se centraliza y se ejecuta siempre igual.

### 3. Mejor lectura ejecutiva

Los KPIs, mapas y graficas ayudan a entender la situacion sin leer cientos de filas. Eso es clave para reportes y reuniones.

### 4. Explorar mas rapido

Un ticket se puede revisar desde varias capas: resumen, detalle, comentario, territorio, SLA, mantenimiento y NLP. En Excel eso suele requerir varias hojas y mucho salto entre celdas.

### 5. Escala mejor

Cuando crece el volumen de tickets, Excel se vuelve mas pesado y menos amigable. Una app web mantiene una experiencia mas estable y ordenada.

### 6. Conserva contexto

El dashboard no solo dice "cuantos". Tambien ayuda a responder "donde", "por que", "desde cuando" y "que patron hay".

## 8. Mensaje de negocio para defenderlo

Si te preguntan por que vale la pena, puedes responder asi:

> Porque transforma un archivo operativo en una herramienta de analisis. Reduce tiempo de revision, mejora la trazabilidad, da una lectura visual mas clara y permite detectar problemas con mas rapidez que un Excel tradicional.

## 9. Guion corto para exponerlo

Puedes seguir este orden:

1. Primero explico que el dashboard parte de un Excel operacional.
2. Luego digo que Python prepara y enriquece los datos.
3. Despues muestro que React presenta la informacion en KPIs, mapa, tablas y alertas.
4. Aclaro que hay cuatro vistas para analizar el problema desde distintos angulos.
5. Cierro diciendo que la gran ventaja frente a Excel es la rapidez, la automatizacion y la lectura ejecutiva.

## 10. Frases utiles para defenderlo

- "No es solo una visualizacion; es una capa de analisis sobre el Excel operacional."
- "La parte de Python prepara el dataset para que el frontend no tenga que calcular todo en tiempo real."
- "Los comentarios dejan de ser texto suelto y pasan a convertirse en alertas accionables."
- "La informacion se puede leer por territorio, por SLA, por mantenimiento o por texto, segun la necesidad."

## 11. Resumen final

Este dashboard es mejor que Excel para la operacion porque automatiza la preparacion de datos, mejora la lectura visual y reduce el esfuerzo manual de analisis. Excel sigue siendo la fuente de origen, pero el dashboard es la capa que convierte esos datos en decisiones.