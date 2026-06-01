# 実装ガイド（Implementation Guide）

## Part 1: やさしい説明（なぜ必要か → 何をするか）

背景（なぜ必要か）:
家のドアに「会員さんはこちら」「管理人さんはこちら」という案内板が貼ってあると想像してください。
この案内板は、訪ねてきた人が「ただのお客さん」「会員さん」「管理人さん」のどれなのかを見分けて、出す案内を切り替えています。
ところが、見分けるための「名札の書き方」を作っている係（ログインの仕組み）と、名札を読んで案内板を出し分ける係（表示の仕組み）は、それぞれ別々に練習しているだけで、二人で答え合わせをしたことがありません。
もし名札の書き方がこっそり変わってしまうと、読む側は「名前が読めない＝ただのお客さん」と勘違いし、会員さんや管理人さんなのに案内が消えてしまいます。両方の係は自分の練習では合格のままなので、誰も気づけません。

要約（何をするか）:
この作業では、二人の係に**一度だけ本番と同じ手順で答え合わせをさせる小さなテスト**を 1 つ追加します。
名札を作る係が実際に作った名札を、読む係にそのまま渡して、「会員さんは会員、管理人さんは管理人、名前が無い人はお客さん」と正しく読めるかを毎回自動でチェックします。
これだけで、名札の書き方が将来こっそり変わっても、その場で気づけるようになります。表示の見た目は何も変えません。

実装ステップ（やさしい版）:
1. 名札を作る本物の係（ログインの仕組み）の出力を取り出す。
2. その出力を、名札を読む係（表示の仕組み）にそのまま渡す。
3. 「会員 / 管理人 / お客さん」の判定が正しいか、自動で答え合わせする小さなテストを書く。

## Part 2: 技術者向けノート

要約:
`getAuthView()` / `resolveAuthView()` が読む `session.user`（`memberId` / `isAdmin`）の shape は、実 auth module
`apps/web/src/lib/auth.ts:174` の `buildAuthConfig().callbacks.session`（token → session.user）が生成する。
両者は現状独立テストのみで、橋渡しの契約テストが無い。本タスクは実 callback 出力を resolver/adapter に連鎖させる
integration spec を 1 ファイル追加し、Auth.js session augmentation の drift をローカル CI で fail させる。

実装ステップ（技術者向け）:
1. `buildAuthConfig()`（export 済）を import し、`callbacks.session({ session, token })` を実呼び出しして本番同等の `session.user` を得る。
2. その `session` を `resolveAuthView(session)`（pure）/ `getAuthView()`（adapter; `getAuth().auth()` を mock して同 session を返す）へ連鎖させる。
3. 解決結果を `AuthView` discriminated union で assert する。

型・シグネチャ（参照のみ・変更なし）:

```ts
// apps/web/src/lib/auth-view/types.ts（既存・不変）
type AuthView =
  | { kind: "guest" }
  | { kind: "member"; profileHref: "/profile" }
  | { kind: "admin"; profileHref: "/profile"; adminHref: "/admin" };

// apps/web/src/lib/auth.ts:174（既存・export 済・不変）
export function buildAuthConfig(/* ... */): { callbacks: { session: (args: { session: Session; token: JWT }) => Session } };
```

契約連鎖の擬似コード:

```ts
// authViewSessionContract.integration.spec.ts（新規・追加対象）
const cfg = buildAuthConfig(/* deps */);
const sessionOut = cfg.callbacks.session({ session: baseSession, token: memberToken });
// 契約: callback 出力の field 名 (memberId / isAdmin) が resolveAuthView の読む field と一致
expect(resolveAuthView(sessionOut)).toEqual({ kind: "member", profileHref: "/profile" });
// adapter 連鎖: getAuth().auth() を sessionOut で mock
expect(await getAuthView()).toEqual({ kind: "member", profileHref: "/profile" });
// fail-closed: memberId 欠落 token → guest
expect(resolveAuthView(cfg.callbacks.session({ session: baseSession, token: noMemberToken }))).toEqual({ kind: "guest" });
```

検証コマンド:

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts \
  apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/lib/auth.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

既知の制限:
- 本テストは Auth.js provider 設定・実 Google OAuth フローは検証しない（session callback の出力 shape 契約に限定）。
- staging authenticated runtime smoke は user-gated でスコープ外。
- workflow_state=`implemented_local_evidence_captured`。上記 focused Vitest / typecheck / lint は本サイクルで実行済み。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショットは不要。
代替証跡として focused Vitest 結果を記録する `../phase-11/manual-test-result.md`（NON_VISUAL 証跡メタ）を参照する。
公開ヘッダーの guest/member/admin 表示自体は親 workflow `public-header-session-aware-auth-view-base` の Phase 11 で取得済みであり、本タスクはその表示が壊れないことを契約テストで補強するものでレンダリング差分を生まない。
