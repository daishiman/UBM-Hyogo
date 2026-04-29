# Phase 10: 最終レビュー（Go-No-Go）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（Go-No-Go） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 9（品質保証） |
| 下流 | Phase 11（手動 smoke / docs-only NON_VISUAL 縮約テンプレ） |
| 状態 | spec_created |
| user_approval_required | false |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | spec_created |

## 目的

Phase 9 までの全成果物（要件 / 設計 3 点 / 設計レビュー / テスト戦略 / ランブック / 異常系 / AC マトリクス / DRY 化 / 品質保証 / 無料枠見積もり）を統合判定し、Phase 11（手動 smoke）と下流タスク UT-09（同期ジョブ実装）への引き渡し可否を確定する。本タスクは docs-only / NON_VISUAL / spec_created の設計タスクであり、AC-9「UT-09 が本仕様書のみで実装着手可能」を最終ゲートで確認する。**source-of-truth 優先順位**（Sheets 優先 / 平常時単方向 / 障害時 read-only fallback）の最終承認、blocker 一覧の固定、PASS / MINOR / MAJOR 判定を実施する。

## 入力

- `outputs/phase-09/main.md`（4 条件再評価 / 不変条件遵守 / 一括判定 / AC GREEN マトリクス）
- `outputs/phase-09/free-tier-estimation.md`（無料枠 / quota 見積もり）
- `outputs/phase-08/main.md` / `outputs/phase-08/before-after.md`（DRY 化 / 正本所在マップ）
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-03/main.md`（PASS/MINOR/MAJOR 判定 / MINOR 追跡）
- `outputs/phase-03/alternatives.md`（代替案 4 件比較）
- `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`

## レビュー観点

### 1. AC 全件 PASS 確認

| AC ID | 内容 | Phase 9 結果 | 判定 |
| --- | --- | --- | --- |
| AC-1 | 同期方式 4 種比較表 + 採択理由（`outputs/phase-02/sync-method-comparison.md`） | pending | pending |
| AC-2 | 手動 / 定期 / バックフィル 3 種フロー図（`outputs/phase-02/sync-flow-diagrams.md`） | pending | pending |
| AC-3 | エラーハンドリング方針 6 項目（リトライ / Backoff / 冪等性 / 部分失敗 / failed ログ） | pending | pending |
| AC-4 | `sync_log` 13 カラム論理スキーマ（`outputs/phase-02/sync-log-schema.md`） | pending | pending |
| AC-5 | source-of-truth 優先順位 + ロールバック判断フローチャート明文化 | pending | pending |
| AC-6 | Sheets API quota 対処方針（バッチサイズ / Backoff / 待機戦略） | pending | pending |
| AC-7 | 冪等性担保戦略（行ハッシュ / 固有 ID / UPSERT 前提）と UT-04 引き継ぎ事項 | pending | pending |
| AC-8 | 代替案 3 件以上で base case B（Cron pull）が PASS（`outputs/phase-03/alternatives.md`） | pending | pending |
| AC-9 | UT-09 が本仕様書のみで実装着手可能 / open question 0 件 | pending | pending |
| AC-10 | `taskType=docs-only` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` / `scope=design_specification` が `artifacts.json.metadata` と一致 | pending | pending |

### 2. blocker 一覧（Go の前提条件）

| Blocker ID | 内容 | 解消条件 | 現状 |
| --- | --- | --- | --- |
| BL-01 | 上流 3 タスク（02-monorepo / 01b-cloudflare / 01c-google-workspace）の完了 | 各 index.md の `workflow_state=completed` 確認 | 実行時確認 |
| BL-02 | base case B（Cron pull）が Phase 3 で PASS | `outputs/phase-03/main.md` で B PASS 判定 | 実行時確認 |
| BL-03 | 4 条件再評価が Phase 9 で全 PASS（運用性 with notes 可） | `outputs/phase-09/main.md` 再評価表 | 実行時確認 |
| BL-04 | 不変条件 #1 / #4 / #5 遵守確認が Phase 9 で全 PASS | `outputs/phase-09/main.md` 遵守確認表 | 実行時確認 |
| BL-05 | Cron Triggers + D1 + Sheets API いずれも無料枠完結（10% 以下ヘッドルーム） | `outputs/phase-09/free-tier-estimation.md` 結論 | 実行時確認 |
| BL-06 | DRY 化で重複削除完了（観点 1〜6 すべて） | `outputs/phase-08/main.md` 正本所在マップ | 実行時確認 |
| BL-07 | open question 0 件（AC-9 担保） | 仕様書全文 grep で「TBD」「要検討」「実装で判断」が 0 件 | 実行時確認 |
| BL-08 | `artifacts.json.metadata` と `index.md` メタ表が一致 | AC-10 連動 | 実行時確認 |

