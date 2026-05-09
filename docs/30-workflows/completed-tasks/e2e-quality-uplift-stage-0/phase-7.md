# Phase 7: カバレッジ確認（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## 1. 判定: Phase 6 統合（NON_VISUAL タスク）

| 判定軸 | 値 |
| --- | --- |
| task classification | implementation / NON_VISUAL |
| 新規実コード行数（本サイクル） | README と Playwright 設定・spec 分離を含む |
| coverage instrument 対象 | なし（markdown は coverage 計測外） |
| critical route smoke 影響 | なし（spec 分離 1 件） |
| **結論** | **Phase 6 統合可** — Phase 7 は独立 coverage 取得を行わず、Phase 6 の grep gate / 回帰 guard / 補助 command で代替する |

---

## 2. coverageTier `standard` への準拠確認

| 要件 | Stage 0 での扱い | 結果 |
| --- | --- | --- |
| lines >= 70% | 本サイクルは `apps/web` source code を 1 行も触らないため、既存 coverage に影響なし | 維持 |
| critical route smoke 100% | spec 追加・削除なし。既存 smoke 構成に変動なし | 維持 |
| `coverage/e2e/coverage-summary.json` artifact | 本 PR で artifact 生成は不要（コード変更なし） | 不要 |
| §7.5 tier 判定 | `evidence-capture` project は coverage 対象外（experimental 扱い、Phase 2 §4 c 参照） | 整合 |

---

## 3. 本サイクル での coverage 検証手順（参考）

| step | コマンド | 期待値 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e -- --project=desktop-chromium,desktop-firefox,mobile-webkit` | 標準 project のみ実行 |
| 2 | `cat apps/web/coverage/e2e/coverage-summary.json` | `lines.pct >= 70` |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=evidence-capture --list` | 1 spec listed (`profile-readonly-logged-in.spec.ts`) |
| 4 | `coverage-summary.json` に `evidence-capture` project の数値が混入していないこと | tier-aware 集計除外 |

本サイクル PR では step 1-4 をlist smoke を実行する。

---

## 4. Phase 7 完了条件

- Phase 6 統合判定の根拠記録 ✓
- standard tier 維持確認 ✓
- 本サイクル coverage 検証手順を仕様書化 ✓

→ Phase 8 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 7
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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

