# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化 / 仕様間整合) |
| 次 Phase | 10 (最終レビューゲート) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| タスク分類 | specification-design（QA） |

## 目的

docs-only / NON_VISUAL タスクとしての品質保証を行う。実装の test 実行や無料枠見積もりではなく、**「契約文書としての網羅性」「AC トレーサビリティ」「既存値カバレッジ」「不変条件遵守」「直交性」「link / line budget」** の 6 観点で QA する。

UT-04 / UT-09 が本仕様書のみを根拠に migration / 既存実装書き換えに着手するため、ここでカバレッジ漏れ（特に既存値リテラルの grep 結果 → canonical マッピング表との照合漏れ）を見落とすと、後段で `SQLITE_CONSTRAINT` 等の本番障害に直結する。

## 実行タスク

1. 全 AC（AC-1 〜 AC-8）が成果物にトレース可能か確認する（完了条件: AC × 成果物 path × 該当セクション の 3 列表が完成し、空セルが 0）。
2. 苦戦箇所 5 件すべてが AC または対策表に対応していることを確認する（完了条件: 起票.md §苦戦箇所 の 5 件すべてに対応 AC 番号 or リスク対策表行が紐づく）。
3. 既存値 → canonical 値マッピングが既存値リテラルを **全件カバー** しているか確認する（完了条件: `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` の grep 結果と Phase 2 マッピング表が 1:1 で対応、未カバー 0）。
4. shared 配置決定が U-UT01-10 と直交 or 統合のどちらかに明記されているか確認する（完了条件: AC-4 の判定が「統合」「分離」のいずれか一意に確定）。
5. 不変条件 #4 / #5 への違反がないか確認する（完了条件: `triggered_by='admin'` 別カラム化が不変条件 #4 と整合 / shared パッケージは型 / Zod のみで D1 binding に触れず不変条件 #5 と整合）。
6. line budget を確認する（完了条件: 250 行超過ファイルは実測値と例外理由、または分割候補を記録し、PASS と誤記しない）。
7. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-XX.md / 関連タスク dir 間のリンク切れが 0）。
8. mirror parity / a11y を判定する（完了条件: docs-only / NON_VISUAL のため双方 N/A と明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-08.md | DRY 化済みの単一正本 path |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/index.md | AC / 不変条件 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票仕様（苦戦箇所 5 件） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存値リテラル grep 対象 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存物理スキーマの enum 候補 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-09.md | QA 観点の参照事例 |

## AC トレーサビリティ表

| AC | 内容 | 対応成果物 | 該当セクション | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `status` canonical set 確定（5 値） | `outputs/phase-02/canonical-set-decision.md` | §status canonical set | 仕様確定 |
| AC-2 | `trigger_type` canonical set 確定（3 値）+ `triggered_by` 別カラム | `outputs/phase-02/canonical-set-decision.md` | §trigger_type canonical set / §actor 分離 | 仕様確定 |
| AC-3 | 既存値 → canonical 値マッピング表（変換 UPDATE 疑似 SQL 含む） | `outputs/phase-02/value-mapping-table.md` | §マッピング表 / §migration 疑似 SQL | 仕様確定 |
| AC-4 | shared 配置先決定（U-UT01-10 統合 or 分離） | `outputs/phase-02/shared-placement-decision.md` | §配置先 / §U-UT01-10 関係 | 仕様確定 |
| AC-5 | 既存実装書き換え対象範囲リスト | `outputs/phase-05/rewrite-target-list.md` | §ファイル × 行番号 × 変更種別 | 仕様確定 |
| AC-6 | U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係 | `index.md` + 起票.md §直交関係 | §直交関係 | 仕様確定 |
| AC-7 | 4条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS | `outputs/phase-10/go-no-go.md` | §4条件最終判定 | Phase 10 で確定予定 |
| AC-8 | Phase 12 で 7 必須成果物確認 | `outputs/phase-12/*.md` | §7 必須成果物 | Phase 12 で確定予定 |

## 苦戦箇所 5 件の AC 紐付け

| # | 苦戦箇所（起票.md より） | 対応 AC | 対応リスク対策 |
| --- | --- | --- | --- |
| 1 | DB 制約層（CHECK 追加で既存行が一斉に制約違反） | AC-3 | 「変換 UPDATE → CHECK 追加の 2 段階」が migration 疑似 SQL に明記 |
| 2 | 集計クエリ層（`status='success'` ハードコードで silent drift） | AC-5 | 既存実装書き換え対象に集計クエリ箇所が grep 結果として含まれる |
| 3 | UI ラベル層（switch 文 default 灰色バッジ） | スコープ外（含まない） | UI 文言更新は別タスク、本タスクは「監視観点」を Phase 6 異常系に明記 |
| 4 | trigger 差分の意味論軸（who vs how） | AC-2 | `manual/cron/backfill` を mechanism 軸、`triggered_by` を actor 軸に分離 |
| 5 | shared 配置の罠（types のみ vs Zod 併設） | AC-4 | 型 = 静的 / Zod = ランタイムの併設方針が `outputs/phase-02/shared-placement-decision.md` に明記 |

