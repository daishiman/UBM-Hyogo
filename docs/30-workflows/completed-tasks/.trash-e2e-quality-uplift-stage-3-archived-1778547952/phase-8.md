# Phase 8: リファクタリング（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-7.md` |
| 出力 | `.github/workflows/` 重複削減 / reusable workflow 抽出判定 |

---

## 1. 現状の workflow 一覧（Stage 3 適用後想定）

| file | trigger | 主な step |
|------|---------|----------|
| `.github/workflows/ci.yml`（既存） | push / pull_request | typecheck + lint |
| `.github/workflows/pr-build-test.yml`（既存） | pull_request | `pnpm build` |
| `.github/workflows/coverage.yml`（既存） | pull_request | unit coverage gate |
| `.github/workflows/e2e-tests.yml`（**3b で書換**） | pull_request + workflow_dispatch | playwright + e2e coverage gate |
| `.github/workflows/lighthouse.yml`（**3a で新規**） | pull_request | build + start + lhci |
| `.github/workflows/verify-indexes.yml`（既存） | pull_request | indexes drift |

---

## 2. 重複ステップ抽出

| 重複 step | 含まれる workflow | 備考 |
|-----------|------------------|------|
| checkout + pnpm setup + node setup + `pnpm install --frozen-lockfile` | `ci` / `pr-build-test` / `coverage` / `e2e-tests` / `lighthouse` | 5 workflow 共通 |
| `pnpm --filter @ubm-hyogo/web build` | `pr-build-test` / `lighthouse` | 2 workflow |
| `pnpm --filter @ubm-hyogo/web start &` + `wait-on` | `lighthouse` のみ | 単独 |

---

## 3. reusable workflow 抽出可否判定

### 3.1 候補 A: `.github/workflows/_setup-node-pnpm.yml`（reusable）

| 項目 | 値 |
|------|----|
| 効果 | 5 workflow × ≈8 行の boilerplate 削減 |
| コスト | reusable workflow の input 設計 + 全 workflow の `uses:` 書換 |
| 副作用 | `cache: pnpm` の hash key が変化 → cache 失効リスク |
| **判定** | **見送り**（Stage 3 スコープ外。Stage 4 以降の品質改善 backlog に登録） |

### 3.2 候補 B: `lighthouse.yml` と `e2e-tests.yml` の build step 共有

| 項目 | 値 |
|------|----|
| 効果 | build を 1 job 化し 2 workflow が `needs: build` で受ける形に再構成 |
| コスト | `actions/upload-artifact` で build output を引き渡す必要・workflow 構造の大幅再設計 |
| 副作用 | concurrency group / cache / artifact 上限とのバランス再検討 |
| **判定** | **見送り**（Stage 3 のミニマルゴール「hard gate 化」に対しオーバーキル） |

### 3.3 候補 C: composite action `actions/setup-project`

| 項目 | 値 |
|------|----|
| 効果 | 候補 A と同等 |
| コスト | composite action は `.github/actions/setup-project/action.yml` 単一 file で済む |
| **判定** | **Stage 4 backlog 登録**（Stage 3 では見送り） |

---

## 4. Stage 3 内で実施する軽微整理

| # | 対象 | 内容 |
|---|------|------|
| R-01 | `.github/workflows/lighthouse.yml` / `.github/workflows/e2e-tests.yml` の `name:` / `jobs.<id>.name:` | branch protection context と完全一致を再確認（タイポは BLK-03 を発動） |
| R-02 | `concurrency.group` の命名規則 | `<workflow-id>-${{ github.ref }}` に統一（`lighthouse-${{ github.ref }}` / `e2e-${{ github.ref }}`） |
| R-03 | `timeout-minutes` 値 | lighthouse=15 / e2e=30 で固定（CI minute budget §1.2 の試算根拠） |
| R-04 | `actions/upload-artifact@v4` の `retention-days` | coverage=14 / lhci=7 / html=7 / monocart=7 で統一 |
| R-05 | `pnpm/action-setup@v4` の `version` 値 | `10.33.2`（CLAUDE.md / `.mise.toml` 正本） |
| R-06 | `actions/setup-node@v4` の `node-version` 値 | `24.15.0`（同上） |

> R-01〜R-06 は **新規ファイル内で初回から正しく書く** 性質のもので、別途リファクタコミットは発生しない。

---

## 5. Stage 4 以降への refactor backlog

| ID | 内容 | 優先 |
|----|------|------|
| RB-01 | composite action `setup-project`（候補 C） | mid |
| RB-02 | `lighthouse` / `e2e-tests` の build 共有（候補 B） | low |
| RB-03 | `paths` filter による docs-only PR の skip 戦略確立（dummy job pattern） | mid |
| RB-04 | merge queue 導入時の `required_status_checks.strict=true` 移行 | low |

---

## 6. 終了基準

| # | 条件 |
|---|------|
| EX-01 | R-01..R-06 全て Stage 3 PR 内で適用済 |
| EX-02 | RB-01..RB-04 が Stage 4 backlog として `docs/30-workflows/` 配下のどこかに記録（phase-12 で対応） |
| EX-03 | Stage 3 の workflow 群に対し他 workflow の break が起きていない（`actionlint` パス） |

---

## 7. 引き継ぎ（Phase 9 へ）

| 項目 | 内容 |
|------|------|
| Phase 9 検証対象 | YAML 構文 / token 列挙 / secret leak 静的検査 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 3 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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
- [x] coverage AC 適用: E2E tier-aware standard lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

