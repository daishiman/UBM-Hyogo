# タスク仕様書: Task B — apps/api 13 件 test 失敗修復

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | ci-recover-task-b-api-test-recovery |
| 親 wave | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/` |
| 配置先 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-b-apps-api-test-recovery/` |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスクの wave | wave-1（Task A と並列実行可） |
| dependencies | なし（base は existing apps/api test 基盤。Task D の前提タスク） |
| ブロック先 | Task D（apps/api coverage 補強）／ Task E（coverage hard gate 化） |
| ブランチ（想定） | `feat/ci-recover-task-b-api-test-recovery` |
| 想定 PR 数 | 1 |
| coverage AC | 適用（≥80% を全 package で維持。本タスクは 13 件 PASS + coverage-summary.json 生成までを必達条件とし、80% 未達分は Task D に委譲。`bash scripts/coverage-guard.sh` exit 0 が完了条件。 |
| implementation_mode | `new`（regression 修復のため通常の RED/GREEN サイクル。ただし P50 チェックで先行タスクとの差分確認 Phase を Phase 1 に組み込む） |

## 目的

`apps/api` の vitest run（`pnpm --filter @ubm-hyogo/api test`）で発生している **13 件 test 失敗** を修復し、`test:coverage` が exit 0 で完了して `apps/api/coverage/coverage-summary.json` が生成される状態にする。これは Task D（apps/api coverage 80% 達成）と Task E（coverage hard gate 化）の **必達 pre-condition** である。

## why this is not a restored old task

完了済みタスク `ut-api-cov-precondition-01-test-failure-recovery`（2026-05-01 起票）が同じ 13 件 failure を既に修復済みであることを Phase 1 で確認するが、**main CI run 25297513424（2026-05-04T02:04Z）** で同等の 13 件 regression が再発している事実を起点とする新規 follow-up タスクである。先行タスクの修復が main へ未反映なのか、別経路で regression が混入したのかを Phase 1 で切り分ける。

## スコープ

