[実装区分: 実装仕様書]

# Phase 3 — 設計レビュー

| 項目 | 値 |
|------|------|
| phase | 3 |
| 名称 | 設計レビュー |
| status | completed |
| 完了条件 | Phase 4 進行 GO/NO-GO 判定 |

## 1. レビュー観点

| # | 観点 | 判定基準 | 結果欄 |
|---|------|----------|--------|
| 1 | 責務境界が明確か | 仕様書フェーズで PUT を実行する記述が無いこと | |
| 2 | check run name 実測手順があるか | gh api 2 段コマンドが Phase 2 §2 に存在 | |
| 3 | PUT payload 全置換ルールに準拠 | before GET 全フィールド継承の jq テンプレが Phase 2 §4 に存在 | |
| 4 | 冪等性 | 既に 3 件あれば skip するロジックが Phase 2 §5 に存在 | |
| 5 | dev / main 独立実行 | 順序と失敗時の挙動が Phase 2 §6 に明記 | |
| 6 | rollback payload | Phase 2 §7 に draft が存在 | |
| 7 | governance 不変条件 | Phase 2 §8 で検証項目化 | |
| 8 | NON_VISUAL 宣言 | Phase 1 で task_type を明示 | |

## 2. リスク再確認

- **PUT 全置換による設定退行**: jq テンプレが既存値継承を確実に行うか手で 1 回 dry-run 確認することを Phase 4 で要求。
- **check run name 不一致**: Phase 1 末尾の実測値を Phase 2 §2 の context 名と突合する手順を Phase 4 に追加。

## 3. 判定

- [ ] GO（全観点 OK → Phase 4 進行）
- [ ] NO-GO（理由を記載し Phase 2 へ差戻し）

## 4. NO-GO 時の戻り先

| 観点 NG | 戻り先 |
|---------|--------|
| 責務境界 / 冪等性 / rollback | Phase 2 §1, §5, §7 |
| PUT payload | Phase 2 §4 |
| check run name | Phase 2 §2 |
