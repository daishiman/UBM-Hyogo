---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 12
phase_name: ドキュメント
created_at: 2026-05-29
---

# Phase 12: ドキュメント

[実装区分: 実装仕様書]

## 1. 中学生レベル概念説明

- **visual baseline（見本画像）**: ウェブ画面が壊れていないか確かめるための「お手本画像」。CI が新しく撮った画像とこのお手本を比べて、ピクセルの違いが大きいと fail する。今回は 3 つのロール × 画面サイズで 7 枚のお手本を撮る。
- **viewport（窓の大きさ）**: ブラウザの表示領域の大きさのこと。スマホ・タブレット・PC で見え方が違うので、3 通りの大きさ（375 / 768 / 1280 px）で撮る。
- **smoke（ざっと動作確認）**: 細かい所まで全部テストするのではなく、「とりあえず開いて主要な操作が動くか」をざっと確認するテスト。今回は 6 ケース（メニューの中身 / drawer 開閉 / 折りたたみ）を確認する。
- **collapsible sidebar（折りたためる横メニュー）**: 画面の左にずっと出ている縦長のメニュー。ボタンを押すと細く折りたためて、アイコンだけの表示になる。公開・会員・管理の 3 層で同じものを使う。
- **drawer（横から出るメニュー）**: スマホのように画面が狭いときは、横メニューを普段は隠しておき、ハンバーガーボタンを押すと横からスッと出てくる引き出し型メニューにする。これを drawer と呼ぶ。
- **bot push（CI の自動コミット）と pull_request 非発火**: 見本画像は CI が自動で commit してくれるが、GitHub の bot トークン（GITHUB_TOKEN）が起こした push は「pull_request」イベントを発火させないルールがある。だから人間があとから「空コミット」を push して、もう一度チェックを走らせる必要がある。
- **regression dry-run（わざと壊して検知確認）**: お手本との比較がちゃんと働くか確かめるため、わざと色トークンを少しだけ変えて、CI が「違いがある！」と気づいて fail するか試す。気づいたのを確認したらすぐ元に戻す。

---

## 2. 必須見出し（canonical 9）

1. 概要
2. AC（受け入れ条件）
3. 不変条件
4. 変更対象ファイル
5. テスト方針
6. CI / gate
7. 運用フロー
8. evidence 配置
9. DoD（完了条件）

---

## 3. implementation-guide.md（要追記）

`outputs/phase-12/implementation-guide.md` に下記を含める:

- **3 ステップ運用フロー**: (1) CI Linux runner で `-linux.png` baseline 取得 → (2) bot が baseline を自動 push → (3) 人間が空コミットを push して required check を再トリガー（GITHUB_TOKEN は `pull_request` 非発火のため）。
- **smoke と visual の役割分担**:
  - smoke（`sidebar-shell-smoke.spec.ts`）= shell の DOM 構造・nav item 数・drawer/collapse の動作を assertion で確認（ピクセル比較なし）。
  - visual（`sidebar-shell-visual.spec.ts`）= 3 role × 3 viewport の 7 点を `toHaveScreenshot` でピクセル比較し、レイアウト/トークン regression を検出。
- **regression dry-run 手順**: `tokens.css` の shell 参照 OKLch token を改変 → CI `visual (sidebar-shell *)` が fail → diff artifact 確認 → revert。詳細は phase-11-manual-test.md §3-4。
- **required check 候補（PUT は user-gated）**: `playwright-smoke / smoke (chromium)`, `playwright-smoke / visual (sidebar-shell desktop)`, `... tablet`, `... mobile`。実 `gh api -X PUT` は user 明示承認後のみ。
- **パストポロジ補正の周知**: source task が記載した `apps/web/tests/e2e/sidebar-shell-*.spec.ts` は実構造（E2E 正本 `apps/web/playwright/tests/`）と乖離していたため、本仕様では `apps/web/playwright/tests/sidebar-shell/` へ補正済み（phase-1 §7 / phase-3 R1）。実装着手時に旧パスへの参照を生やさないこと。

---

## 4. 関連ドキュメント参照

| 参照先 | 用途 |
|---|---|
| `docs/00-getting-started-manual/specs/design-tokens.md` | regression dry-run の対象 OKLch token 確認 |
| `apps/web/src/styles/tokens.css` | OKLch token 正本（regression dry-run 改変対象） |
| `apps/web/playwright/fixtures/auth.ts` | 拡張 `test`（anonymousPage / memberPage / adminPage + mockApi）を再利用 |
| `apps/web/playwright.config.ts` | `sidebar-shell-visual-*` project / snapshotPathTemplate / testIgnore |
| 親 workflow `docs/30-workflows/unified-sidebar-shell-public-and-admin/` | ロール語彙・nav 構成・Task A-E 完了状態・`data-testid` 契約 |
| `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/` | visual baseline / CI matrix / `-linux.png` 正本の前例 |
| MEMORY: 空コミット再トリガー運用 / `-linux.png` 正本 | bot push 後の `pull_request` 非発火対策・OS 差吸収 |

---

## 5. CONST_007 ドキュメント明記

- 本仕様は本サイクル内で完結する（実装着手のみ親 Task A-E 完了後）。
- baseline 実撮影 / bot push / 空コミット再トリガー / required status check PUT / commit / push / PR のみ user-gated として分離。
- バックログ・別 Issue・別 PR への先送りは無し（実装着手は sibling task への技術的依存であり「先送り」ではない）。
