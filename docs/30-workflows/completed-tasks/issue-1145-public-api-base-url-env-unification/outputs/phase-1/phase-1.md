# Phase 1: 要件定義 — 旧 PUBLIC_API_BASE_URL env 削除 / NEXT_PUBLIC_ 単一化

> **[実装区分: 実装仕様書]** NON_VISUAL / implementation_mode: new（削除・rename 主体）

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 1（要件定義） |
| タスク分類 | docs-only ではない **実装タスク（NON_VISUAL）** |
| 目的 | scope / 受入条件 / inventory / 命名規則を固定する |
| 入力 | issue #1145 / 現行コード grep 結果 / 起点 unassigned spec |
| 出力 | 本 `phase-1.md` |

## 2. 真の論点（要件レビュー思考法）

1. **真の論点**: 「同一の API base URL に対し env キーが 2 命名（`NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL`）併存している」ことが主問題。現象（fallback dead path・wrangler 二重定義）ではなく **命名の重複そのもの** が根本。
2. **依存関係・責務境界**: env の正本所有は `apps/web/src/lib/env.ts`（accessor 経由のみ）と各 `wrangler.toml`。consumer は `public.ts`（web）と `member-source.ts`（og）。責務境界は「env 定義層」「env accessor 層」「consumer 層」「config（wrangler/.dev.vars/playwright）層」「test 層」の 5 層。旧キーはこの 5 層すべてに散在しているため、**5 層を同一サイクルで一括除去**しないと型エラー or runtime undefined を招く。
3. **価値とコストの不均衡**: 価値 = 二重定義による値乖離事故の構造的排除 + 命名一貫性。コスト最大箇所 = spec 群 11 ファイルの seed/assert 移行（意図保持が必要）。
4. **改善優先順位**: ① env.ts + public.ts（型結合・最優先）→ ② wrangler/config → ③ apps/og rename → ④ spec 群移行 → ⑤ grep gate 0 件確認。
5. **4 条件評価**: 価値性○（負債解消）/ 実現性○（小規模・1 サイクル完結）/ 整合性○（5 層同時除去で閉じる）/ 運用性○（grep gate で恒久監査可能）。

## 3. 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 観点 | 現行規則 | 本タスクでの遵守 |
| ---- | -------- | ---------------- |
| env キー命名 | client 公開 base URL = `NEXT_PUBLIC_API_BASE_URL`、内部 = `INTERNAL_API_BASE_URL` | 旧 `PUBLIC_API_BASE_URL` を `NEXT_PUBLIC_API_BASE_URL` に寄せる（新命名は導入しない） |
| accessor 命名 | `getEnv` / `getPublicEnv` / `getPublicFetchEnv` / `getAdminFetchEnv` / `getApiBaseEnv` | `getApiBaseEnv` は削除（D-3）。他 accessor 名は不変 |
| env 参照経路 | `apps/web/src` は accessor 経由のみ（`process.env.*` 直接禁止・CLAUDE.md task-02） | 不変条件を維持。直接参照を増やさない |
| package 名 | `@ubm-hyogo/web` / `@ubm-hyogo/og` | 検証コマンドで使用（元 spec の `@repo/web` は誤り） |

## 4. P50 チェック（前提確認）

| 確認項目 | 結果 | 対応 |
| -------- | ---- | ---- |
| current branch に実装が存在するか | **No**（旧キーは残存したまま = 未実装） | 通常の実装 Phase（new）とする |
| upstream（main）にマージ済みか | No（未着手） | — |
| 前提タスク完了済みか | Yes（起点 `staging-api-url-and-session-recovery` は `implemented_local_evidence_captured`） | 依存解消済み。本タスクは「2 段階削除の 2 段目」 |

→ `implementation_mode: new`（RED/GREEN ではなく削除/rename + 回帰確認サイクル）。

## 5. インベントリ（変更対象 19 ファイル）

index.md §2 の表を正本とする。要約:

- **apps/web プロダクション/設定（6）**: `env.ts`・`fetch/public.ts`・`wrangler.toml`・`.dev.vars.example`・`playwright.config.ts`・`playwright.admin-schema-diff.config.ts`
- **apps/og プロダクション/設定（2）**: `src/member-source.ts`・`wrangler.toml`
- **spec 群（11）**: env.spec / fetch/public.spec / api/public.spec / build-time-env.spec / fetch/authed.spec / instrumentation.runtime.spec / server-fetch.{env,binding,http-fallback}.spec / og member-source.spec / og router.spec

## 6. targeted test ファイルリスト（FB-UI-02-2: 全件実行回避）

メモリ制約下では全件 `pnpm test` を避け、以下を targeted run する:

```
apps/web/src/lib/__tests__/env.spec.ts
apps/web/src/lib/__tests__/build-time-env.spec.ts
apps/web/src/lib/fetch/public.spec.ts
apps/web/src/lib/fetch/authed.spec.ts
apps/web/src/lib/api/__tests__/public.spec.ts
apps/web/src/__tests__/instrumentation.runtime.spec.ts
apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts
apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts
apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts
apps/og/src/__tests__/member-source.spec.ts
apps/og/src/__tests__/router.spec.ts
```

## 7. 受入条件（AC 明示列挙）

index.md §4 の AC-1〜AC-9 を本 Phase の正本として固定する（予告でなく明示済み）。

## 8. CONST_007 スコープ充足

本タスクは「2 段階削除の 2 段目」であり、全走査で旧キーを 0 件にできる前提が満たされている（19 ファイル特定済）。**今回サイクル内で全 19 ファイルを完了**できる小規模スコープ。先送り・将来タスク分離は無し。

## 9. 完了条件

- [x] scope / inventory（19 ファイル）固定
- [x] 命名規則分析記録
- [x] P50 チェック実施（mode: new）
- [x] AC-1〜AC-9 明示
- [x] targeted test リスト列挙

## 10. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 環境変数アクセス | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | accessor 経由のみ / `process.env.*` 直接禁止 |
| Cloudflare CLI ルール | `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由 / secret 値非出力 |
