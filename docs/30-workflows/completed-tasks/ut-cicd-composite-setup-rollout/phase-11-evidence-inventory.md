---
phase: 11
title: Evidence inventory — outputs/phase-11 配下に保存する成果物一覧
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 11: Evidence Inventory

[実装区分: 実装仕様書]

## 1. canonical evidence base path

```
docs/30-workflows/ut-cicd-composite-setup-rollout/outputs/phase-11/
```

## 2. Evidence ファイル一覧

| # | ファイル名 | 種別 | 取得コマンド | 必須/任意 |
|---|----------|------|-------------|----------|
| 1 | `grep-raw-setup-node-before.txt` | text | `grep -nH 'uses: actions/setup-node' .github/workflows/*.yml > "$EVIDENCE_DIR/grep-raw-setup-node-before.txt"; true`（rollout 前に取得） | 必須 |
| 2 | `grep-raw-setup-node-after.txt` | text | `grep -nH 'uses: actions/setup-node' .github/workflows/*.yml > "$EVIDENCE_DIR/grep-raw-setup-node-after.txt"; true`（rollout 後） | 必須 |
| 3 | `grep-raw-pnpm-action-setup-before.txt` | text | `grep -nH 'uses: pnpm/action-setup' .github/workflows/*.yml > "$EVIDENCE_DIR/grep-raw-pnpm-action-setup-before.txt"; true` | 必須 |
| 4 | `grep-raw-pnpm-action-setup-after.txt` | text | `grep -nH 'uses: pnpm/action-setup' .github/workflows/*.yml > "$EVIDENCE_DIR/grep-raw-pnpm-action-setup-after.txt"; true` | 必須 |
| 5 | `grep-composite-after.txt` | text | `grep -nH 'uses: \./\.github/actions/setup-project' .github/workflows/*.yml > "$EVIDENCE_DIR/grep-composite-after.txt"` | 必須 |
| 6 | `workflow-diff.patch` | unified diff | `git diff dev...HEAD -- .github/workflows/ > "$EVIDENCE_DIR/workflow-diff.patch"` | 必須 |
| 7 | `gh-workflow-view.log` | text log | 13 yaml に対し `gh workflow view <name>` を実行し tee で集約 | 必須 |
| 8 | `verify-pr-ready.log` | text log | `bash scripts/verify-pr-ready.sh 2>&1 \| tee "$EVIDENCE_DIR/verify-pr-ready.log"` | 必須 |
| 9 | `ci-run-urls.md` | markdown | PR run / dispatch run の URL 一覧を手書きで集約 | 必須 |

## 3. 各 evidence の合格判定

| # | 合格条件 |
|---|---------|
| 1 | rollout 前は 16 direct setup-node step hits（13 workflow files）。rollout 後 (#2) は 0 件 |
| 2 | ファイル空 |
| 3 | rollout 前は 16 direct pnpm setup step hits（13 workflow files） |
| 4 | ファイル空 |
| 5 | 18 yaml 分の hit（既存 6 + 新規 13） |
| 6 | 13 yaml の差分のみ。`.github/actions/` 配下の差分なし |
| 7 | 13 yaml すべて `Failed to parse` 等が出ない |
| 8 | exit 0 |
| 9 | PR run URL 1 本 + Batch B 4 yaml の dispatch run URL 4 本 + Batch C 2 yaml の staging dispatch URL 2 本（合計 7 URL 程度） |

## 4. visual evidence

NOT_APPLICABLE。本タスクは yaml diff のみで UI 出力を伴わない。

## 5. evidence directory 構造

```
ut-cicd-composite-setup-rollout/
├── phase-01-requirements.md
├── ... (phase-02 〜 phase-13)
└── outputs/
    ├── phase-11/
    │   ├── grep-raw-setup-node-before.txt
    │   ├── grep-raw-setup-node-after.txt
    │   ├── grep-raw-pnpm-action-setup-before.txt
    │   ├── grep-raw-pnpm-action-setup-after.txt
    │   ├── grep-composite-after.txt
    │   ├── workflow-diff.patch
    │   ├── gh-workflow-view.log
    │   ├── verify-pr-ready.log
    │   └── ci-run-urls.md
    └── phase-12/
        ├── main.md
        ├── implementation-guide.md
        └── phase12-task-spec-compliance-check.md
```

## 6. evidence 取得タイミング

| evidence | 取得 timing |
|----------|-------------|
| #1, #3 | rollout 編集 **前** にコミット前のクリーンな状態で取得 |
| #2, #4, #5, #6, #7, #8 | rollout 編集 **後**、commit 直前 |
| #9 | PR 作成後・CI 完走後 |

## 7. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 11 | 9 evidence をすべて生成 |
| 13 | Phase 13 compliance check で 9 evidence の物理存在を確認 |

## 完了条件

- [x] §2 の 9 evidence がすべて取得可能なコマンドで定義されている
- [x] §3 の合格条件が明示されている
- [x] §5 のディレクトリ構造が示されている
