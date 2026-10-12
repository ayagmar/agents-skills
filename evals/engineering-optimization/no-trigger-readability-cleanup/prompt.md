---
plugins: ["../../../plugins/engineering-optimization"]
description: Near-miss negative. A readability refactor with no performance goal must not load engineering-optimization.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

This works but it's hard to read. Can you rewrite it so the next person can follow it? Same behavior, nothing fancy.

```js
function f(u){let r=[];for(let i=0;i<u.length;i++){if(u[i].a&&!u[i].d){if(u[i].r==='admin'||u[i].r==='owner'){r.push(u[i].e)}}}return r}
```

(`a` is active, `d` is deleted, `r` is role, `e` is email.)
