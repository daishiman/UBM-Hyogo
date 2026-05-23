# Phase 8: リファクタリング（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-5.md` / `phase-6.md` |
| 出力 | payload 配信方式の最終判断 / 重複 payload の DRY 化方針 |

---

## 1. payload 配信方式の比較（再評価）

Phase 2 §4 の選択肢を Phase 5 実装結果を踏まえ再評価する。

| 観点 | A: heredoc inline | B: JSON file（`--input`） |
|------|------------------|---------------------------|
| 仕様書からの逐語コピペ容易性 | ◎ | ○ |
| dev / main 両方を扱う際の重複 | △（同 JSON を 2 度書く） | ◎（1 ファイル参照） |
| field 値の動的化（pre snapshot から取り回す） | △（heredoc 中の置換が煩雑） | ◎（jq で生成可能） |
| evidence への混入懸念 | ○（仕様書に値が露出のみ） | ○（payload file を commit する場合は値を git に残す） |
| 1Password / secrets の混入リスク | なし（値は public 設定のみ） | なし（同上） |

## 2. 採用判断

**heredoc inline 方式（A）を最終採用**。理由:

1. payload 内容は完全に public な設定値であり、シークレット混入リスクなし
2. `dev` と `main` で **`required_status_checks.contexts` 以外は同一 default** に揃える方針のため、重複コストは小さい
3. `enforce_admins` 等の field 値は pre-snapshot で確認後、必要時のみ payload を 1 行書換えする運用で十分
4. Phase 13 で別途 PR を出さない（親 Phase 13 統合 PR にのみ含める）ため、payload を commit 対象ファイルとして git に残す必要がない

## 3. DRY 化（Phase 5 §4 / §5 重複部分）

dev / main の payload は `required_status_checks.contexts` 以外完全同一。仕様書上は **両方を完全列挙して残す**（読者が片方だけ見て誤実装するのを防ぐ）。一方、実行時にスクリプトで動的化したい場合は以下のように pre snapshot から組み立てる。

```bash
# 任意: 動的 payload 生成（spec scope 外・運用 tip）
for BR in dev main; do
  jq '
    .required_status_checks.contexts = [
      "ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"
    ]
    | { required_status_checks, enforce_admins, required_pull_request_reviews,
        restrictions, required_linear_history, allow_force_pushes, allow_deletions,
        block_creations, required_conversation_resolution, lock_branch, allow_fork_syncing }
    | .enforce_admins = (.enforce_admins.enabled // false)
    | .required_linear_history = (.required_linear_history.enabled // false)
    | .allow_force_pushes = (.allow_force_pushes.enabled // false)
    | .allow_deletions = (.allow_deletions.enabled // false)
    | .block_creations = (.block_creations.enabled // false)
    | .required_conversation_resolution = (.required_conversation_resolution.enabled // true)
    | .lock_branch = (.lock_branch.enabled // false)
    | .allow_fork_syncing = (.allow_fork_syncing.enabled // false)
  ' outputs/phase-11/branch-protection-${BR}-pre.json \
    > /tmp/payload-${BR}.json
done
```

> 上記は運用 tip。本仕様の **正本は Phase 5 §4 / §5 の heredoc 完全 payload**。動的生成を採用する場合は post snapshot で baseline drift 検証（Phase 6 §1.2）を必ず行う。

## 4. 仕様書上の冗長性（許容）

| 箇所 | 重複理由 | 維持/削除 |
|------|----------|----------|
| Phase 5 §4 / §5 の payload heredoc | dev / main 両方を読者が独立に確認できるようにする | 維持 |
| Phase 4 §3 の jq クエリ集 | Phase 2 §3 を Phase 4 視点で再列挙 | 維持 |
| baseline 表（Phase 6 §1.1）| Phase 1 NFR との突合容易化 | 維持 |

## 5. 引き継ぎ（Phase 9 へ）

| 項目 | 内容 |
|------|------|
| 品質保証で確認すべき事項 | jq クエリの構文 / `gh auth` スコープ / heredoc 構文 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

payload 配信方式を最終判断し、仕様書上の重複を意図的に維持するか除去するかを確定する。

## 実行タスク

- heredoc / JSON file の比較を再評価する。
- heredoc inline 方式を最終採用する根拠を明記する。
- 仕様書上の冗長性を許容範囲として明示する。

## 参照資料

- 本サブタスク phase-2.md §4
- 本サブタスク phase-5.md §4 / §5

## 実行手順

1. Phase 2 §4 の比較を再評価する。
2. 動的 payload 生成 tip を運用例として記録する。
3. 採用方式を確定する。

## 統合テスト連携

- リファクタリング判断のため runtime テストは追加しない。

## 成果物

- 本 phase markdown
- 採用方式の根拠

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
