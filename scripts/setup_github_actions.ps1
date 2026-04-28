param(
    [string]$Repo,
    [string]$DriveFolder,
    [string]$GoogleCredsJsonPath,
    [string]$FirebaseToken,
    [switch]$RunNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-Tool {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "No se encontro la herramienta '$Name'. Instalala y vuelve a intentar."
    }
}

function Resolve-Input {
    param(
        [string]$Current,
        [string]$Prompt,
        [string]$FallbackEnv
    )

    if ($Current -and $Current.Trim()) {
        return $Current.Trim()
    }

    if ($FallbackEnv -and (Test-Path "env:$FallbackEnv")) {
        $envValue = (Get-Item "env:$FallbackEnv").Value
        if ($envValue -and $envValue.Trim()) {
            return $envValue.Trim()
        }
    }

    $answer = Read-Host $Prompt
    if (-not $answer -or -not $answer.Trim()) {
        throw "Valor requerido no informado: $Prompt"
    }
    return $answer.Trim()
}

function Ensure-GitHubAuth {
    $null = gh auth status 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "No hay sesion activa en GitHub CLI. Ejecuta: gh auth login"
    }
}

function Set-GhSecret {
    param(
        [string]$Repository,
        [string]$Name,
        [string]$Value
    )

    if (-not $Value -or -not $Value.Trim()) {
        throw "El valor para el secret '$Name' esta vacio."
    }

    $args = @('secret', 'set', $Name, '--body', $Value)
    if ($Repository) {
        $args += @('-R', $Repository)
    }

    gh @args | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear/actualizar el secret '$Name'."
    }
}

Assert-Tool -Name gh
Ensure-GitHubAuth

$DriveFolder = Resolve-Input -Current $DriveFolder -Prompt 'Folder ID o URL de Drive' -FallbackEnv 'DASHBOARD_DRIVE_FOLDER'
$FirebaseToken = Resolve-Input -Current $FirebaseToken -Prompt 'Firebase token (firebase login:ci)' -FallbackEnv 'FIREBASE_TOKEN'

$credsJsonBody = ''
if ($GoogleCredsJsonPath -and $GoogleCredsJsonPath.Trim()) {
    if (-not (Test-Path $GoogleCredsJsonPath)) {
        throw "No existe el archivo de credenciales: $GoogleCredsJsonPath"
    }
    $credsJsonBody = Get-Content -Raw -Path $GoogleCredsJsonPath
} elseif (Test-Path env:DASHBOARD_GOOGLE_CREDENTIALS_JSON) {
    $credsJsonBody = $env:DASHBOARD_GOOGLE_CREDENTIALS_JSON
} else {
    $GoogleCredsJsonPath = Read-Host 'Ruta al JSON de Service Account de Google'
    if (-not $GoogleCredsJsonPath -or -not (Test-Path $GoogleCredsJsonPath)) {
        throw 'Debes informar una ruta valida al JSON de credenciales de Google.'
    }
    $credsJsonBody = Get-Content -Raw -Path $GoogleCredsJsonPath
}

Set-GhSecret -Repository $Repo -Name 'DASHBOARD_DRIVE_FOLDER' -Value $DriveFolder
Set-GhSecret -Repository $Repo -Name 'DASHBOARD_GOOGLE_CREDENTIALS_JSON' -Value $credsJsonBody
Set-GhSecret -Repository $Repo -Name 'FIREBASE_TOKEN' -Value $FirebaseToken

Write-Host ''
Write-Host 'Secrets configurados correctamente:' -ForegroundColor Green
Write-Host '- DASHBOARD_DRIVE_FOLDER'
Write-Host '- DASHBOARD_GOOGLE_CREDENTIALS_JSON'
Write-Host '- FIREBASE_TOKEN'

if ($RunNow.IsPresent) {
    $workflowArgs = @('workflow', 'run', 'sync-drive-and-deploy.yml')
    if ($Repo) {
        $workflowArgs += @('-R', $Repo)
    }

    gh @workflowArgs | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host ''
        Write-Host 'Se disparo la ejecucion manual del workflow.' -ForegroundColor Green
    } else {
        throw 'No se pudo disparar la ejecucion manual del workflow.'
    }
}

Write-Host ''
Write-Host 'Listo. El pipeline queda funcionando con actualizacion automatica cada 30 minutos.' -ForegroundColor Cyan
