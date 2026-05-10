# Phase 11: 手動テスト / 受入 evidence（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-10.md` GO 判定 |
| 出力 | draft PR 実 run 観測 / Lighthouse 4 routes 実測 / branch protection 適用 evidence |
| 保存先 | `outputs/phase-11/` |

---

## 1. 手動テスト全体フロー

```
Step A: PR-A draft 作成（lighthouse.yml + lighthouserc.json）
   ↓ run 観測
Step B: PR-A merge to dev
   ↓
Step C: PR-B draft 作成（e2e-tests.yml + reporter swap + coverage gate）
   ↓ run 観測（coverage >= 80 確認）
Step D: PR-B merge to dev
   ↓
Step E: dev で 1 PR 上で両 context 登録確認（gh api check-runs）
   ↓
Step F: branch protection PUT（dev → main）
   ↓
Step G: 適用後 drift 検証 + evidence 保存
```

---

## 2. Step A — PR-A 観測（Lighthouse CI）

| # | 操作 | evidence 保存先 |
|---|------|----------------|
| A-01 | PR-A を `feat/lighthouse-ci` で `dev` 向け draft 作成 | PR URL を `outputs/phase-11/pr-a-url.txt` |
| A-02 | `lighthouse-ci` job が実行され green | `gh run view <run-id> --log > outputs/phase-11/pr-a-lighthouse.log` |
| A-03 | 4 routes 実測スコア取得 | `outputs/phase-11/lhci-scores.json`（lhci report からスコア部分を抽出） |
| A-04 | スクリーンショット（lhci report HTML を Chrome で開いた状態） | `outputs/phase-11/lhci-report-{root,members,profile,login}.png` |
| A-05 | Q-02 判定（`/profile` a11y >= 0.90 か） | 子 workflow 3a の `outputs/phase-7/lhci-profile-q02-judgement.md` を local pre-judgment とし、PR runtime 判定は 3a `outputs/phase-11/lhci-profile-q02-judgement.md` に保存 |

### 2.1 期待実測（参考レンジ）

| route | perf | a11y | best-practices | seo |
|-------|------|------|----------------|-----|
| `/` | >= 0.80 | >= 0.90 | >= 0.90 | >= 0.80 |
| `/members` | >= 0.80 | >= 0.90 | >= 0.90 | >= 0.80 |
| `/profile` | >= 0.80 | **判定対象** | >= 0.90 | >= 0.80 |
| `/login` | >= 0.80 | >= 0.90 | >= 0.90 | >= 0.80 |

> Q-03 で `/profile` a11y < 0.90 が観測された場合、`lighthouserc.json` から `/profile` を削除し PR-A を fixup commit で更新する。

---

## 3. Step C — PR-B 観測（e2e + coverage gate）

| # | 操作 | evidence 保存先 |
|---|------|----------------|
| C-01 | PR-B を `feat/e2e-coverage-gate` で `dev` 向け draft 作成 | `outputs/phase-11/pr-b-url.txt` |
| C-02 | `e2e-tests-coverage-gate` job 実行 + green | `outputs/phase-11/pr-b-e2e-run.txt` |
| C-03 | `coverage-summary.json` 取得（line >= 80 確認） | `outputs/phase-11/coverage-summary.json` |
| C-04 | `monocart-reporter` artifact 取得 | `outputs/phase-11/e2e-monocart/index.html` |
| C-05 | 故意 fail 再現（local branch で coverage 落とし fail を一度観測 → revert） | `outputs/phase-11/coverage-gate-failure-evidence.md` |

---

## 4. Step E — context 登録確認（BLK-03 解消）

PR-A / PR-B が `dev` に merge され、それぞれの workflow が **少なくとも 1 回 success run を観測** した直後に実行する。

```bash
# 直近 dev HEAD の check-runs を取得
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/branches/dev | jq -r '.commit.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/$HEAD_SHA/check-runs" \
  | jq -r '.check_runs[].name' \
  | sort -u \
  > outputs/phase-11/registered-contexts.txt
```

期待:

