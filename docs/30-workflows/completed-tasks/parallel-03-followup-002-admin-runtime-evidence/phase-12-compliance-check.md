---
phase: 12
title: Compliance check — 中学生レベル概念説明と canonical heading SSOT
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 12 — Compliance check

[実装区分: 実装仕様書]

## 1. このフェーズの目的（中学生にも分かる説明）

このフェーズは「**書いた仕様書がチーム共通のルールを守っているか**」を最後に点検する場所。

たとえるなら、宿題を提出する前に「名前は書いたか」「ページ順は合っているか」「ルール通りの形式か」を見直す作業。今回のタスクは「管理画面（admin）の枠組みに、決められたラベル（`data-theme="cool"` などの目印）がちゃんと付いているかを、**実際に画面を動かして写し取って証拠に残す**」もの。

なぜ証拠を残すのか？ それは、parallel-03 というタスクで「ラベルを付けたよ」とコードには書いたけれど、**本当に動かしたときにそのラベルが画面に出ているかは、まだ誰も確かめていなかった**から。確かめずに「できた」と言うと、後で他の画面（19 個ある）が崩れたときに原因が分からなくなる。

このフェーズでやることは:

1. **証拠を取る道具（Playwright の spec）が、ルール通りの名前（`*.spec.ts`）になっているか**を確認する
2. **証拠の中に「#ff0000」のような直書きの色コードが混ざっていないか**を確認する（色は決められたパレットだけ）
3. **証拠ファイルの「状態ラベル」が決められた言葉（`present` / `pending` / `n/a`）だけになっているか**を確認する（`captured` のような言葉を書くと機械が拒否する）
4. **管理画面のデータベース（D1）に画面から直接アクセスしていないか**を確認する
5. **撮らないと決めた証拠（会員画面のスクショなど）を、ちゃんと「別のタスクに任せた」と書いてあるか**を確認する

これらが全部 OK なら Phase 13（PR 作成）へ進める。1 つでもダメなら戻して直す。

## 2. Canonical heading SSOT

Phase 12 の canonical heading / verdict vocabulary は `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` と `.claude/skills/task-specification-creator/references/phase-12-tasks-guide.md` を SSOT とする。親 workflow `parallel-03-appshell-layouts/phase-12-compliance-check.md` と同一の 9 見出しを順守する:

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
| C-04 | Phase 5 に編集対象パス・spec シグネチャ・grep パターン・既存 import パスが揃い、実ファイルに反映済み | ◯ | diff + Playwright |
| C-05 | Phase 11 evidence inventory が parser 仕様（`Phase 11 evidence file inventory` 見出し + `Classification\|Path\|Status` 列）に整合 | ◯ | parser dry-run |
| C-06 | Phase 11 の status 語彙が `present`/`pending`/`n/a` のみ | ◯ | `pnpm verify:phase12-compliance` |
| C-07 | Phase 13 に commit message draft と PR draft が記載 | ◯ | 目視 |
| C-08 | NON_VISUAL のため screenshot 4 点ゲートは N/A（代替: DOM scrape text evidence + 委譲注記） | N/A | 目視 |

## 4. 不変条件チェック

| ID | 不変条件 | 本仕様書での順守 |
|----|---------|-----------------|
| INV-01 | 既存 API endpoint surface のみ接続 | scrape は fixture 内蔵 mock API 経由。新 endpoint 追加なし |
| INV-02 | OKLch トークン正本化 | layout コード無変更。TC-07 で scrape 出力に HEX 非混入を assert |
| INV-03 | プロトタイプ正本順位 | parallel-03 実装済み data-* 契約を runtime 確認するのみ。新 primitive なし |
| INV-04 | D1 binding 直接アクセス禁止 | `apps/web` から D1 直接呼び出しなし（mock API 経由） |
| INV-05 | production code は無変更（verify_existing） | `apps/web/app` / `apps/web/src` は無変更。Playwright spec と docs/evidence のみ追加 |
| INV-06 | 新規 production primitive を生やさない | Playwright spec 追加のみ |
| INV-07 | status 語彙は valid のみ | `present`/`pending`/`n/a`。`captured` 禁止（Phase 5 §7） |

## 5. 命名 / 構造規約チェック

| ID | 規約 | 順守 |
|----|------|------|
| N-01 | テスト suffix `*.spec.{ts,tsx}` のみ | `parallel-03-admin-shell-scrape.spec.ts`（不変条件#8） |
| N-02 | Playwright spec は `apps/web/playwright/tests/` 配下 kebab-case | ◯ |
| N-03 | 抽出属性名は `(admin)/layout.tsx` 実属性と 1:1 一致 | Phase 1 §1.2 / Phase 4 §4 |
| N-04 | data-* 契約: `data-theme` / `data-route-group` / `data-shell` / `data-route` / `data-testid` | grep パターンに反映 |
| N-05 | evidence path は repo-root 相対 POSIX path | `outputs/phase-11/...`（traversal なし） |

## 6. dependency / scope チェック

