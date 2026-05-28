<!-- workflow: members-list-ux-clarity / task: A / phase: 9 -->

# Phase 9 — 品質保証 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. QA 一括ゲート

| ゲート | コマンド | 期待 |
| ------ | -------- | ---- |
| typecheck | `mise exec -- pnpm --filter @ubm/web typecheck` | PASS |
| lint | `mise exec -- pnpm --filter @ubm/web lint` | PASS (warnings 0) |
| unit test | `mise exec -- pnpm --filter @ubm/web vitest run src/components/public/__tests__/DensityToggle.client.spec.tsx` | 全 12 ケース GREEN |
| design tokens | `mise exec -- pnpm verify-design-tokens` | GREEN (HEX 0 / 新 primitive 0) |
| token grep | `grep -rn "#[0-9a-fA-F]\\{3,8\\}" apps/web/src/components/public/DensityToggle.client.tsx apps/web/src/components/public/DensityToggle.client.tsx apps/web/src/components/ui/Segmented.tsx` | 0 件 |
| inline style grep | `grep -rn "style={{" apps/web/src/components/public/DensityToggle.client.tsx apps/web/src/components/public/DensityToggle.client.tsx` | 0 件 |
| Segmented 外部呼び出し parity | `git grep -n "import.*Segmented" apps/web/src` | optional prop 追加のみで既存呼び出し破壊 0 |

## 2. CLAUDE.md 不変条件チェック

| 不変条件 | 結果 |
| -------- | ---- |
| #4 OKLch tokens 正本 (HEX 禁止) | PASS (token grep 0 件) |
| #8 `*.spec.tsx` のみ | PASS (新規 test ファイルなし・既存拡張のみ) |
| INV-3 新 primitive 0 | PASS (HelpHint は feature レベル `components/public/`) |
| INV-2 URL query SSOT | PASS (`density` のみ操作・他 param 保持確認 TC-A12) |
| INV-5 プロトタイプ正本順位 | PASS (主ラベル不変・AC-A6) |

## 3. mirror parity

本タスクは workflow 内仕様書のみ作成し、`.claude/skills/*` への code 同期は伴わない (実装が Phase 5 で行われた後に Phase 12 で同期)。

## 4. DoD

- [ ] 全ゲートが PASS
- [ ] 不変条件 5 項目が PASS
- [ ] Segmented optional prop 拡張で他呼び出し元への影響 0 を grep で証跡化
