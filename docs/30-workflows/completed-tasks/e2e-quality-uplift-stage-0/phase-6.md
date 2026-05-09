# Phase 6: テスト拡充（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

> Stage 0 は implementation（NON_VISUAL）。実 spec 追加は伴わないため、本 phase は **fail path 検出 grep / 回帰 guard / 補助 command** を仕様書として確定する。実コマンド実行は本サイクル で扱う。

---

## 1. fail path 検出（仕様書 grep）

| FP ID | 検証内容 | コマンド | fail 時の意味 |
| --- | --- | --- | --- |
| FP-1 | README に `un-skip` 章が落ちる | `grep -q "un-skip" apps/web/playwright/README.md` | §7.1 (4) 不変条件への導線が消失 |
| FP-2 | README に critical route smoke が 4 項目未満 | `grep -cE "^- (認証導線\|public visitor\|admin destructive\|申請承認)" apps/web/playwright/README.md` | smoke の覆い漏れ |
| FP-3 | stale comment 復活 | `grep -rn "Phase 11 manual smoke で test.describe.skip" apps/web/playwright/tests/` | merge accident で comment 戻り |
| FP-4 | quality-gates.md §7.1 (4) から例外条項消失 | `grep -q "evidence-capture" .claude/skills/task-specification-creator/references/quality-gates.md` | 例外正本欠落 |
| FP-5 | playwright.config.ts に `evidence-capture` project が無い | `grep -q "evidence-capture" apps/web/playwright.config.ts` | runtime 例外条項と実態の drift |
| FP-6 | `profile-readonly-logged-in.spec.ts` 不在 | `test -f apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` | spec split 未完 |
| FP-7 | `pnpm e2e` script に project filter 明示なし | `grep -E "playwright test.*--project=desktop" apps/web/package.json` | `evidence-capture` が誤実行される |

> FP-3〜FP-7 は本サイクルで Green 化される。本サイクルでは FP-3 のみ「現状 2 hit」が確認できる（実 edit 前）。

---

## 2. 回帰 guard（CI に追加する仕様、本サイクル）

| guard ID | 種別 | 実装場所 | 失敗閾値 |
| --- | --- | --- | --- |
| RG-S0-A | grep gate | `.github/workflows/verify-design-tokens.yml` の隣に新 job（本サイクル） | FP-3 が 1 hit 以上で fail |
| RG-S0-B | docs link check | 既存 `verify-indexes-up-to-date` の延長 | README から quality-gates.md への相対 link 解決失敗で fail |
| RG-S0-C | playwright `--list` smoke | CI で `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=evidence-capture` | 0 spec listed なら fail |

本サイクル PR では CI workflow を追加しない。仕様書として記録するに留める。

---

## 3. 補助 command（開発者 / Claude Code 用）

| 用途 | コマンド | 想定実行頻度 |
| --- | --- | --- |
| README 整合 grep（local） | `grep -nE "^## " apps/web/playwright/README.md` | README edit 時 |
| stale comment 一括検出 | `grep -rn "Phase 11 manual smoke" apps/web/playwright/` | 月次 |
| 例外条項存在確認 | `grep -n "evidence-capture" .claude/skills/task-specification-creator/references/quality-gates.md` | skill edit PR 前 |
| evidence-capture project listing | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=evidence-capture` | 本サイクル の Phase 11 evidence |
| 標準 project listing | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=desktop-chromium` | regression check |

---

## 4. Phase 7 統合可否判定（NON_VISUAL）

| 判定軸 | 結果 |
| --- | --- |
| Stage 0 task classification | implementation（NON_VISUAL） |
| 新規実コード | 0 行（本サイクル） |
| coverage gate 直接適用 | 弱い（docs は coverage instrumentation 対象外） |
| Phase 7 で確認すべき instrument | grep gate / link check のみ（Phase 6 で網羅済） |
| **判定** | **Phase 6 統合可** — Phase 7 を独立章として持たず、Phase 6 の延長で扱う |

→ Phase 7 ファイルは作成するが、内容は「統合判定根拠と coverage 取得不要の justification」のみとする。

---

## 5. テストデータ / fixture の補強

implementation サイクルのため fixture / mock の追加なし。既存:

| fixture | 補強内容 |
| --- | --- |
| `memberPage` / `adminPage` | README §5 で公開 API 化を docs に明記するのみ |
| `EVIDENCE_DIR` 定数 | README §6 で artifact path 案内（コード変更なし） |

---

## 6. Phase 6 完了条件

- FP-1〜FP-7 の grep gate 仕様確定 ✓
- 回帰 guard 3 件の実装場所確定（本サイクル） ✓
- 補助 command 5 件文書化 ✓
- Phase 7 統合可判定 ✓

→ Phase 7 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 6
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

