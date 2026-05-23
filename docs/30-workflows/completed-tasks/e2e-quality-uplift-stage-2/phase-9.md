# Phase 9: 品質保証

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| Tier | standard |

---

## 1. Quality Gate チェックリスト

| # | gate | コマンド / 確認 | 期待 |
|---|------|----------------|------|
| 1 | typecheck | `pnpm typecheck` | exit 0 |
| 2 | lint | `pnpm lint` | exit 0 |
| 3 | unit / contract test | `pnpm --filter @ubm-hyogo/api test` | green |
| 4 | E2E | `pnpm --filter @ubm-hyogo/web test:e2e` | green |
| 5 | line cov | Phase 7 §2 結果 | >= 70% |
| 6 | critical smoke | Phase 7 §3 結果 | 100% |
| 7 | flaky retry | playwright retry log | 0 件 |
| 8 | OKLch 直書き grep | `verify-design-tokens` CI | pass |
| 9 | `apps/web` D1 binding 直参照 | grep `D1Database` in `apps/web/src` | 0 件 |
| 10 | 新 fixture 追加なし | `git diff main...HEAD apps/web/playwright/fixtures/auth.ts` | 既存変更のみ・拡張なし |

---

## 2. flaky 防止の確認

| 観点 | 対策 |
|------|------|
| 日時 | fixture は ISO8601 固定（`2026-05-09T00:00:00Z`） |
| race | mock counter 経由で決定論化 |
| 並行 | `page.route()` で外部 API 依存 0 |
| sort | API sort 順非依存（fixture 側で固定） |

---

## 3. 不変条件 grep gate

| 不変条件 | grep | 期待 |
|---------|------|------|
| HEX 直書き禁止 | `grep -rn 'bg-\[#\|text-\[#' apps/web/playwright/` | 0 件 |
| D1 binding from web | `grep -rn 'D1Database' apps/web/src` | 0 件 |
| 新 fixture 禁止 | `auth.ts` の export diff | 既存のみ |
| `signSession()` placeholder 残存 | `grep -n 'TODO.*signSession' apps/web/playwright/fixtures/` | 0 件（Stage 1 で活性化済み） |

---

## 4. CI 連動

| job | 対象 | Stage 2 影響 |
|-----|------|------------|
| `playwright-e2e` | apps/web e2e | 4 spec 追加で実行件数 +N |
| `vitest-api` | apps/api unit/contract | contract-stage-2.test.ts 追加 |
| `verify-design-tokens` | OKLch gate | 影響なし |
| `verify-indexes-up-to-date` | skill indexes | 影響なし（spec のみ） |

---

## 5. 残課題（Stage 3 持越し候補）

| # | 残課題 | 起点 |
|---|-------|------|
| 1 | cascade preview API 実装 + 2c-2 有効化 | Phase 4 §1 Q5 |
| 2 | line cov 70% 未達時の追加 unit test | Phase 7 §2 |
| 3 | `DeleteBodyZ` の `packages/shared` 移管（必要なら） | Phase 4 §1 Q6 |

---

## 6. Phase 9 完了定義

- [x] Quality Gate 10 項目チェックリスト
- [x] flaky 防止の確認
- [x] 不変条件 grep gate 4 項目
- [x] CI 連動マトリクス
- [x] 残課題 3 件記録

> Phase 10 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 9
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

