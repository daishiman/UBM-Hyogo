# Phase 3: 設計レビューゲート

## 4 条件評価

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 矛盾なし | PASS | runbook / README / CI / bats の local 実装は `implemented_local_runtime_pending` として扱い、PR comment URL は Phase 13 user-gated runtime evidence に分離 |
| 漏れなし | PASS | runbook、migration README、CI comment step、bats test、Phase 11 evidence、Phase 12 strict 7、aiworkflow sync を同一 wave で扱う |
| 整合性あり | PASS | D1 binding 不変条件・branch protection・test suffix policy・aiworkflow-requirements 構造と矛盾なし |
| 依存関係整合 | PASS | 08a follow-up を canonical root へ consumed 化し、09b への重複記載ではなく standalone runbook を参照する |

## 想定モジュール俯瞰

```
docs/30-workflows/runbooks/d1-migration-test-guideline.md  ← 正本
        ▲                          ▲                  ▲
        │                          │                  │
apps/api/migrations/README.md   .github/workflows/   scripts/d1/__tests__/
   (link only)                  d1-migration-        migration-guideline-
                                verify.yml           presence.bats
                                (post comment step)  (presence assertion)
```

## レビューポイントと回答

- Q: 既存 `d1-migration-verify.yml` を変更すると CI gate が壊れないか
  - A: 末尾 step として追加する形であり、既存 verify ジョブの success/failure 結果には影響しない。permissions に `pull-requests: write` を追加するだけ
- Q: comment 重複は問題ないか
  - A: marker comment `<!-- d1-migration-guideline-bot -->` 検知で update or skip。push のたびに新規 comment は発生しない
- Q: 09b runbook ではなく `docs/30-workflows/runbooks/` 配下に置く理由
  - A: 09b release runbook は production deploy 専用文脈。migration test guideline は migration を含む全 PR で参照されるため、runbooks/ 直下に独立配置するほうが reference path として安定
- Q: bats test の意義
  - A: runbook 必須見出しが将来 typo / 削除されると CI comment が「死んだリンクを案内するコメント」になる劣化を防ぐ

## ゲート判定

ALL PASS → Phase 4 へ進む

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 3 |
| status | completed |

## 目的

Phase 2 設計が4条件と運用境界に照らして成立することを確認する。

## 実行タスク

- 4条件評価を実施する。
- 独立 runbook 化と CI comment 独立性の妥当性を確認する。

## 参照資料

- `phase-02.md`
- `.claude/skills/automation-30/references/elegant-review-prompt.md`

## 成果物/実行手順

レビュー観点と回答を記録し、Phase 4 の検証戦略に渡す。

## 完了条件

- 重大な矛盾が Phase 4 へ持ち越されていない。

## 統合テスト連携

Phase 9 の bats / grep gate でレビュー結果を機械的に確認する。
