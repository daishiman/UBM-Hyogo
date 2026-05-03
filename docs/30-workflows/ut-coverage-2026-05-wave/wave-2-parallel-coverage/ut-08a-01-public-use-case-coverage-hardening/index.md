# ut-08a-01-public-use-case-coverage-hardening

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-coverage |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | NON_VISUAL |

## purpose

GitHub Issue #320 (UT-08A-01) を起票元として、08a の AC-6 PARTIAL を解消するため public use-case の coverage を補強する follow-up タスクの仕様書を整備する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、Issue #320 (closed) に基づき、正本上で未実装・未実測として残った follow-up gate だけを扱う。

08a は 442 tests PASS だが coverage が Statements/Functions/Lines 85% を下回り、AC-6 が PARTIAL のまま残っている。主因は public use-case と route handler の直接テスト不足である。

## scope in / out

### Scope In
- apps/api/src/use-cases/public/form-preview.ts のテスト補強
- apps/api/src/use-cases/public/public-member-profile.ts のテスト補強
- apps/api/src/use-cases/public/public-stats.ts のテスト補強
- apps/api/src/use-cases/public/public-members.ts のテスト補強
- 必要最小限の public route handler 直叩き unit test
- coverage evidence 更新

### Scope Out
- UI visual regression
- production load test
- shared package type-test 導入
- coverage exclude による数値合わせ

## dependencies

### Depends On
- 08a partial close-out
- 04a public API implementation

### Blocks
- 08a-B-public-search-filter-coverage
- 09a-A-staging-deploy-smoke-execution（staging smoke）
- 09b-A-observability-sentry-slack-runtime-smoke（release runbook）
- 09c-A-production-deploy-execution（production deploy gate）

## refs

- GitHub Issue #320 (closed): UT-08A-01 public-use-case-coverage-hardening
- docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md（spec source は Issue #320 本文）
- docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/（legacy mirror）
- docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/03-data-fetching.md

## AC

- public use-case 4本（form-preview / public-member-profile / public-stats / public-members）に happy / null-or-empty / D1-fail の最低3ケースずつ追加される
- 既存 442 件以上のテスト regression なし
- coverage Statements >=85%, Branches >=80%, Functions >=85%, Lines >=85%
- 08a artifacts の partial 判定更新方針が明記される

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

- #1 responseEmail system field
- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
