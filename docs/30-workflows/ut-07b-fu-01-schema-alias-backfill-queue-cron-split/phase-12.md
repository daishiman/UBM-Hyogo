# Phase 12: ドキュメント更新

> **本仕様書は 300 行を超過する可能性があるが、implementation / 条件付き spec_created タスクで 6 必須タスクの構成が意味的に分割不可能なため例外条項を適用する**
> （`.claude/skills/task-specification-creator/references/phase-template-phase12.md` §「phase-12.md の 300 行上限と設計タスクの例外条項」準拠）。
> Phase 11 NON_VISUAL gate evidence と Phase 12 outputs を直列記述する必要があり、分散すると mirror parity 監査時の追跡コストが増大する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-05 |
| 前 Phase | 11（NON_VISUAL gate evidence） |
| 次 Phase | 13（PR 作成 / **user_approval_required = true**） |
| 状態 | spec_created（gate GO 時 implemented-local へ遷移 / NO-GO 時は spec_created 据え置き） |
| タスク分類 | implementation（条件付き） |
| 実装区分 | 実装仕様書 |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| workflow_state | gate GO: `implemented-local` / gate NO-GO: `spec_created` 据え置き / staging-deferred: `spec_created` 据え置き |
| user_approval_required | gate GO 時のみ true（Phase 13 の commit / push / PR 作成に必要） |
| GitHub Issue | #361（CLOSED のまま据え置き / 再 OPEN しない） |

---

## 目的

Phase 11 着手 gate 判定結果を踏まえ、本タスクの成果物を workflow-local 文書と aiworkflow-requirements skill indexes / `api-endpoints.md` / `database-schema.md` / `task-workflow-active.md` の参照導線へ反映する。

- gate GO 時: queue/cron 実装の正本契約（API response の `confirmed` / `backfill.status` 分離、Cloudflare binding、batch consumer 動作仕様）を反映する。
- gate NO-GO 時: 「実装不要」判断と Phase 11 evidence を記録し、再起動条件（CPU budget exhaustion 再発時）を残す。
- staging-deferred 時: credentials 取得後の再実行手順のみを記録し、aiworkflow-requirements 更新は最小限。

GitHub Issue #361 は **CLOSED のまま据え置き**。Issue ライフサイクルを再 OPEN せず、PR / 仕様書リンクを `gh issue comment` で残す形で履歴を完結させる。

---

## 必須 6 タスク（task-specification-creator skill 準拠 / phase-12-spec.md 準拠）

| # | Task ID | 成果物 | 欠落時の扱い |
| --- | --- | --- | --- |
| 1 | Task 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | FAIL |
| 2 | Task 12-2 | `outputs/phase-12/system-spec-update-summary.md`（Step 1-A/B/C） | FAIL |
| 3 | Task 12-3 | `outputs/phase-12/documentation-changelog.md`（最低 6 entry） | FAIL |
| 4 | Task 12-4 | `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**） | FAIL |
| 5 | Task 12-5 | `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須** / 3 観点固定） | FAIL |
| 6 | Task 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | FAIL |

加えて集約用の `outputs/phase-12/main.md` を含め、`outputs/phase-12/` 配下に **最低 7 ファイル** を実体配置する（Task 6 PASS 断言の前提）。

---

## workflow_state 取り扱い【最重要 / gate 分岐】

| gate 判定 | workflow_state | docsOnly | github_issue_state | Phase 13 |
| --- | --- | --- | --- | --- |
| GO | `implemented-local` | false | CLOSED | 実行（user_approval 必須） |
| NO-GO | `spec_created` 据え置き | false | CLOSED | no-op skip（再起動時に再実行） |
| staging-deferred | `spec_created` 据え置き | false | CLOSED | skip / credentials 取得後再着手 |

