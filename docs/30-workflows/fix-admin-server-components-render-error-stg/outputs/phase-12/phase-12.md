# Phase 12: ドキュメント更新

## Task 12-1: 実装ガイド作成

### Part 1（中学生レベル）

#### この修正は何をしたの？

UBM 兵庫支部会のメンバーサイトには「管理画面（admin 画面）」があり、運営の人がメンバー情報を編集したり、出席記録を見たりできます。

ところが、本番に近い環境（staging）で管理画面を開こうとすると、エラー画面が出て表示できなくなっていました。原因はざっくり言うと、**「住所メモを間違った棚から探していた」** ことです。

私たちのサイトは Cloudflare Workers という「世界中に散らばっている超軽量サーバー」で動いています。このサーバーには「環境変数（env）」という設定値が登録されていて、たとえば「API サーバーの住所はここ」というメモが置かれています。

これまでのコードは、このメモを **古い棚（`process.env` という Node.js の伝統的な棚）** から取り出そうとしていました。でも Cloudflare Workers では、メモは **新しい棚（`getCloudflareContext().env`）** に置かれているので、古い棚を見ても空っぽ。空っぽだったときの保険として「とりあえず自分のパソコンの中（127.0.0.1）に聞きに行く」というコードが書かれていましたが、Cloudflare Workers は世界中に散らばっているサーバーなので「自分のパソコン」なんて場所はなく、結局誰にも繋がらずエラーになっていたのです。

今回の修正で:

1. **新しい棚から取り出す** ように直しました（`getEnv()` という、棚を間違えない関数を経由するルールに合わせた）。
2. **「ダメだったらパソコンの中に聞きに行く」という保険を撤去** しました（代わりに、設定が無ければはっきりエラーにして、運営の人がすぐ気づけるようにした）。
3. **同じ間違いを二度としないように見張り（テスト）を置きました**（admin の中で古い棚を直接見るコードが書かれたら CI が即座に止める）。

### Part 2（技術者レベル）

#### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/manual-test-result.md`（focused Vitest 13 PASS、staging /admin runtime smoke は user-gated pending）を参照。

#### 変更サマリー

| 領域           | 変更                                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| env 参照経路   | `process.env[...]` 直接 → `getEnv()` 経由（Cloudflare context env 優先）          |
| fallback       | `http://127.0.0.1:8787` 撤去（schema parse 失敗時は throw → `error.tsx` で表示）  |
| EnvSchema      | `INTERNAL_AUTH_SECRET: z.string().min(1).optional()` を追加                       |
| regression     | `server-fetch.env.spec.ts` + `env.spec.ts` focused Vitest                          |

#### API シグネチャ

```ts
// apps/web/src/lib/env.ts
export const EnvSchema: z.ZodObject<{
  ENVIRONMENT: z.ZodEnum<["local", "staging", "production"]>;
  NEXT_PUBLIC_API_BASE_URL: z.ZodString;
  PUBLIC_API_BASE_URL: z.ZodString;
  INTERNAL_API_BASE_URL: z.ZodString;
  INTERNAL_AUTH_SECRET: z.ZodOptional<z.ZodString>; // NEW
  AUTH_URL: z.ZodString;
  // ...
}>;

export function getEnv(rawEnv?: RawEnv): Env;
export function getPublicEnv(rawEnv?: RawEnv): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">;
```

```ts
// apps/web/src/lib/admin/server-fetch.ts
export async function fetchAdmin<T>(path: string, opts?: AdminFetchOptions): Promise<T>;
```

#### エッジケース・エラーハンドリング

| ケース                                | 挙動                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| `INTERNAL_API_BASE_URL` 未投入        | `EnvSchema.parse` で throw → admin/error.tsx で digest 表示 |
| `INTERNAL_AUTH_SECRET` 未投入         | `.optional()` のため schema parse は許容、`x-internal-auth` は空文字送信 |
| API レスポンス !ok                    | `throw new Error(...)` → error.tsx                    |
| fixture branch（NODE_ENV / PLAYWRIGHT_*）| `getEnv()` を呼ばずに固定 fixture 返却（Workers 経路には未到達）|

#### 設定可能なパラメータ

| 名前                       | 種類    | 必須 | 投入先                                  |
| -------------------------- | ------- | ---- | --------------------------------------- |
| `INTERNAL_API_BASE_URL`    | var     | ✅   | `apps/web/wrangler.toml` `[env.*.vars]` |
| `INTERNAL_AUTH_SECRET`     | secret  | ⚠ optional（local では不要、stg/prod では必須） | Cloudflare Secret（`scripts/cf.sh secret put`） |

## Task 12-2: システム仕様書更新

### Step 1-A: タスク完了記録

- `outputs/phase-12/system-spec-update-summary.md` を作成
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory へ同一 wave で同期

### Step 1-B: 実装状況テーブル更新

本タスクは既存 API surface を変更しない runtime bugfix のため、実装状況テーブルの既存機能 status は変更しない。workflow ledger では `implemented_local_runtime_pending` として登録する。

### Step 1-C: 関連タスクテーブル更新

関連 workflow は #849 admin dashboard runtime smoke。commit / push / PR / staging deploy は user-gated のため、Phase 13 承認後に PR 文脈で接続する。

### Step 2: システム仕様更新

- `apps/web/src/lib/env.ts` の `EnvSchema` に `INTERNAL_AUTH_SECRET` optional を追加。
- 既存 API endpoint surface に変更なし。manual specs の public/API contract 更新は不要。

## Task 12-3: documentation-changelog.md

`outputs/phase-12/documentation-changelog.md` を作成し、Step 1-A / 1-B / 1-C / Step 2 の各結果を個別に明記。

## Task 12-4: 未タスク検出（0 件でも必須）

| 候補ID                                                | 検出元              | 状態  |
| ----------------------------------------------------- | ------------------- | ----- |
| 候補 | 判定 | 理由 |
| --- | --- | --- |
| `auth-env-via-getenv-migration` | 新規起票しない | `auth.ts` は既存 `getCloudflareContext().env` / request header injection を含む認証境界であり、本タスクの直接原因外 |
| `admin-runtime-sentry-alert-policy` | 新規起票しない | 運用改善だが admin render error の修正条件ではなく、既存 Sentry 運用の範囲で扱う |

`outputs/phase-12/unassigned-task-detection.md` に詳細を記録。今回サイクルで解消すべき直接原因は 0 件残し。

## Task 12-5: skill-feedback-report.md

`outputs/phase-12/skill-feedback-report.md` を作成し、今回タスクで気づいた skill 改善余地を routing する。既存 task-specification-creator / aiworkflow-requirements で吸収済みのため、owning skill への追加変更は no-op とする。

## Task 12-6: phase12 compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md` を作成し、Task 12-1 〜 12-5 の成果物と Phase 11 manual-test-result の存在を root evidence として残す。

## Phase 12 漏れ防止チェック

- [x] Step 1-C 実行
- [x] documentation-changelog.md に Step 全件記載
- [x] `unassigned-task-detection.md` を 0 件でも出力
- [x] `skill-feedback-report.md` を出力
- [x] `artifacts.json` と `outputs/artifacts.json` parity（implemented_local_runtime_pending / phase13 pending_user_approval）
