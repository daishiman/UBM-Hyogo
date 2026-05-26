# Lesson: issue-903 (parallel-03-followup-005) member runtime evidence 実装での苦戦点

- date: 2026-05-25
- workflow: `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/`
- workflow_state: implemented_local_evidence_captured

## L-I903-001: 委譲先 EV-ID の grep 裏付けが委譲扱いの前提

**事象**: 当初は serial-05 / serial-07 / UT-DSF-07 (#829) への委譲で EV-13/EV-16 を消化済み扱いにしようとしたが、委譲先 phase-11 inventory / phase-08 DoD のいずれにも `EV-13` / `EV-16` / `/profile` route の明示行が無いことが grep で判明し、followup-002 R-07 の宙吊りが顕在化していた。

**根本原因**: 「委譲先の workflow が存在する」=「該当 EV が委譲済み」と短絡していた。

**再発防止**:
- 委譲先 workflow を扱う際は `grep -rE "EV-\\d+|/<route>" <delegate-dir>/phase-08* <delegate-dir>/phase-11*` で **当該 EV-ID または対象 route が明示列挙されているか** まで確認してから committed扱いにする。
- task-workflow-active.md の owner 行に「委譲」と書く場合、対応する delegate ledger 行を併記する。

## L-I903-002: route group `(member)` 物理移動による親 layout 継承

**事象**: 親 `parallel-03-appshell-layouts` の AppShell evidence 不足（EV-13/EV-16）を埋めるため、当初は `(member)` 配下に scrape 用 stub route を追加する案が出たが、副作用とテスト面の表面積が大きい。

**根本原因**: Next.js App Router の route group は URL に影響しない仕様を活用していなかった。

**再発防止**:
- AppShell evidence gap を埋める際は **既存 route の物理移動**（例: `app/profile` → `app/(member)/profile`）を第一選択肢にし、新規 stub route は最終手段とする。
- `aiworkflow-requirements/references/arch-state-management-core.md` 等で current physical path を **同 wave** で同期。

## L-I903-003: route 物理移動は static-invariants と eslint glob を同 wave 更新

**事象**: `app/profile` → `app/(member)/profile` 移動後、`apps/web/src/__tests__/static-invariants.runtime.spec.ts` の path walker 4 か所と `apps/web/eslint.config.mjs` の override glob が旧 path を参照したまま残り、typecheck 直前で fail。

**根本原因**: route 移動を「ドキュメント整備」とみなし、静的検証コードを同 wave に含めていなかった。

**再発防止**:
- route 物理移動は Phase 5 Step に **「static-invariants spec の path 文字列 / eslint override glob / visual-harness import を同 wave 更新」** を必ず明記する。
- pre-push 前に `grep -rE "app/<old-path>" apps/web/src` を `verify:phase12-compliance` 相当のローカル fence として実行する。

## L-I903-004: AppShell runtime scrape spec の selector 重複出力

**事象**: AppShell の DOM scrape spec で `[data-shell-region]` `[data-shell-segment]` 等 multiple data-* selector が同一要素にヒットし、出力が重複した。

**根本原因**: 1 要素が複数契約属性を持つ前提が selector loop に反映されていなかった。

**再発防止**:
- AppShell scrape spec は **selector ループ後に出力行を dedupe**（例: tuple `[outerHTML, attrSet]` で Set 化）し、各 required attribute は **assertion で別行に分けて検証**する。
- `quality-e2e-testing.md` reference 末尾に上記方針を追記済み。

## L-I903-005: route 移動後の index 群同 wave 同期

**事象**: 移動後の `(member)/profile/**` を `aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / artifact inventory 6 本の current path に反映し忘れ、初版で drift が残った。

**根本原因**: 「dir 移動の stale 参照」を 30-workflows 配下に限定して grep してしまい、`.claude/skills/aiworkflow-requirements/` 横断を漏らした。

**再発防止**:
- route 物理移動時の stale 参照 grep は **`docs/` + `.claude/skills/`** の 2 root を同時に走査する（`feedback_stale_ref_grep_filepath_gotcha` も参照）。
- 旧 path 言及は「stale route removed」「historical move row」等の **明示的な履歴行のみ** に残し、current implementation target には残さない。

## 関連

- patterns-lessons: `task-specification-creator/lessons-learned/issue-903-member-runtime-evidence.md` の L-I903-001..005 と同型
- 起源 followup: parallel-03-followup-002 R-07「委譲 EV の宙吊り」根本解消
