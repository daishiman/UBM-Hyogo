# Phase 5 — 実装ランブック

## 実行手順（実施済み）

1. `packages/shared/src/zod/field.ts` に `STABLE_KEY` const（31 entry, `as const satisfies { readonly [K in StableKeyName]: K }`）を追加。既存 branded type `StableKey` との name collision 回避のため SCREAMING_SNAKE_CASE を採用。
2. 14 ファイルそれぞれで `import { STABLE_KEY } from "@ubm-hyogo/shared"`（または相対 path）を追加。
3. 各 family の literal を `STABLE_KEY.<key>` に逐次置換:
   - family A: DB_FIELD_MAP / UPSERT_COLUMNS / ROW_FIELD_ORDER / consent 比較
   - family B: bracket access / SQL template `'${STABLE_KEY.X}'` / 定数 RHS
   - family C: bracket access / Set entries
   - family D: SUMMARY_KEYS / Map.get 引数 / FORBIDDEN_KEYS / FIELD_TO_SUMMARY
   - family E: TS indexed access type → `typeof STABLE_KEY.X`
   - family F: JSX attribute → `data-role={STABLE_KEY.X}`
   - family G: PUBLIC_CONSENT_KEY / RULES_CONSENT_KEY 初期化値 / LEGACY_KEYS 先頭要素
4. `mise exec -- pnpm typecheck` PASS
5. `mise exec -- pnpm lint` PASS（`stablekey-literal-lint` warning モードも 0 件）
6. `node scripts/lint-stablekey-literal.mjs --strict` PASS（exit 0, 0 violations, stableKeyCount=31）
7. focused vitest 実行で全 158 件 PASS

## 適用 commit
本ランブック完了時点で working tree に変更が反映済み。strict mode で 0 件確認済み。
