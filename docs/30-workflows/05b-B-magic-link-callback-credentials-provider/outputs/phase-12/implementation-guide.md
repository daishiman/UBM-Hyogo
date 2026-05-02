# Phase 12 Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

日常の例えとして、メールで届いたログイン用リンクは、学校の受付で渡される一日だけ使える入場券に似ています。入場券を持って受付に行っても、受付の人が確認して名札を渡してくれなければ校舎には入れません。

05b では「入場券が本物かを確認する係」はできていました。05b-B では、その確認結果を使って「この人はログイン済みです」という名札を渡す受付係を実装しました。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| 05b-B workflow | 受付係を作るための手順書 |
| Phase 12成果物 | 仕様と証跡の置き場所を示す一覧 |
| 正本索引の導線 | 迷子にならないための案内板 |

### 何をするか

| すること | 簡単な説明 |
| --- | --- |
| メールのリンクを受け取る | `/api/auth/callback/email` で token と email を読む |
| 入場券を確認する | 既存の Magic Link verify API に問い合わせる |
| 名札を渡す | 成功したときだけ session cookie を作る |
| 失敗時に戻す | 期限切れや使用済みなら login 画面へ戻す |

### 専門用語セルフチェック

| 専門用語 | 日常語の言い換え |
| --- | --- |
| Magic Link | メールで届く一回用の入場券 |
| callback route | 入場券を持って行く受付 |
| Credentials Provider | 入場券を確認して名札を渡す係 |
| session cookie | ログイン済みを示す名札 |
| verify API | 入場券が本物か調べる係 |

## Part 2: 技術者向け実装ガイド

### Interface

```ts
type MagicLinkCallbackQuery = {
  token: string;
  email: string;
};

type MagicLinkVerifyFailure =
  | "missing_token"
  | "missing_email"
  | "expired"
  | "already_used"
  | "invalid_link"
  | "resolve_failed"
  | "temporary_failure";
```

### APIシグネチャ（実装版）

```ts
// apps/web/app/api/auth/callback/email/route.ts
export async function GET(req: NextRequest): Promise<Response>;
export async function POST(): Promise<Response>; // 405

// apps/web/src/lib/auth/verify-magic-link.ts
export const verifyMagicLink: (input: VerifyMagicLinkInput) => Promise<VerifyMagicLinkResult>;
export const mapVerifyReasonToLoginError: (reason: VerifyFailureReason) => string;

// apps/web/src/lib/auth.ts (CredentialsProvider authorize)
async authorize(credentials: { verifiedUser: string }): Promise<{
  id: string; email: string; memberId: string; isAdmin: boolean;
} | null>;
```

### API / Route Contract

| Route | Method | Responsibility |
| --- | --- | --- |
| `/api/auth/callback/email?token=&email=` | GET | query validation, credentials sign-in, redirect |
| `/api/auth/[...nextauth]` | GET/POST | Auth.js handler |
| `/auth/magic-link/verify` | POST | apps/api side token verification |

### 使用例（実装版）

```ts
// callback route 内: verify は 1 回のみ。検証済み user を Credentials provider に渡す。
const result = await verifyMagicLink({ token, email });
if (!result.ok) return Response.redirect(loginUrl(req, mapVerifyReasonToLoginError(result.reason)), 303);
return await signIn("magic-link", {
  verifiedUser: JSON.stringify(result.user),
  redirect: true,
  redirectTo: "/",
});
```

### エラーハンドリング

Success のみ session cookie を作成する。missing query、expired、already_used、not_found、resolve_failed、API failure は fail closed とし、`/login?error=<code>` へ redirect する。

### エッジケース

- token または email がない場合は verify API を呼ばない。
- verify API が失敗した場合は session を作らない。
- 使用済みや期限切れの token は login error に戻す。

### 設定項目と定数一覧

| Name | Value / Source |
| --- | --- |
| callback path | `/api/auth/callback/email` |
| session strategy | JWT |
| success redirect | safe default or validated redirect |
| forbidden boundary | apps/web D1 direct access |

### テスト構成

| Test | Purpose |
| --- | --- |
| Credentials unit test | success / failure reason を固定 |
| Callback route test | redirect と cookie 境界を固定 |
| Static boundary check | apps/web D1 direct access 0件を確認 |

### Evidence（実測）

| ファイル | 内容 | 結果 |
| --- | --- | --- |
| `outputs/phase-11/typecheck.log` | apps/web tsc | exit=0 |
| `outputs/phase-11/test.log` | vitest 26 ケース（verify-magic-link 15 + route 11） | 98 passed (workspace 全体) |
| `outputs/phase-11/boundary-check.log` | `node scripts/lint-boundaries.mjs` | exit=0 |
| `outputs/phase-11/callback-smoke.log` | 手動 curl smoke | 自動 route test で代替済（後続 09a-A staging smoke へ委譲） |

### 変更ファイル一覧

| Path | 種類 |
| --- | --- |
| `apps/web/src/lib/auth.ts` | CredentialsProvider 追加、signIn callback 拡張 |
| `apps/web/src/lib/auth/verify-magic-link.ts` | 新設（API worker fetch helper） |
| `apps/web/src/lib/auth/verify-magic-link.test.ts` | 新設（unit test 15 ケース） |
| `apps/web/app/api/auth/callback/email/route.ts` | 新設（GET callback handler） |
| `apps/web/app/api/auth/callback/email/route.test.ts` | 新設（route contract test 11 ケース） |
