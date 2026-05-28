# Phase 12 Skill Feedback Report

## テンプレ改善

- Implementation workflow が `apps/` target を列挙した場合、Phase 12 no-op ではなく同 cycle 実装または明確な user-gated 境界に分類する既存 rule を再確認。

## ワークフロー改善

- Admin/Public の server-fetch transport symmetry を workflow checklist に入れる。public fetch だけ service-binding 対応済み、admin fetch は HTTP のまま、という非対称が loopback 404 の原因になった。

## ドキュメント改善

- `API_SERVICE` service-binding を使う server-fetch では、test/Playwright fallback を明記し、server-side fetch mock を壊さないことを Phase 4 に必ず書く。
- `API_SERVICE` / `NODE_ENV` / `PLAYWRIGHT_TEST` の transport 判定は `getEnv()` ではなく `getPublicFetchEnv()` に閉じる。仕様書の疑似コードも実 accessor 名に揃える。
