# Phase 8 — ロールアウト

[実装区分: 実装仕様書]

## 8.1 デプロイ影響

- production / staging ランタイムへの影響: **なし**（test ファイル + test 用 util のみの変更）
- D1 schema 影響: なし
- Cloudflare Workers binding 影響: なし

## 8.2 ロールアウト手順

1. ローカルで Phase 6 / Phase 7 完了
2. PR (`feat/issue-748-jest-axe-primitive-a11y` → `dev`) 作成
3. CI（GitHub Actions）の test job green を確認
4. dev へマージ
5. dev → main の通常 production リリースサイクル時に同梱

## 8.3 段階展開の要否

不要。test 範囲の変更で機能 toggle は無し。
