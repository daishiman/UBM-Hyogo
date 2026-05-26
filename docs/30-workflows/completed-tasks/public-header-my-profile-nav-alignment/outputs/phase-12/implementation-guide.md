# Implementation Guide — public-header-my-profile-nav-alignment

## Part 1 — 中学生レベルの説明

### このタスクで何が変わったの？

家のドアにある「来客用ベル」と「家族用の鍵穴」を想像してみてください。

これまでのウェブサイトの上部メニュー（ヘッダー）は、ログインしている人もしていない人も全員に
同じ「ログイン」ボタンを見せていました。家族なのに毎回「来客用ベル」を押して家に入っている
ような状態でした。

このタスクでは:

1. **「あなたは誰？」を覚えてから上部メニューを描く** ようにしました。
2. ログイン中の人には「マイページ」ボタンを見せて、すぐ自分の情報にいけるようにしました。
3. ログインしていない人には今まで通り「ログイン」ボタンを見せます。

### なんで必要だったの？

設計図（プロトタイプ）には「ログインしている人は最短 1 クリックでマイページに行ける」と
書いてあったのに、実際のサイトには「マイページ」ボタンがどこにもなくて、会員さんが自分の
ページに行けない状態でした。これを直すのが今回のタスクです。

### 何を作ったの？

- **`SessionAwarePublicHeader`** という新しい部品（ファイル 1 つ）。
  これが「あなた誰？」をサーバーに聞いて、結果を上部メニューに渡す係です。
- **`PublicHeaderWithPath`** という新しい部品（ファイル 1 つ）。
  これが「今どのページを見ている？」をブラウザ側で調べ、マイページ表示中なら上部メニューの
  「マイページ」を現在地として知らせます。
- **`PublicHeader`** に「ログイン中なら『マイページ』を表示する」という分岐を追加。
- 公開ページ全体（トップ・メンバー一覧・登録など）の上部メニューを、新しい
  `SessionAwarePublicHeader` に差し替え。

## Part 2 — 開発者向け技術詳細

### 変更ファイル一覧

| 種別   | パス                                                                       |
| ------ | -------------------------------------------------------------------------- |
| modify | `apps/web/src/components/public/PublicHeader.tsx`                          |
| new    | `apps/web/src/components/public/PublicHeaderWithPath.tsx`                  |
| new    | `apps/web/src/components/public/SessionAwarePublicHeader.tsx`              |
| modify | `apps/web/app/(public)/layout.tsx`                                         |
| modify | `apps/web/app/page.tsx`                                                    |
| modify | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`           |
| new    | `apps/web/src/components/public/__tests__/SessionAwarePublicHeader.spec.tsx` |
| modify | `apps/web/app/(public)/layout.spec.tsx`                                    |

### Public API（型定義）

```ts
// PublicHeader.tsx
export interface PublicHeaderCurrentUser {
  readonly memberId: string;
  readonly name?: string;
}

export interface PublicHeaderProps {
  currentPath?: string;
  currentUser?: PublicHeaderCurrentUser | null;
}

export function PublicHeader(props?: PublicHeaderProps): JSX.Element;

// SessionAwarePublicHeader.tsx
export interface PublicHeaderWithPathProps {
  currentUser?: PublicHeaderCurrentUser | null;
}

export function PublicHeaderWithPath(props?: PublicHeaderWithPathProps): JSX.Element;

export type SessionAwarePublicHeaderProps = Omit<PublicHeaderWithPathProps, "currentUser">;
export async function SessionAwarePublicHeader(
  props?: SessionAwarePublicHeaderProps,
): Promise<JSX.Element>;
```

### 振る舞い表

| `currentUser`              | CTA label     | CTA href     | CTA `data-state`    |
| -------------------------- | ------------- | ------------ | ------------------- |
| `null` / `undefined`       | ログイン      | `/login`     | `"anonymous"`       |
| `{ memberId, name? }`      | マイページ    | `/profile`   | `"authenticated"`   |

`currentPath === "/profile"` のとき、右上 CTA の「マイページ」に `aria-current="page"` が付与される。
`PublicHeaderWithPath` は `usePathname()` で取得した実 pathname を `PublicHeader.currentPath` に渡す。

### 使用例

```tsx
// async server component (推奨)
import { SessionAwarePublicHeader } from "@/components/public/SessionAwarePublicHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionAwarePublicHeader />
      <main>{children}</main>
    </>
  );
}

// 直接 props で渡したい場合 (test 等)
<PublicHeader currentUser={{ memberId: "m_xxx", name: "山田" }} currentPath="/profile" />
```

### エラーハンドリング / エッジケース

- `getSession()` が throw した場合、Next.js の `error.tsx`（route segment error boundary）が補足する。
  `SessionAwarePublicHeader` 内で握り潰さない。
- `getSession()` が `null` を返した場合は未ログイン扱い（fail-closed、invariant #11 整合）。
- `session.name` が undefined の場合は `currentUser.name` を omit して prop に渡す
  （`exactOptionalPropertyTypes` 整合）。

### 設定可能なパラメータ

なし（環境変数依存なし）。

### 検証証跡

このタスクはログイン状態に応じて右上 CTA 表示が変わる UI/UX 変更であり、
`visualEvidence = VISUAL_ON_EXECUTION` として扱う。local 証跡は focused Vitest で
`PublicHeader` / `SessionAwarePublicHeader` / `(public)/layout` の semantic・session・a11y 境界を確認済み。
加えて local component screenshot として
`outputs/phase-11/screenshots/public-header-authenticated-component.png` を保存済み。

実ブラウザの authenticated session smoke と screenshot は user-gated runtime evidence として
`outputs/phase-11/manual-smoke-log.md` に手順化済みで、現時点では runtime PASS として数えない。
代替証跡は `outputs/phase-10/phase-10.md`、`outputs/phase-11/phase-11.md`、
`outputs/phase-12/phase12-task-spec-compliance-check.md` を参照。
