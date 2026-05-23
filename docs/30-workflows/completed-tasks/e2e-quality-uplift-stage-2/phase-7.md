# Phase 7: カバレッジ確認

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| Tier | standard（lines >= 70%, critical route smoke 100%） |

---

## 1. 計測対象とコマンド

| 計測 | コマンド | 出力先 |
|------|---------|-------|
| apps/web（vitest line cov） | `pnpm --filter @ubm-hyogo/web test:run --coverage` | `apps/web/coverage/coverage-summary.json` |
| apps/api（vitest line cov） | `pnpm --filter @ubm-hyogo/api test --coverage` | `apps/api/coverage/coverage-summary.json` |
| Playwright critical smoke | `pnpm --filter @ubm-hyogo/web test:e2e --grep '@critical'` | playwright-report |

> Stage 2 で追加する spec は Playwright（行 coverage には乗らない）+ Vitest contract（行 coverage に乗る）。

---

## 2. >= 70% 達成戦略

| 寄与源 | 期待効果 | 備考 |
|-------|---------|------|
| Stage 1 既存 | 現状 line cov（Stage 1 PR #594 終端） | baseline |
| 2d contract test（vitest） | `apps/api/src/routes/admin/*` の touched 行を最低 1 path カバー | 既存 schema parse 経路を踏むため +1〜3% 想定 |
| Phase 8 helper 抽出 | `playwright/helpers/admin-mocks.ts` は test 経路でのみ実行され vitest cov に直接寄与しないが、API 側 contract test の充実で間接補完 | — |

> もし 70% 未達ならば Phase 9 で **追加 vitest unit test** を補完（Stage 2 の範囲は spec のみのため、未達観測時は Stage 3 で補完）。

---

## 3. critical route smoke 100% の確認手順

| step | コマンド / 確認 | 期待 |
|------|----------------|------|
| 1 | `pnpm --filter @ubm-hyogo/web test:e2e --grep '@critical'` | exit 0 |
| 2 | playwright-report の HTML で 4 admin routes（requests / identity-conflicts / members / audit）の suite 全 green | 全 green |
| 3 | flaky retry 0 件 | retry count 確認 |

---

## 4. coverage 結果の判定 matrix

| 結果 | 行 cov | smoke 100% | 判定 |
|------|--------|-----------|------|
| A | >= 70% | 100% | **PASS**（Phase 8 へ） |
| B | < 70% | 100% | **CONDITIONAL**（Phase 9 で追加 unit test、または Stage 3 持越し） |
| C | >= 70% | < 100% | **FAIL**（critical smoke を最優先で修復） |
| D | < 70% | < 100% | **FAIL**（両方修復） |

---

## 5. 計測結果の記録様式

```text
[stage-2 coverage @ 2026-05-09]
apps/web lines: <X>%
apps/api lines: <Y>%
playwright critical smoke: <pass|fail> / <count>
flaky retries: <n>
```

> 上記を phase-9 の Quality Gate ログと連動させる。

---

## 6. Phase 7 完了定義

- [x] 計測コマンドと出力先の確定
- [x] >= 70% 達成戦略の寄与源マトリクス
- [x] critical route smoke 100% の確認手順
- [x] 結果判定 matrix
- [x] 記録様式

> Phase 8 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 7
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

