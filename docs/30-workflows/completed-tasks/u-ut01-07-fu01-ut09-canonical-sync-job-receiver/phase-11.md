# Phase 11: 手動テスト検証（NON_VISUAL 縮約 / 設計文書ウォークスルー）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver (U-UT01-07-FU01) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証（NON_VISUAL 縮約） |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| sourceIssue | #333 (CLOSED) |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは UT-09 同期ジョブ（API/Workers レイヤ）の canonical 名受け皿確定であり、UI / 画面 / コンポーネントを一切持たない。
  - `taskType=docs-only` で本仕様書段階は「実パス確定 + canonical 名引き渡し」までで、コード実装着手は本仕様書外（UT-09 実装タスクのスコープ）。
  - 出力は markdown 文書のみ。コード変更 0 / migration 適用 0 / D1 書き込み 0。
  - 結果として screenshot による視覚証跡は **不要**（生成禁止: false green 防止）。
  - 一次証跡は **UT-09 root path 実在確認 ls / canonical 名 grep / `sync_log` 物理化禁止 grep / aiworkflow-requirements drift 検出 grep / cross-link 通過記録**。
- 必須 outputs（NON_VISUAL 縮約 3 点）:
  - `outputs/phase-11/main.md`（Phase 11 トップ index・代替 evidence 差分表・既知制限）
  - `outputs/phase-11/manual-smoke-log.md`（実行コマンド・期待結果・実測欄テンプレ）
  - `outputs/phase-11/link-checklist.md`（UT-09 root path / Phase 2 正本 4 ファイル / database-schema.md drift / unassigned-task detection 反映 cross-link）
- **`outputs/phase-11/screenshots/` ディレクトリは作成しない**（NON_VISUAL 整合）。
- 参照: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`

## 目的

Phase 10 GO 判定を受け、設計文書ウォークスルー方式により以下を検証する。

1. UT-09 implementation task の **root path 実在** が ls で示されること（AC-1）
2. canonical 名 `sync_job_logs` / `sync_locks` が UT-09 必須参照および AC に **反映済み** であること（AC-2）
3. `sync_log` を **物理テーブル化していない**（DDL / migration / コード追加が 0）ことが grep で示されること（AC-3）
4. U-UT01-08 / U-UT01-09 / UT-04 との **直交性が維持**されていること（AC-4）

実行は **本 Phase の仕様策定のみ**（仕様書では実行コマンドと期待結果を定義する）であり、実コマンド実行と evidence 採取は本仕様書実行時に手動で行う。本仕様書は再現可能な形でコマンドを固定する。

## 設計文書ウォークスルー（implementation / NON_VISUAL の主テスト方式）

| 確認項目 | 方法 | 必須 |
| --- | --- | --- |
| UT-09 implementation root の実在 | `ls docs/30-workflows/ut-09-*/` で実パスを確定 | 必須 |
| canonical 名反映 | rg で UT-09 root の `sync_job_logs` / `sync_locks` 出現を実測 | 必須 |
| `sync_log` 物理化禁止 | rg で `CREATE TABLE sync_log\b` / `sync_log\b.*PRIMARY KEY` の検出 0 を実測 | 必須 |
| Phase 2 正本 4 ファイル参照 | 親タスク `outputs/phase-02/` 4 ファイルへの link 切れ 0 | 必須 |
| aiworkflow-requirements drift | rg で `database-schema.md` の sync 系記述を実測 | 必須 |
| 直交タスク（UT-04 / U-UT01-08 / U-UT01-09）非侵入 | UT-09 spec が enum / retry / migration に踏み込んでいないか目視 | 必須 |

## 実行タスク

1. UT-09 implementation root path を実測する（完了条件: `docs/30-workflows/ut-09-*/` ディレクトリの実パスが ls で 1 件確定、または受け皿未確定なら follow-up に登録済み）。
2. canonical 名 grep を実行し UT-09 必須参照に `sync_job_logs` / `sync_locks` が含まれることを記録する。
3. `sync_log` 物理化禁止 grep を実行し DDL / migration / コードに `sync_log` 物理テーブル定義が存在しないことを示す。
4. Phase 2 正本 4 ファイル（`naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / `handoff-to-ut04-ut09.md`）参照の link 切れ 0 を確認する。
5. aiworkflow-requirements `database-schema.md` の drift 検出 grep を実行する。
6. UT-04 / U-UT01-08 / U-UT01-09 の直交性自己レビューを実施する（完了条件: 「本仕様書のみで UT-09 着手可能 + 他タスクへの侵入 0」判定）。
7. 既知制限と代替 evidence 差分表を作成する。
8. NON_VISUAL 縮約 3 点ファイルを揃える（`screenshots/` 不在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | canonical 命名正本 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | 論理→物理マッピング |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | 後方互換戦略 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | 引き継ぎ事項 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理 canonical 現状（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 実測対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 縮約プレイブック |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-11.md | 書式模倣元 |

