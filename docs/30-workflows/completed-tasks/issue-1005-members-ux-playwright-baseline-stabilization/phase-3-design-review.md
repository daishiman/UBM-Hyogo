<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 3 -->

[実装区分: 実装仕様書]

# Phase 3 — 設計レビュー

## 1. 代替案比較

### RC-1（cold-compile race）への対策

| 案 | 内容 | 採否 | 理由 |
| --- | ---- | ---- | ---- |
| A: 固定 sleep | matrix 前に `waitForTimeout(10s)` | ✗ | flaky 化（runtime-notes リスク表で既に禁止）。compile 時間は環境依存で固定値が当たらない。 |
| B: per-test retry 数増加 | `retries: 2` を local でも有効化 | ✗ | flake を隠すだけで根本解決にならず、実行時間も増える。欠落 PNG の再現性問題を残す。 |
| **C: config ready URL `/members` + spec beforeAll warm-up** | webServer 起動完了条件を `/members` 200 にし、さらに beforeAll で warm navigate | **✓ 採用** | 既存 `isMembersPrototypeAlignment`（ready URL `/login`）の実績パターン。compile race を起動フェーズに前倒しして決定論化。2 層防御で残留 race も吸収。 |

### RC-2（path drift）への対策

| 案 | 内容 | 採否 | 理由 |
| --- | ---- | ---- | ---- |
| D: 旧 path のまま | 何もしない | ✗ | 再実行で誤った新規 dir を作る回帰を放置。AC-3 違反。 |
| E: config EVIDENCE_DIR のみ補正 | spec の hardcode は残す | ✗ | spec の `workflowRoot` は test runner プロセスで評価され config の dev-server env を受けないため、不一致が残る。 |
| **F: spec `workflowRoot` 補正 + env override + config EVIDENCE_DIR 整合** | 両者を `completed-tasks/...` に揃える | **✓ 採用** | spec と config の指す先を一致させ、将来の dir 移動に env override で備える。 |

### RC-3（冗長 project 実行）への対策

| 案 | 内容 | 採否 | 理由 |
| --- | ---- | ---- | ---- |
| G: 放置（3 project 上書き） | | ✗ | 同名 PNG を 3 重上書きし、webkit/firefox の flake 面を残す。AC-4 違反。 |
| **H: evidence flag gating（fixtureGatedTestIgnore + project testIgnore）** | flag 未設定時除外 / evidence 時 desktop-chromium のみ | **✓ 採用** | 既存 fixture-gated spec（admin-requests 等）と同じ仕組みで一貫性が高い。 |

### RC-4（runtime-notes 誤誘導）

| 案 | 採否 | 理由 |
| --- | ---- | ---- |
| **I: afterAll 文言更新** | **✓ 採用** | 低リスク。安定化の証跡を runtime-notes に固定（AC-5）。 |

## 2. リスクと緩和

| リスク | 緩和策 |
| --- | --- |
| ready URL `/members` が SSR fetch で mock API 未起動時に 500 を返し webServer 待機が timeout | mock API は test fixture で起動するが、webServer 起動時点では未起動。`/members` SSR は `safeServerFetch` で fail-soft（空表示）するため 200 を返す設計を Phase 4 で確認する。万一 5xx の場合は ready URL を `/` に戻し beforeAll warm-up のみに切替える fallback を Phase 5 に記載。 |
| `beforeAll` が `mockApi` fixture を使えない | `browser` fixture から page を生成し、compile/SSR 到達のみを目的とする（assertion はしない）。mock API 依存の本 assertion は各 test 内で実施。 |
| baseline PNG 差分（warm-up 追加で初期化挙動が変わる） | matrix / viewport / mask / 命名を不変に保つ。warm-up は撮影前 navigation のみで描画内容に影響しない。 |
| 既存 evidence flag への副作用 | config は追加分岐のみ。既存 `is*` 分岐の条件・順序を変更しない（diff レビューで確認）。 |

## 3. 不変条件チェック

- INV-1（API 不変）: ✓ Playwright / config のみ変更。
- INV-5（spec 命名）: ✓ 新規 test ファイルを作らず既存編集のみ。
- CONST_007（1 サイクル）: ✓ 4 根本原因を 1 PR で完結。先送りなし。

## 4. レビュー結論

採用案 C / F / H / I は全て既存の config パターン（`isMembersPrototypeAlignment` / `fixtureGatedTestIgnore`）に整合し、新しい抽象を導入しない。実装は config 2 ファイル（実質は config + spec の 2 ファイル）に閉じ、低リスク。**Gate-A（spec_review）通過可**。

## DoD

- [x] 各 RC に対し 2 案以上を比較し採用根拠を明記
- [x] リスクと緩和策を表で提示
- [x] 不変条件 / CONST_007 への適合を確認
- [x] Gate-A 通過判定を明記
