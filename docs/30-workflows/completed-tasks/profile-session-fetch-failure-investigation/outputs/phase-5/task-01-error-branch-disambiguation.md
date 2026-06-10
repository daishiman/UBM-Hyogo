# task-01: `/profile` セッション取得失敗エラー分岐の区別表示（root cause 可視化）

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/app/(member)/profile/page.tsx`（編集）・`apps/web/src/components/member/SectionError.tsx`（編集）・`apps/web/src/lib/server-fetch/profile-session-cause.ts`（新規・写像純関数）・テスト 2 ファイルを変更し、現状 410/5xx/FAILED を一律「時間をおいて再読み込み」へ集約して root cause を隠蔽している観測性欠如（H6）を是正するコード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-fetch-failure-investigation` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T01 |
| ブランチ | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| visualEvidence | VISUAL（`/profile` エラーバナーの区別表示。`data-cause` は static UI contract で検証） |
| 想定 PR base | `dev` |
| 並列性 | T02 / T03 と相互非依存（並列実装可） |
| 紐づく AC | AC-3（区別分岐・401/404 回帰なし）/ AC-7（spec で固定）/ H6 是正 |

## 背景

`/profile` Server Component は `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` で `/me` を取得する（`page.tsx:38-50`）。現状のエラー分岐は **2 つだけ**:

- `meResult.error.code === "MEMBER_SESSION_404"` → 「アカウント情報を確認できませんでした。再ログインしてください。」+ 再ログイン CTA（`page.tsx:53-63`）。
- それ以外（**410 / 5xx / transport 失敗 = `MEMBER_SESSION_FAILED`**）→ 「時間をおいて再読み込みしてください。」+ 再読み込み（`page.tsx:66-74`）。**← 画像の症状**。

`safe-fetch.ts` の `normalizeError` は `code: status ? \`${codePrefix}_${status}\` : \`${codePrefix}_FAILED\`` を生成する。したがってデフォルト分岐には `MEMBER_SESSION_410` / `MEMBER_SESSION_500`〜`599` / `MEMBER_SESSION_FAILED` が **区別されずに** 落ちており、開発者が画面・DOM から root cause（H3 410 / H4 5xx / H5 transport）を判別できない。これが診断不能の主因（H6）。401 は `AuthRequiredError` rethrow で `/login` へ redirect されるため到達しない（SSOT §2）。

## 目的

デフォルト分岐を **`MEMBER_SESSION_410`（H3）/ 5xx 族（`MEMBER_SESSION_500`〜`599`、H4）/ `MEMBER_SESSION_FAILED`（H5 transport）** で区別し、ユーザー向けには安全側の文言（技術文字列を露出しない）を維持しつつ、開発者向けに **原因コードを `data-cause` 属性で DOM に可視化** する。404→再ログイン CTA・401→redirect の既存挙動は **回帰なし**。区別ロジックは Phase 8 で集約する写像純関数 `profile-session-cause.ts` に閉じ、`page.tsx` には分岐の散在を残さない。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/lib/server-fetch/profile-session-cause.ts` | 新規 | error code → `{ cause, detail }` の写像純関数 `resolveProfileSessionCause(code)`。表示文言（安全側）と `data-cause` 値（開発者向け原因コード）の単一 SSOT |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | デフォルト分岐（現 66-74）を `resolveProfileSessionCause` 経由に置換し `SectionError` へ `cause` を渡す。404 分岐（53-63）・401 redirect（46-47）・以降のプロフィール描画は無変更 |
| `apps/web/src/components/member/SectionError.tsx` | 編集 | optional prop `cause?: string` を追加し、指定時のみ `data-cause={cause}` を root 要素へ出力。既存 props（title/detail/retryHref/actionHref/actionLabel/className）と文言・描画は無変更 |
| `apps/web/app/(member)/profile/page.spec.tsx` | 編集（テスト） | 410 / 5xx 族 / FAILED 各 status の区別ケースを追加。既存 404 / 401 / 503 / notFound ケースは回帰 guard として保持 |
| `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 新規（テスト） | `cause` prop の `data-cause` 描画・未指定時の後方互換テスト |
| `apps/web/src/lib/server-fetch/__tests__/profile-session-cause.spec.ts` | 新規（テスト） | 写像純関数の網羅テスト（410/5xx/FAILED/その他） |

それ以外のファイルは無編集。`apps/api`・D1 schema・`/me` shape は不変。

## 2. 主要な関数・型・モジュールのシグネチャまたは構造（CONST_005 必須）

### 2.1 写像純関数（新規 `profile-session-cause.ts`）

