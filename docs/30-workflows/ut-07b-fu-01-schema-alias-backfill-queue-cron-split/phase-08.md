# Phase 8: DRY 化 / 仕様間整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| GitHub Issue | #361（CLOSED 維持 / `Refs #361`） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-05-05 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| taskType | implementation（条件付き：staging 10,000+ rows evidence で着手判断） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **実装仕様書** |

## 目的

Phase 1〜7 で蓄積した設計入力（Queue vs Cron 採用判断 / batch contract / remaining-scan model / API contract `confirmed` 分離 + `backfill.status` 5 値 / wrangler.toml binding 仕様 / 異常系 / AC マトリクス）が、本タスク docs / 親タスク 07b 完了済 implementation-guide / `apps/api/src/workflows/schemaAliasAssign.ts` 周辺コード / `aiworkflow-requirements/references/*` の各正本に **重複転記** されていないかを単一正本観点で検証する。

本タスクは alias workflow を「単発 API 同期」から「alias 確定 + back-fill 継続（queue/cron 駆動）」の **二段化** に refactor する implementation タスクであり、二段化に伴い (1) 共通型 / SQL / helper の集約、(2) route layer / workflow layer / queue consumer 間で response 形状とエラーコードを単一 source-of-truth で扱うこと、(3) 命名規約 (`confirmed` / `backfill.status` / `backfill.remaining` / `backfill.lastProcessedAt`) を全層で一致、(4) 親タスク 07b との差分整理、(5) `aiworkflow-requirements` 差分の一意化、(6) shared 配置の影響評価、の 6 軸で DRY 化する。

ここでの drift を放置すると、Phase 11 の staging 10,000+ rows evidence 取得時に「どの contract / どの命名 / どの SQL が正本か」を判断する手間が生じ、Phase 12 system-spec-update-summary で 07b 完了済仕様の上書きや重複転記が発生する。

---

## 実行タスク

