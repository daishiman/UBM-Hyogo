# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (NON_VISUAL 手動検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | infrastructure-verification（docs-only） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（**docs-only タスクのため `completed` への書き換えは禁止**・据え置きルール厳守） |
| user_approval_required | false |
| GitHub Issue | #246（CLOSED 状態のままで OK・本タスクは spec_created） |

## 目的

UT-06-FU-A-PROD-ROUTE-SECRET-001 の Phase 1〜11 成果物を、workflow-local 文書と `.claude/skills/aiworkflow-requirements/references/` / CLAUDE.md / 親 UT-06-FU-A runbook に反映する。本タスクは **docs-only** スコープに閉じており、production deploy / 実 secret 再注入 / DNS 切替を一切伴わない。Phase 12 必須 5 タスクと正本 7 成果物を完了し、Phase 13（PR 作成）の前提を整える。

## workflow_state 取り扱い【重要 / docs-only 据え置きルール】

- 本タスクは `taskType=docs-only` / `visualEvidence=NON_VISUAL` であり、本 PR で commit するのは workflow 配下の仕様書および runbook のみ。
- `apps/web/wrangler.toml` への変更や production secret 再注入、Worker deploy は **本 PR に含めない**。
- そのため Phase 12 完了後も:
  - `artifacts.json`（root）の `metadata.workflow_state` は **`spec_created` を維持**する（`completed` に書き換えない）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly` は **true**。
- 実 deploy 検証フェーズで初めて `workflow_state = implementation_ready` → `implemented` へ昇格する（本タスクのスコープ外）。
- 参照: `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`「設計タスクの workflow root を completed にしてしまう」漏れパターン。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **Task 12-1 実装ガイド作成（Part 1: 中学生レベル / Part 2: 技術者レベル）** — `outputs/phase-12/implementation-guide.md`
2. **Task 12-2 システム仕様書更新（Step 1-A / 1-B / 1-C + Step 2 据え置き）** — `outputs/phase-12/system-spec-update-summary.md`
3. **Task 12-3 ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **Task 12-4 未タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **Task 12-5 スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン / 据え置きルール |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 正本 / scope / AC1〜AC5 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md | 本タスクの中核成果物（runbook） |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/main.md | NON_VISUAL evidence サマリー |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Wrangler / D1 / Worker 操作正本（Step 1-A の主同期先） |
| 必須 | CLAUDE.md | scripts/cf.sh ルール / 不変条件 |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親タスク runbook（cross-link 対象） |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-12.md | 構造リファレンス |

## Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` に以下 2 パートを 1 ファイルで記述する。

### Part 1: 中学生レベル概念説明（日常の例え話 4 つ以上必須）

**章立て**:

1. **Cloudflare Worker とは何か**
   - 例え話 1: 「学校の保健室の先生のように、訪問者（リクエスト）に応じて毎回処方（レスポンス）を返す係。Cloudflare の世界中の保健室に同じ先生が配置されていて、近い保健室から答えてくれる」
2. **Worker の名前を変えるとどうなるか（split-brain のリスク）**
   - 例え話 2: 「保健室の表札を『新・保健室』に変えても、廊下の道しるべ（route）が古い保健室を指したままだと、生徒は古い保健室に行ってしまう」
   - 例え話 3: 「新しい保健室には鍵束（secret）がまだ届いていない。古い保健室の鍵束をそのまま渡さないと、新しい先生はカルテ（DB）を開けない」
3. **route とは / custom domain とは**
   - 道しるべと校門の表札の違いとして説明。
4. **secret とは**
   - 例え話 4: 「鍵束は先生（Worker）ごとに保管庫が分かれていて、自動コピーされない。引っ越し時は手で持っていく必要がある」
5. **observability（Tail / Logs / Analytics）とは**
   - 例え話 5: 「保健室カメラ（Tail）が古い保健室を映していたら、新しい保健室で何が起きても気付けない。カメラの向きを新しい保健室に合わせる作業が必要」
6. **なぜ runbook が必要か**
   - 「引っ越しのたびに『鍵束を持っていく』『道しるべを書き換える』『カメラの向きを直す』を毎回ゼロから考えると忘れる。チェックリスト化することで、誰がやっても抜けない」