```ts
// apps/web/src/lib/server-fetch/profile-session-cause.ts
// /profile の /me 取得失敗 error code を「開発者向け原因コード(cause)」と
// 「ユーザー向け安全文言(detail)」へ写像する純関数。副作用なし・I/O なし。
// SSOT §2 仮説 H3(410)/H4(5xx)/H5(transport=FAILED) に対応。

export type ProfileSessionCause =
  | "deleted" //  MEMBER_SESSION_410 -> H3: member_status.is_deleted=1
  | "server" //   MEMBER_SESSION_5xx -> H4: session-resolver / D1 / handler 例外
  | "transport" //MEMBER_SESSION_FAILED -> H5: service-binding 未応答 / 旧 bundle / network
  | "unknown"; // 上記以外（MEMBER_SESSION_UNKNOWN 等）

export interface ProfileSessionCauseView {
  /** DOM の data-cause 属性に出す開発者向け原因コード（技術文字列を表に出すのは属性のみ） */
  readonly cause: ProfileSessionCause;
  /** ユーザー向けの安全な detail 文言（原因の技術詳細を含まない） */
  readonly detail: string;
}

/** 5xx 判定: code 末尾の 3 桁が 500..599 か */
const FIVE_XX = /_(?:5\d\d)$/;

export function resolveProfileSessionCause(code: string): ProfileSessionCauseView {
  if (code === "MEMBER_SESSION_410") {
    return {
      cause: "deleted",
      detail: "このアカウントは現在ご利用いただけません。サポートまでお問い合わせください。",
    };
  }
  if (FIVE_XX.test(code)) {
    return {
      cause: "server",
      detail: "ただいまサーバーが混み合っています。時間をおいて再読み込みしてください。",
    };
  }
  if (code === "MEMBER_SESSION_FAILED") {
    return {
      cause: "transport",
      detail: "通信に失敗しました。時間をおいて再読み込みしてください。",
    };
  }
  return {
    cause: "unknown",
    detail: "時間をおいて再読み込みしてください。",
  };
}
```

> 文言は安全側（技術詳細を含まない）。ユーザー向け露出は `detail` のみ。原因の技術コード（`deleted`/`server`/`transport`）は `data-cause` 属性にのみ出し、可視テキストには出さない（AC-3 / 不変条件「技術文字列をユーザーに露出しない」）。

### 2.2 `SectionError` への optional prop 追加

```ts
// apps/web/src/components/member/SectionError.tsx
export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  cause?: string; // 追加: 指定時のみ root に data-cause として出力（開発者向け可視化）
}
```

root 要素へ `data-cause={cause}`（`cause` 未指定時は属性を出さない）を追加するのみ。既存の `data-role="title"` / `data-role="detail"` / CTA / retry 描画は無変更（後方互換）。

### 2.3 `page.tsx` デフォルト分岐の Before → After

**Before（現 66-74 行）:**

```tsx
return (
  <main data-route="member" data-section-rhythm="comfortable">
    <SectionError
      title="セッション情報を取得できませんでした"
      detail="時間をおいて再読み込みしてください。"
      retryHref="/profile"
    />
  </main>
);
```

**After:**

```tsx
const { cause, detail } = resolveProfileSessionCause(meResult.error.code);
return (
  <main data-route="member" data-section-rhythm="comfortable">
    <SectionError
      title="セッション情報を取得できませんでした"
      detail={detail}
      retryHref="/profile"
      cause={cause}
    />
  </main>
);
```

import 追加（既存 `safeServerFetch` import の近傍）:

```tsx
import { resolveProfileSessionCause } from "@/lib/server-fetch/profile-session-cause";
```

> 404 分岐（53-63）・401 redirect（46-47）・`meResult.ok` 以降のプロフィール描画は **一切変更しない**。`MEMBER_SESSION_404` は引き続き `resolveProfileSessionCause` を通さず再ログイン CTA 分岐で処理される。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | `meResult.error.code: string`（`safe-fetch.ts` が生成する `MEMBER_SESSION_<status>` / `MEMBER_SESSION_FAILED` / `MEMBER_SESSION_UNKNOWN`） |
| 出力（純関数） | `{ cause: ProfileSessionCause, detail: string }`（安全文言 + 原因コード） |
| 出力（UI） | デフォルト分岐の `SectionError` に `detail`（安全文言）と `data-cause`（原因コード）を出力。可視テキストには技術文字列を出さない |
| 副作用 | `resolveProfileSessionCause` は副作用なし（純関数）。`page.tsx` は server-side レンダリングのみ。D1・fetch・外部状態を触らない |
| 非露出 | memberId は本タスクの DOM 出力に含めない（不変条件 #11）。`data-cause` は status 由来の分類値のみで、member 識別子・生 error message を含まない |

## 4. 編集差分（unified diff・抜粋）

