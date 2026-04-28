# Implementation Guide: Zod View Models & Google Forms API Client

タスク: `01b-parallel-zod-view-models-and-google-forms-api-client`
パッケージ: `@ubm-hyogo/shared`, `@ubm-hyogo/integrations-google`

---

## Part 1: 中学生でもわかる説明

### このタスクの困りごと

UBM 兵庫支部会のサイトは、Google フォームに集まった会員の回答を「公開ページ」「会員マイページ」「管理画面」の **3 か所**で表示します。
3 か所がそれぞれ独自に Google フォームから取ってきて、独自のルールで「これは名前」「これはメール」と判断していくと、こうなります。

- 同じ「会員番号」を、ある場所では文字列、別の場所では数値として扱ってしまう
- ある人が新しいフォームに「同意します」と書き換えても、別ページがそれに気づかない
- Google からエラーが返ったとき、3 か所それぞれが別々のリトライ方法を実装する

これでは、画面ごとに見えているデータがズレたり、Google フォームの上限を超えてしまったりします。

### 解決後の状態

このタスクで、次の 2 つの「みんなが使う窓口」を作りました。

1. **共通の型と検証の窓口（`@ubm-hyogo/shared`）**
   - 「会員番号は文字列だけど、メールアドレスとは混ぜない」のように、データの種類を **形（type）** として 1 か所にまとめた
   - フォームの 31 項目それぞれに対して「この値は OK / NG」を判定する **検証ルール（zod スキーマ）** を 1 セット用意した
   - 公開ページ・マイページ・管理画面が表示するための **見せ方（viewmodel）** も 10 種類まとめて定義した

2. **Google フォームに話しかける唯一の窓口（`@ubm-hyogo/integrations-google`）**
   - フォームの「設問の構造」を取りに行く関数 `getForm()`
   - フォームの「回答一覧」を取りに行く関数 `listResponses()`
   - Google にちょっと怒られた（429 や 500 系）ときに、賢く間隔を空けて再試行する仕組み（**バックオフ**）

これで、後で他のメンバーが画面や API を作るときも、「Google フォームへの話しかけ方」と「データの形」を **1 か所** から取り込むだけで済むようになりました。

### 用語の短い説明

- **branded 型**: 「文字列だけど、これは会員 ID 専用」というラベル付き型。普通の文字列やメールアドレスと取り違えると TypeScript がエラーで止めてくれる。
- **zod**: 「このデータはこの形に合っていますか？」を実行時に検証してくれる小さなライブラリ。
- **viewmodel**: 画面で見せるためにデータを整え直した形。
- **バックオフ**: 失敗したらすぐ再挑戦せず、待ち時間を倍々にしながら何回か挑戦する仕組み。
- **Cloudflare Workers**: 私たちのサイトが動いている、Google や AWS のような場所。
- **D1**: Cloudflare 上のデータベース。
- **service account**: Google が用意した「機械用のアカウント」。人間がログインしなくても API を呼べる。

### 何が嬉しいのか（まとめ）

- データの形が **1 つしかない** ので、画面間でズレない
- Google フォームへの話しかけ方が **1 か所** にあるので、上限を超えにくい
- service account の鍵は **Cloudflare の金庫** にしまっていて、コードや GitHub には出てこない

---

## Part 2: 開発者向け詳細

### 0. 配布物（パッケージ）

| パッケージ | エクスポート | 主な責務 |
| --- | --- | --- |
| `@ubm-hyogo/shared` | `branded` / `types/*` / `zod/*` / `utils/consent` | 4 層の型 / 31 項目 zod / 10 viewmodel parser / consent normalize |
| `@ubm-hyogo/integrations-google` | `forms/*`（`createGoogleFormsClient`, `createTokenSource`, `withBackoff`, `mapAnswer`） | Google Forms API 用 SDK ラッパ |

### 1. branded 型（7 種）

```ts
// from "@ubm-hyogo/shared"
import {
  type MemberId, type ResponseId, type ResponseEmail,
  type StableKey, type SessionId, type TagId, type AdminId,
  asMemberId, asResponseId, asResponseEmail,
  asStableKey, asSessionId, asTagId, asAdminId,
} from "@ubm-hyogo/shared";
```

- すべて `Brand<string, "<Tag>">`。型レベルで相互代入不可（`MemberId` を `ResponseId` に渡すと TS error）。
- `as*` factory で安全に作成（実体は string、ランタイム影響 0）。
- Wave 別の利用方針:

  | 後続 Wave | 主に使う branded |
  | --- | --- |
  | 02a | `MemberId`, `ResponseId`, `ResponseEmail` |
  | 02b | `TagId`, `StableKey` |
  | 02c | `AdminId` |
  | 03a | `StableKey`, `FormId`（schema 監視で stableKey 比較） |
  | 03b | `ResponseId`, `ResponseEmail`（responses 同期 + identity 紐付け） |
  | 04a/b/c | viewmodel と branded 全般を Hono ハンドラ response で利用 |
  | 05a/b | `SessionId`, `MemberId`, `AdminId` |
  | 06a/b/c | viewmodel 経由で全 branded を Server Component fetch result として利用 |