| 含む | 含まない |
| --- | --- |
| `pnpm --filter @ubm-hyogo/api test 2>&1 \| tee outputs/phase-1/api-test-baseline.log` の取得と 13 件失敗の個別分類（実装 bug / test stale / setup drift / mock contract drift） | apps/api 機能追加・新規 endpoint 実装 |
| `apps/api/src/{middleware,repository,routes,jobs,workflows}/**/*.ts` の最小修正（実装 bug が原因の場合） | 関連しない module の refactoring |
| `apps/api/src/**/*.test.ts` の修復（D1 binding mock / Miniflare setup の drift がある場合） | coverage 補強そのもの（後続 Task D に委譲） |
| `apps/api/test/setup.ts` 等の setup file 更新 | coverage exclude / threshold 緩和による数値合わせ |
| `apps/api/vitest.config.ts`（存在しなければ root `vitest.config.ts` での apps/api 設定）の最小修正 | apps/web / packages/* への波及修正 |
| `apps/api/coverage/coverage-summary.json` 生成確認 | 80% 閾値達成の coverage 補強テスト追加 |
| 13 件 → 0 件の regression 差分ログ取得（Phase 11 evidence） | Task A / Task C / Task E の作業 |

## 不変条件（CLAUDE.md 継承）

- 不変条件 #1: 実フォームの schema をコードに固定しすぎない（test 修復で schema 想定を変更しない）
- 不変条件 #2: consent キーは `publicConsent` / `rulesConsent` に統一（test 期待値も同じ）
- 不変条件 #3: `responseEmail` は system field（フォーム項目ではない）
- 不変条件 #4: Google Form schema 外データは admin-managed として分離
- 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる（mock もこの境界を尊重）
- 不変条件 #6: GAS prototype は本番バックエンド仕様に昇格させない
- CONST_007: 13 件失敗のうち本 wave サイクルで解消できないものは 0 件とする。修復不可能な 1 件があれば `outputs/phase-12/unassigned-task-detection.md` に除外理由・代替検証手段を明記して clos する（次 wave 送り禁止）

## 完了条件（spec 段階）

- [x] Phase 1-13 の `phase-N.md` が存在し、各 Phase が `## メタ情報` / `## 目的` / `## 実行タスク` / `## 完了条件` を持つ
- [x] coverage AC（≥80% / `bash scripts/coverage-guard.sh --package apps/api` exit 0）が Phase 6 / Phase 9 / Phase 11 完了条件に明記されている
- [x] Phase 13 が blocked placeholder（commit / push / PR / deploy 禁止）として配置されている
- [x] dependencies なし（wave-1 並列、Task A と並列実行可）が明記されている
- [x] Phase 1 に「先行タスク `ut-api-cov-precondition-01-test-failure-recovery` の差分確認」step を含む

## 完了条件（実装段階）

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` が exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` が exit 0
- [ ] `apps/api/coverage/coverage-summary.json` が存在し JSON parse 可能
- [ ] `bash scripts/coverage-guard.sh --package apps/api --no-run` が exit 0
- [ ] 既存 PASS test に regression なし（先行 baseline `Test Files 75 passed` 以上）
- [ ] `outputs/phase-11/api-test-recovery.log` に 13 件 → 0 件の差分が記録されている
- [ ] Phase 12 strict 7 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と root / outputs `artifacts.json` parity を満たす

## 13 phases

- [phase-1.md](outputs/phase-1/phase-1.md) — 要件定義（baseline log 取得・13 件分類・先行タスク差分確認）
- [phase-2.md](outputs/phase-2/phase-2.md) — 設計（修復方針: 実装 bug vs test stale vs setup drift の振り分け）
- [phase-3.md](outputs/phase-3/phase-3.md) — 設計レビュー（不変条件遵守ゲート）
- [phase-4.md](outputs/phase-4/phase-4.md) — テスト戦略（既存 test 修復方針、新規 test 追加なし）
- [phase-5.md](outputs/phase-5/phase-5.md) — 実装ランブック（最小差分での修復順序）
- [phase-6.md](outputs/phase-6/phase-6.md) — 異常系・回帰確認（510 件 PASS の回帰なし確認）
- [phase-7.md](outputs/phase-7/phase-7.md) — coverage-summary.json 生成確認
- [phase-8.md](outputs/phase-8/phase-8.md) — DRY 化 / setup file 整理
- [phase-9.md](outputs/phase-9/phase-9.md) — 品質検証（typecheck / lint / coverage-guard）
- [phase-10.md](outputs/phase-10/phase-10.md) — 最終レビュー（13 → 0 件達成・AC マトリクス）
- [phase-11.md](outputs/phase-11/phase-11.md) — 実測 evidence（api-test-recovery.log）
- [phase-12.md](outputs/phase-12/phase-12.md) — ドキュメント更新（7 必須成果物）
- [phase-13.md](outputs/phase-13/phase-13.md) — PR 作成（blocked placeholder）

## outputs

- outputs/phase-1/main.md
- outputs/phase-1/api-test-baseline.log
- outputs/phase-2/main.md
- outputs/phase-3/main.md
- outputs/phase-4/main.md
- outputs/phase-5/main.md
- outputs/phase-6/main.md
- outputs/phase-7/main.md
- outputs/phase-7/coverage-summary-snapshot.json
- outputs/phase-8/main.md
- outputs/phase-9/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-11/api-test-recovery.log
- outputs/phase-11/manual-test-result.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #1 schema 固定回避（test 期待値の schema 想定を変更しない）
- #2 consent キー統一
- #3 responseEmail system field
- #5 apps/api への D1 アクセス閉じ込め（mock 境界も尊重）
- auth/session route は `docs/00-getting-started-manual/specs/02-auth.md` と矛盾させない
- data fetching / D1 mock は `docs/00-getting-started-manual/specs/03-data-fetching.md` と矛盾させない

## ローカル実行コマンド（実装エージェント向け）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-b-apps-api-test-recovery/outputs/phase-1/api-test-baseline.log
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
bash scripts/coverage-guard.sh --package apps/api --no-run
```

## refs

- 起票根拠: main CI run 25297513424（2026-05-04T02:04Z）に再発した 13 件 failure
- 先行タスク（差分確認対象）: `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/`
- 親 wave Phase 1 inventory: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/outputs/phase-1/phase-1-requirements.md`
- 親 wave 設計: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/outputs/phase-2/phase-2-design.md`
- 親 wave アーキテクチャ: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/outputs/phase-3/phase-3-architecture.md`
- spec template: `.claude/skills/task-specification-creator/references/phase-template-core.md`
- coverage 標準: `.claude/skills/task-specification-creator/references/coverage-standards.md`
- Phase 12 spec: `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- testing patterns: `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md`
- D1 mock skill: `.claude/skills/int-test-skill/SKILL.md`
- `scripts/coverage-guard.sh`
- `apps/api/package.json` / `apps/api/wrangler.toml`

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate（Phase 13 = blocked）が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
