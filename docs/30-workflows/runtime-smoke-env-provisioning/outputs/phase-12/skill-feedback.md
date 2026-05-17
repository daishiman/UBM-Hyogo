# Phase 12: スキルフィードバックレポート

## テンプレート改善

| # | 観点 | 内容 |
|---|------|------|
| FB-RSE-T1 | NON_VISUAL + new+verify_existing ハイブリッドタスクの Phase 5 テンプレート | 既存ファイルの `verify_existing` 部分と新規 `new` 部分を 1 つの implementation-plan.md に混在記述するためのテーブル分割パターンが、現テンプレートには明示なし。本タスクでは「新規 / 修正 / 削除」3 テーブル方式で対応したが、テンプレート側に推奨形式として組み込むと再利用性が上がる |
| FB-RSE-T2 | 「仕様書生成のみ / 実装は別タスク」モードの artifacts.json status | 現状 `spec_created` / `implementation_ready` の使い分けが曖昧。本タスクのように「root は spec_created、実装は別タスクで `new` 着手」の場合、`implementation_ready` と `spec_created` の境界をテンプレートに明示すべき |

## ワークフロー改善

| # | 観点 | 内容 |
|---|------|------|
| FB-RSE-W1 | runbook ファイルの artifacts.json への evidence 列挙 | 既存テンプレートでは `outputs/phase-*` を中心に evidence 列挙する慣習だが、ops タスクでは `runbooks/*.md` も 1 次成果物として扱うべき。本タスクでは evidence array に明示的に runbook 4 件を追加した |
| FB-RSE-W2 | user-gated 一覧の標準化 | 現状 metadata.user_gated に列挙する形式だが、secret 投入 / D1 apply / workflow rerun / commit / PR の **粒度がタスクごとにブレる**。「Cloudflare secret 投入」「D1 apply」等の標準ラベル集をテンプレートに整備すべき |

## ドキュメント改善

| # | 観点 | 内容 |
|---|------|------|
| FB-RSE-D1 | service-token / HMAC / nonce / rate limit を扱うタスクの再利用パターン | 本タスクで定義した HMAC scheme（kid + ts + nonce + role の連結 / ±300秒 / 600秒 nonce TTL / 429 retry_after）は、今後の internal API でも再利用可能性が高い。`docs/00-getting-started-manual/specs/` に `internal-api-protection-pattern.md` として正本化することを提案 |
| FB-RSE-D2 | NON_VISUAL タスクの runbook ファイル数の目安 | 本タスクは 4 runbook（env provisioning staging / production / service-token issuance / D1 migration apply）を生成。ops 系タスクで runbook を分割する基準（環境別 / 操作別 / incident 別）をテンプレートに整理すると判断が早くなる |

## 改善優先順位

1. **High**: FB-RSE-T2（artifacts.json status 境界の明示）— 次タスクで即必要
2. **Medium**: FB-RSE-W2（user-gated 標準ラベル）/ FB-RSE-D1（internal-api-protection-pattern 正本化）
3. **Low**: FB-RSE-T1 / FB-RSE-W1 / FB-RSE-D2（運用しながら整備）

## 完了条件

- 改善点なしでも出力必須 → 本タスクでは 6 件記録
- テンプレ / ワークフロー / ドキュメントの 3 観点で網羅

## 成果物

- `outputs/phase-12/skill-feedback.md`（本ファイル）
