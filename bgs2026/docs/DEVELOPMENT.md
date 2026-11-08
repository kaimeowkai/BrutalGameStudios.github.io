# Developer and build guide

This is the portable implementation of the BGS2026 Finds section. The live site's first-party guide content, HTML, CSS, scripts and catalog validation are in `src/`. Small build scripts render that content to static pages, and a C# viewer can embed those pages and the guide into a Windows EXE.

## Get the source

Download the existing repository ZIP or clone it:

```sh
git clone https://github.com/kaimeowkai/BrutalGameStudios.github.io.git
cd BrutalGameStudios.github.io/bgs2026
```

Use [the dependency guide](DEPENDENCIES.md) to install only the tools you need. No third-party npm modules are required for the commands below.

## Source map

| Path | Purpose |
| --- | --- |
| `src/content/finds-guides.mjs` | Six original guides, category data and product/source associations |
| `src/lib/finds-pages.mjs` | Guide/information page renderer and shared navigation/footer |
| `src/lib/finds-catalog.mjs` | Exact-record, URL, image-permission and freshness validation |
| `src/storefront/finds.html` | Finds hub and three editorial product panels |
| `src/public/` | Owned CSS/JavaScript, with external fonts referenced by URL |
| `src/catalog/finds.json` | Empty catalog source awaiting authorized real data |
| `scripts/build.mjs` | Generates static preview routes and explicit preview labels |
| `scripts/serve.mjs` | Read-only loopback Node preview server |
| `scripts/render-docs.mjs` | First-party renderer for this guide's Markdown subset |
| `scripts/bundle-windows.mjs` | Packs generated files into a length-prefixed resource |
| `windows/FindsPreview.cs` | Windows control window and embedded read-only HTTP viewer |
| `windows/build.ps1` | Builds website, resource and EXE using the installed compiler |
| `docs/` | Illustrated guide, external links and operating material |
| `dist/` | Generated preview, including browser-readable help |
| `downloads/` | Prebuilt EXE and checksums |

## Build and run the portable website

From the `bgs2026` folder:

```sh
node scripts/render-docs.mjs
node scripts/build.mjs
node scripts/serve.mjs
```

Open `http://127.0.0.1:4175/finds/`. The default server binds to `127.0.0.1`, so this address is local to the computer running it. Ctrl+C stops the server. To choose another port:

```sh
node scripts/serve.mjs --port 4180
```

Opening the HTML using a `file://` URL is not the supported preview route; the photo-catalog fetch uses HTTP. The live website remains available without any local tooling.

For an optional static preview under a URL subfolder, build with a trailing-slash base path:

```sh
node scripts/build.mjs --base /example/bgs2026/dist/
```

The intended host must actually serve that subfolder. This command does not enable GitHub Pages or change repository settings. Rebuild without `--base` before creating the Windows EXE, which expects root-relative routes on its loopback origin.

## Edit and validate

Edit source in `src/`, not the generated `dist/` files. Re-render docs if their Markdown changes, then rebuild. For product additions, preserve the validator's requirements and rights records. Do not fabricate image permissions or an ASIN.

Run the checks:

```sh
node --test tests/portable.test.mjs
```

The checks start a temporary local server, validate actual responses and internal routes/assets, check the empty authorized-photo catalog and verify that the server refuses writes. The scripts and generated site contain no live Amazon API client.

Browser QA should cover search, combined filters, reset, zero results, guide links, anchor navigation, disclosures and a narrow phone layout. Test a physical phone before claiming device-specific compatibility.

## Build the Windows program

On Windows, open PowerShell in `bgs2026`:

```powershell
node scripts/render-docs.mjs
.\windows\build.ps1
```

The resulting file is `downloads/BGS2026-Finds-Preview.exe`. The build uses Node and the installed Microsoft .NET Framework C# compiler. It does not download a compiler or bundle third-party runtimes. If PowerShell policy blocks a script, use your organization's approved execution path or invoke the documented commands manually; do not disable security protections just to follow the guide.

On this build machine, script-file execution was disabled. The equivalent commands below were run directly in PowerShell without changing that policy:

```powershell
node scripts/build.mjs
node scripts/bundle-windows.mjs
$bgsRoot = (Get-Location).Path
$bgsCompiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $bgsCompiler /nologo /target:winexe /platform:anycpu /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll ('/resource:' + (Join-Path $bgsRoot '.windows-build/site.bin') + ',BgsSite') ('/out:' + (Join-Path $bgsRoot 'downloads/BGS2026-Finds-Preview.exe')) (Join-Path $bgsRoot 'windows/FindsPreview.cs')
```

If the 64-bit compiler path is unavailable, check the `Microsoft.NET/Framework/v4.0.30319/csc.exe` alternative documented in the build script. Use a fresh terminal in the package directory. Close any running copy of the EXE before overwriting it.

The build sequence is website generation, `node scripts/bundle-windows.mjs`, then compilation of `windows/FindsPreview.cs` as a Windows Forms application embedding `.windows-build/site.bin`. The PowerShell source shows every compiler option. The intermediate resource is ignored by Git.

The EXE binds an ephemeral loopback port, serves only embedded resources and supports GET/HEAD requests. It rejects writes, missing resources, traversal paths and unexpected Host headers. No files are extracted into a user's profile, and no secrets are needed. Closing its control window stops the listener.

## Test the EXE

Its self-test uses local requests and does not open the browser or connect to Amazon. On Windows:

```powershell
$bgsTest = Start-Process -FilePath '.\downloads\BGS2026-Finds-Preview.exe' -ArgumentList '--self-test', 'windows-self-test.json' -WindowStyle Hidden -PassThru -Wait
$bgsTest.ExitCode
Get-Content -LiteralPath '.\windows-self-test.json'
```

An exit code of 0 and `passed: true` indicate the checks passed. Treat a missing report or nonzero exit as a failure. The report is a local test artifact, not account approval or a security certification.

Manually run the EXE afterward. Check the local preview and Read user guide buttons, then stop it with its control window. Confirm the local address stops responding. A hash identifies a binary; it does not replace code review or signing.

## Release sequence

1. Review source/docs and external links; keep private data out of the package.
2. Render docs, build the portable website and run tests.
3. Build the EXE; run its self-test and inspect its actual window/browser behavior.
4. Generate SHA-256 checksums for the final EXE and package.
5. Commit the reviewed `bgs2026/` folder and repository navigation change.
6. Push without overwriting unrelated files or changing repository access/settings.
7. Verify the remote commit and download links.

The existing repository also hosts studio privacy policies. Preserve those files. Do not force-push its history or replace the root README with a different project.

## Relationship to production

The production studio is hosted through Sites and has an existing Worker/framework integration. This portable package exposes the Finds source without including private hosting identifiers, storage bindings, paid checkout code, app binaries or third-party framework templates. Studio-only navigation points back to the live studio.

The original Finds integration adds generated guide routes to the Worker's page map, serves a sanitized catalog endpoint and loads the same first-party CSS/scripts. Production image retrieval/refresh still requires implementation after authorization. Publishing this package to GitHub does not automatically edit or deploy the original hosted project.

The snapshot retains production canonical URLs and explicitly uses `noindex`/a disallowing robots file. It is meant for review and local use, not a competing indexed storefront. If you intentionally migrate the live site later, plan URL, canonical, tracking, verification and account-site updates as a separate change.
