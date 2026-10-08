---
name: x-post-craft
description: "Draft, rewrite, and review posts, threads, replies, and captions for X/Twitter using the mechanics of X's open-source recommendation stack: conversation and depth signals are rewarded, negative feedback and spam signals kill distribution. Use when asked to write a tweet, thread, reply, or caption for a photo or video, or to check a draft before publishing, on any subject or in any tone. Covers hooks, clarity, anti-slop style rules, media, and posting cadence. Not for long-form articles or other platforms."
license: MIT
---

# X Post Craft

Two readers judge every post: the person scrolling, and the ranking system behind the feed. Write for the person. Do not trip the ranking system's penalties.

This works for any account and any subject: jokes, photos, opinions, news, personal updates, work, hobbies. Match the post to its kind. A clip of your cat needs a caption, not an argument.

## What the ranking system rewards

The For You model predicts how likely the viewer is to take each action on a post, multiplies each prediction by a weight, and sums. The heads in the open-source stack:

- **Conversation**: reply, and a reply that the author replies back to.
- **Resharing**: retweet and quote (one head), share via link or DM.
- **Depth**: good click, good profile click, open link, screenshot, dwell, video quality view, video watch time.
- **Saving**: bookmark.
- **Negative**: not interested, mute, block, report.

The production weights are not public. The report, weak negative, and strong negative weights are bounded to negative values in the code, report down to -20000. Treat anything that invites a mute, block, or report as the most expensive mistake a post can make.

In the older ranker, a "good" profile click is a profile visit followed by engagement on the profile. Your bio and pinned post decide whether a curious stranger follows.

Three structural facts constrain strategy more than any hook trick:

1. **Out-of-network reach is discounted.** About half the For You feed comes from accounts the viewer follows. Posts from accounts they do not follow score at 0.75x. New followers are how a post earns back the discount.
2. **The feed penalizes volume.** Each additional post from the same author in one feed is multiplied down (default 0.5 decay per position, floor 0.25), counting posts the viewer already saw. Five rushed posts split one chance five ways.
3. **"See fewer" lasts months.** When a viewer taps "See fewer" on your post, your posts score at 0.2x for that viewer, recovering gradually over 140 days. Every post that annoys a follower costs you with that follower for a long time.

Replies are discoverable too. A reply that earns a profile click can turn a stranger into a follower, where the discount does not apply. The model scores your reply against everyone else's, so write the best comment in the thread.

**Topics decide who sees you out-of-network.** Discovery matches posts to communities and topic embeddings. An account with a few recognizable subjects gives those models a clear signal. That does not mean one niche: a person who posts about cooking, cycling, and their dog is easy to place. A feed with no through-line is not.

## What the text scorer measures

The search index that supplies in-network candidates gives every post a text score. The formula weights length 0.5, content entropy 0.25, readability 0.1, shout 0.1, and having a link 0.05. Offensive text or an offensive username multiplies the whole score by 0.2.

It is one feature in one ranking stage. What it means in practice:

- Length counts letters and saturates: about two thirds of full credit at 50 letters, about 90% at 100. Never pad a post to get there. A short caption on a strong photo or video is fine.
- Vary your words. Repeating the same token lowers entropy.
- No ALL CAPS. Shout is capital letters divided by letters, and it subtracts.
- Links are a small plus here, not a penalty. Do not contort a post to hide one.
- More than one trend or two hashtags gets flagged. Hashtags are filing, not distribution.
- Anything that reads as hostile costs 80% of the text score.

## Writing rules

- **Know what kind of post it is.** A joke needs timing. A photo or clip needs a caption that adds what the image cannot show. An opinion needs the claim stated plainly. News needs the fact first. A personal update needs the detail that makes it yours.
- **One idea per post.** If you cannot state the point in one sentence, you have two posts.
- **The first line earns the second.** Lead with the thing itself: the result, the surprise, the punchline setup, the fact. Context can wait or go.
- **Specifics over adjectives.** "The bakery sold out of croissants by 7:40" beats "crazy busy morning". Numbers, names, times, places, before/after.
- **Let the media do its job.** Do not describe what the viewer can already see. Add the timing, the context, or the reaction.
- **If the media is the punchline, the caption is the setup.** Point the viewer the wrong way, and let the photo or clip land the joke. Never give away the reveal in the text.
- **Give people something to reply to, when it fits.** A question someone can answer from their own life, a take they can agree or argue with, or a detail they will want to ask about. "What was the first thing you cooked on your own?" beats "Thoughts?". A joke or a clip does not need one.
- **Reply to replies, especially early.** Replies the author engages with are their own predicted head, and an active thread keeps people reading. The first hour works hardest.

For threads: post 1 must stand alone, because nobody owes you a click into a mystery. Advance one point per post. Cut every post that exists only to reach the next number. Pay off the promise in the final post.

## Media

Video quality-view and quality-watch only count for videos of 10 seconds or more. Shorter clips are still scored on dwell and watch time. Cut a clip to the length its content needs; do not pad it to cross 10 seconds.

## Anti-slop rules

Banned because they read as machine output:

- "It's not X, it's Y" and "Not just X — Y" contrasts
- Stage-setting openers: "Here's the thing", "Let's be honest", "The truth is", "I've been thinking a lot about"
- Stock vocabulary: game-changer, unlock, supercharge, dive in, deep dive, landscape, journey, seamlessly, robust, elevate, 10x
- Forced triads and parallel structures used for rhythm instead of meaning
- Rhetorical-question openers and em-dash pileups
- Fake vulnerability and manufactured stakes
- Emoji bullets, 🧵, "A thread:", bolded label openers
- Engagement bait: "Agree?", "Who else?", "Like if you...", comment-for-link
- Hashtag stuffing and riding unrelated trends
- A question on every post
- A final line that restates the post

The test that catches most of it: read the post out loud. If no human would say that sentence to a friend, rewrite it.

## Before publishing

Run this list. Any "no" means fix the draft, not ship it.

1. Can you name who it is for and what they get from it (a laugh, a fact, a look at something)?
2. Would someone reply with something real, or only with "great post"?
3. Does anything invite not-interested, mute, or block?
4. One idea? If there is media, does the text add something the media does not already show?
5. Is this part of a burst? If yes, publish the strongest and space out the rest.
6. Can you answer replies for the next hour?

## Workflow

When asked to write, improve, or review a post:

1. Collect raw material first: what the post is about, one concrete detail, who should care, the tone (funny, informative, personal, opinion), and what you want readers to do, if anything. If media is attached, look at it and describe only what it actually shows. If the user has not supplied facts, ask. Never invent numbers, quotes, or outcomes.
2. Draft two or three variants with different openings (for example: the fact or result first, the tension or surprise first, the media or detail first).
3. Run each variant against "Anti-slop rules" and "Before publishing". Kill the weak ones.
4. Deliver at most three options, one line on why each might win. For a thread, deliver the thread plus its standalone first post.

Keep the reply brief. The user came for posts, not a lecture about the feed. When a claim about the algorithm matters and the user wants the source, read [references/algorithm-notes.md](references/algorithm-notes.md) before explaining it.
