# Phase 10: 最終レビュー

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- 前提: Phase 1（AC-1..AC-9）/ Phase 2（util・component・CSS・projection 設計）/ Phase 3（設計レビュー GO）/ Phase 4（テスト計画）/ Phase 5-9（実装手順・テスト追加・カバレッジ・リファクタ・QA）
- workflow_state: `implemented_local_evidence_captured`（実コード実装・focused vitest・local visual PNG・Phase 12 同期まで完了。staging 視覚証跡・PR は user-gated）
- visualEvidence: `VISUAL`（local visual evidence は Phase 11 で取得済み。staging screenshot は user-gated）
- 本 Phase の責務: AC-1..AC-9 の最終トレースを現在事実で確定し、blocker 判定・consumer wiring の層断絶確認・MINOR 追跡・不変条件適合を再確認したうえで「local implementation PASS」を判定する。

## 目的

Phase 1〜9 の成果（要件・設計・テスト計画・カバレッジ・QA gate）と実コード差分が AC-1..AC-9 へ漏れなく trace され、local implementation と Phase 12 同期が完了していることを最終確認する。
視覚依存項目は Phase 11 の local PNG で確認済み、staging screenshot は Phase 13 の user-gated external ops として分離する。

## 実行タスク

### 1. AC-1..AC-9 最終トレース表（達成判定）

判定語彙:
- `implemented_verified`（実コード・focused test・仕様同期で達成確認済み）
- `staging_user_gated`（staging 視覚確認だけが user-gated で未実施）

| AC | 主担当の変更点 | 検証手段（Phase） | 判定 |
| --- | --- | --- | --- |
| AC-1 矢印正規化 | `tag-display.ts` `normalizeTagLabel`（`TAG_LABEL_OVERRIDES` code 駆動・label fallback） | `tag-display.spec.ts` PASS / TagPicker spec PASS | `implemented_verified` |
| AC-2 category 優先 + 除外 | `tag-display.ts` `selectCardTags`（`CARD_CATEGORY_ORDER` / `HIDDEN_CATEGORIES`） | `tag-display.spec.ts` PASS / MemberCard spec で region 非表示 | `implemented_verified` |
| AC-3 expand=tags wiring | `members-search.toApiQuery` に `params.set("expand","tags")` / home `/` query 文字列に `expand=tags` 追記 | `members-search.spec.ts` PASS / `page.tsx` diff | `implemented_verified` |
| AC-4 curated タグ chip 行 | `MemberCard.tsx` に `selectCardTags(member.tags, density)` 駆動の `data-role="tag-row"`/`"tag-chip"`（既存 span 流儀・新規 primitive なし） | `MemberCard.spec.tsx` PASS / Phase 11 local PNG | `implemented_verified`（staging は `staging_user_gated`） |
| AC-5 businessSummary | zod optional 追加 → view-model 透過 → `list-public-members.toBusinessSummary`（先頭1行・120字）→ `MemberCard` `biz-summary` 行 clamp2 | `list-public-members.spec.ts` PASS + `MemberCard.spec.tsx` PASS + Phase 11 local PNG | `implemented_verified`（staging は `staging_user_gated`） |
| AC-6 occupation 強調 + region 排除 | `selectCardTags` の `HIDDEN_CATEGORIES`（region 除外）+ CSS occupation 強調 | `tag-display.spec.ts` PASS / MemberCard spec PASS / Phase 11 local PNG | `implemented_verified`（staging は `staging_user_gated`） |
| AC-7 TagPicker 正規化 | `TagPicker.client.tsx` の topTags chip を `#{normalizeTagLabel(opt)}` に置換（AC-1 と util 共有） | `TagPicker.client.spec.tsx` PASS | `implemented_verified`（staging は `staging_user_gated`） |
| AC-8 token 厳守 | `legacy-public.css` の tag chip / biz-summary / occupation 強調を既存 `var(--ubm-*)` のみで記述 | `verify:tokens` + grep gate（Phase 9 タスク 3） | `implemented_verified` |
| AC-9 endpoint surface 不変 | `apps/api` 変更を projection + focused spec に限定・migration 追加 0・route surface 不変 | `git diff --name-only -- apps/api`（Phase 9 タスク 4） | `implemented_verified` |

