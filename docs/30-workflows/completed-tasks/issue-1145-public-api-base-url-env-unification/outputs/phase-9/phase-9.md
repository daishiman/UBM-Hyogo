# Phase 9: 品質保証 — grep gate 0 件 / typecheck / lint

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 9（品質保証） |
| 入力 | Phase 5（実装）/ Phase 8（リファクタリング） |
| 出力 | 本 `phase-9.md`（品質ゲート手順 + 実測記録欄） |
| 段階 | implemented_local_evidence_captured（手順仕様。実測値は2026-06-08 実測 PASS） |

## 2. 品質ゲート一覧（実行コマンドと PASS 基準）

すべて `mise exec --`（Node 24 / pnpm 10 保証）経由で実行する。package filter は `@ubm-hyogo/web` / `@ubm-hyogo/og`（`@repo/` ではない）。

| # | ゲート | コマンド | PASS 基準 |
| - | ------ | -------- | --------- |
| QG-1 | 旧キー全走査（AC-7） | `grep -rn 'PUBLIC_API_BASE_URL' apps/ \| grep -v 'NEXT_PUBLIC_API_BASE_URL'` | 出力 0 行（exit 1 = no match） |
| QG-2 | **[FB-UI-02-1]** ファイル削除 PASS 基準（AC-2） | `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` | 出力 0 件（関数・型・import・テスト名すべて消滅） |
| QG-3 | web typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0（旧キー fallback 削除に伴う型エラー無し） |
| QG-4 | web lint（lint-boundaries 含む） | `pnpm --filter @ubm-hyogo/web lint` | exit 0（`process.env.*` 直接参照を増やしていない・boundary 違反無し） |
| QG-5 | og typecheck | `pnpm --filter @ubm-hyogo/og typecheck` | exit 0（OgEnv rename の型整合） |
| QG-6 | targeted vitest（env） | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/env.spec.ts` | 全 green（getApiBaseEnv テスト削除後も schema parse green） |
| QG-7 | targeted vitest（public fetch） | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/fetch/public.spec.ts` | 全 green（transport 選択挙動が回帰しない） |
| QG-8 | targeted vitest（instrumentation） | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/__tests__/instrumentation.runtime.spec.ts` | 全 green |
| QG-9 | targeted vitest（server-fetch 3 本） | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | 全 green |
| QG-10 | targeted vitest（og member-source） | `pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/member-source.spec.ts` | 全 green（fallback 経路の意図保持） |
| QG-11 | targeted vitest（残 spec） | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/build-time-env.spec.ts apps/web/src/lib/fetch/authed.spec.ts apps/web/src/lib/api/__tests__/public.spec.ts` / `... @ubm-hyogo/og ... apps/og/src/__tests__/router.spec.ts` | 全 green |

> **[FB-UI-02-2]** メモリ制約下では全件 `pnpm test` を避け、Phase 1 §6 の targeted リストのみ実行する。

## 3. **[FB-UI-02-1]** ファイル削除 / 関数削除の PASS 基準（証跡仕様）

`getApiBaseEnv()` 関数・`ApiBaseEnv` 型は「削除」が変更内容のため、削除完了の証跡は **grep 0 件** を主証跡とする。

- **主証跡コマンド**: `grep -rn 'getApiBaseEnv' apps/` → **0 件** で削除完了とみなす。
- **補強証跡**: `grep -rn 'ApiBaseEnv' apps/` → 0 件（型まで消滅）。
- **削除前の baseline（implemented_local_evidence_captured 時点の実測・本 Phase 作成時に取得済）**:

```
apps/web/src/lib/env.ts:76:export interface ApiBaseEnv {
apps/web/src/lib/env.ts:168:export function getApiBaseEnv(rawEnv: RawEnv = readRawEnv()): ApiBaseEnv {
apps/web/src/lib/__tests__/env.spec.ts:11:  getApiBaseEnv,
apps/web/src/lib/__tests__/env.spec.ts:252:  it("getApiBaseEnv returns partial API base config ...
apps/web/src/lib/__tests__/env.spec.ts:254:      getApiBaseEnv({
apps/web/src/lib/__tests__/env.spec.ts:262:  it("getApiBaseEnv preserves blank strings ...
apps/web/src/lib/__tests__/env.spec.ts:264:      getApiBaseEnv({
```

→ 上記 7 行（定義 2 + import 1 + テスト 4）が **すべて消えること** が削除 PASS 基準。production consumer は 0 件（env.ts 定義 + env.spec のみ）であり、これがファイル削除（関数削除）を安全に行える根拠。

## 4. mirror parity の扱い

本タスクは skill / `.claude/skills` の mirror 対象ファイルを変更しない（変更は `apps/web` / `apps/og` のコード・config・spec のみ）。したがって **mirror parity（`.agents/skills` symlink diff）は該当なし（N/A）**。差分検証は不要。

## 5. 親不変条件の品質確認（AC-9）

| 不変条件 | 確認方法 | PASS 基準 |
| -------- | -------- | --------- |
| 既存 API surface のみ | `apps/api/src/routes/` 非変更 | `git diff --name-only` に `apps/api/` が出ない |
| D1 直接アクセスなし | `apps/web` から D1 binding 参照なし | 本変更で binding を追加していない（diff 目視 + lint-boundaries） |
| `process.env.*` 直接参照を増やさない | `git diff apps/web/src` で `process.env` 追加 0 | QG-4 lint + diff 目視 |
| OKLch トークン不変 | `apps/web/src/styles/tokens.css` 非変更 | `git diff --name-only` に tokens.css が出ない |

## 6. 実測記録欄（実装後に追記）

| ゲート | 期待 | 実測 |
| ------ | ---- | ---- |
| QG-1 旧キー grep | 0 行 | 2026-06-08 実測 PASS |
| QG-2 getApiBaseEnv\|ApiBaseEnv | 0 件 | 2026-06-08 実測 PASS |
| QG-3 web typecheck | exit 0 | 2026-06-08 実測 PASS |
| QG-4 web lint | exit 0 | 2026-06-08 実測 PASS |
| QG-5 og typecheck | exit 0 | 2026-06-08 実測 PASS |
| QG-6〜11 targeted vitest | 全 green | 2026-06-08 実測 PASS（件数を記録） |

## 7. 完了条件（PASS）

- [x] QG-1（AC-7）旧キー 0 行
- [x] QG-2（AC-2）getApiBaseEnv / ApiBaseEnv 0 件
- [x] QG-3 / QG-5 typecheck exit 0
- [x] QG-4 lint exit 0
- [x] QG-6〜11 targeted vitest 全 green
- [x] mirror parity = N/A 確認
- [x] 親不変条件 4 項目 PASS

> 2026-06-08 本サイクル実装後に実測 PASS。上記チェックは完了済み。

## 8. 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 検証コマンド正本 | 本 workflow `index.md` §7 | grep gate / typecheck / lint / vitest |
| targeted test リスト | 本 workflow `outputs/phase-1/phase-1.md` §6 | 全件回避の対象 11 本 |
| env アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | accessor 経由のみ / `process.env.*` 直接禁止 |
