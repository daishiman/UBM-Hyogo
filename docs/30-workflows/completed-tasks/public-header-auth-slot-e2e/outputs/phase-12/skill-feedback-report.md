# Phase 12 — Skill Feedback Report

## 1. aiworkflow-requirements skill へのフィードバック

| 観点 | フィードバック |
|------|----------------|
| storageState 生成パターン | `setup-auth.spec.ts` で 3 状態の storageState を一括生成する pattern は、本 workflow 以降の auth-aware e2e 全般で再利用可能。`.claude/skills/aiworkflow-requirements/references/` に追加検討候補 |
| dependencies project | playwright projects の `dependencies: ['setup-auth']` は新パターン。既存 `setup-authenticated-staging` と同系列だが、local 用は本 workflow が初出 |
| NON_VISUAL workflow 例 | 本 workflow は NON_VISUAL × 実装区分の単独例。既存の admin-tag-queue-ui-and-404-recovery 等は VISUAL_ON_EXECUTION なので新規例として有用 |

## 2. task-specification-creator skill へのフィードバック

| 観点 | フィードバック |
|------|----------------|
| 親 workflow の Task G を単体 workflow に昇格させる pattern | parent + dependent-task の構造を、dependent 側を独立 workflow 化することで Phase 12 strict 7 output / Gate-A 単独承認が可能になる。skill `parent-task-promotion` パターンとして追加候補 |
| matrix 検証の TC マトリクス記法 | Phase 4 §1 / Phase 7 §1 で routes × states 表を 2 種類書き分けた（TC ID 一覧 / マトリクス）。後者は coverage 可視化に強い。skill template に追加候補 |
| CONST_007 strict 遵守の具体例 | Phase 6 の expired JWT regression を `auth-slot-coverage.spec.ts` 内で既存 `signSessionJwt` API により本サイクル内で実装した。先送りしない good example として記録 |

## 3. 親 workflow `public-header-logged-in-nav-cleanup` へのフィードバック

| 項目 | 内容 |
|------|------|
| Task F の DoD 追記 | `data-route-group="admin"` の親 div に `data-auth-state="admin"` 属性を付与することを Task F の DoD に追加すべき。本 workflow の TC-A07 / TC-R03 がこの契約に依存 |
| Task A-F の DOM 契約集約ドキュメント | 4 つの `data-role` 値（`auth-cta` / `member-cta` / `admin-cta` / `public-return`）と 3 つの `data-auth-state` 値を 1 表に集約した SSOT を、親 workflow phase-2-design.md または specs/02-auth.md に配置することを提案 |
| `signSessionJwt` の expired JWT regression | 既存 `signSessionJwt` の `nowSeconds` / `ttlSeconds` 指定で expired cookie を生成できたため、新 helper は追加しない。Phase 6 TC-F02 は `auth-slot-coverage.spec.ts` で実装済み |

## 4. CLAUDE.md / 不変条件への影響

| 観点 | 内容 |
|------|------|
| 不変条件 #8（`*.spec.ts` のみ） | 本 workflow は完全遵守。`setup-auth.spec.ts` / `auth-slot-coverage.spec.ts` 双方 `.spec.ts` |
| ローカル `.env` AUTH_SECRET | 既存 `playwright-e2e-auth-secret-32-bytes` を継続使用。CLAUDE.md 「ローカル `.env` の運用ルール」遵守（実値は op 参照、ただし test 用 fixed secret は spec 内 literal で OK） |

## 5. lessons-learned 候補（実装 wave 完了後に追記）

| ID（暫定） | 内容 |
|-----------|------|
| L-AUTHSL-001 | parent workflow の dependent task を独立 workflow に昇格させる判断基準（NON_VISUAL × 横断検証 × 21+ TC） |
| L-AUTHSL-002 | playwright projects の `dependencies: ['setup-auth']` で storageState を 3 状態一括生成するパターン |
| L-AUTHSL-003 | `data-auth-state` literal 3 値を型レベル + assertion 両方で固定する DOM 契約検証 |
| L-AUTHSL-004 | redirect 期待を `/login(\?\|$)` regex で middleware/server guard 両対応 |
| L-AUTHSL-005 | CI matrix 追加時の `needs: smoke` + `if: github.event_name != 'schedule'` で既存 job 非破壊 |

## 6. アクション項目

| 項目 | 担当 | タイミング |
|------|------|-----------|
| 親 workflow Task F DoD 追記 PR / コメント | daishiman | 親 workflow 実装 wave 開始時 |
| skill `parent-task-promotion` パターン追加 | daishiman | 本 workflow 実装 wave 完了後 |
| lessons-learned L-AUTHSL-001..005 反映 | daishiman | 本 workflow 実装 wave 完了後 |