- `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい（NO-GO 時は `phases[10].status = completed-not-needed` / `phases[11].status = completed-not-needed` を許容）。
- `metadata.docsOnly` は **常に false**（gate GO 時は実コード変更を伴う / NO-GO 時も「実装不要」判定 evidence を残す implementation 系タスクのため docs-only ではない）。

---

## 実行タスク

- Task 12-1: 実装ガイド作成（Part 1 中学生 / Part 2 技術者 / gate 分岐対応）
- Task 12-2: システム仕様書更新（Step 1-A 正本同期 / 1-B indexes rebuild / 1-C コンプライアンス）
- Task 12-3: ドキュメント更新履歴（最低 6 entry / workflow-local + global skill sync 別ブロック）
- Task 12-4: 未タスク検出レポート（0 件でも出力必須 / 4 パターン照合 + 追加候補）
- Task 12-5: スキルフィードバックレポート（テンプレ改善 / ワークフロー改善 / ドキュメント改善 3 観点固定 / 改善点なしでも出力）
- Task 12-6: タスク仕様書コンプライアンスチェック（必須 7 ファイル × 各判定）
- Task 12-7: same-wave sync（aiworkflow indexes + 原典 unassigned + LOGS）
- Task 12-8: artifacts.json 同期（gate 判定に応じた状態遷移）
- Task 12-9: GitHub Issue #361 への comment（PR / 仕様書リンク） / reopen 禁止
- Task 12-10: Phase 11 gate 判定数値 / before-after evidence の implementation-guide Part 2 への転記

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 構造定義（6 必須タスク） |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | 漏れパターン |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | 実装ガイド執筆要領 |
| 必須 | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Step 1-A/B/C / same-wave sync |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md` | Phase 12 詳細テンプレ |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | implementation / spec_created 例外条項 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md` | 本 workflow 目次 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/` | gate evidence（GO / NO-GO / staging-deferred） |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/` | 親タスク Phase 12 完了状態 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API contract 正本（Step 1-A 同期先） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 正本（Step 1-A 同期先） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active task 一覧（Step 1-A 同期先） |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | spec sync root |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | keyword 索引 |
| 必須 | `docs/30-workflows/LOGS.md` | task-level LOGS 同期対象 |
| 必須 | `CLAUDE.md` | 不変条件 #5（D1 直アクセスは apps/api 限定）/ ブランチ戦略 / solo 運用 |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 想定影響 | 緩和策 |
| --- | --- | --- | --- |
| 1 | gate NO-GO 時の Phase 12 縮約方針（どこまで書くか）が曖昧 | 「実装不要」evidence が薄く、再起動時に判断材料が不足 | 縮約版テンプレを本 Phase に明示（implementation-guide は判断根拠記録のみ / aiworkflow-requirements 更新は不要記載のみ） |
| 2 | aiworkflow-requirements の `api-endpoints.md` に Cloudflare Queue / Cron の記述粒度が前例無く、表現ブレが起きる | 正本同期で表現不一致が発生し、後続タスクが参照できない | 親タスク 07b の `api-endpoints.md` 記述形式に厳密に揃える（HTTP status / body schema / retry metadata 三点固定） |
| 3 | `wrangler.toml` 変更（Queue / Cron binding 追加）が staging / production / CI variables / runbook で同期しないとドリフトする | binding 不一致で deploy 失敗 / 動作不能 | Step 1-A に「wrangler.toml 4 拠点同期チェック表」を含めて記録 |
| 4 | unassigned-task-detection で「queue dead-letter 監視 dashboard」「admin UI 進捗表示」など follow-up 候補が複数発生する | 過剰起票 / 起票漏れ | 「起票候補」と「記録のみ」を 2 段階に分け、Phase 11 evidence で必要性が確定したものだけを起票候補に格上げ |
| 5 | gate GO / NO-GO / staging-deferred の 3 分岐で artifacts.json の更新内容が異なる | 二重 ledger drift / workflow_state 誤更新 | 本 Phase に「gate 別 artifacts.json 遷移表」を必ず含めて記録 |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 6 必須成果物 + aiworkflow-requirements 同期で正本契約を最新化し、後続タスクが参照可能 |
| 実現性 | PASS | gate 3 分岐すべてで成果物配置が定義され、`mise exec -- pnpm indexes:rebuild` で indexes 再生成可能 |
| 整合性 | PASS | 親タスク 07b Phase 12 と章立てを揃え、Step 1-A/B/C / Step 2 判定 / same-wave sync を継承 |
| 運用性 | PASS | gate NO-GO 時の据え置き手順 / staging-deferred 時の再実行手順が明記され、再起動可能 |

---

## 受入条件

- AC-11 直結: 必須 7 ファイル（main + 6 必須成果物）が `outputs/phase-12/` に配置されている
- aiworkflow-requirements 4 references + indexes（quick-reference / keywords/*）が同期されている（gate GO 時）
- gate NO-GO 時は最小限の更新（不要記載のみ）で workflow_state を `spec_created` 据え置きとしている
- twin ledger（root artifacts.json と outputs/artifacts.json があれば）が drift 0
- GitHub Issue #361 が CLOSED のまま、本 Phase で `gh issue reopen` を実行していない

---

## 完了条件チェックリスト

- [ ] 必須 7 ファイル（main + Task 12-1〜12-6 成果物）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生 / 例え話 3 つ以上 / 専門用語セルフチェック）と Part 2（技術者）構成
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C が明記され、`mise exec -- pnpm indexes:rebuild` 実行ログが記録
- [ ] documentation-changelog で workflow-local 同期と global skill sync が別ブロック / 最低 6 entry
- [ ] unassigned-task-detection が 0 件でも出力され、4 パターン照合 + 追加候補（admin UI 進捗表示 / queue dead-letter 監視 dashboard 等）を記述
- [ ] skill-feedback-report が「テンプレ改善 / ワークフロー改善 / ドキュメント改善」3 観点で出力（改善点なしでも出力）
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（aiworkflow references + indexes + 原典 + LOGS.md）完了
- [ ] artifacts.json が gate 判定に応じた workflow_state を保持（GO=implemented-local / NO-GO=spec_created / staging-deferred=spec_created）
- [ ] `metadata.docsOnly = false` / `metadata.github_issue_state = "CLOSED"` を維持
- [ ] 不変条件 #5 遵守（queue consumer / cron handler / route / workflow / repository が `apps/api/` 配下に閉じる）
- [ ] GitHub Issue #361 を再 OPEN していない（`gh issue comment` のみで PR / 仕様書リンクを残す）
- [ ] index.md Decision Log に「Issue #361 を reopen せず UT-07B-FU-01 として独立タスク化する」根拠 1 段落明記
- [ ] Phase 11 の gate 判定数値（before/after evidence）が implementation-guide Part 2 に転記済（gate GO 時）

---

## 実行手順

### Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

1 ファイル内で **Part 1 + Part 2** を 2 部構成で記述する。

**Part 1（中学生レベル / 例え話 3 つ以上 / 専門用語回避）必須要件**:

- 「queue とは何か」を「給食配膳でクラス全員に配るタスクを、給食当番ノート（queue）に書き留めて、次のチャイム（次の Workers 起動）で続きから配る仕組み」と例える。
- 「なぜ batch 分割するのか」を「1 回の授業時間（CPU budget）で配り切れない人数なら、5 人ずつ（batch size）に分けて、1 限・2 限・3 限と継続する」と例える。
- 「cron との違い」を「queue は『未配膳がある人を見つけたらすぐ次へ』、cron は『毎日 12:00 に給食室をチェック』。残件があれば自動で続ける点は同じだが起動方法が違う」と例える。
- 専門用語セルフチェック: 「Cloudflare Queue」「Cron Trigger」「CPU budget」「idempotent」「remaining-scan」「back-fill」を使う場合は括弧書きで日常語を補う。

**Part 2（技術者レベル）必須要件**:

- 変更ファイル一覧（gate GO 時）:
  - `apps/api/wrangler.toml`（Queue / Cron binding 追加 / staging / production 両方）
  - `apps/api/src/workflows/schemaAliasAssign.ts`（alias 確定 + enqueue 分離）
  - `apps/api/src/workflows/schemaAliasBackfillBatch.ts`（新規 / queue or cron consumer）
  - `apps/api/src/routes/admin/schema.ts`（response contract: `confirmed` / `backfill.status` 分離）
  - `apps/api/src/repository/schemaDiffQueue.ts`（remaining-scan model + idempotent update）
  - 関連テスト（route / workflow / repository）
- API contract migration:

  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "confirmed": true,
    "backfill": {
      "status": "pending"
    }
  }
  ```

  `backfill.status` 値: `pending` | `running` | `exhausted` | `completed`

