# Phase 9 outputs — 品質保証チェックリスト

## 1. secret hygiene（最重要）

### 出してはいけない値

- [ ] `CLOUDFLARE_API_TOKEN` 等の API Token
- [ ] Cloudflare Account ID
- [ ] D1 Database ID（`wrangler.toml` の `database_id`）
- [ ] OAuth tokens（`~/.wrangler/config/default.toml` — CLAUDE.md で利用禁止）
- [ ] staging Worker の独自 subdomain（log / PR への露出を最小限に）

### 漏洩防止チェック（Phase 11 実施前 / 後の 2 回）

- [ ] `local-curl.log` / `staging-curl.log` を `grep -E "(token|TOKEN|secret|SECRET|database_id)"` で 0 件確認
- [ ] D1 database id を含むコマンド出力（`d1 list` 等）を log に直接 redirect していない
- [ ] staging URL は evidence log の curl 行のみに含む。本文では一般化記述
- [ ] PR description / commit message に staging URL / D1 id を貼っていない
- [ ] `staging-screenshot.png` に Cloudflare ダッシュボードの token UI / account ID が映っていない
- [ ] `wrangler` 直接呼び出しが shell history に存在しない（`scripts/cf.sh` 経由のみ）

### 自動チェック（最終ゲート擬似コマンド）

```
rg -i "(api[_-]?token|database_id|cloudflare_api_token)" outputs/phase-11/evidence/
# 期待: 0 件
```

## 2. free-tier 影響

| 項目 | 評価 |
| --- | --- |
| D1 read rows | 4 route family / 5 smoke cases × 2 環境程度。25M reads/day 無料枠に対し誤差レベル |
| Workers requests | smoke 数回のみ。100k/day 無料枠に影響なし |
| D1 write | なし（seed は前提条件） |
| 課金ガード | smoke を CI で繰り返し実行する設計にしない |

結論: **free-tier 逸脱なし**。

## 3. 非対象領域（明示）

NON_VISUAL タスクのため以下は **scope out**:

- a11y（axe / Lighthouse）→ 06a 親タスクの責務
- visual regression → screenshot は evidence 1 枚に限定
- 04a API contract（zod 等）→ 04a 親タスク
- Playwright E2E → 08b の責務
- パフォーマンス計測 → smoke 範囲外

## 4. 再現性 / 冪等性

- AC-1 の 2 回連続 fresh 起動で同一結果
- AC-3 の `length >= 1` 緩条件で seed 件数の揺らぎを吸収
- staging への副作用なし（read-only smoke）

## 5. 不変条件 trace

| # | QA 担保 |
| --- | --- |
| #5 | AC-7 の `rg` 0 件 + 経路自体の 3 層分離 |
| #1 | `/members` 200 応答が schema 固定回避を間接担保 |
| #6 | smoke ルートに GAS endpoint を含めない |

## 結論

- secret hygiene を Phase 11 実施前後 2 回適用
- free-tier 逸脱なし
- 非対象領域 5 項目を明示
- 自動 rg ゲートを最終チェックに採用
