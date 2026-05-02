# Phase 3: 設計レビュー — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 3 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1-2 で確定した scope / 設計が、09a evidence contract、aiworkflow-requirements
不変条件、CLAUDE.md secret 管理ポリシーと整合することをレビューで担保する。

## 実行タスク

1. 09a `implementation-guide.md` の evidence contract に対する path / 命名整合をレビューする。
2. CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`bash scripts/cf.sh` 強制）に整合しているか確認する。
3. `.claude/skills/aiworkflow-requirements/references/` の関連参照と矛盾がないか確認する。
4. 既存 Playwright / sync endpoint / audit ledger schema との整合性を grep / 実在確認で検査する。

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/implementation-guide.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
- CLAUDE.md（secret / cf.sh 規約）
- apps/api/src/routes/admin/forms/ (実体)

## 統合テスト連携

- 上流: 08b Playwright scaffold / U-04 Forms sync / 05a auth gate の実装済み契約を読む
- 下流: Phase 11 runtime evidence と 09c blocker 更新にレビュー結果を渡す

## 実行手順

- レビューは grep / ls / Read 等の事実確認をもとに行い、想像で書かない。
- 仮置きパスや仮置きコマンドが残っている場合は Phase 2 に差し戻す。

## レビュー観点

### 整合性

- evidence path 名が 09a `implementation-guide.md` と完全一致する
- artifacts.json の `metadata.visualEvidence` が `VISUAL_ON_EXECUTION` で固定される
- `references/task-workflow-active.md` と本タスクの依存関係が双方向で整合する

### 安全性

- secret 値の流出経路（stdout / artifact / commit / log）が全て塞がれている
- screenshot redaction ルールが具体的で、対象（個人名・連絡先・実メール）が明記されている
- production deploy（09c）が本タスク完了前に発火しない gate 設計になっている

### 実行可能性

- staging URL / Pages project / required secret 名が実在資産で揃う
- 取得不能（secret 不足、Playwright 未整備、tail 取得不可）の場合の代替手順がある
- AC-1〜AC-6 が実測 PASS / FAIL を 1 対 1 で判定できる

## 多角的チェック観点

- システム系: 09a / 09c / U-04 / 08b の責務境界が交差していない
- 戦略・価値系: production deploy リスクを実測前倒しで取り除く目的に合致
- 問題解決系: `NOT_EXECUTED` PASS 化という問題の真因（実 staging 未実行）に対処している

## サブタスク管理

- [ ] evidence path 名の 09a 一致を grep で確認
- [ ] cf.sh 経由になっているか grep で確認
- [ ] secret 値が一切埋め込まれていないか grep で確認
- [ ] 仮置きパスが残っていないか grep で確認
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md
- 差し戻しが必要な場合は outputs/phase-03/review-findings.md

## 完了条件

- 全レビュー観点で OK が確認されている
- 不整合があれば Phase 1 / 2 にフィードバックされている
- レビュー結果が Phase 4 以降の前提として明文化されている

## タスク100%実行確認

- [ ] 仮置き path / command が消えている
- [ ] secret / 個人情報が含まれていない
- [ ] 09a evidence contract と path / 命名が完全一致している

## 次 Phase への引き渡し

Phase 4 へ、レビュー済 scope / 設計、解消した不整合一覧、残課題を渡す。