- Cloudflare binding 設定（`wrangler.toml`）の例 / staging vs production 差分:

  ```toml
  [[queues.producers]]
  binding = "BACKFILL_QUEUE"
  queue = "schema-alias-backfill-staging"

  [[queues.consumers]]
  queue = "schema-alias-backfill-staging"
  max_batch_size = 10
  max_batch_timeout = 5
  ```

- ローカル / staging 検証手順（`scripts/cf.sh` 経由 / `wrangler dev` フォールバック含む）。
- rollback 手順（binding 削除 → consumer デプロイ → 同期処理に戻す手順）。
- Phase 11 gate 数値（持続再現回数 / 平均 cpuTime / `backfill.status: completed` 収束時間）の転記表。
- 不変条件 #5 への適合: queue consumer / cron handler / repository / workflow / route がすべて `apps/api/**` 配下にあり、`apps/web` から D1 binding を直接参照しない。

**gate NO-GO 時の縮約版**:

- 「実装不要判定根拠」セクションのみ記載: Phase 11 before evidence の数値 / gate 基準 / 判定 / 再起動条件（CPU budget exhaustion 再発時）。
- Part 2 のコード変更一覧 / API contract migration / binding 設定は記述不要。

### Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

#### Step 1-A: aiworkflow-requirements 正本更新（gate GO 時）

