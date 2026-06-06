# Phase 11: 手動テスト（NON_VISUAL 宣言）

## NON_VISUAL 宣言

- **タスク種別**: NON_VISUAL 実装タスク（web→api transport / env / config / scripts の修正）。
- **非視覚的理由**: 変更対象は fetch transport 選択・env 解決・CI gate・shell script であり、UI コンポーネントのレンダリングコードは変更しない。視覚的な差分は「/profile がエラーカード → 実コンテンツ」という**副次的結果**であり、その確認は staging deploy + 認証 + runtime smoke（user-gated）でのみ可能。
- **代替証跡**: `outputs/phase-11/manual-test-result.md`（自動テスト結果 + 既知制限 + staging smoke 手順）。

## 3 層評価

| 層 | 本タスクでの扱い |
|----|-----------------|
| Semantic（自動テスト） | transport.spec / authed.spec / public.spec / env.spec / me route spec / verify-no-localhost-bake self-test。仕様段階のため期待値を Phase 4 に定義済み。 |
| Visual（screenshot） | n/a（NON_VISUAL）。staging で /profile 復旧の VISUAL_ON_EXECUTION 証跡は user-gated。 |
| AI UX | 該当なし（バックエンド transport 修正）。 |

## staging runtime smoke（user-gated・実走は承認後）

`scripts/smoke-staging-me.sh`（Lane C）で以下を検証する想定:
- `GET https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/me` → 200 + `{user.memberId}`
- `GET .../profile` → `data-testid="profile-authenticated-root"` を含む（再ログインカード非表示）

source-level PASS（自動テスト）と環境ブロッカー（staging 未 deploy / secret 未投入）は別カテゴリで記録する（WEEKGRD-01）。
