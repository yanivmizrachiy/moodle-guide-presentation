<#
    הגדרה חד-פעמית של דוח הכניסות למדריך.

    הרצה: לחיצה כפולה על "הגדרה-ראשונית.cmd".
          (קובץ ps1 אינו רץ בלחיצה כפולה בווינדוס - הוא נפתח לעריכה.)

    מה הסקריפט עושה, לפי הסדר:
      1. אם כבר יש מחרוזת שמורה - בודק אותה. עובדת? ממשיך ישר לדוח.
      2. לוקח את מחרוזת החיבור מלוח ההעתקה. אין צורך להדביק לשום מקום.
      3. בודק אותה מול המסד לפני ששומר.
      4. שומר ל-.env.local רק אחרי שהבדיקה עברה, ומריץ את הדוח.

    למה "בודק לפני ששומר":
    הגרסה הקודמת שמרה קודם וגילתה אחר כך. כך נשמרה מחרוזת של התפקיד
    analytics_ingest - תפקיד שקיים רק כדי שהדפדפן של המורים יכתוב אירוע,
    ואין לו הרשאת קריאה בכלל. נשאר קובץ שבור בלי דרך ברורה חזרה.
#>

[CmdletBinding()]
param(
    # דילוג על שאלת „שלא נספור את עצמך" בסוף.
    [switch]$SkipOptOut,

    # ריצה ללא שום שאלה ובלי „הקש Enter לסגירה". נועד להרצה אוטומטית
    # שאין מולה אדם - למשל כשהכל כבר בלוח ההעתקה. לחיצה כפולה על
    # הגדרה-ראשונית.cmd אינה משתמשת בזה ונשארת אינטראקטיבית.
    [switch]$NoPrompt
)

if ($NoPrompt) { $SkipOptOut = $true }

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$EnvFile = Join-Path $ProjectRoot '.env.local'
$KeyName = 'ANALYTICS_DATABASE_URL'
$LiveSite = 'https://yanivmizrachiy.github.io/moodle-guide-presentation/'

function Write-Step { param([string]$Text) Write-Host ''; Write-Host ">> $Text" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "   $Text" -ForegroundColor Green }
function Write-Bad  { param([string]$Text) Write-Host "   $Text" -ForegroundColor Red }
function Write-Dim  { param([string]$Text) Write-Host "   $Text" -ForegroundColor Gray }
function Close-Now  {
    if ($NoPrompt) { return }
    Write-Host ''
    Read-Host 'הקש Enter לסגירה' | Out-Null
}

# בודק מחרוזת מול המסד. אינו מדפיס אותה לעולם - רק את התוצאה.
function Test-Credential {
    param([string]$Value)
    $env:ANALYTICS_DATABASE_URL = $Value
    try {
        $output = & node (Join-Path $ProjectRoot 'scripts/check-credential.mjs') 2>&1
        $ok = ($LASTEXITCODE -eq 0)
    }
    finally {
        $env:ANALYTICS_DATABASE_URL = $null
    }
    return [pscustomobject]@{ Ok = $ok; Output = ($output | Out-String).Trim() }
}

function Save-Credential {
    param([string]$Value)
    $lines = @()
    if (Test-Path $EnvFile) {
        $lines = @(Get-Content $EnvFile | Where-Object { $_ -notlike "$KeyName=*" })
    }
    $lines += "$KeyName=$Value"
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllLines($EnvFile, $lines, $utf8NoBom)
}

Write-Host ''
Write-Host '==============================================' -ForegroundColor Yellow
Write-Host '   הגדרת דוח הכניסות למדריך Moodle' -ForegroundColor Yellow
Write-Host '==============================================' -ForegroundColor Yellow

# ---------- 1. דרישות מוקדמות ----------
Write-Step 'בודק ש-Node מותקן'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Bad 'Node.js לא נמצא. יש להתקין מ-https://nodejs.org ואז להריץ שוב.'
    Close-Now
    exit 1
}
Write-Ok 'נמצא.'

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Step 'מתקין את תלויות הפרויקט (פעם אחת, עשוי לקחת דקה)'
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Bad 'ההתקנה נכשלה.'
        Close-Now
        exit 1
    }
    Write-Ok 'הותקן.'
}

# ---------- 2. מחרוזת קיימת? ----------
$needCredential = $true