> 苦戦箇所 #3 は本タスクのスコープ外だが、QA 観点として「Phase 6 異常系で集計サイレント沈黙の検知策に言及済み」かを確認する。

## 既存値カバレッジ確認

### grep 対象と既存値リテラル

| ファイル | grep パターン | 既存値リテラル | カバー先 |
| --- | --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `'running'\|'success'\|'failed'\|'skipped'` | `running` / `success` / `failed` / `skipped` | Phase 2 マッピング表 status 列 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `'admin'\|'cron'\|'backfill'` | `admin` / `cron` / `backfill` | Phase 2 マッピング表 trigger_type 列 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | `CHECK\|status TEXT\|trigger` | （CHECK 句なし、TEXT のみ） | Phase 2 マッピング表 / Phase 5 contract-runbook §CHECK 追加方針 |

### マッピング表カバレッジ判定

| 既存値 | canonical 値 | 変換方針 | 判定 |
| --- | --- | --- | --- |
| `running` | `in_progress` | UPDATE 文で一括変換 | カバー |
| `success` | `completed` | UPDATE 文で一括変換（集計クエリ書き換えと連動） | カバー |
| `failed` | `failed` | 変換不要（同名） | カバー |
| `skipped` | `skipped` | canonical 5 値目に昇格、変換不要 | カバー |
| `admin` | `manual` + `triggered_by='admin'` | UPDATE で 2 列に分離 | カバー |
| `cron` | `cron` | 変換不要（同名） | カバー |
| `backfill` | `backfill` | 変換不要（同名） | カバー |

> 既存値 7 件すべてが canonical へマッピング済み、未カバー 0。

## shared 配置と U-UT01-10 の関係（直交 or 統合の明示）

| 項目 | 本タスクの責務 | U-UT01-10 の責務 | 関係 |
| --- | --- | --- | --- |
| 配置先決定 | 本タスク Phase 2 で確定（types + Zod 併設） | 本決定を引用 | **本タスクが上位** |
| 型シグネチャ案 | 本タスク Phase 2 で `SyncStatus` / `SyncTriggerType` の型シグネチャを文章記述 | 本決定を引用して実装 | **本タスクが上位** |
| 実装コミット | 対象外（docs-only） | U-UT01-10 で実施 | **直交（実装は U-UT01-10）** |
| Zod schema コード | 対象外 | U-UT01-10 で実装 | **直交** |

**判定: 直交（本タスクは決定まで、実装は U-UT01-10）**。AC-4 にこの判定を明記すること。

## 不変条件遵守チェック

| 不変条件 | 本タスクでの取り扱い | 違反有無 |
| --- | --- | --- |
| #1 実フォーム schema をコードに固定しすぎない | sync 系 enum は Sheets schema 起源ではないため非該当 | 該当せず |
| #2 consent キーは `publicConsent` / `rulesConsent` 統一 | sync 系のため非該当 | 該当せず |
| #3 `responseEmail` は system field | sync 系のため非該当 | 該当せず |
| #4 admin-managed data はフォーム外として分離 | `triggered_by='admin'` を `sync_job_logs` に独立カラム化（admin-managed metadata） | **遵守** |
| #5 D1 への直接アクセスは `apps/api` に閉じる | shared パッケージは型 / Zod のみ、D1 binding には触れない | **遵守** |
| #6 GAS prototype は本番仕様に昇格させない | 本タスクは sync の D1 側責務、GAS prototype 非関与 | 該当せず |
| #7 MVP では Form 再回答が本人更新の正式経路 | sync 側 enum のため非関与 | 該当せず |

## line budget 確認

| ファイル | 実測行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md / phase-01〜09.md | 実測対象 | 250 行以内 | 要測定 |
| phase-10.md | 261 | 250 行以内 | MINOR（11 行超過。次回分割候補） |
| phase-11.md | 298 | 250 行以内 | MINOR（NON_VISUAL 手順が長い。outputs へ詳細退避候補） |
| phase-12.md | 351 | Phase 12 例外あり | PASS_WITH_EXCEPTION |
| phase-13.md | 75 | 250 行以内 | PASS（縮約済み） |

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 起票 unassigned-task 参照 | `docs/30-workflows/unassigned-task/U-UT01-08-...md` | 実在 |
| 関連タスク参照（U-UT01-07/09/10） | 各起票 .md | 実在 |
| 後続タスク参照（UT-04 / UT-09） | 各タスク dir の index.md | 実在 |
| GitHub Issue link | Issue #262（CLOSED 状態のまま） | 実在 |

