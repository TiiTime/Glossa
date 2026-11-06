# Glossa regression tests

Requirements: Node.js 24+; Windows Brave at its standard installation path. No npm dependencies.

```powershell
node --test tests/*.test.cjs
```

- `background.test.cjs`: runs the actual worker script in Node's VM with controlled HTTP responses. Covers shared requests, language isolation, cache, failed-request cleanup and fallback.
- `browser.test.cjs`: executes the actual content script in a real headless browser with deterministic timers and simulated extension messaging. Covers hover deadlines, target identity, selection, stale responses, startup/settings races, nested open Shadow DOM and editable elements.
- `extension.test.cjs`: loads the unpacked MV3 extension in an isolated Brave profile against a local test page. Uses real content script, worker, Chrome messaging, sync storage and settings popup. Only Google HTTP responses are intercepted for predictable success, fallback and error cases.

Second-browser content-script check:

```powershell
$env:GLOSSA_TEST_BROWSER = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node --test tests/background.test.cjs tests/browser.test.cjs
Remove-Item Env:GLOSSA_TEST_BROWSER
```

The extension integration test always uses Brave because unpacked-extension loading depends on browser support. Profiles are created under the OS temporary directory and removed after testing; no personal browser profile or installed extension is changed. The tests don't measure Google availability or translation quality and don't guarantee compatibility with every website.
