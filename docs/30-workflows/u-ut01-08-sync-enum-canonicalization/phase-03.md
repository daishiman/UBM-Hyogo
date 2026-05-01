# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 2（設計 - canonical set 決定） |
| 次 Phase | 4（検証戦略 - 型テスト雛形） |
| 状態 | spec_created |
| タスク分類 | docs-only（design review gate） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した (1) `canonical-set-decision.md` / (2) `value-mapping-table.md` / (3) `shared-placement-decision.md` に対し、最低 2 案以上の代替案を比較し、4 条件（価値性 / 実現性 / 整合性 / 運用性）+ 観点別（不変条件 #4 / #5、U-UT01-07/09/10 直交性、2 段階 migration 順序、grep 漏れ）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 当該観点で base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念あり（例: ドキュメント文言追補で解消可能 / 後続 Phase で吸収可能） | base case 維持。Phase 4-5 で追補メモ化 |
| **MAJOR** | 不変条件違反 / 採択理由が代替案で覆る / 直交性破綻 / 既存値漏れ | **Phase 2 に差し戻し**。canonical set / マッピング / 配置のいずれかを再起草 |

> **MAJOR が 1 件でも検出された場合、Phase 4 へ進まず Phase 2 に戻す**。MINOR のみであれば次 Phase へ進行可。

## 代替案比較（最低 2 案以上）

### 軸 A: `status` canonical set

| 案 | 値セット | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **A-1: 5 値（base case）** | pending / in_progress / completed / failed / skipped | ライフサイクル軸（pending→in_progress→終端）と終端 3 種が直交。集計クエリで `WHERE status='completed'` のみで成功率算出可能 | enum 値が 1 つ増える | ✅ |
| A-2: 4 値（skipped を completed に畳み込み + skipReason 列） | pending / in_progress / completed / failed | UT-01 論理設計と完全一致 | 集計時に `WHERE status='completed' AND skipReason IS NULL` を全箇所で要求。漏れによるメトリクス汚染リスク大。既存 `skipped` 行の意味論が失われる | - |
| A-3: 6 値（`canceled` 追加） | pending / in_progress / completed / failed / skipped / canceled | 将来の手動キャンセル機能に対応 | MVP スコープ外の機能を先取り。YAGNI 違反 | - |

**判定**: A-1 PASS（A-2 は集計層リスクで MAJOR 相当、A-3 は YAGNI で MINOR）。

### 軸 B: `trigger_type` canonical set

| 案 | 値セット + actor 表現 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **B-1: how 軸 3 値 + `triggered_by` 別カラム（base case）** | manual / cron / backfill + triggered_by TEXT NULL | how 軸と who 軸が直交。後発機能（cron からの ad-hoc 起動）追加で再衝突しない。不変条件 #4（admin-managed data 分離）に整合 | カラム 1 つ追加（migration 1 段階増） | ✅ |
| B-2: who 軸維持（admin / cron / backfill のまま） | admin / cron / backfill | 既存実装変更最小 | actor と mechanism が混在。「cron からの admin 介入」のような複合状態を表現できない。意味論ねじれが累積 | - |
| B-3: how + who 連結文字列（manual:admin / cron:system 等） | 連結 enum | 1 列で表現可能 | 値ドメインが指数膨張。CHECK 句が肥大化。UI / 集計クエリで分解パース必須 | - |

**判定**: B-1 PASS（B-2 は意味論ねじれで MAJOR、B-3 は値ドメイン管理性で MAJOR）。

### 軸 C: shared 配置

| 案 | 配置 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **C-1: types + zod 併設（base case）** | `packages/shared/src/types/sync.ts` + `packages/shared/src/zod/sync.ts`（z.infer で TS 型導出） | 静的型 = 開発時保証 / Zod = ランタイム検証の両層を獲得。不変条件 #5（D1 直接アクセスは apps/api 限定）を侵さない | ファイル 2 つに増加 | ✅ |
| C-2: types only | `packages/shared/src/types/sync.ts` のみ | 軽量 | DB 書き込み / API 受領時のランタイム検証が漏れる。CHECK 句任せになり migration 適用前のデータ汚染を許す | - |
| C-3: zod only | `packages/shared/src/zod/sync.ts` のみ | 検証一元化 | 全箇所で `z.infer` 経由になり、純型参照（型計算）が冗長化 | - |

