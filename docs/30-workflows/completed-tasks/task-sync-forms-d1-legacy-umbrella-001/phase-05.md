# Phase 5: 実装ランブック（docs-only legacy umbrella close-out）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | legacy-closeout |
| Mode | docs-only / spec_created / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

旧 UT-09 を legacy umbrella として閉じるドキュメント編集作業を、コピペ可能な
擬似 diff + sanity check 付きで固定する。本タスクは docs-only / spec_created
であり runtime コードは生成しない。ランブックは「stale 前提棚卸し → 責務移管
確認 → 品質要件移植 → 検証」の 4 ステップで構成する。

## 実行タスク

1. stale 前提棚卸しランブックを作成
2. 責務移管確認ランブックを作成
3. 品質要件移植（03a / 03b 異常系・09b runbook への注記）の擬似 diff を作成
4. 検証ランブック（audit-unassigned-tasks.js / rg pattern）を作成
5. 各ステップの sanity check を記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 元仕様 §4 Phase 1-4 の手順 |
| 必須 | .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js | 監査スクリプト |
| 必須 | docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/phase-06.md | 03a 異常系移植先（想定） |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/phase-06.md | 03b 異常系移植先（想定） |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | 09b runbook 移植先 |
| 参考 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | branch ↔ env 正規化 |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx | admin sync UI 想定操作（runbook 補足の擬似説明元） |

## 実行手順

### ステップ 1: stale 前提棚卸しランブックを作成

`outputs/phase-05/runbook-stale-audit.md` に下記擬似コマンド一式を配置。

### ステップ 2: 責務移管確認ランブックを作成

`outputs/phase-05/runbook-dependency-mapping.md` に 03a / 03b / 04c / 09b / 02c
への割当確認コマンドを配置。

### ステップ 3: 品質要件移植の擬似 diff を作成

`outputs/phase-05/runbook-quality-port.md` に 03a / 03b の異常系セクションへ
SQLITE_BUSY retry/backoff 注記を追加する擬似 diff、09b runbook へ pause/resume
追記の擬似 diff を配置。

### ステップ 4: 検証ランブックを作成

`outputs/phase-05/runbook-verification.md` に Phase 4 で定義した 5 層スイート
を実行する手順を集約。

### ステップ 5: 各ステップ sanity check 記述

擬似 diff の前後に「実値が混入していないか」「stale path を新規追加していな
いか」を確認する rg コマンドを配置。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | failure case と各ランブックを 1 対 1 で対応 |
| Phase 7 | AC matrix の runbook step 列に各ステップを写像 |
| Phase 8 | DRY 化対象（path / endpoint / table / branch ↔ env）の Before/After に同 snippet を再利用 |
| 上流 03a / 03b | 異常系セクションへの注記を Phase 6 で実装する際の入口 |
| 上流 09b | pause/resume runbook への追記を Phase 5/12 で実施する際の入口 |

## 多角的チェック観点（不変条件）

- **#1**: 擬似 diff で Forms API 表記のみ追加し、Sheets API 表記を新たに追加
  しない。
- **#5**: 移植要件文中に「apps/web から D1」という表現を生まない。D1 直接
  アクセスは apps/api 限定であることを文中で改めて確認。
- **#6**: pause/resume 手順で GAS apps script trigger を選択肢に含めない。
- **#10**: 移植時に cron 頻度試算（100k 内）を 09b runbook へ確実に残す。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | stale-audit ランブック | 5 | pending | rg pattern 集約 |
| 2 | dependency-mapping ランブック | 5 | pending | 03a/03b/04c/09b/02c への割当確認 |
| 3 | quality-port 擬似 diff | 5 | pending | SQLITE_BUSY / pause-resume |
| 4 | verification ランブック | 5 | pending | Phase 4 5 層を実行手順化 |
| 5 | 各 sanity check 記述 | 5 | pending | 共通 snippet |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ランブック | outputs/phase-05/runbook-stale-audit.md | stale 前提棚卸し |
| ランブック | outputs/phase-05/runbook-dependency-mapping.md | 責務移管確認 |
| ランブック | outputs/phase-05/runbook-quality-port.md | 品質要件移植擬似 diff |
| ランブック | outputs/phase-05/runbook-verification.md | 5 層検証 |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 完了条件