| 同期対象 | 記述内容 |
| --- | --- |
| `references/api-endpoints.md` | `POST /admin/schema/aliases` の response を `confirmed` / `backfill.status` 分離契約に更新。`backfill.status` の状態遷移（pending → running → exhausted? → completed）を表形式で追記 |
| `references/database-schema.md` | `schema_diff_queue` の remaining-scan 利用方針 / idempotent update 条件を追記。schema 変更を伴わない場合はその旨明記 |
| `references/task-workflow-active.md` | UT-07B-FU-01 を completed task として登録（gate GO 時 implemented-local / merge 後 completed）。Phase 13 PR merge 後に `completed-tasks` 表記へ移行する旨明記 |
| `indexes/quick-reference.md` | UT-07B-FU-01 spec sync root 追加 |
| `indexes/keywords.json` | `queue` / `cron` / `backfill_continuation` / `confirmed_status` キーワード追加 |

#### Step 1-B: indexes rebuild

```bash
mise exec -- pnpm indexes:rebuild
```

実行ログ抜粋を `system-spec-update-summary.md` に記録。CI の `verify-indexes-up-to-date` gate を通過する状態であること。

#### Step 1-C: コンプライアンスチェック

- aiworkflow-requirements 4 references + indexes 同期完了
- `wrangler.toml` 4 拠点同期（staging / production / CI variables / runbook）チェック表
- 不変条件 #5 違反 0 件確認

**gate NO-GO 時の縮約版**: Step 1-A は「不要記載のみ」（更新箇所なし）、Step 1-B は indexes rebuild 実行不要、Step 1-C は本タスクで実装不要判定した旨のみ記録。

### Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

最低 6 entry（workflow-local / global skill sync 別ブロック）:

| 日付 | 変更種別 | 対象 | 変更概要 |
| --- | --- | --- | --- |
| 2026-05-XX | 新規 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` | 13 Phase + index + artifacts.json + outputs |
| 2026-05-XX | 履歴 | skill 履歴（task-specification-creator） | 6 必須タスク執筆要領の参照 |
| 2026-05-XX | 同期 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | response contract 更新 |
| 2026-05-XX | 同期 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | remaining-scan 利用方針追記 |
| 2026-05-XX | 同期 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | キーワード追加 |
| 2026-05-XX | 追記 | `docs/30-workflows/LOGS.md` | UT-07B-FU-01 close-out 行 |
| 2026-05-XX | outputs | `outputs/phase-11/` / `outputs/phase-12/` | gate evidence + 必須 7 成果物 |
| 2026-05-XX | system spec | `wrangler.toml` / runbook（gate GO 時） | binding 追加 |

> workflow-local / skill 正本 / skill 履歴 / reference / workflow artifacts / outputs / system spec の最低 6 entry を別ブロックで記録（[Feedback BEFORE-QUIT-003] 対策）。

### Task 12-4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`） / **0 件でも出力必須**

SF-03 4 パターン照合:

| パターン | 検出結果 | 委譲先 |
| --- | --- | --- |
| 型定義→実装 | gate GO 時: 0 件 / NO-GO 時: 0 件 | N/A |
| 契約→テスト | gate GO 時 0 件 / NO-GO 時 N/A | N/A |
| UI 仕様→コンポーネント | admin UI 進捗表示は本タスク対象外（UT-07B-FU-02 で扱う） | UT-07B-FU-02 |
| 仕様書間差異→設計決定 | 親タスク 07b と本タスクの differential（queue/cron 採用判断）は Phase 2 で吸収済 | 本タスク内 |

