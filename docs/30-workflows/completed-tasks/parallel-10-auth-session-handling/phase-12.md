# Phase 12 — 正本同期

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 12 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-12/ | Phase成果物 |


task-specification-creator skill の Phase 12 SSOT に従い、5 必須タスク + Task 6 compliance check から成る strict 7 ファイルを生成する。

## 必須 7 ファイル

| # | パス | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリ・PASS/FAIL 判定 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/02-auth.md` 更新サマリ |
| 4 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル列挙（apps/web/src/features/admin/hooks/*, Toast.tsx, specs/02-auth.md, outputs/*） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力。silent refresh 導入は本サイクル外として明示 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 「テンプレ改善 / ワークフロー改善 / ドキュメント改善」3 観点固定 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 項目 SSOT |

## main.md 構造

```
# Phase 12 — 正本同期 main

## Status: runtime_pending (implemented_local_evidence_captured / Phase 13 blocked_pending_user_approval)

## Status: implemented_local_evidence_captured

## Summary

## Evidence Ledger

## Boundary
```

## implementation-guide.md 構造

### Part 1（中学生レベル）

- ログイン切れになったらどうなる？ → 自動でログイン画面に飛ばす、ということを実装した。
- ログイン画面に戻ったあと、元のページに戻れるように行き先を安全に覚えておく。
- 権限がない操作をしたら？ → 画面の上に「権限がありません」と表示が出る。
- これらは「`useAdminMutation` という共通の道具」を作ることでまとめて扱えるようにした。

### Part 2（技術者レベル）

- `fetchAuthed` の throw を mutation hook で catch する設計
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` の親仕様 `trigger` / `isLoading` API を維持する設計
- `redirector` / `toaster` / `currentPath` の DI で test 容易性を確保
- `Toast` の variant 拡張で a11y 区別（polite vs assertive）

## unassigned-task-detection.md

- 新規未タスク件数: 0
- スコープ外として本 workflow 内に決定根拠だけ残す候補:
  - Auth.js silent refresh（MVP 不採用、Workers Paid + refresh token 導入時に再検討）
  - e2e で 401→/login redirect の CI gate 化

## skill-feedback-report.md（3 観点固定）

1. テンプレ改善: hook 設計 spec に DI 必須項目チェックリストを追加する案
2. ワークフロー改善: Toast variant 追加のような後方互換変更で「既存 caller 影響範囲 grep」を Phase 5 必須化
3. ドキュメント改善: `02-auth.md` に client error handling 章を新設する案

## phase12-task-spec-compliance-check.md

- canonical 9 項目（`Summary verdict` / `Changed-files classification` / `workflow_state and phase status consistency` / `Phase 11 evidence file inventory` / `Phase 12 strict 7 file inventory` / `Skill/reference/system spec same-wave sync` / `Runtime or user-gated boundary` / `Archive/delete stale-reference gate` / `Four-condition verdict`）について、本仕様書 / outputs での充足を Verdict 表で記録。
- `it.todo` / `test.todo` 残留 0 件、placeholder token 0 件、`apps/` / `packages/` dirty diff を Phase 11 evidence と整合する形で記録。

## 完了条件

- 7 ファイル実体存在 + 各々の必須セクション充足。
- `artifacts.json` の Phase 12 status を実装完了時に `completed` へ更新（spec 段階では `spec_created`）。
