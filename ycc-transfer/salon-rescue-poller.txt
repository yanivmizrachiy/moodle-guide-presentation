[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$RepoRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$env:GIT_TERMINAL_PROMPT = '0'
$env:GIT_CONFIG_COUNT = '1'
$env:GIT_CONFIG_KEY_0 = 'core.fsmonitor'
$env:GIT_CONFIG_VALUE_0 = 'false'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$schema = 'ycc-salon-rescue-v1'
$deviceId = 'salon'
$GitHubRepo = 'yanivmizrachiy/ma-assistant2'
$AllowedAuthor = 'yanivmizrachiy'
$titlePrefix = '[SALON-RESCUE]'
$mutex = [Threading.Mutex]::new($false,'Local\YCC-Salon-Rescue-Poller')
$hasMutex = $false

# The parameter must not share its name with the automatic args variable:
# that one shadows it in the body, the splat is empty and gh prints its help.
function Gh([string[]]$GhArgs) {
  $gh = (Get-Command gh.exe -ErrorAction Stop).Source
  $text = (& $gh @GhArgs 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw "GH_FAILED: $text" }
  return $text
}

function Result([int]$Number,[object]$Payload) {
  $body = 'SALON_RESCUE_RESULT' + [Environment]::NewLine + ($Payload | ConvertTo-Json -Depth 12 -Compress)
  Gh @('issue','comment',[string]$Number,'--repo',$GitHubRepo,'--body',$body) | Out-Null
  Gh @('issue','close',[string]$Number,'--repo',$GitHubRepo,'--reason','completed') | Out-Null
}

function AssertCanonicalRepo {
  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot '.git'))) { throw 'REPO_NOT_FOUND' }
  $origin = (& git -C $RepoRoot remote get-url origin 2>$null | Out-String).Trim()
  # git refuses a checkout owned by another account ("dubious ownership") with a
  # non-zero exit. That is a broken installation, not a wrong origin.
  if ($LASTEXITCODE -ne 0) { throw 'GIT_UNAVAILABLE' }
  $allowedOrigins = @(
    'https://github.com/yanivmizrachiy/ma-assistant2.git',
    'https://github.com/yanivmizrachiy/ma-assistant2',
    'git@github.com:yanivmizrachiy/ma-assistant2.git'
  )
  if ($origin -notin $allowedOrigins) { throw 'REPO_ORIGIN_MISMATCH' }
}

function SafeError([string]$Message) {
  $value = [string]$Message
  if ($RepoRoot) { $value = $value.Replace($RepoRoot,'<repo>') }
  if ($env:USERPROFILE) { $value = $value.Replace($env:USERPROFILE,'<home>') }
  if ($value.Length -gt 400) { $value = $value.Substring(0,400) }
  return $value
}

function RepoSnapshot {
  AssertCanonicalRepo
  $lines = @(& git -C $RepoRoot status --porcelain=v2 --branch --untracked-files=all --ignore-submodules=none 2>$null)
  if ($LASTEXITCODE -ne 0) { throw 'GIT_STATUS_FAILED' }
  $branchLine = $lines | Where-Object { $_ -like '# branch.head *' } | Select-Object -First 1
  $headLine = $lines | Where-Object { $_ -like '# branch.oid *' } | Select-Object -First 1
  if (-not $branchLine -or -not $headLine) { throw 'GIT_STATUS_INCOMPLETE' }
  $branch = ([string]$branchLine -replace '^# branch\.head\s+','').Trim()
  $head = ([string]$headLine -replace '^# branch\.oid\s+','').Trim()
  if ($head -notmatch '^[0-9a-f]{40}$') { throw 'GIT_STATUS_INVALID_HEAD' }
  $dirty = [bool](@($lines | Where-Object { $_ -and -not ([string]$_).StartsWith('# ') }).Count)
  [ordered]@{ branch=$branch; head=$head; dirty=$dirty }
}

