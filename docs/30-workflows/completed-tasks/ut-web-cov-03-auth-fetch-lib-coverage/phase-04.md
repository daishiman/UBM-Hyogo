# Phase 4: テスト戦略 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 本タスクはユーザー指定 `taskType=docs-only` に対し、Vitest テストファイル新規作成が必須のため、CONST_004 実態優先原則に基づき実装仕様書として作成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 4 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

AC を test ID にマッピングし、coverage 目標値（package / file レベル）と除外境界を decision log として確定する。実測コマンドと evidence 取得手順を明記する。

## 実行タスク

1. AC ↔ test ID マッピング表を作成する。
2. coverage 目標値を package レベル（apps/web）と file レベル（対象 7 ファイル）で明記する。
3. 除外境界 decision log を確定する（`me-types.ts`）。
4. 実測コマンドと evidence 取得手順を 5-7 ステップで列挙する。

## AC ↔ test ID マッピング

| AC ID | AC 内容 | 対応 test file | 対応 test ID |
| --- | --- | --- | --- |
| AC-1 | 対象 7 ファイル全てで Stmts/Lines/Funcs ≥85%, Branches ≥80% | 全 6 test file + me-types.test-d.ts（または coverage 除外） | 全 ID |
| AC-2-a | auth client happy | `auth.test.ts` | AUTH-001, AUTH-005 |
| AC-2-b | auth client token-missing | `auth.test.ts` | AUTH-002 |
| AC-2-c | auth client token-invalid | `auth.test.ts` | AUTH-003 |
| AC-2-d | auth client network-fail | `auth.test.ts` | AUTH-004 |
| AC-3-a | fetch wrapper 200 | `authed.test.ts`, `public.test.ts` | FA-001, FP-001, FP-002 |
| AC-3-b | fetch wrapper 401 | `authed.test.ts` | FA-002 |
| AC-3-c | fetch wrapper 403 | `authed.test.ts` | FA-003 |
| AC-3-d | fetch wrapper 5xx | `authed.test.ts`, `public.test.ts` | FA-004, FP-005 |
| AC-3-e | fetch wrapper network-fail | `authed.test.ts`, `public.test.ts` | FA-005, FP-006 |
| AC-4 | me-types round-trip | `me-types.test-d.ts`（採用時） | TYPE-001〜003 |
| AC-5 | regression なし | （全 test pass で担保） | 全 ID |
| AC-6 | typecheck / lint pass | （CI gate） | — |

## coverage 目標値

### package level (`apps/web`)

| 指標 | 目標 | 現状 (2026-05-01) |
| --- | --- | --- |
| Statements | ≥80% | — |
| Lines | ≥80% | 39.39% |
| Functions | ≥80% | — |
| Branches | ≥75% | — |

> 既存 baseline（lines=39.39%）からの段階的引き上げ。本 wave 完了後に最終 threshold を `vitest.config.ts` に固定する想定。

### file level（対象 7 ファイル）

| ファイル | Stmts | Lines | Funcs | Branches |
| --- | --- | --- | --- | --- |
| `apps/web/src/lib/auth.ts` | ≥85% | ≥85% | ≥85% | ≥80% |
| `apps/web/src/lib/auth/magic-link-client.ts` | ≥85% | ≥85% | ≥85% | ≥80% |
| `apps/web/src/lib/auth/oauth-client.ts` | ≥85% | ≥85% | ≥85% | ≥80% |
| `apps/web/src/lib/session.ts` | ≥85% | ≥85% | ≥85% | ≥80% |
| `apps/web/src/lib/fetch/authed.ts` | ≥85% | ≥85% | ≥85% | ≥80% |
| `apps/web/src/lib/fetch/public.ts` | ≥85% | ≥85% | ≥85% | ≥80% |
| `apps/web/src/lib/api/me-types.ts` | 計測除外（D-04 採用） | — | — | — |

## 除外境界 decision log

