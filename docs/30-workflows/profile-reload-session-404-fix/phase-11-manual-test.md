# Phase 11 Manual Test Entry

正本: `outputs/phase-11/manual-test-result.md`

この root entry は `validate-phase11-screenshot-coverage.js` が参照する Phase 11 仕様入口である。実行結果・判断根拠・証跡一覧は `outputs/phase-11/manual-test-result.md` を正本とする。

## 画面カバレッジマトリクス

| ID | Target | 証跡 | Status |
| --- | --- | --- | --- |
| TC-01 | `/profile` `MEMBER_SESSION_404` `SectionError` relogin CTA | `outputs/phase-11/screenshots/profile-session-404-relogin-static-contract.png` | captured |
| TC-02 | `/profile` `MEMBER_SESSION_404` page framing | `outputs/phase-11/screenshots/profile-session-404-relogin-static-page.png` | captured |

## 二段境界

Static UI contract screenshot は本 wave で取得済み。Authenticated staging runtime screenshot はログインセッションが必要なため user-gated とする。
