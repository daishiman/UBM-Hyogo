# Phase 4: 検証戦略（契約検証）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-04-30 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（仕様 runbook 作成） |
| 状態 | spec_created |
| タスク分類 | specification-design（contract-validation） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは docs-only であり、ランタイムの動作テストは存在しない。本 Phase では Phase 2 で確定した canonical set（`status`: `pending` / `in_progress` / `completed` / `failed` / `skipped` / `trigger_type`: `manual` / `cron` / `backfill` + `triggered_by` 別カラム）に対し、**契約として正しく確定しているか**を検証する戦略を定める。検証対象は次の 4 軸:

1. 型契約レベル（exhaustive switch / `satisfies` チェック雛形の記述）
2. 既存値抽出 grep 計画（コード書き換え対象が漏れなく拾えるか）
3. migration 変換戦略の table-driven 検証（マッピング表に値漏れがないか）
4. 直交性チェック（U-UT01-07 / U-UT01-09 / U-UT01-10 の責務を侵食していないか）

実装・実行は本タスクのスコープ外であり、雛形と検査計画を文書化することが完了条件。

## 完了条件チェックリスト

- [ ] 型テスト雛形（exhaustive switch / `satisfies` 利用）が言語化されている（コード片 1〜2 種で十分、実装はしない）
- [ ] 既存値抽出 grep 計画（対象パス・対象パターン・期待ヒット箇所）が表形式で固定されている
- [ ] 既存値 → canonical 値マッピングに対する table-driven 検証手順（値漏れ / 双方向到達性チェック）が記述されている
- [ ] 直交性チェック（U-UT01-07 / 09 / 10 の「含まない」セクションとの突合）が一覧化されている
- [ ] 検証成果物のパス（`outputs/phase-04/test-strategy.md`）が確定している
- [ ] 「動作テストは行わない」旨と、後続実装タスク（UT-04 / UT-09 / U-UT01-10）に委譲する範囲が明記されている

## 実行タスク

1. 型テスト雛形を起草する（完了条件: `status` / `trigger_type` 両方に対し exhaustive switch の `assertNever` パターンと `satisfies readonly [...]` パターンの 2 種を、TypeScript の擬似コードとして提示）。
2. 既存値抽出 grep 計画を作成する（完了条件: 下記「grep 計画」表が成果物に含まれる）。
3. 変換マッピング検証手順を起草する（完了条件: 「現行値集合 ⊇ マッピング source」「canonical 値集合 ⊇ マッピング target」の 2 方向を覆う擬似 SQL とレビュー手順）。
4. 直交性チェックリストを作成する（完了条件: 関連タスク 3 件 × 各「含まない」項目との突合表）。
5. 成果物 `outputs/phase-04/test-strategy.md` の章立て（1〜4 を順に並べる）を確定する。

## 検証戦略詳細

### 1. 型契約検証（雛形のみ・実装しない）

| 検証手段 | 雛形概要 | 期待効果 |
| --- | --- | --- |
| exhaustive switch | `switch (status) { case 'pending': ...; case 'in_progress': ...; case 'completed': ...; case 'failed': ...; case 'skipped': ...; default: assertNever(status); }` を canonical 拡張時の TypeScript 型エラー検出器として記述 | 値追加時のコンパイル時破壊 |
| `satisfies` | `const STATUS = ['pending','in_progress','completed','failed','skipped'] as const satisfies readonly SyncStatus[]` で配列と型の一致を保証 | 配列ドリフト防止 |
| trigger_type / triggered_by 分離 | `triggered_by` は `string` ではなく `MemberId | 'system'` の弁別共用体型として記述する案を雛形に明記 | actor 軸の暗黙拡張防止 |

> 実装は U-UT01-10 の責務。本 Phase では雛形だけを記述する。

### 2. 既存値抽出 grep 計画

| # | パターン | 対象パス | 期待ヒット | 用途 |
| - | --- | --- | --- | --- |
| 1 | `'running'` | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 1〜複数 | rename target |
| 2 | `'success'` | `apps/api/src/jobs/sync-sheets-to-d1.ts` 他 | 1〜複数 | rename + 集計クエリ確認 |
| 3 | `'failed'` | `apps/api/src/jobs/**` / `apps/api/migrations/0002_*.sql` | 1〜複数 | canonical と一致（変更不要） |
| 4 | `'skipped'` | `apps/api/src/jobs/**` | 1〜複数 | canonical 採用判定 |
| 5 | `'admin'` | `apps/api/src/jobs/**` / migrations | 1〜複数 | `manual` rename + `triggered_by='admin'` 別カラム移送 |
| 6 | `'cron'` / `'backfill'` | 同上 | 各 1〜複数 | canonical と一致（変更不要） |
| 7 | `status =` / `trigger_type =` | `apps/**/*.ts` / `apps/**/*.sql` | 集計クエリ系 | silent drift 検出 |
| 8 | `CHECK (status IN` / `CHECK (trigger_type IN` | `apps/api/migrations/**.sql` | 0 件想定 | 現状 CHECK 未敷設の確認 |

