<#
    הגדרה חד-פעמית של דוח הכניסות למדריך.

    מה הסקריפט עושה:
      1. מוודא ש-npm מותקן ושהתלויות של הפרויקט קיימות.
      2. מבקש ממך את מחרוזת החיבור של Neon — ההקלדה מוסתרת ואינה נשמרת
         בהיסטוריית הפקודות — וכותב אותה ל-.env.local שגיט מתעלם ממנו.
      3. בודק את החיבור מול המסד ומריץ את הדוח.
      4. מציע לפתוח את האתר החי עם ?analytics=off, כדי שהביקורים שלך
         עצמך לא ייספרו.

    הרצה: לחיצה ימנית על הקובץ -> "Run with PowerShell"
          או:  pwsh -ExecutionPolicy Bypass -File ".\הגדרת-דוח-כניסות.ps1"
#>

[CmdletBinding()]
param(
    # דילוג על שלב הסיסמה — שימושי כשרק רוצים להריץ את הדוח מחדש.
    [switch]$SkipSetup
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$EnvFile = Join-Path $ProjectRoot '.env.local'
$KeyName = 'ANALYTICS_DATABASE_URL'
$LiveSite = 'https://yanivmizrachiy.github.io/moodle-guide-presentation/'

function Write-Step { param([string]$Text) Write-Host "`n>> $Text" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "   $Text" -ForegroundColor Green }
function Write-Bad  { param([string]$Text) Write-Host "   $Text" -ForegroundColor Red }

Write-Host ''
Write-Host '==============================================' -ForegroundColor Yellow
Write-Host '   הגדרת דוח הכניסות למדריך Moodle' -ForegroundColor Yellow
Write-Host '==============================================' -ForegroundColor Yellow

# ---------- 1. דרישות מוקדמות ----------
Write-Step 'בודק ש-npm מותקן'
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Bad 'npm לא נמצא. יש להתקין Node.js מ-https://nodejs.org ואז להריץ שוב.'
    Read-Host "`nהקש Enter לסגירה" | Out-Null
    exit 1
}
Write-Ok 'npm נמצא.'

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Step 'מתקין את תלויות הפרויקט (פעם אחת, עשוי לקחת דקה)'
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Bad 'ההתקנה נכשלה.'
        Read-Host "`nהקש Enter לסגירה" | Out-Null
        exit 1
    }
    Write-Ok 'הותקן.'
}

# ---------- 2. מחרוזת החיבור ----------
$alreadyConfigured = (Test-Path $EnvFile) -and ((Get-Content $EnvFile -Raw) -match [regex]::Escape($KeyName))

if ($SkipSetup -and $alreadyConfigured) {
    Write-Step 'מדלג על ההגדרה — מחרוזת חיבור כבר קיימת'
}
else {
    if ($alreadyConfigured) {
        Write-Step 'כבר קיימת מחרוזת חיבור שמורה'
        $replace = Read-Host '   להחליף אותה? (כ/ל)'
        if ($replace -notin @('כ', 'y', 'Y')) {
            Write-Ok 'משאיר את הקיימת.'
            $alreadyConfigured = $true
        }
        else { $alreadyConfigured = $false }
    }

    if (-not $alreadyConfigured) {
        Write-Step 'מחרוזת החיבור של Neon'
        Write-Host '   איפה משיגים אותה:' -ForegroundColor Gray
        Write-Host '     console.neon.tech  ->  הפרויקט של המדריך  ->  Connect  ->  העתק' -ForegroundColor Gray
        Write-Host '   היא נראית כך:  postgresql://user:password@host/neondb?sslmode=require' -ForegroundColor Gray
        Write-Host '   ההקלדה מוסתרת. הדבק (Ctrl+V) והקש Enter.' -ForegroundColor Gray
        Write-Host ''

        $secure = Read-Host '   מחרוזת החיבור' -AsSecureString
        $plain = [System.Net.NetworkCredential]::new('', $secure).Password

        if ([string]::IsNullOrWhiteSpace($plain)) {
            Write-Bad 'לא הוזנה מחרוזת. יציאה.'
            Read-Host "`nהקש Enter לסגירה" | Out-Null
            exit 1
        }
        if ($plain -notmatch '^postgres(ql)?://') {
            Write-Bad 'המחרוזת אינה מתחילה ב-postgresql:// — כנראה הועתק הדבר הלא נכון.'
            Read-Host "`nהקש Enter לסגירה" | Out-Null
            exit 1
        }

        # שמירת שורות אחרות שכבר קיימות בקובץ, והחלפת המפתח שלנו בלבד.
        $lines = @()
        if (Test-Path $EnvFile) {
            $lines = Get-Content $EnvFile | Where-Object { $_ -notmatch "^\s*$KeyName\s*=" }
        }
        $lines += "$KeyName=$plain"

        $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
        [System.IO.File]::WriteAllLines($EnvFile, $lines, $utf8NoBom)

        $plain = $null
        [System.GC]::Collect()

        Write-Ok "נשמר ב-.env.local. הקובץ הזה חסום בגיט ולא ייעלה לעולם."
    }
}

# ---------- 3. הרצת הדוח ----------
Write-Step 'מריץ את הדוח'
Write-Host ''
npm run --silent analytics
$reportOk = ($LASTEXITCODE -eq 0)

if (-not $reportOk) {
    Write-Host ''
    Write-Bad 'הדוח לא הצליח לקרוא מהמסד. הסיבה מודפסת למעלה.'
    Write-Bad 'ברוב המקרים המחרוזת הועתקה חלקית — הרץ שוב והדבק אותה במלואה.'
    Read-Host "`nהקש Enter לסגירה" | Out-Null
    exit 1
}

# ---------- 4. לא לספור את עצמך ----------
Write-Step 'שלא נספור את הביקורים שלך'
Write-Host '   בכל מכשיר שממנו אתה נכנס לאתר כדי לבדוק אותו, כדאי לסמן פעם אחת' -ForegroundColor Gray
Write-Host '   שלא יימדד. אחרת הכניסות שלך מנפחות את המספר.' -ForegroundColor Gray
$optOut = Read-Host '   לפתוח עכשיו את האתר ולסמן את המחשב הזה? (כ/ל)'
if ($optOut -in @('כ', 'y', 'Y')) {
    Start-Process "$LiveSite`?analytics=off"
    Write-Ok 'נפתח. אחרי שהדף נטען אפשר לסגור אותו — הסימון נשמר בדפדפן.'
    Write-Host '   בטלפון: פתח שם את אותה כתובת עם ‎?analytics=off‎ בסופה.' -ForegroundColor Gray
}
else {
    Write-Host "   לדילוג. הכתובת לסימון ידני:  $LiveSite`?analytics=off" -ForegroundColor Gray
}

# ---------- סיום ----------
Write-Host ''
Write-Host '==============================================' -ForegroundColor Yellow
Write-Host '   מוכן.' -ForegroundColor Green
Write-Host '   מהיום, כדי לראות כמה נכנסו:' -ForegroundColor Green
Write-Host '   לחיצה כפולה על  כמה-נכנסו.cmd' -ForegroundColor Green
Write-Host '==============================================' -ForegroundColor Yellow
Write-Host ''
Read-Host 'הקש Enter לסגירה' | Out-Null