### 2. 4 層の型

| 層 | 主な型 | パス |
| --- | --- | --- |
| schema | `FormSchema`, `FormFieldDefinition`, `FormManifest` | `packages/shared/src/types/schema/` |
| response | `MemberResponse`, `FormResponseAnswer` | `packages/shared/src/types/response/` |
| identity | `MemberIdentity`, `MemberStatusRecord`, `DeletedMemberRecord`, `MeetingSession`, `MemberAttendance`, `TagDefinition`, `MemberTag`, `TagAssignmentQueueItem` | `packages/shared/src/types/identity/` |
| viewmodel (10) | `PublicStatsView`, `PublicMemberListView`, `PublicMemberProfile`, `FormPreviewView`, `SessionUser`, `MemberProfile`, `AdminDashboardView`, `AdminMemberListView`, `AdminMemberDetailView`, `AuthGateState` | `packages/shared/src/types/viewmodel/` |

### 3. zod パーサー

```ts
import { FieldByStableKeyZ, VIEWMODEL_PARSER_LIST, ResponseEmailZ } from "@ubm-hyogo/shared";

// 31 項目の field を stableKey 駆動で parse
const result = FieldByStableKeyZ["full_name"].safeParse(rawValue);

// viewmodel 側
import { PublicStatsViewZ } from "@ubm-hyogo/shared/zod/viewmodel";
const view = PublicStatsViewZ.parse(serverFetchResult);
```

| 集約 | 内容 |
| --- | --- |
| `FieldByStableKeyZ` | stableKey → zod schema の Map（31 項目） |
| `VIEWMODEL_PARSER_LIST` | 10 viewmodel parser の集約配列 |
| primitives | `ResponseEmailZ`, `ISO8601Z`, `StableKeyZ`（`packages/shared/src/zod/primitives.ts`） |

#### consent 正規化

```ts
import { normalizeConsent } from "@ubm-hyogo/shared/utils/consent";
const { publicConsent, rulesConsent } = normalizeConsent(rawAnswers);
```

- 旧キー（`agree*` 系）が来ても 2 つの正規キーに正規化する。新規実装は **必ず** `publicConsent` / `rulesConsent` を使う（不変条件 #2）。

### 4. Google Forms API client

```ts
import {
  createGoogleFormsClient,
  createTokenSource,
  withBackoff,
  RetryableError,
} from "@ubm-hyogo/integrations-google";

// service account JWT → access_token → Bearer
const tokenSource = createTokenSource({
  saEmail: env.FORMS_SA_EMAIL,
  saPrivateKey: env.FORMS_SA_KEY,
  scopes: ["https://www.googleapis.com/auth/forms.responses.readonly"],
});

const client = createGoogleFormsClient({ tokenSource });

const form = await client.getForm(formId);                  // FormSchema
const page = await client.listResponses(formId, { pageToken }); // { responses, nextPageToken }
```

#### API シグネチャ

```ts
interface GoogleFormsClient {
  getForm(formId: string): Promise<FormSchema>;
  listResponses(
    formId: string,
    opts?: { pageToken?: string; pageSize?: number },
  ): Promise<{ responses: MemberResponse[]; nextPageToken?: string }>;
}

interface TokenSource {
  getAccessToken(): Promise<string>;
}

function createTokenSource(opts: {
  saEmail: string;
  saPrivateKey: string;
  scopes: string[];
}): TokenSource;

function withBackoff<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number; baseMs?: number },
): Promise<T>;

class RetryableError extends Error {
  readonly status: number; // 408 / 425 / 429 / 500 / 502 / 503 / 504
}
```

#### バックオフの挙動

- `withBackoff` は `RetryableError` だけを再試行対象とする。
- 待ち時間は `baseMs * 2 ** attempt`（exponential、jitter なし）。
- `maxRetries` を超えると最後のエラーを throw する。
- 422 や 4xx の通常エラーは即時 throw（再試行しない）。

#### 使用例（cron からの呼び出し想定 / Wave 3）

