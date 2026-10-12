---
plugins: ["../../../plugins/implementation-plan-author", "../../../plugins/adversarial-plan-approval"]
description: Implicit trigger and routing. Asked to write up work for an agent with no chat memory, the agent loads implementation-plan-author (not plan approval) and produces a plan with a pinned baseline, command-based done criteria, STOP conditions, and no commit steps.
tags: [trigger, routing, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

Another agent picks this up tomorrow and it won't have this chat. Write up what it needs to add a `--dry-run` flag to our `sync` command: with the flag, print the files that would be uploaded and exit 0 without calling `upload()`. Reply with the document itself; I'll save it. You can't see the repo, so here's what I checked:

```
$ git rev-parse --short HEAD
4be81d0
$ cat package.json | jq .scripts
{ "test": "vitest run", "lint": "eslint .", "typecheck": "tsc --noEmit" }
$ sed -n 1,20p src/commands/sync.ts
import { Command } from 'commander';
import { collectFiles } from '../fs/collect';
import { upload } from '../remote/upload';

export const sync = new Command('sync')
  .argument('<dir>')
  .option('--force', 'overwrite remote files')
  .action(async (dir, opts) => {
    const files = await collectFiles(dir);
    await upload(files, { force: opts.force });
  });
$ ls test/commands
sync.test.ts
```

`test/commands/sync.test.ts` mocks `upload` with `vi.mock('../../src/remote/upload')`. Don't touch `src/remote/`, another team owns it.
