# Phase 12: ドキュメント更新（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` 完了 evidence |
| 出力 | CLAUDE.md branch protection 仕様 / LOGS.md ×2 / topic-map / Task 1〜5 完了表記 |

---

## 1. CLAUDE.md 更新

### 1.1 対象セクション

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/CLAUDE.md` の「ブランチ戦略」/「Governance / CODEOWNERS」セクションに **branch protection contexts の正本表記**を追加する。

### 1.2 追記内容（差分概要）

| 既存 | 追記 |
|------|------|
| 「品質保証は CI（`required_status_checks`）」 | 表で `required_status_checks.contexts` の正本 5 件を列挙 |
| なし | `required_status_checks.contexts` 正本表 |

追記表の内容:

| context | 由来 workflow | 適用ブランチ |
|---------|--------------|-------------|
| `ci` | `.github/workflows/ci.yml` | dev / main |
| `Validate Build` | `.github/workflows/pr-build-test.yml` | dev / main |
| `coverage-gate` | `.github/workflows/coverage.yml` | dev / main |
| `lighthouse-ci` | `.github/workflows/lighthouse.yml` | dev / main |
| `e2e-tests-coverage-gate` | `.github/workflows/e2e-tests.yml` | dev / main |

> 正本は GitHub branch protection 実値。CLAUDE.md は運用参照。drift 検出は `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection \| jq '.required_status_checks.contexts'` で実施。

### 1.3 不変条件 §「重要な不変条件」への追記

なし（既存項目に変更なし）。

---

## 2. LOGS.md 更新（2 ファイル）

### 2.1 対象ファイル

| path | 内容 |
|------|------|
| `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/LOGS.md`（新規） | Stage 3 完了ログ |
| `docs/30-workflows/LOGS.md`（既存） | workflow 群横断ログ。Stage 3 完了 1 行を追記 |

### 2.2 `e2e-quality-uplift-stage-3/LOGS.md` 構造

| section | 内容 |
|---------|------|
| Header | `# Stage 3 LOGS` / 完了日 / base branch |
| 1. 完了サブタスク | 3a / 3b / 3c の chronological 実行ログ（PR-A merge / PR-B merge / gh api PUT） |
| 2. 実測スコア | Lighthouse 4 routes（または Q-03 縮退時 3 routes）/ coverage line pct |
| 3. drift check 結果 | branch-protection-drift-check.log の要約 |
| 4. 残課題 | OBS-01 / OBS-02 / RB-01..RB-04 の引き取り先 |

### 2.3 `30-workflows/LOGS.md` への 1 行追記

```
- 2026-05-09 e2e-quality-uplift-stage-3 完了 — lighthouse-ci / e2e-tests-coverage-gate を dev/main の required_status_checks.contexts に追加 / coverage line >=70 hard gate / lhci 4 routes assertion
```

---

## 3. topic-map 更新

### 3.1 対象ファイル

`.claude/skills/aiworkflow-requirements/indexes/topic-map.json`（または `topic-map.md`、実装に従う）。

### 3.2 追記 entry

| topic | references |
|-------|-----------|
| `branch-protection-contexts` | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-11.md`, `CLAUDE.md#governance--codeowners` |
| `lighthouse-ci` | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-2.md`, `lighthouserc.json`, `.github/workflows/lighthouse.yml` |
| `e2e-coverage-gate` | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-5.md`, `scripts/coverage-gate-e2e.sh`, `.github/workflows/e2e-tests.yml` |
| `monocart-reporter` | `apps/web/playwright.config.ts:15-19`, `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-2.md` |

### 3.3 indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
```

CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が pass することを確認。

---

## 4. Stage 1〜5 完了表記

### 4.1 対象

`docs/30-workflows/e2e-quality-uplift/` ルート（umbrella workflow）または `index.md`。Stage 1〜5 全完了表記をテーブルで反映。

### 4.2 想定 Stage 一覧

| Stage | 内容 | 完了状況 |
|-------|------|---------|
| 0 | 基盤 / inventory | done |
| 1 | E2E test 基盤整備 | done |
| 2 | coverage 70% 達成 + critical-route smoke | done（Stage 3 前提） |
| 3 | hard CI gate + lighthouse + branch protection | **本 Stage で done** |
| 4 | （Stage 4 が定義されていれば）reusable workflow / composite action | backlog |
| 5 | （同上）merge queue 移行 | backlog |

> Stage 4 / 5 が現時点で未定義の場合は、`docs/30-workflows/e2e-quality-uplift/backlog.md` に RB-01..RB-04 を新規 entry として記載する。実体ファイル不在の場合は phase-12 で新規作成する（本 Stage の責務範囲内）。

---

## 5. RB-01..RB-04 backlog 記録

`docs/30-workflows/e2e-quality-uplift/backlog.md`（新規 or 既存）に以下を追記:

| ID | 内容 | 優先 |
|----|------|------|
| RB-01 | composite action `setup-project` | mid |
| RB-02 | `lighthouse` / `e2e-tests` build 共有 | low |
| RB-03 | `paths` filter による docs-only PR skip 戦略（dummy job pattern） | mid |
| RB-04 | merge queue 導入 + `required_status_checks.strict=true` | low |
| OBS-01 | `enforce_admins=false` drift 是正 | mid（governance drift workflow） |
| OBS-02 | `required_linear_history=false` 是正 | low |

---

## 6. 更新コミット粒度

| commit | 内容 |
|--------|------|
| C1 | `CLAUDE.md` branch protection 仕様追記 |
| C2 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/LOGS.md` 新規 + `docs/30-workflows/LOGS.md` 追記 |
| C3 | `topic-map` 更新 + `pnpm indexes:rebuild` 反映分 |
| C4 | `docs/30-workflows/e2e-quality-uplift/index.md`（or umbrella）に Stage 1〜5 完了表記 |
| C5 | `docs/30-workflows/e2e-quality-uplift/backlog.md` 新規/追記 |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | CLAUDE.md に contexts 正本表が追記されている |
| EX-02 | `e2e-quality-uplift-stage-3/LOGS.md` 新規 + `30-workflows/LOGS.md` 追記が完了 |
| EX-03 | `topic-map` 更新 + `verify-indexes-up-to-date` pass |
| EX-04 | umbrella workflow に Stage 1〜5 完了表記が反映 |
| EX-05 | backlog に RB-01..RB-04 / OBS-01..OBS-02 が記載 |

---

## 8. 引き継ぎ（Phase 13 へ）

| 項目 | 内容 |
|------|------|
| Phase 13 入力 | 全 phase 完了 + evidence + ドキュメント更新 |
| PR base | `dev` |
| 含む変更 | spec 群 + 実装ファイル + evidence + LOGS.md + CLAUDE.md + topic-map |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 12
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