### 3. UT-09 着手可能性チェック（AC-9 最終確認）

| 確認項目 | 仕様書での確定状況 | UT-09 が判断不要であるか |
| --- | --- | --- |
| 同期方式の採択 | B: Workers Cron Triggers 定期 pull | YES |
| Cron スケジュール初期値 | `0 */6 * * *`（6h） | YES |
| Cron 間隔の調整余地 | 5 分まで縮小可（MINOR-M-02 で staging 測定） | YES（初期値で実装、調整は staging で） |
| バッチサイズ | 100 行 / batch | YES |
| 並列度 | 1（Cron handler 内直列） | YES |
| Backoff 戦略 | 1s → 2s → 4s（最大 3 回）/ quota 超過時 100s 待機 / 上限 32s | YES |
| 冪等性キー戦略 | 行ハッシュ + バンドマン固有 ID（UT-04 引き継ぎ） | YES（UT-04 で物理化） |
| sync_log 13 カラム | 論理スキーマ確定 | YES（UT-04 で物理化） |
| sync_log 状態遷移 | pending → in_progress → completed / failed | YES |
| ロールバック判断 | Sheets 障害 / D1 破損 / 双方破損のフローチャート | YES |
| source-of-truth 優先順位 | Sheets 優先（平常時単方向 / 障害時 read-only fallback） | YES |
| 二重実行防止 | sync_log `in_progress` レコードでの排他 | YES |
| 部分失敗時のリトライ起点 | `processed_offset` から再開 | YES |
| Open question | 0 件目標 | 実行時確認（BL-07） |

### 4. source-of-truth 優先順位の最終承認

| 状況 | 優先順位 | 動作 | 承認 |
| --- | --- | --- | --- |
| 平常時 | Sheets > D1 | Sheets → D1 単方向同期。D1 への手動書込は禁止 | pending |
| Sheets 障害時 | D1（read-only fallback） | API は D1 から読み出し、書き戻しはしない | pending |
| D1 破損時 | Sheets → full backfill | バックフィルフローで D1 を再構築 | pending |
| 双方破損時 | Sheets backup（Google Drive 履歴）→ D1 復元 | UT-08 監視で検知後、手動復旧 | pending |

> 平常時の単方向性（Sheets → D1）は不変条件 #4（admin-managed data 分離）と整合。D1 を canonical store としつつ、ソースは Sheets である構造を Phase 10 で最終承認する。

### 5. Go 条件

| 条件 ID | 内容 | 判定 |
| --- | --- | --- |
| G-1 | AC-1〜AC-10 全件 PASS | pending |
| G-2 | blocker BL-01〜BL-08 全件解消 | pending |
| G-3 | UT-09 着手可能性チェック（観点 3）で全項目 YES | pending |
| G-4 | source-of-truth 優先順位（観点 4）4 状況すべて承認 | pending |
| G-5 | 4 条件再評価（Phase 9）で全 PASS | pending |
| G-6 | 不変条件 #1 / #4 / #5 遵守（Phase 9）で全 PASS | pending |
| G-7 | 無料枠見積もり（Phase 9）で 10% 以下ヘッドルーム達成 | pending |
| G-8 | DRY 化（Phase 8）で観点 1〜6 すべて重複削除済み | pending |

### 6. No-Go 条件（1 件でも該当すれば No-Go）

| 条件 ID | 内容 | 判定 |
| --- | --- | --- |
| NG-1 | AC-1〜AC-10 のいずれかが FAIL | pending |
| NG-2 | open question 残存（仕様書 grep で「TBD」「要検討」「実装で判断」が検出） | pending |
| NG-3 | base case B が Phase 3 で PASS していない | pending |
| NG-4 | 上流 3 タスクのいずれかが未完了 | pending |
| NG-5 | 不変条件 #1 / #4 / #5 のいずれかに違反する設計記述 | pending |
| NG-6 | Cron / D1 / Sheets API いずれかが無料枠を超える設計 | pending |
| NG-7 | `workflow_state` が誤って `completed` に書き換わっている | pending |
| NG-8 | source-of-truth 優先順位が文書化されていない / 4 状況のいずれかで未定義 | pending |

### 7. PASS / MINOR / MAJOR 最終判定

