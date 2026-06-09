# Phase 4: テスト作成 — grep gate + 回帰テスト設計

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 4（テスト作成） |
| 入力 | Phase 1（要件 / AC-1〜AC-9）/ Phase 2（削除順序 Step 1-7 / lane A-D）/ Phase 3（GO 判定） |
| 出力 | 本 `phase-4.md`（検証 command suite と expected result） |
| 実装区分 | NON_VISUAL（削除 / rename リファクタリング。挙動不変 = 既存テストの green 維持が回帰 guard の本体） |

## 2. テスト戦略（implementation_mode: new だが挙動不変）

本タスクは「同義 env キー二重化の解消」であり、**base URL 解決挙動・transport 選択挙動は不変**（Phase 1 §2 / 設計判断 D-5）。
したがって新規の振る舞いテストは追加せず、テスト設計の中核は次の 2 つに置く:

1. **静的 grep gate（AC-7 / AC-2）**: 旧キー `PUBLIC_API_BASE_URL` と削除対象シンボル `getApiBaseEnv` / `ApiBaseEnv` が repo 全体で 0 件であることを機械検証する（恒久監査可能な完了判定）。
2. **既存 spec の green 維持（回帰 guard）**: spec 群 11 ファイルの seed / assert を `NEXT_PUBLIC_API_BASE_URL` へ移行したうえで全 green を維持する。これにより「base URL 解決」「transport 選択（service-binding 優先 / HTTP fallback）」「OG fallback 経路」の挙動不変が担保される。

> 新規テストファイルは作成しない。本 Phase は「どの command を、どの expected result で実行するか」を確定する。実際の seed/assert 移行手順は Phase 5 Step 5、fail path / 回帰 guard の拡充は Phase 6 で扱う。

## 3. 検証 command suite（Phase 5 実装後に実行する正本）

各コマンドは worktree ルート（`/Users/.../UBM-Hyogo/.worktrees/task-20260607-214657-wt-5`）から実行する。

### 3.1 静的 grep gate

| # | コマンド | expected result | 対応 AC |
| - | -------- | --------------- | ------- |
| G-1 | `grep -rn 'PUBLIC_API_BASE_URL' apps/ \| grep -v 'NEXT_PUBLIC_API_BASE_URL'` | **0 件（exit 1 = 一致なし）** | AC-7 |
| G-2 | `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` | **0 件（exit 1 = 一致なし）** | AC-2 |
| G-3 | `grep -rn 'NEXT_PUBLIC_API_BASE_URL' apps/og/` | **2 件以上 HIT**（rename の結果が残る = 解決経路が消えていないことの確認。`member-source.ts` の `OgEnv` 型 + `fetchViaBaseUrl`、`wrangler.toml` 3 行、spec 群） | AC-5 |

> G-1 / G-2 は「0 件」が成功なので、`grep` の exit code 1（一致なし）が期待値。スクリプト化する場合は `! grep ...` で成功判定する。
> G-3 は rename の取りこぼし（削除してしまった）を逆方向で検出するための補助 gate。

### 3.2 型 / lint gate

| # | コマンド | expected result | 対応 AC |
| - | -------- | --------------- | ------- |
| T-1 | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0（型エラー 0） | AC-1 / AC-3 / AC-8 |
| T-2 | `pnpm --filter @ubm-hyogo/web lint` | exit 0（lint-boundaries 含め違反 0） | AC-8 / AC-9 |
| T-3 | `pnpm --filter @ubm-hyogo/og typecheck` | exit 0（型エラー 0） | AC-5 / AC-8 |

> T-1 は Phase 2 §5 の設計上の肝の検証点。env.ts（Step 1）で `getPublicFetchEnv()` 戻り値型から `PUBLIC_API_BASE_URL?` を削除した後、public.ts（Step 2）の `?? env.PUBLIC_API_BASE_URL` が未修正だと **typecheck が機械検出**する。Step 1-2 を同一サイクルで完了させた状態で T-1 が exit 0 になることが、取りこぼしゼロの証明になる。

### 3.3 vitest 回帰 gate（targeted run。全件実行は回避 = Phase 1 §6）