1. **値ドメインの single-source 化**: `backfill.status` 4 値 (`pending` / `running` / `exhausted` / `completed`) / failure code (`backfill_cpu_budget_exhausted` / `duplicate_enqueue_blocked` / `partial_failure_recovered`) / HTTP status (200 / 202 / 409 / 422) / response field (`confirmed` / `backfill.status` / `backfill.remaining` / `backfill.lastProcessedAt`) を **Phase 2 設計成果物（`outputs/phase-02/api-contract-design.md`）を唯一正本** とし、Phase 5 / 6 / 7 は link 参照のみとする（完了条件: 値リテラル再列挙 0）。
2. **共通型 / SQL / helper の集約方針確定**: `BackfillStatus` 型 / remaining-scan SQL / idempotent update helper を `apps/api/src/repository/schemaDiffQueue.ts` に集約する設計を Phase 2 で確定済みであることを再確認し、route layer (`apps/api/src/routes/admin/schema.ts`) / workflow layer (`apps/api/src/workflows/schemaAliasAssign.ts`) / queue consumer / cron handler の 4 箇所で同一 import を使う方針を Phase 5 runbook に link で集約する（完了条件: 4 箇所すべてが repository helper を呼び出す設計、SQL / 型の重複定義 0）。
3. **マッピング表の single-source 化**: 仕様語 ↔ 実装語対応表（`backfill.status` 仕様語 ↔ TS リテラル ↔ SQL リテラル ↔ Cloudflare Queue message field）が Phase 2 のみ正本、Phase 5 / 6 / 7 / 11 は link のみ（完了条件: 表の重複定義 0）。
4. **親タスク 07b 完了済成果物との差分整理**: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` と本タスク docs の重複箇所（`__extra__:<questionId>` 命名規約 / partial UNIQUE / `deleted_members` JOIN / `backfill_cursor` カラム / 既存 retryable 202 contract）を整理する（完了条件: 07b 既出事項は本タスク内では link 参照のみ、本タスク独自差分（Queue/Cron binding / 二段化 workflow / `confirmed` 分離 / queue consumer / cron handler）のみ全文記述）。
5. **`aiworkflow-requirements` への差分の一意化**: 本タスクで更新が必要な `references/api-endpoints.md` / `references/database-schema.md` / `references/task-workflow-active.md` / `references/cloudflare-bindings.md`（存在する場合）/ indexes に対する差分を `outputs/phase-08/main.md` 内で 1 表に集約する（完了条件: 差分追記の重複 0）。
6. **shared 配置（`packages/shared/src/types/zod`）への影響評価**: 本タスクは原則 `apps/api/**` に閉じる（不変条件 #5）。`BackfillStatus` enum / `confirmed` 分離 response body の型を `packages/shared` に配置するか follow-up かを評価する（完了条件: 「本タスクは apps/api 内 zod のみ。shared 配置は別タスクで判断」を base case として確定し、不変条件 #5 違反 0 を確認）。
7. **直交性確認**: 親タスク 07b 完了 / UT-04（D1 schema 設計）/ UT-07B-FU-02（admin UI retry/progress）/ UT-07B-FU-03,04（production migration apply 承認ゲート）/ 監視アラート follow-up に踏み込む記述が本タスクに混入していないか確認する（完了条件: 関連タスク 5 件すべてに「本タスクは含まない」セクションで境界明示）。
8. **navigation drift 確認**: `outputs/phase-XX/*.md` / `index.md` / `artifacts.json` / 親タスク 07b dir / `aiworkflow-requirements/references/*` / Issue #361 リンクの整合性を確認する（完了条件: リンク切れ 0）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md | AC / 不変条件 / 直交関係 |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md | 親タスク完了済仕様（重複転記禁止） |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md | 検出根拠（重複転記禁止） |
| 必須 | apps/api/src/workflows/schemaAliasAssign.ts | 現行 workflow（二段化 refactor 対象） |
| 必須 | apps/api/src/routes/admin/schema.ts | 現行 route（response 分離対象） |
| 必須 | apps/api/src/repository/schemaDiffQueue.ts | 共通 helper 集約先 |
| 必須 | apps/api/wrangler.toml | Queue / Cron binding 追加対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API contract 同期更新対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 同期更新対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | task workflow 同期更新対象 |
| 参考 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-08.md | DRY 化観点の参照事例 |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 影響範囲 | 緩和策 |
| --- | --- | --- | --- |
| 1 | Queue / Cron どちらを採用するかが Phase 2 で決定される構造のため、Phase 8 時点では「両案併記」と「採用案のみ」の中間状態が発生しやすく、DRY 化対象の値ドメイン（queue message field / cron schedule cron-string）を二重に列挙してしまうリスク | Phase 2 / Phase 5 / Phase 8 全体 | Phase 2 で採用案を確定した後、未採用案の記述を Decision Log に link 参照のみ残し本文から削除する手順を Phase 8 のステップ 1 に明記。両案併記が残る箇所は MINOR として記録 |
| 2 | `confirmed` / `backfill.status` / `backfill.remaining` / `backfill.lastProcessedAt` の 4 命名が route layer / workflow layer / queue consumer / cron handler / repository helper / test / `aiworkflow-requirements` の 7 箇所で一致する必要があり、文書 grep だけでは drift 検知が漏れる | 全 phase / コード / 正本 | Phase 9 で `rg "confirmed\|backfill\.status\|backfill\.remaining\|backfill\.lastProcessedAt" apps/api/src docs .claude/skills/aiworkflow-requirements/references` を機械検証として固定し、本 Phase ではチェックリストに 7 箇所の照合表を残す |
| 3 | 親タスク 07b 完了済 implementation-guide が partial UNIQUE / `backfill_cursor` カラム / retryable 202 contract を既に正本として持っており、本タスクの `backfill.status` 4 値（07b は cursor 中心）と整合する形で「拡張」として記述しないと、上書きと誤読される | Phase 1 / Phase 2 / Phase 8 | Phase 8 ステップ 4 で 07b 既出事項を link 参照のみとし、本タスク独自差分（二段化 / queue consumer / cron handler / `confirmed` 分離）だけ全文記述する境界を明示。Before / After 表で 07b 既出 / 本タスク独自差分を区別する |

---

## Before / After 比較テーブル

### 値ドメイン定義の重複

| 対象 | Before（仮想 drift） | After（本 Phase 確定） | 理由 |
| --- | --- | --- | --- |
| `backfill.status` 4 値（`pending` / `running` / `exhausted` / `completed`） | Phase 2 / 5 / 6 / 7 で個別列挙される可能性 | `outputs/phase-02/api-contract-design.md` 内 §仕様語実装語対応表のみが正本、他 Phase は link 参照 | implementation タスクの contract DRY は単一定義箇所が肝 |
| failure code（`backfill_cpu_budget_exhausted` / `duplicate_enqueue_blocked` / `partial_failure_recovered`） | Phase 2 / 5 api-contract / 6 failure-cases で再掲 | Phase 2 のみ正本、他は link | 後発 grep 漏れの根本対策 |
| HTTP status 4 ケース（200 confirmed / 202 running / 202 exhausted / 409 / 422） | Phase 2 / 5 / 7 で再掲 | Phase 2 のみ正本 | route test 観点も link 参照に統一 |
| response field 命名（`confirmed` / `backfill.status` / `backfill.remaining` / `backfill.lastProcessedAt`） | route / workflow / consumer / cron / test / 仕様で個別列挙 | Phase 2 contract design のみ正本、他は link | 7 箇所一致を担保 |
| Queue message schema（`{ revisionId, batchId, enqueuedAt }`）or Cron schedule（`*/5 * * * *` 等） | Phase 2 / 5 wrangler-runbook / 6 で再掲 | Phase 2 採用案のみ全文、未採用案は Decision Log に link 参照 | 両案併記による drift 防止 |

### 親タスク 07b 完了済仕様との差分整理

| 対象 | 07b 完了済 implementation-guide | 本タスク docs | DRY 方針 |
| --- | --- | --- | --- |
| `__extra__:<questionId>` 命名規約 | 全文記述（正本） | link 参照のみ | 07b 正本維持 |
| `deleted_members` JOIN soft-delete | 全文記述（正本） | link 参照のみ | 07b 正本維持 |
| `schema_questions` partial UNIQUE index | 全文記述（正本） | link 参照のみ | 07b 正本維持 |
| `schema_diff_queue.backfill_cursor / backfill_status` カラム | 全文記述（正本） | 「07b 正本を継続採用」記述 + 4 値拡張差分のみ | 07b 正本維持・本タスク独自差分のみ全文 |
| 既存 retryable 202 contract（`backfill_cpu_budget_exhausted`） | 全文記述（正本） | 「07b 正本を継続採用」記述 + `confirmed` 分離差分のみ | 同上 |
| **Cloudflare Queue / Cron binding 追加（新規）** | 未記述 | 本タスク Phase 2 binding-design.md / Phase 5 wrangler-runbook.md で全文記述（正本） | 本タスク独自差分 |
| **二段化 workflow（alias 確定 / back-fill 継続の責務分離）（新規）** | 未記述 | 本タスク Phase 2 workflow-split-design.md で全文記述（正本） | 本タスク独自差分 |
| **API response `confirmed` / `backfill.status` 分離（新規）** | 未記述 | 本タスク Phase 2 api-contract-design.md で全文記述（正本） | 本タスク独自差分 |
| **queue consumer / cron handler 実装（新規）** | 未記述 | 本タスク Phase 5 で実装手順、Phase 6 で異常系 | 本タスク独自差分 |
| **staging 10,000+ rows before/after evidence（新規）** | 未実施（Phase 11 で 100k 実測まで完了） | Phase 11 で着手 gate 判定根拠として使用 | 本タスク独自差分 |

### `aiworkflow-requirements` 同期更新対象（差分の一意化）

| 対象ファイル | 追記セクション | 追記内容 | 単一正本 |
| --- | --- | --- | --- |
| `references/api-endpoints.md` | `POST /admin/schema/aliases/apply` 応答仕様 | HTTP 4 ケース + `confirmed` / `backfill.status` 4 値 + failure code 3 種 | 本タスク Phase 2 api-contract-design.md からの転記のみ。Phase 12 で同期 |
| `references/database-schema.md` | `schema_diff_queue` 状態遷移補足 | 4 値遷移図（`pending` → `running` → `exhausted`/`completed`）+ idempotent remaining-scan note | 本タスク Phase 2 workflow-split-design.md からの転記のみ |
| `references/task-workflow-active.md` | UT-07B-FU-01 着手 gate 判定結果 | `not-needed` / `implemented` / `partial` のいずれかを Phase 12 で更新 | 本タスク Phase 11 evidence からの転記のみ |
| `references/cloudflare-bindings.md`（または equivalent） | Queue / Cron binding | binding 名 / staging / production / CI variables の対応 | 本タスク Phase 5 wrangler-runbook.md からの転記のみ |
| indexes（`.claude/skills/aiworkflow-requirements/indexes/*`） | 該当 index への新規エントリ | `backfill.status` / `confirmed` / `queue consumer` / `cron handler` / Issue #361 のキーワード追加 | 本タスク Phase 12 ドキュメント更新時に `pnpm indexes:rebuild` で再生成 |

### shared 配置（`packages/shared/src/types/zod`）への影響評価

| 対象 | 本タスクでの取り扱い | 不変条件 #5 整合 | follow-up 候補 |
| --- | --- | --- | --- |
| HTTP response body 型（`confirmed` / `backfill` フィールド） | `apps/api` 内 zod schema として定義 | apps/api 内に閉じる | admin UI 側で参照する場合は UT-07B-FU-02 で配置判断 |
| `BackfillStatus` enum 型 | apps/api 内に enum 定義 | apps/api 内に閉じる | 同上 |
| failure code enum | apps/api 内に enum 定義 | apps/api 内に閉じる | 同上 |
| Queue message schema 型 | apps/api 内 workflow / consumer 直近で定義 | apps/api 内に閉じる | shared 化不要（apps/web は queue を直接 produce/consume しない） |

> **base case**: 本タスクは `apps/api` 内 zod のみ。shared 配置は admin UI から参照する必要が確定した時点で UT-07B-FU-02 もしくは別タスクで判断する。これにより不変条件 #5 への影響をゼロに保つ。

---

## 重複削除の対象一覧

| # | 重複候補 | 削除方針 | 適用範囲 |
| --- | --- | --- | --- |
| 1 | `backfill.status` 4 値の列挙 | Phase 2 のみ正本、Phase 5 / 6 / 7 は link | 本タスク全 phase-XX.md |
| 2 | failure code 3 種 | Phase 2 のみ正本、他は link | 本タスク全 phase-XX.md |
| 3 | HTTP 4 ケース contract | Phase 2 のみ正本、他は link | 本タスク全 phase-XX.md |
| 4 | response field 命名（`confirmed` / `backfill.*`） | Phase 2 のみ正本、他は link | 本タスク全 phase-XX.md |
| 5 | Queue message schema or Cron schedule（採用案のみ） | Phase 2 のみ正本、Phase 5 wrangler-runbook は binding 適用手順のみ | 本タスク全 phase-XX.md |
| 6 | `__extra__:<questionId>` / partial UNIQUE / `backfill_cursor` カラム | 07b 完了済 implementation-guide のみ正本、本タスクは link | 本タスク全 phase-XX.md |
| 7 | 既存 retryable 202 contract | 07b 完了済 implementation-guide のみ正本、本タスクは「07b 正本を継続採用」+ `confirmed` 分離差分のみ | 本タスク Phase 1 / 2 / 5 |
| 8 | 直交関係表（07b 完了 / UT-04 / FU-02 / FU-03,04 / 監視 follow-up） | index.md のみ正本、各 phase は link のみ | 本タスク全 phase-XX.md |
| 9 | remaining-scan SQL | repository helper 1 箇所（`schemaDiffQueue.ts`）のみ正本、route / workflow / consumer / cron は呼び出しのみ | コード全層 |
| 10 | 着手 gate 判定（GO / NO-GO / PARTIAL） | index.md / Phase 10 / Phase 11 のみ正本、他 phase は link | 本タスク全 phase-XX.md |

---

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要参照` 表のパス | ls で照合 | 実在 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 親タスク 07b 完了 dir への参照 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/**` | 実在 |
| `aiworkflow-requirements` 正本ファイル参照 | `.claude/skills/aiworkflow-requirements/references/*` | 実在 |
| GitHub Issue link | Issue #361（CLOSED 状態のまま参照） | 実在 |
| 関連 follow-up タスク参照 | UT-07B-FU-02 / UT-07B-FU-03,04 / 監視 follow-up | 起票済みは link、未起票は「未起票（候補）」明記 |

---

## 共通化パターン

- implementation タスクでも contract / enum / status / SQL の **値ドメイン単一定義箇所** が DRY の本体。
- 同じ値リテラル / SQL を 2 箇所以上で記述したら必ず一方を link 参照に置き換える。
- 共通型 / SQL / helper は `apps/api/src/repository/schemaDiffQueue.ts` に集約し、route / workflow / queue consumer / cron handler は呼び出しのみに統一。
- 親タスク 07b の正本に既出の事項は本タスク内では link 参照のみ。
- `aiworkflow-requirements` への同期は Phase 12 で 1 回にまとめ、複数 Phase からの重複追記を避ける。
- 不変条件 #5 を侵さないため、shared 配置は本タスクで「先送り」明示。
- 関連タスクの責務（07b 既存実装 / UT-04 schema 設計 / FU-02 admin UI / FU-03,04 production gate / 監視）に踏み込まない。

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DRY 化により後続 Phase 11 / 12 着手時の「どの contract / 命名 / SQL が正本か」を即特定可能。`aiworkflow-requirements` 同期差分が 1 表に集約され、Phase 12 PR レビュー負荷が軽減 |
| 実現性 | PASS | implementation タスクであっても、契約文書 DRY は grep + 表化で完結。共通 helper 集約は repository 1 ファイルのみで完結 |
| 整合性 | PASS | 不変条件 #5 違反 0。shared 配置は follow-up 明示で apps/api 境界を維持。親タスク 07b との重複 0 |
| 運用性 | PASS | 命名一貫性で grep 検索性が向上。Phase 12 で `aiworkflow-requirements` 同期 PR を 1 回に集約。Queue / Cron 採用案が Phase 2 で確定すれば未採用案の DRY も完了 |

---

## 実行手順

### ステップ 1: 値ドメイン重複の洗い出し
- `rg "backfill\.status\|backfill_cpu_budget_exhausted\|duplicate_enqueue_blocked\|partial_failure_recovered\|confirmed" docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` を実行。
- Phase 2 以外で値リテラルが列挙されている箇所を表化し、link 参照へ書き換え方針を確定。
- Queue / Cron 両案併記が残る箇所は採用案を Phase 2 から確認し未採用案を Decision Log へ移動。

### ステップ 2: 共通型 / SQL / helper の集約方針確認
- `apps/api/src/repository/schemaDiffQueue.ts` に `BackfillStatus` 型 / remaining-scan SQL / idempotent update helper を集約する設計が Phase 2 で確定済みであることを確認。
- route / workflow / queue consumer / cron handler の 4 箇所すべてが repository helper を呼び出す方針を Phase 5 runbook で link 参照のみに統一。

### ステップ 3: 親タスク 07b 完了済仕様との重複洗い出し
- `rg "__extra__\|deleted_members\|partial UNIQUE\|backfill_cursor" docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` を実行。
- 07b 既出事項が本タスクに全文転記されていないか確認。

### ステップ 4: `aiworkflow-requirements` 差分の一意化
- 追記が必要な 4 ファイル（api-endpoints / database-schema / task-workflow-active / cloudflare-bindings）+ indexes の追記内容を `outputs/phase-08/main.md` 内 1 表に集約。
- Phase 12 同期 PR の入力として使用。

### ステップ 5: shared 配置の影響評価
- `BackfillStatus` enum / response body 型 / Queue message schema を列挙し「本タスクは apps/api 内のみ、shared 配置は follow-up」を base case として確定。
- 不変条件 #5 違反 0 を確認。

### ステップ 6: 直交性確認
- 関連タスク 5 件（07b 完了 / UT-04 / FU-02 / FU-03,04 / 監視）への責務侵食 0 を確認。

### ステップ 7: navigation drift 確認
- artifacts.json / index.md / 各 phase-XX.md / 親タスク dir / `aiworkflow-requirements/references/*` / Issue #361 リンクを照合。

### ステップ 8: outputs/phase-08/main.md に集約

---

## 多角的チェック観点

- **価値性**: DRY 化により後続 Phase の参照コストが削減され、Phase 12 同期差分が 1 表に集約。
- **実現性**: grep + 表化 + repository 集約で完結。新規ツールなし。
- **整合性**: 不変条件 #5 違反 0、親タスク 07b 完了済仕様の保護、`Refs #361`（CLOSED 維持）方針整合。
- **運用性**: 命名一貫性で grep 検索性が向上、`pnpm indexes:rebuild` で indexes 同期。
- **不変条件 #5**: `apps/api` 内に閉じる方針を DRY 化後も維持。
- **着手 gate 整合**: Phase 11 で実装続行 / 不要 / 範囲縮小のいずれが選ばれても DRY 化結果が再利用可能（実装不要時は本 Phase 結果を Phase 12 unassigned-task-detection に転用）。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 値ドメイン重複洗い出し（`backfill.status` / failure code / HTTP / response field） | 8 | spec_created | grep 結果を表化 |
| 2 | 共通型 / SQL / helper 集約方針確認（repository 1 箇所に統一） | 8 | spec_created | 4 layer 呼び出しのみ |
| 3 | 親タスク 07b 完了済仕様との重複洗い出し | 8 | spec_created | 独自差分のみ全文記述 |
| 4 | `aiworkflow-requirements` 差分の一意化 | 8 | spec_created | 4 ファイル + indexes を 1 表に集約 |
| 5 | shared 配置（`packages/shared/src/types/zod`）影響評価 | 8 | spec_created | apps/api 内のみを base case 確定 |
| 6 | 直交性確認（07b / UT-04 / FU-02 / FU-03,04 / 監視） | 8 | spec_created | 責務侵食 0 |
| 7 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 8 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・重複削除・親 07b 差分整理・aiworkflow-requirements 同期差分・shared 配置影響・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] `backfill.status` / failure code / HTTP status / response field 命名の値ドメイン定義の重複が 0（Phase 2 のみ正本）
- [ ] 共通型 / SQL / helper が `apps/api/src/repository/schemaDiffQueue.ts` 1 箇所に集約され、4 layer は呼び出しのみ
- [ ] 親タスク 07b 完了済 implementation-guide からの重複転記が 0（既出事項は link 参照のみ）
- [ ] `aiworkflow-requirements` への追記差分が 1 表に集約（重複 0）
- [ ] shared 配置（`packages/shared/src/types/zod`）への影響評価が「本タスクは apps/api 内のみ、shared は follow-up」で確定
- [ ] 不変条件 #5 違反 0
- [ ] 関連タスク 5 件（07b 完了 / UT-04 / FU-02 / FU-03,04 / 監視）への責務侵食 0
- [ ] navigation drift 0
- [ ] outputs/phase-08/main.md が作成済み

---

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 4 区分（値ドメイン / 親 07b 差分 / aiworkflow-requirements 同期 / shared 配置）で網羅
- 重複削除候補 10 件
- navigation drift 0
- 不変条件 #5 違反 0
- artifacts.json の `phases[7].status` が `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き継ぎ事項:
  - DRY 化済み単一正本 path 表（Phase 9 link 検証 / AC トレース表の前提）
  - 共通 helper 集約箇所（`apps/api/src/repository/schemaDiffQueue.ts`）
  - 親タスク 07b 完了済仕様との差分整理結果（本タスク独自差分のみが Phase 11 / 12 evidence の対象）
  - `aiworkflow-requirements` 同期差分 1 表（Phase 12 同期 PR 入力）
  - shared 配置 = follow-up 確定（不変条件 #5 維持）
  - 着手 gate 判定が Phase 11 で行われる前提で、本 Phase 結果は実装続行 / 不要 / 範囲縮小いずれの分岐でも再利用可能
- ブロック条件:
  - 値ドメイン or SQL が複数 Phase に重複定義されたまま
  - 親タスク 07b 完了済仕様を上書き / 全文転記している箇所がある
  - `aiworkflow-requirements` への追記差分が複数 Phase に分散
  - shared 配置判断が「未決」のまま Phase 9 に進む
  - 不変条件 #5 違反が検出される
  - navigation drift が 0 にならない

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済みの単一正本 path を品質保証 link 検証 / AC トレース表の前提に使用 |
| Phase 10 | navigation drift 0 / 親タスク 07b との差分整理完了を GO/NO-GO の根拠に使用 |
| Phase 11 | 着手 gate 判定 + before/after evidence の前提として contract 単一正本（Phase 2）を参照 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に DRY 化結果と `aiworkflow-requirements` 同期差分を反映 |
| 親タスク 07b 完了 | 07b 完了済仕様への上書きは行わず、本タスク独自差分のみを追記する境界を維持 |
| UT-04（関連） | D1 schema 設計の正本は UT-04 が保持、本タスクは `schema_diff_queue` 状態遷移補足のみ追記 |
