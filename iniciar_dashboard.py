#!/usr/bin/env python3
"""
iniciar_dashboard.py — Arranca el pipeline de datos y el servidor del dashboard.

Uso:
  python iniciar_dashboard.py                       # Excel más reciente en datos/
  python iniciar_dashboard.py datos\\mi_excel.xlsx  # archivo específico
    python iniciar_dashboard.py <folder-id-drive>    # Excel más reciente en carpeta de Drive

Opcional:
    DASHBOARD_DRIVE_FOLDER=<folder-id-o-url>         # usa Drive si no se pasa argumento
"""
from __future__ import annotations

import io
import os
import re
import subprocess
import sys
import time
import webbrowser
from datetime import datetime
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent
DATOS_DIR   = ROOT / "datos"
DRIVE_CACHE_DIR = DATOS_DIR / "_drive_cache"
BUILD_SCRIPT = ROOT / "scripts" / "build_dashboard_data.py"
DASHBOARD_URL = "http://127.0.0.1:5173"
NPM         = "npm.cmd" if sys.platform == "win32" else "npm"
# ─────────────────────────────────────────────────────────────────────────────


def _line(char: str = "─", width: int = 62) -> str:
    return char * width


def banner(title: str) -> None:
    print(f"\n{_line('═')}")
    print(f"  {title}")
    print(_line("═"))


def step(n: int, text: str) -> None:
    print(f"\n  [{n}]  {text}")
    print(f"       {'─' * (len(text) + 2)}")


def find_latest_excel() -> Path | None:
    """Devuelve el .xlsx más reciente y legible en datos/ o en la raíz."""
    candidate = []
    if DATOS_DIR.is_dir():
        candidate.extend(sorted(DATOS_DIR.glob("*.xlsx"), key=lambda p: p.stat().st_mtime, reverse=True))
    candidate.extend(sorted(ROOT.glob("*.xlsx"), key=lambda p: p.stat().st_mtime, reverse=True))

    for candidate in candidate:
        try:
            with candidate.open("rb"):
                return candidate
        except OSError:
            continue
    return None


def extract_drive_folder_id(raw: str) -> str | None:
    value = (raw or "").strip()
    if not value:
        return None
    match = re.search(r"/folders/([a-zA-Z0-9_-]+)", value)
    if match:
        return match.group(1)
    if re.fullmatch(r"[a-zA-Z0-9_-]{10,}", value):
        return value
    return None


