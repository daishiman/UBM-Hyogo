# Phase 11: 手動テスト / Evidence（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` / `phase-5.md` / `phase-6.md` / `phase-7.md` |
| 出力 | evidence 5 ファイル（pre/post snapshot 4 件 + evidence.md 1 件） |
| visualEvidence | NON_VISUAL |

---

## 1. 実行手順（runtime）

> 実 `gh api -X PUT` 実行は **ユーザー明示承認後** に行う。read-only `GET`（pre snapshot）は事前 evidence として取得可能。

### 1.1 順序

```
[gate] 3a / 3b の dev merge + 1 run 成功 + check-run 登録
   ↓
1. pre snapshot 取得（dev / main）
2. context 登録確認（lighthouse-ci / e2e-tests-coverage-gate）
3. PUT dev → post snapshot dev
4. PUT main → post snapshot main
5. drift 検証（jq クエリ全件）
6. evidence.md 生成
```

### 1.2 コマンド集

```bash
# 1) pre
mkdir -p outputs/phase-11
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-11/branch-protection-dev-pre.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-pre.json

# 2) context 登録確認
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/commits/dev --jq '.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/${HEAD_SHA}/check-runs" --paginate \
  | jq -r '.check_runs[].name' | sort -u | tee outputs/phase-11/check-runs.txt
grep -x 'lighthouse-ci' outputs/phase-11/check-runs.txt
grep -x 'e2e-tests-coverage-gate' outputs/phase-11/check-runs.txt

# 3) PUT dev（Phase 5 §4 の heredoc を実行）
# 4) post dev
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-11/branch-protection-dev-post.json

# 5) PUT main（Phase 5 §5 の heredoc を実行）
# 6) post main
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-post.json
```

---

## 2. evidence ファイル一覧

| # | ファイル | 内容 | 生成主体 |
|---|---------|------|----------|
| E-01 | `outputs/phase-11/branch-protection-dev-pre.json` | dev 適用前 snapshot | `gh api GET` |
| E-02 | `outputs/phase-11/branch-protection-dev-post.json` | dev 適用後 snapshot | `gh api GET` |
| E-03 | `outputs/phase-11/branch-protection-main-pre.json` | main 適用前 snapshot | `gh api GET` |
| E-04 | `outputs/phase-11/branch-protection-main-post.json` | main 適用後 snapshot | `gh api GET` |
| E-05 | `outputs/phase-11/branch-protection-evidence.md` | jq 検証ログ集約・AC 対応・runbook 結果 | 手動作成（テンプレ §3） |

参考補助:

| ファイル | 用途 |
|---------|------|
| `outputs/phase-11/check-runs.txt` | context 登録確認の元ログ |
| `outputs/phase-11/dev-contexts.diff` | pre/post diff（dev） |
| `outputs/phase-11/main-contexts.diff` | pre/post diff（main） |

---

## 3. `branch-protection-evidence.md` テンプレ

```markdown
# Branch Protection contexts 更新 evidence (3c)

| 項目 | 値 |
|------|----|
| 実行日時 | <YYYY-MM-DD HH:MM JST> |
| 実行者 | <gh user> |
| 親 workflow | e2e-quality-uplift-stage-3 |
| サブタスク | 3c |

## 1. 順序 gate

- 3a PR-A merge: <PR URL>
- 3b PR-B merge: <PR URL>
- 直近 dev SHA: <sha>
- check-runs に `lighthouse-ci`: ✅
- check-runs に `e2e-tests-coverage-gate`: ✅

## 2. pre snapshot

- dev: contexts = <jq -r '.required_status_checks.contexts | sort'>
- main: contexts = 同

## 3. PUT 実行ログ

- dev: HTTP <status>
- main: HTTP <status>

## 4. post drift 検証

| AC | 検証 | dev | main |
|----|------|-----|------|
| AC-05 | contexts 5 件完全一致 | ✅ | ✅ |
| AC-06 | required_pull_request_reviews=null | ✅ | ✅ |
| AC-06 | lock_branch.enabled=false | ✅ | ✅ |
| AC-06 | enforce_admins.enabled (pre と同値) | ✅ | ✅ |
| —     | strict=false | ✅ | ✅ |
| —     | required_conversation_resolution=true | ✅ | ✅ |

## 5. pre/post diff

- dev: 追加 2 件のみ（lighthouse-ci / e2e-tests-coverage-gate）
- main: 同

## 6. 残課題

- enforce_admins と CLAUDE.md governance 期待値の突合（Phase 12 で実施）
```

---

## 4. AC 検証結果（runtime 時に埋める）

| AC | 結果 | evidence 参照 |
|----|------|--------------|
| AC-05（dev） | <pending until runtime> | E-02 + jq Q-01 |
| AC-05（main） | <pending until runtime> | E-04 + jq Q-02 |
| AC-06（reviews=null）| <pending until runtime> | E-02 / E-04 + jq Q-03 |
| AC-06（lock=false） | <pending until runtime> | jq Q-04 |
| AC-06（enforce_admins drift なし） | <pending until runtime> | E-01 vs E-02 / E-03 vs E-04 比較 |

## 5. 引き継ぎ（Phase 12 へ）

| 項目 | 内容 |
|------|------|
| ドキュメント突合 | CLAUDE.md `## ブランチ戦略` / `## Governance` の `enforce_admins`・`required_pull_request_reviews=null`・`lock_branch=false` と evidence の照合 |
| evidence パス | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/` 配下 5 ファイル |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created
- evidence_state: runtime_pending

## 目的

3c の手動実行手順と evidence 5 ファイルの保存先・内容・テンプレを確定する。

## 実行タスク

- 実行順序を確定する。
- evidence 5 ファイルの命名と内容を確定する。
- evidence.md テンプレを提供する。
- AC 検証結果テーブルを提供する。

## 参照資料

- 本サブタスク phase-4.md / phase-5.md / phase-7.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-11.md

## 実行手順

1. 順序 gate を確認する。
2. pre snapshot を取得する。
3. context 登録を確認する。
4. PUT を実行する。
5. post snapshot を取得する。
6. drift 検証を実行する。
7. evidence.md を生成する。

## 統合テスト連携

- NON_VISUAL のため Playwright スクリーンショット evidence は対象外。

## 成果物

- 本 phase markdown
- evidence 5 ファイル（runtime 生成）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
