# implementation-guide

## Part 1 — 中学生レベルの概念説明

### 例え話

学校の図書室に「貸出カウンター」と「自分の本棚」があるとする。すでに本を借りている人（ログイン済み）が、もう一度「貸出カウンター」に並ぶ意味はないよね。だから、貸出済みの人がカウンターに来たら、係の人が「あなたはもう借りてるから、自分の本棚に行ってね」と案内する。

このタスクはまさにそれ。**「ログイン済みの人が `/login` ページに来たら、自動的に `/profile`（自分のページ）に案内してあげる」**仕組みを作る。

### なぜ必要か

- ログイン済みなのにログイン画面が表示されると、利用者が混乱する。
- 別のページから「もどる」で `/login` に戻ってしまうこともある。それを優しく案内し直す。

### 何をするか

1. `/login` ページが開かれたとき、まず「この人ログインしてる？」をサーバー側で確認する。
2. していたら → 即座に他のページへ移動させる（リダイレクト）。
3. していなければ → 従来通りログイン画面を表示。

### 「安全な next」とは

`?next=/admin/members` のように、リダイレクト先を URL で指定できる仕組み。ただし、悪意のある人が `?next=https://evil.com` のような外部リンクを指定して、利用者を罠サイトに誘導する攻撃（オープンリダイレクト攻撃）がある。それを防ぐため、「内部のページしか許可しない」フィルタ（`safeNext`）を通す。

## Part 2 — 技術詳細

### 型定義

```ts
// apps/web/src/lib/url/safe-next.ts
export function safeNext(raw: unknown): string | null;
```

### 判定ロジック

| 条件               | 結果   |
| ------------------ | ------ |
| `typeof !== "string"` | `null` |
| 長さ 0 or > 256    | `null` |
| `/` で始まらない   | `null` |
| `//` で始まる      | `null` |
| `\` を含む         | `null` |
| `:` を含む         | `null` |
| 上記以外           | `raw` |

### page integration

```tsx
// apps/web/app/login/page.tsx
const session = await getSession();
if (session) {
  const nextRaw = raw["next"];
  const next = safeNext(Array.isArray(nextRaw) ? nextRaw[0] : nextRaw);
  redirect(next ?? "/profile");
}
```

### エラーハンドリング

- `getSession()` は内部例外時 null を返す（fail-closed）。本タスクで try/catch しない。
- `redirect()` は `NEXT_REDIRECT` を throw。try/catch しない（Next.js の制御フロー）。

### エッジケース

| ケース                                    | 振る舞い                                    |
| ----------------------------------------- | ------------------------------------------- |
| `next` 配列で渡る（`["/a","/b"]`）        | 先頭採用 → `safeNext("/a")` 判定            |
| `next` 空文字                             | `safeNext` が `null` → `/profile`            |
| `next` が `/login` 自身                   | `null`（自己ループ防止） |

### 設定可能パラメータ

| 定数        | 値    | 場所                          |
| ----------- | ----- | ----------------------------- |
| `MAX_NEXT_LENGTH` | 256 | `apps/web/src/lib/url/safe-next.ts` |

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。証跡は `outputs/phase-11/manual-test-result.md` を参照。
