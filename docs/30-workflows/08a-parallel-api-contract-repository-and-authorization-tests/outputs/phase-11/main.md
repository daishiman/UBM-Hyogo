# Phase 11: 手動 smoke 結果

## メタ情報

| 項目 | 値 |
| --- | --- |
| 実行日 | 2026-04-30 |
| 実行者 | Claude (自動 smoke) |
| ワークツリー | `.worktrees/task-20260430-161419-wt-6` |
| Node / pnpm | Node 24.15.0 / pnpm 10.33.2 (mise pin) |

## 1. 全 suite 実行サマリ

| 指標 | 値 |
| --- | --- |
| Test Files | 74 passed (74) |
| Tests | **442 passed (442)** |
| Failures | **0** |
| Duration | 61.09s |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| evidence | `evidence/test-run.log` |

stderr に `[/health/db] SELECT 1 failed ...` の出力が複数件あるが、これは `health-db.test.ts` の異常系シナリオ（T4 系）が意図的に prepare/first を throw / null 返却させているためで、当該 suite は green。

## Gate 判定

Phase 11 の **test execution gate は PASS**（442/442 pass）だが、**coverage gate は PARTIAL**。AC-6 の Statements / Functions / Lines が未達のため、Phase 11 は `completed` ではなく `partial` として扱う。後続 09a/09b は UT-08A-01 の解消または明示的な例外承認なしに 08a を green 前提にしない。

## 2. coverage 結果

`mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` を実行。

| 指標 | 実測 | AC 閾値 | 判定 |
| --- | --- | --- | --- |
| Statements | **84.18%** | ≥ 85% (AC-6) | **未達 (-0.82pt)** |
| Branches   | **84.13%** | ≥ 80%        | pass |
| Functions  | **83.37%** | ≥ 85%        | **未達 (-1.63pt)** |
| Lines      | **84.18%** | ≥ 85%        | **未達 (-0.82pt)** |

evidence: `evidence/coverage-report.txt`

### 未達原因の特定

coverage-report.txt の per-file 内訳から以下のファイルが全体平均を引き下げている:

| パス | Stmts | 状況 |
| --- | --- | --- |
| `src/use-cases/public/form-preview.ts`        | 9.67%  | view-models 経由に置き換わり use-case 直叩きの test が無い |
| `src/use-cases/public/public-member-profile.ts` | 5.76%  | 同上 |
| `src/use-cases/public/public-stats.ts`        | 7.54%  | 同上 |
| `src/use-cases/public/public-members.ts`      | 14.28% | 同上 |
| `src/routes/public/members.ts`                | 40.00% | route ハンドラの直接 test 不足（view-model 経由のみ） |
| `src/routes/admin/sync-schema.ts`             | 43.15% | sync 系 cron ハンドラの test 未補強 |
| `src/services/mail/magic-link-mailer.ts`      | 49.18% | 実送信パスは smoke で未網羅（08a スコープ外） |
| `src/routes/public/form-preview.ts`           | 44.44% | route 直 test 不足 |

`src/use-cases/public/*` 4 本は **view-model 層に責務が移っており、本タスク 08a スコープでは view-model のテストで AC を満たす設計**（phase-04 / phase-07 のテスト戦略）。一方で coverage 計測対象から除外していないため数値上未達となっている。

## 3. CI workflow placeholder

`evidence/ci-workflow.yml` を作成。本番反映時は `.github/workflows/api-tests.yml` として配置する。

| 項目 | 値 |
| --- | --- |
| Node | 24 (`actions/setup-node@v4`) |
| pnpm | 10.33.2 (`pnpm/action-setup@v4`) |
| trigger | push (main/dev) + PR with `apps/api/**` 等 paths filter |
| jobs | `api-tests` (test → coverage → artifact upload) |
| timeout | 10 min（無料枠 budget 内） |
| artifact | `api-coverage-report`（apps/api/coverage 配下、retention 14d） |

既存 `.github/workflows/{ci,backend-ci,validate-build,verify-indexes,web-cd}.yml` の命名・style に整合。

## 4. pass / fail 判定欄（phase-11.md 5 シナリオ）

| シナリオ | 期待 | 結果 | 備考 |
| --- | --- | --- | --- |
| 1 全 suite green | 0 fail | **PASS** | 442/442 pass |
| 2 coverage ≥ 85/80 | 達成 | **PARTIAL** | Branches は達成、Stmts/Funcs/Lines が 0.8〜1.6pt 不足 |
| 3 type test fail check | @ts-expect-error 観測 | PASS (api scope) / N/A (shared scope) | `apps/api/src/__tests__/brand-type.test.ts` で brand proxy を観測。packages/shared 独立 type test は UT-08A-05 |
| 4 lint test pass | 0 件 | PASS | api 全 suite green に含まれる |
| 5 yml validate | OK | PASS | placeholder yml を作成・既存 style と整合 |

## 5. 既知の差分・後続タスクへの引継ぎ事項

1. **AC-6 (statements ≥ 85%) 未達**: 0.82pt 不足。UT-08A-01 として formalize し、後続 09a/09b が green 前提にする前に下記いずれかで解消する必要がある:
   - (a) `src/use-cases/public/*.ts` を coverage 対象から除外（vitest config の `coverage.exclude` に追加）。view-model に責務委譲済みのため設計上は妥当。
   - (b) public route ハンドラ (`src/routes/public/{members,form-preview,member-profile,stats}.ts`) の route-level test を追加（推奨経路）。
   - (c) `sync-schema.ts` / `magic-link-mailer.ts` を 08a スコープ外として除外設定。
2. **type test (シナリオ 3)**: `apps/api/src/__tests__/brand-type.test.ts` で apps/api 側の brand proxy は観測済み。packages/shared 側の `@ts-expect-error` 検証は UT-08A-05 として対象外に分離。
3. **CI workflow 本番反映**: `.github/workflows/api-tests.yml` への配置は 09b (release runbook) 側で実施する想定。本 phase では placeholder のみ。
4. **stderr ログ**: health-db 異常系で意図的 throw のログが出るため、CI 上で error keyword grep を行う場合は除外設定が必要。

## 6. evidence 一覧

```
outputs/phase-11/evidence/
├── test-run.log              # vitest 全出力（74 files / 442 tests pass）
├── coverage-report.txt       # coverage 内訳（per-file）
└── ci-workflow.yml           # GitHub Actions placeholder
```

## 完了条件チェック

- [~] 全実行タスク completed — test execution は完了、coverage gate は PARTIAL
- [x] evidence ファイル 3 種配置
- [ ] coverage 閾値達成 — **未達（後続で解消）**
- [~] artifacts.json の phase 11 を partial に更新（AC-6 未達を明示）
