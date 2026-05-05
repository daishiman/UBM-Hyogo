# Phase 11: 手動テスト検証（NON_VISUAL 縮約 / 設計文書ウォークスルー）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合 (U-UT01-07) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証（NON_VISUAL 縮約） |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは設計 reconciliation のみで構成され、UI / 画面 / コンポーネントを一切持たない。
  - 出力は markdown 文書のみ。コード変更 0 / migration 適用 0 / D1 書き込み 0。
  - 結果として screenshot による視覚証跡は **不要**（生成禁止: false green 防止）。
  - 一次証跡は **文書 grep ログ / AC matrix 充足結果 / cross-link 通過記録 / aiworkflow-requirements drift 検出 grep 出力**。
- 必須 outputs（NON_VISUAL 縮約 3 点）:
  - `outputs/phase-11/main.md`（Phase 11 トップ index・代替 evidence 差分表・既知制限）
  - `outputs/phase-11/manual-smoke-log.md`（実行コマンド・期待結果・実測欄テンプレ）
  - 補助: `outputs/phase-11/link-checklist.md` は本タスクでは `manual-smoke-log.md` 内のリンク検証セクションに集約する（最小ファイル数で運用）
- **`outputs/phase-11/screenshots/` ディレクトリは作成しない**（NON_VISUAL 整合）。
- 参照: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`

## 目的

Phase 10 GO 判定を受け、設計文書ウォークスルー方式により以下を検証する。

1. 用語整合 grep が「旧揺れ 0 件」を実測で示すこと
2. AC matrix 充足結果が「AC-1〜AC-6 の PASS / FAIL」を実測で示すこと
3. cross-link 通過記録が「navigation drift 0」を実測で示すこと
4. aiworkflow-requirements drift 検出 grep が「drift あり / なし」を客観的に確定すること

実行は **本 Phase の仕様策定のみ**（仕様書では実行コマンドと期待結果を定義する）であり、実コマンド実行と evidence 採取は **手動テスト検証 Phase の実行ステップ**で別途行う。本仕様書は再現可能な形でコマンドを固定する。

## 設計文書ウォークスルー（docs-only / NON_VISUAL の主テスト方式）

| 確認項目 | 方法 | 必須 |
| --- | --- | --- |
| 仕様書の自己完結性 | 親仕様 / Phase 1〜10 / outputs を順に辿り、抜け漏れがないか確認 | 必須 |
| 用語整合 | rg で `sync_log` / `sync_job_logs` / `sync_locks` の使い分けを実測 | 必須 |
| AC トレース完全性 | AC-1〜AC-6 と outputs の対応を目視で再確認 | 必須 |
| navigation drift | 各 phase / outputs の cross-link を辿り切れがないか確認 | 必須 |
| aiworkflow-requirements drift | rg で `database-schema.md` の sync 系記述を実測 | 必須 |
| UT-04 / UT-09 引き継ぎ可能性 | 各タスク担当者視点で self-review | 必須 |

## 実行タスク

1. 用語整合 grep を実行し旧揺れ 0 件を確認する（完了条件: `sync_logs\b|sync_lock\b` の検出 0）。
2. AC matrix 充足結果を `manual-smoke-log.md` に記録する（完了条件: 6 AC × outputs パス × PASS/FAIL 全件記入）。
3. cross-link 通過記録を実施する（完了条件: 親仕様 / Phase / outputs 間の link 切れ 0）。
4. aiworkflow-requirements drift 検出 grep を実行し結果を記録する（完了条件: drift あり / なし結論確定）。
5. UT-04 / UT-09 引き継ぎ self-review を実施する（完了条件: 「本仕様書のみで着手可能」判定）。
6. 既知制限と代替 evidence 差分表を作成する（完了条件: S-1〜S-N の保証範囲 / 保証外明記）。
7. NON_VISUAL 縮約 3 点ファイルを揃える（完了条件: `main.md` / `manual-smoke-log.md` 完備、`screenshots/` 不在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-09.md | grep / drift 実測計画 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | 単一正本群 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | AC-1〜AC-6 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | drift 比較対象（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 実測対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 縮約プレイブック |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-11.md | 書式模倣元 |

## 代替 evidence 差分表（NON_VISUAL 必須）

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 保証外 / 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 用語整合 | 用語の手作業突き合わせ | rg による 4 種 grep（概念 / 物理 ledger / 物理 lock / 旧揺れ） | 文書全体の用語一貫性 | 実装ファイル側の用語整合（→ UT-09 phase-08 DRY 化） |
| S-2 AC 充足 | AC-1〜AC-6 を主観で評価 | outputs の存在確認 + 内容目視 | spec_created 段階の AC 充足 | 実装後の AC 達成（→ UT-04 / UT-09） |
| S-3 navigation drift | リンク手動辿り | cross-link checklist + ls による file 実在確認 | 文書間の遷移可能性 | 外部リンク（GitHub Issue 等）の死活（→ Phase 12） |
| S-4 aiworkflow-requirements drift | 主観での整合確認 | rg による sync 系記述の実測 | drift の客観的有無 | drift 解消の実適用（→ Phase 12 doc-only 更新） |
| S-5 UT-04 / UT-09 引き継ぎ | 担当者ヒアリング | 本仕様書の self-review | 引き継ぎ十分性 | 担当者着手後の実フィードバック（→ 後続 review） |
| S-6 既存 migration の不変性 | 物理 SQL の Read のみ | `apps/api/migrations/0002_sync_logs_locks.sql` の差分 0 確認 | 既存 migration を改変していない | 本番 D1 への適用（→ UT-04 / UT-26） |

> **NON_VISUAL のため screenshot 不要**。本表により「何を保証し、何を保証できないか」を明示する。

## 実行手順（コマンド定義）

### ステップ 1: 用語整合 grep

```bash
rg -n "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
rg -n "sync_job_logs\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
rg -n "sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
rg -n "sync_logs\b|sync_lock\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
```

期待結果: 旧揺れ（4 つ目のコマンド）が 0 件、概念 `sync_log` が注釈付き、物理 `sync_job_logs` / `sync_locks` が注釈不要で一貫使用。

### ステップ 2: 既存 migration の不変性確認

```bash
rg -n "sync_job_logs|sync_locks" apps/api/migrations/0002_sync_logs_locks.sql
```

期待結果: 既存物理テーブル 2 件が定義されていることを確認（diff 0、改変していない）。

### ステップ 3: aiworkflow-requirements drift 検出 grep

```bash
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

