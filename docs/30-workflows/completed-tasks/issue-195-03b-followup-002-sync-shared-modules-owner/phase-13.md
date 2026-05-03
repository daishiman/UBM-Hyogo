# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| Phase | 13 / 13 |
| --- | --- |
| 前 Phase | 12 |
| 次 Phase | なし |
| 状態 | pending_user_approval |

## 重要

PR 作成はユーザーの **明示的な許可** を得てから実行する。本仕様書作成プロンプトのスコープでは PR を作成しない（CONST_002）。

## PR 作成手順（後続実行者向け）

### 1. 事前チェック

```bash
git status --porcelain                               # 期待: 空
git diff main...HEAD --name-only                    # 期待: _design/* と 03a / 03b index.md と issue-195-* spec のみ
git diff main...HEAD -- 'apps/web/' 'packages/'     # 期待: 0 件
git diff main...HEAD -- 'apps/api/src/jobs/_shared' # 期待: skeleton + tests のみ
```

### 2. ブランチ命名

`docs/issue-195-03b-followup-002-sync-shared-modules-owner`

### 3. PR タイトル / 本文

タイトル: `docs: sync 共通モジュール owner 表を _design/ に確立 (issue-195)`

本文:

```markdown
## Summary
- `docs/30-workflows/_design/sync-shared-modules-owner.md` を新規作成し、`apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts` の owner / co-owner / 変更ルールを明文化
- 03a / 03b の `index.md` から owner 表へ 1 ホップで到達できるリンクを追記
- `_design/` 階層を workflow 横断 governance 集約場所として確立（`_design/README.md`）

## Why
issue #195 (03b Phase 12 unassigned-task-detection #3) で検出された「sync 共通モジュールの owner が spec 上未確定」問題を governance 文書で固定する。後続の sync 系並列 wave での semantic drift・PR 衝突・PII redact 漏れを spec 段階で予防する。

## Test plan
- [x] Phase 6 markdown lint（U-1〜U-5 PASS）
- [x] Phase 7 cross-ref（I-1〜I-5 PASS）
- [x] Phase 8 AC 検証（AC-1〜AC-12 PASS）
- [x] Phase 9 secret hygiene（Q-1〜Q-5 PASS）
- [x] `_shared/` skeleton unit tests PASS

## Out of scope
- `_shared/ledger.ts` / `sync-error.ts` 自体の実装変更
- `sync_jobs` schema 集約（未割当 #7 で別途起票）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 4. CI 確認

- `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が PASS であること
- `pnpm --filter @ubm-hyogo/api typecheck` / `pnpm --filter @ubm-hyogo/api lint` が PASS であること

## 完了条件

- ユーザーの明示的な許可
- PR が作成され URL が報告されている
- CI gate がすべて PASS

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`

## 成果物

- 本 Phase ファイル
- 対応する `outputs/phase-*` 成果物
