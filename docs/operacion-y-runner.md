# Operación diaria y runner

## Qué resuelve

`iniciar_dashboard.py` existe para que el dashboard se pueda arrancar sin recordar varios pasos manuales.
Hace el trabajo que normalmente haría una persona cada día:

1. busca el Excel más reciente
2. regenera el dataset analítico
3. levanta el servidor de desarrollo
4. abre el navegador con el dashboard

## Uso recomendado

Deja el Excel actualizado dentro de `datos/` y ejecuta:

```powershell
python iniciar_dashboard.py
```

Si quieres usar un archivo concreto:

```powershell
python iniciar_dashboard.py datos\tickets_2026-04-20.xlsx
```

## Qué hace el runner

El script:

- detecta el `.xlsx` más reciente en `datos/`
- llama al pipeline `scripts/build_dashboard_data.py`
- arranca `npm run dev`
- abre automáticamente `http://127.0.0.1:5173`
- mantiene la consola activa mientras el servidor está vivo

## Dependencias necesarias

Antes de usar el runner, conviene tener instalado lo básico del proyecto:

```powershell
npm install
py -3 -m pip install -r requirements.txt
```

## Flujo de trabajo diario

Este es el ciclo pensado para operación normal:

1. Recibes o actualizas el Excel de seguimiento.
2. Lo guardas en `datos/`.
3. Ejecutas el runner.
4. Revisa el dashboard en el navegador.
5. Si todo está bien, puedes exportar tablas o capturar hallazgos.

## Detener la ejecución

Para cerrar el servidor basta con `Ctrl+C` en la consola.

## Qué facilita

- Un único comando para usuarios no técnicos.
- Menos errores al regenerar datos o iniciar la app.
- Menos tiempo entre actualizar el Excel y ver el resultado.
- Un proceso repetible para cada nuevo corte.
- Una forma sencilla de dejar historial de archivos sin romper el flujo diario.
