# ut-web-cov-02-public-components-coverage

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-coverage |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | NON_VISUAL |

## purpose

apps/web の public component 群（Hero/MemberCard/ProfileHero/StatCard/Timeline/FormPreviewSections/EmptyState）の coverage<80% を解消する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、2026-05-01 実測の coverage<80% を解消するための新規 follow-up gate である。実測値は`packages/*/coverage/coverage-summary.json`および`apps/web/coverage/coverage-summary.json`に記録された baseline を起票根拠とする。

## scope in / out

### Scope In
- components/public/FormPreviewSections.tsx (現値: 0%)
- components/public/Hero.tsx (現値: 0%)
- components/public/MemberCard.tsx (現値: 0%)
- components/public/ProfileHero.tsx (現値: 0%)
- components/public/StatCard.tsx (現値: 0%)
- components/public/Timeline.tsx (現値: 0%)
- components/feedback/EmptyState.tsx (現値: 0%)

### Scope Out
- admin component（UT-WEB-COV-01 へ委譲）
- UI primitives（UT-WEB-COV-04 へ委譲）
- production load test

## dependencies

### Depends On
- 04a public directory API endpoints

### Blocks
- 09a staging smoke

## refs

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/00-overview.md
- docs/00-getting-started-manual/claude-design-prototype/

## AC

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース
- snapshot 依存ではなく明示 assertion
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

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
