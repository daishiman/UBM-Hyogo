# T02: env.ts に getEnvironmentResolution を追加（環境解決 + 明示注入判定）

> レーン A の**前段**。T01（transport fail-closed の配線）が本タスクの戻り値 `{ environment, explicit }` を `resolveApiFetch` の入力（`environment` / `environmentExplicit`）に使うため、T01 より先に確定させる（env → transport の一方向依存）。

正本参照: `../../_shared-context.md`（§5 シグネチャ）/ `../phase-4/phase-4.md`（§2 入出力表 E-1〜5）/ `../phase-2/phase-2.md`（§3 env.ts 側）

## 変更対象ファイル

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `apps/web/src/lib/env.ts` | 編集 | `getEnvironmentResolution(rawEnv?)` を新規 export。`getEnvironment` は不変（後方互換） |
| 2 | `apps/web/src/lib/__tests__/env.spec.ts` | 編集 | T5-1〜T5-5 を追加 |

新規ファイルは作らない（既存 `env.ts` に追記）。

## シグネチャ

```ts
// env.ts に追加
export function getEnvironmentResolution(
  rawEnv: RawEnv = readRawEnv(),
): { environment: "local" | "staging" | "production"; explicit: boolean };
```

- `environment`: `rawEnv["ENVIRONMENT"]` が enum 3値に厳密一致すればその値、そうでなければ `"local"`（= 既存 `getEnvironment` と同値）。
- `explicit`: `rawEnv["ENVIRONMENT"]` が `"local" | "staging" | "production"` のいずれかに**厳密一致**するとき `true`、未定義 / typo / 型不一致のとき `false`。

実装方針（重複ロジックを最小化）:
- `environment` は既存 `getEnvironment(rawEnv)` を内部呼び出しして得る（同値保証・後方互換）。
- `explicit` は `const v = rawEnv["ENVIRONMENT"]; v === "local" || v === "staging" || v === "production"` で判定する。
- 既存 `getEnvironment` のシグネチャ・挙動は**変更しない**（phase-2 §3）。

## 入出力・副作用

- 入力: `RawEnv`（省略時 `readRawEnv()`）。判定対象は `rawEnv["ENVIRONMENT"]` のみ。
- 出力: `{ environment, explicit }`（Phase 4 §2 表 E-1〜5）。
- 副作用: なし（純関数。`readRawEnv()` の読み取りのみ）。
- `process.env` 直接参照は追加しない（不変条件 #3。`readRawEnv` 経由）。

## テスト方針

`apps/web/src/lib/__tests__/env.spec.ts` に以下を追加（Phase 4 §6 T5 表に厳密一致）。既存の `cloudflareContext` mock パターンを踏襲し、`getEnvironmentResolution` を import に追加。

| ケースID | 入力 | 期待 |
|----------|------|------|
| T5-1 | `{ ENVIRONMENT: "staging" }` | `{ environment: "staging", explicit: true }` |
| T5-2 | `{ ENVIRONMENT: "production" }` | `{ environment: "production", explicit: true }` |
| T5-3 | `{ ENVIRONMENT: "local" }` | `{ environment: "local", explicit: true }` |
| T5-4 | `{}` | `{ environment: "local", explicit: false }` |
| T5-5 | `{ ENVIRONMENT: "stagin" }` | `{ environment: "local", explicit: false }` |

既存 env.spec ケース（getEnv / getPublicEnv / getAuthEnv 等）は**回帰ゼロ**（本タスクは追加のみ・既存関数不変）。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/env.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-localhost-bake.sh --src-only
```

## 完了条件(DoD)

- [ ] `getEnvironmentResolution` が export され、Phase 4 §2 表 E-1〜5 を満たす。
- [ ] `getEnvironment` のシグネチャ・挙動が不変（既存 env.spec 回帰ゼロ）。
- [ ] T5-1〜T5-5 が green。
- [ ] typecheck / lint green。
- [ ] `verify-no-localhost-bake --src-only` green（新規 localhost/8787/8888 リテラル 0）。
- [ ] `process.env` 直接参照を追加していない（`readRawEnv` 経由）。
