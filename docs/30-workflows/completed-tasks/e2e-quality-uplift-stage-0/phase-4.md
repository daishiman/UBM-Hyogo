# Phase 4: テスト作成（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

> Stage 0 は `implementation` 分類のため、TDD Red phase で生成する成果物は「実 spec」ではなく「仕様書 grep gate」と「validation script」になる。実コード edit は同一サイクルで実施する前提を Phase 1-3 で確定済。

---

## 0. R1 確定（Phase 3 引き継ぎ事項）

| 項目 | 確定値 |
| --- | --- |
| R1: `profile-readonly.spec.ts` evidence 専用性の明確化方針 | **案 A: evidence-only spec rename/extract**（Phase 3 推奨案を実態に合わせて補正） |
| 確定日 | 2026-05-09 |
| 確定根拠 | (1) `testMatch` を spec ファイル単位で書ける既存 config 慣例、(2) coverage merge 時の二重計上回避、(3) tag 駆動 (`grep`) より静的解析しやすい |
| rename/extract 後のファイル | `profile-readonly.spec.ts` は削除／ `profile-readonly-logged-in.spec.ts`（`evidence-capture` project 専用、新規作成） |
| 影響 | Phase 5 の inventory に「`profile-readonly-logged-in.spec.ts` 新規」を 1 件追加。実 edit は同一サイクル |

---

## 1. TDD Red 設計（implementation 版）

実コードを書かないため Red 相当の検証は **grep gate**（章見出し / stale 文字列 / 例外文面の存在 or 不存在）に置き換える。

| Red gate ID | 種別 | コマンド（本サイクル想定） | 期待値（Red→Green） |
| --- | --- | --- | --- |
| RG-1 | 章見出し存在 | `grep -nE "^## " apps/web/playwright/README.md` | Red: file 不在 → Green: 7 章見出し検出 |
| RG-2 | un-skip 不変条件記述 | `grep -n "un-skip" apps/web/playwright/README.md` | Red: 0 hit → Green: 1 hit 以上 |
| RG-3 | coverageTier 明示 | `grep -n "coverageTier: standard" apps/web/playwright/README.md` | Red: 0 → Green: 1 |
| RG-4 | mise exec 1 行 | `grep -n "mise exec -- pnpm" apps/web/playwright/README.md` | Red: 0 → Green: 1 以上 |
| RG-5 | critical route smoke 4 項目 | `grep -cE "^- (認証導線\|public visitor\|admin destructive\|申請承認)" apps/web/playwright/README.md` | Red: 0 → Green: 4 |
| RG-6 | auth fixture 章 | `grep -n "memberPage\|adminPage" apps/web/playwright/README.md` | Red: 0 → Green: 2 hit 以上 |
| RG-7 | stale comment 不存在 | `grep -rn "Phase 11 manual smoke で test.describe.skip" apps/web/playwright/tests/` | Red: 2 hit → Green: 0 hit |
| RG-8 | quality-gates 例外追記 | `grep -n "evidence-capture" .claude/skills/task-specification-creator/references/quality-gates.md` | Red: 0 → Green: 1 以上 |
| RG-9 | playwright config 新 project | `grep -n "evidence-capture" apps/web/playwright.config.ts` | Red: 0 → Green: 1 以上 |
| RG-10 | spec split 完了 | `ls apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` | Red: ENOENT → Green: file exist |

> 本サイクルは Phase 5 で実ファイルを更新するため、RG-1〜RG-10 を Green 化する。

---

## 2. targeted test file list（SIGKILL 回避）

`task-specification-creator` skill の SIGKILL 防止規約に従い、テスト実行対象を明示する。

| カテゴリ | path | 本サイクル実行 | 本サイクル実行 |
| --- | --- | --- | --- |
| docs grep（L1） | `apps/web/playwright/README.md` | × (file 未作成) | ○ |
| docs grep（L1） | `.claude/skills/task-specification-creator/references/quality-gates.md` | ○（既 modified の verify） | ○ |
| stale grep（L2） | `apps/web/playwright/tests/profile-{visibility,delete}-request.spec.ts` | × | ○ |
| Playwright `--list`（L3） | `apps/web/playwright.config.ts` driven | × | ○（`--project=evidence-capture` で 1 spec listed） |

**implementation サイクルの本ステージで実行するのは 0 件**。本サイクルで `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list` を回し RG-9 / RG-10 を Green 化する。

---

## 3. 命名規則整合検証

| 規則 | 対象 | 検証方法 | 結果 |
| --- | --- | --- | --- |
| spec ファイルは kebab-case + `.spec.ts` | `profile-readonly-logged-in.spec.ts`（新規） | 既存 spec 群と並べた visual diff | OK |
| Playwright project 名は kebab-case | `evidence-capture` | `apps/web/playwright.config.ts:28-46` の既存 `desktop-chromium` 等と整合 | OK |
| docs ディレクトリ kebab-case | `e2e-quality-uplift-stage-0` | `docs/30-workflows/` の既存命名 | OK |
| README 章番号は `^## N\. ` | 7 章 | RG-1 grep | 期待値定義済 |
| env 名は SCREAMING_SNAKE_CASE | `PROFILE_EVIDENCE_STORAGE_STATE` | 既存 spec 内 env 命名と整合 | OK |

ドリフトなし。

---

## 4. private method テスト方針

Stage 0 は implementation であり、`apps/web/playwright/` 配下に new な private method / helper を生やさない。`fixtures/auth.ts` の `memberPage` / `adminPage` は既に export されており、README で「公開 fixture」として扱う。

| 種別 | 方針 |
| --- | --- |
| private helper の追加 | しない（CONST_007 単一サイクルスコープ） |
| 既存 private helper の test | しない（既存 spec 群の current coverage に委ねる） |
| README で言及する API は public のみ | `memberPage` / `adminPage` / `EVIDENCE_DIR` 定数 |

---

## 5. 依存関係整合チェック

| 依存先 | バージョン / commit | 整合性 |
| --- | --- | --- |
| `@playwright/test` | `apps/web/package.json` 既存 | 変更なし |
| `quality-gates.md` §7 / §7.5 | 現 worktree で modified（tier-aware 化済） | 整合（Phase 1 §P50 で確認済） |
| skill `task-specification-creator` references | 本サイクルで触らない | 整合 |
| 上流 PR #594 | merged into `dev` | 整合（前提） |
| Stage 1 以降 | §7.1 例外リスト追記に依存 | downstream OK（Stage 1 は本サイクル以降） |

---

## 6. テストデータ / fixture 設計

implementation サイクルのため fixture 追加なし。README で参照する既存 fixture のみ列挙:

| fixture | path | README での扱い |
| --- | --- | --- |
| `memberPage` | `apps/web/playwright/fixtures/auth.ts` | §5 で 3-5 行解説 |
| `adminPage` | 同上 | §5 で 3-5 行解説 |
| `storageState`（PROFILE_EVIDENCE_STORAGE_STATE 経路） | env 駆動 | §5 末尾で 1 段落 |

---

## 7. Phase 4 完了条件

- R1 確定（案 A: evidence-only spec rename/extract） ✓
- RG-1〜RG-10 の grep 期待値定義 ✓
- targeted test file list 明示 ✓
- 命名規則整合確認 ✓
- 依存関係 drift なし ✓

→ Phase 5 着手可。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 4
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
