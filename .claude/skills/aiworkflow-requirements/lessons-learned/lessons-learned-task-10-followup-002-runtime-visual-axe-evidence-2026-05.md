# Lessons Learned: task-10 follow-up 002 runtime visual + axe evidence

## L-T10FU002-001: `VISUAL_ON_EXECUTION` タスクは workflow_state を 2 段で設計する

`local typecheck/lint PASS` と `runtime screenshot / axe PASS` は別ゲートとして扱う。task-10 では `implemented-local-build-blocked` という workflow_state を新設し、build blocker が解けた時点で `runtime-evidence-captured` に遷移させた。今後 `VISUAL_ON_EXECUTION` を含むタスクを設計する場合は、Phase 1 の時点で 2 段ゲートを明示する。

**Why:** 「local PASS」だけを完了基準にすると、build blocker や CI runtime fail が発覚しても親 task が closed のままになり、Phase 12 detection で漏れる。

**How to apply:** タスク仕様 Phase 1 / Phase 11 で `workflow_state` を `implemented-local` → `runtime-evidence-captured` の 2 段で定義し、Phase 12 strict 4 条件の評価で `runtime` 側の evidence パスを必須化する。

## L-T10FU002-002: runtime evidence は親 task の `outputs/phase-11/evidence/` に集約する

follow-up 002 では evidence を派生 workflow に置かず、親 `task-10-ui-primitives-spec/outputs/phase-11/evidence/` に統合した。下流 task-11..17 が同一 location を参照できるため、parity 検証も 1 箇所で済む。

**Why:** 同種 evidence を派生ディレクトリへ分散させると、後続タスクからの参照と Phase 12 artifacts parity 監査が崩れる。

**How to apply:** follow-up が「親タスクの evidence 補完」の場合、artifact は親の canonical root 配下に保存し、follow-up ディレクトリは `index.md` で参照のみ示す（mirror 重複させない）。

## L-T10FU002-003: axe DOM 構造違反は primitive の barrel export 前に検出する

`Stat` で `<dl>` 直下に `<dt>/<dd>` を置いた構造が axe violation を起こした。`dl > div > dt/dd` の wrapper を要する。runtime axe で初めて検出されたが、primitive 仕様確定（Phase 5/6）の時点で「semantic HTML grouping rule」を contract に含めれば事前に防げる。

**Why:** primitive contract に accessibility shape まで含めないと、Phase 11 runtime axe で初めて違反が浮上し戻り工数になる。

**How to apply:** UI primitive 仕様の Phase 5（API contract）で、`<dl>/<ul>/<ol>` 等の grouping element を持つ primitive は MDN/axe の child element 規則をテンプレに転記し、Phase 7（実装）以前に DOM 構造を fix する。
