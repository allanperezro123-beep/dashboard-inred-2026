<#
.SYNOPSIS
    Activacion cloud del Dashboard INRED.
    Crea el repo en GitHub, sube el codigo, configura secrets y
    dispara la primera actualizacion automatica desde Drive.

.DESCRIPTION
    Ejecutar una sola vez desde la raiz del proyecto.
    Despues de esto solo suban Excels a la carpeta de Drive compartida.

.PARAMETER GithubToken
    Personal Access Token de GitHub con permisos: repo, workflow, admin:repo_hook.
    Crealo en https://github.com/settings/tokens/new

.PARAMETER DriveFolder
    URL o ID de la carpeta compartida de Google Drive donde el equipo dejara los Excels.

.PARAMETER GoogleCredsJsonPath
    Ruta al archivo JSON de Service Account de Google con acceso de lectura a Drive.
    Si no tengo uno, ver: https://console.cloud.google.com/iam-admin/serviceaccounts

.PARAMETER FirebaseToken
    Token de Firebase CI. Obtenlo con: firebase login:ci

.PARAMETER RepoName
    Nombre del repositorio a crear en GitHub. Por defecto: dashboard-inred-2026

.PARAMETER Private
    Si se especifica, el repo se crea privado.

.EXAMPLE
    .\ACTIVAR_CLOUD.ps1 `
        -GithubToken "ghp_xxx" `
        -DriveFolder "https://drive.google.com/drive/folders/ABC123" `
        -GoogleCredsJsonPath "C:\Users\LENOVO\Downloads\service-account.json" `
        -FirebaseToken "1//xxx" `
        -Private
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$GithubToken,

    [Parameter(Mandatory = $true)]
    [string]$DriveFolder,

    [Parameter(Mandatory = $true)]
    [string]$GoogleCredsJsonPath,

    [Parameter(Mandatory = $true)]
    [string]$FirebaseToken,

    [string]$RepoName = 'dashboard-inred-2026',

    [switch]$Private
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Write-Step {
    param([string]$Text)
    Write-Host ""
    Write-Host ">>> $Text" -ForegroundColor Cyan
}

function Ensure-GhCli {
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Host "  gh ya esta instalado." -ForegroundColor DarkGray
        return
    }
    Write-Step "Instalando GitHub CLI..."
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements
        $ghPath = "$env:ProgramFiles\GitHub CLI"
        if (Test-Path $ghPath) { $env:Path += ";$ghPath" }
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install gh -y
    } else {
        Write-Host "  Descarga gh desde https://cli.github.com/ e instala manualmente." -ForegroundColor Red
        throw "GitHub CLI no encontrado y no hay instalador automatico disponible."
    }
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "gh no quedo en PATH. Reinicia PowerShell y vuelve a ejecutar este script."
    }
}

function Ensure-GitAuth {
    Write-Step "Autenticando en GitHub CLI..."
    $GithubToken | gh auth login --with-token
    if ($LASTEXITCODE -ne 0) { throw "No se pudo autenticar con el token provisto." }
    gh auth status
}

function Get-GhUser {
    $user = gh api user --jq '.login' 2>$null
    if (-not $user) { throw "No se pudo obtener el usuario de GitHub." }
    return $user.Trim()
}

function Ensure-Repo {
    param([string]$User, [string]$Name)
    Write-Step "Creando o verificando repositorio $User/$Name..."
    $exists = gh repo view "$User/$Name" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  El repo ya existe, se usara el existente." -ForegroundColor DarkGray
    } else {
        $visibility = if ($Private.IsPresent) { '--private' } else { '--public' }
        gh repo create $Name $visibility --description "Dashboard operativo INRED - actualizacion automatica desde Drive" --confirm 2>$null
        if ($LASTEXITCODE -ne 0) {
            gh repo create $Name $visibility --description "Dashboard operativo INRED - actualizacion automatica desde Drive"
        }
        if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el repo $Name." }
        Write-Host "  Repo creado: https://github.com/$User/$Name" -ForegroundColor Green
    }
    return "$User/$Name"
}

function Push-Code {
    param([string]$FullRepo)
    Write-Step "Subiendo codigo al repositorio..."

    $remote = git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $remote) {
        git remote add origin "https://github.com/$FullRepo.git"
    } else {
        git remote set-url origin "https://github.com/$FullRepo.git"
    }

    git add -A
    $staged = git diff --cached --name-only
    if ($staged) {
        git commit -m "chore: initial dashboard release with Drive automation"
    } else {
        Write-Host "  Sin cambios nuevos que commitear." -ForegroundColor DarkGray
    }

    git branch -M main
    git push -u origin main --force-with-lease 2>$null
    if ($LASTEXITCODE -ne 0) {
        git push -u origin main --force
    }
    if ($LASTEXITCODE -ne 0) { throw "No se pudo pushear al repositorio." }
    Write-Host "  Codigo subido a https://github.com/$FullRepo" -ForegroundColor Green
}

function Set-Secrets {
    param([string]$FullRepo, [string]$CredsJson)
    Write-Step "Configurando secrets en GitHub Actions..."

    gh secret set DASHBOARD_DRIVE_FOLDER --body $DriveFolder -R $FullRepo
    if ($LASTEXITCODE -ne 0) { throw "Error creando secret DASHBOARD_DRIVE_FOLDER." }

    gh secret set DASHBOARD_GOOGLE_CREDENTIALS_JSON --body $CredsJson -R $FullRepo
    if ($LASTEXITCODE -ne 0) { throw "Error creando secret DASHBOARD_GOOGLE_CREDENTIALS_JSON." }

    gh secret set FIREBASE_TOKEN --body $FirebaseToken -R $FullRepo
    if ($LASTEXITCODE -ne 0) { throw "Error creando secret FIREBASE_TOKEN." }

    Write-Host "  3 secrets configurados correctamente." -ForegroundColor Green
}

function Start-Workflow {
    param([string]$FullRepo)
    Write-Step "Disparando primera ejecucion del workflow..."
    gh workflow run sync-drive-and-deploy.yml -R $FullRepo
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  No se pudo disparar manualmente (normal si el workflow aun no fue detectado por GitHub). Se ejecutara automaticamente en menos de 30 min." -ForegroundColor Yellow
    } else {
        Write-Host "  Workflow disparado. Revisa en: https://github.com/$FullRepo/actions" -ForegroundColor Green
    }
}

# ─── MAIN ────────────────────────────────────────────────────────────────────

if (-not (Test-Path $GoogleCredsJsonPath)) {
    throw "No se encontro el archivo de credenciales: $GoogleCredsJsonPath"
}
$credsJson = Get-Content -Raw -Path $GoogleCredsJsonPath

Ensure-GhCli
Ensure-GitAuth

$ghUser  = Get-GhUser
$fullRepo = Ensure-Repo -User $ghUser -Name $RepoName
Push-Code -FullRepo $fullRepo
Set-Secrets -FullRepo $fullRepo -CredsJson $credsJson
Start-Workflow -FullRepo $fullRepo

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  TODO LISTO." -ForegroundColor Green
Write-Host ""
Write-Host "  Repo:      https://github.com/$fullRepo"
Write-Host "  Actions:   https://github.com/$fullRepo/actions"
Write-Host "  Dashboard: https://dashboard-tickets-operaciones.web.app"
Write-Host ""
Write-Host "  De ahora en adelante: solo suban Excels a la carpeta"
Write-Host "  de Drive y el dashboard se actualiza solo cada 30 min."
Write-Host "============================================================" -ForegroundColor Green
