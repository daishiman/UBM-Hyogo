# Phase 7: パフォーマンス / セキュリティ

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 前 Phase | 6 (リファクタ / 品質) |
| 次 Phase | 8 (アクセシビリティ / レスポンシブ) |
| 状態 | completed |

## パフォーマンス

- HomePage 追加コスト: static markup のみ、API 追加呼び出しなし。SSR / build size 影響は無視可能。
- Image 非使用のため LCP 影響なし。
- CSS module は既存パターンと同じくビルド時にスコープ化される。

## セキュリティ

- 外部リンク: `target="_blank"` + `rel="noopener noreferrer"` 必須（reverse tabnabbing / referrer leak 対策）。Phase 4 assertion で強制。
- `responderUrl` は static 定数のみで、ユーザー入力を href に流さない（XSS なし）。
- CSP 観点: 既存 CSP の `connect-src` / `frame-src` は変更不要（リンクの遷移は通常 navigation）。

## 検証コマンド

```bash
pnpm build
pnpm test -- CallToActionCTA.component.spec  # rel/target assertion 含む
```

## 完了条件

- build 成功
- security assertion 4 件すべて GREEN
