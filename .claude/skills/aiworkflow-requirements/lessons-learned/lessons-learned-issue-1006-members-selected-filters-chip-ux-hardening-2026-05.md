# Lessons Learned: issue-1006-members-selected-filters-chip-ux-hardening (2026-05)

`docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/` の Phase 12 close-out で確定した learnings。`/members` の `SelectedFiltersBar` を tag label 解決・削除後 focus 復帰・mobile 縦積みで堅牢化した `implemented_local_runtime_pending / implementation / VISUAL` タスク。

## L-I1006-001 `document` 直接アクセスは `isBrowser()` ガード + scoped eslint-disable で通す（苦戦箇所）

**Rule**: client コンポーネントから `document.getElementById(...).focus()` のような DOM 直接アクセスを行う場合、implementation-guide の素朴な `document.getElementById("member-search-input")?.focus()` をそのまま書くと `no-restricted-globals` lint に弾かれる。`apps/web/src/lib/is-browser.ts` の `isBrowser()` で early-return ガードし、その 1 行にだけ `// eslint-disable-next-line no-restricted-globals -- isBrowser() guard above ensures document is defined.` を付与する。

**Why**: 本タスクで最も時間を取られたのがこの lint 境界だった。implementation-guide（Phase 12）は `onEmpty={() => document.getElementById(...)?.focus()}` と記述していたが、`apps/web` は SSR / Worker ランタイム互換のため global `document` 直参照を lint で禁止しており、guide 通りに実装すると `pnpm lint` が fail する。設計ドキュメントは「何を呼ぶか」を示すが、`apps/web` の lint boundary（`no-restricted-globals`）は別レーンの制約として実装時に必ず効いてくる。

**How to apply**: `apps/web/src` の client コンポーネントで `document` / `window` / `localStorage` を触る前に、(1) `isBrowser()`（または `safe-local-storage` 等の既存 util）で SSR ガードを挟み、(2) scoped な `eslint-disable-next-line` を理由コメント付きで付ける。implementation-guide に `document.xxx` が裸で書かれていたら、それは実装段階で guard + disable へ展開する前提と読む（guide を逐語コピーしない）。

## L-I1006-002 VISUAL public surface が auth/backend gate 越しのとき data-backed screenshot は runtime pending に倒す（苦戦箇所）

**Rule**: `/members` のような公開画面でも、ローカル dev server で `/public/members` が backend auth（`AUTH_SECRET` / D1 binding）未設定により 500 を返す環境では、data-backed full-page screenshot は取得できない。この場合 evidence を 2 段に分離する: (1) semantic / focus / fallback は focused Vitest、(2) mobile stacking / label / focus ring は Playwright **component-harness** screenshot で local 取得し、(3) data-backed full-page visual screenshot と staging verification は `runtime pending`（user-gated）として明示残置する。`workflow_state` は `implemented_local_runtime_pending` を使う。

**Why**: VISUAL タスクだからと local で full-page screenshot を強行すると 500 エラー画面を baseline 化する事故になる。component-harness はコンポーネントに props を直接流して描画できるため backend を経由せず label / focus / CSS を検証でき、画面遷移を要する data-backed visual だけを runtime 境界に残せる。

**How to apply**: Phase 1 で「この画面は local で backend auth 無しに 200 で描画されるか」を確認する。されないなら VISUAL でも Phase 11 を component-harness + focused Vitest を一次証跡、data-backed screenshot を runtime pending と最初から設計する。artifact inventory / quick-reference / compliance-check に 500 の事実と `present_component_harness` の区分を明記する。

## L-I1006-003 再レンダーをまたぐ focus 復帰は chipRefs Map + pendingFocusRef + signature useEffect で実装する

**Rule**: chip 削除のように「クリック → state 更新 → 再レンダーで対象 DOM が消える」操作の focus 復帰は、(1) `useRef(new Map<string, HTMLButtonElement>())` に ref callback で set/delete、(2) 削除ハンドラ内で「次 chip → 無ければ前 chip → 0 件なら親へ委譲」の順に focus 先 key を `pendingFocusRef.current` へ確定してから `chip.onRemove()` を呼ぶ、(3) `chips.map(c => c.key).join("|")` を依存配列にした `useEffect` で再レンダー後に `chipRefs.current.get(pendingFocusRef.current)?.focus()` を適用、で実装する。`index` で配列添字を渡し `chips[index+1] ?? chips[index-1] ?? null` で次/前を決める。

**Why**: 削除前に focus 先を計算し ref で取得しようとすると、再レンダー前の古い DOM を掴む。`pendingFocusRef` に key を退避し useEffect で再レンダー後に解決することで、新しい DOM ツリーの正しいボタンへ確実に focus できる。signature を依存配列にすると chip 構成が変わった時だけ effect が走る。

