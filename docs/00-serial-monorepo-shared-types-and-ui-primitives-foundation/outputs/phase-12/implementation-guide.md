# implementation-guide.md — Wave 0 完了・後続 Wave への引き渡しガイド

## Part 1: 中学生レベルの説明

### なぜこのタスクが必要だったか

たとえば、**家を建てるときの「基礎工事」**です。

壁や屋根を作る前に、まず地面を固める基礎を作りますよね。それをしないと、後から何人の大工さんが同時に作業しても、建物がガタガタになってしまいます。

このプロジェクトでは、これから24個のタスクを同時並行で進める予定があります。でも、全員が同じ「型の名前」「コンポーネントの名前」「ファイルの場所」を使わないと、コードが衝突してしまいます。

Wave 0 では以下を準備しました：

1. **共通の「型」（データの形）の名前を決めた** — MemberId, ResponseId などの名前を統一したので、誰が書いても同じ名前を使える
2. **ボタンやアバターなどの部品を15種類作った** — 画面を作る人が、全員同じ部品を使えるようになった
3. **「してはいけないこと」を自動でチェックする仕組みを設定した** — データベースへの直接アクセス禁止など

これで Wave 1 から Wave 9 まで、安心して並行開発ができます！

---

## Part 2: 開発者向け技術詳細

### Wave 0 で確立したもの

#### 1. pnpm workspace 構成

```
apps/web   (@ubm-hyogo/web)
apps/api   (@ubm-hyogo/api)
packages/shared               (@ubm-hyogo/shared)
packages/integrations         (@ubm-hyogo/integrations)
packages/integrations/google  (@ubm-hyogo/integrations-google) ← 新規
```

#### 2. 型 4 層 placeholder（packages/shared/src/types/）

```ts
// ids.ts — branded types
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;

// schema/index.ts, response/index.ts, identity/index.ts, viewmodel/index.ts
// → Wave 01b で実装。現在は export {}
```

使用例:

```ts
import type { MemberId, ResponseEmail } from "@ubm-hyogo/shared";

interface MemberContact {
  id: MemberId;
  email: ResponseEmail;
}
```

#### 3. FormsClient interface（packages/integrations/google/）

```ts
export interface FormsClient {
  getForm(formId: string): Promise<unknown>;
  listResponses(formId: string): Promise<unknown[]>;
}
```

Wave 01b で Google Forms API を使った実装に置き換える。

エラー処理:

- Wave 0 の `NotImplementedFormsClient` は呼び出し時に `Error("not implemented - will be replaced in Wave 01b")` を投げる。
- 後続 Wave は API quota、認証失敗、フォーム未存在、空レスポンスを個別に扱う。

エッジケース:

- `formId` が空文字の場合は後続実装で validation error にする。
- `listResponses()` が空配列を返しても正常系として扱う。
- 実フォーム schema は Wave 01b の schema sync で吸収し、Wave 0 では固定列 mapper を置かない。

#### 4. UI Primitives 15 種（apps/web/src/components/ui/）

```
Chip / Avatar / Button / Switch / Segmented / Field / Input /
Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills
```

全て `apps/web/src/components/ui/index.ts` からバレル export 済み。

#### 5. tones.ts（apps/web/src/lib/tones.ts）

```ts
export type ChipTone = "stone" | "warm" | "cool" | "green" | "amber" | "red";
export function zoneTone(zone: string): ChipTone
export function statusTone(status: string): ChipTone
```

#### 6. Hono /healthz エンドポイント

```ts
app.get("/healthz", (c) => c.json({ ok: true }));
app.get("/public/healthz", (c) => c.json({ ok: true, scope: "public" }));
app.get("/me/healthz", (c) => c.json({ ok: true, scope: "me" }));
app.get("/admin/healthz", (c) => c.json({ ok: true, scope: "admin" }));
```

`curl http://localhost:8787/healthz` → `{"ok":true}` 200

Wave 0 では D1 binding、cron trigger、Google service account secret、sync mutation endpoint は導入しない。

#### 7. 検証コマンド

```bash
pnpm install              # AC-1
pnpm -r typecheck         # AC-2
pnpm -r lint              # AC-3
pnpm test                 # AC-4 (30 tests PASS)
```

現在の作業環境が Node 22 の場合、`package.json` の Node 24 engine warning が出る。正式検証は Node 24.x で行う。

### 設定可能パラメータ / 定数

| 対象 | 値 | 所有 |
| --- | --- | --- |
| Node | `24.x` | root `package.json` |
| pnpm | `10.x` | root `package.json` |
| TypeScript | `6.0.3` | root/package configs |
| Web runtime | `@opennextjs/cloudflare` | `apps/web` |
| API runtime | `hono-workers` | `packages/shared/src/index.ts` |
| `ChipTone` | `stone/warm/cool/green/amber/red` | `apps/web/src/lib/tones.ts` |

### Screenshot Handoff

Phase 11 does not store screenshots for Wave 0 because no user-facing primitive gallery exists in this task. The screenshot paths are reserved for Wave 06a/b/c, where these primitives are rendered in actual pages and can be visually verified.

### 後続 Wave への確認事項

| 後続 Wave | 確認項目 |
|---------|---------|
| 01a | `apps/api/wrangler.toml` の `[[d1_databases]]` の database_id を本番 ID で更新 |
| 01b | `packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts` の空 module を実装 |
| 01b | `packages/integrations/google/src/forms-client.ts` の NotImplementedFormsClient を実装 |
| 02a/b/c | `apps/api/src/` に repository 層を追加。apps/web からの直接 import が ESLint で禁止されていることを再確認 |
| 03a/b | forms-client.ts interface の実装 |
| 04a/b/c | Hono に endpoint 追加。/healthz は維持すること |
| 05a/b | Auth.js 設定は `apps/web/app/api/auth/[...nextauth]/route.ts` に配置 |
| 06a/b/c | `apps/web/src/components/ui/` の 15 primitives を再利用。新規 layout/member/admin は別ディレクトリ |
| 07a/b/c | repository を経由、apps/web から D1 直接アクセス禁止 |
| 08a/b | typecheck/lint/test を必ず先に通す |
| 09a/b/c | wrangler.toml の placeholder を本番値に更新 |

### 不変条件の継続適用（後続 Wave 全体）

- **#1**: 型 4 層を破らない。FormResponse 等は必ず packages/shared の型を経由
- **#5**: apps/web から D1 や apps/api への直接 import 禁止
- **#6**: UI primitives に localStorage/sessionStorage を追加しない
- **#8**: Avatar の hue など UI state を localStorage に保存しない
