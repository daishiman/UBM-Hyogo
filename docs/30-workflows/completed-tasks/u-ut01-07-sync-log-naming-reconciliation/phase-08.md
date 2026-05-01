# Phase 8: ドキュメントリファクタリング（docs-only DRY 化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合 (U-UT01-07) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメントリファクタリング（docs-only 読み替え = 文書 DRY 化 / 構成最適化） |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| workflow_state | spec_created |

## 目的

本タスクは設計 reconciliation のみで構成され、コード生成・DDL 発行・migration 改変は一切含まない。
そのため Phase 8 の「リファクタリング」は **コードではなく文書資産（Phase 2 成果物）の DRY 化・構成最適化** として読み替える。

Phase 1〜7 で確定した 4 つの主要成果物（マッピング表 / 4 案比較表 / 直交性チェックリスト / UT-04 / UT-09 引き継ぎ事項）は、
複数の outputs / phase-XX.md にまたがって記述されており、用語揺れと cross-link 切れが残置している。
本 Phase で **canonical 名 vs 概念名の用語統一・重複記述削減・cross-link 強化・評価軸正規化** を行い、
Phase 9 (QA grep) と Phase 10 (Go/No-Go) が「単一正本を読めば判定できる」状態を担保する。

## 実行タスク

1. 用語統一: `sync_log`（論理概念）/ `sync_job_logs`（物理 ledger）/ `sync_locks`（物理 lock）の使い分けを Phase 2〜7 outputs 全文で統一し、判別困難な箇所を表形式に整える（完了条件: 用語混在 0 件）。
2. マッピング表の表形式整理: Phase 2 で作成した 1:N マッピングを論理 13 カラム × 物理対応 / 物理未実装 / 不要 の 3 値分類に正規化し、可読性を向上させる（完了条件: 全 13 行 × 4 列で空欄 0）。
3. 4 案比較表の評価軸正規化: 後方互換戦略 4 案（no-op / view / rename / 新テーブル+移行）の評価軸を「破壊性 / 実装コスト / 監査連続性 / rollback 容易性」の 4 軸固定で揃える（完了条件: 4 軸 × 4 案 = 16 セルすべて記入）。
4. 重複記述削減: Phase 3 base case 判定 / Phase 4 多角検証 / Phase 5 実装計画間で重複している採択理由文を Phase 2 の `outputs/phase-02/naming-canonical.md` に集約し、他 Phase は link 参照のみに切り替える（完了条件: 採択理由文の重複 0）。
5. cross-link 強化: 各 phase-XX.md → outputs パス、outputs → 親仕様（unassigned-task / UT-04 / UT-09）への相対 link を追加し navigation drift を解消する（完了条件: リンク切れ 0）。
6. outputs/phase-08/main.md に Before / After 比較表として集約する（完了条件: 6 観点すべて記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | マッピング・4 案比較・採択理由の正本候補 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | 親仕様（苦戦箇所 4 件・AC-1〜AC-6） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | 論理 13 カラムの正本 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側の現状（Read のみ） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理側の利用フロー（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 検出対象 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-08.md | 書式模倣元 |

## Before / After 比較テーブル

### 用語統一

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 論理概念 | `sync_log` / `同期ログテーブル` / `sync ledger` 揺れ | `sync_log`（論理概念名・必ず注釈付き）に統一 | UT-01 Phase 2 を起点とする概念名を保持 |
| 物理 ledger | `sync_logs` / `sync_job_logs` 揺れ | `sync_job_logs`（物理 canonical） | `apps/api/migrations/0002_sync_logs_locks.sql` 既存実装に整合 |
| 物理 lock | `sync_lock` / `lock_table` 揺れ | `sync_locks`（物理 canonical） | 既存 migration と整合 |
| 採択戦略 | `no-op` / `何もしない` / `現状維持` 揺れ | `no-op`（採択戦略名） | 4 案比較表との一意整合 |
| 引き継ぎ先 | `UT-04` / `UT-04 phase-2` / `下流タスク` 揺れ | `UT-04`（タスク ID）+ 該当 Phase 番号併記 | trace 容易化 |

