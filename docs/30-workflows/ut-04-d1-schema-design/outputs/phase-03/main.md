# Phase 3: 設計レビュー — main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 3 / 13（設計レビュー） |
| visualEvidence | NON_VISUAL |
| 入力 | `outputs/phase-02/{schema-design,sheets-d1-mapping,migration-strategy}.md` |
| 出力 | 本ファイル（`outputs/phase-03/main.md`） |

## 1. 代替案の列挙

### 案 A: canonical 6 + 補助テーブル分離（base case = Phase 2 採用）

- 概要: `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` を canonical とし、admin-managed / 認証 / 同期ジョブログを補助テーブルへ分離。`members` は `member_identities JOIN member_responses` の VIEW として提供。
- 利点: 既存 migration（0001〜0006）と完全整合。`stable_key` 経由で Forms schema 変動に強い。consent と publish_state を分離し不変条件 #2 / #4 を満たす。
- 欠点: response_fields の行数が膨らむ（150K rows / 5000 responses × 30 fields）。SQLite 性能は十分だが index 設計に注意。

### 案 B: 完全正規化（業種・スキル・SNS を別テーブル化）

- 概要: SNS URL / 業種 / スキルを正規化テーブル（`member_sns_links` / `member_skills` 等）に分離。
- 利点: ER 図として綺麗。集計クエリが書きやすい。
- 欠点: Sheets 1 行 → 複数 D1 row 分解が必要で UT-09 mapper が複雑化。MVP スコープを越える。multi-JOIN の性能リスク（D1 SQLite）。

### 案 C: surrogate key (UUID) vs natural key only

- C-1: PK = `member_id`（UUID）+ UNIQUE(`response_email`) ← Phase 2 base case（既存 0001_init.sql）
- C-2: PK = `response_email`（natural key only）
- C-1 利点: email 変更や Forms 行並び替えに強い。外部 ID 漏洩なし。
- C-2 欠点: email 変更時に PK 破綻、FK 連鎖更新コストが大。
- 採用: C-1（既存実装と整合）。

### 案 D: soft delete (member_status.is_deleted) vs hard delete + members_history

- D-1: `member_status.is_deleted` で soft delete + `deleted_members` で履歴記録 ← Phase 2 base case（既存 0002_admin_managed.sql）
- D-2: hard delete + 全変更を `members_history` テーブルに triple-write
- D-1 利点: 誤削除復旧容易、index で active filter 簡単。
- D-2 欠点: 同期 triple-write 化、書き込み 2 倍、UT-09 複雑化。MVP 範囲外。
- 採用: D-1。D-2 は Wave 2+ の audit 強化要件発生時に再検討。

### 案 E: PRAGMA foreign_keys 取り扱い

- E-1: migration 内で `PRAGMA foreign_keys = ON;` のみ（base case）
- E-2: migration + runtime（binding 取得直後に `db.exec`）の duplex 設定
- 現状 0001〜0006 は FK 句未使用のため E-1 で十分。
- 採用: E-1。FK 導入する後続 migration で E-2 に切り替える条件を migration-strategy.md に open question として記録。

## 2. 評価マトリクス（8 観点 × 5 案）

| 観点 | 案 A (base) | 案 B (完全正規化) | 案 C-2 (natural PK) | 案 D-2 (history) | 案 E-2 (duplex FK) |
| --- | --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | PASS | PASS | PASS |
| 実現性 | PASS | MINOR（mapper 複雑化） | MINOR（PK 破綻リスク） | MINOR（triple-write） | PASS |
| 整合性（不変条件 #1/#4/#5） | PASS | PASS | PASS | PASS | PASS |
| 運用性 | PASS | MINOR（ER 図保守） | MAJOR（email 変更で PK 崩壊） | MINOR（history 保守） | MINOR（runtime hook 増） |
| SQLite 型整合 | PASS | PASS | PASS | PASS | PASS |
| 無料枠 | PASS | PASS | PASS | MINOR（writes 2 倍） | PASS |
| data-contract.md 整合 | PASS | MINOR（契約と実装の隔たり拡大） | PASS | PASS | PASS |
| MVP スコープ整合 | PASS | MAJOR（範囲超過） | PASS | MAJOR（範囲超過） | PASS（FK 導入時のみ） |

### 採用結論

- base case = 案 A + C-1 + D-1 + E-1。既存 migration（0001〜0006）と完全整合。
- 案 B / D-2 は MVP スコープ外。Wave 2+ で再評価。
- 案 C-2 は MAJOR を内包するため不採用。
- 案 E-2 は FK 句を導入する後続 migration の作成時にスイッチ可能（open question #1）。

## 3. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 実装時に運用上の補足対応（runbook 追記 / migration 内コメント）が必要だが Phase 4 移行は許可 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する |

