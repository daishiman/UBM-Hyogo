# Phase 8: リファクタリング

## 0. 原則

> FB Feedback RT-03 に従い、変更内容を `対象 / Before / After / 理由` テーブル形式で記録する。

- リファクタは**挙動不変**を原則とする。Phase 4 / Phase 6 のテストが**緑のまま維持される**ことを完了条件とする。
- 振る舞いを変える変更（フィルタ対象の追加・除外条件の変更）はリファクタではなく機能変更として扱い、本フェーズでは行わない。

## 1. リファクタリング内容

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 拡張 prefix の知識集約 | `isExtensionUrl` 内のリテラル列挙と `EXTENSION_DENY_URLS` の RegExp 列挙がそれぞれ拡張スキームを独自に持つ（同じ知識の二重定義） | `EXTENSION_PROTOCOL_PREFIXES` を単一正本とし、`EXTENSION_DENY_URLS` はその正本から導出（prefix → 正規表現に変換）。`isExtensionUrl` も同正本を走査 | DRY。「対応する拡張スキームの集合」という 1 つの知識を 1 箇所に集約し、将来の追加漏れ（片方だけ更新して他方を忘れる）を構造的に防ぐ |
| 関数命名 | （新規実装のため Before なし） | `isExtensionUrl` / `eventHasExtensionFrame` / `filterExtensionNoise` の camelCase | 既存 `capture.ts` の camelCase 関数命名と整合（命名一貫性） |
| ファイル命名 | （新規実装のため Before なし） | `extension-noise-filter.ts` / `extension-noise-filter.spec.ts` の kebab-case | 既存 `apps/web/src/lib/sentry/` の kebab-case ファイル命名・不変条件 #8（`*.spec.ts` のみ）と整合 |
| 定数の readonly 化 | （初稿でミュータブル配列の可能性） | `EXTENSION_PROTOCOL_PREFIXES` を `readonly string[]`（`as const` 由来）で公開 | 共有正本が呼び出し側で改変されない不変性を型で保証 |

## 2. DRY 観点の詳細（拡張 prefix の単一正本化）

```ts
// 単一正本（唯一の真理）
export const EXTENSION_PROTOCOL_PREFIXES = [
  "chrome-extension://",
  "moz-extension://",
  "safari-web-extension://",
  "safari-extension://",
  "safari-extension://",
] as const;

// denyUrls は正本から導出（手書き RegExp 列挙を持たない）
export const EXTENSION_DENY_URLS: RegExp[] = EXTENSION_PROTOCOL_PREFIXES.map(
  (prefix) => new RegExp("^" + escapeForRegExp(prefix), "i"),
);

// isExtensionUrl も同じ正本を走査
export function isExtensionUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return EXTENSION_PROTOCOL_PREFIXES.some((p) => lower.startsWith(p));
}
```

- 拡張スキームの追加は `EXTENSION_PROTOCOL_PREFIXES` への 1 行追記だけで `isExtensionUrl` と `EXTENSION_DENY_URLS` の双方に反映される。
- `EXTENSION_IGNORE_ERRORS`（message 一致用）は prefix とは別軸の知識（観測ノイズ文字列）なので、別定数のまま維持する（過剰集約しない）。

## 3. navigation drift

- **該当なし**。本タスクは UI を持たない pure module + SDK 配線のみ。画面遷移・ナビゲーション要素は存在しないため drift は発生しない。

## 4. 完了条件

| 項目 | 確認方法 | 合格基準 |
|------|----------|----------|
| 挙動不変 | Phase 4 / Phase 6 の focused vitest | リファクタ前後でテストが緑のまま |
| 命名一貫性 | `capture.ts` と目視比較 / lint | camelCase 関数・kebab-case ファイル・`*.spec.ts` を満たす |
| DRY | コードレビュー | 拡張 prefix の二重定義がない（正本は `EXTENSION_PROTOCOL_PREFIXES` のみ） |
| 型整合 | `pnpm --filter @ubm-hyogo/web typecheck` | エラー 0 |