| 種別 | 該当 | 戻り先 / 引き継ぎ先 |
| --- | --- | --- |
| PASS | 設計の確定・無料枠完結・UT-09 着手可能 | Phase 11（手動 smoke / 縮約テンプレ） |
| MINOR | TECH-M-01（hybrid 将来オプション） / TECH-M-02（Cron 間隔 staging 測定） / TECH-M-03（partial index 確認） / TECH-M-04（sync_log 保持期間） / TECH-M-DRY-01（DRY 構造化解消） / MINOR-M-Q-01（quota 配分 UT-03 申し送り） | Phase 12 documentation / 後続タスク（UT-04 / UT-08 / UT-09） |
| MAJOR | なし（残存する場合は Go 不可） | — |

### 8. 自己レビュー（レビューア視点）

| 観点 | チェック内容 | 判定 |
| --- | --- | --- |
| 後方互換性 | 上流 3 タスクの成果物（D1 binding / Sheets ID / monorepo 構造）と矛盾していないか | pending |
| 下流影響 | UT-03（Sheets 認証）/ UT-04（D1 物理スキーマ）/ UT-09（同期ジョブ）への引き継ぎ事項が明文化されているか | pending |
| 設計の自己完結性 | 仕様書のみで UT-09 が着手可能か（外部正本リンクのみで足りない判断項目が残っていないか） | pending |
| MINOR 持ち越し | 7 件の MINOR がすべて Phase 12 / 後続タスクで解決される導線になっているか | pending |
| `workflow_state` 据え置き | Phase 12 close-out で `spec_created` を据え置く前提が Phase 1 / Phase 12 で明文化されているか | pending |
| docs-only / NON_VISUAL 縮約テンプレ準備 | Phase 11 が main.md / manual-smoke-log.md / link-checklist.md の 3 点で完結する設計になっているか | pending |

### 9. Phase 11 着手可否

- 判定: G-1〜G-8 全件 PASS かつ NG-1〜NG-8 全件非該当の場合のみ Phase 11 着手可
- ブロック条件: 上記いずれかが FAIL
- AC-9（UT-09 着手可能）は本 Phase で最終確定する。Phase 11 では確定済の状態で縮約テンプレの自己適用 smoke のみを実行する

## 実行タスク

1. AC マトリクス（観点 1）を Phase 9 の実測結果で更新する
2. blocker 一覧（観点 2）を埋め、BL-01〜BL-08 の現状を記録
3. UT-09 着手可能性チェック（観点 3）を実施し、未確定項目があれば該当 Phase へ戻す
4. source-of-truth 優先順位（観点 4）4 状況の最終承認を記録
5. Go 条件（観点 5）G-1〜G-8 を埋める
6. No-Go 条件（観点 6）NG-1〜NG-8 を埋める
7. PASS / MINOR / MAJOR 最終判定（観点 7）を確定し、MINOR 7 件の引き継ぎ先を明記
8. 自己レビュー（観点 8）6 観点を埋める
9. Phase 11 着手可否（観点 9）を判定する
10. Go / No-Go 結論を `outputs/phase-10/go-no-go.md` 冒頭に明示

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-09/main.md` |
| 必須 | `outputs/phase-09/free-tier-estimation.md` |
| 必須 | `outputs/phase-08/main.md` |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-03/main.md` |
| 必須 | `outputs/phase-03/alternatives.md` |
| 必須 | `outputs/phase-02/sync-method-comparison.md` |
| 必須 | `outputs/phase-02/sync-flow-diagrams.md` |
| 必須 | `outputs/phase-02/sync-log-schema.md` |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/index.md` |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json` |
| 参考 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md`（下流実装タスク受け側） |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-10.md`（フォーマット模倣元） |

## 依存Phase明示

