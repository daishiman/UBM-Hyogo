# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこの修正が必要か（日常の例え話）

学校の下駄箱を思い浮かべてください。あなたの靴箱には「3年2組 たなか」という名札が貼ってあります。先生が「たなか」と正確に呼べばあなたの靴箱が見つかります。でも先生がうっかり「たなか君の」のように余計な一文字を付けて呼ぶと、名札と一致せず「そんな靴箱はありません」と言われてしまいます。靴箱はちゃんとあるのに、呼び方の最後に余計な「/」が付いただけで「見つからない（404）」になってしまうのが今回の不具合です。

会員のマイページを開き直す（リロードする）と、画面の裏側でサーバーに「あなたの会員情報をください」とお願いします。このお願いの宛先が、本来は `/me` であるべきなのに、末尾に余計なスラッシュが付いた `/me/` になってしまい、サーバーが「そんな宛先はありません（404）」と返してしまっていました。その結果、画面には「セッション情報を取得できませんでした / fetchAuthed failed: 404」という、ふつうの人には意味がわからない文字がそのまま出ていました。

### 何をするか

3 つのことをします。

1. サーバー側で「最後に余計なスラッシュが付いた呼び方が来たら、スラッシュ無しの正しい呼び方に直してあげる」係（trailing-slash middleware）を 1 つ置きます。これで、誰が末尾スラッシュ付きで呼んでも靴箱が見つかるようになります。
2. マイページが裏側でお願いを送るときの宛先の作り方を直します。お願いの中身が空っぽのときに余計なスラッシュを付けないようにします。
3. それでも万が一「見つからない」が起きたとき、ユーザーには意味のわからない文字ではなく「アカウント情報を確認できませんでした。再ログインしてください。」という案内と「再ログイン」ボタンを出します。迷子になったとき「あっちの受付に行ってね」と案内する係を画面に置くイメージです。

この 3 つを 1 回の修正でまとめてやることで、根本（呼び方の食い違い）も、見え方（ユーザーへの案内）も、両方きれいになります。

### 今回作ったもの

- `/me/` のような末尾スラッシュ付き URL を `/me` へ 308 redirect する `trailingSlashRedirect` middleware
- `/api/me` proxy が空 path のとき upstream `/me/` を作らない URL 組み立て
- `/profile` の `MEMBER_SESSION_404` 表示で、固定文言と「再ログイン」リンクを出す `SectionError` の optional action
- API / web の focused Vitest と、再ログイン CTA の static UI contract screenshot

---

## Part 2: 技術者向け実装ガイド

### 背景

`/profile`（Server Component）リロード時に `fetchAuthed<MeSessionResponse>("/me")` が 404 を受信し、`SafeResult.ok === false` 分岐で `SectionError` に生 message（`fetchAuthed failed: 404`）を表示していた。`GET /me` の正常系には 404 分岐が存在せず（`sessionGuard` は 401/410 のみ、ハンドラは 200）、404 は Hono の `app.route("/me", sub)` + `sub.get("/")` で `GET /me/`（末尾スラッシュ）が `notFoundHandler` に落ちることに由来する。加えて web proxy `apps/web/app/api/me/[...path]/route.ts` が空 path 時に `${apiBase()}/me/`（末尾スラッシュ）を生成する派生欠陥を持つ。

### 要約

T01（apps/api: trailing-slash 正規化 middleware + フルアプリ・マウント統合テスト）、T02（apps/web proxy: 空 path 時の `/me/` 生成バグ修正）、T03（apps/web UI: `/profile` の 404 分岐を再ログイン CTA つき明示エラーへ + `SectionError` の CTA props 拡張）の 3 タスクで、根本（ルート解決層）と表示（防御的 UX）を同一サイクルで閉じる。

### 実装ステップ

### APIシグネチャ

- API Worker route: `GET /me` は既存契約を維持する。
- Redirect route behavior: `GET /me/` / `GET /me//` は route mount 前に `308 Location: /me` を返す。
- Web proxy route: `GET|POST /api/me/[...path]` は backend `/me` または `/me/<tail>` へ転送する。
- UI component props: `SectionErrorProps` は `retryHref` に加えて `actionHref` / `actionLabel` を optional に持つ。

