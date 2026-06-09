# Implementation Guide

## Part 1: Concept

会員みんなにアンケート用紙を配って、いろいろな質問に答えてもらった状況に似ています。

たとえば、アンケート用紙には「お仕事は何ですか」「得意なことは」「趣味は」「ひとことメッセージを」といった欄が並んでいます。集めた答えを、そのまま順番に書き写しただけの紙を壁に貼ると、どこに何が書いてあるか分かりにくくて、せっかく書いてもらった内容が読み手に伝わりません。

そこで、答えを「名刺」のようにきれいに割り付けます。お名前と顔写真は名刺の上の目立つところ（Hero）、お仕事の説明は「ビジネス概要」の欄、趣味や座右の銘は「パーソナル」の欄、ひとことメッセージは大きな引用カードに、というふうに、決まった場所へちゃんと書き写すのです。

これまでの公開ページは「アンケートの答えを順番にそのまま並べただけ」でした。今回は「答えを名刺の決まった欄にちゃんと書き写す」ように作り直します。

| 機能 | 説明 | 例 |
| ---- | ---- | -- |
| セクション分け | 答えを 5 つの決まった欄に振り分ける | 「お仕事の説明」はビジネス概要の欄へ |
| 空欄の自然な処理 | 答えていない欄は、見栄えが崩れないように静かに隠す / `—` を出す | 趣味が空なら `—`、メッセージが空ならカードごと隠す |
| 取りこぼし防止 | どの欄にも当てはまらない新しい質問も「その他」の欄に必ず出す | 後から増えた質問も消えない |
| 確認用データの充実 | 動作確認用の見本会員（`TEST-MEM-01`）に全部の答えを入れておく | 全部の欄が埋まった見本を画面で確認できる |

| 用語 | Part 1 での扱い |
| ---- | -------------- |
| adapter | 「答えを欄に書き写す係」として説明 |
| stableKey | 「アンケートの質問の番号」として説明 |
| seed | 「動作確認用の見本データ」として説明 |
| visibility | 「公開してよい欄かどうか」として説明 |

## Part 2: Technical Detail

### Current Contract

- `toMemberDetailProps(profile, { onUnknownKind? })` の関数名と引数は維持する。
- API は既存の `GET /public/members/:memberId` を使い、D1 schema / Google Form schema / public API response contract は変更しない。
- API から来る `publicSections` は、adapter で `visibility === "public"` のみを再確認する。

### Implemented Delta

| Area | Change |
| --- | --- |
| adapter | `MemberDetailProps` に `hero`, `business`, `personal`, `message`, `links`, `other` を追加。既存互換の `sections` / `linkSections` も維持 |
| hero | `ProfileHeroProps.hometown` を追加し、Avatar を `xl`、eyebrow を `MEMBER PROFILE` に変更 |
| business | `BusinessOverviewSectionProps` で `businessOverview`, `skills`, `canProvide` を表示 |
| personal | `PersonalSectionProps.rows` で `hobbies`, `recentInterest`, `motto`, `otherActivities` を 4 行固定表示し、空値は `—` |
| message | `MessageCardProps.message` を `accent-soft` + `serif` で表示し、空なら `null` |
| links | URL kind の field だけを `MemberDetailLink` 相当に変換し、空 href は除外 |
| other | 固定割当外の public field を元 section の `key/title` を保って `MemberDetailSections` へ渡す |
| seed | `TestMemberAccount.profile?: Readonly<Record<string, string | null>>` を追加し、`TEST-MEM-01` に public survey fields を充填 |

### Section Assignment

| Output | stableKey / condition |
| ------ | --------------------- |
| hero summary | `fullName`, `nickname`, `location`, `occupation`, `ubmZone`, `ubmMembershipType` |
| hero extracted | `hometown` |
| business | `businessOverview`, `skills`, `canProvide` |
| personal | `hobbies`, `recentInterest`, `motto`, `otherActivities` |
| message | `selfIntroduction` |
| links | `kind === "url"` and non-empty rendered value |
| other | public detail field not assigned above. Example: schema canonical `urlOthers` is paragraph kind and therefore remains in other |

### Edge Cases

| Case | Behavior |
| --- | --- |
| `publicSections` empty | hero from summary only, business empty, personal 4 fallback rows, message / links / other empty |
| missing hometown | Hero hometown chip hidden |
| empty business overview | section displays `—` |
| missing personal field | corresponding row stays visible with `—` |
| empty `selfIntroduction` | `MessageCard` returns `null` |
| URL field empty string | excluded from `links` |
| unknown kind | `onUnknownKind` called once per field when provided, field skipped |
| member/admin field mixed in | excluded by adapter visibility guard |

### Identifier Drift Check

| Identifier | Evidence |
| ---------- | -------- |
| `toMemberDetailProps` | `apps/web/src/lib/adapters/member-detail.ts` |
| `MemberDetailProps.hero/business/personal/message/links/other` | `apps/web/src/lib/adapters/member-detail.ts` |
| `ProfileHeroProps.hometown` | `apps/web/src/components/public/ProfileHero.tsx` |
| `BusinessOverviewSectionProps` | `apps/web/src/components/public/BusinessOverviewSection.tsx` |
| `PersonalSectionProps` | `apps/web/src/components/public/PersonalSection.tsx` |
| `MessageCardProps` | `apps/web/src/components/public/MessageCard.tsx` |
| `STABLE_KEY.*` assignment constants | `apps/web/src/lib/adapters/member-detail.ts`, `apps/api/src/testing/test-accounts/catalog.ts` |

### Visual Evidence Boundary

Local runtime screenshots were captured with the Playwright mock API. Staging seed apply and authenticated staging capture remain `pending_user_gate` because they require explicit user approval. Canonical Phase 11 paths are fixed and referenced here:

| Screenshot | Expected path | AC coverage | Status |
| ---------- | ------------- | ----------- | ------ |
| full profile | `outputs/phase-11/screenshots/member-detail-full.png` | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-9 | present local runtime screenshot |
| sparse profile | `outputs/phase-11/screenshots/member-detail-sparse.png` | empty-state behavior, hidden optional sections | present local runtime screenshot |
| message hidden | `outputs/phase-11/screenshots/member-detail-message-hidden.png` | AC-5 empty message non-rendering | present local runtime screenshot |

Local evidence currently consists of adapter/component contract tests, generated seed SQL, `outputs/phase-11/canonical-paths.json`, and the three Phase 11 PNG files above.
