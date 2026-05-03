[実装区分: 実装仕様書]

# Phase 12 Task Spec Compliance Check

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |
| 関連 Issue | #385（CLOSED） |

## 必須逐語文言

> 本タスクは implemented-local の implementation であり、Plan A コード変更と NON_VISUAL local evidence を本サイクルで実施する。deploy・commit・push・PR は user approval 後にのみ実施する。

> Issue #385 は CLOSED 状態のまま扱う。Issue reopen / PR 作成は user approval 後にのみ判断する。

> 採用方針は Plan A（`getAuth()` lazy factory + build script `NODE_ENV=production` 明示）であり、next / react / react-dom / next-auth の version、middleware、next.config は変更しない。`apps/web/package.json` は build script の環境明示のみ変更する。

## 監査軸 8 軸

| # | 軸 | 確認内容 | PASS 条件 | 判定 |
| - | --- | --- | --- | --- |
| 1 | strict 6 + main 実体 | outputs/phase-12/ に Task 1-6 由来 6 ファイル + `main.md` の計 7 ファイル存在 | `find outputs/phase-12 -maxdepth 1 -type f -name '*.md' \| wc -l` == 7 かつ Task 1-6 ファイルが全て存在 | PASS（生成完了） |
| 2 | canonical filename | 別名 (例: documentation-update-history.md) 不在 | grep で別名検出 0 | PASS |
| 3 | Phase status | workflow root は `implemented-local`。Phase 1-12 は completed、Phase 13 は `blocked_pending_user_approval` | local implementation / NON_VISUAL evidence と deploy / PR gate を分離 | PASS |
| 4 | boundary | local code / docs / evidence は実施、deploy・commit・push・PR は未実行 | implementation-guide.md / 本ファイル / main.md で明文化 | PASS |
| 5 | Step 2 限定追加宣言 | system-spec-update-summary.md で `getAuth()` 1 件追加と既存 export 互換維持を明記 | 「公開 API シグネチャ 1 件追加 / D1・API・IPC・shared 変更ゼロ」記載 | PASS |
| 6 | skill index rebuild | aiworkflow quick-reference / resource-map / task-workflow-active が Plan A に同期済み | `mise exec -- pnpm indexes:rebuild` 実走済み、`rg issue-385 ...` で旧 `global-error.tsx` RSC 採用案が正本索引の current 状態に残らない | PASS |
| 7 | skill feedback judging gate | 全 feedback に promotion / defer / reject 判定 | skill-feedback-report.md でルーティング済 | PASS（全 Defer） |
| 8 | unassigned-task 3 件 + LL-1 記録 | Issue #385 本文 follow-up 3 件 + LL-1 候補 1 件 | unassigned-task-detection.md で 3 件 + 4 必須セクション準拠 + LL-1 提案 | PASS |

## CONST 遵守チェック

| CONST | 内容 | 本タスク適用 | 判定 |
| --- | --- | --- | --- |
| CONST_004 | implementation-spec のデフォルトはコード実装まで実施 | 本サイクルで Plan A コード変更、正本索引同期、NON_VISUAL evidence を実施。deploy / PR は user gate | PASS |
| CONST_005 | spec docs 直接更新のスコープ判定 | Step 1-A で 02-auth.md UPDATE_REQUIRED / 13-mvp-auth.md 影響なし注記を限定 | PASS |
| CONST_007 | 単一サイクル原則（タスク内で完結） | 実装 + Phase 11 実測 + Phase 13 PR draft 確定までを 1 タスクで完結する設計 | PASS |

## PASS 判定の前提

`PASS` は (a) strict 6 + main の 7 outputs 実体 + (b) validator 実測値（`find` / `rg` の終了コードと結果） + (c) local implementation と deploy / PR gate の boundary 明記 + (d) aiworkflow 正本索引の Plan A 同期 が揃った後にのみ最終確定する。

## strict 6 + main 実体確認（実走時 expected）

```bash
find docs/30-workflows/issue-385-web-build-global-error-prerender-fix/outputs/phase-12 \
  -maxdepth 1 -type f -name '*.md' | sort
```

期待:

```
outputs/phase-12/documentation-changelog.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/main.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/unassigned-task-detection.md
```

> main.md を含めて 7 ファイル存在する（Task 1-6 由来 6 + main.md 1）。strict 6 files 対象は Task 1-6 由来分。
