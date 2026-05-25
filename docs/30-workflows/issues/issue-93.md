# [#93] [UT-32] int-test-skill への Workers crypto mock パターン追加

## 概要

`feat/wt-7`（task-01b: zod view models + Google Forms API client）の実装で確立した Cloudflare Workers 環境における `crypto.subtle.sign()` の vitest mock パターンを `.claude/skills/int-test-skill/references/patterns.md` に追記する。

## 目的

同種タスクを担当するエージェント・開発者が同じ苦戦を繰り返さないようにするため、以下の2パターンを共有知識化する。

1. **signer DI（dependency injection）パターン**: `crypto.subtle.sign()` を直接呼ぶのではなく、`JwtSigner` インターフェースを設けて test 時は `vi.fn()` を注入できるように設計する
2. **fetchImpl DI パターン**: Google API の HTTP 応答は `fetch` を DI 化して vitest の `vi.fn()` でモックし、MSW を使わずにテストを完結させる

## スコープ

### 含む

- `.claude/skills/int-test-skill/references/patterns.md` への新セクション追記
  - Workers / Cloudflare 環境の `crypto.subtle` mock パターン（`vi.stubGlobal` は不要、DI で代替）
  - `JwtSigner` インターフェースによる signer DI パターン（実装例コードスニペット付き）
  - `fetchImpl` DI による Google API HTTP モックパターン
  - `vi.fn().mockResolvedValue()` を使った JWT 署名の決定論的テストパターン
  - 失敗パターンとして「`vi.stubGlobal('crypto', ...)` を直接使うと環境依存が増える理由」

### 含まない

- `.claude/skills/int-test-skill/SKILL.md` 本体の改訂（パターン集への追記のみ）
- `packages/integrations/google` の実装コード変更
- MSW（mock service worker）を使う別パターンの導入

## 苦戦箇所・知見

### crypto.subtle.sign() のテスト問題

- **事象**: Service Account JWT 署名（Google OAuth 認証）を vitest でテストする際、vitest（Node.js 環境）では `crypto.subtle.sign()` の呼び出しが実際の PEM キー解析に依存し、テスト用の偽キーでは失敗する
- **当初のアプローチと問題**: `vi.stubGlobal('crypto', { subtle: { sign: vi.fn() } })` でグローバル mock を試みると、`crypto` オブジェクト全体を置き換えるため他の crypto API（`randomUUID` など）も壊れる副作用が発生する
- **採用した解決策**: `JwtSigner` インターフェースを設計し、DI する

### 実装例

```typescript
// JwtSigner インターフェース
export interface JwtSigner {
  sign(
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    privateKey: string,
  ): Promise<string>;
}

// テスト時の注入
const sign = vi.fn().mockResolvedValue("signed.jwt.value");
const source = createTokenSource(env, {
  fetchImpl,
  signer: { sign },
  now: () => 1_700_000_000,
});
```

## 完了条件

- [ ] `patterns.md` の「成功パターン」セクションに「JwtSigner DI による Workers crypto mock 回避パターン」エントリが追加されている
- [ ] 上記エントリに実装例コードスニペット（`JwtSigner` インターフェース定義と `auth.test.ts` での注入例）が含まれている
- [ ] 「fetchImpl DI による Google API HTTP モックパターン」エントリが追加されており、URL `includes()` 分岐パターンの説明が含まれている
- [ ] 「失敗パターン」セクションに `vi.stubGlobal('crypto', ...)` が副作用を起こす理由が追記されている
- [ ] 追記後の `patterns.md` が既存エントリと同一フォーマット（発見日フィールド付き）になっている
- [ ] 新規パターンを参照した場合に同種タスクで `auth.ts` と `auth.test.ts` を最初のインプットとして読めば再現できる粒度で記述されている

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-32 (int-test-workers-crypto) |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 組み込み先 | `.claude/skills/int-test-skill/` |

## 参照資料

- `.claude/skills/int-test-skill/references/patterns.md`
- `packages/integrations/google/src/forms/auth.ts`
- `packages/integrations/google/src/forms/auth.test.ts`
- `packages/integrations/google/src/forms/client.test.ts`