| 行 | 内容 |
|----|------|
| `Validate Build` | 既存 |
| `ci` | 既存 |
| `coverage-gate` | 既存 |
| `e2e-tests-coverage-gate` | **3b 新規** |
| `lighthouse-ci` | **3a 新規** |

5 行揃って初めて Step F へ進む。揃わない場合は Step F を**実行しない**（PR 永久 pending を防ぐ）。

---

## 5. Step F — branch protection 適用

### 5.1 pre-snapshot 取得

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-11/branch-protection-dev-pre.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-pre.json
```

### 5.2 PUT 実行（dev → main の順）

phase-5 §3.2 / §3.3 の payload を使用。`main` の payload は pre-snapshot から `required_status_checks.contexts` のみ 5 件に置換して生成する。

### 5.3 post-snapshot 取得

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-11/branch-protection-dev-post.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-post.json
```

### 5.4 drift 検証（phase-4 T-3c-5..T-3c-10）

```bash
for branch in dev main; do
  echo "=== $branch ==="
  jq -r '.required_status_checks.contexts | sort | .[]' outputs/phase-11/branch-protection-$branch-post.json
  jq '.required_pull_request_reviews, .lock_branch.enabled, .enforce_admins.enabled, .required_conversation_resolution.enabled' \
     outputs/phase-11/branch-protection-$branch-post.json
done > outputs/phase-11/branch-protection-drift-check.log
```

期待値:

| key | dev | main |
|-----|-----|------|
| contexts (sorted) | `Validate Build`, `ci`, `coverage-gate`, `e2e-tests-coverage-gate`, `lighthouse-ci` | 同上 |
| `required_pull_request_reviews` | `null` | `null` |
| `lock_branch.enabled` | `false` | `false` |
| `enforce_admins.enabled` | `false`（pre と同値） | `false`（pre と同値） |
| `required_conversation_resolution.enabled` | `true` | `true` |

---

## 6. evidence 一覧（保存ファイル）

| path | 内容 |
|------|------|
| `outputs/phase-11/pr-a-url.txt` | PR-A URL |
| `outputs/phase-11/pr-a-lighthouse.log` | Lighthouse run log |
| `outputs/phase-11/lhci-scores.json` | 4 routes 実測スコア |
| `outputs/phase-11/lhci-report-*.png` | Lighthouse report スクリーンショット ×4（縮退時 ×3） |
| `outputs/phase-11/lhci-profile-q03-judgement.md` | Q-03 縮退判定 |
| `outputs/phase-11/pr-b-url.txt` | PR-B URL |
| `outputs/phase-11/pr-b-e2e-run.txt` | e2e run metadata / URL / conclusion |
| `outputs/phase-11/coverage-summary.json` | line coverage summary |
| `outputs/phase-11/e2e-monocart/index.html` | monocart report |
| `outputs/phase-11/coverage-gate-failure-evidence.md` | 故意 fail 再現の記録 |
| `outputs/phase-11/registered-contexts.txt` | check-runs 名一覧 |
| `outputs/phase-11/branch-protection-{dev,main}-{pre,post}.json` | snapshot ×4 |
| `outputs/phase-11/branch-protection-drift-check.log` | 適用後検証ログ |
| `outputs/phase-11/branch-protection-evidence.md` | 上記の人間可読サマリ |

---

## 7. rollback 手順

問題発生時は pre-snapshot を再 PUT で原状復帰。

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  --input outputs/phase-11/branch-protection-dev-pre.json
```

> `required_pull_request_reviews=null` が `gh api` の入力 schema と整合しない場合は、`null` フィールドを除去せずに payload を整形する `jq -c '.'` で再 PUT する。

---

## 8. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Step A..D 全て green run |
| EX-02 | Step E で 5 contexts 揃って観測 |
| EX-03 | Step F PUT が dev → main の順で成功 |
| EX-04 | Step G drift check log で全期待値 pass |
| EX-05 | evidence ファイル §6 が全件揃う |

---

## 9. 引き継ぎ（Phase 12 へ）

| 項目 | 内容 |
|------|------|
| Phase 12 タスク | CLAUDE.md branch protection 仕様更新 / LOGS.md ×2 / topic-map / Stage 1〜5 完了表記 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 11
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
