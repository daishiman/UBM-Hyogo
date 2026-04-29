# Phase 5: 実装ランブック

> NON_VISUAL タスクのため「実装」は (a) 5 成果物を確定形に整える、(b) `gh api` 検証を実機で再現可能な手順に固定する、ことを意味する。アプリ層 (`apps/`, `packages/`) への変更はゼロ。

## ステップ概要

1. workflow / job 一覧の確定 → `workflow-job-inventory.md`
2. 確定 contexts の正本化 → `required-contexts-final.md`
3. lefthook ↔ CI の正本化 → `lefthook-ci-mapping.md`
4. 段階適用案の正本化 → `staged-rollout-plan.md`
5. strict 採否の正本化 → `strict-mode-decision.md`

各成果物は同 `outputs/phase-05/` 配下に配置する。

## 実行手順詳細

### Step 1 — workflow / job 一覧の確定

```bash
ls .github/workflows/
# → backend-ci.yml ci.yml validate-build.yml verify-indexes.yml web-cd.yml

# 各 yml を grep して name: と jobs.<key>.name を抽出
for f in .github/workflows/*.yml; do
  echo "== $f =="
  grep -E "^name:" "$f"
  grep -E "^\s{2,4}name:" "$f"
done
```

得られた一覧を `workflow-job-inventory.md` に転記する。

### Step 2 — `gh api check-runs` で実績確認

```bash
RECENT_SHA=$(gh api repos/daishiman/UBM-Hyogo/commits/main --jq '.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/${RECENT_SHA}/check-runs" --paginate \
  --jq '.check_runs[] | {name: .name, conclusion: .conclusion}'
```

`conclusion=success` で取得できた context のみを `required-contexts-final.md` に記載。

### Step 3 — lefthook / package.json の対応確認

```bash
cat lefthook.yml | grep -E "run:"
cat package.json | jq '.scripts'
```

得られた対応を `lefthook-ci-mapping.md` に転記。

### Step 4 — 段階適用案 / strict 採否の正本化

Phase 2 の 2 ファイルをコピーし Phase 5 文脈で確定形に整える。

### Step 5 — UT-GOV-001 への引き渡し点検

`required-contexts-final.md` のフルパスを UT-GOV-001 phase 仕様の入力契約欄に記載できる形式に整える。

## phase-1 cut-off（フェーズ 1 投入対象）— 3 条件 AND

確定 contexts として投入するためには以下 3 条件すべてを満たすこと。

1. `.github/workflows/` に workflow が実在する
2. `gh api check-runs` で過去 30 日以内に `conclusion=success` を 1 回以上取得
3. `<workflow>/<job>` フルパスが `gh api` 上の `name` と完全一致

3 条件 AND を満たさない context は本ランブック §Step 2 で除外し、`staged-rollout-plan.md` のフェーズ 2 リレーへ回送する。

## 5 成果物テンプレート導線

| # | 成果物 | テンプレート / 入力 |
| --- | --- | --- |
| 1 | workflow-job-inventory.md | Step 1 の grep 結果を表化 |
| 2 | required-contexts-final.md | Step 2 結果 + Phase 2 context-name-mapping.md §3 |
| 3 | lefthook-ci-mapping.md | Step 3 結果 + Phase 2 lefthook-ci-correspondence.md §1 |
| 4 | staged-rollout-plan.md | Phase 2 staged-rollout-plan.md を Phase 5 確定として再掲 |
| 5 | strict-mode-decision.md | Phase 2 §3 の判定軸を最終確定 |

## 完了基準

- [x] 5 成果物すべてが `outputs/phase-05/` に存在
- [x] phase-1 投入対象が 3 条件 AND を遵守
- [x] アプリ層変更ゼロ
