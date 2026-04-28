param(
    [Parameter(Mandatory = $true)]
    [string]$GithubRepo,

    [Parameter(Mandatory = $true)]
    [string]$GithubToken,

    [Parameter(Mandatory = $true)]
    [string]$DriveFolder,

    [Parameter(Mandatory = $true)]
    [string]$GoogleCredsJsonPath,

    [Parameter(Mandatory = $true)]
    [string]$FirebaseToken,

    [switch]$RunNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-GhCli {
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        return
    }

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'No se encontro gh y tampoco winget para instalarlo automaticamente.'
    }

    Write-Host 'Instalando GitHub CLI (gh)...' -ForegroundColor Yellow
    winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements

    $ghPath = "$env:ProgramFiles\GitHub CLI"
    if (Test-Path $ghPath) {
        $env:Path = "$env:Path;$ghPath"
    }

    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw 'GitHub CLI no quedo disponible. Reinicia terminal y vuelve a ejecutar.'
    }
}

function Get-RepoParts {
    param(
        [string]$Repo
    )
    $parts = $Repo.Split('/')
    if ($parts.Length -ne 2 -or -not $parts[0] -or -not $parts[1]) {
        throw 'GithubRepo debe venir como owner/repo.'
    }
}

function Ensure-GhAuth {
    param(
        [string]$Repository,
        [string]$Token
    )

    $null = gh auth status 2>$null
    if ($LASTEXITCODE -eq 0) {
        return
    }

    $Token | gh auth login --with-token
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo autenticar gh con el token proporcionado.'
    }

    $null = gh repo view $Repository
    if ($LASTEXITCODE -ne 0) {
        throw "No se puede acceder al repositorio $Repository con el token actual."
    }
}

function Set-GhSecret {
    param(
        [string]$Repository,
        [string]$Name,
        [string]$Value
    )

    if (-not $Value -or -not $Value.Trim()) {
        throw "El valor para $Name esta vacio."
    }

    gh secret set $Name -R $Repository --body $Value | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear/actualizar el secret $Name."
    }
}

if (-not (Test-Path $GoogleCredsJsonPath)) {
    throw "No existe el archivo de credenciales en: $GoogleCredsJsonPath"
}

$credsJson = Get-Content -Raw -Path $GoogleCredsJsonPath
Get-RepoParts -Repo $GithubRepo

Ensure-GhCli
Ensure-GhAuth -Repository $GithubRepo -Token $GithubToken

Write-Host 'Configurando secrets...' -ForegroundColor Yellow
Set-GhSecret -Repository $GithubRepo -Name 'DASHBOARD_DRIVE_FOLDER' -Value $DriveFolder
Set-GhSecret -Repository $GithubRepo -Name 'DASHBOARD_GOOGLE_CREDENTIALS_JSON' -Value $credsJson
Set-GhSecret -Repository $GithubRepo -Name 'FIREBASE_TOKEN' -Value $FirebaseToken

Write-Host 'Secrets listos en GitHub Actions.' -ForegroundColor Green

if ($RunNow.IsPresent) {
    gh workflow run sync-drive-and-deploy.yml -R $GithubRepo
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo disparar la ejecucion manual del workflow.'
    }
    Write-Host 'Workflow disparado manualmente.' -ForegroundColor Green
}

Write-Host 'Configuracion completa. Actualizacion automatica cada 30 minutos habilitada al hacer push con workflow en tu repo.' -ForegroundColor Cyan
