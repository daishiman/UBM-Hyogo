# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 上流 | Phase 2（設計） |
| 下流 | Phase 4（テスト戦略） |
| 状態 | spec_created |
| user_approval_required | false |

## 目的

Phase 2 で確定した設計成果物 3 点（sync-method-comparison / sync-flow-diagrams / sync-log-schema）に対し、代替案 3 件以上を比較し PASS / MINOR / MAJOR を確定する。Phase 4 への着手可否ゲート、Phase 13 blocked 条件、4 条件再評価を行い、UT-09 が本仕様書のみで実装着手可能（AC-9）な状態を担保する。

## 入力

- `outputs/phase-02/sync-method-comparison.md`
- `outputs/phase-02/sync-flow-diagrams.md`
- `outputs/phase-02/sync-log-schema.md`
- 原典スペック `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md`

## 設計事項

### 1. 代替案比較（最低 3 件、目標 4 件）

| 案 | 概要 | 主な差分 |
| --- | --- | --- |
| A | push（Apps Script webhook） | Sheets 側起点 / 即時性高 / Apps Script 認証境界が増える |
| B（base case）| pull（Workers Cron Triggers）| Workers 起点 / 1 分〜1 時間粒度 / 無料枠完結 / 冪等性確保が容易 |
| C | webhook（Drive API push notifications）| 通知駆動 / 即時性高 / 実装コスト・SLA が不明瞭 |
| D | hybrid（webhook + cron fallback）| 二重保守だが障害耐性高 / MVP 過剰投資の可能性 |

### 2. 評価マトリクス（実行時に PASS/MINOR/MAJOR を埋める）

| 観点 | A | B（base）| C | D |
| --- | --- | --- | --- | --- |
| 即時性 | 高 | 中 | 高 | 高 |
| 実装コスト | 中 | 低 | 高 | 高 |
| Workers CPU 適合性 | 低 | 高 | 中 | 中 |
| Sheets API quota 適合性 | 低 | 高 | 中 | 中 |
| 冪等性確保のしやすさ | 中 | 高 | 中 | 中 |
| 無料枠適合性 | 中 | 高 | 不明 | 中 |
| 障害復旧（バックフィル）の単純さ | 低 | 高 | 低 | 中 |
| MVP スコープ適合 | 中 | **PASS** | 低 | 低 |

### 3. PASS / MINOR / MAJOR 判定

| 案 | 評価 | 主な指摘 |
| --- | --- | --- |
| A | MAJOR（不採択） | Apps Script 認証境界が `不変条件 #5` を破る方向に作用。CPU バースト衝突。**却下** |
| B（base case）| **PASS** | 無料枠 / 冪等性 / 障害復旧のすべてで合格。MVP 適合 |
| C | MAJOR（不採択） | 実装コスト過大、SLA 不明、Sheets API は changes watch を直接サポートしない（Drive 経由）。**却下** |
| D | MINOR（将来オプション）| MVP 過剰投資。base case B が安定後に hybrid 化するオプションとして残置 |

### 4. リスクと対策

| # | リスク | 影響 | 確率 | 対策（Phase 配置）|
| --- | --- | --- | --- | --- |
| R-1 | 採択方式（Cron pull）の即時性不足で運用クレーム | 中 | 低 | Cron 間隔の調整余地を Phase 2 で確保（5 分粒度まで縮小可） |
| R-2 | Sheets API quota 超過 | 高 | 中 | バッチサイズ 100 行 / Backoff 1〜32s / 二重実行防止 |
| R-3 | D1 SQLITE_BUSY による sync 中断 | 中 | 中 | UT-02 方針継承（retry/backoff、batch 100 行上限） |
| R-4 | 冪等性破綻（行挿入で UPSERT 上書き）| 高 | 中 | 行ハッシュ / 固有 ID 戦略を UT-04 引き継ぎ事項として明文化 |
| R-5 | sync_log 論理設計の物理化困難 | 中 | 低 | partial index の代替設計（通常 index + WHERE クエリ）を sync-log-schema.md に追記 |
| R-6 | UT-09 着手時の open question 残存 | 高 | 中 | Phase 10 最終レビューで open question 0 件まで詰める |
| R-7 | workflow_state 誤書換え（spec_created → completed）| 中 | 中 | UT-GOV-005 縮約テンプレに従い、Phase 12 では据え置き |

### 5. MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決 Phase |
| --- | --- | --- |
| TECH-M-01 | hybrid（D 案）の将来オプションを Phase 12 unassigned-task-detection で記録 | Phase 12 |
| TECH-M-02 | Cron 間隔（6h / 1h / 5min）の最終確定は UT-09 staging で測定 | UT-09 |
| TECH-M-03 | partial index の D1 サポート確認 | Phase 4 / UT-04 |
| TECH-M-04 | sync_log 保持期間の運用調整余地（UT-08 監視と連動） | Phase 12 / UT-08 |

