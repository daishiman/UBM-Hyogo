[実装区分: 実装仕様書]

# Phase 12 main.md — issue-385-web-build-global-error-prerender-fix

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 12 / 13 |
| 改訂日 | 2026-05-03 |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| 関連 Issue | #385（CLOSED） |

## 本 Phase の境界

> 本タスクは implemented-local の implementation であり、Plan A コード変更と NON_VISUAL local evidence を本サイクルで実施する。deploy・commit・push・PR は user approval 後にのみ実施する。

> 採用方針は Plan A（`getAuth()` lazy factory + build script `NODE_ENV=production` 明示）であり、next / react / react-dom / next-auth の version、middleware、next.config は変更しない。`apps/web/package.json` は build script の環境明示のみ変更する。

> Issue #385 は CLOSED 状態のまま扱う。Issue reopen / PR 作成は user approval 後にのみ判断する。

## Phase 12 合意 summary

Phase 5 で確定した Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + route handler / `apps/web/src/lib/auth/oauth-client.ts` / `apps/web/src/lib/session.ts` の dynamic auth access）の docs / spec / follow-up / skill feedback を整備する。local code / docs / evidence は本サイクルで実施し、deploy・commit・push・PR は user 承認後に別ターンで実行する。

## 6 必須生成物（strict canonical filename）

| # | ファイル | 由来 Task | 状態 |
| - | -------- | --------- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | Task 1（Part 1 中学生 + Part 2 技術者・PR 本文ベース） | 生成完了 |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | Task 2（Step 1-A / 1-B / 1-C / Step 2） | 生成完了 |
| 3 | `outputs/phase-12/documentation-changelog.md` | Task 3 | 生成完了 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | Task 4（3 件 + LL-1 候補） | 生成完了 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | Task 5（FEEDBACK_PROPOSED_DEFERRED） | 生成完了 |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 6（root evidence） | 生成完了 |

## ドキュメント更新対象（本サイクルで適用）

| 対象ファイル | 更新内容 | 必須 / 任意 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | `getAuth()` lazy factory 経路 + route handler 実装ガイドラインを 1 段落追記 | 必須 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | 影響なし確認の注記のみ | 必須 |
| `apps/web/CLAUDE.md` | top-level next-auth value import 禁止 / lazy factory 規約を 1 節追記 | 存在時必須（2026-05-03 実確認で不在のためスキップ） |

> docs / code ファイルへの編集は本サイクルで実施する。commit / push / PR は Phase 13 approval gate まで実行しない。

## skill index rebuild 義務

```bash
mise exec -- pnpm indexes:rebuild
```

実行結果は `outputs/phase-12/documentation-changelog.md` 末尾の「skill index rebuild 実行記録」節に stdout 末尾と diff 件数を記録する。CI の `verify-indexes-up-to-date` gate が PASS することが本 Phase の DoD 1 項。

## 参照

- `phase-12.md`（本仕様書本体）
- `outputs/phase-11/main.md`（9 段 evidence 構成）
- Phase 5 実装ランブック
- vercel/next.js #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth #13302