**判定**: C-1 PASS（C-2 / C-3 は MINOR：吸収可能だが推奨外）。

### 軸 D: U-UT01-10 との関係

| 案 | 関係 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **D-1: 分離（本タスクは配置判断のみ、実装コミットは U-UT01-10）（base case）** | 責務分離 | 本タスクが docs-only に閉じる。U-UT01-10 の独立価値が維持 | - | ✅ |
| D-2: 統合（本タスクで実装まで実施し U-UT01-10 を close） | 1 タスクで完結 | タスク数削減 | 本タスクが docs-only から外れ taskType 違反。U-UT01-10 の起票根拠（shared 契約全体）も範囲外 | - |

**判定**: D-1 PASS（D-2 は taskType 違反で MAJOR）。

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 層（DB / 集計 / UI / 監査）が単一値ドメインを参照する契約が確定。UT-04 / UT-09 が線形に着手可能 |
| 実現性 | PASS | 文書化のみ。CLI / migration 実行不要。grep 範囲・行範囲が UT-04 / UT-09 着手粒度 |
| 整合性 | PASS | 不変条件 #4（admin metadata 分離）/ #5（D1 境界）/ U-UT01-07/09/10 との直交性すべて維持 |
| 運用性 | PASS | 2 段階 migration 順序（変換 UPDATE → CHECK 追加 → ALTER TABLE）が仕様で固定。production 障害シナリオが未然に閉じる |

## レビュー観点別判定

| 観点 | 判定 | 根拠・残課題 |
| --- | --- | --- |
| 不変条件 #4（admin-managed data 分離） | PASS | `admin` を canonical から外し `triggered_by` 別カラム化 = 分離原則に整合 |
| 不変条件 #5（D1 アクセスは apps/api 限定） | PASS | shared パッケージは型 / Zod のみ。binding 直接参照は apps/api に閉じる |
| U-UT01-07（命名整合）との直交性 | PASS | 本タスクは値ドメインのみ。テーブル名（`sync_log` / `sync_job_logs` / `sync_locks`）は U-UT01-07 に委譲 |
| U-UT01-09（retry / offset 統一）との直交性 | PASS | 本タスクは enum 値のみ。`DEFAULT_MAX_RETRIES` / `processed_offset` は U-UT01-09 に委譲 |
| U-UT01-10（shared 契約型 / Zod 化）との直交性 | PASS | 本タスクは配置判断 + 型シグネチャ案までで停止。実装コミットは U-UT01-10 |
| 2 段階 migration 順序 | PASS | 変換 UPDATE → CHECK 追加 → ALTER TABLE が `value-mapping-table.md` で固定。UT-04 へ引き渡し |
| 既存値 grep 漏れ | （Phase 2 実行時確認） | `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` の `'running'` / `'success'` / `'skipped'` / `'admin'` / `'cron'` / `'backfill'` / `'failed'` 全箇所が書き換え対象リストに列挙されているか実 grep で確認 |

## 着手可否ゲート

- すべての軸（A / B / C / D）と観点が **PASS**: Phase 4 へ GO。
- いずれかが **MINOR**: 残課題として記録し Phase 4 へ GO（Phase 5 runbook で追補吸収）。
- いずれかが **MAJOR**: NO-GO。Phase 2 に差し戻し当該成果物を再起草。

## 残課題（open question）

| # | 内容 | 委譲先 |
| --- | --- | --- |
| 1 | UI バッジ色分け実装の更新範囲 | 別タスク（UT-08 監視ダッシュボード or i18n タスク） |
| 2 | 監視アラート閾値の改訂 | U-UT01-04 連動 |
| 3 | shared パッケージへの実コミット | U-UT01-10 |
| 4 | migration ファイル作成・適用 | UT-04 / UT-09 |

## 実行タスク