function RepoStatus {
  $snapshot = RepoSnapshot
  [ordered]@{ ok=$true; repo=$GitHubRepo; branch=$snapshot.branch; head=$snapshot.head; dirty=$snapshot.dirty }
}

function SyncMain {
  AssertCanonicalRepo
  $before = RepoSnapshot
  if ($before.branch -ne 'main') { throw 'REPO_BRANCH_NOT_MAIN' }
  if ($before.dirty) { throw 'REPO_DIRTY_REFUSED' }

  # This repository is private. The Limited scheduled task is non-interactive,
  # so reuse the already-authenticated GitHub CLI only as an ephemeral Git
  # credential helper for this one fetch. Do not persist credentials or change
  # global/local Git config.
  & git -c 'credential.helper=' -c 'credential.https://github.com.helper=!gh auth git-credential' -C $RepoRoot fetch origin '+refs/heads/main:refs/remotes/origin/main' --prune | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'GIT_FETCH_FAILED' }

  $divergence = (& git -C $RepoRoot rev-list --left-right --count 'HEAD...refs/remotes/origin/main' 2>$null | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $divergence -notmatch '^(?<ahead>\d+)\s+(?<behind>\d+)$') { throw 'GIT_REV_LIST_FAILED' }
  $ahead = [int]$Matches.ahead
  $behind = [int]$Matches.behind
  if ($ahead -gt 0) { throw 'LOCAL_AHEAD_REFUSED' }

  if ($behind -gt 0) {
    & git -C $RepoRoot merge --ff-only refs/remotes/origin/main | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'FAST_FORWARD_FAILED' }
  }

  $after = RepoSnapshot
  $remote = (& git -C $RepoRoot rev-parse refs/remotes/origin/main 2>$null | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $remote) { throw 'ORIGIN_MAIN_UNAVAILABLE' }
  if ($after.branch -ne 'main' -or $after.dirty) { throw 'REPO_CHANGED_DURING_SYNC' }
  if ($after.head -ne $remote) { throw 'HEAD_NOT_ORIGIN_MAIN' }
  [ordered]@{ ok=$true; repo=$GitHubRepo; branch=$after.branch; head=$after.head; dirty=$after.dirty }
}

function RestartYcc {
  $task = Get-ScheduledTask -TaskName 'YanivControlCenter' -ErrorAction Stop
  if ($task.State -eq 'Disabled') { throw 'YCC_TASK_DISABLED' }
  Start-ScheduledTask -TaskName 'YanivControlCenter' -ErrorAction Stop
  [ordered]@{ ok=$true; task='YanivControlCenter'; state=[string](Get-ScheduledTask -TaskName 'YanivControlCenter').State }
}

