# Phase 5: 実装（docs sync / SSOT 反映）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（docs sync） |
| 前 Phase | 4 (テスト作成 / 検証コマンド suite) |
| 次 Phase | 6 (テスト拡充 / 回帰 guard) |
| 状態 | spec_created |

## 目的

Phase 2 で確定した patch 設計を SSOT に適用し、Phase 4 の検証コマンド suite を全件 GREEN にする。コード実装は伴わず docs 1 ファイルを更新する。

## 変更対象ファイル

### 新規作成

なし。

### 修正

| 区分 | パス |
| --- | --- |
| 修正 | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` |

## 差分テーブル

| # | 対象セクション | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| D-1 | 環境別観測対象 (dev) | `ci.yml` 等のみ列挙 | `backend-ci.yml (deploy-staging)` / `web-cd.yml (deploy-staging)` / `verify-indexes.yml` の 3 行を追加 | dev 環境で実走する 5 workflow を全件可視化（AC-1） |
| D-2 | 環境別観測対象 (main) | `ci.yml` 等のみ列挙 | `backend-ci.yml (deploy-production)` / `web-cd.yml (deploy-production)` / `verify-indexes.yml` の 3 行を追加 | main 環境で実走する 5 workflow を全件可視化（AC-1） |
| D-3 | CI/CD Workflow 識別子マッピング | セクション欠如 | 新規セクション追加。4 列分離（**file** / **display name** / **job id** / **required status context**） | observability owner が一意に識別できるようにする（AC-5） |
| D-4 | Discord 通知の current facts (2026-05-01) | セクション欠如 | 新規セクション追加。「全 5 workflow に Discord/Slack 通知未配線。Phase 12 で未タスク候補として起票予約」 | current facts 注記（AC-3） |
| D-5 | 旧 path 参照置換 | `docs/05a-` 形式の相対参照が残存 | `docs/30-workflows/completed-tasks/05a-` に全件置換 | drift 解消（Phase 4 T-3） |

## 実行手順

### Step 1: Phase 4 検証コマンドを RED 状態で記録

```bash
# T-1
rg -n "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md

# T-3
rg -n "docs/05a-" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails
```

→ 出力を `outputs/phase-05/red-snapshot.txt` 相当として記録。

### Step 2: 差分 D-1〜D-5 を適用

`observability-matrix.md` に対し以下を反映:

```diff
 ## 環境別観測対象 (dev)
 - ci.yml
+- backend-ci.yml (deploy-staging)
+- web-cd.yml (deploy-staging)
+- verify-indexes.yml

 ## 環境別観測対象 (main)
 - ci.yml
+- backend-ci.yml (deploy-production)
+- web-cd.yml (deploy-production)
+- verify-indexes.yml

+## CI/CD Workflow 識別子マッピング
+
+| file | display name | job id | required status context |
+| --- | --- | --- | --- |
+| ci.yml | (T-4 出力で確定) | (各 workflow から抽出) | (T-5 の gh api 応答と照合) |
+| backend-ci.yml | ... | ... | ... |
+| validate-build.yml | ... | ... | ... |
+| verify-indexes.yml | ... | ... | ... |
+| web-cd.yml | ... | ... | ... |
+
+> 正本は GitHub branch protection API。差分が出た場合は本表を branch protection 実値へ追従させる。
+
+## Discord 通知の current facts (2026-05-01)
+
+- 観測対象 5 workflow (`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`) いずれも Discord/Slack 通知は未配線。
+- 検証: `grep -iE "discord|webhook|notif" .github/workflows/{ci,backend-ci,validate-build,verify-indexes,web-cd}.yml` → 0 件。
+- 通知導入は本タスクスコープ外。Phase 12 で未タスク候補として正式起票予約。
```

旧 path 置換:

```bash
# 対象ファイルを特定後、エディタで全件置換
# docs/05a-  →  docs/30-workflows/completed-tasks/05a-
```

### Step 3: Phase 4 検証コマンドを GREEN 状態で再実行

| コマンド | GREEN 期待 |
| --- | --- |
| T-1 | 5 workflow すべて 1 件以上ヒット |
| T-2 | ヒット 0 件。SSOT 側に current facts 記載済み |
| T-3 | 0 件 |
| T-4 | 出力結果が SSOT mapping 表に反映済み |
| T-5 | gh api 応答と SSOT「required status context」列が一致（Phase 11 で再確認） |

## TDD GREEN 達成条件

Phase 4 の T-1〜T-4 がすべて期待値に到達すること。T-5 は Phase 11 で最終確認。

## 成果物

- `outputs/phase-05/main.md` — 適用差分レポートと Phase 4 検証コマンド GREEN ログ