### Part 2: 技術者向け実装ガイド

**章立て**:

1. **コマンド一覧**（CLAUDE.md 準拠 / すべて `bash scripts/cf.sh` 経由）:
   - `bash scripts/cf.sh whoami`
   - `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production`
   - `bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production`
   - `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production`
   - `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`（**本タスクスコープ外・参考表示のみ**）
2. **dry-run 順序**:
   - P1 認証確認（whoami のみ）
   - P2 route / custom domain 突合（API or ダッシュボード参照、転記時 Zone ID マスク）
   - P3 secret snapshot（list 出力 → key 名のみ記録）
   - P4 secret 再注入（不足分のみ・**deploy 承認後の別オペレーション**）
   - P5 observability 設定確認（Logpush / Tail / Analytics）
   - P6 deploy 直後 tail 観測（**deploy 後の別オペレーション**）
   - P7 旧 Worker 処遇判断記録
3. **旧 Worker 処遇判断ロジック**:
   ```
   IF 新 Worker 安定運用 N 日 < N THEN 残置（rollback 余地確保）
   ELSE IF 旧 Worker に紐付く route が 0 THEN 無効化候補
   ELSE 残置 + route 移譲計画を runbook に追記
   ```
4. **rollback 戦略**:
   - 新 Worker で障害発生時、ダッシュボード or `bash scripts/cf.sh rollback <VERSION_ID>` で前バージョンへ rollback
   - 旧 Worker は **削除しない**ため、最悪 route 切り戻しも選択肢として残る
5. **Secret hygiene 厳守**:
   - 値は op 経由のみ・`.env` Read 禁止・ログ転記禁止
6. **wrangler 直接実行禁止**:
   - すべて `bash scripts/cf.sh` 経由（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）

### Task 12-1 完了条件

- [ ] Part 1 / Part 2 構成
- [ ] Part 1 に日常の例え話が 4 つ以上
- [ ] Part 2 のコマンドが全て `bash scripts/cf.sh` 経由
- [ ] rollback 戦略 / 旧 Worker 処遇判断ロジック / Secret hygiene が記述

### Task 12-1 漏れやすいポイント

- 例え話を「技術用語の言い換え」で終わらせず、必ず日常物（保健室・道しるべ・鍵束・カメラなど）に置き換える
- Part 2 で `wrangler` 直呼びサンプルを書かない（CLAUDE.md 違反）
- deploy / secret put を「本タスクで実行する」と誤記しない（スコープ外）

---

## Task 12-2: システム仕様書更新

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

### Step 1-A: aiworkflow-requirements への追記方針

`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` への追記方針を記述する:

| 同期対象セクション | 記述内容 |
| --- | --- |
| production Worker 名 | `apps/web` の production Worker 名は `ubm-hyogo-web-production`（`apps/web/wrangler.toml [env.production].name`）と明記 |
| route / custom domain 検証フロー | deploy 承認直前のチェックリスト導線として本 runbook へ link |
| secret 検証フロー | `bash scripts/cf.sh secret list --env production` の利用例（key 名のみ記録ルール） |
| observability 検証フロー | `bash scripts/cf.sh tail --env production` の利用例（マスク方針） |
| 旧 Worker 処遇 | 安定確認まで残置（rollback 余地）の指針 |

> **注**: 本 Phase 12 では「追記方針」を `outputs/phase-12/system-spec-update-summary.md` に記述するに留める。実際の `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` への書き込みは別 PR / 後続タスクで実施する（docs-only スコープ維持のため）。

### Step 1-B: CLAUDE.md「Cloudflare 系 CLI 実行ルール」セクションとの cross-link

- 本 runbook 冒頭で「すべて `bash scripts/cf.sh` 経由」を再宣言し、CLAUDE.md「Cloudflare 系 CLI 実行ルール」へ link する。
- CLAUDE.md 側からも本 runbook への参照導線を追加する追記方針を記録（実書き込みは別 PR）。

### Step 1-C: 親 UT-06-FU-A runbook との link

- 親タスク（`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`）の runbook から本タスクへの双方向 link を追記する方針を記録。
- 親タスク側 Phase 12 unassigned-task-detection（UNASSIGNED-FU-A-002）の起票が本タスクの発生原因であることを明示。