> AC-4/5/6 の local 表示は Phase 11 local PNG で確認済み。staging 表示と PR 操作は Phase 13 の user-gated 境界として残す。

### 2. blocker 判定

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| blocker | **なし** | 全 AC が既存資産（`expand=tags` 実装済み / businessOverview 既存カラム / Chip・ChipTone・既存 CSS chip スタイル）の接続・表現で達成可能。新 endpoint / D1 schema / Form 変更は不要。依存順序（B3 zod 先行 → A2/B1 並行）が確定し循環なし。1 実装サイクルで完結（AC-9 / CONST_007） |

### 3. consumer wiring の層断絶確認（[FB-CANCEL-004-1]）

zod 型 → view-model → use-case → web カード表示 → CSS の各層が連結し、途中で断絶が無いことを確認する。

| 層 | 変更点 | 下流への受け渡し | 断絶なし確認 |
| --- | --- | --- | --- |
| 1. zod 型（`packages/shared/.../viewmodel.ts`） | `PublicMemberListItemZ` に `businessSummary: z.string().optional()` 追加（`.strict()`） | 型 `PublicMemberListItem` に `businessSummary?` が現れる | ✅ optional 追加しないと API が business を返した瞬間 `.strict()` parse 落ち → **必ず先行確定**（Phase 2 依存順序） |
| 2. view-model（`apps/api/.../public-member-list-view.ts`） | source 型に `businessSummary?: string` 追加・透過（undefined は出力しない） | view 出力に `businessSummary` が乗る | ✅ truncate せず透過（projection は use-case 責務）。型は層 1 の zod と一致 |
| 3. use-case（`apps/api/.../list-public-members.ts`） | `SUMMARY_KEYS` に `businessOverview` 追加 + `toBusinessSummary`（先頭1行・120字） | item に `businessSummary` が構築される | ✅ `SUMMARY_KEYS` filter（L112）を通過し取得 → truncate → item へ。businessOverview は `ubm_profile` public 項目（visibility 前提を Phase 5 で field schema 確認） |
| 4a. web 取得 wiring | `/members` は `toApiQuery` に `expand=tags` 付与（`listMembers`）。home `/` は `listMembersRaw("limit=6&sort=recent&expand=tags", …)` | API レスポンスに `tags[]` + `businessSummary` が乗る | ✅ home は `listMembersRaw` 経由（Phase 3 MINOR M-1 で実確認済の前提）→ query 文字列に直接 `expand=tags` を追記。`/members` は schema 非変更で `toApiQuery` 末尾 1 行 |
| 4b. web カード表示（`MemberGrid` → `MemberCard`） | `MemberGrid` が `member`（`PublicMemberListItem`）+ `density` を `MemberCard` へ渡す。`MemberCard` が `selectCardTags(member.tags, density)` + `member.businessSummary` を描画 | DOM に `tag-row`/`tag-chip` + `biz-summary` が出る | ✅ `MemberGrid` は既に `items.map((m) => <MemberCard member={m} density={density} />)` の形（grounded fact 確認済）→ props 受け渡しは既存配線を流用・断絶なし |
| 5. CSS（`legacy-public.css`） | `[data-component="member-card"]` に `tag-row`/`tag-chip`/`biz-summary`/occupation 強調を既存トークンで追記 | 視覚表現が出る | ✅ DOM の `data-role` 属性に対する CSS セレクタが既存 zone/status と同流儀で連結。効きは Phase 11 視覚で確認 |

> **層断絶なし**: zod optional（層1）→ view-model 透過（層2）→ use-case 構築（層3）→ web 取得（層4a）→ カード描画（層4b）→ CSS（層5）が連結。tags 系も `expand=tags`（層4a）→ `selectCardTags`（層4b）→ `tag-chip` CSS（層5）で連結。**唯一の構造的注意点 = home `/` が `listMembers` ではなく `listMembersRaw` 経由**（Phase 3 MINOR M-1）であり、ここを実装時に query 文字列で `expand=tags` 付与しないとカードに tags が到達しない（断絶リスク）。Phase 5 実装で明示配線する。