- Phase 1 成果物（要件 / AC-1〜10）を参照する
- Phase 2 成果物（設計 3 点 / source-of-truth 優先順位）を参照する
- Phase 3 成果物（代替案比較 / MINOR 追跡 / blocker 仮定）を参照する
- Phase 7 成果物（AC マトリクス）を最終結果で更新する
- Phase 8 成果物（DRY 化 / TECH-M-DRY-01）を参照する
- Phase 9 成果物（4 条件再評価 / 不変条件遵守 / 無料枠見積もり）を入力とする

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-10/go-no-go.md` | Go / No-Go 結論 / AC PASS マトリクス / blocker 一覧 / UT-09 着手可能性 / source-of-truth 最終承認 / Go 条件 / No-Go 条件 / PASS-MINOR-MAJOR 最終判定 / 自己レビュー / Phase 11 着手可否 |

`outputs/phase-10/go-no-go.md` は本 Phase 実行時に記入する。期待される章立ては以下：

1. 結論（PASS / MINOR / MAJOR の最終判定を冒頭に明示）
2. メタ情報（タスク名 / Phase / visualEvidence=NON_VISUAL / taskType=docs-only / workflow_state=spec_created）
3. AC PASS マトリクス（AC-1〜AC-10 全件判定）
4. blocker 一覧（BL-01〜BL-08 現状）
5. UT-09 着手可能性チェック（14 項目すべて YES 確認）
6. source-of-truth 優先順位の最終承認（4 状況）
7. Go 条件（G-1〜G-8 判定）
8. No-Go 条件（NG-1〜NG-8 判定）
9. PASS / MINOR / MAJOR 最終判定（MINOR 7 件の引き継ぎ先明記）
10. 自己レビュー（6 観点）
11. Phase 11 着手可否判定
12. 次 Phase（Phase 11）への引き継ぎ事項

各章は「実行時に記入」プレースホルダで開始し、実行時に Phase 9 までの実測結果で埋める。

## 完了条件 (DoD)

- [ ] `go-no-go.md` 冒頭に PASS / MINOR / MAJOR 最終判定が明示
- [ ] AC-1〜AC-10 全件判定済み
- [ ] blocker BL-01〜BL-08 全件記入済み
- [ ] UT-09 着手可能性チェック（観点 3）で 14 項目すべて YES
- [ ] source-of-truth 優先順位（観点 4）4 状況すべて承認
- [ ] Go 条件 G-1〜G-8 全件記入
- [ ] No-Go 条件 NG-1〜NG-8 全件記入（該当 0 件確認）
- [ ] MINOR 7 件（TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01）すべての引き継ぎ先明記
- [ ] 自己レビュー 6 観点全件記入
- [ ] Phase 11 着手可否判定
- [ ] 仕様書全文 grep で「TBD」「要検討」「実装で判断」が 0 件（AC-9 / NG-2 担保）

## 苦戦箇所・注意

- **AC-9 の最終確定責務**: 本 Phase は AC-9（UT-09 着手可能性）の **最終ゲート**。Phase 11 ではこれ以上の判定はしない。観点 3 の 14 項目すべて YES が必須
- **MINOR 流し**: 7 件の MINOR を「PASS だから次へ」で流さず、Phase 12 documentation-changelog / unassigned-task-detection / 後続タスク（UT-04 / UT-08 / UT-09）への引き継ぎを **個別に明記** する
- **No-Go 条件の主観排除**: 「壊れていないように見える」ではなく Phase 9 実測値（grep 出力 / 4 条件再評価表 / 無料枠見積もり数値）で機械判定する
- **`workflow_state` 据え置きの確認**: 本タスクは設計タスクであり、Phase 12 close-out で `completed` に書き換えてはならない。Phase 10 で「Phase 12 でも `spec_created` を据え置く」前提が Phase 1 / Phase 12 仕様書に明記されているか必ず確認する
- **source-of-truth 4 状況の漏れ**: 平常時 / Sheets 障害 / D1 破損 / 双方破損 のいずれかが未定義だと NG-8 該当。4 状況すべての動作と承認を本 Phase で確定する
- **blocker 解消の楽観**: BL-01（上流 3 タスク完了）は仕様書から確認できるが、実環境の binding / Sheets ID 整合は本タスクスコープ外。「仕様書上の前提が満たされていることのみ」を本 Phase の判定範囲とし、実環境検証は UT-09 / UT-26 に委譲する旨を `go-no-go.md` に明記する
- **PASS なのに with notes**: 運用性 PASS（with notes）の notes 内容が MINOR で追跡可能でない場合は MAJOR に格上げし No-Go とする。with notes の濫用を禁止する

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（`outputs/phase-10/go-no-go.md`）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計タスクであり、アプリケーション統合テストは追加しない
- 統合検証は Phase 9 の機械判定 + Phase 11 docs-only / NON_VISUAL 縮約テンプレ smoke + `artifacts.json` 整合で代替する
- 下流実装（UT-09）が本仕様書の AC を満たす形で実装テスト・staging 検証を行うため、本タスクの判定は「UT-09 が参照のみで着手できる状態」までを担保する

## 次 Phase

- 次: Phase 11（手動 smoke / docs-only NON_VISUAL 縮約テンプレ：main.md / manual-smoke-log.md / link-checklist.md の 3 点固定 / screenshot 不要）
- 引き継ぎ: Go / No-Go 結論 / AC PASS マトリクス / blocker 解消ログ / UT-09 着手可能性確定 / source-of-truth 最終承認 / MINOR 7 件の引き継ぎ先 / Phase 11 着手前提条件
