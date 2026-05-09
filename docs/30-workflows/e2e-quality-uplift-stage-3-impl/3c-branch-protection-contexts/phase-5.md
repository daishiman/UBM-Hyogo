# Phase 5: 実装（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` / 親 `phase-5.md` §3 |
| 出力 | `gh api -X PUT` payload（dev / main 完全版）/ pre snapshot 取得コマンド / context 登録確認コマンド |
| implementation_mode | implementation（リモート GitHub 設定変更） |

---

## 0. 実装サマリ

| 項目 | 値 |
|------|----|
| 影響ファイル | リポジトリ内 **なし**（GitHub branch protection をリモート変更） |
| 影響リソース | `dev` / `main` の `required_status_checks.contexts` |
| evidence ファイル | `outputs/phase-11/branch-protection-{dev,main}-{pre,post}.json` / `outputs/phase-11/branch-protection-evidence.md` |
| コミット粒度 | evidence のみ commit（PR は親 Phase 13 統合 PR に含める） |

---

## 1. 順序厳守（再掲）

```
3a PR-A merge to dev → 3a workflow 1 run 成功（context 登録）
3b PR-B merge to dev → 3b workflow 1 run 成功（context 登録）
   ↓ T-3c-3 / T-3c-4 で context 登録確認
3c gh api PUT（dev → main）
```

未登録 context を required にすると **PR 永久 pending**（BLK-03）。

---

## 2. pre snapshot 取得

```bash
mkdir -p outputs/phase-11

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/branch-protection-dev-pre.json

gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/branch-protection-main-pre.json
```

妥当性確認（Phase 4 T-3c-1a / T-3c-2a）:

```bash
jq -e '.required_status_checks.contexts | length == 3' \
  outputs/phase-11/branch-protection-dev-pre.json
jq -e '.required_status_checks.contexts | length == 3' \
  outputs/phase-11/branch-protection-main-pre.json
```

---

## 3. context 登録確認（PUT 直前 必須）

```bash
# dev の最新 commit SHA を取得
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/commits/dev --jq '.sha')

# check-runs を列挙
gh api "repos/daishiman/UBM-Hyogo/commits/${HEAD_SHA}/check-runs" \
  --paginate \
  | jq -r '.check_runs[].name' | sort -u > /tmp/check-runs.txt

# 完全一致で確認
grep -x 'lighthouse-ci' /tmp/check-runs.txt
grep -x 'e2e-tests-coverage-gate' /tmp/check-runs.txt
```

両方 exit 0 でなければ **3c PUT 中止**（BLK-03 回避）。

---

## 4. 適用 payload — `dev`

> 親 phase-5.md §3.2 と整合。`enforce_admins` は GitHub branch protection REST の現行 default と pre-snapshot 値に合わせ `false` を再 PUT する（CLAUDE.md governance との突合は Phase 12）。

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON
```

直後に post snapshot を取得:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/branch-protection-dev-post.json
```

---

## 5. 適用 payload — `main`

> 親 phase-5.md §3.3 と整合。`main` は **pre snapshot を読み、`required_status_checks.contexts` のみ 5 件に置換** した payload を PUT する。それ以外（`enforce_admins` / `required_pull_request_reviews` / `lock_branch` / `required_linear_history` 等）は **取得値をそのまま再 PUT**（現状維持）。

下記は dev と同 default の場合の payload。実適用時は pre snapshot から各 field を読み出して同形にする。

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON
```

直後に post snapshot を取得:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/branch-protection-main-post.json
```

> `enforce_admins` の真値が pre snapshot で `true` だった場合は payload も `true` に揃える（drift 防止 NFR-3c-3）。

---

## 6. evidence ファイル命名（親 phase-5.md §3.4 と一致）

| 保存先 | 内容 |
|--------|------|
| `outputs/phase-11/branch-protection-dev-pre.json` | 適用前 snapshot（dev） |
| `outputs/phase-11/branch-protection-dev-post.json` | 適用後（dev） |
| `outputs/phase-11/branch-protection-main-pre.json` | 適用前 snapshot（main） |
| `outputs/phase-11/branch-protection-main-post.json` | 適用後（main） |
| `outputs/phase-11/branch-protection-evidence.md` | `jq` 検証ログ集約（Phase 11 で生成） |

---

## 7. PR 分割方針

| PR | 含む変更 |
|----|----------|
| 3c 単独 PR | **なし**（手動 `gh api` 実行 + evidence commit のみ） |
| 親 Phase 13 統合 PR | 3a + 3b + 3c の evidence + spec 群を統合 |

---

## 8. 引き継ぎ（Phase 6 へ）

| 項目 | 内容 |
|------|------|
| drift 検出スクリプトの設計 | UT-GOV-001（CLAUDE.md `## ブランチ戦略`）と整合する jq baseline を Phase 6 で確定 |
| `enforce_admins` 真値の取扱い | pre snapshot 取得時に値を確認し payload 反映 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 5
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3c の `gh api PUT` を dev / main で実行可能な完全 payload として確定し、pre/post snapshot 取得とセットで evidence 化する。

## 実行タスク

- pre snapshot 取得コマンドを確定する。
- context 登録確認コマンドを確定する。
- dev / main 両方の PUT payload を heredoc で完全に明記する。
- evidence ファイル命名を親 phase-5.md と同期させる。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-5.md §3
- 本サブタスク phase-4.md

## 実行手順

1. 順序厳守の前提（3a / 3b 完了）を確認する。
2. pre snapshot を取得する。
3. context 登録確認 grep を実行する。
4. dev → main の順で PUT する。
5. post snapshot を取得する。

## 統合テスト連携

- 実 PUT は手動。read-only 検証は Phase 4 / Phase 9 / Phase 11 で実施する。

## 成果物

- 本 phase markdown
- pre/post snapshot JSON 群（実行時生成）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
