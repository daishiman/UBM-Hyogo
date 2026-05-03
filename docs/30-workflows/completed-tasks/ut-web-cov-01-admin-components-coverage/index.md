# ut-web-cov-01-admin-components-coverage

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-coverage |
| mode | parallel |
| owner | - |
| 状態 | implemented-local / implementation / Phase 1-12 completed / Phase 13 pending_user_approval |
| visualEvidence | NON_VISUAL |

## purpose

apps/web の admin component 群（MembersClient/TagQueuePanel/AdminSidebar/SchemaDiffPanel/MemberDrawer/MeetingPanel/AuditLogPanel）の coverage<80% を解消する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、2026-05-01 実測の coverage<80% を解消するための新規 follow-up gate である。実測値は`packages/*/coverage/coverage-summary.json`および`apps/web/coverage/coverage-summary.json`に記録された baseline を起票根拠とする。

## scope in / out

### Scope In
- components/admin/MembersClient.tsx (現値: 0%)
- components/admin/TagQueuePanel.tsx (現値: 0%)
- components/layout/AdminSidebar.tsx (現値: 0%)
- components/admin/SchemaDiffPanel.tsx (L=58.62 B=38.46 F=16.66 S=58.62)
- components/admin/MemberDrawer.tsx (L=63.68 B=50 F=9.09 S=63.68)
- components/admin/MeetingPanel.tsx (L=66.44 B=80 F=33.33 S=66.44)
- components/admin/AuditLogPanel.tsx (L=98.5 B=74.19 F=100 S=98.5)

### Scope Out
- 視覚回帰（Playwright E2E full）
- admin lib（lib/admin/*。UT-WEB-COV-04 へ委譲）
- production load test

## dependencies

### Depends On
- 既存 admin API 実装（06c-A〜E 系）

### Blocks
- 09b-A-observability-sentry-slack-runtime-smoke（admin UI 視覚保証 / release runbook）

## coverage 実測

- Phase 11 command: `pnpm --filter @ubm-hyogo/web test:coverage`
- Result: 21 test files / 196 tests PASS
- Target coverage: 7 target files all PASS (Stmts/Lines/Funcs >=85%, Branches >=80%)
- Evidence:
  - [outputs/phase-11/vitest-run.log](outputs/phase-11/vitest-run.log)
  - [outputs/phase-11/coverage-summary.snapshot.json](outputs/phase-11/coverage-summary.snapshot.json)
  - [outputs/phase-11/coverage-target-files.txt](outputs/phase-11/coverage-target-files.txt)

## refs

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%, branches=68.01%, functions=43.51%, statements=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/claude-design-prototype/

## AC

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- admin client component に happy / authz-fail / empty / mutation の最低 4 ケース
- snapshot ではなく明示 assertion ベース
- 既存 web test に regression なし

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden

## completion definition

全 phase 仕様書、admin component focused tests、Phase 11 実測 evidence、Phase 12 strict 7 files が揃っていること。deploy、commit、push、PR 作成は Phase 13 user approval gate まで実行しない。
