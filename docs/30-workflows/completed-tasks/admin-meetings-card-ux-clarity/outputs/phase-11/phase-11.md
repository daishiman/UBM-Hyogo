# Phase 11: 手動テスト（VISUAL screenshot 計画 / evidence 取得仕様）

**[実装区分: 実装仕様書]**（VISUAL UI task）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 11 / 13 |
| created_at | 2026-06-10 |
| taskType | implementation |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| evidence canonical path | `outputs/phase-11/evidence/` および `outputs/phase-11/screenshots/` |
| 状態 | `implemented_local_evidence_captured`（local validation PASS。local screenshot 取得済み。staging screenshot は user-gated） |
| 関連 AC | AC-1〜AC-10（視覚＝AC-1/AC-2 を含む全件の最終視覚確認） |
| 関連 Feedback | W1-02b-1（screenshot-plan は mode: VISUAL） |
| SSOT | `../../shared-context.md` §7 / §9 / §10 |

## 目的

`/admin/meetings`（開催日管理）の表現層改修を、**local Playwright fixture screenshot（視覚）**、**staging screenshot（視覚 / user-gated）**、**local 自動検証ログ（非視覚）** の 3 カテゴリ evidence で客観検証する。本タスクは VISUAL（`visualEvidence=VISUAL_ON_EXECUTION`）であり、local fixture screenshot は本サイクルで取得、staging screenshot は Phase 13 user-gated として残す。

evidence 3 カテゴリ:

- **local visual evidence**: Playwright mock API + admin auth fixture で取得する screenshot（desktop / mobile・折りたたみ / 展開・出席者一覧）。**本サイクルで present**。
- **staging visual evidence**: staging で取得する screenshot（同 canonical 名の production-equivalent 確認）。**pending（user-gated）**。
- **non-visual evidence（代替 local 自動検証）**: typecheck / lint / vitest（4 spec + 追加ケース）/ verify:tokens / HEX grep / apps/api diff のログ。Phase 9 と等価判定。

## [W1-02b-1] screenshot-plan（mode: VISUAL）

canonical 命名 `<component>-<state>.png` 形式（必要に応じ `-<viewport>` を付与）。撮影は staging 認証後・user-gated。

| # | screenshot ファイル名 | 対象画面 / 状態 | viewport | 検証する AC |
|---|---|---|---|---|
| 1 | `meetings-list-default-desktop.png` | `/admin/meetings` 一覧・全カード折りたたみ（デフォルト） | 1440x900 | AC-1（カード分離）/ AC-2（見出し整列） |
| 2 | `meetings-list-default-mobile.png` | 同上・モバイル幅 | 375x812 | AC-1 / AC-2（レスポンシブでの可読性） |
| 3 | `meetings-card-expanded-desktop.png` | カード 1 件展開・3 セクション（編集/出席を追加/出席者）表示 | 1440x900 | AC-3（サブカード分離）/ AC-5（人数 (N名)） |
| 4 | `meetings-card-expanded-mobile.png` | 同上・モバイル幅 | 375x812 | AC-3 / AC-5（狭幅での階層） |
| 5 | `meetings-attendees-list-desktop.png` | 出席者セクション（複数名・行リスト・削除ボタン右寄せ） | 1440x900 | AC-4（行リスト可読化）/ AC-5（人数） |

> mode: VISUAL。各 screenshot の対象画面・状態・viewport を上表で固定する。local Playwright fixture PNG は本サイクルで取得済み。staging 認証 cookie を含む production-equivalent 撮影は user 明示承認後（Phase 13）に行う。

## 3 層評価（Semantic / Visual / AI UX）

| 層 | 観点 | 本タスクでの判定方法 |
|---|---|---|
| **Semantic（構造・意味）** | DOM 構造・見出し role・testid/aria/role 保持・人数 (N名) の意味的正しさ | local vitest（DR-1〜DR-3 / TL-1 + 既存 4 spec）の GREEN。jsdom で構造のみ検証（視覚は assert しない） |
| **Visual（見た目）** | カード分離（影/境界線/余白）・見出し整列・hover/focus-visible・サブカード境界・行区切り | local Playwright screenshot（#1〜#5）で一次確認。staging screenshot は Phase 13 user-gated |
| **AI UX（直感性）** | 「くっつき」解消・各セクションの目的が一目で分かるか・出席者一覧が触りやすいか・色を変えずに視覚階層が改善したか | local screenshot をレビューし、staging screenshot で最終確認する |

