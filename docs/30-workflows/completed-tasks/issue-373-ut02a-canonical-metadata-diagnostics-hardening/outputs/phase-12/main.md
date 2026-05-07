# Phase 12: ドキュメント更新

## 成果物
- `implementation-guide.md` — PR 本文ソース (AC マトリクス / 不変条件チェック / evidence 参照)
- `system-spec-update-summary.md` — 正本仕様更新の要約
- `documentation-changelog.md` — 同一サイクルのドキュメント変更履歴
- `unassigned-task-detection.md` — 未タスク検出結果
- `skill-feedback-report.md` — skill feedback 判定
- `phase12-task-spec-compliance-check.md` — Phase 12 strict output / 状態整合チェック

## 関連ドキュメント更新
- `docs/00-getting-started-manual/specs/01-api-schema.md` に `## Static Manifest Retirement Condition` セクション追記済み (Phase 5 で完了)
- `apps/api/src/repository/_shared/metadata.ts` 冒頭コメントから当該セクションへ参照済み (Phase 5)
- `package.json` scripts に `verify:static-manifest` / `regenerate:static-manifest` 追加済み
- `.github/workflows/ci.yml` に Verify static manifest gate 追加済み

## 残課題
Phase 13 の commit / push / PR 作成のみユーザー承認待ち。実装/テスト/CI gate/ドキュメントはローカルで in-place。
