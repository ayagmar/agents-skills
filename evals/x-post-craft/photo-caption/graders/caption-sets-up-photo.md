---
type: llm
---

The user gave only these facts: a photo of their dog sprinting out of a bakery with a whole baguette in her mouth, the baker chasing her in the background, and the user paid for it afterwards.

PASS if all of these hold:
- At most three caption options.
- The captions add something the photo cannot show (the setup, context, or the fact that the user paid) rather than narrating what is visible ("my dog running out of a bakery with a baguette").
- No caption invents a detail: no dog name, breed, bakery name, city, price, time, or event (something the dog, baker, or user did) the user did not give. Placeholders the user is asked to fill are fine. Judge the caption options themselves; a clearly hypothetical example in a tip that asks the user for the real detail is not a caption.
- No caption uses more than two hashtags, and none ends in engagement bait ("Agree?", "Who else?", "Like if").

FAIL if any of these is violated.
