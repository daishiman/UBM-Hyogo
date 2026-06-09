> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — 実装ガイド

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本ガイドは 2 部構成です。Part 1 は専門用語を使わず、日常の例え話で「なぜ」と「何を」を説明します。
Part 2 はエンジニア向けに、型定義・関数シグネチャ・削除対象・grep gate を正確に記述します。

---

## Part 1 — やさしい説明（例え話つき）

### たとえ話：同じ家を 2 つの呼び名で呼んでいる状態を、1 つにそろえる

ある一軒の家があるとします。その家の住所は 1 つしかありません。でも、なぜか家族のあいだで
**呼び名が 2 つ**できてしまいました。

- ある人は「**新しい呼び名**」（= `NEXT_PUBLIC_API_BASE_URL`）でその家を呼びます。
- 別の人は「**古い呼び名**」（= `PUBLIC_API_BASE_URL`）で同じ家を呼びます。

どちらも指している家（= サーバーの場所）はまったく同じです。でも呼び名が 2 つあると、こんな困りごとが起きます。

- 引っ越し（住所変更）のとき、**片方の呼び名のメモだけ書き換えて、もう片方を直し忘れる**と、
  「新しい呼び名」と「古い呼び名」が別々の家を指してしまう事故が起きます。
- 新しく入った家族が「ここは呼び名を 2 つ書くのがルールなんだな」と勘違いして、**ほかの家にも
  わざわざ 2 つの呼び名を付け始めてしまう**かもしれません（悪い習慣が広がる）。

そこで、**呼び名を「新しい呼び名」1 つにそろえます**。古い呼び名を使っているメモ（設定ファイルや
プログラム）を全部見つけて、

- アプリ A（apps/web）では、**古い呼び名のメモを消します**。新しい呼び名だけが残ります。
- アプリ B（apps/og）では、その家にもともと「新しい呼び名」のメモがなかったので、**古い呼び名のメモを
  新しい呼び名に書き換えます**（消すと家の場所が分からなくなってしまうため、消さずに名前だけ付け替えます）。

家そのもの（サーバーの場所）はまったく動かしません。呼び名を 1 つに統一するだけです。だから、
**サイトの見た目も動きも一切変わりません**。

### おまけ：使っていない「道具箱」も片付ける

アプリ A には、古い呼び名を読むためだけに作られた小さな道具（`getApiBaseEnv` という関数と `ApiBaseEnv` という型）が
ありました。調べてみると、この道具を**実際に使っている場所が 1 つもありません**（テストの中だけ）。
古い呼び名を消すとこの道具は中身が空っぽになるので、**道具箱ごと片付け（削除）します**。使わない道具を
置いておくと、あとで「これ何だっけ？」と混乱の元になるからです。

### 最後の確認：呼び名がちゃんと 1 つになったか

全部直し終わったら、**「古い呼び名がどこかに残っていないか」を機械で一括検索**します（grep という探し方）。
検索結果が **0 件**なら、呼び名は無事に 1 つへ統一できた、ということです。

---

## Part 2 — 技術仕様

> 実装済み。本節は「何を・どう変えたか」を確定事実として記述する。識別子は SSOT
> （index.md §2 / Phase 1-3）と完全一致させ drift を禁止する。

### 2.1 `apps/web/src/lib/env.ts` — schema / 型 / accessor の旧キー除去

| 対象 | 変更前 | 変更後 |
| --- | --- | --- |
| `EnvSchema`（L7 付近） | `PUBLIC_API_BASE_URL: z.string().url().optional()`（旧キー行） | **行ごと削除**。`NEXT_PUBLIC_API_BASE_URL` の schema は不変 |
| `PublicFetchEnv` 型（L64 付近） | `PUBLIC_API_BASE_URL?: string`（フィールド） | **フィールド削除**。`NEXT_PUBLIC_API_BASE_URL?: string` は残す |
| `ApiBaseEnv` 型（L78 付近） | `interface ApiBaseEnv { ...; PUBLIC_API_BASE_URL?: string; ... }` | **型ごと削除**（D-3） |
| `getApiBaseEnv()`（L168-177 付近） | 旧キー fallback を含む accessor 関数 | **関数ごと削除**（D-3。production consumer 0 件） |
| `getPublicFetchEnv()`（L187-197 付近） | 旧キー fallback 分岐（`... ?? env.PUBLIC_API_BASE_URL` 系） | **旧キー fallback 分岐を削除**。`NEXT_PUBLIC_API_BASE_URL` 単独解決へ |

- `getPublicFetchEnv()` のシグネチャは不変: 戻り値型 `PublicFetchEnv` から `PUBLIC_API_BASE_URL?` フィールドが
  消えることで、consumer 側の旧キー参照が **typecheck で機械検出**される（Phase 2 §5 Step 1→2 の肝）。
- 保持する accessor 名: `getEnv` / `getPublicEnv` / `getAuthEnv` / `getPublicFetchEnv` / `getAdminFetchEnv`（不変）。
- 削除する識別子: `getApiBaseEnv`（関数）/ `ApiBaseEnv`（型）/ `PUBLIC_API_BASE_URL`（schema 行・型フィールド・fallback）。

### 2.2 `apps/web/src/lib/fetch/public.ts` — consumer の旧キー参照除去

