# Phase 7: カバレッジ確認（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` / `phase-5.md` / `phase-6.md` |
| 出力 | NON_VISUAL カバレッジ代替の確認結果（evidence ファイル完備チェック） |

---

## 1. coverage tier の扱い

本サブタスク 3c は `visualEvidence: NON_VISUAL` / `coverageTier: standard`。実コード変更がないため Playwright / c8 の line coverage 70% gate は **適用対象外**。代替として **evidence ファイル完備** + **jq 検証クエリ全件 PASS** をカバレッジ代替条件とする。

## 2. evidence ファイル完備チェック

| # | ファイル | 期待 |
|---|---------|------|
| C-01 | `outputs/phase-11/branch-protection-dev-pre.json` | 存在・JSON 妥当 |
| C-02 | `outputs/phase-11/branch-protection-dev-post.json` | 存在・JSON 妥当 |
| C-03 | `outputs/phase-11/branch-protection-main-pre.json` | 存在・JSON 妥当 |
| C-04 | `outputs/phase-11/branch-protection-main-post.json` | 存在・JSON 妥当 |
| C-05 | `outputs/phase-11/branch-protection-evidence.md` | jq 検証ログを含む（Phase 11 で生成） |

```bash
for f in outputs/phase-11/branch-protection-{dev,main}-{pre,post}.json; do
  [ -f "$f" ] || { echo "::error::missing $f"; exit 1; }
  jq -e . "$f" >/dev/null || { echo "::error::invalid JSON $f"; exit 1; }
done
[ -f outputs/phase-11/branch-protection-evidence.md ] \
  || { echo "::error::missing evidence.md"; exit 1; }
```

## 3. jq 検証クエリ全件 PASS チェック（Phase 4 + Phase 6 の集約）

| # | クエリ | 期待 |
|---|--------|------|
| Q-01 | T-3c-5（dev contexts 5 件 sort 一致） | exit 0 |
| Q-02 | T-3c-6（main contexts 5 件 sort 一致） | exit 0 |
| Q-03 | T-3c-7（required_pull_request_reviews=null） | exit 0 |
| Q-04 | T-3c-8（lock_branch.enabled=false） | exit 0 |
| Q-05 | T-3c-10（required_conversation_resolution=true） | exit 0 |
| Q-06 | T-3c-11（strict=false） | exit 0 |
| Q-07 | Phase 6 §1.2（drift-check） | exit 0（dev / main 両方） |

## 4. AC との対応

| AC | 確認方法 |
|----|----------|
| AC-05 | Q-01 / Q-02 |
| AC-06 | Q-03 / Q-04 / Phase 6 §1.3（enforce_admins 特例） |

## 5. 引き継ぎ（Phase 8 へ）

| 項目 | 内容 |
|------|------|
| リファクタリング検討 | payload 配信を heredoc から JSON file へ切替えるか判定 |
| evidence 集約 | Phase 11 で `branch-protection-evidence.md` を生成 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 7
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

NON_VISUAL のカバレッジ代替条件として evidence ファイル完備と jq 検証全件 PASS を定義する。

## 実行タスク

- evidence ファイル完備チェックスクリプトを定義する。
- jq 検証クエリ全件 PASS の対応表を作成する。
- AC-05 / AC-06 と検証方法を紐付ける。

## 参照資料

- 本サブタスク phase-4.md / phase-6.md
- .claude/skills/task-specification-creator/references/quality-gates.md §7.5

## 実行手順

1. evidence ファイルの存在と JSON 妥当性を確認する。
2. jq クエリ全件を実行する。
3. AC との対応を確認する。

## 統合テスト連携

- NON_VISUAL phase はファイル完備 + jq 検証で E2E coverage を代替する。

## 成果物

- 本 phase markdown
- evidence 完備チェック仕様

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
