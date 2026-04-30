# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク分類 | implementation（design review） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した DDL（schema-design.md） / マッピング（sheets-d1-mapping.md） / migration 戦略（migration-strategy.md）に対し、3 つ以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と各観点（不変条件 / SQLite 型整合 / 無料枠 / data-contract.md 整合）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。

## 実行タスク

1. 代替案を最低 3 案列挙する（A: 単一 members + 補助テーブル / B: 完全正規化（バンド・連絡先を分離） / C: surrogate key (UUID) vs natural key (sheets_row_id) のみ / D: soft delete (deleted_at) vs hard delete + history テーブル）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 5 観点で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用案 = 単一 members + 補助 + UUID + soft delete）の選定理由を確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載されている）。
5. data-contract.md との整合性確認を実施する（完了条件: data-contract.md と schema-design.md の役割境界が明示され、矛盾ゼロ）。
6. 着手可否ゲート（Phase 4 への GO / NO-GO）を定義する。
7. 残課題（open question）を Phase 4 以降へ振り分ける。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/schema-design.md | base case の DDL |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/sheets-d1-mapping.md | base case のマッピング |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/migration-strategy.md | base case の migration 戦略 |
| 必須 | docs/01-infrastructure-setup/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md（あれば） | 整合性確認の対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界制約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 規約 |

## 代替案比較

### 案 A: 単一 members + 補助テーブル（base case = Phase 2 採用）

- 概要: `members` を 1 つの非正規化テーブル（バンド名 / 連絡先 / ステータスを内包）として持ち、`sync_jobs` と `schema_diff_queue` のみ補助テーブル化。
- 利点: SQLite 性能良好、JOIN 不要、Sheets 1 行 = D1 1 行の対応が直感的、UT-09 mapper が単純。
- 欠点: 同一バンドに複数会員がいる場合に band_name の重複が発生（しかし MVP スコープでは許容）。

### 案 B: 完全正規化（bands / contacts / members 分離）

- 概要: `bands`、`contacts`、`members`、`band_members` の 4 テーブルに分離。
- 利点: データ重複ゼロ、ERD として綺麗。
- 欠点: Sheets 1 行 → 複数 D1 row への分解が必要で UT-09 mapper が複雑化。SQLite で多 JOIN は性能低下リスク（無料枠 25M reads/月の枠内とはいえ ORM 層が複雑）。MVP スコープを越える。

### 案 C: surrogate key (UUID) vs natural key only

- C-1: PK = UUID + UNIQUE(sheets_row_id) ← Phase 2 base case
- C-2: PK = sheets_row_id（natural key only）
- 比較:
  - C-1 利点: Sheets 行番号が変わっても安定参照、外部 ID 漏洩なし。欠点: id 生成コスト（軽微）。
  - C-2 利点: schema 単純、id 生成不要。欠点: Sheets 行削除・並び替え時に PK が破綻するリスク、PK が外部入力に依存する。
- 採用: C-1（base case）

### 案 D: soft delete (deleted_at) vs hard delete + history

- D-1: members に `deleted_at` カラム追加（soft delete）← Phase 2 base case
- D-2: hard delete + `members_history` テーブルで全変更を記録
- 比較:
  - D-1 利点: 誤削除復旧容易、index で active filter 簡単（`WHERE deleted_at IS NULL`）。欠点: テーブル肥大化（MVP スケールでは無視可能）。
  - D-2 利点: 監査・変更履歴完全保持。欠点: 実装複雑化、UT-09 同期ロジックが triple-write になる。
- 採用: D-1（base case）。D-2 は将来 audit 要件強化時に Wave 2+ で再検討。

### 案 E: PRAGMA foreign_keys 取り扱い