```diff
--- /dev/null
+++ b/apps/web/src/lib/server-fetch/profile-session-cause.ts
@@
+export type ProfileSessionCause = "deleted" | "server" | "transport" | "unknown";
+export interface ProfileSessionCauseView {
+  readonly cause: ProfileSessionCause;
+  readonly detail: string;
+}
+const FIVE_XX = /_(?:5\d\d)$/;
+export function resolveProfileSessionCause(code: string): ProfileSessionCauseView {
+  if (code === "MEMBER_SESSION_410") {
+    return { cause: "deleted", detail: "このアカウントは現在ご利用いただけません。サポートまでお問い合わせください。" };
+  }
+  if (FIVE_XX.test(code)) {
+    return { cause: "server", detail: "ただいまサーバーが混み合っています。時間をおいて再読み込みしてください。" };
+  }
+  if (code === "MEMBER_SESSION_FAILED") {
+    return { cause: "transport", detail: "通信に失敗しました。時間をおいて再読み込みしてください。" };
+  }
+  return { cause: "unknown", detail: "時間をおいて再読み込みしてください。" };
+}
```

```diff
--- a/apps/web/src/components/member/SectionError.tsx
+++ b/apps/web/src/components/member/SectionError.tsx
@@
 export interface SectionErrorProps {
   title?: string;
   detail?: string;
   retryHref?: string;
   actionHref?: string;
   actionLabel?: string;
   className?: string;
+  cause?: string;
 }
@@
 export function SectionError({
   title = "読み込みに失敗しました",
   detail = "時間をおいて再読み込みしてください。",
   retryHref,
   actionHref,
   actionLabel,
   className,
+  cause,
 }: SectionErrorProps) {
   return (
     <div
       role="alert"
       aria-live="polite"
       data-component="section-error"
       data-variant="member"
+      data-cause={cause}
       className={cn("section-error section-error--member", className)}
     >
```

```diff
--- a/apps/web/app/(member)/profile/page.tsx
+++ b/apps/web/app/(member)/profile/page.tsx
@@
 import { safeServerFetch } from "@/lib/server-fetch/safe-fetch";
+import { resolveProfileSessionCause } from "@/lib/server-fetch/profile-session-cause";
@@
-    return (
-      <main data-route="member" data-section-rhythm="comfortable">
-        <SectionError
-          title="セッション情報を取得できませんでした"
-          detail="時間をおいて再読み込みしてください。"
-          retryHref="/profile"
-        />
-      </main>
-    );
+    const { cause, detail } = resolveProfileSessionCause(meResult.error.code);
+    return (
+      <main data-route="member" data-section-rhythm="comfortable">
+        <SectionError
+          title="セッション情報を取得できませんでした"
+          detail={detail}
+          retryHref="/profile"
+          cause={cause}
+        />
+      </main>
+    );
```

> `cause={undefined}` の場合 React は `data-cause` 属性を出力しないため、`cause` 未指定の既存 `SectionError` 呼び出し（profile 描画失敗分岐の 103-107 行等）は属性が増えず後方互換。

## 5. テスト方針（CONST_005 必須）

新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。既存 `page.spec.tsx` の `vi.hoisted` モック（`FetchAuthedError(status, bodyText)` が `fetchAuthed failed: ${status}` を message に持つ）を踏襲する。`safe-fetch.ts` は `FetchAuthedError.status` を読むため `MEMBER_SESSION_<status>` が生成される。

### 5.1 `profile-session-cause.spec.ts`（純関数・新規）

| TC-ID | 入力 code | 期待 cause | 期待 detail（安全文言） |
| --- | --- | --- | --- |
| TC-T01-C1 | `MEMBER_SESSION_410` | `"deleted"` | アカウント利用不可文言（再読み込みを促さない） |
| TC-T01-C2 | `MEMBER_SESSION_500` | `"server"` | サーバー混雑文言 |
| TC-T01-C3 | `MEMBER_SESSION_503` | `"server"` | サーバー混雑文言（5xx 全域） |
| TC-T01-C4 | `MEMBER_SESSION_FAILED` | `"transport"` | 通信失敗文言 |
| TC-T01-C5 | `MEMBER_SESSION_UNKNOWN` | `"unknown"` | 既定の再読み込み文言 |
| TC-T01-C6 | `MEMBER_SESSION_404` | `"unknown"` | 404 はデフォルト分岐に来ない前提だが、写像は安全側 `unknown` を返す（防御） |
| TC-T01-C7 | `MEMBER_SESSION_400` | `"unknown"` | 4xx（非410・非404）も既定文言（5xx と区別） |

### 5.2 `page.spec.tsx`（区別分岐・既存に追加）

