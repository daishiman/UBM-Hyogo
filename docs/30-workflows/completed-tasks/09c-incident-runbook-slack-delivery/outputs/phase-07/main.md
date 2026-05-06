# Phase 7 サマリ — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

## 確定事項

- 単体テスト 15 件（T1〜T15）を `scripts/notify/__tests__/slack-incident-runbook.test.ts` に集約
- 観点: template render / channel 分離 / production gate / evidence schema / Slack 401 / 5xx retry / token leak
- `vi.mock("@slack/web-api")` で `WebClient` をモック化、`postMessageMock` / `getPermalinkMock` を spy
- フィクスチャ 5 種を `__tests__/__fixtures__/` に配置
- `vitest.workspace.ts` に `scripts-notify` プロジェクトを新規追加（coverage threshold 80%）

## 重要テスト

- T5: production と dryrun の channel id 同値で throw（誤配信ガード）
- T8: `PRODUCTION_APPROVAL_TOKEN` 欠落で `postIncidentRunbook` が fail-fast
- T10: evidence に xox[b]-/Bearer 含む値を渡すと throw
- T15: throw された Error message に xox[b]- が含まれない（cross-cutting redact 規約テスト）

## Phase 8 へ引き渡し

`mise exec -- pnpm vitest run --project scripts-notify --coverage` を Phase 8 Step 3 の正規実行コマンドとする。