### Step 2: docs-only 据え置きルール明記

> **本タスクは spec_created の close-out のため、`workflow_state` は `completed` に書き換えない。**

- `taskType=docs-only` / `visualEvidence=NON_VISUAL` の本タスクは:
  - `metadata.workflow_state = "spec_created"` を **維持**
  - `metadata.docsOnly = true` を **維持**
  - `phases[*].status` は完了に応じて `completed` に更新可
- 新規 TypeScript インターフェース / API endpoint / IPC 契約の追加なし → Step 2 本来の「契約同期」は **N/A**
- ただし aiworkflow-requirements `deployment-cloudflare.md` への DDL 風追記方針（Step 1-A）は本タスク内で記述

### Task 12-2 完了条件

- [ ] Step 1-A に同期対象 5 項目の追記方針が記述
- [ ] Step 1-B に CLAUDE.md cross-link 方針が記述
- [ ] Step 1-C に親 UT-06-FU-A 双方向 link 方針が記述
- [ ] Step 2 で docs-only 据え置きルールが明記
- [ ] `workflow_state = "spec_created"` 維持の明示

### Task 12-2 漏れやすいポイント

- 「実書き込み」と「追記方針記述」を混同しない（本 Phase は方針記述のみ）
- workflow_state を `completed` に書き換えてしまう（phase-12-pitfalls.md 漏れパターン）
- Step 2 を「N/A」とだけ書いて理由を省略しない

---

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記述する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 | reviewer |
| --- | --- | --- | --- | --- |
| 2026-04-30 | 新規 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | UT-06-FU-A-PROD-ROUTE-SECRET-001 仕様書 13 Phase + index + artifacts.json | @daishiman |
| 2026-04-30 | 新規 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md | production deploy 承認直前チェックリスト runbook | @daishiman |
| 2026-04-30 | 新規 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/ | NON_VISUAL 代替 evidence E-1〜E-7 | @daishiman |
| 2026-04-30 | 更新方針記録 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | production Worker 名 / route / secret / observability 検証フロー追記方針（実書き込みは別 PR） | @daishiman |
| 2026-04-30 | 更新方針記録 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | 本 runbook への cross-link 追記方針 | @daishiman |
| 2026-04-30 | 更新方針記録 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親タスク runbook 双方向 link 追記方針 | @daishiman |
| 2026-04-30 | 状態更新 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | ステータスを `spec_pending` → `spec_created` に更新 | @daishiman |

### Task 12-3 完了条件

- [ ] 更新ファイル一覧 / 変更概要 / reviewer / 更新日 2026-04-30 が記述
- [ ] workflow-local 同期と global skill / CLAUDE.md 追記方針が別ブロックで記録

### Task 12-3 漏れやすいポイント

- 「実書き込み」ではない「追記方針記録」を混在させて変更日付がずれる
- reviewer 欄を空にする（solo dev でも `@daishiman` を明記）

---

## Task 12-4: 未タスク検出レポート（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。本タスク実行で派生する候補を最低 1〜3 件記述する（または「現時点で 0 件」を明示）。

### 検出候補（推奨記載）

| 検出 ID（候補） | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| UNASSIGNED-FU-A-PROD-ROUTE-001 | 自動化 | DNS 切替（custom domain 切替）の自動化 | UT-16（既存）または新規 unassigned |
| UNASSIGNED-FU-A-PROD-ROUTE-002 | 自動化 | route 自動 inventory スクリプト化（API 経由で対象 Worker 名を一覧化） | 新規 unassigned（infrastructure-automation） |
| UNASSIGNED-FU-A-PROD-ROUTE-003 | 検証自動化 | Logpush ターゲット差分検証スクリプト化（旧/新 Worker の dataset binding 突合） | 新規 unassigned（observability-automation） |

### 0 件記載のフォーマット（該当時のみ使用）

> 現時点で 0 件。Phase 11 の代替 evidence 採取（E-1〜E-7）および runbook 通読 chk で運用上の追加課題は検出されなかった。

### Task 12-4 完了条件

- [ ] 0 件でも `outputs/phase-12/unassigned-task-detection.md` が出力されている
- [ ] 1〜3 件の候補を起票候補として記述するか、0 件を明示

