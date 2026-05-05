# Phase 13: PR 作成

[実装区分: ドキュメントのみ仕様書]

## 状態

`blocked_until_user_approval`

## 目的

Phase 1-12 が完了した後、ユーザーの明示指示でのみ commit / push / PR 作成を実行する。本仕様書作成段階では実行しない。

## 前提条件（user 承認待ち）

- Phase 11 実行済み（`spec_created` から `runtime_evidence_captured` または `completed` へ遷移）
- Phase 12 の 7 固定成果物 + 判定別追加成果物が実体配置済み
- 全 AC (AC-1〜AC-9) が evidence で裏付け済み
- 全品質ゲート G1〜G6 が PASS

## ユーザー承認ゲート

以下のいずれもユーザー明示指示で起動する:

1. `git add` / `git commit`
2. `git push`
3. `gh pr create`

## PR 内容（テンプレ）

### Title
```
docs(audit): Issue #359 production D1 out-of-band apply audit (#434)
```

### Body 構造
- Summary: 監査結果（confirmed / unattributed）と影響範囲
- 判定 evidence: `outputs/phase-11/attribution-decision.md` 引用
- 追加 / 変更ファイル一覧: `documentation-changelog.md` 引用
- read-only / redaction PASS 確認
- 親 workflow への cross-reference / 再発防止策反映の有無
- Test plan: 該当なし（docs-only audit）
- Issue 連携: Issue #434 / #359 は CLOSED のまま据え置き

### スクリーンショット

なし（NON_VISUAL）。

## 禁止事項（user 明示指示なしで実行しない）

- `git commit`
- `git push`
- `gh pr create`
- production D1 への write 操作
- Issue #434 / #359 の reopen / close 操作
- `aiworkflow-requirements` の changelog / references への直接 commit（Phase 12 で記述、Phase 13 で commit）

## 完了条件

- [ ] ユーザーから明示的な PR 作成指示を受領
- [ ] PR が作成され URL がユーザーに報告されている
- [ ] CI（typecheck / lint / verify-indexes 等）が PASS

## 本仕様書作成段階での扱い

本仕様書作成では Phase 13 を実行しない。`outputs/phase-13/main.md` には「`blocked_until_user_approval` placeholder」と記載するに留め、commit / push / PR は一切行わない。

## メタ情報

- taskType: docs-only
- visualEvidence: NON_VISUAL
- workflow_state: spec_created

## 実行タスク

- 詳細は本 Phase の既存セクションを参照する。

## 参照資料

- index.md
- artifacts.json
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 成果物

- 対応する `outputs/phase-*` 配下の `main.md`。

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
