# Lessons Learned: issue-1005 members-ux Playwright visual baseline stabilization

`apps/web/playwright/tests/members-ux-clarity.spec.ts` の visual baseline を cold start（dev server 新規起動）でも direct-script 補完なしで 24 state 生成できる状態へ整え、完了タスク dir 移動由来の出力先 path drift を補正した（`implemented_local_evidence_captured / implementation / VISUAL`）。本 lessons-learned は次回類似タスクで同じ苦戦を最短で抜けるための知見集。RC-1〜RC-5 を skill 正本へ昇格させる。

## L-I1005-001: completed-tasks への dir 移動は「参照する側」の path drift も同 wave で補正する

workflow root を `completed-tasks/` 配下へ移動すると、移動した docs だけでなく、その dir パスを **ハードコード参照する非ドキュメント資産** が古い active path を指したまま残る。本件では Playwright spec の `workflowRoot` 定数（`docs/30-workflows/members-list-ux-clarity` 固定）が drift しており、再実行すると誤った新規 active dir に PNG / runtime-notes を書き込む回帰になっていた。

**Why:** MEMORY.md の既知教訓「移動先 dir 配下の残存検索に `grep -v` で自分自身を除外して self-ref を見逃す」は **移動された側** の self-ref。本件はそれと対をなす **移動 dir を参照する側** の drift で、移動 docs の grep だけでは検出できない。

**How to apply:** close-out / dir 移動時に `docs/30-workflows/<slug>` 形式の文字列リテラルを `apps/web/playwright/**`・config の `EVIDENCE_DIR`・env default など実コードから grep し、移動先 path（`completed-tasks/<slug>`）へ同 wave で補正する。さらに `process.env.<TASK>_EVIDENCE_DIR` override を残し、将来の root 再移動にも耐える形にする。

## L-I1005-002: explicit screenshot path は spec-local canonical default + task env override の二段で持つ

`page.screenshot({ path })` で明示パスを書く visual spec は、グローバルな `PLAYWRIGHT_EVIDENCE_DIR` だけでは出力先を書き換えられない。spec 内に canonical default を持ち、かつ task 固有の env override を許容する二段構成が必要。

**Why:** グローバル env は test runner 全体の挙動を変えるが、spec が `path` を明示している限りその値が優先されるため、drift 補正が効かない。

**How to apply:** evidence 出力を伴う spec では `const workflowRoot = process.env.<TASK>_EVIDENCE_DIR ?? '<canonical completed-tasks path>'` のように default + override を spec-local に置く。

## L-I1005-003: cold compile が遅い route は ready URL + webServer timeout + hook timeout の3点で warm-up する

Next dev（`dev:webpack`）は on-demand compile のため、matrix 先頭テストが `/members` の cold compile に当たり per-test timeout を超過して flaky になる。`/members` の初回 compile は 120s を超える場合がある（本件で 74s 観測）。

**Why:** ready URL を `/` のままにすると route 自体は compile されず、最初の visual テストが compile 待ちを丸ごと被る。timeout を 1 箇所だけ伸ばしても、warm-up navigation 側の hook timeout が default のままだと別の箇所で落ちる。

**How to apply:** task-specific evidence flag では (1) webServer の ready URL を実 route（`${localBaseURL}/members`）へ、(2) `webServer.timeout` を 180s へ、(3) spec の `beforeAll` warm-up navigation に明示 hook timeout を設定、の3点を**同時**に行う。既存 `isMembersPrototypeAlignment` と同型の flag を増設するのが最小差分。

## L-I1005-004: evidence-only visual spec は default matrix から除外し、flag/argv で単一 project 実行に絞る

spec が default の desktop-chromium / desktop-firefox / mobile-webkit 3 project で同名 24 PNG を 3 重に上書きすると、flake 面と実行時間が増える。

**Why:** baseline 取得は代表 1 project で十分。3 project 実行は PNG を上書きするだけで evidence 価値を上げず、flaky 発生面を 3 倍にする。

**How to apply:** evidence flag 未設定時は `fixtureGatedTestIgnore` で当該 spec を default matrix から除外し、evidence run（argv match / env flag）時のみ単一 project（desktop-chromium 相当）で 1 回実行する。非 primary project には ignore を入れる。

## L-I1005-005: mobile collapsed UI は state 属性を wait し、capture-only DOM fallback を許容する

mobile viewport の collapsed filter は、cold-start hydration 直後に可視クリックを送っても click state が反映されず `filters-body` が hidden のまま残ることがある。

**Why:** hydration 完了前の click は React state に届かないため、visual baseline 取得が非決定的になる。

**How to apply:** visual baseline spec ではクリック後に `data-expanded=true` を wait する。toggle の interaction contract を component test が担保している場合に限り、baseline 取得目的の最終 fallback として DOM 属性を直接固定する capture-only fallback を許容する（toggle 機能自体の検証は component test に委譲）。

## L-I1005-006: test-stabilization は implementation テンプレートで吸収し spec-only close しない

`implementation / VISUAL` で実コード対象（config / spec）が明記されているタスクは、test infra のみの変更であっても spec-only close は矛盾になる。実コード差分 + Phase 11 evidence（cold-start 24 PNG / Playwright PASS / manual-test-result）を同サイクルで生成して `implemented_local_evidence_captured` に倒す。

**Why:** test-stabilization を「仕様書を作る」だけで close すると、実際の flaky 解消・path drift 補正が検証されないまま完了扱いになる。

**How to apply:** test infra 編集タスクも既存 implementation テンプレート（Phase 1-13 + canonical 9 見出し）で表現できる。Phase 11 で cold-start evidence を取得し、commit / push / PR / staging visual baseline / Issue state 変更のみ user-gated に残す。