def build_drive_service():
    try:
        import google.auth
        from googleapiclient.discovery import build
    except ImportError as exc:
        sys.exit(
            "\n  [ERROR] Faltan dependencias para leer Google Drive.\n"
            "          Ejecuta: py -3 -m pip install -r requirements.txt\n"
            f"          Detalle: {exc}\n"
        )

    try:
        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/drive.readonly"])
    except Exception as exc:
        sys.exit(
            "\n  [ERROR] No se pudieron cargar credenciales de Google.\n"
            "          Configura la autenticación y vuelve a intentar.\n"
            f"          Detalle: {exc}\n"
        )

    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def parse_google_modified_time(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


def cleanup_drive_cache(keep: Path) -> None:
    if not DRIVE_CACHE_DIR.exists():
        return
    for candidate in DRIVE_CACHE_DIR.glob("*.xlsx"):
        if candidate == keep:
            continue
        try:
            candidate.unlink()
        except OSError:
            continue


def download_latest_drive_excel(folder_id: str) -> Path:
    service = build_drive_service()
    query = (
        f"'{folder_id}' in parents and "
        "mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and "
        "trashed=false"
    )
    response = service.files().list(
        q=query,
        orderBy="modifiedTime desc,name",
        pageSize=1,
        fields="files(id,name,modifiedTime,size)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()
    files = response.get("files", [])
    if not files:
        sys.exit(
            "\n  [ERROR] No se encontró ningún .xlsx en la carpeta de Drive indicada.\n"
            "          Revisa el folder ID o la URL y confirma que haya al menos un Excel.\n"
        )

    latest = files[0]
    safe_name = Path(latest["name"]).name or f"drive-{latest['id']}.xlsx"
    DRIVE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    destination = DRIVE_CACHE_DIR / safe_name

    request = service.files().get_media(fileId=latest["id"], supportsAllDrives=True)
    with destination.open("wb") as output:
        from googleapiclient.http import MediaIoBaseDownload

        downloader = MediaIoBaseDownload(output, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

    modified_at = parse_google_modified_time(latest.get("modifiedTime"))
    if modified_at is not None:
        os.utime(destination, (modified_at, modified_at))

    cleanup_drive_cache(destination)
    return destination


def resolve_excel() -> Path:
    if len(sys.argv) > 1:
        raw_arg = sys.argv[1].strip()
        drive_folder_id = extract_drive_folder_id(raw_arg)
        if drive_folder_id:
            return download_latest_drive_excel(drive_folder_id)

        path = Path(raw_arg).expanduser().resolve()
        if not path.exists():
            sys.exit(f"\n  [ERROR] Archivo no encontrado: {path}\n")
        return path

    drive_folder_id = extract_drive_folder_id(os.environ.get("DASHBOARD_DRIVE_FOLDER", ""))
    if drive_folder_id:
        return download_latest_drive_excel(drive_folder_id)

    latest = find_latest_excel()
    if latest is None:
        sys.exit(
            "\n  [ERROR] No hay archivos .xlsx en la carpeta datos/\n"
            "          Copia tu Excel actualizado ahí y vuelve a ejecutar.\n"
        )
    return latest


def build_data(excel: Path) -> None:
    """Ejecuta el pipeline Python que convierte el Excel en JSON."""
    result = subprocess.run(
        [sys.executable, str(BUILD_SCRIPT), str(excel)],
        cwd=ROOT,
    )
    if result.returncode != 0:
        sys.exit(
            "\n  [ERROR] El pipeline de datos falló.\n"
            "          Revisa los mensajes de arriba para más detalles.\n"
        )


def start_server() -> subprocess.Popen:
    """Lanza 'npm run dev' y espera hasta que Vite esté listo."""
    server = subprocess.Popen(
        [NPM, "run", "dev"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )

    # Imprime la salida de Vite hasta detectar que está listo
    stdout = server.stdout
    assert stdout is not None
    for line in stdout:
        print("  ", line, end="")
        if "127.0.0.1" in line or "localhost" in line or "Local" in line:
            break  # Vite imprimió la URL → está listo

    return server


def main() -> None:
    banner("Dashboard INRED — Iniciador rápido")

    # ── Paso 1: detectar Excel ────────────────────────────────────────────────
    excel = resolve_excel()
    step(1, "Excel detectado")
    print(f"       Archivo : {excel.name}")
    print(f"       Tamaño  : {excel.stat().st_size / 1024:.1f} KB")
    mod = time.strftime("%Y-%m-%d %H:%M", time.localtime(excel.stat().st_mtime))
    print(f"       Modificado : {mod}")
    if DRIVE_CACHE_DIR in excel.parents:
        print("       Origen : Google Drive (último .xlsx descargado a caché local)")

    # ── Paso 2: procesar datos ────────────────────────────────────────────────
    step(2, "Procesando datos…")
    build_data(excel)

    # ── Paso 3: iniciar servidor ──────────────────────────────────────────────
    step(3, "Iniciando servidor de desarrollo…")
    server = start_server()

    # Pequeña pausa para que el proceso termine de arrancar
    time.sleep(0.6)
    webbrowser.open(DASHBOARD_URL)

    print(f"\n  El dashboard está disponible en: {DASHBOARD_URL}")
    print(  "  El navegador debería abrirse automáticamente.\n")
    print(_line())
    print("  Presiona Ctrl+C para detener el servidor.")
    print(_line())

    # ── Mantener vivo, pasar stdout al usuario ────────────────────────────────
    try:
        stdout = server.stdout
        assert stdout is not None
        for line in stdout:
            print("  ", line, end="")
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n\n{_line()}")
        print("  Deteniendo servidor…")
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
        print("  Servidor detenido. ¡Hasta luego!\n")


if __name__ == "__main__":
    main()