- E-1: migration 内で `PRAGMA foreign_keys = ON;` のみ（base case）
- E-2: migration + runtime（binding 取得直後）で duplex 設定
- 比較: 初期 schema では FK 未使用のため E-1 で十分。FK を導入する後続タスクで E-2 に切り替える条件を migration-strategy.md に open question として記録。

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (完全正規化) | 案 C-2 (natural PK) | 案 D-2 (history) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | PASS | PASS |
| 実現性 | PASS | MINOR（mapper 複雑化） | MINOR（PK 安定性リスク） | MINOR（同期 triple-write） |
| 整合性（不変条件 #1/#4/#5） | PASS | PASS | PASS | PASS |
| 運用性 | PASS | MINOR（ER 図保守コスト） | MAJOR（行並び替え時 PK 破綻） | MINOR（history 保守） |
| SQLite 型整合 | PASS | PASS | PASS | PASS |
| 無料枠 | PASS | PASS | PASS | MINOR（書き込み 2 倍） |
| data-contract.md 整合 | PASS | MINOR（契約と実装の隔たり拡大） | PASS | PASS |
| MVP スコープ整合 | PASS | MAJOR（範囲超過） | PASS | MAJOR（範囲超過） |

### 採用結論

- base case = 案 A + C-1 + D-1 + E-1 を採用。
- 理由: 4条件すべて PASS、SQLite 性能を最大化、UT-09 mapper が単純、MVP スコープ内、不変条件 #1/#4/#5 を全て満たす。
- 案 B は Wave 2 以降のスケール要件発生時に再評価。
- 案 D-2 は audit 強化要件（UT-21）の進展に応じて Phase 12 unassigned-task-detection.md に候補列挙。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず、Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 実装時に運用上の補足対応（runbook 追記 / migration 内コメント）が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 後続 UT-09 / UT-21 / UT-06 が依存できる確定 schema を最小コストで提供 |
| 実現性 | PASS | Wrangler D1 migrations + scripts/cf.sh で適用フロー確立済 |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離）/ #5（apps/api 限定）を全て満たす |
| 運用性 | PASS | 連番 migration 規約 + runbook + soft delete で再現性・回復性を両立 |
| 不変条件 #1 | PASS | mapper 層に Sheets schema を閉じる前提（UT-09 で実装） |
| 不変条件 #4 | PASS | members は admin-managed data 専用テーブル |
| 不変条件 #5 | PASS | migration は `apps/api/migrations/` に固定 |
| SQLite 型整合 | PASS | DATETIME は TEXT + ISO 8601 統一 |
| 無料枠 | PASS | D1 5GB / 25M reads / 50K writes 枠内 |
| data-contract.md 整合 | PASS | data-contract.md は契約、schema-design.md は実装 refinement と役割明示 |
| MVP スコープ整合 | PASS | 単一 members + 補助 2 テーブルで MVP 範囲内 |

## data-contract.md 整合性確認

| 確認項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| Sheets source-of-truth 宣言 | data-contract.md を Read | 「Sheets が正本、D1 はキャッシュ層」と明記 |
| D1 テーブルの存在 | data-contract.md と schema-design.md を突合 | 同一テーブル名（members 等）が両方に存在 |
| 列名・型の一致 | 両ドキュメントを突合 | 矛盾ゼロ |
| 役割境界 | data-contract.md = 契約 / schema-design.md = 実装 refinement | 両者の階層関係が明示されている |
| ownership 明示 | data-contract.md は 03 系タスクが ownership / DDL は本タスク | 重複 ownership ゼロ |

