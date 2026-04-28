# Phase 12: task spec compliance check

## 1. 総合判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS with blockers | 実デプロイ未実行を明示し、本番完了扱いを撤回。OpenNext / `/health/db` / screenshot は実行前ブロッカーに分類 |
| 漏れなし | PASS with blockers | skill 更新、正本仕様更新、未タスク、artifact parity、path drift を検出・反映 |
| 整合性あり | PASS | root / outputs `artifacts.json`、index、Phase 12 成果物の状態を同期 |
| 依存関係整合 | PASS with blockers | 05b handoff、OpenNext Workers 移行、API D1 smoke endpoint を実行前依存として明示 |

## 2. 準拠チェック

| 対象 | 判定 | 対応 |
| --- | --- | --- |
| Phase 12 implementation-guide | PASS | Part 1 中学生レベル / Part 2 技術者レベルへ再構成 |
| system spec 更新 | PASS | deployment-cloudflare / deployment-core に UT-06 実行前ゲートを追記 |
| documentation changelog | PASS | 本チェックと正本仕様更新を追記対象化 |
| unassigned task detection | PASS | OpenNext Workers、`/health/db`、health body、CORS、package scope を追加・格上げ |
| skill feedback | PASS | Phase 12 parity / path drift guard を追加 |
| Phase 11 screenshot | BLOCKED | `capture-pending.png` は placeholder。実本番 smoke 後に実画像取得が必要 |
| apps/desktop / apps/backend | N/A | 現行構成に存在しない。backend 相当は `apps/api` |
| packages/shared | PASS | 実 package scope は `@ubm-hyogo/shared`。旧 `@repo/shared` は別未タスクで正本同期 |

## 3. 30種思考法の適用結果

| # | 思考法 | 検出・判断 |
| --- | --- | --- |
| 1 | 批判的思考 | 「本番デプロイ実行」と「docs-only / NOT EXECUTED」の矛盾を検出 |
| 2 | 演繹思考 | Phase 12 必須要件から implementation-guide の Part 1/2 不備を導出 |
| 3 | 帰納的思考 | 多数の TBD / placeholder から Phase 11 未実行と判断 |
| 4 | アブダクション | AC 未充足の最良説明は「実行テンプレート整備済み、実環境操作未実施」 |
| 5 | 垂直思考 | ブロッカーを OpenNext、D1 endpoint、screenshot に優先順位付け |
| 6 | 要素分解 | docs / code / skills / specs / tasks / UI evidence に分類 |
| 7 | MECE | 実行済み、未実行、実行前ブロッカー、後続改善に分離 |
| 8 | 2軸思考 | 影響度 x 実行前必須度で未タスク重要度を再判定 |
| 9 | プロセス思考 | Phase 4 -> 5 -> 11 -> 12 の証跡フローを再接続 |
| 10 | メタ思考 | 「完了」ではなく「完了定義そのもの」を再評価 |
| 11 | 抽象化思考 | Cloudflare CLI 運用を `cf.sh` gate として正本化 |
| 12 | ダブル・ループ思考 | Phase 12 が漏れを出す原因を parity/path drift guard 不足と判断 |
| 13 | ブレインストーミング | OpenNext 移行、AC 再定義、endpoint 実装の選択肢を列挙 |
| 14 | 水平思考 | 実デプロイを行わず、まず文書状態の正確性を改善 |
| 15 | 逆説思考 | 「本番実行タスク」でも未実行と明記する方が安全と判断 |
| 16 | 類推思考 | 本番デプロイを公開前の案内板確認に例え Part 1 を作成 |
| 17 | if思考 | 未修正なら本番完了と誤認し、下流 UT-08/UT-09 が誤着手する |
| 18 | 素人思考 | 専門語を避け、なぜ確認するかを Part 1 に記述 |
| 19 | システム思考 | CLAUDE.md、cf.sh、wrangler.toml、deployment specs の相互依存を確認 |
| 20 | 因果関係分析 | Pages/OpenNext drift が AC-1 不成立を引き起こす因果を特定 |
| 21 | 因果ループ | docs-only 完了表現が下流前提を強め、実証跡不足を見落とすループを遮断 |
| 22 | トレードオン思考 | 実デプロイを止めながら、実行可能性を上げる文書・仕様更新を実施 |
| 23 | プラスサム思考 | 正本仕様更新により UT-06 だけでなく後続 Cloudflare 操作も安全化 |
| 24 | 価値提案思考 | 価値は本番誤操作防止と再実行可能な runbook |
| 25 | 戦略的思考 | HIGH ブロッカーを先に潰し、実デプロイ判断を後段に残す |
| 26 | why思考 | なぜ Phase 11 証跡が必要かを AC と監査ログの観点で説明 |
| 27 | 改善思考 | path drift、artifact parity、command wrapper を具体修正 |
| 28 | 仮説思考 | `/health/db` 未実装仮説をコード参照で確認し未タスク化 |
| 29 | 論点思考 | 真の論点は「本番完了か」ではなく「実行可能な前提が揃ったか」 |
| 30 | KJ法 | 漏れを deploy topology、API smoke、evidence、spec sync、skill guard にクラスタ化 |

## 4. エレガント検証

思考リセット後に、成果物を「実行前に読む人」の視点で再確認した。

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 設計の一貫性 | PASS | UT-06 は実デプロイ未実行テンプレとして一貫 |
| 不要な複雑性 | PASS | 実デプロイ手順と未タスクを分離し、本文で過剰な実装をしない |
| 冗長・重複 | PASS with note | `apps/api/wrangler.toml` の production 重複は未タスク化 |
| 全体調和 | PASS | 正本仕様、Phase 12、artifact 状態、未タスクが同じ事実を指す |
| 視覚証跡 | BLOCKED | 実本番 URL がないため screenshot は未取得。placeholder と明記済み |

## 5. 残ブロッカー

| ID | 内容 | 解消条件 |
| --- | --- | --- |
| B-1 | OpenNext Workers 形式移行 | `apps/web/wrangler.toml` を OpenNext Workers 形式へ移行、staging smoke PASS |
| B-2 | `/health/db` 未実装 | API D1 health endpoint 実装、AC-4 smoke PASS |
| B-3 | Phase 11 本番 smoke 未実行 | 実 URL / response / screenshot を保存 |
| B-4 | Phase 5 本番不可逆操作未実行 | 承認取得後に backup -> migration -> deploy を実行 |
