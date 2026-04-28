#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path


def extract_drive_folder_id(raw: str) -> str | None:
    value = (raw or '').strip()
    if not value:
        return None
    match = re.search(r"/folders/([a-zA-Z0-9_-]+)", value)
    if match:
        return match.group(1)
    if re.fullmatch(r"[a-zA-Z0-9_-]{10,}", value):
        return value
    return None


def load_credentials_info() -> dict:
    raw = os.environ.get('DASHBOARD_GOOGLE_CREDENTIALS_JSON', '').strip()
    if raw:
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise SystemExit(f'Credenciales JSON inválidas en DASHBOARD_GOOGLE_CREDENTIALS_JSON: {exc}')

    creds_file = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '').strip()
    if creds_file:
        path = Path(creds_file)
        if not path.exists():
            raise SystemExit(f'No existe GOOGLE_APPLICATION_CREDENTIALS: {path}')
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            raise SystemExit(f'Archivo de credenciales inválido ({path}): {exc}')

    raise SystemExit(
        'No hay credenciales de Google. Define DASHBOARD_GOOGLE_CREDENTIALS_JSON '
        'o GOOGLE_APPLICATION_CREDENTIALS.'
    )


def build_drive_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    info = load_credentials_info()
    credentials = service_account.Credentials.from_service_account_info(
        info,
        scopes=['https://www.googleapis.com/auth/drive.readonly'],
    )
    return build('drive', 'v3', credentials=credentials, cache_discovery=False)


def main() -> int:
    parser = argparse.ArgumentParser(description='Descarga el .xlsx más reciente de una carpeta de Google Drive.')
    parser.add_argument('--folder', required=True, help='Folder ID o URL de carpeta de Google Drive.')
    parser.add_argument('--output', required=True, help='Ruta local del archivo de salida (.xlsx).')
    args = parser.parse_args()

    folder_id = extract_drive_folder_id(args.folder)
    if not folder_id:
        raise SystemExit('Folder ID/URL inválido para --folder.')

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    service = build_drive_service()
    query = (
        f"'{folder_id}' in parents and "
        "mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and "
        "trashed=false"
    )

    response = service.files().list(
        q=query,
        orderBy='modifiedTime desc,name',
        pageSize=1,
        fields='files(id,name,modifiedTime,size)',
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()

    files = response.get('files', [])
    if not files:
        raise SystemExit('No se encontró ningún .xlsx en la carpeta de Drive indicada.')

    latest = files[0]
    request = service.files().get_media(fileId=latest['id'], supportsAllDrives=True)

    from googleapiclient.http import MediaIoBaseDownload

    with output_path.open('wb') as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

    print(f"Descargado: {latest.get('name', '(sin nombre)')} -> {output_path}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
