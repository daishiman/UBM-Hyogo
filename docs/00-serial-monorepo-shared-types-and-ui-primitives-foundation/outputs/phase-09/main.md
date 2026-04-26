# Phase 9 成果物: 品質保証

## 無料枠見積もり

| サービス | 上限/日 | このタスク消費 | 余裕 |
|---------|--------|-------------|------|
| D1 reads | 500,000 | 0 | 100% |
| D1 writes | 100,000 | 0 | 100% |
| D1 storage | 5 GB | 0 | 100% |
| Workers req | 100,000 | 0（manual smoke のみ） | ≈100% |
| Pages build | 制限なし | 0 | 100% |

## Secret Hygiene チェックリスト

| 項目 | 結果 |
|------|------|
| このタスクで導入する Cloudflare Secret | 0 件 |
| このタスクで導入する GitHub Secret | 0 件 |
| .env を生成しているか | NO |
| wrangler.toml に secret 値を直書きしているか | NO（database_id は placeholder） |
| next.config.ts に API key を埋め込んでいるか | NO |

## a11y チェック

| 項目 | 対応 primitive | smoke test 結果 |
|------|-------------|---------------|
| Drawer/Modal: dialog role + aria-labelledby | Drawer, Modal | ✅ PASS |
| Button: aria-busy（loading） | Button | ✅ PASS |
| Switch: role="switch" + aria-checked | Switch | ✅ PASS |
| Field/Input: id ↔ htmlFor + aria-describedby | Field, Input, Textarea, Select | ✅ PASS |
| Avatar: aria-label 氏名 | Avatar | ✅ PASS |
| LinkPills: rel="noopener noreferrer" | LinkPills | ✅ PASS |

## 最終 Sanity（4 軸）

| 軸 | コマンド | 結果 |
|----|---------|------|
| typecheck | `pnpm -r typecheck` | ✅ exit 0（5 package） |
| lint | `pnpm -r lint` | ✅ exit 0 |
| test | `pnpm test` | ✅ 30 tests PASS |
| scaffold-smoke | typecheck で AC-9 確認済み | ✅ |
