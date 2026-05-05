# Phase 4: 検証戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 |
| 次 Phase | 5 |
| 状態 | spec_created |

## 目的

GitHub branch protection の fresh GET evidence と aiworkflow-requirements の反映結果を、コマンドで再現可能に検証する戦略を定義する。

## 実行タスク

1. applied evidence の妥当性チェックを作る。
2. fresh `gh api` GET を取得する手順を検証対象に含める。
3. references / indexes の反映確認コマンドを定義する。
4. Issue #303 closed 維持と `Refs #303` の確認を含める。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 3 | phase-03.md | GO/NO-GO |
| 上流 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/ | placeholder検出 |
| 正本 | .claude/skills/aiworkflow-requirements/ | 反映先 |

## 実行手順

### ステップ 1: evidence validation

```bash
jq -e '.required_status_checks.contexts | type == "array"' outputs/phase-13/branch-protection-applied-dev.json
jq -e '.required_status_checks.contexts | type == "array"' outputs/phase-13/branch-protection-applied-main.json
jq -e '.status != "blocked_until_user_approval"' outputs/phase-13/branch-protection-applied-dev.json
jq -e '.status != "blocked_until_user_approval"' outputs/phase-13/branch-protection-applied-main.json
```

### ステップ 2: fresh GET evidence

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-13/branch-protection-applied-dev.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-13/branch-protection-applied-main.json
```

Phase 5 以降で実行する。Phase 4 ではコマンド定義のみで、GitHub state の変更はしない。

### ステップ 3:反映検証

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
rg -n "UT-GOV-001|Issue #303|branch protection|required_status_checks|contexts" .claude/skills/aiworkflow-requirements/references .claude/skills/aiworkflow-requirements/indexes
diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements
```

## 統合テスト連携

Phase 9 で同じコマンドを実行し、PASS/FAILを `outputs/phase-09/quality-gate.md` に記録する。

## 多角的チェック観点

- 実測値: 現在GitHub APIでは dev/main contexts が `ci`, `Validate Build` の2件である可能性がある。期待3件との差分は仕様更新時に current facts として扱い、期待値へ寄せて書かない。
- 失敗検出: `verify-indexes-up-to-date` が無い場合は差分として記録する。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | validation matrix作成 | pending |
| 2 | fresh GET手順定義 | pending |
| 3 | index/mirror検証定義 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/validation-matrix.md | 検証コマンド一覧 |

## 完了条件

- [ ] placeholder検出コマンドがある
- [ ] fresh GET取得手順がある
- [ ] references / indexes / mirror 検証コマンドがある
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-04/validation-matrix.md` を作成
- [ ] `artifacts.json` の Phase 4 状態を更新

## 次Phase

Phase 5: 仕様反映実行