## 代替 evidence 差分表（NON_VISUAL 必須）

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 保証外 / 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 UT-09 root 実在 | 主観での paths 確定 | `ls docs/30-workflows/` + grep で UT-09 ディレクトリ確定 | AC-1 受け皿 root 確定 | UT-09 内部 phase 構造の妥当性（→ UT-09 自身のレビュー） |
| S-2 canonical 反映 | 担当者ヒアリング | rg で `sync_job_logs` / `sync_locks` の UT-09 文書内出現確認 | AC-2 反映確認 | 実装コード側の identifier 整合（→ UT-09 実装フェーズ） |
| S-3 物理化禁止 | 主観チェック | rg で `CREATE TABLE sync_log\b` / `sync_log\b.*PRIMARY KEY` 検出 0 | AC-3 物理化禁止 | 本番 D1 への適用結果（→ UT-26 staging-deploy-smoke） |
| S-4 直交性維持 | 担当者ヒアリング | UT-09 文書内に `enum` / `retry` / `idempotency_key` 物理 DDL 記述が無いことを目視 | AC-4 直交性 | 直交タスクの実装内容（→ U-UT01-08 / U-UT01-09 / UT-04） |
| S-5 link 通過 | リンク手動辿り | cross-link checklist + ls による file 実在確認 | 文書間遷移可能性 | 外部リンク死活（→ Phase 12） |
| S-6 既存 migration 不変 | 物理 SQL の Read のみ | `apps/api/migrations/0002_sync_logs_locks.sql` 差分 0 確認 | 既存 migration 改変なし | 本番 D1 への適用（→ UT-04 / UT-26） |

> **NON_VISUAL のため screenshot 不要**。本表により「何を保証し、何を保証できないか」を明示する。

## 実行手順（コマンド定義）

### ステップ 1: UT-09 implementation root path 実測

```bash
ls -d docs/30-workflows/ut-09-*/ 2>/dev/null
ls -d docs/30-workflows/completed-tasks/ut-09-*/ 2>/dev/null
```

期待結果: いずれかに UT-09 同期ジョブ実装タスクの root が 1 件存在。0 件なら Phase 12 unassigned-task-detection で受け皿確定 follow-up を登録する。

### ステップ 2: canonical 名 grep（UT-09 文書内）

```bash
UT09_ROOT=$(ls -d docs/30-workflows/ut-09-*/ 2>/dev/null | head -1)
[ -n "$UT09_ROOT" ] && rg -n "sync_job_logs\b|sync_locks\b" "$UT09_ROOT" || echo "UT-09 未確定 → follow-up へ"
```

期待結果: UT-09 root が確定している場合、`sync_job_logs` / `sync_locks` がそれぞれ 1 件以上出現。

### ステップ 3: `sync_log` 物理化禁止 grep

```bash
rg -n "CREATE TABLE\s+sync_log\b" apps/ docs/30-workflows/
rg -n "sync_log\b" apps/api/migrations/
```

期待結果: 物理 `sync_log` テーブル定義 0 件。`apps/api/migrations/` 配下に `sync_log` 出現 0 件（既存物理 canonical は `sync_job_logs` のみ）。

### ステップ 4: Phase 2 正本 4 ファイル link 検証

```bash
PARENT=docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02
ls -la "$PARENT/naming-canonical.md" "$PARENT/column-mapping-matrix.md" \
       "$PARENT/backward-compatibility-strategy.md" "$PARENT/handoff-to-ut04-ut09.md"
```

期待結果: 4 ファイルすべて存在。

### ステップ 5: aiworkflow-requirements drift 検出 grep

