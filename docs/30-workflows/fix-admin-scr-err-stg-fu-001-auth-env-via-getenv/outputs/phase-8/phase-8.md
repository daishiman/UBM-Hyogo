# Phase 8: リファクタリング

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Task ID | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV |
| Phase  | 8 / 13（リファクタリング）                  |
| 依存   | Phase 5（実装） / Phase 6（テスト拡充） / Phase 7（カバレッジ確認） |
| 成果物 | outputs/phase-8/phase-8.md                  |
| 主眼   | **duplicate 削減 + navigation drift 解消**（env 参照ロジックの単一所有権を env.ts に集約） |

## 1. このPhaseの責務

Phase 5 で `auth.ts` の `env()` を `getAuthEnv()` 経由へ切り替えた後、**重複したローカル env 読み取り
ロジック・型定義・コメントを削除し、import を整理**する。本タスクのリファクタは「機能変更を伴わない構造整理」
であり、すべて Phase 5/6 の green を維持したまま行う（GREEN→REFACTOR）。

## 2. リファクタリング項目（対象 / Before / After / 理由）

| # | 対象                                              | Before                                                            | After                                                              | 理由 |
| - | ------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| 1 | `auth.ts` import `getCloudflareContext`            | `import { getCloudflareContext } from "@opennextjs/cloudflare";`（L15） | **削除**                                                          | AC-2。cloudflare context 解決は env.ts(`readRawEnv`) に単一所有させる。auth.ts が解決元を知る責務を撤去 |
| 2 | `auth.ts` `AuthEnv` interface ローカル定義         | `export interface AuthEnv { ... }`（L24-35）                      | **削除**し `import { getAuthEnv, type AuthEnv } from "./env";` に置換 | 型の単一所有権を env.ts に移動。`auth.ts` と `env.ts` の二重定義（navigation drift）を解消 |
| 3 | `auth.ts` `cloudflareEnv()` 関数                   | `getCloudflareContext().env as AuthEnv`（L37-43）                 | **削除**                                                          | env.ts の `readRawEnv()`（cloudflare 解決を内包）と機能重複。getAuthEnv に吸収 |
| 4 | `auth.ts` `processEnv()` 関数                      | `process.env["..."]` × 9 key + `definedEnv` 整形（L56-69）         | **削除**                                                          | AC-1。env.ts の `readProcessEnv()` と機能重複。getAuthEnv に吸収 |
| 5 | `auth.ts` `definedEnv()` 関数                      | `processEnv()` と `requestEnv()` の両方で使用（L49-54）            | **保持**（`requestEnv()` がまだ使用するため）                     | processEnv 削除後も requestEnv が `definedEnv` を使う。live 参照が残るので削除しない。dead code 化しないことを §4 で確認 |
| 6 | `auth.ts` `env()` 合成式                           | `{ ...processEnv(), ...globalEnv(), ...cloudflareEnv() }`（L71-75） | `{ ...getAuthEnv(), ...globalEnv() }`                             | 3 経路混在を 2 項合成へ単純化。解決の優先順は getAuthEnv が cloudflare 優先を内包するため不変 |
| 7 | `auth.ts` ファイル冒頭コメントの secrets 列挙       | L10-12 の secrets コメント（process.env 前提のニュアンス）        | env.ts 経由参照に整合する文言へ微修正（または現状維持で可）        | コメントの陳腐化（navigation drift）防止。機能に影響しないため必須ではないが推奨 |
| 8 | `env.ts` への型・schema・アクセサ追加               | なし                                                              | `AuthEnvSchema`（pick+partial）/ `AuthEnv` interface / `getAuthEnv()` を追加（Phase 5 で実施済） | 集約先。所有権移動の受け皿 |

> 項目 5 の重要点（FB-UI-02-1: stub/削除どちらでも PASS）: `processEnv()` を削除しても `definedEnv()` は
> `requestEnv()` から live import され続ける。よって `definedEnv()` は**削除しない**（削除すると requestEnv が壊れる）。
> `cloudflareEnv()` / `processEnv()` は live 参照がゼロになるため**削除**する。

## 3. import 整理の確定形

