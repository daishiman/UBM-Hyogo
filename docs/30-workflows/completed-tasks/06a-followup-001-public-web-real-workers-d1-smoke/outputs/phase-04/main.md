# Phase 4 outputs — 要約と採用判断

## 要約

06a 公開導線 4 route family / 5 smoke cases の local / staging smoke を、`scripts/cf.sh` 経由 wrangler dev + Cloudflare D1 binding を実体として確認するためのテスト戦略を定義した。検証手段は **curl による HTTP status 観測** と **API 側 `/public/members` body の seed 含有確認** に絞り、coverage / Playwright / visual regression は対象外。

## 採用判断

| 項目 | 採用 / 不採用 | 理由 |
| --- | --- | --- |
| curl matrix（route × env × method × expected status） | 採用 | NON_VISUAL タスクで最軽量かつ実体経路を直接検証可能 |
| `/members` body の seed 含有確認 | 採用 | mock fallback を確実に検出できる唯一の手段 |
| staging screenshot 1 枚 | 採用 | UI 由来不具合の最低限の補助証跡 |
| Vitest coverage gate | 不採用 | 本タスクは smoke focus、coverage は親タスク責務 |
| Playwright E2E | 不採用 | 08b の責務領域 |
| visual regression diff | 不採用 | NON_VISUAL タスク |

## 成果物

- `curl-matrix.md`: route × env × method × expected status の決定表（最低 8 行）
- evidence 命名規則: `local-curl.log` / `staging-curl.log` / `staging-screenshot.png`（保存先は `outputs/phase-11/evidence/`）

## AC trace

- AC-2 / AC-4 / AC-5: matrix で観測対象を網羅
- AC-3: matrix 内 `/members` 行の追加検証項目（seed 含有）
- AC-7: 不変条件 #5 を実アプリコード限定の `rg "D1Database|env\\.DB"` 0 件確認として戦略に組込