**How to apply**: 「要素を消すと自分が unmount される」UI の focus 連続性が要件のとき、本パターン（refs Map + pending key + signature effect）を流用する。最後の 1 件削除で bar 自体が unmount する場合は intra-bar focus を諦め、後述 L-I1006-004 の親委譲に切り替える。

## L-I1006-004 unmount 後 fallback focus は親へ委譲し state ownership を分離する

**Rule**: chip が 0 件になる削除では `SelectedFiltersBar` 自身が `return null` で unmount するため、bar 内の focus 復帰は成立しない。この fallback focus 先（検索入力）の所有を親 `MemberFilters` に置き、`onEmpty?: () => void` optional prop 経由で委譲する。intra-bar focus（次/前 chip）は bar が所有、unmount 後 fallback は親が所有、と責務を分ける。

**Why**: unmount する component 内に「unmount 後の focus」ロジックを書いても effect は走らない。focus 先（`#member-search-input`）を知っているのは親なので、親が `onEmpty` で受けるのが state ownership として正しい。

**How to apply**: 条件付き `return null` する component に focus 復帰要件があるとき、「描画中の focus は自分」「消滅後の focus は親 callback」で分割する。callback は optional にして既存呼び出し側の後方互換を保つ。

## L-I1006-005 tag 表示名解決は既存 props 由来 + `Object.hasOwn` 防御 fallback で API を増やさない

**Rule**: tag code → 表示名は新 API / D1 アクセスを一切足さず、既存 `topTags: TagPickerOption[]`（`{code,label,count}`）から `Object.fromEntries(topTags.map(t => [t.code, t.label]))` で `tagLabels` を導出し props で配る。解決は `Object.hasOwn(tagLabels, tag) ? tagLabels[tag] : tag` の純関数とし、`topTags` に載らない code（および `toString` / `constructor` 等 prototype property 名）でも throw せず `#{code}` に fallback する。`tagLabels?` は optional（既定 `{}`）で後方互換を保つ。

**Why**: 全 tag の code→label 解決を求めると API/D1 拡張が必要になり不変条件 #1（既存 API のみ）/ #5（D1 は apps/api 限定）に抵触する。`in` 演算子だと prototype property を誤検出するため `Object.hasOwn` で own property のみ判定し、未登録は code fallback で安全側に倒す。これにより GitHub #222（query parser shared 化）系の別責務に依存せず単独完結できる。

**How to apply**: UI で code→表示名を出すとき、まず「既存 props にラベルが来ているか」を確認し、来ていれば導出 map で解決する。lookup は必ず `Object.hasOwn` + fallback の純関数にし、未登録 / prototype key で throw しないことを focused test（fallback ケース・prototype key ケース）で固定する。

## L-I1006-006 skill 同期の件数値は実 vitest 出力を正本にする（drift 防止）

**Rule**: skill 側（SKILL.md / SKILL-changelog.md / quick-reference / task-workflow-active / LOGS / artifact inventory）に書く focused test 件数は、close-out 時に実際に `vitest run` した出力（`Tests N passed (N)`）を正本にする。本タスクでは workflow ドキュメント群が `17/17`、skill 側 6 surface が `16` で drift していた（spec 実体は `it()` 7 + 10 = 17）。Phase 12 close-out で再実行し 17 へ統一した。

**Why**: 実装途中の中間 run（テスト追加前）の件数を skill に転記すると、最終 spec と drift する。件数は「いつ時点の run か」で変わるため、close-out の最終 run を唯一の正本にしないと workflow docs と skill で矛盾（CONST 矛盾なし違反）になる。

**How to apply**: skill 同期の最後に対象 spec を `vitest run` し、`Tests N passed` の N で workflow docs / skill 全 surface を grep 突合する（`grep -rn "[0-9]\+ tests\|[0-9]\+/[0-9]\+" <workflow> <skill>`）。drift があれば実 run 値へ統一する。

## Anti-pattern

- implementation-guide の `document.getElementById(...)` を逐語コピーし、`isBrowser()` ガード / scoped eslint-disable を付けずに lint fail させる。
- VISUAL だからと backend auth gate 越しの公開画面を local で full-page screenshot し、500 エラー画面を baseline 化する。
- 削除前に focus 先 DOM を ref で取得しようとして、再レンダー前の古い DOM を掴む（`pendingFocusRef` + 再レンダー後 effect を使わない）。
- code→label lookup を `in` 演算子で書き、prototype property を誤検出する / 未登録 code で throw する。
- 中間 run の test 件数を skill に転記し、最終 spec の件数と drift させる。