期待結果（drift 判定基準）:
- 物理 canonical（`sync_job_logs` / `sync_locks`）が 1 件以上 → drift なし
- `database-schema.md` 側で sync 系記述 0 件 → 既存記述 drift はなし。ただし canonical 追補の要否は UT-04 で判定
- 旧揺れ `sync_logs` / `sync_lock` が 1 件以上 → drift あり

### ステップ 4: AC matrix 充足確認

各 AC × `outputs/phase-02/<file>.md` の存在確認:

```bash
ls -la docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/
```

期待結果: `naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / `handoff-to-ut04-ut09.md` の 4 正本ファイル存在。

### ステップ 5: cross-link 通過記録

各 phase-XX.md / outputs から親仕様 / UT-04 / UT-09 / aiworkflow-requirements への相対リンクを辿り、ファイルが実在するか ls で確認する。

### ステップ 6: UT-04 / UT-09 引き継ぎ self-review

`outputs/phase-02/handoff-to-ut04-ut09.md` / `handoff-to-ut04-ut09.md` を担当者視点で読み、再質問が必要となる箇所がないか確認する。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | DDL 発行 / migration 適用は本タスクで行わない | 物理 schema 反映 | UT-04（migration 計画）/ UT-26（staging-deploy-smoke） |
| 2 | mapper 実装 / コード変更は本タスクで行わない | 実装フェーズ整合 | UT-09（Sheets→D1 同期ジョブ） |
| 3 | enum 値 / retry / offset の canonical 決定は含まない | 直交タスク | U-8 / U-9 |
| 4 | 既存 `apps/api/migrations/0002_sync_logs_locks.sql` の改変権限なし | 物理 SQL 改変 | 改変は UT-04 のスコープ |
| 5 | aiworkflow-requirements drift の実適用は Phase 12 で formalize | drift 解消反映 | Phase 12 + .agents mirror sync |
| 6 | NON_VISUAL のため screenshot 不要、文書 grep が一次証跡 | 視覚証跡なし | manual-smoke-log.md で補完 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定の前提条件確認 |
| Phase 12 | drift 検出結果を documentation 更新で formalize |
| Phase 13 | NON_VISUAL evidence を PR description に転記 |
| UT-04 | 確定 canonical name + migration 戦略を migration 計画に引き渡す |
| UT-09 | 確定 canonical name を mapper 実装に引き渡す |

## 多角的チェック観点

- 価値性: grep ベースの客観 evidence で AC 充足を立証できる。
- 実現性: rg / ls / 目視のみで完結し、外部依存 0。
- 整合性: 既存 migration の不変性を grep で確認し、不変条件 #5 を維持。
- 運用性: コマンドが再現可能形式で固定されており、Phase 12 / 後続レビューで再実行できる。
- 認可境界: 本 Phase は読み取り（rg / Read）のみで権限境界を変更しない。
- Secret hygiene: ログに Secrets / PII を出力するコマンドを含まない。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 用語整合 grep（4 コマンド） | 11 | spec_created | 旧揺れ 0 件 |
| 2 | AC matrix 充足記録 | 11 | spec_created | 6 AC |
| 3 | cross-link 通過記録 | 11 | spec_created | navigation drift 0 |
| 4 | drift 検出 grep | 11 | spec_created | あり / なし結論 |
| 5 | UT-04 / UT-09 引き継ぎ self-review | 11 | spec_created | 担当者視点 |
| 6 | 代替 evidence 差分表 | 11 | spec_created | S-1〜S-6 |
| 7 | NON_VISUAL 3 点ファイル整備 | 11 | spec_created | `screenshots/` 不在 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| 用語整合 grep | `rg -n "sync_log\b\|sync_logs\b\|sync_job_logs\b\|sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` | outputs/phase-11/manual-smoke-log.md §1 | PASS |
| 既存 migration 不変性 | `rg -n "sync_job_logs\|sync_locks" apps/api/migrations/0002_sync_logs_locks.sql` | outputs/phase-11/manual-smoke-log.md §2 | PASS |
| aiworkflow-requirements drift | `rg -n "sync_log\b\|sync_logs\b\|sync_job_logs\b\|sync_locks\b" .claude/skills/aiworkflow-requirements/references/database-schema.md` | outputs/phase-11/manual-smoke-log.md §3 | PASS |
| outputs ファイル存在 | `ls -la docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/` | outputs/phase-11/manual-smoke-log.md §4 | PASS |
| cross-link 通過 | 各 phase / outputs の相対 link を辿り ls 確認 | outputs/phase-11/manual-smoke-log.md §5 | PASS |
| UT-04 / UT-09 引き継ぎ self-review | `outputs/phase-02/handoff-to-ut04-ut09.md` 目視 | outputs/phase-11/manual-smoke-log.md §6 | PASS（UT-09 受け皿は follow-up 化） |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録すること。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 トップ index・代替 evidence 差分表・既知制限 |
| ログ placeholder | outputs/phase-11/manual-smoke-log.md | 6 命令分の実行コマンド・期待結果・実測欄 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `outputs/phase-11/manual-smoke-log.md` の 2 ファイルが揃っている
- [ ] manual evidence テーブルの 6 項目すべてに実行コマンドと期待結果が記述されている
- [ ] 代替 evidence 差分表（S-1〜S-6）が記述され、保証範囲 / 保証外が明示されている
- [ ] 既存 `apps/api/migrations/0002_sync_logs_locks.sql` を改変していない（diff 0）
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] AC-1〜AC-6 すべてに対応する outputs パスが固定されている

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-11/` 配下に配置される設計
- 6 項目の実行コマンドが再現可能形式で固定済み
- DDL 発行 / migration 適用 / コード変更が UT-04 / UT-09 へ委譲されることが明記
- screenshot 不要が明記
- artifacts.json の Phase 11 entry の `phase: 11` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - manual-smoke-log で実測した drift 検出結果（あり / なし）を Phase 12 documentation 更新で formalize
  - 既知制限 #1（DDL 発行）/ #2（mapper 実装）/ #3（enum / retry）を該当タスク（UT-04 / UT-09 / U-8 / U-9）へ register
  - drift 検出時は `.claude/skills/aiworkflow-requirements/references/database-schema.md` への doc-only 更新案を Phase 12 で作成し、`.agents` mirror sync を発火
  - canonical name + 1:N マッピング + 4 案比較を UT-04 / UT-09 着手前提として引き渡す
- ブロック条件:
  - manual evidence の 6 項目に未採取 / 未 N/A が残っている
  - 旧揺れ表記が grep で検出される
  - `screenshots/` ディレクトリが誤って作成されている
  - 既存 migration の差分が 0 でない
