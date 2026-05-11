# Phase 6: テスト拡充（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` / `phase-5.md` |
| 出力 | drift 検出スクリプト設計 / UT-GOV-001 と整合する baseline 定義 |

---

## 1. drift 検出スクリプト設計

CLAUDE.md `## ブランチ戦略` UT-GOV-001 に準拠する drift 検出ロジックを定義する。スクリプトファイル化は Phase 8 のリファクタリング判断対象とし、本 Phase ではロジックを仕様として確定する。

### 1.1 baseline（期待値表）

| field | dev 期待値 | main 期待値 |
|-------|------------|-------------|
| `required_status_checks.strict` | `false` | `false` |
| `required_status_checks.contexts`（sort 後） | `["Validate Build","ci","coverage-gate","e2e-tests-coverage-gate","lighthouse-ci"]` | 同左 |
| `required_status_checks.contexts \| length` | `5` | `5` |
| `required_pull_request_reviews` | `null` | `null` |
| `lock_branch.enabled` | `false` | `false` |
| `enforce_admins.enabled` | pre-snapshot 値（drift なし） | pre-snapshot 値 |
| `required_conversation_resolution.enabled` | `true` | `true` |
| `required_linear_history.enabled` | pre-snapshot 値 | pre-snapshot 値 |
| `allow_force_pushes.enabled` | `false` | `false` |
| `allow_deletions.enabled` | `false` | `false` |

### 1.2 検出ロジック（疑似コード）

```bash
#!/usr/bin/env bash
# drift-check（仕様）。実スクリプト化は Phase 8 で判断。
set -euo pipefail
BRANCH="$1"  # dev | main
POST="outputs/phase-11/branch-protection-${BRANCH}-post.json"

# 1. contexts 完全一致
expected='["Validate Build","ci","coverage-gate","e2e-tests-coverage-gate","lighthouse-ci"]'
actual=$(jq -c '.required_status_checks.contexts | sort' "$POST")
[ "$actual" = "$expected" ] || { echo "::error::contexts drift on $BRANCH: $actual"; exit 1; }

# 2. solo dev policy
[ "$(jq '.required_pull_request_reviews' "$POST")" = "null" ] \
  || { echo "::error::required_pull_request_reviews drift on $BRANCH"; exit 1; }

# 3. lock_branch
[ "$(jq '.lock_branch.enabled' "$POST")" = "false" ] \
  || { echo "::error::lock_branch drift on $BRANCH"; exit 1; }

# 4. conversation resolution
[ "$(jq '.required_conversation_resolution.enabled' "$POST")" = "true" ] \
  || { echo "::error::required_conversation_resolution drift on $BRANCH"; exit 1; }

# 5. strict
[ "$(jq '.required_status_checks.strict' "$POST")" = "false" ] \
  || { echo "::error::required_status_checks.strict drift on $BRANCH"; exit 1; }

echo "::notice::drift-check OK on $BRANCH"
```

### 1.3 enforce_admins の特例

CLAUDE.md governance では `enforce_admins=true` 期待だが、API default で `false` の場合がある。本仕様では:

- pre snapshot 値を `true_value` とし
- post snapshot が `true_value` と一致することを「drift なし」と定義
- CLAUDE.md governance 期待値（`true`）との突合は Phase 12 のドキュメント整合確認で実施

## 2. CI gate との関係（参考）

`verify-indexes-up-to-date` と同様の baseline 検証 gate を branch protection についても CI で常時走らせる構想は **本タスクのスコープ外**。本 Phase は手動 evidence 検証の baseline 定義に留める。

## 3. 拡充された E2E 観点（CONST_007 single cycle）

| 観点 | 検証 |
|------|------|
| dev / main 両方の post で baseline 一致 | §1.2 を 2 回実行 |
| pre/post diff が「追加 2 件のみ」 | Phase 4 §4 の `diff` で確認 |
| solo dev policy 不変 | jq Q-3c-D / Q-3c-E |

## 4. 引き継ぎ（Phase 7 へ）

| 項目 | 内容 |
|------|------|
| coverage 観点 | NON_VISUAL のため evidence ファイル完備チェックで代替 |
| baseline | §1.1 を Phase 7 / Phase 9 / Phase 11 で再利用 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 6
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

drift 検出ロジックを baseline 表 + 疑似スクリプトとして確定し、CLAUDE.md UT-GOV-001 と整合させる。

## 実行タスク

- baseline 期待値表を作成する。
- drift 検出疑似スクリプトを作成する。
- enforce_admins 特例ハンドリングを文書化する。

## 参照資料

- CLAUDE.md `## ブランチ戦略`（UT-GOV-001）
- 本サブタスク phase-4.md / phase-5.md

## 実行手順

1. 親 workflow の現行 contexts を確認する。
2. baseline 表を作成する。
3. drift 検出疑似スクリプトを作成する。

## 統合テスト連携

- NON_VISUAL phase は evidence ファイルでの再現性検証で代替する。

## 成果物

- 本 phase markdown
- baseline 表 / 疑似スクリプト

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