**追加検出（queue/cron 採用後の follow-up 候補）**:

| 検出項目 | 種別 | 委譲先 / 配置先 | 起票判断 |
| --- | --- | --- | --- |
| admin UI 進捗表示（`backfill.status` 受領時の UX） | UI | UT-07B-FU-02 / 既存タスク | 起票見送り（記録のみ） |
| queue dead-letter 監視 dashboard | 監視 | UT-08 監視タスク連動 | gate GO 後の運用観察次第（記録のみ） |
| 真 cursor semantics への移行 | 設計 | 別タスク化候補 | evidence 上必要時のみ（記録のみ） |
| 50,000 行以上の超大規模 fixture での挙動検証 | 検証 | 別タスク化候補 | 必要時のみ（記録のみ） |
| 本番 D1 への queue / cron binding 追加運用 runbook | 運用 | 本タスク Phase 5 runbook 内で吸収 | 吸収済 |

> 0 件パターンも「設計タスク 4 パターン照合済 / 検出 5 項目」を summary に明記。gate NO-GO 時は「queue/cron 採用後の follow-up は不要 / CPU budget exhaustion 再発時に本仕様書を再起動」を記録。

### Task 12-5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`） / **改善点なしでも出力必須 / 3 観点固定**

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善（task-specification-creator） | implementation × 条件付き spec_created（gate 判定で着手判断）パターンが phase-template に未収録 | gate 判定 Phase（Phase 11）と Phase 12 縮約版テンプレを references に追加 |
| ワークフロー改善 | gate NO-GO 時の据え置き手順（artifacts.json 触らない / Phase 13 skip）が暗黙 | NO-GO 時の workflow_state 据え置きルールを `spec-update-workflow.md` に追記 |
| ドキュメント改善（aiworkflow-requirements） | Cloudflare Queue / Cron binding 記述形式の前例不足 | Queue producer/consumer / Cron binding の記述テンプレを references に追加 |

> 改善点なしの場合も「観察事項のみ / なし」を 3 観点で必ず明記する。

### Task 12-6: タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル成果物が揃っている | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| implementation-guide が Part 1 / Part 2 構成 | Part 1 例え話 3 つ以上 + 専門用語セルフチェック済 | PASS |
| Step 1-A / 1-B / 1-C 記述 | spec-update-summary に明示 | PASS |
| same-wave sync 完了 | aiworkflow references + indexes + 原典 + LOGS | gate GO=PASS / NO-GO=N/A 明記 |
| 二重 ledger parity | root artifacts.json / outputs/artifacts.json drift 0 | PASS |
| workflow_state 整合 | GO=implemented-local / NO-GO=spec_created / staging-deferred=spec_created | PASS |
| `docsOnly=false` / `github_issue_state=CLOSED` | 維持 | PASS |
| 不変条件 #5 遵守 | queue consumer / cron handler / route / workflow / repository が `apps/api/` 配下に閉じる | PASS |
| 機密情報非混入 | 実 token / database_id / 実会員 PII 0 件 | PASS |
| Issue #361 再 OPEN 禁止 | `gh issue reopen` 不実行 / Decision Log 1 段落明記 | PASS |
| Phase 11 gate evidence 連動 | gate 判定が main.md に明記 / before-after 数値が implementation-guide Part 2 に転記済（GO 時） | PASS |
| Phase 13 連動 | gate GO 時 PR title `feat(api): UT-07B-FU-01 ...` / NO-GO 時 `docs(workflow): UT-07B-FU-01 spec_created with not-needed evidence` / `Refs #361` 採用 | PASS |

---

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須（gate GO） | 必須（gate NO-GO） |
| --- | --- | --- | --- |
| api-endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | YES | NO（不要記載のみ） |
| database-schema | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | YES | NO |
| task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | YES | YES（status 記録） |
| quick-reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | YES | NO |
| keywords | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | YES | NO |
| LOGS | `docs/30-workflows/LOGS.md` | YES（完了行追記） | YES（NO-GO 行追記） |

---

## 多角的チェック観点