### 6. 着手可否ゲート

**PASS**（仕様作成は完了、Phase 4 以降への着手可）

#### 着手前提条件

- [ ] 上流 3 タスク（02-monorepo / 01b-cloudflare / 01c-google-workspace）が完了
- [ ] 原典スペックの苦戦箇所 4 件が Phase 1 main.md で 7 件として整理済
- [ ] sync-method-comparison.md で base case B が PASS

#### NO-GO 条件

- 上流タスク未完で D1 binding 名や Sheets ID が宙に浮く
- Sheets API quota が想定（500 req/100s）と乖離
- Cloudflare Workers Cron Triggers が無料枠から外れる仕様変更

#### Phase 13 blocked 条件

- AC-1〜AC-10 のいずれかが Phase 9 / 10 で FAIL
- UT-09 が本仕様書のみで着手不能（AC-9 不達）
- `workflow_state` が誤って `completed` に書き換わる

### 7. 4 条件再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 本仕様書のみで UT-09 が着手可能になり、設計手戻り削減 |
| 実現性 | PASS | 7 ファイルの設計文書のみ。CI / runtime 影響なし |
| 整合性 | PASS | 不変条件 #1/#4/#5 と整合、UT-04 / UT-09 への引き継ぎ事項を明文化 |
| 運用性 | PASS（with notes）| Cron 間隔の最終調整は UT-09 staging で実施。MINOR-M-02 で追跡 |

### 8. UT-09 着手準備状況チェック（AC-9 担保）

| 確認項目 | Phase 2 で確定済か |
| --- | --- |
| 同期方式の採択 | YES（B: Workers Cron Triggers 定期 pull） |
| Cron スケジュールの粒度仮説 | YES（6h を初期、5 分まで縮小可） |
| バッチサイズ | YES（100 行 / batch） |
| Backoff 戦略 | YES（1s → 32s 上限） |
| 冪等性キー | YES（行ハッシュ + 固有 ID 戦略を UT-04 引き継ぎ） |
| sync_log 13 カラム | YES |
| ロールバック判断 | YES（Sheets / D1 / 双方破損のフローチャート） |
| Open question | 0 件目標（Phase 10 で最終確認） |

## 実行タスク

1. 代替案 4 案（A / B / C / D）の比較表作成
2. 観点別 PASS / MINOR / MAJOR 判定
3. リスク R-1〜R-7 と Phase 配置を確定
4. MINOR 追跡テーブル（TECH-M-01〜04）作成
5. Phase 4 着手可否ゲート判定
6. Phase 13 blocked 条件記述
7. 4 条件再評価
8. UT-09 着手準備状況チェック（AC-9 担保）

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/sync-method-comparison.md` |
| 必須 | `outputs/phase-02/sync-flow-diagrams.md` |
| 必須 | `outputs/phase-02/sync-log-schema.md` |
| 必須 | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` |
| 参考 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-03/main.md`（下流レビュー手法の参考）|

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-03/main.md` | PASS/MINOR/MAJOR 判定 / 着手可否ゲート / 4 条件再評価 / リスク / MINOR 追跡 / UT-09 着手準備チェック |
| `outputs/phase-03/alternatives.md` | 代替案 3 件以上の詳細比較（観点別評価、不採択理由、将来オプション） |

## 完了条件 (DoD)

- [ ] 代替案 3 件以上（目標 4 件）比較完了
- [ ] PASS / MINOR / MAJOR 判定が観点別に確定
- [ ] base case（B）が PASS
- [ ] Phase 4 着手可否 = PASS
- [ ] Phase 13 blocked 条件明記
- [ ] MINOR 追跡テーブル（4 件）記載
- [ ] 4 条件再評価で全 PASS
- [ ] UT-09 着手準備チェックで open question 0 件目標を確認

## 苦戦箇所・注意

- **base case の硬直化**: B 案 PASS だからといって D 案を切り捨てない。MINOR-M-01 として将来オプションを残す
- **MINOR の見落とし**: TECH-M-01〜04 はすべて Phase 12 / 後続タスクで解決義務がある
- **PASS だから即着手は禁物**: AC-9（UT-09 着手可能）は Phase 10 で最終確認するまで仮判定
- **代替案数の不足**: 3 件未満は task-specification-creator skill 違反。最低 3 件、目標 4 件を Phase 3 で確実に埋める

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パス 2 点と `artifacts.json` の outputs が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計タスクであり、アプリケーション統合テストは追加しない
- 統合検証は Phase 11 の docs-only / NON_VISUAL 縮約テンプレで代替する

## 次 Phase

- 次: Phase 4（テスト戦略：設計タスクなので「設計検証戦略」に読み替える）
- 引き継ぎ: PASS 判定 / Phase 3 MINOR 4 件 / リスク R-1〜R-7 / UT-09 着手準備チェック / 4 条件再評価結果