| TC-ID | `/me` 結果 | 期待描画 | 検証観点 |
| --- | --- | --- | --- |
| TC-T01-P1 | `FetchAuthedError(410, "deleted")` | `alert` に「セッション情報を取得できませんでした」+ 利用不可文言。root に `data-cause="deleted"`。生 `fetchAuthed failed: 410` が DOM に**現れない** | H3 410 区別 |
| TC-T01-P2 | `FetchAuthedError(503, "down")` | `data-cause="server"`。サーバー混雑文言。技術文字列が現れない | H4 5xx 区別 |
| TC-T01-P3 | `new Error("transport failed")`（status 無 → `_FAILED`） | `data-cause="transport"`。通信失敗文言。技術文字列が現れない | H5 transport 区別 |
| TC-T01-P4（回帰） | `FetchAuthedError(404, "missing")` | 「再ログインしてください。」+ `actionLabel="再ログイン"` の CTA（href `/login?redirect=/profile`）。`data-cause` は付かない | AC-3 回帰なし |
| TC-T01-P5（回帰） | `AuthRequiredError` | `redirect("/login?redirect=/profile")` が呼ばれ `SectionError` を描画しない | AC-3 401 回帰なし |
| TC-T01-P6（回帰） | `/me` 200 → `/me/profile` 200 | 正常系描画（`profile-authenticated-root`） | 正常系回帰なし |

### 5.3 `SectionError.spec.tsx`（新規）

| TC-ID | props | 期待描画 | 検証観点 |
| --- | --- | --- | --- |
| TC-T01-S1 | `cause="server"` | root に `data-cause="server"` 属性を出力 | 原因コード可視化 |
| TC-T01-S2 | `cause` 未指定 | root に `data-cause` 属性が**出ない**（既存呼び出し後方互換） | 後方互換 |
| TC-T01-S3 | `cause` 指定でも可視テキストに技術文字列を出さない | `getByRole("alert").textContent` に `"server"` 等の cause 値を含まない | 露出防止 |

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
mise exec -- pnpm install

# 3. 型 / lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4. 本タスクのテスト
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "src/lib/server-fetch/__tests__/profile-session-cause.spec.ts" \
  "app/(member)/profile/page.spec.tsx" \
  "src/components/member/__tests__/SectionError.spec.tsx"

# 5. design-token gate（HEX 直書きが無いこと / OKLch 正本）
mise exec -- pnpm verify:design-tokens || true
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T01-1 | `profile-session-cause.ts` が新規追加され `resolveProfileSessionCause` を export | `git diff --name-only` |
| DoD-T01-2 | `page.tsx` のデフォルト分岐が 410 / 5xx 族 / FAILED を区別し `data-cause` を渡す | `git diff page.tsx` |
| DoD-T01-3 | `SectionError` に optional `cause` prop が追加され `cause` 未指定で `data-cause` が出ない | TC-T01-S2 |
| DoD-T01-4 | TC-T01-C1〜C7 / P1〜P6 / S1〜S3 が PASS | §6 手順 4 |
| DoD-T01-5 | 404 再ログイン CTA・401 redirect が回帰なし | TC-T01-P4 / P5 |
| DoD-T01-6 | ユーザー画面に生 error message / cause の技術文字列が露出しない | TC-T01-P1〜P3 / S3 |
| DoD-T01-7 | `typecheck` / `lint` が exit 0、HEX 直書きを増やさない（新規 primitive 無し） | §6 手順 3 / 5 |
| DoD-T01-8 | `/me` レスポンス shape・path・status 体系・D1 schema・`apps/api` を変更していない | `git diff apps/api` が空 |

## 8. ロールバック手順

本タスクは新規 1 ファイル + 既存 2 ファイルの最小追加（`page.tsx` 分岐置換 + `SectionError` 1 prop）で、既存挙動への破壊的変更が無い。問題が出た場合:

```bash
git checkout -- "apps/web/app/(member)/profile/page.tsx" \
                "apps/web/src/components/member/SectionError.tsx"
git rm apps/web/src/lib/server-fetch/profile-session-cause.ts \
       apps/web/src/components/member/__tests__/SectionError.spec.tsx \
       apps/web/src/lib/server-fetch/__tests__/profile-session-cause.spec.ts
git checkout -- "apps/web/app/(member)/profile/page.spec.tsx"
```

revert 後はデフォルト分岐が従来の「時間をおいて再読み込み」一律集約（修正前 = H6 の状態）に戻るのみで、404 CTA・401 redirect・正常系は元から無変更。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送りは **無し**。本タスクのスコープ（区別表示 + `data-cause` 可視化）は本サイクルで完結する。区別後に判明する本格修正（410 復帰フロー / 5xx 根治 / transport 運用是正 / 管理者 `/profile` 専用 UX）は **真因が staging 実機調査（Phase 11）で確定するまで方針を決められない** ため Phase 12 で未タスク化する（CONST_007 例外①・SSOT §3 OUT）。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。T02 / T03 と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