#### T01: apps/api trailing-slash 正規化 middleware

- 新規 `apps/api/src/middleware/trailing-slash.ts` を追加。シグネチャ:

```ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

export const trailingSlashRedirect =
  (): MiddlewareHandler<{ Bindings: Env }> =>
  async (c, next) => {
    if (c.req.method === "OPTIONS") return next();
    const url = new URL(c.req.url);
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      const normalized = url.pathname.replace(/\/+$/, "");
      return c.redirect(`${normalized}${url.search}`, 308);
    }
    return next();
  };
```

- `apps/api/src/index.ts` の `app.use("*", securityHeaders())` / `app.use("*", corsFromEnv())` の **後・route mount の前** に `app.use("*", trailingSlashRedirect())` を登録する。`OPTIONS`（CORS preflight）は正規化対象外。
- 308（Permanent Redirect）はメソッド・body を保持する。Worker 間 fetch は redirect を追従するため `/me/` → 308 → `/me` で最終解決する。

#### T02: apps/web proxy 空 path 修正

`apps/web/app/api/me/[...path]/route.ts:42` の `target` 構築を修正する。

```ts
// 現行
const target = `${apiBase()}/me/${path.join("/")}${url.search}`;
// 修正後
const tail = path.join("/");
const target = `${apiBase()}/me${tail ? `/${tail}` : ""}${url.search}`;
```

空 path（`/api/me`, path=[]）→ `${api}/me`。`/api/me/visibility-request` → `${api}/me/visibility-request`（回帰なし）。

#### T03: apps/web UI 防御的 UX + SectionError CTA 拡張

`apps/web/src/components/member/SectionError.tsx` の `SectionErrorProps` に optional props を追加する。

```ts
export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  actionHref?: string;   // 追加
  actionLabel?: string;  // 追加
  className?: string;
}
```

`actionHref` && `actionLabel` のとき `<a href={actionHref} data-role="action">{actionLabel}</a>` を `retry` リンクと並べて描画する。既存の `retryHref` のみの呼び出しは後方互換で不変。新規 primitive・新規コンポーネントは作らない（既存 `section-error` primitive とトークンに従う）。

`apps/web/app/(member)/profile/page.tsx` の `!meResult.ok` 分岐（52-62 行目）で `meResult.error.code` を判定する。

- `MEMBER_SESSION_404`（`codePrefix: "MEMBER_SESSION"` + status 404 から生成）→ `SectionError` に `actionHref="/login?redirect=/profile"` / `actionLabel="再ログイン"` を渡し、`detail` は固定一般文言（生 message を渡さない）。
- それ以外の非 2xx → 既存タイトル + `retryHref="/profile"`、`detail` は固定一般文言（生 message を露出しない）。
- 401（`AuthRequiredError`）は従来どおり `redirect("/login?redirect=/profile")` を維持（AC-3 回帰なし）。

### 使用例

```bash
pnpm exec vitest run apps/api/src/middleware/__tests__/trailing-slash.spec.ts apps/api/src/__tests__/me-route-mount.integration.spec.ts
pnpm exec vitest run 'apps/web/app/api/me/[...path]/route.route.spec.ts' 'apps/web/app/(member)/profile/page.spec.tsx' apps/web/src/components/member/__tests__/SectionError.spec.tsx
```

### エラーハンドリング

- `/me` が 401 の場合は従来どおり `/login?redirect=/profile` へ redirect する。
- `/me` が 404 の場合は raw `fetchAuthed failed: 404` を出さず、固定文言と `actionHref="/login?redirect=/profile"` を出す。
- `/me` の 404 以外の非 2xx は固定文言と `retryHref="/profile"` で再読み込み導線に倒す。
- `/me/profile` の 404 は既存どおり `notFound()` を維持する。

### エッジケース

- `/` は redirect しない。
- `OPTIONS /me/` は redirect せず CORS preflight として処理する。
- `/me/?limit=5` は query を保持して `/me?limit=5` へ redirect する。
- `/me//` は `/me` へ正規化する。
- `/api/me` の空 path は backend `/me` を生成し、`/api/me/visibility-request` は backend `/me/visibility-request` を維持する。

### 設定項目と定数一覧