| 依存元 | 依存先 | 順序 |
|--------|--------|------|
| 本タスク | parallel-03-appshell-layouts（admin layout + 親台帳） | parallel-03 merge 済み（PR #835）。台帳 1 ファイル更新 |
| 本タスク | admin session fixture（`fixtures/auth.ts`） | 実装済み（依存解消） |
| EV-13 | serial-05-page-routes-blueprint-binding | 委譲（member route 整備後） |
| EV-15/16 | serial-07-regression-evidence / UT-DSF-07 (#829) | 委譲（full chrome baseline） |

スコープ外（本タスクで触らない）:

- production code（`apps/web/app` / `apps/web/src`）
- 新規 API endpoint / D1 schema
- member route 整備（serial-05）
- full chrome screenshot baseline（serial-07）

## 7. evidence chain チェック

| Phase | 出力 | 次 Phase での参照 |
|-------|------|------------------|
| Phase 1 要件 | FR/AC + issue 乖離表 + 委譲表 | Phase 4 / 5 / 12 |
| Phase 2 architecture | 再利用表 / status 語彙表 | Phase 4 / 5 |
| Phase 3 task breakdown | S-01..S-04 + 4 条件評価 | Phase 5 / 8 |
| Phase 4 interface contract | spec シグネチャ / TC-01..08 | Phase 5 / 6 |
| Phase 5 implementation guide | spec 全文 / 親台帳 before-after | 実装直後 / Phase 6 |
| Phase 6 test strategy | TC-09..11 fail path | Phase 7 / 11 |
| Phase 7 coverage | concern×evidence 表 | Phase 10 |
| Phase 8 DoD | DoD-1..8 + refactor 表 | Phase 13 PR draft |
| Phase 9 risks | R-01..R-07 | Phase 13 PR risk section |
| Phase 10 local verification | コマンド集 + AC 対応 | 実装中 / PR 前 |
| Phase 11 evidence | EV-A/EV-E present + 親 EV-12 scrape present、EV-B..D は pending verification logs | Phase 13 PR 本文 |
| Phase 12 compliance | C/INV/N/dep/chain table | Phase 13 PR compliance section |
| Phase 13 commit / PR | 全 Phase 統合 | merge |

## 8. 是正アクション

| 検出パターン | 是正 |
|-------------|------|
| status に `captured`/`done`/`deferred-*` 検出 | `present`/`pending`/`n/a` に置換（Phase 5 §7） |
| grep パターンに存在しない属性（`data-shell="appshell"` 等）混入 | current code 実属性へ修正 |
| scrape 出力に `#[0-9a-fA-F]{3,6}` 検出 | layout の HEX 混入を調査し OKLch トークンへ是正（本来 layout 無変更のため発生しない想定） |
| `*.test.ts` 検出 | `*.spec.ts` にリネーム |
| 委譲 EV の委譲先注記欠落 | 親台帳に serial-05 / serial-07 (#829) を追記 |
| evidence_path が repo root を逸脱 | 相対 POSIX path に修正 |

## 9. compliance result

### 30種思考法 compact evidence

| カテゴリ | 適用した思考法 | 今回の判断 |
|----------|----------------|------------|
| 論理分析系 | 批判的思考 / 演繹思考 / 帰納的思考 / アブダクション / 垂直思考 | `implementation` 仕様なのに spec-only で止める矛盾を検出。skill 前提（実ファイル反映）→ 変更分 → Playwright spec + evidence 実装が必要、という結論に収束 |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | 対象を「実行 spec」「親 EV-12 evidence」「親台帳」「自 workflow evidence」「gate metadata」に分解。production code 変更不要 / evidence harness 必要の2軸で最小変更へ整理 |
| メタ・抽象系 | メタ思考 / 抽象化思考 / ダブル・ループ思考 | 原 issue の `captured` 語彙や curl 前提をそのまま採用せず、validator 語彙 `present/pending/n/a` と Playwright fixture に抽象化して再設計 |
| 発想・拡張系 | ブレインストーミング / 水平思考 / 逆説思考 / 類推思考 / if思考 / 素人思考 | screenshot 追加ではなく DOM scrape text evidence を採用。もし member/screenshot まで同時取得すると責務重複するため serial-05/07 委譲を維持 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | 親 Phase 11 台帳が `pending` のままだと Phase 12 evidence chain が停滞する因果を解消。EV-12 output と parent inventory を同 wave で同期 |
| 戦略・価値系 | トレードオン思考 / プラスサム思考 / 価値提案思考 / 戦略的思考 | production code 無変更で regression guard と evidence を追加し、parallel-03 親 workflow の価値を上げた。serial-07 の visual baseline 責務は侵食しない |
| 問題解決系 | why思考 / 改善思考 / 仮説思考 / 論点思考 / KJ法 | 根本原因を「機能未実装」ではなく「runtime evidence 未取得 + status 語彙 drift」と特定。Playwright spec 実行で仮説を検証し、4条件を再確認 |

| 結果 | 条件 |
|------|------|
| IMPLEMENTED_LOCAL_EVIDENCE_CAPTURED | C-01..07 / INV-01..07 / N-01..05 / dependency / evidence chain すべて green（C-08 は NON_VISUAL のため N/A）、EV-12 runtime DOM scrape present |
| FAIL | 上記いずれかが red |

本タスクは `IMPLEMENTED_LOCAL_EVIDENCE_CAPTURED`。`parallel-03-admin-shell-scrape.spec.ts` を実行し、親 `dom-scrape-admin.txt` と親台帳 EV-12=`present` を反映済み。commit / push / PR は user 明示承認後のみ（CONST_002）。