### 4. Phase 3 由来の MINOR 追跡テーブル

Phase 3 設計レビュー §3.3 で MINOR M-1 / M-2 / M-3 を記録済み。いずれも本サイクル内吸収＝未タスク化不要。

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 解決方法 | ステータス |
| --- | --- | --- | --- | --- | --- |
| M-1 | home `/` が `listMembers` か `listMembersRaw` かを実装時に実確認 | Phase 5 | Phase 9 / 10 | grounded fact で `listMembersRaw("limit=6&sort=recent", …)` と確定済。query 文字列に `expand=tags` を追記して配線（本 §3 層 4a） | 本サイクル内吸収（解決方法確定） |
| M-2 | businessOverview の visibility=public を field schema で実確認 | Phase 5 | Phase 9 | `ubm_profile` public 項目。非 public 判明時は projection 分岐を入れる（設計済） | 本サイクル内吸収 |
| M-3 | `selectCardTags` の business/skill 並びは code 昇順（将来「件数順」は YAGNI） | — | — | 本タスクでは code 昇順で確定。件数順は未タスク化せず YAGNI | 本サイクル内吸収（範囲外） |

> MINOR は M-1/M-2/M-3 の 3 件で、すべて **本サイクル内で吸収**（実装で解決 or YAGNI で範囲外）。**未タスク（バックログ）化は不要**。この一致を Phase 12（`phase12-task-spec-compliance-check.md` / `phase-12-documentation.md` の MINOR 追跡テーブル / `unassigned-task-detection.md`）で確認する。Phase 10 で新たな MINOR が出た場合のみ Phase 12 の未タスク検出へ渡す方針とする（現状 M-1/M-2/M-3 は渡さない）。

### 5. 不変条件の最終適合確認（CLAUDE.md / mvp-recovery）

| 不変条件 | 最終判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ接続・endpoint 追加 / D1 / Form 変更禁止（mvp-recovery） | ✅ 適合 | `businessSummary` は既存 endpoint の projection 追加（surface 不変）。`expand=tags` は既存実装。新 endpoint / migration / Form 変更なし。AC-9 で `git diff --name-only -- apps/api` を projection 限定 gate |
| #2 OKLch トークン正本・HEX 直書き禁止 | ✅ 適合 | 追加 CSS は全色 `var(--ubm-color-*)` 経由。新色トークン・新 tone 追加なし（`phaseTone` は既存 `ChipTone` のみ返す）。AC-8 で `verify:tokens` + grep gate |
| #3 新規 primitive を生やさない（mvp-recovery） | ✅ 適合 | tag chip は既存 zone/status の `data-role` span 流儀を流用。新規実装は純関数 util `tag-display.ts` のみ。新規 React component 0 |
| #5 D1 直接アクセスは apps/api に閉じる | ✅ 適合 | web は API 経由のみ。本タスクで新規 D1 アクセス追加なし |
| #8 test は `*.spec.{ts,tsx}` のみ | ✅ 適合 | 新規 test は `tag-display.spec.ts` / `MemberCard.spec.tsx` / `list-public-members.spec.ts`。`*.test.*` 不使用 |
| #9 admin form input は FormField 経由 | ✅ 影響なし | 本タスクは公開カード表示で form input を追加しない |

### 6. 実装サイクルで green 化済みの項目

| 対象 | 実装前の状態 | green 化済みの実装 | 対応 AC |
| --- | --- | --- | --- |
| `tag-display.ts`（新規） | ファイル未存在 | `normalizeTagLabel` / `selectCardTags` / `phaseTone` を新規作成 | AC-1/2/4 |
| `MemberCard.tsx` | タグ未描画・biz-summary 行なし | `tag-row`/`tag-chip` + `biz-summary` 行 + occupation 強調 class を追加 | AC-4/5/6 |
| `TagPicker.client.tsx` | topTags が raw label（`0 to 1`） | `#{normalizeTagLabel(opt)}` に置換 | AC-7 |
| `members-search.ts` / home `/` page | `expand=tags` 未付与 | `toApiQuery` 末尾に付与 + home query 文字列に追記 | AC-3 |
| `list-public-members.ts` | `SUMMARY_KEYS` に businessOverview なし | businessOverview 追加 + `toBusinessSummary` 追加 | AC-5/9 |
| `public-member-list-view.ts` / `viewmodel.ts` | `businessSummary` 型なし | source 型 + zod optional 追加 | AC-5 |
| `legacy-public.css` | tag chip / biz-summary / occupation 強調 CSS なし | `[data-component="member-card"]` に既存トークンで追記 | AC-4/5/6/8 |

