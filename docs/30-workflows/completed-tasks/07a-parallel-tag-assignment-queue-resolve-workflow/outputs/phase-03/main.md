# Phase 3: 設計レビュー — outputs

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件 #5 (D1 boundary) | PASS | resolve は apps/api/workflows、UI は HTTP 経由のみ |
| 不変条件 #13 (tag は queue 経由) | PASS | member_tags への INSERT は本 workflow guarded write のみ。grep gate を Phase 9 で実施 |
| 認可境界 | PASS | Hono route 側で `requireAdmin` middleware 適用、workflow は actor を受けるだけ |
| race 防御 | PASS | guarded update 成功後だけ follow-up statement を実行 |
| race 安全 | PASS | `WHERE status='queued'` 条件で race を検出、`changes=0` で 409 |
| audit 完全性 | PASS | 全 resolve（idempotent 除く）に audit 1 件 |
| 無料枠 | PASS | 1 resolve = 最大 4 D1 writes、月 1000 件で 4000 writes（無料枠の 4%） |
| 既存 drift 整合 | PASS | rejected status を migration で追加、既存 queued/resolved は維持 |

## alternative 評価

### A1: tag_code を直接 member_tags に保存
- 案: member_tags に `tag_code` を追加して tag_definitions JOIN 不要にする
- 棄却理由: 既存 schema が `tag_id` 主キー前提で動作。drift を増やすコスト > 利益。tag_definitions JOIN で十分

### A2: reviewing 状態の維持
- 案: `queued → reviewing → resolved` の 3 段階を維持し、admin が UI で「レビュー開始」操作を加える
- 棄却理由: MVP では admin 1 人運用で中間状態の利便性が薄い。仕様の 2 状態モデル（candidate→confirmed/rejected）を採用

### A3: enqueueTagCandidate を cron 化
- 案: 定期 cron で member_tags 空の member を検出して queue 投入
- 棄却理由: 即時性が下がる。03b の sync 直後 hook が情報の鮮度を保つ

## ブロック条件

なし。Phase 4 (テスト戦略) に進める。

## 引き継ぎ

- state machine 図 → Phase 4 の test 計画ベース
- handler signature → Phase 4 の contract test 入力
- migration 0007 → Phase 5 ファイル作成順序の先頭
