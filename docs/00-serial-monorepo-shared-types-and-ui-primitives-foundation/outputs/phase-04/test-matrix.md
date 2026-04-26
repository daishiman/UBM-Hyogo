# Test Matrix

| AC | 内容 | テスト項目 | コマンド |
|----|------|-----------|----------|
| AC-1 | pnpm install | lockfile 生成 | `pnpm install` |
| AC-2 | typecheck exit 0 | tsc --noEmit 全 package | `pnpm -r typecheck` |
| AC-3 | lint exit 0 + ESLint rule | no-d1-from-web (placeholder) | `pnpm -r lint` |
| AC-4 | test exit 0 | tones.test.ts + ids.test.ts + primitives.test.tsx | `pnpm test` |
| AC-5 | UI primitives 15 種 export | barrel export smoke | index.ts から 15 種確認 |
| AC-6 | tones.ts 2 関数 export | tones.test.ts 7 ケース | `pnpm test` |
| AC-7 | next.config.ts @opennextjs 対応 | ファイル存在確認 | `ls apps/web/next.config.ts` |
| AC-8 | GET /healthz 200 | `curl http://localhost:8787/healthz` | wrangler dev 後に確認 |
| AC-9 | shared 4 型 export | typecheck で MemberId 等が import 可能 | `pnpm -r typecheck` |

## Primitive Smoke Test 一覧（15 種）

| # | primitive | smoke 観点 | 実装状況 |
|---|-----------|-----------|---------|
| 1 | Chip | render + tone prop | ✅ |
| 2 | Avatar | hue 決定論性 + aria-label | ✅ |
| 3 | Button | aria-busy=loading | ✅ |
| 4 | Switch | role=switch + aria-checked | ✅ |
| 5 | Segmented | role=radiogroup | ✅ |
| 6 | Field | htmlFor ↔ id | ✅ |
| 7 | Input | render | ✅ |
| 8 | Textarea | render | ✅ |
| 9 | Select | render | ✅ |
| 10 | Search | clear button onChange("") | ✅ |
| 11 | Drawer | role=dialog + Escape close | ✅ |
| 12 | Modal | role=dialog | ✅ |
| 13 | Toast | Provider render | ✅ |
| 14 | KVList | dl/dt 件数 | ✅ |
| 15 | LinkPills | rel=noopener noreferrer | ✅ |
