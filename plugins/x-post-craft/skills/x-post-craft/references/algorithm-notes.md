# Algorithm notes

Evidence base for this skill: the open-source repository [`twitter/the-algorithm`](https://github.com/twitter/the-algorithm), checked at commit `c54bec0` (September 2025). Paths below are relative to that repository root. This is a snapshot; production configs and models move faster than the open source. Treat the structure of the signals as reliable and specific numbers as code defaults, not as live values. Many features below sit behind feature switches whose open-source default is off; production values are not public.

## What the ranker predicts

`home-mixer/server/src/main/scala/com/twitter/home_mixer/model/PredictedScoreFeature.scala` (legacy ranker) lists the engagement heads and maps each to a model weight parameter in `HomeGlobalParams.scala`:

- Positive: favorite, reply, retweet, reply-engaged-by-author, good-click v1, good-click v2, good-profile-click, video-quality-view (standard and immersive), bookmark, share, dwell, video-watch-time, video-quality-watch.
- Negative: negative-feedback-v2.

`PhoenixPredictedScoreFeature.scala` (newer Phoenix ranker) maps client actions to heads:

- retweet head = quote + retweet
- share head = copy link + send via DM + share
- negative-feedback-v2 = not interested + block author + mute author + report
- good-click v1 = photo expand; good-click v2 = tweet click; good-profile-click = profile click; plus open link, screenshot, dwell, bookmark, video quality view.

In the legacy ranker, good-profile-click is `PREDICTED_IS_PROFILE_CLICKED_AND_PROFILE_ENGAGED`, good-click v1 is a conversation click followed by a favorite or reply, and good-click v2 is a conversation click with more than 2 active minutes.

All model weight params in `HomeGlobalParams.scala` default to 0.0; real weights come from feature switches that are not public. Report, weak-negative-feedback, and strong-negative-feedback weights are bounded to negative values (report from -20000 to 0, the others from -1000 to 0). Negative-feedback-v2 is bounded -10000 to 10000.

`RerankerUtil.aggregateWeightedScores` sums `score × weight` across heads. Depending on feature switches, a negative head either contributes `score × weight` like the others, or contributes its full weight once its score crosses a threshold (`NegativeScoreConstantFilterThresholdParam`, `NegativeScoreNormFilterThresholdParam`).

## Structural constraints

- **Out-of-network discount**: `OONTweetScalingScorer.scala` scales out-of-network scores by 0.75; `ScoredTweetsParam.OutOfNetworkScaleFactorParam` defaults to 0.75. In-network retweets of out-of-network posts are exempt.
- **In-network share**: top-level `README.md` says the search-index candidate source finds and ranks in-network posts and supplies roughly 50% of posts.
- **Author diversity decay**: `AuthorBasedListwiseRescoringProvider.scala` multiplies the Nth post from one author by `(1 - floor) * decay^N + floor`; defaults in `ScoredTweetsParam.scala` are decay 0.5 and floor 0.25 for both in-network and out-of-network. `ImpressedAuthorDecayRescoringProvider.scala` adds the author's already-impressed posts to the position index.
- **Feedback fatigue**: `FeedbackFatigueScorer.scala` reads the viewer's "See fewer" feedback from the last 140 days. The author's posts are multiplied by 0.2 right after the feedback, rising linearly back to 1.0 over the 140 days. The same discount applies to posts surfaced through a liker, follower, or retweeter the viewer gave that feedback on. It is applied in `ForYouTimelineScorerCandidatePipelineConfig.scala` alongside the out-of-network scaling.
- **Repeat suppression**: `PreviouslySeenTweetsFilter.scala` and `PreviouslyServedTweetsFilter.scala` run in `ScoredTweetsRecommendationPipelineConfig.scala`; `PreviouslyServedTweetsFilter` also runs in `ForYouConversationServiceCandidatePipelineConfig.scala` and `PreviouslySeenTweetsFilter` in `ForYouTuneFeedCandidatePipelineConfig.scala`. A post the viewer has already seen or been served is not ranked again. `PreviouslySeenMediaIdsFilter.scala` is not wired into any pipeline in this snapshot; `MediaDeduplicationFilter.scala` defines `MediaIdDeduplicationFilter`, which `ScoredTweetsRecommendationPipelineConfig.scala` does wire behind `EnableMediaDedupingParam` (default false).

## Text quality (search index)

`src/java/com/twitter/search/common/relevance/scorers/TweetTextScorer.java`:

```
text_score = offensive_text_damping * offensive_username_damping * (
    0.5 * length + 0.1 * readability + 0.1 * (1 - shout) + 0.25 * entropy + 0.05 * has_link )
```

- Both dampings are 0.2 when they apply, 1.0 otherwise.
- `TweetQualityFeatureExtractor.java`: length counts letters in the normalized, stripped text, not characters; caps counts uppercase letters.
- `TweetTextEvaluator.java`: shout = caps / length; entropy = Shannon entropy of stripped tokens (repetition lowers it); readability = total token length × log(token count) / token count.
- `TweetTextScorer.normalize(value, alpha)` = `2 * (sigmoid(alpha * value) - 0.5)`. With the length alpha of 0.03, the length term is about 0.64 at 50 letters, 0.91 at 100, and 0.97 at 140.
- `TwitterMessage.hasMultipleHashtagsOrTrends` (more than 1 trend or more than 2 hashtags) sets `HAS_MULTIPLE_HASHTAGS_OR_TRENDS_FLAG` in `EncodedFeatureBuilder.java`.
- `src/python/twitter/deepbird/projects/timelines/scripts/models/earlybird/README.md`: the Earlybird light ranker's static features include trend words, text score, and tweepcred; realtime features include like/reply/retweet counts and pToxicity and pBlock scores from health models. `TimelinesSharedFeatures.scala` carries weighted and decayed favorite/retweet/reply/quote counts into ranking.

## Reach from other accounts

- `src/scala/com/twitter/graph/batch/job/tweepcred/README`: PageRank over interaction edges (mentions, retweets, and so on); by default the result is adjusted by follower-to-following ratio. The user mass input factors account age, follower and following counts, device usage, and safety status.
- `src/scala/com/twitter/timelines/prediction/features/engagement_features/EngagementFeatures.scala`: real-graph weights per interaction measure how strongly two users interact.
- `user-signal-service/README.md`: explicit signals (favoriting, retweeting, replying) and implicit signals (tweet clicks, video views, profile visits) feed retrieval and ranking.
- Topic and community matching: `src/scala/com/twitter/simclusters_v2/README.md` (community detection and sparse embeddings), `topic-social-proof/README.md` (topics per post), and the TwHIN embeddings linked from the top-level README. These decide which out-of-network audiences a post is a candidate for.

## Spam, slop, and safety

All of the following are present in code; most are gated by feature switches, with defaults noted.

- `SlopFilter.scala` + `SlopAuthorFeatureHydrator.scala`: "slop" here means an author whose `NsfwConsumerFollowerScore` is above `SlopMaxScore` (default 0.3), not low-effort writing. The filter removes out-of-network posts from such authors with more than `SlopMinFollowers` (default 100) followers, when the viewer follows fewer than 5 such authors. It is on by default for new, near-zero, and very light viewers (`EnableSlopFilterEligibleUserStateParam`, default true); the all-viewer and low-signal-viewer switches default to false.
- `GrokSpamFilter.scala` (`EnableGrokSpamFilter`, default false): removes posts whose Grok annotations mark them as spam.
- `GrokSlopScoreRescorer.scala`: multiplies a post's score by `GrokSlopScoreDecayValueParam` when its Grok slop score is 3. The default decay is 1.0, a no-op.
- `visibilitylib/src/main/scala/com/twitter/visibility/rules/DownrankingRules.scala`: `HighSpammyTweetContentScore`, `HighCryptospamScore`, `UntrustedUrl`, and `DownrankSpamReply` labels downrank or section content in conversations.
- `ToxicityReplyFilterRules.scala`: toxic replies are tombstoned and dropped from notifications when the rules are enabled. `HighToxicityScore` labels drive conversation downranking in `DownrankingRules.scala`.
- `ScoredTweetsModelScoringPipelineConfig.scala` runs `NaviModelScorer` and, behind `EnablePhoenixScorerParam`, `PhoenixScorer`. The action set above is the stable part across both.

## Media

- Legacy `PredictedVideoQualityViewScoreFeature` requires a video of at least 10 seconds when `EnableTenSecondsLogicForVQV` is on (default true). `PhoenixPredictedVideoQualityViewScoreFeature` and `PredictedVideoQualityWatchScoreFeature` always require at least 10 seconds.
- Dwell is the other way around. `PhoenixPredictedDwellScoreFeature` is eligible only when the post is not a video of 10 seconds or more. Legacy `PredictedDwellScoreFeature` excludes those videos only when `EnableDwellOrVQVParam` is on (default false). `PredictedVideoWatchTimeScoreFeature` has no duration gate. A short clip is scored on dwell and watch time; a 10-second-plus video is scored on quality view and quality watch.
- `ConsistentAspectRatioFilter.scala` keeps one orientation (horizontal or vertical) per For You video carousel (`ForYouScoredVideoTweetsCandidatePipelineConfig.scala`). It shapes the carousel, not individual posts.
- `HasMultipleMediaFilter.scala` exists behind `EnableHasMultipleMediaFilter` (default false).