if (Test-Path $EnvFile) {
    Write-Step 'נמצאה מחרוזת שמורה - בודק אותה'
    $existing = $null
    foreach ($line in Get-Content $EnvFile) {
        if ($line -like "$KeyName=*") { $existing = $line.Substring($KeyName.Length + 1).Trim() }
    }
    if ($existing) {
        $check = Test-Credential -Value $existing
        if ($check.Ok) {
            Write-Ok 'המחרוזת השמורה עובדת.'
            Write-Dim $check.Output
            $needCredential = $false
        }
        else {
            Write-Bad 'המחרוזת השמורה אינה עובדת יותר. מחליף אותה.'
            Write-Dim $check.Output
        }
    }
}

# ---------- 3. לקיחה מלוח ההעתקה ----------
if ($needCredential) {
    Write-Step 'לוקח את מחרוזת החיבור מלוח ההעתקה'

    $clip = ''
    try { $clip = (Get-Clipboard -Raw) } catch { $clip = '' }
    if ($null -eq $clip) { $clip = '' }
    $clip = $clip.Trim()

    if (-not $clip) {
        Write-Bad 'לוח ההעתקה ריק.'
        Write-Host ''
        Write-Dim 'מה לעשות:'
        Write-Dim '  1. console.neon.tech  ->  הפרויקט moodle-guide-analytics  ->  Connect'
        Write-Dim '  2. בשדה Role בחר neondb_owner   (לא analytics_ingest!)'
        Write-Dim '  3. לחץ Copy snippet'
        Write-Dim '  4. הרץ את הקובץ הזה שוב. אין צורך להדביק לשום מקום.'
        Close-Now
        exit 1
    }

    Write-Ok 'נמצאה מחרוזת בלוח. בודק אותה מול המסד לפני ששומר.'
    $check = Test-Credential -Value $clip

    if (-not $check.Ok) {
        Write-Host ''
        Write-Bad 'המחרוזת שבלוח אינה מתאימה. היא לא נשמרה.'
        Write-Host ''
        foreach ($line in ($check.Output -split "`n")) { Write-Dim $line.Trim() }
        Write-Host ''
        Write-Dim 'תקן ב-Neon, לחץ Copy snippet שוב, והרץ את הקובץ הזה מחדש.'
        Close-Now
        exit 1
    }

    Write-Ok 'הבדיקה עברה.'
    Write-Dim $check.Output
    Save-Credential -Value $clip
    Write-Ok 'נשמר ב-.env.local. הקובץ חסום בגיט ולא ייעלה לעולם.'
}

# ---------- 4. הדוח ----------
Write-Step 'מריץ את הדוח'
Write-Host ''
npm run --silent analytics
if ($LASTEXITCODE -ne 0) {
    Write-Bad 'הדוח נכשל. הסיבה מודפסת למעלה.'
    Close-Now
    exit 1
}

# ---------- 5. לא לספור את עצמך ----------
if (-not $SkipOptOut) {
    Write-Step 'שלא נספור את הביקורים שלך'
    Write-Dim 'בכל מכשיר שממנו אתה נכנס לאתר כדי לבדוק אותו, כדאי לסמן פעם אחת'
    Write-Dim 'שלא יימדד. אחרת הכניסות שלך מנפחות את המספר.'
    $optOut = Read-Host '   לפתוח עכשיו את האתר ולסמן את המחשב הזה? (כ/ל)'
    if ($optOut -in @('כ', 'y', 'Y')) {
        Start-Process "$LiveSite`?analytics=off"
        Write-Ok 'נפתח. אחרי שהדף נטען אפשר לסגור אותו - הסימון נשמר בדפדפן.'
        Write-Dim 'בטלפון: פתח שם את אותה כתובת עם ?analytics=off בסופה.'
    }
    else {
        Write-Dim "לדילוג. הכתובת לסימון ידני:  $LiveSite`?analytics=off"
    }
}

Write-Host ''
Write-Host '==============================================' -ForegroundColor Yellow
Write-Host '   מוכן.' -ForegroundColor Green
Write-Host '   מהיום, כדי לראות כמה נכנסו וכמה זמן היו:' -ForegroundColor Green
Write-Host '   לחיצה כפולה על  כמה-נכנסו.cmd' -ForegroundColor Green
Write-Host '==============================================' -ForegroundColor Yellow
Close-Now