> いずれも `apps/web` + `apps/api` projection + `packages/shared` zod に閉じ、1 実装サイクルで green 化済み（B3 zod 先行 → A2/B1 並行）。focused vitest / token / phase12 / gate-metadata で確認する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-1-requirements.md` | AC-1..AC-9 定義・根本原因 |
| 設計正本 | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-2-design.md` | util / component / CSS / projection 設計 |
| 設計レビュー | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-3-design-review.md` | MINOR M-1/M-2/M-3・不変条件適合・GO 判定 |
| カバレッジ | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-7-coverage.md` | concern×edge 表・閾値 |
| リファクタ | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-8-refactor.md` | navigation drift なし確認 |
| QA | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-9-qa.md` | gate・検証コマンド・AC マッピング |
| artifacts | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/artifacts.json` | gates / phase 状態 |

### システム仕様（aiworkflow-requirements）

> 実装着手時に以下のシステム仕様を再確認し、既存設計との整合性を維持する。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | 公開ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 10 仕様書 | 文書 | AC-1..AC-9 最終トレース・blocker 判定・consumer wiring 層断絶確認・MINOR 追跡・不変条件適合・green 化対象一覧 |
| 最終判定 | 判定 | local implementation PASS（external ops は user-gated） |

## 統合テスト連携

- 本 Phase の AC トレースが Phase 12 `phase12-task-spec-compliance-check.md` の 4 条件 verdict / AC trace 節と一致すること。
- MINOR M-1/M-2/M-3（本サイクル内吸収・未タスク化不要）が Phase 3 → Phase 10 → Phase 12 `unassigned-task-detection.md` で一貫していること。
- consumer wiring 層断絶確認（[FB-CANCEL-004-1]）の「home `/` は `listMembersRaw` 経由」が Phase 5 実装手順で明示配線されること。
- Phase 11（視覚）の local PNG captured と staging user-gated 境界が Phase 13 へ引き継がれること。

## 最終判定

**local implementation PASS（external ops は user-gated）**。

- AC-1..AC-9 がすべて `implemented_verified` として trace 済み。staging 視覚依存（AC-4/5/6/7）は Phase 13 user-gated として境界化。
- **blocker なし**。
- consumer wiring（zod 型 → view-model → use-case → web 取得 → カード描画 → CSS）の層断絶なしを確認。home `/` の `listMembersRaw` 経由配線は `expand=tags` 追記で解決済み。
- MINOR M-1/M-2/M-3 は本サイクル内吸収（未タスク化不要）。Phase 10 で新規 MINOR は発生せず。
- 不変条件 #1/#2/#3/#5/#8/#9 に最終適合。

## 完了条件

1. AC-1..AC-9 が判定語彙（`implemented_verified` / `staging_user_gated`）で trace され、local implementation が完了していることが確認されている。
2. blocker 判定（なし）が記録されている。
3. consumer wiring の層断絶確認（[FB-CANCEL-004-1]：zod型→view-model→use-case→web カード表示→CSS）が記録され、断絶リスク（home `/` の `listMembersRaw` 経由配線）が明示されている。
4. MINOR M-1/M-2/M-3 が本サイクル内吸収（未タスク化不要）として追跡され、Phase 3 と一致している。Phase 10 新規 MINOR の有無と Phase 12 未タスク検出への引き渡し方針が記載されている。
5. 不変条件 #1/#2/#3/#5/#8/#9 の最終適合が確認されている。
6. 最終判定が「local implementation PASS（external ops は user-gated）」であること。