- [ ] 4 ランブックが outputs/phase-05/ に配置済み
- [ ] 擬似 diff にコピペ可能な before / after が記載
- [ ] 各 sanity check（実値混入 / stale path 新規追加 / branch ↔ env 表記）が記述
- [ ] sanity check の最終コマンドで `rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job"` の結果が legacy umbrella 文脈以外 0 件であることが確認できる構成

## タスク100%実行確認【必須】

- 全実行タスク (1〜5) が completed
- 4 ランブックファイル + main.md が outputs/phase-05/ に配置
- artifacts.json の phase 5 を completed に更新

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項: 4 ランブック擬似コード / 各 sanity check
- ブロック条件: いずれかのランブックが未完成、または擬似 diff に Sheets API
  / 単一 `/admin/sync` / `sync_audit` を新規導線として残した場合は次 Phase に
  進まない

---

## runbook-stale-audit（擬似）

### Step 1: 旧 UT-09 path / id 残存確認

```bash
rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
  docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references
```

- sanity: 出力は legacy umbrella 文脈での参照のみ（新規導線として記述なし）
- 差し戻し: 新規導線として書かれていた場合は当該文書を編集して legacy umbrella 表記に置換

### Step 2: Sheets API / 単一 endpoint / sync_audit 残存確認

```bash
rg --pcre2 -n "Google Sheets API v4|spreadsheets\\.values\\.get|/admin/sync(?!/)|sync_audit" \
  docs/30-workflows/02-application-implementation
```

- sanity: 0 hit
- 差し戻し: hit があれば 03a / 03b / 04c / 09b の該当箇所を Forms API /
  `/admin/sync/schema` / `/admin/sync/responses` / `sync_jobs` に置換

### Step 3: branch ↔ env 表記正規化確認

```bash
rg -n "dev / main 環境|dev/main 環境|dev branch|main branch" \
  docs/30-workflows/02-application-implementation
```

- sanity: `dev branch -> staging env` / `main branch -> production/top-level env`
  の表記のみ
- 差し戻し: `dev / main 環境` 単独表記が残っていれば修正

## runbook-dependency-mapping（擬似）

### Step 1: 03a への割当確認

```bash
rg -l "POST /admin/sync/schema|forms\\.get|schema_questions" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/
```

- sanity: 3 keyword すべて hit
- 差し戻し: 不足があれば 03a の index.md / phase-02.md（設計）に追記タスクを起票

### Step 2: 03b への割当確認

```bash
rg -l "forms\\.responses\\.list|member_responses|current response" \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/
```

### Step 3: 04c への割当確認

```bash
rg -l "/admin/sync/schema|/admin/sync/responses" \
  .claude/skills/aiworkflow-requirements/references/
```

### Step 4: 09b への割当確認

```bash
rg -l "cron|pause|resume|incident" \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/
```

- sanity: 4 keyword すべて hit
- 差し戻し: 不足があれば 09b runbook を追記

## runbook-quality-port（擬似 diff）

### Diff A: 旧 UT-09 ファイルへ「legacy umbrella」明記

```diff
 # Forms to D1 sync legacy umbrella close-out - タスク指示書
+
+> **Status: legacy umbrella (closed)**
+> このファイルは旧 UT-09 を新規実装タスクとして起こすためのものではない。
+> 実装責務は 03a / 03b / 04c / 09b に分散済みであり、新規実装の入口として
+> 参照しないこと。本ファイルは置換マッピングと耐障害要件の移植記録のみ。
```

