# 旧 UT-09 root を legacy umbrella 参照に戻す書き換え - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-legacy-umbrella-restore-001 |
| タスク名 | 旧 UT-09 root を legacy umbrella 参照に戻す書き換え |
| 分類 | 削除/復元（仕様更新） |
| 対象機能 | Forms/Sheets to D1 sync（UT-09 workflow root） |
| 優先度 | 高（次 wave） |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 30種思考法レビュー（B-04 blocker） |
| 発見日 | 2026-04-29 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-ut09-direction-reconciliation-001`（Phase 12 review）において、direction reconciliation の base case として「案 a（現行 Forms 分割方針へ寄せる）」が確定した。

案 a の Phase 2-A では、旧 UT-09 の workflow root（`docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/`）を direct implementation 記述から legacy umbrella 参照へ戻すことが明示されている。しかし、Phase 12 完了時点でこの復元作業が独立タスクとして切り出されておらず、未タスク B-04 として検出された。

### 1.2 問題点・課題

旧 UT-09 root を direct implementation として更新したことで、`task-sync-forms-d1-legacy-umbrella-001` が定める「旧 UT-09 を直接実装しない」方針と二重正本化した。Phase 12 で base case = 案 a を確定したにもかかわらず、workflow root ドキュメント内に direct implementation を示す記述が残存している状態は、後続タスク（03a / 03b / 04c / 09b）が誤った契約を参照する原因になる。

### 1.3 放置した場合の影響

- `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` の direct implementation 記述が後続タスクの誤参照を招く
- legacy umbrella（`task-sync-forms-d1-legacy-umbrella-001`）と workflow root の記述が矛盾したまま PR に含まれる
- aiworkflow-requirements の current facts に stale contract が登録され続ける
- 03a / 03b / 04c / 09b の実装判断が不安定になる

---

## 2. 何を達成するか（What）

### 2.1 目的

旧 UT-09 workflow root ドキュメント内の direct implementation 記述を撤回し、`task-sync-forms-d1-legacy-umbrella-001` への参照に統一する。

### 2.2 最終ゴール

`docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下のドキュメントから direct implementation を示す記述を除去し、legacy umbrella タスクへの参照文言のみを残す。

### 2.3 スコープ

#### 含むもの

- `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下の全 `.md` ファイルの内容確認と修正
- direct implementation 記述（Sheets API 系実装前提・単一 `/admin/sync`・`sync_locks`/`sync_job_logs` 前提）の撤回
- `task-sync-forms-d1-legacy-umbrella-001` への参照文言への置き換え
- 修正後の検証コマンド実行

#### 含まないもの

- commit、push、PR 作成
- `apps/api` 実装コードの変更（別タスクで対応）
- staging 実機 smoke の実施

### 2.4 成果物

- 修正済みの `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下ファイル
- direct implementation 文言ゼロを示す `rg` 検証ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-ut09-direction-reconciliation-001` の Phase 12 レビュー結果（base case = 案 a 確定）を把握していること
- `task-sync-forms-d1-legacy-umbrella-001` の内容（legacy umbrella 方針）を把握していること
- `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下のファイル一覧と内容を確認していること

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-ut09-direction-reconciliation-001 | base case = 案 a を確定したタスク（本タスクはその Phase 2-A の一部） |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | 参照先となる legacy umbrella 正本 |
| 並列 | Sheets API 実装撤回タスク（未起票） | `apps/api` 側の Sheets 実装を撤回するタスクと同 wave で進める |
| 下流 | UT-26 staging-deploy-smoke | 方針統一後の実機 smoke 証跡 |

### 3.3 必要な知識

- legacy umbrella 方針（`task-sync-forms-d1-legacy-umbrella-001`）の責務境界
- Google Forms API 分割方針（`/admin/sync/schema` / `/admin/sync/responses`・`sync_jobs`）
- task-specification-creator docs-only / NON_VISUAL テンプレ運用ルール

### 3.4 推奨アプローチ

1. `rg -n "ut-09-sheets-to-d1-cron-sync-job" docs .claude` で現状の direct implementation 文言を洗い出す
2. `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下のファイルを 1 件ずつ確認し、direct implementation 記述を特定する
3. 各ファイルの該当箇所を legacy umbrella 参照文言に書き換える（または該当セクションを削除する）
4. 書き換え後に検証コマンドを実行し、残存ゼロを確認する

---

## 4. 実行手順

### Phase 1: 現状調査

1. `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下のファイル一覧を取得する。
2. `rg -n "direct implementation\|sheets-to-d1\|sync_locks\|sync_job_logs\|GOOGLE_SHEETS" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` で修正対象箇所を特定する。
3. `task-sync-forms-d1-legacy-umbrella-001.md` の参照文言（置き換え先フレーズ）を確認する。

### Phase 2: 書き換え実施

