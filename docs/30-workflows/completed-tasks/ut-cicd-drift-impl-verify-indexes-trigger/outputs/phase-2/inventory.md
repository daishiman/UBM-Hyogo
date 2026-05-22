# Phase 2 — 既存資産インベントリ

## 関連ファイル

| パス | 役割 | 現状 |
|---|---|---|
| `.github/workflows/verify-indexes.yml` | drift 検出 CI gate | 稼働中。trigger: push:main / pr:main,dev。job/context 名: `verify-indexes-up-to-date` |
| `scripts/hooks/indexes-drift-guard.sh` | pre-push hook (一次防衛) | 稼働中。drift 検出で push ブロック |
| `lefthook.yml` (line 57-64) | hook 配線 + fail_text | `fail_text` に「`mise exec -- pnpm indexes:rebuild` → commit → 再 push」と CI gate 名、runbook 導線を明示済み |
| `docs/00-getting-started-manual/lefthook-operations.md` | 運用ガイド | 「post-merge 自動再生成廃止について」セクションに verify-indexes-up-to-date の存在説明あり。trigger 条件・SOP は未整理 |
| `package.json` `indexes:rebuild` script | 正規 generator | 稼働中 |
| `.claude/skills/aiworkflow-requirements/indexes/` | 監視対象成果物 | drift 検出対象 |
| `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md` | 原仕様書 | 保持。本仕様書から参照 |

## 不在ファイル

- `docs/00-getting-started-manual/deployment-gha.md` — **存在しない**。`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` は存在するが、復旧 SOP の読者導線は hook 運用正本 `lefthook-operations.md` が最短のため retarget する。
- 統合された GHA workflow カタログドキュメントは存在しない（各 workflow は個別ファイルで自己記述）。

## CLAUDE.md 既存記述

`CLAUDE.md` 「よく使うコマンド」セクションに以下が既にある:

> CI 側に `verify-indexes-up-to-date` gate（`.github/workflows/verify-indexes.yml`）があり、`.claude/skills/aiworkflow-requirements/indexes` に drift があると job が fail する。

## 結論

documentation gap の最小修復先は `lefthook-operations.md`。新規ファイルは作成しない。