## evidence inventory

evidence は `Classification | Path | Status` 表で管理。Status 語彙は `present` / `pending` / `n/a`。local screenshot と non-visual evidence は本サイクルで取得済み。staging screenshot は user-gated。

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | present |
| typecheck log | outputs/phase-11/evidence/typecheck.txt | present |
| lint log | outputs/phase-11/evidence/lint.txt | present |
| web vitest log（_meetings 4 spec + 追加ケース） | outputs/phase-11/evidence/test-web-meetings.txt | present |
| verify:tokens log | outputs/phase-11/evidence/verify-tokens.txt | present |
| local Playwright visual log | outputs/phase-11/evidence/playwright-local-visual.txt | present |
| HEX grep log（_meetings + globals.css・0 件期待） | outputs/phase-11/evidence/hex-grep.txt | present |
| apps/api diff log（空期待・AC-8） | outputs/phase-11/evidence/apps-api-diff.txt | present |
| data-testid contract log（削除IDが追加後にも存在すること・AC-6） | outputs/phase-11/evidence/testid-contract.txt | present |
| local screenshot（一覧 折りたたみ desktop） | outputs/phase-11/screenshots/meetings-list-default-desktop.png | present |
| local screenshot（一覧 折りたたみ mobile） | outputs/phase-11/screenshots/meetings-list-default-mobile.png | present |
| local screenshot（カード展開 desktop） | outputs/phase-11/screenshots/meetings-card-expanded-desktop.png | present |
| local screenshot（カード展開 mobile） | outputs/phase-11/screenshots/meetings-card-expanded-mobile.png | present |
| local screenshot（出席者一覧 desktop） | outputs/phase-11/screenshots/meetings-attendees-list-desktop.png | present |
| local visual review | outputs/phase-11/local-visual-review.md | present |
| staging screenshot（production-equivalent 確認） | outputs/phase-11/screenshots/（同 canonical 名） | pending |
| 削除 PASS 基準 evidence | — | n/a（FB-UI-02-1: ファイル削除なし） |

> local screenshot は `present`。staging screenshot は `pending`。Phase 13（user-gated）で staging deploy 後に production-equivalent screenshot を撮影する。

## 取得手順

### non-visual evidence（代替 local 自動検証・取得済み）

```bash
WF=docs/30-workflows/admin-meetings-card-ux-clarity
mkdir -p "$WF/outputs/phase-11/evidence" "$WF/outputs/phase-11/screenshots"

mise exec -- pnpm typecheck 2>&1 | tee "$WF/outputs/phase-11/evidence/typecheck.txt"
mise exec -- pnpm lint 2>&1 | tee "$WF/outputs/phase-11/evidence/lint.txt"
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx \
  2>&1 | tee "$WF/outputs/phase-11/evidence/test-web-meetings.txt"
mise exec -- pnpm verify:tokens 2>&1 | tee "$WF/outputs/phase-11/evidence/verify-tokens.txt"
grep -rn "bg-\[#\|text-\[#" apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css \
  | tee "$WF/outputs/phase-11/evidence/hex-grep.txt" || true   # 0 件期待
git diff dev -- apps/api | tee "$WF/outputs/phase-11/evidence/apps-api-diff.txt"   # 空期待（AC-8）
git diff -- apps/web/src/features/admin/components/_meetings | grep '^[-+].*data-testid' \
  | tee "$WF/outputs/phase-11/evidence/testid-contract.txt" || true   # 移動差分を確認し、削除IDが追加後にも存在することを検証（AC-6）
```