### Task 12-4 漏れやすいポイント

- 「0 件だから出力しない」と誤判定する（phase-12-pitfalls.md 漏れパターン）
- 候補に割り当て先 wave / タスク種別を書き忘れる

---

## Task 12-5: スキルフィードバックレポート（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

### フィードバック例（推奨記載）

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | infrastructure-verification / docs-only タスクの runbook 配置先指定が SKILL.md / references で標準化されていない | runbook 配置標準パス（`outputs/phase-05/runbook.md` 等）を `references/phase-template-phase11-detail.md` のテンプレに追記 |
| task-specification-creator | NON_VISUAL 縮約の根拠宣言箇所（Phase 11 冒頭）の例示が薄い | NON_VISUAL 縮約適用宣言の boilerplate 例を `references/phase-template-phase11-detail.md` に追加 |
| aiworkflow-requirements | `deployment-cloudflare.md` への production Worker 名 / route / secret / observability 検証フロー追記の標準テンプレ不在 | references に「Worker 名差分検証チェックリスト」テンプレを追加 |
| github-issue-manager | Issue #246 が CLOSED 状態のまま spec_created を扱う運用が SKILL.md に明記なし | CLOSED Issue の spec_created 扱いケースを SKILL.md に追記 |

### 改善点なしの場合のフォーマット

> 特になし。本タスクで使用したスキル（task-specification-creator / aiworkflow-requirements / github-issue-manager）はいずれも本タスクの NON_VISUAL / docs-only / infrastructure-verification 組み合わせにおいて期待通り機能した。

### Task 12-5 完了条件

- [ ] 改善点なしでも `outputs/phase-12/skill-feedback-report.md` が出力されている
- [ ] スキル別の改善提案または「特になし」を明示

### Task 12-5 漏れやすいポイント

- 「改善点なしだから出力しない」と誤判定する
- スキル名を曖昧（`task-specification`）に書く（正式名 `task-specification-creator`）