function SyncRuntimeMain([string]$ExpectedHead) {
  $runtimeRoot = Join-Path $env:USERPROFILE '.ycc-runtime\ma-assistant2-main'
  if (-not (Test-Path -LiteralPath (Join-Path $runtimeRoot '.git'))) { throw 'RUNTIME_REPO_MISSING' }

  $origin = (& git -C $runtimeRoot remote get-url origin 2>$null | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_GIT_UNAVAILABLE' }
  $allowedOrigins = @(
    'https://github.com/yanivmizrachiy/ma-assistant2.git',
    'https://github.com/yanivmizrachiy/ma-assistant2',
    'git@github.com:yanivmizrachiy/ma-assistant2.git'
  )
  if ($origin -notin $allowedOrigins) { throw 'RUNTIME_ORIGIN_MISMATCH' }

  $branch = (& git -C $runtimeRoot symbolic-ref --quiet --short HEAD 2>$null | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') { throw 'RUNTIME_BRANCH_NOT_MAIN' }
  $dirty = @(& git -C $runtimeRoot status --porcelain --untracked-files=all --ignore-submodules=none 2>$null)
  if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_STATUS_FAILED' }
  if (@($dirty | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }).Count -gt 0) { throw 'RUNTIME_DIRTY_REFUSED' }

  & git -c 'credential.helper=' -c 'credential.https://github.com.helper=!gh auth git-credential' -C $runtimeRoot fetch origin '+refs/heads/main:refs/remotes/origin/main' --prune | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_FETCH_FAILED' }

  $divergence = (& git -C $runtimeRoot rev-list --left-right --count 'HEAD...refs/remotes/origin/main' 2>$null | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $divergence -notmatch '^(?<ahead>\d+)\s+(?<behind>\d+)$') { throw 'RUNTIME_REV_LIST_FAILED' }
  $ahead = [int]$Matches.ahead
  $behind = [int]$Matches.behind
  if ($ahead -gt 0) { throw 'RUNTIME_LOCAL_AHEAD_REFUSED' }
  if ($behind -gt 0) {
    & git -C $runtimeRoot merge --ff-only refs/remotes/origin/main | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_FAST_FORWARD_FAILED' }
  }

  $head = (& git -C $runtimeRoot rev-parse HEAD 2>$null | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead) { throw 'RUNTIME_HEAD_MISMATCH' }
  $postDirty = @(& git -C $runtimeRoot status --porcelain --untracked-files=all --ignore-submodules=none 2>$null)
  if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_STATUS_FAILED' }
  if (@($postDirty | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }).Count -gt 0) { throw 'RUNTIME_DIRTY_AFTER_SYNC' }
  [ordered]@{ ok=$true; root='<home>/.ycc-runtime/ma-assistant2-main'; head=$head; dirty=$false }
}