| # | コマンド | expected result | 対応 AC |
| - | -------- | --------------- | ------- |
| V-1 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/env.spec.ts` | 全 green（旧キー seed テスト削除後の本数で。`getApiBaseEnv` の 2 テスト削除を含む） | AC-2 / AC-6 |
| V-2 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/fetch/public.spec.ts` | 全 green（transport 選択意図保持） | AC-6 / AC-8 |
| V-3 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/api/__tests__/public.spec.ts` | 全 green | AC-6 |
| V-4 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/build-time-env.spec.ts` | 全 green | AC-6 |
| V-5 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/fetch/authed.spec.ts` | 全 green | AC-6 |
| V-6 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/__tests__/instrumentation.runtime.spec.ts` | 全 green | AC-6 |
| V-7 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | 全 green | AC-6 |
| V-8 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | 全 green | AC-6 |
| V-9 | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | 全 green | AC-6 |
| V-10 | `pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/member-source.spec.ts` | 全 green（テスト名 `falls back to PUBLIC_API_BASE_URL` を `falls back to NEXT_PUBLIC_API_BASE_URL` へ rename 後。fallback 意図保持） | AC-6 / AC-5 |
| V-11 | `pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/router.spec.ts` | 全 green | AC-6 |

## 4. テストごとの「保持すべき意図」マトリクス（移行時の不変点）

seed/assert を旧キー → 新キーへ機械的に置換するだけでなく、各テストが検証している**振る舞いの意図**を壊さないことを移行時の不変点として固定する。

| spec | 検証している振る舞い（不変点） | 移行操作 |
| ---- | ------------------------------ | -------- |
| `env.spec.ts` | schema parse 成否 / accessor の戻り値形 | 旧キー seed 削除。`getApiBaseEnv` の 2 テスト（L252 / L262 系）は関数削除に伴い**テストごと削除** |
| `fetch/public.spec.ts` | service-binding 優先 / HTTP fallback の transport 選択 | seed / delete / assert / テスト名の `PUBLIC_API_BASE_URL` を `NEXT_PUBLIC_API_BASE_URL` へ。選択結果（どちらの transport が選ばれるか）は不変 |
| `api/__tests__/public.spec.ts` | public API 経由 fetch の base URL 組み立て | seed / assert を rename |
| `build-time-env.spec.ts` | build 時 env 注入の確認 | seed を rename |
| `fetch/authed.spec.ts` | authed fetch の env shape | 型定義 + seed の旧キーを削除（NEXT_PUBLIC_ 単一に） |
| `instrumentation.runtime.spec.ts` | runtime instrumentation 初期化 | 同義二重 seed（旧キー）を削除。NEXT_PUBLIC_ 側 seed は保持 |
| `server-fetch.{env,binding,http-fallback}.spec.ts` | admin server-fetch の transport（env / binding / http-fallback の 3 経路） | 各 1 件の旧キー seed を削除（admin 経路は INTERNAL_ 主体で旧キーは余剰 seed） |
| `og member-source.spec.ts` | OG fallback（binding 不在時に base URL fetch） | seed / テスト名を rename。fallback 経路が選ばれる挙動は不変 |
| `og router.spec.ts` | OG router の env 受け渡し | seed を rename |

## 5. 完了条件（本 Phase の成果物として確定したこと）

- [x] 静的 grep gate G-1〜G-3 を expected result 付きで確定
- [x] 型 / lint gate T-1〜T-3 を確定（T-1 が取りこぼし機械検出点であることを明記）
- [x] vitest 回帰 gate V-1〜V-11 を targeted run リストとして確定（全件実行回避）
- [x] 各 spec の「保持すべき振る舞いの意図」を移行不変点として固定
- [x] 新規テストファイルは作成しない方針を明示（挙動不変リファクタリングのため）

## 6. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 環境変数アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | env 参照は `env.ts` accessor 経由のみ / `process.env.*` 直接参照を `apps/web/src` に増やさない（本 Phase の T-2 lint gate で監査） |
| Cloudflare CLI ルール | `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由 / secret 値は出力しない |
| 検証コマンド正本 | `index.md` §7 | package filter は `@ubm-hyogo/web` / `@ubm-hyogo/og`（`@repo/` ではない） |
| targeted test リスト | `outputs/phase-1/phase-1.md` §6 | 全件 `pnpm test` を避け 11 ファイルを targeted run |