### local visual evidence（取得済み）

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/admin-meetings-card-ux-clarity/outputs/phase-11 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=desktop-chromium playwright/tests/admin-meetings-card-ux-clarity.spec.ts
```

保存先: `outputs/phase-11/screenshots/`。`local-visual-review.md` に目視レビュー表を出力する。

### visual evidence（staging・user-gated / Phase 13）

```bash
# user 明示承認後のみ。staging deploy 後に認証して撮影
# 一覧（折りたたみ）desktop/mobile → カード展開 desktop/mobile → 出席者一覧 desktop
# 生成 PNG は outputs/phase-11/screenshots/ 配下に <component>-<state>(-<viewport>).png で保存
```

## 参照資料

- `../../shared-context.md` §7（DOM 改修）/ §9（テスト方針）/ §10（DoD）
- `../phase-9/phase-9.md`（非視覚 evidence の PASS 基準・本 Phase で .txt 化）
- `../phase-10/phase-10.md`（AC 充足判定・視覚 AC の Phase 11 委譲）
- `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md`（screenshot 命名・運用）

## 統合テスト連携

- 非視覚 evidence（typecheck/lint/vitest/verify:tokens/grep/api-diff）は Phase 9 の QA チェックと同一コマンド。Phase 11 ではそれらを `.txt` として tracked-commit 対象にする。
- local 視覚 evidence（screenshot #1〜#5）は AC-1〜AC-5 の一次視覚根拠であり、構造検証（vitest）では代替できない（jsdom 制約）。
- staging 視覚 evidence は production-equivalent runtime の最終確認として Phase 13 user-gated。

## 多角的チェック観点（AIが判断）

- **screenshot-plan の AC カバレッジ**: #1〜#5 が AC-1〜AC-5（視覚側）を漏れなくカバーしているか。
- **viewport 網羅**: desktop / mobile の両方で分離・階層を確認できる計画か。
- **pending 明示**: local screenshot は present、staging screenshot は pending、local evidence は present と分離できているか。
- **3 層評価の分離**: Semantic は vitest、Visual/AI UX は screenshot、と評価層と evidence 種別が正しく対応しているか。
- **削除 evidence の n/a**: FB-UI-02-1 に従い削除 PASS evidence を n/a と明記しているか。

## サブタスク管理

| ID | 状態 | 完了条件 |
|---|---|---|
| EV-1 | 仕様確定 | screenshot-plan（mode VISUAL）が `<component>-<state>` 命名で 5 件確定 |
| EV-2 | 仕様確定 | 3 層評価（Semantic/Visual/AI UX）の観点が記述 |
| EV-3 | completed | evidence inventory が Classification/Path/Status（present/pending/n/a）で完備・local screenshot present / staging screenshot pending |
| EV-4 | completed（local）/ pending（staging） | local screenshot 取得済み。staging screenshot は user-gated |

## 成果物

- screenshot-plan（mode: VISUAL・5 件・viewport 付き）
- local Playwright screenshot 5 件 + `local-visual-review.md`
- 3 層評価（Semantic / Visual / AI UX）観点
- evidence inventory（Classification/Path/Status・local screenshot present / staging screenshot pending）
- 本 Phase 11 仕様書

## 完了条件（implemented_local_evidence_captured 時点）

- [x] screenshot-plan が canonical `<component>-<state>(-<viewport>).png` 命名で 5 件記載
- [x] [W1-02b-1] screenshot-plan が mode: VISUAL と明記
- [x] 3 層評価（Semantic / Visual / AI UX）の観点が記述
- [x] evidence inventory が Classification/Path/Status 表で、Status 語彙が present/pending/n/a
- [x] local screenshot は present、staging screenshot は pending（user-gated）と明記
- [x] 非視覚 evidence（typecheck/lint/vitest/verify:tokens）のファイル名が列挙されている
- [x] local evidence files are present; staging screenshot files are pending/user-gated

## タスク100%実行確認【必須】

- [x] これは VISUAL タスク（VISUAL_ON_EXECUTION）であり local screenshot present / staging screenshot user-gated と明記
- [x] screenshot-plan が `<component>-<state>` 形式で対象画面・状態・viewport を表で記載
- [x] [W1-02b-1] mode: VISUAL を明記
- [x] 3 層評価（Semantic/Visual/AI UX）を記述
- [x] local screenshot は本サイクルで取得、staging screenshot は pending/user-gated と明記
- [x] 代替 local 自動検証の evidence ファイル名を列挙し Status を present/n/a で記載
- [x] local screenshot 実ファイルを保存し、staging screenshot は pending として分離

## 次Phase

- `../phase-12/phase-12.md`（ドキュメント / changelog — 中学生レベル概念説明 + Phase 11 evidence inventory 転記 + compliance）