```bash
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

期待結果（drift 判定基準）:
- 物理 canonical（`sync_job_logs` / `sync_locks`）が 1 件以上 → drift なし
- `database-schema.md` 側で sync 系記述 0 件 → 既存 drift なし。canonical 追補要否は UT-04 で判定
- 旧揺れ `sync_logs` / `sync_lock` が 1 件以上 → drift あり（Phase 12 で formalize）

### ステップ 6: 直交タスク非侵入チェック

UT-09 文書内に以下が含まれないことを目視確認する。
- enum 値 canonical 決定（→ U-UT01-08）
- retry / offset 値 canonical 決定（→ U-UT01-09）
- 新規 DDL / migration 追加（→ UT-04）

### ステップ 7: cross-link 通過記録

各 phase-XX.md / outputs から親仕様 / UT-04 / UT-09 / aiworkflow-requirements への相対リンクを辿り、ファイルが実在するか ls で確認する。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | コード実装は本タスクで行わない | UT-09 実装本体 | UT-09 implementation task |
| 2 | DDL 発行 / migration 適用は本タスクで行わない | 物理 schema 反映 | UT-04 / UT-26 |
| 3 | enum 値 canonical 決定は含まない | 直交タスク | U-UT01-08 |
| 4 | retry / offset 値 canonical 決定は含まない | 直交タスク | U-UT01-09 |
| 5 | UT-09 root path 未確定の場合は follow-up 化 | 受け皿確定 | Phase 12 unassigned-task-detection |
| 6 | NON_VISUAL のため screenshot 不要、文書 grep が一次証跡 | 視覚証跡なし | manual-smoke-log.md / link-checklist.md で補完 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定の前提条件確認 |
| Phase 12 | drift 検出結果 / UT-09 root 確定状況を documentation 更新で formalize |
| Phase 13 | NON_VISUAL evidence を PR description に転記 |
| 親 U-UT01-07 | 確定 canonical を UT-09 受け皿として継承 |
| UT-09 | canonical 名を実装で参照 |

## 多角的チェック観点

- 価値性: grep / ls ベースの客観 evidence で AC-1〜AC-4 を立証できる。
- 実現性: rg / ls / 目視のみで完結し、外部依存 0。
- 整合性: 既存 migration の不変性を grep で確認し、不変条件 #5 を維持。
- 運用性: UT-09 root 未確定でも follow-up 経路で詰まらない設計。
- 認可境界: 本 Phase は読み取り（rg / Read）のみで権限境界を変更しない。
- Secret hygiene: ログに Secrets / PII を出力するコマンドを含まない。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | UT-09 root path 実測 | 11 | spec_created | AC-1 |
| 2 | canonical 名 grep | 11 | spec_created | AC-2 |
| 3 | `sync_log` 物理化禁止 grep | 11 | spec_created | AC-3 |
| 4 | Phase 2 正本 4 ファイル link 検証 | 11 | spec_created | navigation drift 0 |
| 5 | aiworkflow drift grep | 11 | spec_created | あり / なし結論 |
| 6 | 直交タスク非侵入チェック | 11 | spec_created | AC-4 |
| 7 | cross-link 通過記録 | 11 | spec_created | navigation drift 0 |
| 8 | 代替 evidence 差分表 | 11 | spec_created | S-1〜S-6 |
| 9 | NON_VISUAL 3 点ファイル整備 | 11 | spec_created | `screenshots/` 不在 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| UT-09 root 実測 | `ls -d docs/30-workflows/ut-09-*/ 2>/dev/null` | outputs/phase-11/manual-smoke-log.md §1 | pending |
| canonical 名 grep | `rg -n "sync_job_logs\b\|sync_locks\b" $UT09_ROOT` | outputs/phase-11/manual-smoke-log.md §2 | pending |
| 物理化禁止 grep | `rg -n "CREATE TABLE\s+sync_log\b" apps/ docs/30-workflows/` | outputs/phase-11/manual-smoke-log.md §3 | pending |
| Phase 2 正本 ls | `ls -la <PARENT>/outputs/phase-02/*.md` | outputs/phase-11/manual-smoke-log.md §4 | pending |
| drift 検出 grep | `rg -n "sync_log\b\|sync_logs\b\|sync_job_logs\b\|sync_locks\b" .claude/skills/aiworkflow-requirements/references/database-schema.md` | outputs/phase-11/manual-smoke-log.md §5 | pending |
| 直交非侵入 目視 | UT-09 文書を enum / retry / 新規 DDL の有無で目視 | outputs/phase-11/manual-smoke-log.md §6 | pending |
| cross-link 通過 | 各 phase / outputs の相対 link を辿り ls 確認 | outputs/phase-11/link-checklist.md | pending |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録すること。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ナビ | outputs/phase-11/main.md | Phase 11 トップ index・代替 evidence 差分表・既知制限 |
| ログ placeholder | outputs/phase-11/manual-smoke-log.md | 6 命令分の実行コマンド・期待結果・実測欄 |
| リンク | outputs/phase-11/link-checklist.md | UT-09 root / Phase 2 正本 / drift / unassigned 反映の cross-link |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブルの 7 項目すべてに実行コマンドと期待結果が記述されている
- [ ] 代替 evidence 差分表（S-1〜S-6）が記述され、保証範囲 / 保証外が明示されている
- [ ] 既存 `apps/api/migrations/0002_sync_logs_locks.sql` を改変していない（diff 0）
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] AC-1〜AC-4 すべてに対応する outputs パスが固定されている

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計
- 7 項目の実行コマンドが再現可能形式で固定済み
- コード実装 / DDL 発行 / migration 適用が UT-09 / UT-04 / UT-26 へ委譲されることが明記
- screenshot 不要が明記
- artifacts.json の Phase 11 entry の `phase: 11` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - manual-smoke-log の UT-09 root 確定 / drift 検出 結果を Phase 12 で formalize
  - UT-09 root 未確定なら Phase 12 unassigned-task-detection で受け皿 follow-up を登録
  - 既知制限 #1〜#4 を該当タスク（UT-09 / UT-04 / U-UT01-08 / U-UT01-09）へ register
  - canonical 名（`sync_job_logs` / `sync_locks`）と `sync_log` 物理化禁止方針を UT-09 着手前提として引き渡す
- ブロック条件:
  - manual evidence の 7 項目に未採取 / 未 N/A が残っている
  - 旧揺れ表記が grep で検出される
  - `screenshots/` ディレクトリが誤って作成されている
  - 既存 migration の差分が 0 でない