1. 特定した direct implementation 記述を、以下の方針で修正する。
   - direct implementation を示すセクション全体 → legacy umbrella 参照文言（「本タスクは `task-sync-forms-d1-legacy-umbrella-001` に統合されました」等）に置き換える
   - Sheets API 前提の実装仕様（endpoint 定義・D1 ledger 定義等）→ 削除または legacy umbrella 参照へ変更する
   - Forms API 分割方針（`/admin/sync/schema` / `/admin/sync/responses`・`sync_jobs`）と矛盾するあらゆる記述を撤回する
2. 各ファイルの変更内容をレビューし、legacy umbrella 方針と整合していることを確認する。

### Phase 3: 検証

1. `rg -n "ut-09-sheets-to-d1-cron-sync-job" docs .claude` を実行し、direct implementation 文言が残っていないことを確認する。
2. `rg -n "sync_locks\|sync_job_logs\|GOOGLE_SHEETS_SA_JSON" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` がゼロ件であることを確認する。
3. 残存件数ゼロの出力をスクリーンショットまたはログとして記録する（NON_VISUAL evidence）。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` 配下に direct implementation を示す記述がない
- [ ] Sheets API 前提の実装仕様（endpoint / D1 ledger）記述が撤回されている
- [ ] `task-sync-forms-d1-legacy-umbrella-001` への参照文言に統一されている
- [ ] Forms API 分割方針（`/admin/sync/schema` / `/admin/sync/responses`・`sync_jobs`）と矛盾する記述がない

### 品質要件

- [ ] `rg -n "ut-09-sheets-to-d1-cron-sync-job" docs .claude` で direct implementation 文言がゼロ件
- [ ] `rg -n "sync_locks\|sync_job_logs\|GOOGLE_SHEETS_SA_JSON" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` がゼロ件
- [ ] 変更がドキュメントのみに限定されている（`apps/` 配下の変更を含まない）

### ドキュメント要件

- [ ] `docs/30-workflows/ut09-direction-reconciliation/` の Phase 12 成果物に本タスクの完了が反映されている
- [ ] unassigned-task-detection に本タスク（B-04）が記録されている

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| direct implementation scan | `rg -n "ut-09-sheets-to-d1-cron-sync-job" docs .claude` | direct implementation 文言がゼロ件 |
| Sheets API 残存 scan | `rg -n "sync_locks\|sync_job_logs\|GOOGLE_SHEETS_SA_JSON" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | ゼロ件 |
| legacy umbrella 参照確認 | `rg -n "task-sync-forms-d1-legacy-umbrella-001" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | 参照文言が 1 件以上存在する |
| Forms 方針整合確認 | `rg -n "sync/schema\|sync/responses\|sync_jobs" docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | Forms 分割方針と矛盾する記述がない |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 書き換えで legacy umbrella 参照が不完全になる | 高 | 中 | `task-sync-forms-d1-legacy-umbrella-001` の正本を読んでから書き換える |
| direct implementation 文言の見落とし | 中 | 中 | `rg` での全文検索を書き換え前後に必ず実施する |
| `apps/` 配下の変更を混入する | 高 | 低 | 本タスクのスコープは docs-only と明示し、コード変更は別タスクで対応する |
| 後続タスク（03a / 03b / 04c / 09b）が書き換え前の記述を参照している | 中 | 中 | 書き換え完了後に後続タスクの index を確認し、stale 参照がないかチェックする |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 参照先となる legacy umbrella 正本 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | base case = 案 a を確定したタスク |
| 必須 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | 修正対象ディレクトリ |
| 参考 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | 書き換え後の整合確認先（schema sync） |
| 参考 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | 書き換え後の整合確認先（admin endpoint） |
| 参考 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | 書き換え後の整合確認先（cron runbook） |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | 旧 UT-09 root を direct implementation として更新したことで legacy umbrella 方針と二重正本化した。Phase 12 で base case = 案 a を確定したため復元が必要になった |
| 原因 | `task-sync-forms-d1-legacy-umbrella-001` で旧 UT-09 を legacy umbrella として閉じる方針を定めたが、別ワークツリーで旧 UT-09 の直接実装・ドキュメント更新を進め、workflow root に direct implementation 記述を加えてしまった |
| 対応 | Phase 12 review の 30 種思考法で衝突を検出し、B-04 blocker として formalize。本タスク（task-ut09-legacy-umbrella-restore-001）として独立タスク化した |
| 再発防止 | 実装・ドキュメント更新開始前に `task-sync-forms-d1-legacy-umbrella-001` と aiworkflow-requirements の current facts を照合し、legacy umbrella タスクに該当しないか確認する |

### 作業ログ

- 2026-04-29: UT-09 Phase 12 review の未タスク検出（B-04）として本タスクを formalize。

### 補足事項

- 本タスクは docs-only / NON_VISUAL であり、commit / push / PR 作成は含まない。
- `apps/api` 側の Sheets 実装撤回（コード削除）は別タスクで対応する。本タスクは workflow root ドキュメントの復元のみに責務を限定する。
- 検証コマンドの出力ログを NON_VISUAL evidence として保存すること（スクリーンショット不要）。