- sanity: 既に legacy umbrella 表記がある場合は重複追加しない
- 差し戻し: 表記揺れがあれば DRY 化を Phase 8 で確定

### Diff B: 03a 異常系セクションへの SQLITE_BUSY 注記（擬似）

```diff
 ## 異常系
 - Forms API 429 / 5xx
+- D1 SQLITE_BUSY: WAL 非前提のため retry/backoff（指数 backoff、最大 N 回）
+  と短い transaction、batch-size 制限を schema upsert に適用する。
+  根拠: docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
+  Phase 3「品質要件の移植」§3。
```

- sanity: 既存の 03a 異常系に同等の文言があれば重複追加しない
- 差し戻し: 表現が揺れている場合は同 task の Phase 8 DRY 化で正規化

### Diff C: 03b 異常系セクションへの SQLITE_BUSY 注記（擬似）

```diff
 ## 異常系
 - cursor 欠落
+- D1 SQLITE_BUSY: response 反映 (member_responses / member_identities /
+  member_status) は短い transaction に分割し、SQLITE_BUSY 発生時は retry/backoff。
+  根拠: docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
+  Phase 3 §3。
```

### Diff D: 09b runbook へ pause/resume と sync_jobs 排他注記（擬似）

```diff
 ### Step 4: cron 一時停止（incident 時）
 ...
+
+### Step 4.5: 同種 sync job の排他
+- `sync_jobs.status='running'` がある状態で manual / cron 起動された場合は
+  409 Conflict を返し新規 job を作成しない（02c / 03a / 03b の sync_jobs
+  repository が正本）。
+- 古い running が 30 分超で残っている場合のみ failed 化を許可する。
```

### sanity（共通）

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" docs/30-workflows
rg --pcre2 -n "Google Sheets API v4|/admin/sync(?!/)|sync_audit" docs/30-workflows/02-application-implementation
```

- 期待: 両コマンドとも 0 hit

## runbook-verification（擬似）

### Step 1: format audit

```bash
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
```

- 期待: current violations 0

### Step 2: stale path scan

```bash
rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
  docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references
```

- 期待: legacy umbrella 文脈以外 0 hit

### Step 3: conflict marker scan

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references
```

- 期待: 0 hit

### Step 4: dependency mapping 全 keyword

```bash
rg -l "forms\\.get|forms\\.responses\\.list|/admin/sync/schema|/admin/sync/responses|sync_jobs|cron" \
  docs/30-workflows/02-application-implementation
```

- 期待: 03a / 03b / 04c / 09b 配下のいずれにも 1 件以上 hit

## prototype admin UI 想定操作（runbook 補足 / 擬似説明 / コード非生成）

`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の admin sync 画面は、04c の `POST /admin/sync/schema` / `POST /admin/sync/responses` を起動する管理者操作の UI 叩き台である。本タスクは docs-only でありコードは書かないが、runbook の擬似説明として下記操作フローを記録する。

1. 管理者は admin gate（specs/13-mvp-auth.md）通過後に admin sync 画面を開く
2. 「schema 同期」ボタン押下 → `POST /admin/sync/schema`（04c 経由で 03a の schema sync を起動）
3. 「responses 同期」ボタン押下 → `POST /admin/sync/responses`（04c 経由で 03b の response sync を起動）
4. UI は sync_jobs.status を polling しつつ進捗を表示する（contract は specs/03-data-fetching.md）
5. 同種 job が `running` 中の場合、ボタン押下は 409 Conflict を受けて UI 上で「同期実行中」と表示する

> 上記は prototype を本番仕様に昇格させるものではなく（不変条件 #6）、操作経路の理解共有のみを目的とする。

## 各ステップ後の sanity check（共通）

- secret / API token を文書中に転記していないか
- staging と production 環境を取り違えていないか
- `dev / main 環境` 表記を新規追加していないか
- artifacts.json に途中状態を反映したか
- Phase 4 で定義した 5 層 verify suite と用語が揃っているか
