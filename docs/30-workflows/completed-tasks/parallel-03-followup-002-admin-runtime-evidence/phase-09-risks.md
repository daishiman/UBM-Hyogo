---
phase: 9
title: 品質保証 — リスク・回帰・mirror parity 一括判定
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 9 — 品質保証（リスク台帳）

[実装区分: 実装仕様書]

## 1. リスク台帳

| ID | リスク | 影響 | 確度 | 緩和策 |
|----|--------|------|------|--------|
| R-01 | mock API（fixture port 8787）の admin dashboard レスポンスが SSR を抑止し shell が描画されない | EV-12 が空になる | 低 | TC-01 で `waitForSelector('[data-testid="admin-shell"]')` を attach 待ちし、TC-10 で `lines.length > 0` を assert。空なら fail させ evidence 化を防ぐ |
| R-02 | parser が picking する見出しと evidence path の不一致で gate が誤検知 | `verify:phase12-compliance` fail | 中 | 自 workflow の phase-11 inventory は `## Phase 11 evidence file inventory` 見出し + `Classification\|Path\|Status` 列に固定。自 evidence は `pending`（存在チェック対象外） |
| R-03 | status 語彙に `captured` 等 invalid を書く | gate fail | 中 | Phase 5 §7 / Phase 8 で `present`/`pending`/`n/a` 限定を明記。親台帳 EV-12 は `present`、委譲 EV は `pending` |
| R-04 | 親 outputs への書き出し path が相対基準ズレで repo 外へ出る | path traversal / gate fail | 低 | `task15-admin-screenshots.spec.ts` と同じ `apps/web` cwd 起点の相対 path。`writeFile` は repo 内のみ |
| R-05 | layout 実属性が将来変更され grep が 0 hit 化 | EV-12 が contract regression として fail | 低（むしろ意図） | これは regression guard として **意図的**。TC-09 で属性欠落即 fail を担保 |
| R-06 | scrape 出力に HEX 直書きが混入し OKLch 不変条件違反を見逃す | 不変条件#2 違反 | 低 | TC-07 で抽出行に `#[0-9a-fA-F]{3,6}` が無いことを assert |
| R-07 | 委譲 EV（EV-13/15/16）が「先送り」と誤解され宙に浮く | trace ロスト | 中 | 親台帳に委譲先（serial-05 / serial-07・#829）と理由を明記。Phase 12 dependency 表にも記録 |

## 2. 回帰観点

- production code（`apps/web/app/(admin)/layout.tsx` 他）を変更しないため、既存 `(admin)/layout.spec.tsx` 等の unit regression は影響を受けない。
- 追加するのは Playwright spec 1 本のみ。既存 e2e（`task15-admin-screenshots.spec.ts` / `auth-gate-state.spec.ts`）と責務を分離し重複しない（Phase 6 §2）。

## 3. mirror / parity

- 本タスクは `.claude/skills` mirror を伴わない（skill 変更なし）。
- 親 workflow（parallel-03-appshell-layouts）の台帳 1 ファイルを更新するため、親 workflow の他 phase との整合（EV-12 path 一致）を Phase 10 で確認する。

## 4. 一括判定

R-01..R-07 の緩和策がすべて spec 内に織り込まれている。production code 無変更のため line budget / 既存テスト破壊リスクは無し。Phase 10 のローカル検証コマンドで最終確認する。