function RepairYcc {
  $sync = SyncMain
  $expectedHead = [string]$sync.head
  if ($expectedHead -notmatch '^[0-9a-f]{40}$') { throw 'EXPECTED_HEAD_UNAVAILABLE' }

  $yccTask = Get-ScheduledTask -TaskName 'YanivControlCenter' -ErrorAction Stop
  if ($yccTask.State -eq 'Disabled') { throw 'YCC_TASK_DISABLED' }

  $runtimeRoot = Join-Path $env:USERPROFILE '.ycc-runtime\ma-assistant2-main'
  $taskAction = [string](($yccTask.Actions | Select-Object -First 1).Arguments)
  $runtimeSync = [ordered]@{ ok=$true; state='not_needed' }
  if ($taskAction -like "*$runtimeRoot\scripts\windows\launch-ycc.ps1*") {
    $runtimeSync = SyncRuntimeMain $expectedHead
  }

  $tsBefore = Get-Service -Name 'Tailscale' -ErrorAction SilentlyContinue
  if (-not $tsBefore) { throw 'TAILSCALE_SERVICE_MISSING' }

  $recoveryTask = Get-ScheduledTask -TaskName 'YanivControlCenter-TailscaleRecovery' -ErrorAction SilentlyContinue
  $recoveryKick = 'not_needed'
  if ($tsBefore.Status -ne 'Running') {
    if (-not $recoveryTask) { throw 'TAILSCALE_RECOVERY_TASK_MISSING' }
    try {
      Start-ScheduledTask -TaskName 'YanivControlCenter-TailscaleRecovery' -ErrorAction Stop
      $recoveryKick = 'started'
    } catch {
      Start-Sleep -Milliseconds 750
      $tsAfterFailedKick = Get-Service -Name 'Tailscale' -ErrorAction SilentlyContinue
      if (-not $tsAfterFailedKick -or $tsAfterFailedKick.Status -ne 'Running') {
        throw 'TAILSCALE_RECOVERY_TRIGGER_FAILED'
      }
      $recoveryKick = 'service_already_recovered'
    }

    $deadline = (Get-Date).AddSeconds(8)
    while ((Get-Date) -lt $deadline) {
      $remainingMs = [int][Math]::Floor(($deadline - (Get-Date)).TotalMilliseconds)
      if ($remainingMs -le 0) { break }
      Start-Sleep -Milliseconds ([Math]::Min(500,$remainingMs))
      if ((Get-Date) -ge $deadline) { break }
      $tsNow = Get-Service -Name 'Tailscale' -ErrorAction SilentlyContinue
      if ($tsNow -and $tsNow.Status -eq 'Running') { break }
    }

    if (-not $tsNow -or $tsNow.Status -ne 'Running') {
      throw 'TAILSCALE_RECOVERY_DID_NOT_START_SERVICE'
    }
  } else {
    $tsNow = $tsBefore
  }

  Start-ScheduledTask -TaskName 'YanivControlCenter' -ErrorAction Stop
  $yccState = [string](Get-ScheduledTask -TaskName 'YanivControlCenter' -ErrorAction Stop).State
  if ($yccState -eq 'Disabled') { throw 'YCC_TASK_DISABLED_AFTER_RESTART' }

  $healthOk = $false
  $runtimeOk = $false
  $healthDeadline = (Get-Date).AddSeconds(15)
  while ((Get-Date) -lt $healthDeadline) {
    $remainingMs = [int][Math]::Floor(($healthDeadline - (Get-Date)).TotalMilliseconds)
    if ($remainingMs -le 1000) { break }
    Start-Sleep -Milliseconds ([Math]::Min(500,$remainingMs - 1000))
    $remainingSeconds = [int][Math]::Floor(($healthDeadline - (Get-Date)).TotalSeconds)
    if ($remainingSeconds -lt 1) { break }
    $requestTimeout = [Math]::Min(2,$remainingSeconds)
    try {
      $healthResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8765/api/status' -TimeoutSec $requestTimeout -SkipHttpErrorCheck
      if ((Get-Date) -ge $healthDeadline) { break }
      if ($healthResponse.StatusCode -eq 200) {
        $healthBody = $healthResponse.Content | ConvertFrom-Json -ErrorAction Stop
        if (($healthBody.ok -is [bool]) -and ($healthBody.ok -eq $true)) {
          $healthOk = $true
          $runtime = $healthBody.runtime
          # Operators must end the line: a line that ends before `-and` closes the
          # expression and the whole file fails to parse.
          if (($null -ne $runtime) -and
              ([string]$runtime.source_commit -eq $expectedHead) -and
              ([string]$runtime.current_commit -eq $expectedHead) -and
              ($runtime.matches_current_source -is [bool]) -and
              ($runtime.matches_current_source -eq $true)) {
            $runtimeOk = $true
            break
          }
        }
      }
    } catch {}
  }
  if (-not $healthOk) { throw 'YCC_HEALTH_NOT_RESTORED' }
  if (-not $runtimeOk) { throw 'YCC_RUNTIME_HEAD_MISMATCH' }

  $finalSnapshot = RepoSnapshot
  if ($finalSnapshot.branch -ne 'main') { throw 'REPO_CHANGED_DURING_REPAIR_BRANCH' }
  if ($finalSnapshot.head -ne $expectedHead) { throw 'REPO_CHANGED_DURING_REPAIR_HEAD' }
  if ($finalSnapshot.dirty) { throw 'REPO_CHANGED_DURING_REPAIR_DIRTY' }

  [ordered]@{
    ok=$true
    sync=$sync
    runtime_sync=$runtimeSync
    tailscale=[string]$tsNow.Status
    ycc_task=$yccState
    ycc_health='ok'
    runtime_head=$expectedHead
    runtime_matches_head=$true
    repo_clean=$true
    recovery_task=[bool]$recoveryTask
    recovery_kick=$recoveryKick
  }
}

