# Phase 4: テスト作成（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` / `phase-3.md` |
| 出力 | 各サブタスクの検証用テスト・dry-run コマンド・assertion 一式 |
| 起票日 | 2026-05-09 |

---

## 0. 前提確認（着手前 必須チェック）

Stage 2 が GO 判定で完了していること、および本 Stage の依存条件が解消されていることを以下手順で確認する。

| # | チェック項目 | コマンド | 期待値 |
|---|-------------|----------|--------|
| P-01 | Stage 2 完了 | `cat docs/30-workflows/e2e-quality-uplift-stage-2/index.md \| grep -E 'Phase\s+13'` | `done` 表記 |
| P-02 | `pnpm e2e` deterministic green | `gh run list --workflow=e2e-tests.yml --branch=dev --limit=3` | 直近 3 run 全て `success` |
| P-03 | line coverage 70% 到達 | Stage 2 phase-11 evidence の `coverage-summary.json` | `total.lines.pct >= 70` |
| P-04 | `dev` 現契約 contexts | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \| jq -r '.required_status_checks.contexts'` | `["ci","Validate Build","coverage-gate"]`（drift なし） |
| P-05 | `apps/web/playwright.config.ts:15-19` の reporter 現状 | `sed -n '15,19p' apps/web/playwright.config.ts` | `['html','json','list']` のみ |

> P-01〜P-03 のいずれかが NG なら本 Phase 以降を着手しない（CONDITIONAL GO 解消未達）。

---

## 1. サブタスク 3a — Lighthouse CI 検証テスト

### 1.1 構文・schema 検証（事前 dry-run）

| # | 検証 | コマンド | 期待 |
|---|------|---------|------|
| T-3a-1 | `lighthouserc.json` JSON 構文 | `jq . lighthouserc.json` | parse 成功 |
| T-3a-2 | `lighthouserc.json` schema | `pnpm exec lhci healthcheck --config=./lighthouserc.json` | exit 0 |
| T-3a-3 | workflow YAML 構文 | `actionlint .github/workflows/lighthouse.yml` | violation 0 |
| T-3a-4 | route URL 列挙の重複なし | `jq '.ci.collect.url \| length, (. \| unique \| length)' lighthouserc.json` | 4 / 4 |

### 1.2 assertion 値テスト（local autorun）

| # | 内容 | コマンド |
|---|------|---------|
| T-3a-5 | `pnpm --filter @ubm-hyogo/web build` 後 `pnpm --filter @ubm-hyogo/web start &` で localhost:3000 起動 | bash one-liner |
| T-3a-6 | `pnpm exec lhci autorun --config=./lighthouserc.json` を **localhost** で実行 | exit 0 で 4 routes 全 pass |
| T-3a-7 | 故意の閾値割れ再現（`assertions.categories:performance.minScore` を 0.99 に書換） | exit 1（assertion failure） |
| T-3a-8 | `.lighthouseci/` artifact が生成 | `ls .lighthouseci/*.html \| wc -l` ≥ 4 |

### 1.3 negative test（縮退分岐 Q-03）

| # | 内容 | 判定 |
|---|------|------|
| T-3a-9 | `/profile` 未認証時 a11y < 0.90 を観測 | lighthouserc から `/profile` を除外し 3 routes に縮退（phase-7 / phase-11 でも判定再確認） |
| T-3a-10 | redirect で `/login` に飛ぶケースの skip 設定 | `settings.skipAudits: []` のままで OK（Lighthouse は最終 URL を採用） |

---

## 2. サブタスク 3b — coverage gate 検証テスト

### 2.1 reporter swap 検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-1 | `apps/web/playwright.config.ts` reporter 配列に `monocart-reporter` 追加 | `grep -c 'monocart-reporter' apps/web/playwright.config.ts` | ≥ 1 |
| T-3b-2 | 既存 `html`/`json`/`list` 維持 | 同 grep | `html` / `json` / `list` 全て存続 |
| T-3b-3 | TypeScript 型チェック | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |

### 2.2 coverage gate dry-run

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-4 | `scripts/coverage-gate-e2e.sh` 実行（70% 達成ケース） | `bash scripts/coverage-gate-e2e.sh` | exit 0 |
| T-3b-5 | しきい値割れ再現（fixture `coverage-summary.json` で `total.lines.pct=69`） | 同 script を fixture 経由で実行 | exit 1 / `< 70` を含むログ |
| T-3b-6 | `coverage-summary.json` 不在ケース | 同 script を fresh dir で実行 | exit 1 / `coverage-summary.json not found` を含むログ |

### 2.3 critical-route smoke fail 検証

| # | 内容 | 期待 |
|---|------|------|
| T-3b-7 | `@critical-route` 付き test を意図的に fail させた fork PR で `pnpm e2e --grep @critical-route` | exit 1 |
| T-3b-8 | 全件 e2e で 1 件 fail させると workflow job が `failure` | `gh run view --log` に該当 |

### 2.4 artifact 検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-9 | coverage artifact upload | `gh run download <run-id> --name e2e-coverage-<sha>` | `coverage/lcov.info` / `coverage/summary/coverage-summary.json` 取得可 |
| T-3b-10 | 失敗時のみ HTML report upload | failure run でのみ `e2e-html-report-<sha>` が存在 | success run には不在 |

---

## 3. サブタスク 3c — branch protection 検証コマンド

### 3.1 適用前 snapshot 取得

| # | 内容 | コマンド |
|---|------|---------|
| T-3c-1 | `dev` 現状取得 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-11/branch-protection-dev-pre.json` |
| T-3c-2 | `main` 現状取得 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-pre.json` |

### 3.2 context 登録確認（**3a / 3b 適用後・3c 実行前** に必須）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3c-3 | 直近 PR の check-runs に `lighthouse-ci` 登場 | `gh api repos/daishiman/UBM-Hyogo/commits/<head-sha>/check-runs \| jq -r '.check_runs[].name' \| sort -u` | `lighthouse-ci` を含む |
| T-3c-4 | 同上に `e2e-tests-coverage-gate` 登場 | 同 | `e2e-tests-coverage-gate` を含む |

> T-3c-3 / T-3c-4 が NG のまま 3c を実行すると PR 永久 pending（BLK-03）。**この 2 件を観測してから** PUT に進む。

### 3.3 適用後 drift 検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3c-5 | `dev` contexts 包含 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \| jq -r '.required_status_checks.contexts \| sort \| .[]'` | `Validate Build` / `ci` / `coverage-gate` / `e2e-tests-coverage-gate` / `lighthouse-ci` 5 件 |
| T-3c-6 | `main` contexts 包含 | 同（`branches/main`） | 同 5 件 |
| T-3c-7 | `required_pull_request_reviews=null` | `\| jq '.required_pull_request_reviews'` | `null`（`{}` ではない） |
| T-3c-8 | `lock_branch.enabled=false` | `\| jq '.lock_branch.enabled'` | `false` |
| T-3c-9 | `enforce_admins.enabled` 既存維持 | `\| jq '.enforce_admins.enabled'` | `false`（pre-snapshot と同値） |
| T-3c-10 | `required_conversation_resolution=true` 維持 | `\| jq '.required_conversation_resolution.enabled'` | `true` |

### 3.4 rollback リハーサル

| # | 内容 | コマンド |
|---|------|---------|
| T-3c-11 | pre snapshot を再 PUT して原状復帰可能か確認 | `gh api -X PUT ... --input outputs/phase-11/branch-protection-dev-pre.json` を **drift シミュレーション環境** で確認（実 dev では行わない） |

---

## 4. テスト実行順序

```
P-01..P-05（前提）
   ↓
T-3a-1..T-3a-10（Lighthouse 単体）
   ↓
T-3b-1..T-3b-10（coverage gate 単体）
   ↓ 3a / 3b を dev にマージし PR で実 run
T-3c-1..T-3c-2（pre snapshot）
   ↓
T-3c-3..T-3c-4（context 登録確認）
   ↓
gh api PUT（dev → main）
   ↓
T-3c-5..T-3c-10（drift 検証）
```

---

## 5. exit criteria（Phase 4 完了条件）

| # | 条件 |
|---|------|
| E-01 | T-3a-1..T-3a-8 の合格期待値が phase-5 実装後に再現可能であること |
| E-02 | T-3b-1..T-3b-10 の合格期待値が phase-5 実装後に CI 実 run で再現可能であること |
| E-03 | T-3c-3..T-3c-10 が phase-11 で実観測される手順として確定していること |
| E-04 | Q-03 縮退分岐の判定タイミング（phase-7 / phase-11）が明示されていること |

---

## 6. 引き継ぎ（Phase 5 へ）

| 項目 | 内容 |
|------|------|
| 新規ファイル | `lighthouserc.json` / `.github/workflows/lighthouse.yml` / `scripts/coverage-gate-e2e.sh` |
| 編集ファイル | `apps/web/playwright.config.ts` / `apps/web/package.json` / `.github/workflows/e2e-tests.yml` |
| 依存追加 | `@lhci/cli@^0.14` / `monocart-reporter@^2` / `c8@^10`（いずれも `apps/web` devDependencies） |
| ローカル検証コマンド集 | 本 Phase §1.2 / §2.2 を Phase 5 の自己テストにそのまま流用 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 4
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
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