> data-contract.md がまだ作成されていない場合は、Phase 3 で本タスクが暫定 source-of-truth として記述し、03 系タスク完了時に統合レビューを再実施する旨を open question に登録する。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない（base case に対して）
- [ ] MINOR がある場合、対応 Phase（5 / 6 / 11 / 12）が指定されている
- [ ] data-contract.md との整合性が確認されているか、open question として明示されている
- [ ] open question が 0 件、または Phase 12 unassigned-task-detection.md への送り先が明記

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- DDL に NOT NULL / PK 抜けが残っている
- DATETIME 列が TEXT 以外で宣言されている
- migration 連番規約が未確定
- data-contract.md との明確な矛盾が発見され、本タスクで解消できない

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | data-contract.md がまだ未確定の場合、暫定 source-of-truth として schema-design.md を扱うか | Phase 4 / 03 系タスク完了後再レビュー | 03 系完了時に統合レビュー |
| 2 | sync_jobs の retention 期間（90 日 / 365 日） | Phase 12 / UT-08 monitoring 連携 | pruning タスクは別建て |
| 3 | 完全正規化（案 B）への移行時期 | Phase 12 unassigned | 次 Wave 以降 |
| 4 | members_history（案 D-2）の audit 強化への昇格時期 | Phase 12 / UT-21 連携 | audit 要件の進展次第 |
| 5 | PRAGMA foreign_keys runtime duplex 設定（案 E-2）への切り替え条件 | Phase 5 / FK 導入時 | 後続 schema 拡張時 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜E を `outputs/phase-03/main.md` に記述する。
- 各案に概要・利点・欠点・採用可否を 3〜5 行で記述する。

### ステップ 2: 評価マトリクス作成

- 8 観点（4条件 + SQLite 型 + 無料枠 + data-contract 整合 + MVP 整合）×案を縦持ち横持ちで埋める。
- 空セルが残らないこと。

### ステップ 3: base case 最終判定

- 全 PASS であることを確認する。
- MINOR が残る場合は対応 Phase を明示する。

### ステップ 4: data-contract.md 整合性確認

- 03 系タスクの data-contract.md があれば Read し突合。なければ open question #1 として登録。

### ステップ 5: 着手可否ゲート判定

- GO / NO-GO チェックリストを通す。
- GO の場合のみ artifacts.json の Phase 3 を `spec_created` のままにし、Phase 4 へ進める。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力に、DDL 適用テスト・mapping 契約テストを設計 |
| Phase 5 | 実 migration ファイル作成は base case 通りに実装 |
| Phase 10 | base case の最終 PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | dev / production 適用 smoke test の手順 placeholder |
| Phase 12 | open question #2 / #3 / #4 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: 案 A が後続 UT-09 / UT-21 / UT-06 の依存先として最小コストで価値を提供しているか。
- 実現性: 案 B / D-2 の MINOR を base case が踏まないか。
- 整合性: 全代替案で不変条件 #1/#4/#5 が PASS であることを確認したか。
- 運用性: 案 C-2 の MAJOR（PK 破綻）を回避し、UUID + UNIQUE(natural) の duplex で解決しているか。
- SQLite 型: DATETIME 全列が TEXT で統一されているか。
- 無料枠: 5GB / 25M reads / 50K writes に収まるか（MVP 数千行スケールでは余裕）。
- data-contract.md 整合: 役割境界が「契約 vs 実装 refinement」として明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | pending | 案 A〜E |
| 2 | 評価マトリクスの作成 | 3 | pending | 8 観点 × 4 案 |
| 3 | base case 最終 PASS 判定 | 3 | pending | 全観点 PASS |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | pending | 3 レベル |
| 5 | data-contract.md 整合性確認 | 3 | pending | 5 確認項目 |
| 6 | 着手可否ゲート定義 | 3 | pending | GO / NO-GO |
| 7 | open question の Phase 振り分け | 3 | pending | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・data-contract 整合・着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 8 観点 × 案のマトリクスに空セルが無い
- [ ] base case の最終判定が全観点 PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] data-contract.md との整合性確認が実施され、矛盾ゼロまたは open question 登録済
- [ ] 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 5 件すべてに受け皿 Phase が割り当てられている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4条件 + 観点すべてが PASS（base case 列）
- MAJOR ゼロ（base case に対して）
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A + C-1 + D-1 + E-1（単一 members + UUID + soft delete + migration 内 PRAGMA）
  - canonical table set（member_responses / member_identities / member_status / response_fields / schema_diff_queue / sync_jobs）に対する DDL 適用テスト観点
  - mapping 契約テスト（Sheets 列 → D1 カラム）の対象
  - data-contract.md 整合の継続確認（03 系タスク完了時に再レビュー）
  - open question 5 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
  - data-contract.md と明確な矛盾が解消されていない
