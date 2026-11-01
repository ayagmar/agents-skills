---
plugins: ["../../../plugins/draft-coach"]
description: Near-miss negative. A review request for a blog site's component code shares the domain and the word review, but it is code review, so the skill must not load.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

review this change to our blog's post card component, anything wrong with it?

```diff
--- a/src/components/PostCard.astro
+++ b/src/components/PostCard.astro
@@ -1,9 +1,11 @@
 ---
 const { post } = Astro.props;
-const date = post.data.pubDate.toLocaleDateString('en-GB');
+const date = new Date(post.data.pubDate).toLocaleDateString();
+const tags = post.data.tags.slice(0, 3);
 ---
 <article>
   <a href={`/blog/${post.slug}`}>{post.data.title}</a>
   <time>{date}</time>
+  {tags.map((t) => <span class="tag">{t}</span>)}
 </article>
```
