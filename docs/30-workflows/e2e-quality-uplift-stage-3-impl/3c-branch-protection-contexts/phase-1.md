# Phase 1: 要件定義（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | 親 workflow `e2e-quality-uplift-stage-3/phase-1.md` / CLAUDE.md `## ブランチ戦略` / `## Governance` |
| 出力 | サブタスク 3c のスコープ・受入基準・不変条件・依存関係を確定 |
| implementation_mode | implementation（リモート GitHub 設定変更を伴う） |

---

## 1. 要件サマリ

`dev` / `main` の branch protection の `required_status_checks.contexts` 配列を、現行 3 件（`ci` / `Validate Build` / `coverage-gate`）から **5 件** に拡張する:

```
["ci", "Validate Build", "coverage-gate", "lighthouse-ci", "e2e-tests-coverage-gate"]
```

新規 2 件は親 workflow の 3a / 3b で導入される workflow の job name と完全一致させる。

## 2. 機能要件

| ID | 要件 | 出処 |
|----|------|------|
| FR-3c-1 | `dev` の `required_status_checks.contexts` に `lighthouse-ci` を追加する | 親 AC-05 |
| FR-3c-2 | `dev` の `required_status_checks.contexts` に `e2e-tests-coverage-gate` を追加する | 親 AC-05 |
| FR-3c-3 | `main` についても同 2 件を追加する（dev と同形にする） | 親 AC-05 |
| FR-3c-4 | 既存 contexts（`ci` / `Validate Build` / `coverage-gate`）を drop しない | 親 AC-05 |
| FR-3c-5 | 適用前後の snapshot を JSON として保存する | Phase 11 evidence |

## 3. 非機能要件（drift 防止）

| ID | 要件 | 出処 |
|----|------|------|
| NFR-3c-1 | `required_pull_request_reviews=null` を維持 | CLAUDE.md `## ブランチ戦略` solo dev policy / 親 AC-06 |
| NFR-3c-2 | `lock_branch.enabled=false` を維持 | 親 AC-06 |
| NFR-3c-3 | `enforce_admins.enabled=true` を維持 | CLAUDE.md `## Governance` |
| NFR-3c-4 | `required_status_checks.strict=false` を維持 | 親 index.md 不変条件 (2)（merge queue 未導入） |
| NFR-3c-5 | `required_conversation_resolution.enabled=true` を維持 | CLAUDE.md `## ブランチ戦略` |
| NFR-3c-6 | `required_linear_history` の現行値を維持 | drift 防止 |
| NFR-3c-7 | `allow_force_pushes` / `allow_deletions` の現行値を維持 | drift 防止 |

## 4. 順序依存（最重要）

```
3a PR-A merge → 3a workflow 1 run 成功 → check-run "lighthouse-ci" が GitHub に登録
3b PR-B merge → 3b workflow 1 run 成功 → check-run "e2e-tests-coverage-gate" が GitHub に登録
   ↓
3c gh api PUT を dev → main の順で適用
```

未登録 context を required に指定すると、対象 PR の必須 check が **永久 pending** となり PR が merge 不能になる（BLK-03）。

## 5. 受入基準（再掲）

| # | 受入基準 |
|---|----------|
| AC-05 | `dev` / `main` の `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` が追加される |
| AC-06 | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` が drift していない |

## 6. 引き継ぎ（Phase 2 へ）

| 項目 | 内容 |
|------|------|
| 設計検討事項 | payload 全体構造（PUT 必須 field 一覧）/ pre/post snapshot 戦略 / drift 検証 jq クエリ集 |
| リスク | 順序違反による永久 pending（BLK-03）/ payload field 欠落による既存 protection 破壊 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

サブタスク 3c の要件定義を確立し、機能要件・非機能要件・順序依存・受入基準を矛盾なく整理する。

## 実行タスク

- 親 workflow から 3c 関連の要件を抽出する。
- solo dev policy 不変条件を NFR として明示する。
- 順序依存（3a / 3b → 3c）を不変条件として明文化する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-1.md
- CLAUDE.md `## ブランチ戦略` / `## Governance`

## 実行手順

1. 親 workflow Phase 1 を読み 3c 該当部分を抽出する。
2. solo dev policy / governance 不変条件を NFR に展開する。
3. 順序依存を Phase 4 のテスト前提に伝搬させる。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として `gh api` read-only と `jq` 検証を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- index.md / artifacts.json への要件反映

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
