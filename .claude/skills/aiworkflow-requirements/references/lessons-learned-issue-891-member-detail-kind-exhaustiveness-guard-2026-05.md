# Lessons Learned: Issue #891 member detail kind exhaustiveness guard (2026-05)

> Workflow: `docs/30-workflows/completed-tasks/issue-891-member-detail-kind-exhaustiveness-guard/`
> Date: 2026-05-25
> State: `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval`
> Parent: `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/`
> Consumes: `docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md`（superseded / consumed trace）

## L-I891-001: allowlist の exhaustiveness は `as const satisfies Record<Enum, Route>` で型強制へ昇格する

issue-827 で残った `DISPLAYABLE_KINDS: ReadonlySet<FieldKind>` の手動 allowlist は、`FieldKindZ` に新 kind を追加しても TypeScript と CI の双方で silent-skip しうる構造だった（[[lessons-learned-issue-827-member-detail-adapter-and-visibility-defense-2026-05]] L-I827-005 で follow-up 起票済）。本サイクルでは `KIND_ROUTE` を `as const satisfies Record<FieldKind, KindRoute>` で定義し、`DETAIL_KINDS` / `LINK_KINDS` を `KIND_ROUTE` から派生させた。これにより新 kind 追加時に `KIND_ROUTE` への登録漏れは `pnpm typecheck` で fail し、adapter spec の `FieldKindZ.options` parity test（TC-EX-01）でも検知される。

- **Why:** allowlist `Set` は member の不足を型で表現できず、enum 拡張時に "型は通るが UI に出ない" silent failure を量産する。`satisfies Record<Enum, Route>` はメンバ過不足を型エラーへ昇格させる唯一の手段で、`as const` を併用することで route literal の narrow も得られる。
- **How to apply:** zod enum / TypeScript discriminated union を UI 表示分類へ写像する箇所では、`const ROUTE_MAP = {...} as const satisfies Record<EnumMember, Route>` を SSOT にする。派生集合（`DETAIL_KINDS` 等）は `Object.keys(ROUTE_MAP)` から filter で算出し、二重定義を作らない。

## L-I891-002: 「除外」と「別 route」を `KindRoute` 3 値で明示分離する

issue-827 では URL kind が detail section から弾かれていたが、既存 `MemberLinks` への接続が page 側 wiring に依存し、adapter 内では「除外＝表示しない」と「別 route＝別 section に出す」が区別されていなかった。本サイクルでは `KindRoute = "detail" | "links" | "excluded"` を導入し、URL を `"links"`、consent / system / unknown を `"excluded"` として明示分離した。adapter は `sections`（detail）と `linkSections`（links）を並列に返し、`MemberDetail.tsx` で `MemberLinks` へ `linkSections` を渡す。

- **Why:** boolean filter（`isDetail / isNotDetail`）では「画面のどこにも出さない」と「別 region に出す」が同一視され、新 route 追加時に常に判定 2 値が増殖して条件分岐が破綻する。3 値 enum 化すると追加 route は `KindRoute` リテラル拡張＋ `KIND_ROUTE` 上書きの 2 点同 wave 修正で済む。
- **How to apply:** UI 分類で「表示先 region が複数ある」状況は最初から `Route` literal union として設計する。filter 用の派生 set は `Route` 値ごとに `Object.keys(...).filter(k => MAP[k] === route)` で生成し、route と consumer の対応を adapter 1 箇所に閉じる。

## L-I891-003: 純粋関数 adapter の内部定数は `__testInternals` 経由で spec から exhaustiveness 検証する

`KIND_ROUTE` を export 公開してしまうと「adapter 内部の分類規則」が外部 API として固定化し、後続の route 追加・整理で破壊的変更を招く。一方 export しないと spec から `FieldKindZ.options` との parity を確認できない。本サイクルでは `export const __testInternals = { DETAIL_KINDS, KIND_ROUTE, LINK_KINDS } as const;` を adapter 末尾に置き、`member-detail.spec.ts` の TC-EX-01〜06 は `__testInternals` 経由で参照する。public API（`toMemberDetailProps`, `MemberDetailProps`）からは `KIND_ROUTE` を露出しない。

