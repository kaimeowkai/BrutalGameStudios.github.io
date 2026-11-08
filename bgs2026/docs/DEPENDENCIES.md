# Dependencies and prerequisites

Choose the row for what you want to do. The portable Finds package has **zero third-party npm dependencies**. External services and Microsoft/Node/browser runtimes are linked here and are not redistributed.

| Task | Required | Official source | Cost in this workflow |
| --- | --- | --- | --- |
| Visit the live site | Internet and a current browser | [Chrome](https://www.google.com/chrome/) or your existing browser | No new paid plan |
| Run the Windows EXE | Windows and .NET Framework 4.8 or 4.8.1, plus a default browser | [Microsoft installation guidance](https://learn.microsoft.com/en-us/dotnet/framework/install/on-windows-and-server), [4.8 download](https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48), [4.8.1 download](https://dotnet.microsoft.com/en-us/download/dotnet-framework/net481) | No paid runtime |
| Build or serve the portable source | Node.js 22.13 or newer | [Node.js downloads](https://nodejs.org/en/download), [Node documentation](https://nodejs.org/docs/latest/api/) | No paid runtime |
| Rebuild the Windows EXE | Node.js, Windows PowerShell, .NET Framework C# compiler | [PowerShell documentation](https://learn.microsoft.com/en-us/powershell/), [Microsoft C# compiler documentation](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/) | No paid toolchain required |
| Download source without Git | Browser and ZIP extraction | [GitHub download instructions](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-files-from-github) | Free download |
| Clone, commit and push source | Git and repository write access | [Git downloads](https://git-scm.com/downloads), [GitHub authentication](https://docs.github.com/en/authentication) | No paid client required |
| Edit source comfortably | A text editor; VS Code is optional | [Visual Studio Code](https://code.visualstudio.com/) | Optional free editor |
| Earn Amazon commissions | Eligible Associates account, declared website, applicable tax/payment completion and qualifying activity | [Amazon Associates](https://affiliate-program.amazon.com/), [application review](https://affiliate-program.amazon.com/help/node/topic/G8TW5AE9XL2VX9VM) | No paid tool added here; program terms apply |
| Add Amazon photo data | Appropriate account/API authorization and a compliant retrieval/refresh integration | [Creators API registration](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api), [policies](https://affiliate-program.amazon.com/help/operating/policies) | Access not confirmed; no paid workaround purchased |
| Search visibility reporting | Google account and verified property | [Search Console](https://search.google.com/search-console/) | Free service route |
| Publish promotional videos | An account you control, original/permitted media, applicable channel features | [YouTube link guidance](https://support.google.com/youtube/answer/13748639?hl=en) | No ads purchased |

## Windows details

The prebuilt EXE is an AnyCPU .NET Framework application using standard System, System.Drawing, System.Windows.Forms and networking APIs. These are provided by the runtime/Windows; DLLs are not bundled. .NET Framework is distinct from modern .NET. Installing only a modern .NET SDK is not the same as installing the Framework runtime.

The source build first looks for `csc.exe` under the Windows .NET Framework64 folder, then the 32-bit Framework folder. If it is absent, use Microsoft's official developer/runtime documentation. Never download a loose compiler executable from an unrelated download site. The live website and Node preview remain alternatives.

The EXE has no code-signing certificate and no automatic update system. It was tested on the current Windows environment; testing every Windows version or physical device has not been performed. Run it as an ordinary user. It does not require administrator access or LAN/firewall changes.

## Node details

The portable scripts use only Node built-ins: `fs`, `path`, `url`, `http`, `crypto`, `assert`, `test`, `os` and `child_process` where used by checks. You do not need Python, Docker, React, Next.js, Stripe credentials, a database or an npm installation step to build this portable package.

Install Node through its official supported route, then reopen the terminal and check:

```sh
node --version
```

The original hosted studio uses a larger framework stack. Its package list is preserved as a **reference only** in [Hosted dependency reference](HOSTED_DEPENDENCIES.md). It is not the dependency list for this portable package and its third-party implementations are not redistributed here.

## Fonts and internet access

The CSS references Barlow Condensed and DM Sans using Google Fonts. Font files are fetched from Google when online and are not bundled. Fallback fonts are configured. See [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed), [DM Sans](https://fonts.google.com/specimen/DM+Sans) and [Google Fonts](https://fonts.google.com/).

The local content and guide can load without internet; Amazon destinations, the live site, fonts and external documentation require a connection. No Amazon API credential is included in the program or source.

## Account and ownership prerequisites

- Control of the business email and recovery methods.
- Authority to edit and publish the BGS2026 website/source.
- Write permission to `kaimeowkai/BrutalGameStudios.github.io` for publication.
- Appropriate rights to all added text, code, photos and video.
- Verified Google property ownership for Search Console management.
- Applicable Amazon eligibility and up-to-date account details for commissions/API access.

Do not place personal identifiers, private supplier correspondence, tax documents, passwords, API keys or customer records in a public repository. The package's empty product catalog does not assert Amazon approval.