## mirror parity / a11y 判定（双方 N/A）

- **mirror parity**: 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の reference を **参照** するのみ）。ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスクは N/A**。
- **a11y**: 本タスクは契約文書（Markdown）のみで UI を持たない。ゆえに WCAG 2.1 / a11y 観点は **対象外**。関連の a11y 確認は本契約を参照する UI タスク（管理ダッシュボードの status バッジ等）で行う。

## 実行手順

### ステップ 1: AC トレーサビリティ表の作成
- AC-1 〜 AC-8 を 8 行で表化、対応成果物 path と該当セクションを埋める。

### ステップ 2: 苦戦箇所 5 件の紐付け
- 起票.md §苦戦箇所 を 5 行で表化、AC 番号またはリスク対策表行と紐付ける。

### ステップ 3: 既存値 grep カバレッジ確認
- `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` を grep。
- 既存値 7 件すべてが Phase 2 マッピング表でカバーされているか照合。

### ステップ 4: shared 配置の U-UT01-10 関係判定
- 直交 / 統合 のいずれかを AC-4 で確定。

### ステップ 5: 不変条件遵守チェック
- #4 / #5 を中心に違反 0 を確認。

### ステップ 6: line budget / link / mirror / a11y
- 4 項目を順次確認、双方 N/A / 対象外を明記。

### ステップ 7: outputs/phase-09/main.md に集約

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | AC トレーサビリティ + 既存値カバレッジ + 不変条件遵守 を GO/NO-GO の根拠に使用 |
| Phase 11 | 手動検証 evidence の前提として AC × 成果物 path 表を参照 |
| Phase 12 | implementation-guide.md / phase12-task-spec-compliance-check.md に QA 結果を転記 |
| UT-04 | canonical 値ドメイン × 既存値カバレッジ を migration CHECK 句設計に引き渡し |
| UT-09 | 既存実装書き換え対象 × 集計クエリ silent drift 対策を引き渡し |

## 多角的チェック観点

- 価値性: AC トレーサビリティで後続実装着手時の根拠が明確。
- 実現性: 既存値 7 件すべてが canonical にマッピング済み、UPDATE 疑似 SQL でカバレッジ証明済み。
- 整合性: 不変条件 #4 / #5 遵守、関連タスク 3 件と直交。
- 運用性: link 検証 + line budget で長期メンテナンス性確保。
- 認可境界: `triggered_by` 別カラム化で actor / mechanism 軸を分離、admin 権限境界を schema レベルで識別。
- 無料枠: docs-only のため D1 影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC トレーサビリティ表作成 | 9 | spec_created | 8 AC 全件 |
| 2 | 苦戦箇所 5 件の AC 紐付け | 9 | spec_created | 全件対応 |
| 3 | 既存値カバレッジ確認 | 9 | spec_created | 7 既存値全カバー |
| 4 | shared 配置の U-UT01-10 関係判定 | 9 | spec_created | 直交を確定 |
| 5 | 不変条件 #4 / #5 遵守確認 | 9 | spec_created | 違反 0 |
| 6 | line budget 計測 | 9 | spec_created | 100-250 行 |
| 7 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 8 | mirror parity / a11y 判定 | 9 | spec_created | 双方 N/A / 対象外 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（6 観点 + AC トレース + 既存値カバレッジ） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] AC トレーサビリティ表に 8 AC 全件が成果物 path 付きで記述
- [ ] 苦戦箇所 5 件すべてが AC または対策表に紐付き
- [ ] 既存値 7 件すべてが canonical マッピングでカバー（未カバー 0）
- [ ] shared 配置の U-UT01-10 関係が「直交」で確定
- [ ] 不変条件 #4 / #5 違反 0
- [ ] line budget は実測値で記録し、超過ファイルは例外または分割候補を明示
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity / a11y が双方 N/A / 対象外と明記
- [ ] outputs/phase-09/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 6 観点（AC × 苦戦箇所 × 既存値 × 不変条件 × link × mirror/a11y）すべて記述
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビューゲート)
- 引き継ぎ事項:
  - AC トレーサビリティ表（Phase 10 GO/NO-GO 根拠）
  - 既存値カバレッジ 100%（UT-04 / UT-09 の migration CHECK 設計に必須）
  - 不変条件 #4 / #5 遵守（最終判定の整合性根拠）
  - shared 配置の U-UT01-10 関係 = 直交（実装は別タスク）
  - mirror parity / a11y 双方 N/A / 対象外
- ブロック条件:
  - AC × 成果物 のトレースに空セルが残る
  - 既存値カバレッジに未カバー（grep 結果に Phase 2 マッピング表で扱っていない値）が残る
  - 不変条件 #4 / #5 違反が見つかる
  - shared 配置の U-UT01-10 関係が未決