検証手順: 各パターンを順に grep し、ヒット行をマッピング表（Phase 2 成果物 `value-mapping-table.md`）の source 側集合と突合する。マッピング source に存在しないリテラルが見つかった場合は Phase 2 へ戻る。

### 3. table-driven 変換検証

| 検証項目 | 手段 | PASS 基準 |
| --- | --- | --- |
| source 完全性 | grep 計画で見つかった既存値集合 ⊆ マッピング source 集合 | 差集合 = ∅ |
| target 健全性 | マッピング target 集合 ⊆ canonical set | 差集合 = ∅ |
| 一意性 | 同一 source が複数 target に分岐していないか | 同一 source の target が 1 つ（または明示的条件分岐付き） |
| `skipped` 取り扱い | 5 値目昇格 / `skipReason` 畳み込みのいずれが採択されたか | Phase 2 の決定が成果物に明記され、マッピング表に反映されている |
| `admin` 分離 | `admin → manual` + `triggered_by='admin'` の二重操作が記述されている | UPDATE 疑似 SQL に両方が含まれる |

### 4. 直交性チェック

| 関連タスク | 「含まない」項目 | 本タスクで侵食していないかの確認 |
| --- | --- | --- |
| U-UT01-07（命名整合） | テーブル物理名 / 論理名 対応 | 本タスクでテーブル名を変更していない（値ドメインのみ） |
| U-UT01-09（retry / offset） | `DEFAULT_MAX_RETRIES` / `processed_offset` カラム | 本タスクでリトライ関連カラム / 値を扱っていない |
| U-UT01-10（shared 契約型 / Zod） | shared への実装コミット | 本タスクは配置判断 + 型シグネチャ案までで停止し、実装ファイルを足していない |

PASS 基準: 3 タスクすべてに対し「侵食なし」を成果物で根拠付き宣言できる。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/canonical-set-decision.md` | 検証対象の canonical 値 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/value-mapping-table.md` | table-driven 検証の入力 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/shared-placement-decision.md` | 型雛形配置判断 |
| 必須 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | grep 対象 |
| 必須 | `apps/api/migrations/0002_sync_logs_locks.sql` | grep 対象 |
| 参考 | `docs/30-workflows/unassigned-task/U-UT01-07-*` / `U-UT01-09-*` / `U-UT01-10-*` | 直交性突合 |

## 成果物

| 成果物 | パス | 概要 |
| --- | --- | --- |
| 検証戦略書 | `outputs/phase-04/test-strategy.md` | 上記 4 軸（型契約 / grep 計画 / 変換検証 / 直交性）を統合した検査計画 |

## 次 Phase への引き渡し

- Phase 5 は本 Phase の grep 計画と変換検証手順を入力として、書き換え対象範囲リスト（`rewrite-target-list.md`）と契約 runbook を作成する。
- Phase 6 は本 Phase で列挙した「動作テスト不在」を踏まえ、ランタイムでは検出できない異常系（migration 失敗 / 集計 silent drift / UI default 落ち）を文書ベースで列挙する。

## 多角的チェック観点

- **価値性**: 動作テストがないため、型契約 + grep + 直交性突合で「ドリフト検出」を担保しているか
- **実現性**: 雛形が TypeScript 標準機能（`satisfies` / 弁別共用体）のみで成立しているか
- **整合性**: Phase 2 で決定した canonical set / マッピング表 / 配置判断と本 Phase の検査軸が 1:1 で対応しているか
- **運用性**: 後続タスク（UT-04 / UT-09 / U-UT01-10）の実装者が本 Phase の grep 計画をそのまま走査コマンドに変換できる粒度になっているか

## 注意事項

- 本 Phase は **コード変更なし**。雛形はあくまで Markdown 内の擬似コードとして記述する。
- ランタイムテストフレームワーク（Vitest 等）の導入は本タスクのスコープ外。