| 対象 | 変更前 | 変更後 |
| --- | --- | --- |
| `getBaseUrl()`（L24 付近） | `env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL` | `?? env.PUBLIC_API_BASE_URL` を削除し `env.NEXT_PUBLIC_API_BASE_URL` 単独参照へ |
| `getServiceBinding()`（L48 付近） | 同上の `?? env.PUBLIC_API_BASE_URL` | 同様に削除 |
| コメント（L9/10/13/45/49 付近） | `PUBLIC_API_BASE_URL` 表記 | `NEXT_PUBLIC_API_BASE_URL` 表記へ更新 |

- transport 選択（`resolveServiceBinding` / `selectAndFetch`）の挙動は不変（D-5）。

### 2.3 `apps/og/src/member-source.ts` — rename（削除でなく）

```ts
// OgEnv interface（L7 付近）: 削除でなく rename
export interface OgEnv {
  // ... 他フィールドは不変 ...
  NEXT_PUBLIC_API_BASE_URL?: string;   // 旧: PUBLIC_API_BASE_URL?: string;
}

// fetchViaBaseUrl()（L66 付近）: 参照を rename
const base = env.NEXT_PUBLIC_API_BASE_URL?.trim();   // 旧: env.PUBLIC_API_BASE_URL?.trim()
```

- apps/og は `NEXT_PUBLIC_API_BASE_URL` 対応キーを**持たない単一キー運用**のため、削除すると base URL 解決経路が
  消える。よって **rename**（D-2）。`fetchViaBaseUrl` / `fetchMemberSummary` のシグネチャは不変。
- `NEXT_PUBLIC_` 接頭辞は apps/og（非 Next.js Hono Worker）では単なる env 変数名であり、runtime 挙動に影響しない
  （Phase 2 §7 / D-4）。`OgEnv` フィールド名と `apps/og/wrangler.toml` の `[vars]` キー名を揃える。

### 2.4 config ファイルの旧キー削除 / rename

| ファイル | 旧キー件数 | 操作 |
| --- | --- | --- |
| `apps/web/wrangler.toml` | 3（`[vars]` / `[env.staging.vars]` / `[env.production.vars]`） | 削除 |
| `apps/web/.dev.vars.example` | 1 | 削除 |
| `apps/web/playwright.config.ts` | 1（`'PUBLIC_API_BASE_URL=...'` 行） | 削除 |
| `apps/web/playwright.admin-schema-diff.config.ts` | 1 | 削除 |
| `apps/og/wrangler.toml` | 3（同 3 セクション） | **rename**（`NEXT_PUBLIC_API_BASE_URL`） |

### 2.5 spec 群 11 ファイルの移行

index.md §2.3 を正本とする。方針:

- apps/web の spec: 旧キー seed / assert を削除（`NEXT_PUBLIC_API_BASE_URL` 単一 seed へ）。
  `env.spec.ts` の `getApiBaseEnv` 2 テスト（L252 / L262 付近）は**関数削除に伴い削除**。
- apps/og の spec: `OgEnv` seed / テスト名（`falls back to PUBLIC_API_BASE_URL` 等）を
  `NEXT_PUBLIC_API_BASE_URL` へ rename。transport 選択 / fallback 経路の**テスト意図は保持**（AC-6）。

### 2.6 grep gate / 検証コマンド（後続・実行は user-gated）

リポジトリルートから実行する。

```bash
# AC-7: 旧キー全走査（最終 0 件）— repo 全体スコープ
grep -rn 'PUBLIC_API_BASE_URL' apps/ | grep -v 'NEXT_PUBLIC_API_BASE_URL'

# AC-2: getApiBaseEnv / ApiBaseEnv 参照 0 件（削除後の再確認）
grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/

# AC-8: typecheck / lint / targeted vitest
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/og typecheck
pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/env.spec.ts
pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/fetch/public.spec.ts
pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/member-source.spec.ts
```

期待: AC-7 grep = 0 件、AC-2 grep = 0 件、typecheck 0、lint 0、targeted vitest green
（fetchPublic / SSR / OG の base URL 解決挙動が回帰しない）。

### 2.7 削除順序（型結合を壊さない・Phase 2 §5 再掲）

1. `env.ts`（schema / 型 / accessor 除去）→ `getPublicFetchEnv()` 戻り値型から旧キーが消える
2. `public.ts`（`?? env.PUBLIC_API_BASE_URL` 削除）→ Step 1 で露見した型エラー解消
3. `apps/og`（`OgEnv` + `member-source.ts` + `og/wrangler.toml` を同時 rename）
4. config（wrangler×2 / .dev.vars.example / playwright×2）
5. spec 群 11 本（`getApiBaseEnv` テスト 2 件は削除）
6. AC-7 / AC-2 grep 0 件確認
7. typecheck / lint / targeted vitest

env.ts と public.ts は同一 PR・同一サイクルで直す（片方だけだと型エラー or fallback 消失）。

## 視覚証跡

本タスクは **NON_VISUAL**（env キーの削除 / rename のみで UI / UX / DOM / レイアウトに変更がない）。
base URL 値・解決優先順位・transport 選択を変えないため、画面上の見た目・挙動は完全に不変である。
したがって **Phase 11 スクリーンショットは不要**であり、本ワークフローではスクリーンショットを取得しない。
NON_VISUAL 証跡は AC-7 / AC-2 の grep gate 0 件・typecheck / lint / targeted vitest green（§2.6）で代替する。
