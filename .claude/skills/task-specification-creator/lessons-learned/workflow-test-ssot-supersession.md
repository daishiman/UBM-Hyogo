# Lessons Learned — workflow-level test と新 SSOT の同時更新パターン

> 起源: task-cf-token-staging-injection-fix-001 (2026-05-20, PR #847)
> Feedback 源: `docs/30-workflows/task-cf-token-staging-injection-fix-001/index.md`
> 失敗事象: `workflow-shell-lint / Workflow secret scope shell unit` (workflow-env-scope.test.sh) が CI で fail

## 適用条件

以下を **同時に満たす** タスクで本パターンを使う。

1. taskType = fix で、成果物が `.github/workflows/*.yml` の **secret / env 参照変更** を含む
2. 既存 spec test (`scripts/__tests__/workflow-env-scope.test.sh` など) が **前 SSOT の assertion** を保持している
3. 新 SSOT が運用上の理由（secret 未登録 / Environment 不一致 / 空文字解決）で前 SSOT を **明示的に上書き** する

## パターン本体

新 SSOT 確立時の **「workflow YAML だけ直して test を放置」アンチパターン** を避けるため、以下 3 点を Phase 5 (実装) と Phase 12 (compliance check) で必ず同一 PR 内に含める。

### 1. spec 側で「前 SSOT との関係」を明文化

- 前 SSOT の起源 issue / task ID（例: issue #718）を明記
- supersede / partial-supersede のどちらかを宣言
- supersede 範囲を **ファイル単位** で限定（例: backend-ci のみ、web-cd は据置）

### 2. workflow YAML 変更と同じ commit / PR に test 更新を入れる

別 commit に分割しない。理由: bisect / revert 時に「YAML だけ revert」「test だけ revert」されると CI と運用が乖離する。

### 3. test 内に supersede 理由をコメントとして残す

旧 assertion 削除箇所の直近に、

```bash
# === <task-id> (<date>): <new SSOT 名> ===
# <旧 SSOT が成立しなくなった運用理由>
# SSOT: <spec へのパス>
# This supersedes <旧 issue / task ID>'s <旧要件> for <scope>.
```

形式の block を残す。grep で「いつ・なぜ supersede したか」を即座に追跡可能にする。

## Phase 12 compliance check への組み込み

タスク仕様書 Phase 12 で以下 3 項目を verify step に含める。

| 項目 | 確認方法 |
|------|----------|
| 旧 secret 参照が workflow YAML に残存していないか | `grep -nE '<旧 secret 名>' .github/workflows/*.yml` |
| spec test の assertion が新 SSOT に整合しているか | `bash <該当 test>.sh` をローカル実行 |
| spec 本体に supersede 宣言があるか | `grep -nE 'supersede|前 SSOT' <spec path>` |

## アンチパターン

- ❌ workflow YAML だけ修正して push → CI fail → 後追いで test 修正
- ❌ test 側の assertion を **何故変えたか** 説明なく削除（grep 追跡不可）
- ❌ supersede 範囲を全 workflow に拡大宣言する（実際は backend-ci のみが対象）

## 関連 references

- [quality-gates.md](../references/quality-gates.md) — Phase 12 gate
- `docs/30-workflows/task-cf-token-staging-injection-fix-001/index.md` — 本 lesson の原典 spec
