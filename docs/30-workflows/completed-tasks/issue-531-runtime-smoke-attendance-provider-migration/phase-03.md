# Phase 3: 代替案比較 ADR

成果物: [outputs/phase-03/adr-runtime-smoke-strategy.md](outputs/phase-03/adr-runtime-smoke-strategy.md)

## 比較する 3 案

| 案 | 概要 | 採否 |
| --- | --- | --- |
| A. curl + summary-only evidence | Bash + curl で staging を直接叩き、raw body は一時ファイルに限定して status / jq summary だけ保存 | **採用** |
| B. wrangler tail | `wrangler tail` で staging Worker のログを観測 | 不採用 |
| C. Playwright 駆動 e2e | ブラウザ越しに admin UI / me UI を操作 | 不採用 |

## 採用根拠（A: curl + summary-only evidence）

- NON_VISUAL タスクのため UI 要素検証は不要。HTTP status と JSON shape の `attendance` 配列存在で十分
- `scripts/cf.sh` / `scripts/with-env.sh` に既存の 1Password 連携があり、認証情報を実値出力せずに渡せる
- raw response body を永続化しないことで、secret だけでなく email / fullName / profile 等の PII 混入も構造的に避けられる
- 追加依存ゼロ（curl + sed/awk のみ）
- scale:small に最も親和

## 不採用理由

- B（wrangler tail）: ログ依存で再現性が低く、route inventory の網羅性証明が困難。本人が叩いた request と他者の偶発 request の区別がつかない
- C（Playwright）: 重量級。NON_VISUAL タスクへの過剰投資で scale:small に反する。UI hydrate ではなく provider 結線確認が目的なので適合しない

## ADR 必須セクション（実装指示）

`outputs/phase-03/adr-runtime-smoke-strategy.md` に以下を含めること:

1. Context（親タスク runtime pending 状態）
2. Decision（curl + summary-only evidence 採用）
3. Alternatives（A/B/C 並べた表 + Pros/Cons）
4. Consequences（追加スクリプト 2 本、CI 化は別タスク）
5. References（issue-371 親仕様 / CLAUDE.md cf.sh ルール）

## 完了条件

- ADR ファイルが上記 5 セクションを満たして配置されていること