1. 軸 A / B / C / D それぞれで最低 2 案の代替案比較表を `outputs/phase-03/main.md` に記述する（完了条件: 各軸 2 案以上 + base case フラグ + 利点 / 欠点が表形式）。
2. 4 条件 PASS / MINOR / MAJOR 判定を根拠付きで記述する（完了条件: 4 セルすべてに判定 + 根拠）。
3. 観点別判定（不変条件 #4 / #5、直交性 3 件、2 段階 migration、grep 漏れ）を表化する（完了条件: 7 観点すべてに判定）。
4. 着手可否ゲート判定を実施し、GO / NO-GO を明示する（完了条件: 判定結果が文書化）。
5. 残課題を別タスク・別 Phase に振り分ける（完了条件: open question 表で委譲先が明示）。
6. MAJOR 検出時の Phase 2 戻しトリガを定義する（完了条件: 「MAJOR 1 件で戻し」基準が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-02.md | レビュー対象設計 |
| 必須 | outputs/phase-02/canonical-set-decision.md | base case の status / trigger 決定 |
| 必須 | outputs/phase-02/value-mapping-table.md | base case のマッピング表 |
| 必須 | outputs/phase-02/shared-placement-decision.md | base case の shared 配置 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界制約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 規約 |

## 完了条件チェックリスト

- [ ] 軸 A / B / C / D それぞれで最低 2 案の代替案比較が記述
- [ ] 4 条件評価マトリクスに空セルゼロ
- [ ] 観点別判定 7 件（不変条件 #4 / #5、U-UT01-07/09/10、2 段階 migration、grep 漏れ）すべてに判定
- [ ] PASS / MINOR / MAJOR の判定基準が文書化
- [ ] 着手可否ゲート（GO / NO-GO）が明示
- [ ] MAJOR 検出時の Phase 2 戻しトリガが定義
- [ ] 残課題が委譲先付きで列挙
- [ ] 不変条件 #4 / #5 違反ゼロ
- [ ] U-UT01-07 / U-UT01-09 / U-UT01-10 との責務侵食ゼロ

## 多角的チェック観点

- **代替案網羅性**: A-2（4 値畳み込み）/ B-2（who 軸維持）/ B-3（連結文字列）/ C-2（types only）/ C-3（zod only）/ D-2（統合）の各リスクが本 Phase で**明示的に却下されている**こと（暗黙却下は不可）。
- **直交性**: U-UT01-07 / U-UT01-09 / U-UT01-10 の起票仕様 `スコープ含まない` セクションと突き合わせ、本タスクが他タスクの責務を侵食していないこと。
- **migration 可逆性**: 2 段階順序が逆転した場合（CHECK 追加 → 変換 UPDATE）の production 障害シナリオが Phase 6（異常系）へ引き継がれていること。
- **集計層 silent drift**: A-2 案を採った場合の `WHERE status='completed' AND skipReason IS NULL` 漏れリスクが代替案比較で言及されていること。
- **YAGNI**: A-3（`canceled` 追加）の MVP スコープ外性が記述されていること。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 軸 A 代替案比較（status 4 / 5 / 6 値） | 3 | pending | A-1 採択 |
| 2 | 軸 B 代替案比較（trigger how / who / 連結） | 3 | pending | B-1 採択 |
| 3 | 軸 C 代替案比較（types / zod / 併設） | 3 | pending | C-1 採択 |
| 4 | 軸 D 代替案比較（U-UT01-10 分離 / 統合） | 3 | pending | D-1 採択 |
| 5 | 4 条件再評価 | 3 | pending | 全 PASS |
| 6 | 観点別判定（7 件） | 3 | pending | 全 PASS or MINOR |
| 7 | 着手可否ゲート判定 | 3 | pending | GO / NO-GO 明示 |
| 8 | 残課題の委譲先確定 | 3 | pending | UT-04 / UT-09 / U-UT01-10 / 別タスク |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビューゲート結果（代替案比較 / 4 条件 / 観点別判定 / GO-NO-GO / 残課題） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- 軸 A / B / C / D の代替案比較がすべて 2 案以上
- 4 条件評価が全 PASS
- 観点別判定 7 件が全件評価済み
- MAJOR ゼロ（MINOR は許容）
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略 - 型テスト雛形）
- 引き継ぎ事項:
  - 軸 A / B / C / D の base case 確定（5 値 / 3 値 + triggered_by / types+zod 併設 / U-UT01-10 分離）
  - 4 条件評価 全 PASS
  - 残課題（UI バッジ / 監視アラート / shared 実コミット / migration 実装）の委譲先
  - 2 段階 migration 順序（変換 UPDATE → CHECK 追加 → ALTER TABLE）
- ブロック条件:
  - MAJOR 検出時 → Phase 2 戻し
  - 4 条件いずれかが MAJOR
  - 観点別判定で不変条件違反 / 直交性破綻
  - 代替案比較が 2 案未満