## 4. base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 / UT-21 / UT-06 が依存できる確定 schema を、既存 migration の docs 化という最小コストで提供 |
| 実現性 | PASS | 0001〜0006 が稼働中。`bash scripts/cf.sh d1 migrations apply` で適用フロー確立 |
| 整合性 | PASS | 不変条件 #1（schema 抽象化）/ #2（consent 統一）/ #3（responseEmail = system field）/ #4（admin-managed 分離）/ #5（apps/api 限定）/ #7（response_id / member_id 別 PK）すべて満たす |
| 運用性 | PASS | 連番 migration 規約 + scripts/cf.sh runbook + soft delete で再現性・回復性を両立 |
| 不変条件 #1 | PASS | DDL に Forms 列ラベルのハードコードゼロ、schema_questions.stable_key で抽象化 |
| 不変条件 #4 | PASS | admin-managed data は member_status / meeting_sessions / admin_member_notes 等に分離 |
| 不変条件 #5 | PASS | migration は `apps/api/migrations/` 固定 |
| SQLite 型整合 | PASS | DATETIME 全列 TEXT、ISO 8601 規約 |
| 無料枠 | PASS | D1 5GB / 25M reads / 50K writes 枠内（MVP 数千行スケール） |
| data-contract.md 整合 | PASS | data-contract.md = 契約 / schema-design.md = 実装 refinement と役割明示 |
| MVP スコープ整合 | PASS | canonical 6 + 補助のみ、過剰正規化なし |

**最終判定: 全観点 PASS（MAJOR ゼロ / MINOR ゼロ）**

## 5. data-contract.md 整合性確認

| 確認項目 | 確認方法 | 期待結果 | 現状 |
| --- | --- | --- | --- |
| Sheets source-of-truth 宣言 | data-contract.md を Read | 「Sheets が正本、D1 はキャッシュ層」と明記 | 03 系タスクの data-contract.md が未確定の場合は open question #1 で継続レビュー |
| canonical テーブルの存在 | data-contract.md と schema-design.md を突合 | `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` の 6 テーブルが両方に存在 | schema-design.md に記載済 |
| 列名・型の一致 | 両ドキュメントを突合 | 矛盾ゼロ | sheets-d1-mapping.md の stable_key と database-schema.md を突合済 |
| 役割境界 | 階層関係 | data-contract.md = 契約 / schema-design.md = 実装 refinement | 明示済 |
| ownership 明示 | 重複排除 | data-contract.md = 03 系 / DDL = UT-04 | 明示済 |

> 03 系タスクの data-contract.md が未確定の場合、本タスクは暫定 source-of-truth として schema-design.md を扱う。03 系完了時に統合レビューを再実施する旨を open question #1 に登録。

## 6. 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て充足）

- [x] 代替案 5 案（A / B / C-2 / D-2 / E-2）が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS
- [x] MAJOR ゼロ（base case に対して）
- [x] MINOR ゼロ（base case に対して）
- [x] data-contract.md との整合確認、または open question #1 として明示
- [x] open question 5 件すべてに受け皿 Phase が割り当てられている

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る → 該当なし
- DDL に NOT NULL / PK 抜けが残る → 該当なし（既存 migration を Phase 2 で確認済）
- DATETIME 列が TEXT 以外で宣言されている → 該当なし（全 TEXT）
- migration 連番規約が未確定 → 該当なし（migration-strategy.md で確定）
- data-contract.md と明確な矛盾あり → 該当なし

**判定: GO（Phase 4 へ進む）**

## 7. open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | data-contract.md（03 系）が未確定の場合、暫定 source-of-truth として schema-design.md を扱うか | Phase 4 / 03 系完了後に統合レビュー再実施 | 役割境界は本 Phase で明示済 |
| 2 | sync_jobs / sync_job_logs の retention 期間（90 日 / 365 日） | Phase 12 / UT-08 monitoring 連携 | pruning タスクは別建て |
| 3 | 完全正規化（案 B）への移行時期 | Phase 12 unassigned-task-detection | 次 Wave 以降 |
| 4 | members_history（案 D-2）の audit 強化への昇格時期 | Phase 12 / UT-21 連携 | audit 要件の進展次第 |
| 5 | `PRAGMA foreign_keys` runtime duplex 設定（案 E-2）への切り替え条件 | Phase 5 / 後続 FK 導入 migration 作成時 | 現状 FK 句未使用のため不要 |

## 8. 多角的チェック観点

- 価値性: 既存 migration をそのまま正本化できるため、追加実装コストゼロで後続タスクが依存できる契約を提供。
- 実現性: 案 B / D-2 の MINOR を base case が踏まないことを確認。
- 整合性: 不変条件 #1 / #2 / #3 / #4 / #5 / #7 が PASS であることを確認。
- 運用性: 案 C-2 の MAJOR（PK 破綻）を回避し、UUID + UNIQUE(response_email) の duplex で解決。
- SQLite 型: 全 DATETIME が TEXT で統一済（既存 migration で確認）。
- 無料枠: 5GB / 25M reads / 50K writes に収まる（MVP 数千行スケール）。
- data-contract.md 整合: 役割境界が「契約 vs 実装 refinement」として明示。

## 9. 次 Phase への引き渡し

- 次 Phase: 4（テスト戦略）
- 引き継ぎ事項:
  - 採用 base case = 案 A + C-1 + D-1 + E-1
  - canonical 6 テーブル（member_responses / member_identities / member_status / response_fields / schema_diff_queue / sync_jobs）に対する DDL 適用テスト観点
  - mapping 契約テスト（Forms 設問 → response_fields.stable_key）の対象
  - data-contract.md 整合の継続確認（03 系完了時に再レビュー）
  - open question 5 件を該当 Phase へ register
- ブロック条件: 該当なし（GO 判定）