| decision ID | 対象 | 判定 | 理由 / 代替 |
| --- | --- | --- | --- |
| D-04 | `apps/web/src/lib/api/me-types.ts` を coverage 計測対象から除外 | 採用 | type-only ファイル、ランタイムコード 0 行。代替として `apps/web/src/lib/api/me-types.test-d.ts` で `expectTypeOf` ベースの型 round-trip を担保する。 |
| D-05 | `vitest.config.ts` の `coverage.exclude` に `apps/web/src/lib/api/me-types.ts` を追記する変更を Phase 5 で実施する | 採用 | 設定変更は実装フェーズ（Phase 5）で行う。本仕様書では追記内容のみ確定。 |

追記する exclude エントリ（参考）:

```ts
// root `vitest.config.ts` coverage.exclude に追加
"apps/web/src/lib/api/me-types.ts",
```

## 変更対象ファイル一覧（Phase 4 確定版）

- 新規 test 6 ファイル（co-located）
- 新規 type test: `apps/web/src/lib/api/me-types.test-d.ts`
- 新規 helper: `apps/web/src/test-utils/fetch-mock.ts`
- 設定変更: root `vitest.config.ts` の `coverage.exclude` に `apps/web/src/lib/api/me-types.ts` を追記

## テスト方針（CONST_005）

- 命名規約: `describe(<関数名>) > it("<条件>")`
- 配置: co-located（`<対象>.test.ts`）。type test は `<対象>.test-d.ts`。
- mock pattern: Phase 2 mock 戦略表のとおり。
- アサーション: `expect(...).toEqual(...)` を基本とし、エラーは `expect(fn).rejects.toThrow(SpecificError)` で型を含めて検証。
- timer / clock: 必要時のみ `vi.useFakeTimers()`。本タスクでは原則不要。

## ローカル実行コマンド（CONST_005）

```
mise exec -- pnpm --filter web test:coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 実測コマンドと evidence 取得手順

1. ワークツリー直下で `mise exec -- pnpm install` を実行（Node 24 / pnpm 10）。
2. `mise exec -- pnpm --filter web test:coverage` を実行する。
3. 出力 `apps/web/coverage/coverage-summary.json` を確認し、対象 7 ファイル（除外採用後は 6 ファイル）の Stmts/Lines/Funcs ≥85%, Branches ≥80% を assert する。
4. `apps/web/coverage/coverage-final.json` を保管し、Phase 11 evidence として `outputs/phase-11/` 配下に bundle する。
5. `mise exec -- pnpm typecheck` と `mise exec -- pnpm lint` が pass することを確認する。
6. 既存 test に regression がないことを `mise exec -- pnpm --filter web test` の全 pass で確認する。
7. coverage drop が出た場合は Phase 2 テストケース表を再確認し、不足 test を追加する。

## DoD（CONST_005）

- `coverage-summary.json` で対象 7 ファイル（me-types.ts 除外採用後は 6 ファイル）すべてが Stmts/Lines/Funcs ≥85%, Branches ≥80% を満たす。
- 既存 test pass（regression なし）。
- `pnpm typecheck` / `pnpm lint` が pass。
- AC ↔ test ID マッピング表のすべての test ID が実装され pass。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- root `vitest.config.ts`
- Phase 2 / Phase 3 outputs

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ／test 内でも遵守）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。
- coverage exclude による数値合わせを D-04 / D-05 以外には行わない。

## サブタスク管理

- [ ] AC ↔ test ID マッピング表を確定する
- [ ] coverage 目標値（package / file）を確定する
- [ ] 除外境界 decision log（D-04 / D-05）を確定する
- [ ] 実測コマンド / evidence 取得手順 7 ステップを確定する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- AC ↔ test ID マッピング表が完成。
- coverage 目標値が package / file 両レベルで確定。
- 除外境界 decision log が確定。
- 実測コマンドと evidence path が文書化。
- 既存 web test に regression なし（実装フェーズで担保）。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ以下を渡す: AC ↔ test ID マッピング表、coverage 目標値、除外境界 decision log（vitest.config.ts への追記内容含む）、実測コマンド、evidence path、変更対象ファイル一覧。