リファクタ後の `auth.ts` 冒頭 import:

```ts
import type { NextRequest } from "next/server";
// import { getCloudflareContext } from "@opennextjs/cloudflare";  ← 削除
import {
  decodeAuthSessionJwt,
  encodeAuthSessionJwt,
  SESSION_JWT_TTL_SECONDS,
  type GateReason,
  type SessionResolveResponse,
} from "@ubm-hyogo/shared";
import { getAuthEnv, type AuthEnv } from "./env";  // ← 追加
```

> `@opennextjs/cloudflare` import が auth.ts から完全に消えること（AC-2 grep gate と整合）。
> `type AuthEnv` は `import type` ではなく `import { ..., type AuthEnv }`（混在 import）で受ける。
> `verbatimModuleSyntax` 環境では `getAuthEnv`（値）と `AuthEnv`（型）の混在 import で型側に `type` 修飾を付ける。

## 4. dead code チェック手順

削除した関数 / 型に対する live 参照がゼロであることを grep で機械確認する。

```bash
# 削除関数の live 参照ゼロ確認（spec 内の参照も含めて 0 件であること）
grep -rn "cloudflareEnv\b" apps/web/src/lib/ ; echo "--- expect: 0 (auth.ts local cloudflareEnv 削除後)"
grep -rn "\bprocessEnv\b" apps/web/src/lib/ ; echo "--- expect: 0 (auth.ts local processEnv 削除後)"

# definedEnv は requestEnv が使うので live 参照が残る（>=1 が正しい）
grep -rn "\bdefinedEnv\b" apps/web/src/lib/auth.ts ; echo "--- expect: >=1 (requestEnv が使用・保持が正しい)"

# AuthEnv 型の二重定義チェック（env.ts のみに interface 定義が残ること）
grep -rn "interface AuthEnv\|export interface AuthEnv" apps/web/src/lib/ ; echo "--- expect: env.ts のみ 1 件"

# getCloudflareContext が auth.ts から消えたこと（AC-2）
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts ; echo "--- expect: 0 件"
```

> `readCloudflareEnv` / `readProcessEnv`（env.ts 内）は名前が似ているが env.ts のローカル関数であり別物。
> grep パターンは単語境界（`\b`）で `cloudflareEnv` と `readCloudflareEnv` を区別する点に注意（後者は env.ts に live で残る）。

## 5. 重複コメント・陳腐化コメントの削除

| 対象                                          | 対応                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `processEnv()` 上の説明コメント（あれば）      | 関数ごと削除されるため自動的に消える                                  |
| `cloudflareEnv()` の try/catch 意図コメント    | 同上（env.ts `readCloudflareEnv` に同等コメントが既存・重複解消）      |
| ファイル冒頭 secrets 列挙コメント（L10-12）    | env 参照経路が getAuthEnv に変わった旨を 1 行追記、または現状維持      |

> env.ts の `readRawEnv()` には PLAYWRIGHT override の意図コメントが既存。auth.ts 側に同種コメントを重複させない。

## 6. リファクタ後の機能不変性検証

リファクタは構造整理のみ。以下で機能不変を担保する。

```bash
# 1. 全 auth/env テストが green を維持（REFACTOR 後も RED にならない）
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/auth.spec.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts

# 2. 型チェック（import 整理・型移動で型エラーが出ないこと）
mise exec -- pnpm typecheck

# 3. lint（unused import / unused var が残っていないこと）
mise exec -- pnpm lint
```

## 7. 完了条件（このPhaseの DoD）

- [ ] `cloudflareEnv()` / `processEnv()`（auth.ts ローカル）を削除し、live 参照ゼロを grep 確認
- [ ] `AuthEnv` interface のローカル定義を削除し、`./env` からの import に置換（二重定義解消）
- [ ] `getCloudflareContext` import を auth.ts から撤去（AC-2 grep gate = 0 件）
- [ ] `definedEnv()` は requestEnv が使うため保持（誤削除しない）を §4 grep で確認
- [ ] import 整理後 `pnpm typecheck` / `pnpm lint` が pass（unused なし）
- [ ] §6 のテスト再実行で全ケース green を維持（機能不変）