```ts
import { createGoogleFormsClient, createTokenSource, withBackoff } from "@ubm-hyogo/integrations-google";
import { FormSchemaZ } from "@ubm-hyogo/shared";

export default {
  scheduled: async (_event, env) => {
    const client = createGoogleFormsClient({
      tokenSource: createTokenSource({
        saEmail: env.FORMS_SA_EMAIL,
        saPrivateKey: env.FORMS_SA_KEY,
        scopes: ["https://www.googleapis.com/auth/forms.body.readonly"],
      }),
    });
    const form = await withBackoff(() => client.getForm(env.FORM_ID));
    const validated = FormSchemaZ.parse(form);
    // ... D1 update
  },
};
```

### 5. エラーハンドリング指針

| エラー種別 | 推奨ハンドリング |
| --- | --- |
| `RetryableError`（408/425/429/5xx） | `withBackoff` 内で自動再試行。上限到達時のみ呼び出し側で観測 |
| `z.ZodError`（schema parse 失敗） | 不正データとしてログし、Wave 3 では skip + Sentry 通知（後続実装） |
| auth エラー（service account JWT 失敗） | secret の問題。即時 throw、ログには **値を含めない** |
| `TypeError`（branded distinct 違反） | 開発時 typecheck で検出されるため runtime 到達想定なし |

### 6. ESLint boundary（不変条件 #5）

`scripts/lint-boundaries.mjs` に `@ubm-hyogo/integrations-google` を追加済み。`apps/web` から `@ubm-hyogo/integrations-google` を直接 import するとボーダリーチェックでエラーになる（D1 binding 同様、API 越しのみ可）。

### 7. 設定可能なパラメータ / 定数

| 名前 | 値 | 場所 |
| --- | --- | --- |
| `formId` | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` | `wrangler.toml [vars]`（公開情報） |
| `FORMS_SA_KEY` | service account 秘密鍵 | Cloudflare Secrets / 1Password |
| `FORMS_SA_EMAIL` | service account email | Cloudflare Secrets / 1Password |
| `withBackoff.maxRetries` | 5（既定） | call site で上書き可 |
| `withBackoff.baseMs` | 200（既定） | call site で上書き可 |
| token cache TTL | 50 分（access_token は 60 分有効） | `createTokenSource` 内 |

### 8. 実行コマンド / 検証コマンド

```bash
# 依存
mise exec -- pnpm install

# 全 workspace の typecheck
mise exec -- pnpm typecheck

# 全 workspace の test
mise exec -- pnpm test

# boundary check
node scripts/lint-boundaries.mjs

# 個別 package
mise exec -- pnpm -F @ubm-hyogo/shared test
mise exec -- pnpm -F @ubm-hyogo/integrations-google test
```

### 9. 検証結果（最新 / `outputs/phase-11/`）

- typecheck: 0 error（5 / 5 workspace project Done）
- vitest: 9 files / 130 tests PASS（実行時間 5.42s）
- eslint-boundary: 0 violation

### 10. Wave 別 import チートシート

| Wave | import 先 | 主な使い方 |
| --- | --- | --- |
| 02a | `@ubm-hyogo/shared` | `MemberIdentity`, `MemberStatusRecord`, `MemberResponse`, `asMemberId/asResponseId/asResponseEmail` |
| 02b | `@ubm-hyogo/shared` | `TagDefinition`, `MemberTag`, `TagAssignmentQueueItem`, `asTagId`, `StableKey` |
| 02c | `@ubm-hyogo/shared` | `AdminDashboardView`, `AdminMemberListView`, `AdminMemberDetailView`, `asAdminId` |
| 03a | `@ubm-hyogo/shared` + `@ubm-hyogo/integrations-google` | `client.getForm()` + `FormSchemaZ.parse` + `StableKey` 比較 |
| 03b | 同上 | `client.listResponses()` + `MemberResponseZ.parse` + `responseEmail` で identity 紐付け |
| 04a/b/c | `@ubm-hyogo/shared` | viewmodel 10 種を Hono ハンドラ response、`*RequestZ` / `*ResponseZ` で boundary validation |
| 05a/b | `@ubm-hyogo/shared` | `SessionUser` を Auth.js session callback で組み立て |
| 06a/b/c | `@ubm-hyogo/shared` | viewmodel 10 種を Server Component fetch result の型として import |

### 11. 既知の制約 / TODO

- `withBackoff` には現状 jitter を入れていない（Wave 3 で観測しながら必要なら追加）。
- Forms client は streaming / partial response 未対応。`pageSize` で paging のみ。
- `mapAnswer` はテキスト系設問を主にカバー。Wave 3 でファイルアップロード設問が追加された場合は mapper を拡張する。

### 12. PR リンクテンプレ

PR description には次を含める:

- このガイド（Part 1 / Part 2）
- `outputs/phase-07/ac-matrix.md` の AC 表
- `outputs/phase-11/{typecheck,vitest,eslint-boundary}.log` のサマリ
- Phase 10 GO 判定（`outputs/phase-10/main.md`）
