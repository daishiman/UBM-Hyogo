---
phase: 12
title: Compliance check — 中学生レベル概念説明と canonical heading SSOT
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 12 — Compliance check

[実装区分: 実装仕様書]

## 1. このフェーズの目的（中学生にも分かる説明）

このフェーズは「**書いた仕様書がチーム共通のルールを守っているか**」を最後に点検する場所。

今回のタスクは「会員（member）画面の枠組み（AppShell）に、決められたラベル（`data-theme="warm"` などの目印）がちゃんと付いているかを、**実際に画面を動かして写し取って証拠に残す**」もの。

これまで member 画面には scrape できる中身（child route）が無くて、責務が「serial-05 / serial-07 に任せた」とだけ書かれて宙に浮いていた（誰もやらない状態）。本タスクでは、すでに動いている `/profile` ページを `(member)` フォルダの中に引っ越して、そこを scrape の対象にして証拠を取る。

このフェーズでやること:

1. **証拠を取る道具（Playwright spec）の名前が `*.spec.ts` ルールを守っているか**を確認する
2. **証拠の中に `#ff0000` のような直書きの色コードが混ざっていないか**を確認する
3. **証拠ファイルの「状態ラベル」が `present` / `pending` / `n/a` だけになっているか**を確認する
4. **会員画面のデータベース（D1）に画面から直接アクセスしていないか**を確認する
5. **`/profile` の URL が変わっていないか**（route group はカッコの中身が URL に出ないルール）を確認する

全部 OK なら Phase 13（PR 作成）へ進める。

## 2. Canonical heading SSOT

Phase 12 の canonical heading / verdict vocabulary は `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` と `.claude/skills/task-specification-creator/references/phase-12-tasks-guide.md` を SSOT とする。9 見出し:

1. このフェーズの目的（中学生にも分かる説明）
2. Canonical heading SSOT
3. Compliance チェックリスト
4. 不変条件チェック
5. 命名 / 構造規約チェック
6. dependency / scope チェック
7. evidence chain チェック
8. 是正アクション
9. compliance result

## 3. Compliance チェックリスト

| ID | 項目 | 期待 | 検証 |
|----|------|------|------|
| C-01 | YAML frontmatter に `phase` / `title` / `workflow_id` / `sub_workflow` / `status` がある | ◯ | grep |
| C-02 | `[実装区分: 実装仕様書]` が冒頭にある | ◯ | grep |
| C-03 | 13 ファイルが存在（phase-01..13） | ◯ | `ls` |
| C-04 | Phase 5 に編集対象パス・spec シグネチャ・grep パターン・既存 import パス調整方針が揃う | ◯ | 目視 |
| C-05 | Phase 11 evidence inventory が parser 仕様（`Phase 11 evidence file inventory` 見出し + `Classification\|Path\|Status` 列）に整合 | ◯ | parser dry-run |
| C-06 | Phase 11 の status 語彙が `present`/`pending`/`n/a` のみ | ◯ | `pnpm verify:phase12-compliance` |
| C-07 | Phase 13 に commit message draft と PR draft が記載 | ◯ | 目視 |
| C-08 | VISUAL のため screenshot 1 点（1280x800 member-shell.png）を Phase 11 で要求 | ◯ | inventory 行 |

## 4. 不変条件チェック

| ID | 不変条件 | 本仕様書での順守 |
|----|---------|-----------------|
| INV-01 | 既存 API endpoint surface のみ接続 | scrape は member 認証 fixture 経由。新 endpoint 追加なし |
| INV-02 | OKLch トークン正本化 | layout コード無変更。TC-03 で scrape 出力に HEX 非混入を assert |
| INV-03 | プロトタイプ正本順位 | parallel-03 実装済み data-* 契約を runtime 確認するのみ。新 primitive なし |
| INV-04 | D1 binding 直接アクセス禁止 | `apps/web` から D1 直接呼び出しなし |
| INV-05 | profile 移動は URL 不変（route group 仕様） | `/profile` URL 維持。AC-01 / R-07 で回帰確認 |
| INV-06 | 新規 production primitive を生やさない | Playwright spec 追加と既存 profile の move のみ |
| INV-07 | status 語彙は valid のみ | `present`/`pending`/`n/a`。`captured` 禁止 |
| INV-08 | テスト suffix `*.spec.{ts,tsx}` のみ | Playwright spec / move された profile spec とも順守 |

## 5. 命名 / 構造規約チェック

| ID | 規約 | 順守 |
|----|------|------|
| N-01 | テスト suffix `*.spec.{ts,tsx}` のみ | `parallel-03-member-shell-scrape.spec.ts`（不変条件#8） |
| N-02 | Playwright spec は `apps/web/playwright/tests/` 配下 kebab-case | ◯ |
| N-03 | 抽出属性名は `(member)/layout.tsx` 実属性と 1:1 一致 | Phase 4 §4.1 |
| N-04 | data-* 契約: `data-theme` / `data-route-group` / `data-shell` / `data-route` / `data-testid` / `data-section-rhythm` | grep パターンに反映 |
| N-05 | evidence path は repo-root 相対 POSIX path | `outputs/phase-11/...`（traversal なし） |
| N-06 | route group ディレクトリ命名 `(member)` | Phase 5 §5.2 Step 1 で順守 |

## 6. dependency / scope チェック

| 依存元 | 依存先 | 順序 |
|--------|--------|------|
| 本タスク | parallel-03-appshell-layouts（member layout + 親台帳） | parallel-03 merge 済み。台帳 1 ファイル更新 |
| 本タスク | followup-002 admin scrape spec | 完了済み（複製ベース） |
| 本タスク | 既存 `/profile` page / lib / components | move のみ。内部実装は無変更 |
| 本タスク | serial-05-page-routes-blueprint-binding | **不要**（本タスクが先行解消） |
| 本タスク | serial-07-regression-evidence / UT-DSF-07 (#829) | full chrome multi-viewport は引き続き serial-07 委譲 |

スコープ外:

- 新規 API endpoint / D1 schema
- `/profile` 内部実装変更
- full chrome multi-viewport screenshot baseline

## 7. evidence chain チェック

- Phase 11 inventory 行と Phase 4 §4.4 親台帳更新行が 1:1 対応
- `dom-scrape-member.txt` / `member-shell.png` は本 spec 配下 + 親 parallel-03 配下の 2 か所に存在（複写）
- `parent-ledger-ev13-ev16-diff.txt` で親台帳変更の trace を残す

## 8. 是正アクション

| 検出されうる drift | 是正 |
|--------------------|------|
| status 語彙 invalid（`captured` 等） | Phase 11 を `present` / `pending` / `n/a` に置換 |
| 親台帳 EV-13/16 未更新 | Phase 5 Step 6 を再実行 |
| profile import 修正漏れで typecheck fail | Phase 5 Step 2 再実行（`@/` alias 化） |
| static-invariants path 4 か所未更新 | Phase 5 Step 3 再実行 |

## 9. compliance result

| Gate | Status |
|------|--------|
| C-01..08 | present |
| INV-01..08 | present |
| N-01..06 | present |

最終判定は実装完了後 `pnpm verify:phase12-compliance` 実行で `OK:n / ERROR:0` を満たすこと。
