---
plugins: ["../../../plugins/release-readiness-certification", "../../../plugins/improve"]
description: Routing. A request for a written go/no-go on an npm publish loads release-readiness-certification rather than improve's concise release-readiness mode, and returns NOT READY on a broken tarball without promoting a typo to a blocker.
tags: [trigger, output, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

We're publishing 2.0.0 of our CLI to npm tomorrow morning and my lead wants a written go/no-go in the release ticket. Here's everything I've got:

```
$ npm test
 Test Files  14 passed (14)
      Tests  212 passed (212)

$ npm pack --dry-run
npm notice 📦  csvkit-cli@2.0.0
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 4.2kB README.md
npm notice 812B  package.json
npm notice total files: 3
```

`package.json` (excerpt)
```json
{ "name": "csvkit-cli", "version": "2.0.0", "bin": { "csvkit": "dist/cli.js" },
  "files": ["src"], "scripts": { "build": "tsc -p .", "test": "vitest run" } }
```

`CHANGELOG.md` (top)
```
## 1.4.0
- Add --delimiter flag
```

`README.md` line 12: "You will recieve a summary on stdout."