| 識別子 | 値 / 役割 |
| --- | --- |
| `MEMBER_SESSION_404` | `/me` 404 を再ログイン CTA 表示へ分岐する safe fetch code |
| `actionHref` | `SectionError` の任意 action link URL |
| `actionLabel` | `SectionError` の任意 action link 表示名 |
| `FALLBACK_INTERNAL_API` | web proxy の local API fallback (`http://127.0.0.1:8787`) |
| 308 | trailing-slash 正規化 redirect status |

### テスト構成

| 領域 | ファイル | 観点 |
| --- | --- | --- |
| API middleware | `apps/api/src/middleware/__tests__/trailing-slash.spec.ts` | redirect / query / root / multiple slash / OPTIONS |
| API mount | `apps/api/src/__tests__/me-route-mount.integration.spec.ts` | `GET /me` 401、`GET /me/` 308、root 200 |
| Web proxy | `apps/web/app/api/me/[...path]/route.route.spec.ts` | empty path `/me`、tail path、headers/body passthrough |
| Profile UI | `apps/web/app/(member)/profile/page.spec.tsx` | 404 再ログイン CTA、生 error 非露出、401 redirect |
| SectionError | `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | optional action link、retry 後方互換、HEX 直書きなし |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/middleware/__tests__/trailing-slash.spec.ts src/__tests__/me-route-mount.integration.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run 'app/api/me/[...path]/route.route.spec.ts' 'app/(member)/profile/page.spec.tsx' src/components/member/__tests__/SectionError.spec.tsx
```

### 既知制限

- `/me` のレスポンス shape・path（`/me`, `/me/profile`, `/me/attendance`, `/me/visibility-request`, `/me/delete-request`, `/me/photo`）・D1 schema・Google Form 仕様は一切変更しない（AC-7）。
- staging デプロイ齟齬（旧 bundle 残存）の運用是正自体は本ワークフローのスコープ外。本修正は統合テスト + 末尾スラッシュ許容で再発検知/緩和する。
- Auth.js JWT cookie chunk 対応・JWT サイズ削減は現状再現に直結する証跡が無く別観点（unassigned-task-detection に候補記録のみ・起票しない）。

---

## 視覚証跡

VISUAL_ON_EXECUTION。T03 のエラーバナー変更は static UI contract screenshot を取得済み。staging runtime screenshot は認証必須で user-gated。一次証跡は jsdom render（`page.spec.tsx` / `SectionError.spec.tsx`）と static UI contract screenshot。

| 証跡 | パス | 状況 |
| --- | --- | --- |
| jsdom render（profile） | `apps/web/app/(member)/profile/page.spec.tsx` | 実装サイクルで実行（一次証跡） |
| jsdom render（SectionError） | `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 実装サイクルで実行（一次証跡） |
| static UI contract screenshot | `outputs/phase-11/screenshots/profile-session-404-relogin-static-contract.png` | captured |
| static page screenshot | `outputs/phase-11/screenshots/profile-session-404-relogin-static-page.png` | captured |
| screenshot metadata | `outputs/phase-11/screenshots/phase11-capture-metadata.json` / `outputs/phase-11/screenshot-coverage.md` | captured |
| staging runtime screenshot | `outputs/phase-11/screenshots/profile-session-404-relogin.png` | user-gated（認証必須） |

## 完了条件

- [x] Part 1（中学生レベル・例え話・なぜ→何を）を本文 3 行以上で記述
- [x] Part 2（型/シグネチャ/エラーハンドリング/設定値）を背景・要約・実装ステップ・検証コマンド・既知制限の key section つきで記述
- [x] `## 視覚証跡` で VISUAL_ON_EXECUTION の static screenshot captured と staging runtime user-gated を明記
- [x] 識別子（`MEMBER_SESSION_404`/`actionHref`/`actionLabel`/`fetchAuthed`/`SectionError`/`trailingSlashRedirect`）を実コードと一致

## 成果物

- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料

- `outputs/phase-3/phase-3.md`（修正方針 3.2/3.3/3.4）
- `apps/api/src/index.ts`（middleware 登録順 190-193 行目）
- `apps/web/app/(member)/profile/page.tsx` / `apps/web/src/components/member/SectionError.tsx`