- **Why:** 「テスト用に export を増やす」と外部 import の事故が起きる（grep で見えてしまい consumer が直接参照する）。`__testInternals` という識別子は意図を表明する慣行で、`eslint-no-restricted-imports` で締める前段としても機能する。
- **How to apply:** pure adapter の内部 lookup table を spec で exhaustiveness 検証したいときは、`export const __testInternals = { ... } as const` を末尾 1 行で添える。consumer は `toMemberDetailProps` 等の意味的 API のみ import し、`__testInternals` は spec ファイル限定で参照する。

## L-I891-004: closed issue の "spec_created" は実コード差分の有無で再分類する

Issue #891 は GitHub 上 CLOSED で、現状の手元差分は spec のみ → docs-only と分類しがちだった。しかし adapter / spec ファイル / component の 3 点に実コード変更が乗ったため、artifacts.json の `status` を `spec_created` から `implemented_local_evidence_captured` へ早期に再分類し、Gate-A/B/C を evidence 実体（focused-tests.log / typecheck / lint / build）に合わせて更新した。これを怠ると Phase 11 evidence 表と root status の語彙が乖離し、`verify-phase12-compliance.js` の Phase 11 evidence 存在ゲートで fail する。

- **Why:** CLOSED issue ＝ 完了とは限らない（既存実装で解消、別 issue で解消、本サイクルで未完など複数経路がある）。state ラベルは「現実の差分」より弱い signal で、ラベルから推測すると Phase 11 evidence と Phase 12 strict 7 の物理 outputs が揃わない。
- **How to apply:** Phase 1 で `git status` / `git diff` をまず確認し、実コード差分があれば `artifacts.json` の `status` / `workflow_state` / `implementation_status` を `implemented_local_evidence_captured` へ確定してから Phase 2 以降へ進む。spec_created のまま実装に進むと Phase 11 evidence 表生成と gate-metadata validate が後段で衝突する。

## L-I891-005: 起票元 unassigned task は削除でなく consumed trace を残し completed-tasks/unassigned-task/ へ移送する

`docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md` は issue-891 が現行 workflow として吸収したが、削除するのではなく header に `superseded by issue-891 / consumed at 2026-05-25` を追記し、`docs/30-workflows/completed-tasks/unassigned-task/` 配下へ `git mv` した。これにより issue-827 close-out の Phase 12 unassigned detection から issue-891 current workflow への追跡経路が保たれ、`git log --follow` で起票根拠まで辿れる。

- **Why:** unassigned task を削除すると、後続開発者が「issue-827 で識別された規律依存リスクは結局誰が解いたのか」を辿れなくなる。Phase 12 unassigned detection の価値は履歴 trace にあり、削除はその価値を毀損する。
- **How to apply:** unassigned task が後続 workflow に吸収されたら、(1) 元ファイル先頭に `> superseded by <workflow-id> at <date>` を追記、(2) `completed-tasks/unassigned-task/` 配下へ `git mv`、(3) 吸収先 workflow の `artifacts.json metadata.supersedes` にパスを記録、の 3 点を同 wave で実施する。削除は永続的に避ける。

---

## 横断教訓

- enum → route 写像は `as const satisfies Record<Enum, Route>` を default 設計とし、allowlist `Set` は派生でのみ作る。
- 「除外」と「別 region 表示」は最初から route literal union で表現し、boolean filter で表現しない。
- pure adapter の内部 lookup を spec で検証する正規経路は `export const __testInternals = {...} as const` で、consumer 側 API を汚さない。
- closed issue でも `git status` が示す実差分を優先し、`status` / `workflow_state` / `implementation_status` を `implemented_local_evidence_captured` へ早期確定する。
- unassigned task の吸収は「削除」でなく「consumed trace 残し + completed-tasks/unassigned-task/ へ移送 + supersedes 記録」の 3 点同 wave で行う。
