# Phase 9: 品質保証

| Gate | コマンド | 結果 |
| --- | --- | --- |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| lint | `pnpm --filter @ubm-hyogo/web lint` | PASS |
| unit / component test | `pnpm --filter @ubm-hyogo/web test -- --run` | 127 files / 897 passed / 1 skipped |
| design tokens | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | 9/9 PASS |

regression: 0。新規 spec 33 件追加、既存 spec 全件維持。

## 未実施 gate (本サイクル外)

- `pnpm build` (next build --webpack) — ローカル build スコープ。CI 側 `web-cd` workflow で deploy 前検証される。本サイクルでは UI 変更なし＋型整合維持により build 失敗リスクは限定的。
- Playwright smoke / visual — Phase 11 の 4 viewport × 5 screen は authenticated runtime が必要なため user-gated。
