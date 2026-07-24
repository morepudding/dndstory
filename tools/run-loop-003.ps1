[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$ApproveStructure,
  [ValidateSet('structure', 'implementation', 'writing', 'visuals', 'verification')]
  [string]$StartAt = 'structure',
  [ValidateRange(5, 120)]
  [int]$HeartbeatSeconds = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$loopFile = Join-Path $repoRoot 'artifacts\loops\003-la-cage-du-treuil.md'
$structureFile = Join-Path $repoRoot 'artifacts\loops\003-la-cage-du-treuil-structure.md'
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$codexCommand = Get-Command codex -ErrorAction SilentlyContinue
$codexShim = Get-Command codex.cmd -ErrorAction SilentlyContinue

if (-not $nodeCommand -or -not $npmCommand) {
  throw 'Node.js et npm sont requis pour lancer une boucle.'
}
if (-not $codexCommand -or -not $codexShim) {
  throw 'Codex CLI est introuvable dans PATH.'
}
if (-not (Test-Path -LiteralPath $loopFile -PathType Leaf)) {
  throw "Fiche de boucle introuvable : $loopFile"
}

$npmCli = Join-Path (Split-Path $npmCommand.Source) 'node_modules\npm\bin\npm-cli.js'
$codexCli = Join-Path (Split-Path $codexShim.Source) 'node_modules\@openai\codex\bin\codex.js'
if (-not (Test-Path -LiteralPath $npmCli -PathType Leaf)) {
  throw "Entrée npm introuvable : $npmCli"
}
if (-not (Test-Path -LiteralPath $codexCli -PathType Leaf)) {
  throw "Entrée Codex introuvable : $codexCli"
}

$stages = @(
  [pscustomobject]@{
    Id = 'structure'
    Label = 'Audit ciblé et structure'
    Model = 'gpt-5.6-sol'
    Effort = 'high'
    Sandbox = 'danger-full-access'
    TimeoutMinutes = 10
    Prompt = @'
Exécute uniquement la structure de la boucle 003.

Utilise conduire-boucle-fantasy-story puis concevoir-branches-fantasy-story. Le contexte de boucle a déjà été calculé par l'orchestrateur : ne lance pas `npm run context:loop` et n'effectue pas d'audit froid si le paquet indique CHAUD ou CHAUD CIBLÉ. Vérifie seulement les raccords indispensables avec les deux fins de la boucle 002. Produis un artefact structurel court et approuvable.

Ne modifie ni moteur, ni état, ni livre canonique, ni interface. N'écris pas les dialogues définitifs. Ne lance aucun test d'acceptation, aucune simulation et aucun Electron. Termine par un message de passage compact pour Terra high.
'@
  },
  [pscustomobject]@{
    Id = 'implementation'
    Label = 'Moteur, état, livre et interface'
    Model = 'gpt-5.6-terra'
    Effort = 'high'
    Sandbox = 'danger-full-access'
    TimeoutMinutes = 20
    Prompt = @'
La structure de la boucle 003 est validée. Exécute uniquement l'intégration mécanique.

Utilise le contrat et l'artefact structurel. Implémente d'abord les mutations déterministes, puis relie livre, moteur, sauvegarde et interface. Garde des textes fonctionnels provisoires. Préserve tous les changements locaux hors périmètre.

Tu peux lancer seulement les vérifications ciblées indispensables aux fichiers que tu modifies : `node --check` sur un fichier JavaScript précis et `node --test --test-isolation=none test/cage-du-treuil.test.js`. Ne lance pas `npm run check`, `npm run verify:story`, `npm run simulate:combat`, `npm test` ou `npm run qa:visual` : l'orchestrateur extérieur les exécutera une seule fois après convergence. Ne lance jamais Electron.

Ne réarbitre pas la structure, n'écris pas la prose définitive et ne produis pas les visuels finaux. Termine par un message de passage compact pour Sol high.
'@
  },
  [pscustomobject]@{
    Id = 'writing'
    Label = 'Textes définitifs'
    Model = 'gpt-5.6-sol'
    Effort = 'high'
    Sandbox = 'danger-full-access'
    TimeoutMinutes = 8
    Prompt = @'
Exécute uniquement l'écriture définitive de la boucle 003.

Utilise ecrire-dialogues-fantasy-story, le contrat, la structure et le passage mécanique. Remplace les textes fonctionnels par une prose française naturelle et des voix distinctes pour Mira et Varek. Ne modifie ni causalité, ni coûts, ni états, ni fins, ni équilibrage.

Limite les contrôles à la validité JSON et, si nécessaire, au test ciblé `node --test --test-isolation=none test/cage-du-treuil.test.js`. Ne lance aucun script npm d'acceptation, aucune simulation et aucun Electron. Termine par un message de passage compact pour Terra medium.
'@
  },
  [pscustomobject]@{
    Id = 'visuals'
    Label = 'Intégration visuelle'
    Model = 'gpt-5.6-terra'
    Effort = 'medium'
    Sandbox = 'danger-full-access'
    TimeoutMinutes = 12
    Prompt = @'
Exécute uniquement l'intégration visuelle de la boucle 003.

Utilise concevoir-visuels-fantasy-story. Fais apparaître la provenance héritée et l'issue active. Réserve imagegen aux illustrations raster propres aux carrières et construis en code disposition, interactions et responsive. Ne change ni structure, ni règles, ni prose stabilisée.

Tu peux lancer seulement `node --check` sur les fichiers JavaScript précis que tu modifies. Ne lance aucun test d'acceptation, aucune simulation, `npm run qa:visual` ou Electron : la QA réelle appartient à l'orchestrateur extérieur. Termine par un message de passage compact pour la preuve finale.
'@
  },
  [pscustomobject]@{
    Id = 'verification'
    Label = 'Synthèse des preuves'
    Model = 'gpt-5.6-luna'
    Effort = 'low'
    Sandbox = 'read-only'
    TimeoutMinutes = 5
    Prompt = @'
Effectue une synthèse strictement en lecture seule de la boucle 003.

Les preuves ont déjà été exécutées par l'orchestrateur extérieur et la fiche a été passée déterministement à `à jouer`. N'utilise aucun outil, ne lance aucune commande, ne modifie aucun fichier et ne corrige rien. Résume les preuves, le chemin exact à essayer et demande au joueur son verdict `garder`, `ajuster` ou `retirer`. Si une preuve manque dans le paquet, signale seulement le manque.
'@
  }
)

$proofs = @(
  [pscustomobject]@{
    Id = 'check'
    Label = 'Syntaxe et contrats'
    Arguments = @($npmCli, 'run', 'check')
    TimeoutMinutes = 3
    ReturnStage = 'implementation'
  },
  [pscustomobject]@{
    Id = 'story'
    Label = 'Livre canonique'
    Arguments = @($npmCli, 'run', 'verify:story')
    TimeoutMinutes = 3
    ReturnStage = 'writing'
  },
  [pscustomobject]@{
    Id = 'combat'
    Label = 'Simulation de combat'
    Arguments = @($npmCli, 'run', 'simulate:combat')
    TimeoutMinutes = 5
    ReturnStage = 'implementation'
  },
  [pscustomobject]@{
    Id = 'tests'
    Label = 'Suite complète'
    Arguments = @($npmCli, 'test')
    TimeoutMinutes = 5
    ReturnStage = 'implementation'
  },
  [pscustomobject]@{
    Id = 'visual'
    Label = 'Parcours Electron et responsive'
    Arguments = @($npmCli, 'run', 'qa:visual')
    TimeoutMinutes = 5
    ReturnStage = 'visuals'
  }
)

function Assert-ModelCatalog {
  param([object[]]$RequiredStages)

  $catalogText = @(& $codexCommand.Source debug models)
  if ($LASTEXITCODE -ne 0) {
    throw 'Impossible de lire le catalogue de modèles Codex.'
  }
  $catalog = ($catalogText -join [Environment]::NewLine) | ConvertFrom-Json

  foreach ($stage in $RequiredStages) {
    $model = $catalog.models | Where-Object slug -eq $stage.Model | Select-Object -First 1
    if (-not $model) {
      throw "Modèle indisponible pour $($stage.Id) : $($stage.Model)"
    }
    if ($stage.Effort -notin $model.supported_reasoning_levels.effort) {
      throw "Effort $($stage.Effort) indisponible pour $($stage.Model)."
    }
  }
}

function Invoke-TrackedProcess {
  param(
    [string]$Label,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory,
    [string]$StdoutPath,
    [string]$StderrPath,
    [int]$TimeoutMinutes,
    [scriptblock]$LineHandler
  )

  $utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
  $stdoutWriter = [System.IO.StreamWriter]::new($StdoutPath, $false, $utf8WithoutBom)
  $stderrWriter = [System.IO.StreamWriter]::new($StderrPath, $false, $utf8WithoutBom)
  $process = [System.Diagnostics.Process]::new()
  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $FilePath
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  foreach ($argument in $Arguments) {
    [void]$startInfo.ArgumentList.Add($argument)
  }
  $process.StartInfo = $startInfo

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  $timedOut = $false
  $lastHeartbeat = [TimeSpan]::Zero

  try {
    if (-not $process.Start()) {
      throw "Impossible de démarrer : $Label"
    }
    $stdoutOpen = $true
    $stderrOpen = $true
    $stdoutTask = $process.StandardOutput.ReadLineAsync()
    $stderrTask = $process.StandardError.ReadLineAsync()

    while (-not $process.HasExited -or $stdoutOpen -or $stderrOpen) {
      if ($stdoutOpen -and $stdoutTask.IsCompleted) {
        $line = $stdoutTask.GetAwaiter().GetResult()
        if ($null -eq $line) {
          $stdoutOpen = $false
        } else {
          $stdoutWriter.WriteLine($line)
          $stdoutWriter.Flush()
          if ($LineHandler) {
            & $LineHandler $line 'stdout'
          }
          $stdoutTask = $process.StandardOutput.ReadLineAsync()
        }
      }
      if ($stderrOpen -and $stderrTask.IsCompleted) {
        $line = $stderrTask.GetAwaiter().GetResult()
        if ($null -eq $line) {
          $stderrOpen = $false
        } else {
          $stderrWriter.WriteLine($line)
          $stderrWriter.Flush()
          if ($LineHandler) {
            & $LineHandler $line 'stderr'
          }
          $stderrTask = $process.StandardError.ReadLineAsync()
        }
      }

      if (-not $timedOut -and
          -not $process.HasExited -and
          $stopwatch.Elapsed.TotalMinutes -ge $TimeoutMinutes) {
        $timedOut = $true
        try {
          $process.Kill($true)
        } catch {
          Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
      }

      if (-not $process.HasExited -and
          ($stopwatch.Elapsed - $lastHeartbeat).TotalSeconds -ge $HeartbeatSeconds) {
        $lastHeartbeat = $stopwatch.Elapsed
        Write-Host ("  … {0} en cours depuis {1}" -f $Label, $stopwatch.Elapsed.ToString('mm\:ss')) -ForegroundColor DarkGray
      }

      if (-not $process.HasExited -or $stdoutOpen -or $stderrOpen) {
        Start-Sleep -Milliseconds 100
      }
    }
    $process.WaitForExit()
  } finally {
    $stopwatch.Stop()
    $stdoutWriter.Dispose()
    $stderrWriter.Dispose()
  }

  [pscustomobject]@{
    ExitCode = if ($timedOut) { -2 } else { $process.ExitCode }
    TimedOut = $timedOut
    Duration = $stopwatch.Elapsed
    ProcessId = $process.Id
  }
}

function Write-RunState {
  param(
    [string]$Path,
    [object[]]$StageResults,
    [object[]]$ProofResults,
    [string]$Status
  )

  [ordered]@{
    loop = '003'
    orchestrationVersion = 2
    status = $Status
    stageResults = $StageResults
    proofResults = $ProofResults
    updatedAt = (Get-Date).ToString('o')
  } |
    ConvertTo-Json -Depth 8 |
    Set-Content -LiteralPath $Path -Encoding utf8
}

function New-CompactPrompt {
  param(
    [pscustomobject]$Stage,
    [string]$ContextText,
    [string[]]$Handoffs,
    [string]$ProofText
  )

  $handoffText = if ($Handoffs.Count -gt 0) {
    $Handoffs -join "`n`n---`n`n"
  } else {
    'Aucun passage antérieur dans cette exécution. Utiliser la fiche et les artefacts existants.'
  }
  $proofBlock = if ($ProofText) {
    "`n`n## Preuves externes`n`n$ProofText"
  } else {
    ''
  }

  @"
$($Stage.Prompt)

## Paquet de contexte produit une seule fois

$ContextText

- Racine : $repoRoot
- Fiche : artifacts/loops/003-la-cage-du-treuil.md
- Structure : artifacts/loops/003-la-cage-du-treuil-structure.md
- AGENTS.md reste autoritaire.
- Ne relance pas l'audit de contexte.

## Passages compacts

$handoffText$proofBlock
"@
}

function Get-CompactMessage {
  param(
    [string]$Message,
    [int]$MaximumCharacters = 6000
  )

  $trimmed = $Message.Trim()
  if ($trimmed.Length -le $MaximumCharacters) {
    return $trimmed
  }
  return $trimmed.Substring(0, $MaximumCharacters) +
    "`n`n[Passage tronqué par l'orchestrateur à $MaximumCharacters caractères.]"
}

function Invoke-CodexStage {
  param(
    [pscustomobject]$Stage,
    [string]$Prompt,
    [string]$RunDirectory
  )

  $jsonlPath = Join-Path $RunDirectory "$($Stage.Id).jsonl"
  $stderrPath = Join-Path $RunDirectory "$($Stage.Id).stderr.log"
  $messagePath = Join-Path $RunDirectory "$($Stage.Id)-final.md"
  $arguments = @(
    $codexCli,
    'exec',
    '--json',
    '--output-last-message', $messagePath,
    '--sandbox', $Stage.Sandbox,
    '-C', $repoRoot,
    '-m', $Stage.Model,
    '-c', ('model_reasoning_effort="{0}"' -f $Stage.Effort),
    '-c', 'mcp_servers.supabase.enabled=false',
    '-c', 'mcp_servers.vercel.enabled=false',
    '-c', 'approval_policy="never"',
    $Prompt
  )

  Write-Host ''
  Write-Host "=== $($Stage.Label) ===" -ForegroundColor Cyan
  Write-Host "Modèle : $($Stage.Model) / $($Stage.Effort)"
  Write-Host "Fil : nouveau · tentative 1/1 · plafond $($Stage.TimeoutMinutes) min"

  $lineHandler = {
    param($line, $stream)
    if ($stream -eq 'stderr') {
      Write-Host "  Codex> $line" -ForegroundColor DarkYellow
      return
    }
    if (-not $line.Trim()) {
      return
    }
    try {
      $event = $line | ConvertFrom-Json -ErrorAction Stop
      if ($event.type -eq 'thread.started') {
        Write-Host "  Fil créé : $($event.thread_id)" -ForegroundColor DarkGray
      } elseif ($event.type -eq 'item.completed' -and $event.item.type -eq 'agent_message') {
        Write-Host "  AI> $($event.item.text)"
      } elseif ($event.type -eq 'item.started' -and $event.item.type -eq 'command_execution') {
        $commandLine = ([string]$event.item.command -split "`r?`n")[0]
        if ($commandLine.Length -gt 140) {
          $commandLine = $commandLine.Substring(0, 140) + '…'
        }
        Write-Host "  Commande> $commandLine" -ForegroundColor DarkGray
      } elseif ($event.type -in @('turn.failed', 'error')) {
        Write-Host "  Erreur Codex> $($event.message)" -ForegroundColor Red
      }
    } catch {
      Write-Host '  Événement Codex non structuré conservé dans le journal.' -ForegroundColor DarkYellow
    }
  }

  $processResult = Invoke-TrackedProcess `
    -Label $Stage.Label `
    -FilePath $nodeCommand.Source `
    -Arguments $arguments `
    -WorkingDirectory $repoRoot `
    -StdoutPath $jsonlPath `
    -StderrPath $stderrPath `
    -TimeoutMinutes $Stage.TimeoutMinutes `
    -LineHandler $lineHandler

  $events = @()
  if (Test-Path -LiteralPath $jsonlPath) {
    $events = @(Get-Content -LiteralPath $jsonlPath | ForEach-Object {
      try {
        $_ | ConvertFrom-Json -ErrorAction Stop
      } catch {
        $null
      }
    })
  }
  $threadId = [string](($events | Where-Object type -eq 'thread.started' | Select-Object -First 1).thread_id)
  $turnFailed = @($events | Where-Object type -in @('turn.failed', 'error')).Count -gt 0
  $lastMessage = if (Test-Path -LiteralPath $messagePath) {
    Get-Content -LiteralPath $messagePath -Raw
  } else {
    ''
  }
  $failed = (
    $processResult.ExitCode -ne 0 -or
    $processResult.TimedOut -or
    $turnFailed -or
    -not $threadId -or
    -not $lastMessage.Trim()
  )

  if ($processResult.TimedOut) {
    Write-Host "  Plafond atteint : $($Stage.TimeoutMinutes) min." -ForegroundColor Red
  }
  Write-Host ("  Durée : {0} · résultat : {1}" -f
    $processResult.Duration.ToString('mm\:ss'),
    $(if ($failed) { 'échec' } else { 'réussi' }))

  [pscustomobject]@{
    Id = $Stage.Id
    Model = $Stage.Model
    Effort = $Stage.Effort
    ThreadId = $threadId
    Attempt = 1
    TimeoutMinutes = $Stage.TimeoutMinutes
    DurationSeconds = [math]::Round($processResult.Duration.TotalSeconds, 2)
    ExitCode = $processResult.ExitCode
    TimedOut = $processResult.TimedOut
    Failed = $failed
    LastMessage = $lastMessage
    JsonlPath = $jsonlPath
    MessagePath = $messagePath
  }
}

function Invoke-Proof {
  param(
    [pscustomobject]$Proof,
    [string]$RunDirectory
  )

  $stdoutPath = Join-Path $RunDirectory "proof-$($Proof.Id).log"
  $stderrPath = Join-Path $RunDirectory "proof-$($Proof.Id).stderr.log"
  Write-Host ''
  Write-Host "=== Preuve · $($Proof.Label) ===" -ForegroundColor Cyan
  Write-Host "Exécution extérieure · tentative 1/1 · plafond $($Proof.TimeoutMinutes) min"

  $lineHandler = {
    param($line, $stream)
    if ($stream -eq 'stderr') {
      Write-Host "  $line" -ForegroundColor DarkYellow
    } else {
      Write-Host "  $line"
    }
  }
  $result = Invoke-TrackedProcess `
    -Label $Proof.Label `
    -FilePath $nodeCommand.Source `
    -Arguments $Proof.Arguments `
    -WorkingDirectory $repoRoot `
    -StdoutPath $stdoutPath `
    -StderrPath $stderrPath `
    -TimeoutMinutes $Proof.TimeoutMinutes `
    -LineHandler $lineHandler

  $failed = $result.ExitCode -ne 0 -or $result.TimedOut
  Write-Host ("  Durée : {0} · résultat : {1}" -f
    $result.Duration.ToString('mm\:ss'),
    $(if ($failed) { 'échec' } else { 'réussi' }))

  [pscustomobject]@{
    Id = $Proof.Id
    Label = $Proof.Label
    Attempt = 1
    TimeoutMinutes = $Proof.TimeoutMinutes
    DurationSeconds = [math]::Round($result.Duration.TotalSeconds, 2)
    ExitCode = $result.ExitCode
    TimedOut = $result.TimedOut
    Failed = $failed
    ReturnStage = $Proof.ReturnStage
    LogPath = $stdoutPath
    ErrorLogPath = $stderrPath
  }
}

function Set-LoopReadyToPlay {
  $text = Get-Content -LiteralPath $loopFile -Raw
  $statusPattern = [regex]::new('(?m)^\*\*Statut :\*\* `[^`]+`')
  $updated = $statusPattern.Replace($text, '**Statut :** `à jouer`', 1)
  if ($updated -eq $text -and $text -notmatch '(?m)^\*\*Statut :\*\* `à jouer`') {
    throw 'Statut de la fiche de boucle introuvable.'
  }
  Set-Content -LiteralPath $loopFile -Value $updated -Encoding utf8
}

Assert-ModelCatalog -RequiredStages $stages

$startIndex = [Array]::IndexOf([string[]]$stages.Id, $StartAt)
if ($startIndex -lt 0) {
  throw "Étape inconnue : $StartAt"
}
if ($startIndex -gt 0 -and -not (Test-Path -LiteralPath $structureFile -PathType Leaf)) {
  throw "La reprise à $StartAt exige l'artefact structurel : $structureFile"
}

Write-Host "Codex : $(& $codexCommand.Source --version)"
Write-Host "Boucle : $loopFile"
Write-Host 'Orchestration : V2 · fils isolés · preuves externes'
Write-Host "Départ : $StartAt"

if ($DryRun) {
  Write-Host ''
  Write-Host 'Simulation réussie. Routage prévu :' -ForegroundColor Green
  $stages[$startIndex..($stages.Count - 1)] |
    Select-Object Id, Model, Effort, TimeoutMinutes, Label |
    Format-Table -AutoSize
  Write-Host ''
  Write-Host 'Preuves externes prévues :'
  $proofs | Select-Object Id, Label, TimeoutMinutes, ReturnStage | Format-Table -AutoSize
  Write-Host 'Aucun appel de modèle, aucune preuve et aucune modification du jeu.'
  exit 0
}

$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "fantasy-story-loop-003-v2\$runStamp"
New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null
$statePath = Join-Path $runDirectory 'state.json'
$stageResults = [System.Collections.Generic.List[object]]::new()
$proofResults = [System.Collections.Generic.List[object]]::new()
$handoffs = [System.Collections.Generic.List[string]]::new()
Write-Host "Journaux : $runDirectory"

Write-Host ''
Write-Host '=== Contexte de boucle · une seule fois ===' -ForegroundColor Cyan
$contextResult = Invoke-TrackedProcess `
  -Label 'Contexte de boucle' `
  -FilePath $nodeCommand.Source `
  -Arguments @($npmCli, 'run', 'context:loop') `
  -WorkingDirectory $repoRoot `
  -StdoutPath (Join-Path $runDirectory 'context.log') `
  -StderrPath (Join-Path $runDirectory 'context.stderr.log') `
  -TimeoutMinutes 2 `
  -LineHandler {
    param($line, $stream)
    if ($stream -eq 'stderr') {
      Write-Host "  $line" -ForegroundColor DarkYellow
    } else {
      Write-Host "  $line"
    }
  }
if ($contextResult.ExitCode -ne 0 -or $contextResult.TimedOut) {
  Write-RunState -Path $statePath -StageResults @() -ProofResults @() -Status 'context_failed'
  throw "Le contexte de boucle a échoué. Journaux : $runDirectory"
}
$contextText = Get-Content -LiteralPath (Join-Path $runDirectory 'context.log') -Raw
Set-Content -LiteralPath (Join-Path $runDirectory 'context-pack.md') -Value $contextText -Encoding utf8

foreach ($stage in $stages[$startIndex..($stages.Count - 1)]) {
  $proofText = ''
  if ($stage.Id -eq 'verification') {
    foreach ($proof in $proofs) {
      $proofResult = Invoke-Proof -Proof $proof -RunDirectory $runDirectory
      $proofResults.Add($proofResult)
      Write-RunState `
        -Path $statePath `
        -StageResults $stageResults.ToArray() `
        -ProofResults $proofResults.ToArray() `
        -Status 'proving'

      if ($proofResult.Failed) {
        $failure = [ordered]@{
          proof = $proofResult.Id
          returnStage = $proofResult.ReturnStage
          attempt = 1
          log = $proofResult.LogPath
          errorLog = $proofResult.ErrorLogPath
          createdAt = (Get-Date).ToString('o')
        }
        $failure | ConvertTo-Json -Depth 5 |
          Set-Content -LiteralPath (Join-Path $runDirectory 'failure.json') -Encoding utf8
        Write-RunState `
          -Path $statePath `
          -StageResults $stageResults.ToArray() `
          -ProofResults $proofResults.ToArray() `
          -Status 'proof_failed'
        Write-Host ''
        Write-Host "Preuve en échec : $($proofResult.Label)" -ForegroundColor Red
        Write-Host "Retour conseillé : npm run loop:003 -- -StartAt $($proofResult.ReturnStage) -ApproveStructure"
        Write-Host "Aucune correction automatique. Journaux : $runDirectory"
        exit 1
      }
    }

    Set-LoopReadyToPlay
    $refreshResult = Invoke-TrackedProcess `
      -Label 'Actualisation du contexte' `
      -FilePath $nodeCommand.Source `
      -Arguments @($npmCli, 'run', 'context:loop:refresh') `
      -WorkingDirectory $repoRoot `
      -StdoutPath (Join-Path $runDirectory 'context-refresh.log') `
      -StderrPath (Join-Path $runDirectory 'context-refresh.stderr.log') `
      -TimeoutMinutes 2 `
      -LineHandler {
        param($line, $stream)
        if ($stream -eq 'stderr') {
          Write-Host "  $line" -ForegroundColor DarkYellow
        } else {
          Write-Host "  $line"
        }
      }
    if ($refreshResult.ExitCode -ne 0 -or $refreshResult.TimedOut) {
      Write-RunState `
        -Path $statePath `
        -StageResults $stageResults.ToArray() `
        -ProofResults $proofResults.ToArray() `
        -Status 'refresh_failed'
      throw "Les preuves passent mais le contexte n'a pas pu être actualisé. Journaux : $runDirectory"
    }

    $proofText = ($proofResults | ForEach-Object {
      "- $($_.Label) : réussi en $([TimeSpan]::FromSeconds($_.DurationSeconds).ToString('mm\:ss')), tentative 1/1."
    }) -join "`n"
  }

  $prompt = New-CompactPrompt `
    -Stage $stage `
    -ContextText $contextText `
    -Handoffs $handoffs.ToArray() `
    -ProofText $proofText
  Set-Content `
    -LiteralPath (Join-Path $runDirectory "$($stage.Id)-prompt.md") `
    -Value $prompt `
    -Encoding utf8

  $stageResult = Invoke-CodexStage -Stage $stage -Prompt $prompt -RunDirectory $runDirectory
  $stageResults.Add($stageResult)
  Write-RunState `
    -Path $statePath `
    -StageResults $stageResults.ToArray() `
    -ProofResults $proofResults.ToArray() `
    -Status $(if ($stageResult.Failed) { 'stage_failed' } else { 'running' })

  if ($stageResult.Failed) {
    Write-Host ''
    Write-Host "Échec à l'étape $($stage.Id)." -ForegroundColor Red
    Write-Host "Reprise : npm run loop:003 -- -StartAt $($stage.Id) -ApproveStructure"
    Write-Host "Aucune correction automatique. Journaux : $runDirectory"
    exit 1
  }

  $compactMessage = Get-CompactMessage -Message $stageResult.LastMessage
  $handoff = @"
### Passage $($stage.Id)

- Modèle : $($stage.Model) / $($stage.Effort)
- Fil isolé : $($stageResult.ThreadId)
- Durée : $([TimeSpan]::FromSeconds($stageResult.DurationSeconds).ToString('mm\:ss'))

$compactMessage
"@
  $handoffs.Add($handoff)
  Set-Content `
    -LiteralPath (Join-Path $runDirectory "handoff-$($stage.Id).md") `
    -Value $handoff `
    -Encoding utf8

  if ($stage.Id -eq 'structure' -and -not $ApproveStructure) {
    Write-Host ''
    $answer = Read-Host 'Lis la structure ci-dessus, puis tape VALIDER pour lancer Terra high'
    if ($answer.Trim().ToUpperInvariant() -ne 'VALIDER') {
      Write-RunState `
        -Path $statePath `
        -StageResults $stageResults.ToArray() `
        -ProofResults $proofResults.ToArray() `
        -Status 'awaiting_structure_approval'
      Write-Host 'Boucle arrêtée après la structure.'
      Write-Host 'Reprise : npm run loop:003 -- -StartAt implementation -ApproveStructure'
      Write-Host "Journaux : $runDirectory"
      exit 0
    }
  }
}

Write-RunState `
  -Path $statePath `
  -StageResults $stageResults.ToArray() `
  -ProofResults $proofResults.ToArray() `
  -Status 'ready_to_play'

Write-Host ''
Write-Host 'Orchestration V2 terminée. La boucle doit maintenant être jouée par le joueur.' -ForegroundColor Green
Write-Host 'Chaque changement de modèle a utilisé un fil neuf.'
Write-Host 'Les preuves ont été exécutées une seule fois par le PowerShell extérieur.'
Write-Host "Journaux : $runDirectory"
