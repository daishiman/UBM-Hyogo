<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 13 -->

[実装区分: 実装仕様書]

# Phase 13 — commit-pr-release

## 1. 目的

実装 wave 完了後（Phase 5-11 で config / spec の安定化実装と cold-start 24 PNG 取得を終えた状態）に、
変更を `dev` ブランチへ向けて PR 化する手順を定義する。**commit / push / PR / staging visual baseline 更新 / Issue state 変更は user-gated** であり、本仕様書では実行しない。

## 2. PR メタ情報

| 項目 | 値 |
| ---- | -- |
| base ブランチ | `dev`（CLAUDE.md 既定。production リリースではない） |
| 作業ブランチ | `docs/issue-1005-members-ux-playwright-baseline-stabilization` |
| タイトル例 | `fix(web): /members UX Playwright visual baseline を cold start で安定化し出力先 path drift を補正` |
| Issue 参照 | 本文に `Refs #1005`（close せず参照のみ。close 判断は user-gated） |

## 3. PR 本文構成

`outputs/phase-13/main.md` および `outputs/phase-12/implementation-guide.md` を正本として本文を構成する。
含める内容:

1. **調査結論**: Issue #1005 は GitHub 上 OPEN・別タスクで未解決・spec 履歴は #1009 のみ・warm-up race 未解消。完了タスク dir 移動由来の path drift 回帰を同時補正。
2. **根本原因と対策**: RC-1（warm-up 不在）/ RC-2（path drift）/ RC-3（冗長 project）/ RC-4（runtime-notes 文言）。
3. **変更ファイル**: `apps/web/playwright.config.ts` / `apps/web/playwright/tests/members-ux-clarity.spec.ts`。
4. **検証結果**: typecheck / lint / cold-start 24 PNG 取得 evidence（`outputs/phase-11/manual-test-result.md`）。
5. **スクリーンショット**: `outputs/phase-11/` に PNG がある場合のみ参照を含める。無ければスクリーンショット節を作らない。

## 4. 含めるファイル

- 実装 2 ファイル（config / spec）
- 本 workflow の Phase 1-13 ドキュメント群
- Phase 11 evidence（本サイクルで生成済みの PNG / `manual-test-result.md`）

## 5. user-gated 境界

| 操作 | 実行可否 |
| ---- | -------- |
| local typecheck / cold-start evidence 取得 | 実行済み |
| commit / push / `gh pr create --base dev` | **user 承認後のみ** |
| staging visual baseline 更新（Cloudflare） | **user 承認後のみ（Gate-C runtime ops）** |
| Issue #1005 の state 変更（close 等） | **user 承認後のみ** |

実行結果（PR URL 等）は [`outputs/phase-13/pr-creation-result.md`](outputs/phase-13/pr-creation-result.md) に記録する。

## DoD

- [ ] base=dev で PR を作成する旨が明記されている
- [ ] PR 本文に調査結論（OPEN / 未解決 / path drift 同時補正）が含まれる
- [ ] commit/push/PR/staging baseline/Issue state 変更が user-gated と明記されている
- [ ] PR 実行結果の記録先（pr-creation-result.md）が定義されている
