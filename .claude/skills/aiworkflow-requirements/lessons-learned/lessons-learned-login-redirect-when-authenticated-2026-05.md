# Lessons Learned: login-redirect-when-authenticated (2026-05)

`docs/30-workflows/completed-tasks/login-redirect-when-authenticated/` の Phase 12 close-out で確定した learnings。

## L-LRWA-001 既存 predicate の薄い wrapper として helper を導入する

**Rule**: `next` query 用 `safeNext(raw): string | null` は、既存 `apps/web/src/lib/url/safe-redirect.ts` の `isSafeInternalRedirect` を内部で呼び出し、追加で query 固有の制約（`MAX_NEXT_LENGTH=256`、`:` 含有禁止）だけを上乗せする wrapper として実装する。redirect policy 本体（`/` 始まり / `//` 始まり禁止 / `\\` 含有禁止）を helper 側で再実装しない。

**Why**: redirect policy を 2 箇所に持つと将来の URL 仕様変更で drift する。本タスクは「query 専用の境界条件追加」だけが新責務なので、既存 predicate を SSOT として再利用する。

**How to apply**: `lib/url/` 配下に新規 helper を作るとき、既存 `safe-redirect.ts` の予測 predicate と機能が重複しないか先に grep する。重複したら helper 内で existing predicate を呼ぶ wrapper パターンに倒す。

## L-LRWA-002 同階層 ls による命名規則多数派の確定

**Rule**: 元タスク仕様が camelCase ファイル名（例: `safeNext.ts`）を指定していても、Phase 1 で対象ディレクトリを `ls` / `rg --files` で実測し、既存命名規則の多数派（`apps/web/src/lib/url/` は kebab-case path + camelCase export）に合わせて Phase 2 で path を補正する。export 名は camelCase を維持する。

**Why**: 命名規則の混在は将来の import autocompletion / barrel 集約で drift コストを生む。タスク仕様の literal よりも、同階層の実測 majority を正本にする。

**How to apply**: Phase 1 で `ls apps/web/src/lib/<dir>/` と `rg --files apps/web/src/lib/<dir>/` の両方を取り、kebab-case / camelCase の比率を記録する。多数派と矛盾する spec 指定があれば Phase 2 で補正し、その旨を `phase-2-design.md` に明示する。

## L-LRWA-003 `/login` 自己ループ防止は helper 側で `null` に倒す

**Rule**: `safeNext("/login")` および `safeNext("/login?state=sent")` は `null` を返し、`page.tsx` 側で `next ?? "/profile"` の fallback に倒す。helper 自身に `if (path === "/login") return null` を入れ、call site の if 分岐を増やさない。

**Why**: 自己ループの判定責務を helper に集約することで、呼び出し側は `safeNext(...) ?? "/profile"` の 1 行ですみ、テストも helper の 16 ケースで網羅できる。

**How to apply**: 「自分自身のページに redirect しない」契約を持つ helper を作るときは、helper 内で literal path match して `null` を返し、call site では fallback 1 行で受ける。

## L-LRWA-004 NON_VISUAL 早期分類

**Rule**: `taskType: implementation` でも、成果が server-side redirect wiring + 純関数 helper / unit test のみで、UI layout / rendered state / CSS / browser-visible copy を一切変更しないなら `visualEvidence: NON_VISUAL` と Phase 1 で判定する。Phase 11 は screenshot ではなく focused unit/component test + typecheck + lint を一次証跡にする。

**Why**: 画面差分が出ないタスクで Phase 11 screenshot を要求すると、空の baseline 比較や no-op visual baseline を増やすだけで evidence value がない。focused tests の方が regression coverage として強い。

**How to apply**: Phase 1 で `visualEvidence` を決める前に「画面に出る何かを変えるか」を問い、変えないなら NON_VISUAL。Phase 11 は manual-test-result.md + focused vitest 実行ログで close out する。

## L-LRWA-005 same-wave 反映漏れの再発防止

**Rule**: skill 同期は同一 wave で `SKILL.md` history + changelog dated file + LOGS headline + quick-reference + resource-map + topic-map + task-workflow-active + artifact inventory + lessons-learned + indexes:rebuild の 9 surface 全てに反映する。1 つでも欠けると Phase 12 同期判定で「漏れあり」になる。

**Why**: 過去サイクルで LOGS headline / lessons-learned が後追いになり、後続タスクの参照経路が片肺になる事例があった。Phase 12 strict 7 + same-wave 9 surface を 1 wave で揃えるのが既定。

**How to apply**: Phase 12 編集の最後に 9 surface checklist を grep で確認する（例: `grep -l 'login-redirect-when-authenticated' .claude/skills/aiworkflow-requirements/**/*.md`）。

## Anti-pattern

- helper を新規追加するとき、既存 predicate の存在を確認せず redirect policy を独自実装する → drift 確定
- 命名規則を spec literal のまま採用し、同階層 majority を ls しない → kebab/camel 混在
- NON_VISUAL タスクで惰性的に Phase 11 screenshot を要求し、空 baseline を量産する