- 価値性: gate GO 時の implementation-guide が後続実装者に十分か / gate NO-GO 時の判断根拠が再起動時の判断材料として十分か。
- 実現性: Step 1-A の `api-endpoints.md` / `database-schema.md` 反映が現行ファイル構造と整合（架空セクション名でないか）。
- 整合性: same-wave sync の aiworkflow indexes / 原典 status が最新コミットで一致するか。
- 運用性: unassigned-task-detection の委譲先が **既存タスク or 記録のみ** で、不要な新規起票が発生していないか。
- 認可境界: 実装ガイドの SQL / curl / wrangler 例が DB 直アクセスを `apps/api` に閉じる前提か / `wrangler` 直呼びを推奨していないか（`scripts/cf.sh` 経由）。
- Secret hygiene: ガイド内サンプルに実 database_id / 実 API token / 実会員データが含まれていないか。
- Issue ライフサイクル: GitHub Issue #361 が CLOSED のまま、本 Phase で `gh issue reopen` を実行しないこと。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide Part 1（中学生 / 例え話 3 つ以上） | 12 | spec_created | gate 分岐対応 |
| 2 | implementation-guide Part 2（技術者 / 変更ファイル一覧 / API contract / binding） | 12 | spec_created | gate GO 時 |
| 3 | system-spec-update-summary（Step 1-A/B/C） | 12 | spec_created | aiworkflow 4 references + indexes |
| 4 | documentation-changelog（最低 6 entry） | 12 | spec_created | workflow-local / global 別ブロック |
| 5 | unassigned-task-detection（4 パターン + 追加 5 項目） | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report（3 観点固定） | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-task-spec-compliance-check | 12 | spec_created | 12 項目 PASS |
| 8 | same-wave sync | 12 | spec_created | gate 判定別 |
| 9 | artifacts.json 同期（gate 別状態遷移） | 12 | spec_created | 必須 |
| 10 | Issue #361 comment（PR / 仕様書リンク） | 12 | spec_created | reopen 禁止 |
| 11 | Phase 11 gate 数値転記 | 12 | spec_created | implementation-guide Part 2 |

---

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 集約 | `outputs/phase-12/main.md` | Phase 12 index / 7 成果物ナビ / gate 判定結果サマリ |
| ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生）+ Part 2（技術者・gate 分岐対応） |
| サマリー | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C |
| 履歴 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル一覧（最低 6 entry / 別ブロック） |
| 検出 | `outputs/phase-12/unassigned-task-detection.md` | SF-03 4 パターン + 追加 5 項目（0 件でも出力） |
| FB | `outputs/phase-12/skill-feedback-report.md` | 3 観点固定（改善点なしでも出力） |
| 検証 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 12 項目 PASS 期待 |
| メタ | `artifacts.json`（root） | gate 別 workflow_state 更新 |

---

## タスク 100% 実行確認【必須】

- 全実行タスク（11 件）が `spec_created` で、Phase 完了時に `completed` へ更新可能な設計
- 必須 7 成果物が `outputs/phase-12/` に配置される設計
- gate 3 分岐（GO / NO-GO / staging-deferred）に応じた workflow_state 遷移が定義済
- artifacts.json の `metadata.docsOnly = false` / `metadata.github_issue_state = "CLOSED"` 維持
- 親タスク 07b Phase 12 の章立てに揃っている

---

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **gate GO 時 user_approval_required = true** / NO-GO 時 skip）
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection（追加 5 項目 / queue/cron 採用後の follow-up） → 関連タスクへの双方向リンク
  - workflow_state（GO=implemented-local / NO-GO=spec_created / staging-deferred=spec_created） / `Refs #361` 採用方針を Phase 13 PR body に明記
  - gate NO-GO 時は Phase 13 を no-op で skip し、再起動条件（CPU budget exhaustion 再発時）を `unassigned-task-detection.md` に記録
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了（gate GO 時）
  - 二重 ledger に drift がある
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった
  - GitHub Issue #361 を再 OPEN してしまった
  - PR body 草案に `Closes #361` を採用してしまった（→ Phase 13 で `Refs #361` のみ採用）
  - 不変条件 #5 違反（queue consumer / cron handler / route / workflow が `apps/api` 外に出ている）

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL gate evidence + before/after 数値を `implementation-guide.md` Part 2 に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 / compliance-check の PASS を承認ゲートに引き渡す |
| 関連タスク | UT-07B 親 / UT-07B-FU-02 / UT-07B-FU-03 / UT-07B-FU-04 の index.md を双方向更新 |