try {
  $hasMutex = $mutex.WaitOne(0)
  if (-not $hasMutex) { exit 0 }

  # A checkout that cannot be proven canonical never executes an operation, but
  # the requester must still learn why: an unanswered issue only expires silently.
  $repoFault = $null
  try { AssertCanonicalRepo } catch { $repoFault = SafeError $_.Exception.Message }
  Gh @('auth','status','--hostname','github.com') | Out-Null
  $raw = Gh @('issue','list','--repo',$GitHubRepo,'--state','open','--limit','20','--json','number,title,author')
  if ([string]::IsNullOrWhiteSpace($raw)) { if ($repoFault) { exit 1 }; exit 0 }
  $openIssues = @($raw | ConvertFrom-Json)

  foreach ($candidate in $openIssues) {
    if (-not ([string]$candidate.title).StartsWith($titlePrefix,[StringComparison]::Ordinal)) { continue }
    $number = [int]$candidate.number
    $author = [string]$candidate.author.login
    if ($author -ne $AllowedAuthor) { continue }

    try {
      $issue = (Gh @('issue','view',[string]$number,'--repo',$GitHubRepo,'--json','body,author,title') | ConvertFrom-Json)
      if ([string]$issue.author.login -ne $AllowedAuthor) { throw 'AUTHOR_NOT_ALLOWED' }
      if (-not ([string]$issue.title).StartsWith($titlePrefix,[StringComparison]::Ordinal)) { throw 'TITLE_PREFIX_MISMATCH' }
      $cmd = ([string]$issue.body) | ConvertFrom-Json
      if ([string]$cmd.schema -ne $schema) { throw 'SCHEMA_MISMATCH' }
      if ([string]$cmd.device_id -ne $deviceId) { throw 'DEVICE_ID_MISMATCH' }
      # ConvertFrom-Json already turns an ISO-8601 value into [DateTime]; its
      # culture-formatted string form (he-IL) no longer round-trips through TryParse.
      $expiresAt = [DateTimeOffset]::MinValue
      $rawExpiry = if ($cmd.PSObject.Properties['expires_at']) { $cmd.expires_at } else { $null }
      $expiryOk = $false
      if ($rawExpiry -is [DateTimeOffset]) { $expiresAt = $rawExpiry; $expiryOk = $true }
      elseif ($rawExpiry -is [DateTime]) { $expiresAt = [DateTimeOffset]::new($rawExpiry.ToUniversalTime()); $expiryOk = $true }
      elseif ($null -ne $rawExpiry) {
        $expiryOk = [DateTimeOffset]::TryParse([string]$rawExpiry,[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::AssumeUniversal,[ref]$expiresAt)
      }
      if (-not $expiryOk) { throw 'EXPIRES_AT_REQUIRED' }
      $now = [DateTimeOffset]::UtcNow
      if ($expiresAt -le $now) { throw 'COMMAND_EXPIRED' }
      if (($expiresAt - $now).TotalMinutes -gt 15) { throw 'COMMAND_TTL_TOO_LONG' }
      $op = [string]$cmd.operation
      if ($op -notin @('status','sync-main','restart-ycc','repair-ycc')) { throw "OPERATION_NOT_ALLOWED: $op" }
      if ($repoFault) { throw "REPO_UNAVAILABLE: $repoFault" }

      $result = switch ($op) {
        'status'      { RepoStatus }
        'sync-main'   { SyncMain }
        'restart-ycc' { RestartYcc }
        'repair-ycc'  { RepairYcc }
      }
      Result $number ([ordered]@{ok=$true;device_id=$deviceId;operation=$op;result=$result;completed_at=(Get-Date).ToUniversalTime().ToString('o')})
    } catch {
      Result $number ([ordered]@{ok=$false;device_id=$deviceId;error=(SafeError $_.Exception.Message);completed_at=(Get-Date).ToUniversalTime().ToString('o')})
    }
  }
  if ($repoFault) { exit 1 }
} finally {
  if ($hasMutex) { try { $mutex.ReleaseMutex() } catch {} }
  $mutex.Dispose()
}