### マッピング表構造

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| マッピング表配置 | Phase 2 / 3 / 5 で類似表が再記述 | `outputs/phase-02/column-mapping-matrix.md` を単一正本、他 Phase は link のみ | 重複削減 |
| 列構成 | 「論理カラム / 物理カラム / 備考」3 列 | 「論理カラム / 物理対応テーブル / 物理対応カラム / 判定（対応済 / 未実装 / 不要）」4 列 | N:0/1/M 関係を明示 |
| 13 カラム網羅 | 一部漏れ（`idempotency_key` / `lock_expires_at` 等） | 全 13 カラム明示 + 物理未実装にも判定値必須 | AC-2 充足 |

### 4 案比較表

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 評価軸 | 案ごとに評価軸が異なる（破壊性のみ / コストのみ等） | 「破壊性 / 実装コスト / 監査連続性 / rollback 容易性」4 軸固定 | AC-3 充足 |
| 採択 / 却下表記 | 自由文 | `採択 ★` / `却下（理由: …）` の固定書式 | 機械可読化 |
| データ消失明示 | 一部欠落 | 全案に「データ消失リスク: 有 / 無 / 限定的」を必須付与 | リスク表との整合 |

### cross-link / navigation drift

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| phase ↔ outputs link | 一部相対 path 欠落 | 全 phase-XX.md に `outputs/phase-XX/main.md` link 必須 | navigation drift 0 |
| 親仕様 link | unassigned-task への相対 link 一部欠落 | 全 phase に `../unassigned-task/U-UT01-07-...` link 必須 | trace 容易化 |
| UT-04 / UT-09 link | テキスト言及のみ | 該当 phase-XX.md への相対 link 付与 | 引き継ぎ容易化 |
| aiworkflow-requirements link | 未記載 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` への link 必須 | Phase 9 drift 検出の前提 |

## 重複記述の集約方針

| # | 重複対象 | 集約先（単一正本） | 他 Phase の扱い |
| --- | --- | --- | --- |
| 1 | canonical 採択理由文 | `outputs/phase-02/naming-canonical.md` | link 参照のみ |
| 2 | マッピング表 13 行 | `outputs/phase-02/column-mapping-matrix.md` | link 参照のみ |
| 3 | 4 案比較表 | `outputs/phase-02/backward-compatibility-strategy.md` | link 参照のみ |
| 4 | 直交性チェックリスト（U-8 / U-9） | `outputs/phase-02/handoff-to-ut04-ut09.md` | link 参照のみ |
| 5 | UT-04 引き継ぎ事項 | `outputs/phase-02/handoff-to-ut04-ut09.md` | link 参照のみ |
| 6 | UT-09 引き継ぎ事項 | `outputs/phase-02/handoff-to-ut04-ut09.md` | link 参照のみ |

## navigation drift 確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × 実 path | grep 突き合わせ | 完全一致 |
| index.md `Phase 一覧` × 実ファイル | ls で照合 | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 親 unassigned-task 参照 | `../unassigned-task/U-UT01-07-...` | 実在 |
| UT-04 / UT-09 引き渡し先 | `../ut-04-d1-schema-design/` / `../ut-09-sheets-to-d1-cron-sync-job/` | 実在 |
| aiworkflow-requirements drift 対象 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 実在 |

## 共通化パターン

- 命名: 概念名 = `sync_log`（必ず注釈付き）/ 物理 = `sync_job_logs` / `sync_locks`（注釈不要）の住み分けを徹底。
- マッピング・比較表・チェックリスト・引き継ぎはすべて `outputs/phase-02/` 配下の単一正本に集約し、他 Phase は link のみで参照する。
- 評価軸は 4 軸（破壊性 / 実装コスト / 監査連続性 / rollback 容易性）固定。
- 引き継ぎ先は `<タスク ID> phase-XX` 形式で必ず Phase 番号を併記する。

## 削除対象

- Phase 3〜5 内の重複した採択理由文（Phase 2 link へ置換）。
- Phase 6 / 7 内の重複した 4 案比較表（同上）。
- 旧用語 `sync_logs` / `sync_lock` の単独表記（複数形 vs 単数形混在を解消）。

## 実行手順

### ステップ 1: 用語揺れの洗い出し

```bash
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
```

検出結果を表に整理し、After 列を決定する。

### ステップ 2: マッピング表の正規化

論理 13 カラムを 4 列構造に展開し、`outputs/phase-02/column-mapping-matrix.md` を単一正本として確定する。

### ステップ 3: 4 案比較表の評価軸正規化

4 軸固定 + データ消失明示で再構築し、`outputs/phase-02/backward-compatibility-strategy.md` に集約する。

### ステップ 4: 重複記述削減

Phase 3〜7 から重複した採択理由文・比較表・チェックリストを削除し、Phase 2 link に置換する。

### ステップ 5: cross-link 追加

各 phase-XX.md に「親仕様 / outputs / UT-04 / UT-09 / aiworkflow-requirements」link を必須付与する。

### ステップ 6: outputs/phase-08/main.md に集約

Before / After 4 区分・重複集約方針 6 件・navigation drift 表をすべて 1 ドキュメントに統合する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 用語統一・cross-link を grep ベース品質ゲートの前提として使用 |
| Phase 10 | navigation drift 0 を Go/No-Go 判定の根拠に使用 |
| Phase 12 | Phase 2〜8 の集約構造を documentation-changelog に反映 |
| UT-04 | 単一正本化されたマッピング表 / 引き継ぎ事項を migration 計画の入力に使用 |
| UT-09 | 単一正本化された canonical name を mapper 実装の入力に使用 |

## 多角的チェック観点

- 価値性: Phase 9 / 10 が単一正本を読むだけで判定できる構造に短縮できる。
- 実現性: docs-only であり、文書編集のみで完結する（コード変更 0）。
- 整合性: 既存実装の用語と Phase 2 用語が完全一致し、不変条件 #5（D1 access apps/api 内閉鎖）と矛盾しない。
- 運用性: cross-link 強化により UT-04 / UT-09 担当者が「迷わず辿れる」状態になる。
- 認可境界: 本 Phase は文書編集のみで権限境界を変更しない。
- 直交性: U-8（enum）/ U-9（retry / offset）への越境は無く、用語統一の範囲内に収まる。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 用語揺れの洗い出し | 8 | spec_created | rg で実測 |
| 2 | マッピング表の 4 列正規化 | 8 | spec_created | 13 行 × 4 列 |
| 3 | 4 案比較表の評価軸正規化 | 8 | spec_created | 4 軸 × 4 案 |
| 4 | 重複記述削減 | 8 | spec_created | 6 集約先 |
| 5 | cross-link 追加 | 8 | spec_created | navigation drift 0 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 文書 DRY 化結果（Before/After・重複集約方針・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] Before / After 比較テーブルが 4 区分（用語 / マッピング表 / 4 案比較表 / cross-link）で埋まっている
- [ ] 重複集約方針が 6 件以上列挙されている
- [ ] navigation drift（phase / outputs / 親仕様 / UT-04 / UT-09 / aiworkflow-requirements）が 0
- [ ] 用語統一ルール（概念 = `sync_log` / 物理 = `sync_job_logs` / `sync_locks`）が明文化されている
- [ ] outputs/phase-08/main.md が作成済み
- [ ] コード変更 0（docs-only 維持）

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After 4 区分網羅、重複集約 6 件、navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - 統一済み用語ルール（概念 vs 物理 canonical）を grep 検証の前提として使用
  - 単一正本化された 6 集約先（`outputs/phase-02/*.md`）を品質ゲート対象に固定
  - navigation drift 0 状態を Phase 9 link 検証で再確認
  - aiworkflow-requirements drift 検出を Phase 9 で実測する前提条件を引き継ぐ
- ブロック条件:
  - Before / After に空セルが残る
  - 用語揺れが残置している
  - cross-link 切れが残る
  - 重複記述の集約先が決まっていない
