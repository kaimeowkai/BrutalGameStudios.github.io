$ErrorActionPreference = 'Stop'
$bgsRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location $bgsRoot
try {
  node scripts/build.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Website build failed.' }
  node scripts/bundle-windows.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Resource build failed.' }
  $bgsCompiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
  if (-not (Test-Path -LiteralPath $bgsCompiler)) { $bgsCompiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe' }
  if (-not (Test-Path -LiteralPath $bgsCompiler)) { throw 'The .NET Framework C# compiler is missing. See docs/DEPENDENCIES.md for official Microsoft links.' }
  New-Item -ItemType Directory -Force -Path (Join-Path $bgsRoot 'downloads') | Out-Null
  & $bgsCompiler /nologo /target:winexe /platform:anycpu /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll ('/resource:' + (Join-Path $bgsRoot '.windows-build/site.bin') + ',BgsSite') ('/out:' + (Join-Path $bgsRoot 'downloads/BGS2026-Finds-Preview.exe')) (Join-Path $PSScriptRoot 'FindsPreview.cs')
  if ($LASTEXITCODE -ne 0) { throw 'Windows compilation failed.' }
  Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $bgsRoot 'downloads/BGS2026-Finds-Preview.exe')
} finally { Pop-Location }