---

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 | 本タスクでの扱い |
| --- | --- | --- | --- |
| 原典 unassigned status | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | YES | `spec_pending` → `spec_created` |
| 親 UT-06-FU-A runbook | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | YES（追記方針記録のみ） | 双方向 link |
| aiworkflow-requirements references | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | YES（追記方針記録のみ） | 検証フロー追記方針 |
| skill 本体 / LOGS | 今回は skill 挙動・LOGS 本文を変更しないため | N/A | スキル改善は `skill-feedback-report.md` に記録 |
| aiworkflow-requirements indexes | indexes/topic-map.md / resource-map.md / quick-reference.md / keywords.json | 条件付き | 本タスクで導線追加が必要なら更新方針を記録 |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state` / `task.metadata.docsOnly`。
- **本タスクの drift 防止チェック**:
  - `task.metadata.taskType = "docs-only"`
  - `task.metadata.workflow_state = "spec_created"`（`completed` 化禁止）
  - `task.metadata.docsOnly = true`
  - `apps/web/wrangler.toml` への変更が本 PR に含まれていない

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリー（E-1〜E-7）を `system-spec-update-summary.md` の参照証跡に転記 |
| Phase 13 | doc-update-history を PR 変更ファイル一覧の根拠として使用 |
| 親 UT-06-FU-A | runbook 完成度を親タスクへフィードバック（双方向 link） |
| UT-06（本番デプロイ） | 本タスク runbook を deploy 承認直前チェックリストとして引き渡し |
| UT-16（DNS 切替） | DNS 切替自動化候補を unassigned-task として申し送り |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも Worker 名移行リスクを理解できるレベルか。
- 実現性: Step 1-A の `deployment-cloudflare.md` 追記方針が現行ファイル構造と整合しているか。
- 整合性: same-wave sync が aiworkflow-requirements / 親 UT-06-FU-A / 原典 unassigned status と一致するか。
- 運用性: unassigned-task-detection の委譲先タスクが実在 ID または「新規 unassigned」候補として明記されているか。
- 認可境界: 実装ガイドの全コマンドが `scripts/cf.sh` 経由で書かれているか（CLAUDE.md 準拠）。
- Secret hygiene: ガイド内サンプルに実 database_id / 実 API token / 実 secret 値が含まれていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Task 12-1 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 4 つ以上必須 |
| 2 | Task 12-1 実装ガイド Part 2（技術者） | 12 | spec_created | scripts/cf.sh 経由 |
| 3 | Task 12-2 system-spec-update | 12 | spec_created | Step 1-A/1-B/1-C + Step 2 据え置き |
| 4 | Task 12-3 doc-update-history | 12 | spec_created | reviewer / 2026-04-30 |
| 5 | Task 12-4 unassigned-task-detection | 12 | spec_created | 0 件でも必須 |
| 6 | Task 12-5 skill-feedback-report | 12 | spec_created | 改善点なしでも必須 |
| 7 | same-wave sync（aiworkflow / 親 / 原典 unassigned） | 12 | spec_created | 追記方針記録 |
| 8 | 二重 ledger 同期 | 12 | spec_created | workflow_state=spec_created 維持 |
| 9 | docs-only 据え置きルール最終確認 | 12 | spec_created | apps/web/wrangler.toml 非混入 |

## 成果物（正本 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生）+ Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 据え置き判定 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 / reviewer / 2026-04-30 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| ドキュメント | outputs/phase-12/main.md | Phase 12 index と正本 7 成果物ナビ |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 正本 7 ファイルの最終確認 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 / workflow_state は spec_created 維持 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件【Task 12-1〜12-5 各成果物パスを列挙】

- [x] `outputs/phase-12/implementation-guide.md`（Task 12-1）が出力されている
- [x] `outputs/phase-12/system-spec-update-summary.md`（Task 12-2）が出力されている
- [x] `outputs/phase-12/documentation-changelog.md`（Task 12-3）が出力されている
- [x] `outputs/phase-12/unassigned-task-detection.md`（Task 12-4）が 0 件でも出力されている
- [x] `outputs/phase-12/skill-feedback-report.md`（Task 12-5）が改善点なしでも出力されている
- [x] `outputs/phase-12/main.md` が補助 index として出力されている
- [x] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 4 つ以上含まれる
- [x] system-spec-update に Step 1-A / 1-B / 1-C / Step 2 据え置き（N/A 含む）が明記
- [x] documentation-changelog で workflow-local 同期と global skill / CLAUDE.md 追記方針が別ブロック
- [x] unassigned-task-detection が 0 件でも出力されている
- [x] skill-feedback-report が改善点なしでも出力されている
- [x] same-wave sync（原典 unassigned status `spec_pending` → `spec_created`）が完了
- [x] 二重 ledger（root + outputs の artifacts.json）が同期
- [x] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` を維持
- [x] `apps/web/wrangler.toml` への変更が本 PR に非混入であることを確認
- [x] 全コマンドが `bash scripts/cf.sh` 経由（wrangler 直呼び 0 件）

## タスク100%実行確認【必須】

- 全実行タスク（9 件）の状態が `spec_created` で、Phase 完了時に `completed` へ更新可能な設計
- 正本 7 成果物が `outputs/phase-12/` に配置される設計
- docs-only タスクの workflow_state 据え置きルール（phase-12-pitfalls.md 漏れパターン）が手順に含まれている
- artifacts.json の `phases[11].status` が `spec_created` → 完了時 `completed`、`metadata.workflow_state` が `spec_created` のまま

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - doc-update-history の変更ファイル一覧 → PR description 草案の根拠
  - Task 12-1 implementation-guide → PR description の概要パートに転記
  - Task 12-4 unassigned-task-detection → 関連タスク（UT-16 / 新規 unassigned）への双方向 link 反映済み
  - Task 12-5 skill-feedback-report → SKILL.md / references 改善候補として後続タスクへ申し送り
  - workflow_state=spec_created / docsOnly=true / docs-only PR 境界（apps/web/wrangler.toml 非混入）を Phase 13 PR body に明記
- ブロック条件:
  - 正本 7 ファイルのいずれかが欠落
  - same-wave sync 未完了（原典 unassigned status / 親 UT-06-FU-A / aiworkflow-requirements 追記方針記録）
  - 二重 ledger に drift がある
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった
  - implementation-guide に `wrangler` 直呼びサンプルが残存
  - 実 secret 値 / API token 値 / OAuth token 値が outputs に転記されている
