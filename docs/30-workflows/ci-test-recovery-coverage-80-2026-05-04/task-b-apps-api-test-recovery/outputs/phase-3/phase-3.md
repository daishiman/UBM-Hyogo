# Phase 3: 設計レビュー（不変条件遵守ゲート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 名称 | 設計レビュー |
| status | spec_created |
| 入力 | `outputs/phase-2/main.md` |
| 出力 | `outputs/phase-3/main.md` |

## 目的

Phase 2 設計を Phase 4 へ進める前に、不変条件・修復制約・スコープ整合をレビューゲートとして判定する。

## 実行タスク

### Step 1: 不変条件遵守チェック

| ID | 不変条件 | 該当 failure | 違反リスク | 判定 |
| --- | --- | --- | --- | --- |
| #1 | schema をコードに固定しすぎない | 13 件全体 | test 期待値変更が schema 固定化を招くか | PASS / NEEDS_FIX |
| #2 | consent キー = `publicConsent` / `rulesConsent` | repository / workflow 系 | mock factory が古いキー名を使っていないか | PASS / NEEDS_FIX |
| #3 | `responseEmail` は system field | sync-forms-responses 系 | フォーム項目として扱う mock になっていないか | PASS / NEEDS_FIX |
| #4 | admin-managed data は分離 | admin 系 routes | mock がフォーム由来データと混在していないか | PASS / NEEDS_FIX |
| #5 | D1 直接アクセスは apps/api に閉じる | 全 repository 系 | Phase 5 修復で apps/web に D1 アクセスが漏れないことを宣言 | PASS / NEEDS_FIX |
| #6 | GAS prototype を本番化しない | sync 系 | mock が GAS 仕様を流用していないか | PASS / NEEDS_FIX |

### Step 2: スコープ整合チェック

| 確認項目 | 期待 | 結果 |
| --- | --- | --- |
| Task D の coverage 補強範囲と本タスクの test 修復範囲が重複していないか | 重複なし | |
| Task A（apps/web jsx-dev-runtime）と独立に実行可能か | 独立 | |
| `index.md` の dependencies = [] が正しいか | 正しい | |

### Step 3: 修復難度トリアージ

| 難度 | 件数 | 1 wave 内完遂判定 |
| --- | --- | --- |
| 低 | N 件 | OK |
| 中 | M 件 | OK |
| 高 | K 件 | K ≥ 3 なら **GATE FAIL** → Phase 2 へ差し戻し or 親 wave へ scope 再交渉エスカレーション |

### Step 4: テスト戦略 preview

Phase 4 へ渡す前に以下を確認:

- 新規 test 追加なし（既存 13 件 test の修復のみ）
- `it.skip` 禁止
- coverage 補強は Task D に委譲

### Step 5: ゲート判定

| ゲート | 結果 | 次工程 |
| --- | --- | --- |
| 不変条件 6 件全て PASS | Yes / No | Yes → Phase 4 へ進む / No → Phase 2 差し戻し |
| 修復難度「高」< 3 件 | Yes / No | Yes → 進む / No → 親 wave エスカレーション |
| スコープ重複なし | Yes / No | Yes → 進む / No → スコープ再定義 |

## 完了条件

- [ ] `outputs/phase-3/main.md` にゲート判定テーブルが記録され全項目 PASS
- [ ] 不変条件チェック 6 件全て PASS（NEEDS_FIX があれば Phase 2 へ差し戻し record も記載）
- [ ] 修復難度「高」が 3 件未満であることが確認されている

## 多角的レビュー観点

- 因果ループ: setup 修復で M 件解消 → 個別修復対象が縮小 → 1 wave 内完遂確率上昇（強化ループ）
- 責務境界: test 修復は test ファイル / setup 修復は setup ファイル / impl bug は impl ファイルで分離。混在禁止
- 価値とコスト: 「impl 触らず test を緩めて GREEN にする」誘惑へのガード
