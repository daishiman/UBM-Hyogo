# ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装 / implemented-local]

判断根拠:
- 本タスクは apps/web 配下に新規 Vitest unit test ファイル（auth.ts/magic-link-client/oauth-client/session/fetch/authed/public の `.test.ts`、`api/me-types.test-d.ts`、`test-utils/fetch-mock.ts` helper / helper test、root `vitest.config.ts` coverage exclude）を追加するコード変更を伴う。
- CONST_004（ラベルより実態優先）に従い、当初指定の `docs-only` ではなく `implementation` として分類する。
- 今回サイクルでテスト実装・coverage 実測・Phase 12 同期まで完了済み。commit / push / PR 作成はユーザー承認待ち。

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-coverage |
| mode | parallel |
| owner | - |
| 状態 | implemented-local / implementation / test_implementation / Phase 1-12 completed / Phase 13 pending_user_approval |
| visualEvidence | NON_VISUAL |

## purpose

apps/web の auth/fetch/session 系 lib（auth.ts/magic-link-client/oauth-client/session/fetch/me-types）の coverage<80% を解消する。Vitest unit test 新規追加でカバレッジを Stmts/Lines/Funcs ≥85% / Branches ≥80% に引き上げる**実装タスク**である。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、2026-05-01 実測の coverage<80% を解消するための新規 follow-up gate である。実測値は`apps/web/coverage/coverage-summary.json`に記録された baseline を起票根拠とする。

## scope in / out

### Scope In
- apps/web/src/lib/auth.ts (391L, 現値: 0%)
- apps/web/src/lib/auth/magic-link-client.ts (55L, 現値: 0%)
- apps/web/src/lib/auth/oauth-client.ts (19L, 現値: 0%)
- apps/web/src/lib/session.ts (25L, 現値: 0%)
- apps/web/src/lib/fetch/authed.ts (73L, 現値: 0%)
- apps/web/src/lib/fetch/public.ts (102L, 現値: 0%)
- apps/web/src/lib/api/me-types.ts (39L, type-only — coverage 除外対象)

新規 test ファイル（co-located）、`apps/web/src/lib/api/me-types.test-d.ts`、`apps/web/src/test-utils/fetch-mock.ts` helper、`apps/web/src/test-utils/fetch-mock.test.ts`、root `vitest.config.ts` の `me-types.ts` coverage exclude を追加する。

### Scope Out
- admin lib（UT-WEB-COV-04 へ委譲）
- UI コンポーネント（UT-WEB-COV-01/02/04 へ委譲）
- production load test
- deploy・commit・push・PR 作成

## dependencies

### Depends On
- 05a Auth.js Google OAuth / admin gate
- 05b Auth.js Magic Link callback

### Related Quality Gates
- 06b me-API session resolver: auth/session behavior の regression validation 対象。既存 workflow を block しない。
- 09b release runbook: coverage gate が release readiness に影響するため、実装後の evidence を引き渡す。

## refs

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md

## AC

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- auth client は happy / token-missing / token-invalid / network-fail の 4 ケース
- fetch wrapper は 200 / 401 / 403 / 5xx / network-fail を網羅
- me-types は type-only として coverage から除外し、`me-types.test-d.ts` で type round-trip を担保
- 既存 web test に regression なし

## ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter web test:coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 変更対象ファイル（CONST_005）

| 種別 | パス |
| --- | --- |
| test 追加 | apps/web/src/lib/auth.test.ts |
| test 追加 | apps/web/src/lib/auth/magic-link-client.test.ts |
| test 追加 | apps/web/src/lib/auth/oauth-client.test.ts |
| test 追加 | apps/web/src/lib/session.test.ts |
| test 追加 | apps/web/src/lib/fetch/authed.test.ts |
| test 追加 | apps/web/src/lib/fetch/public.test.ts |
| type test 追加 | apps/web/src/lib/api/me-types.test-d.ts |
| helper 追加 | apps/web/src/test-utils/fetch-mock.ts |
| helper test 追加 | apps/web/src/test-utils/fetch-mock.test.ts |
| config 変更 | root `vitest.config.ts`（`apps/web/src/lib/api/me-types.ts` を coverage.exclude に追加） |

production code は不変（test / type test / test helper / coverage 設定のみ）。

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
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/link-checklist.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ）

## completion definition

本タスク（implemented-local）の完了条件は **「実装・実測・正本同期が揃っていること」** である。具体的には:

- 全 13 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確である
- 変更対象ファイル一覧、関数シグネチャの参照先、入出力、テスト方針、ローカル実行コマンド、DoD（CONST_005 必須項目）が漏れなく記載されている
- `pnpm --filter @ubm-hyogo/web test:coverage` が PASS し、対象6ファイル + helper が file-level threshold を満たす
- commit、push、PR 作成は Phase 13 user approval まで行わない
