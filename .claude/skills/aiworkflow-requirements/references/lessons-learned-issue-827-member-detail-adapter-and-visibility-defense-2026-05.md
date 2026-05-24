# Lessons Learned: Issue #827 member detail adapter and visibility defense (2026-05)

> Workflow: `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/`
> Date: 2026-05-23
> State: `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval`

## L-I827-001: 可視性二重防御は public detail の全 consumer を覆う

API（builder）が `visibility="public"` でフィルタ済みでも、`/members/[id]` page が `publicSections` を `MemberLinks` / `MemberActivity` へ直接渡しており、UI 層の defense-in-depth が primary section renderer（`MemberDetailSections`）にしか効いていなかった。`buildMemberDetailViewModel` で `allSections` を `field.visibility === "public"` フィルタ済みにしてから返し、`MemberDetailSections` / `MemberLinks` / `MemberActivity` の 3 consumer すべてが filtered data のみ受け取る構造へ揃えた。

- **Why:** 「primary renderer だけ filter すれば二重防御」という暗黙前提は成立しない。secondary consumer（links / activity）が non-public field を素通しすると、API filter が回帰した瞬間に漏洩する。consumer が増えるたびに漏れる構造になる。
- **How to apply:** public facing detail page では filter 責務を adapter 層（`apps/web/src/lib/adapters/<feature>.ts`）に集約し、component は「渡された sections をそのまま render する」だけにする。新 consumer 追加時は adapter の filtered `allSections` を渡しているか grep gate で確認する。

## L-I827-002: docs-only に見える root も受け入れ基準で実コード要否を判定する

Issue #827 は当初 close-out 寄り（docs-only）に見えたが、受け入れ基準に「unit test green」「visibility 二重防御の動作」が含まれており、Phase 1 の実装区分判定で CONST_004 により adapter / test / page の実コード変更が強制された。state ラベルだけで docs-only と判断していたら実装が漏れていた。

- **Why:** workflow root の state ラベル（`spec_created` / docs-only 等）は CONST_004 の受け入れ基準チェックより弱い。ラベルを信じると実コード要件を取りこぼす。
- **How to apply:** Phase 1 で root の state ラベルに依存せず、受け入れ基準を読んで実コード変更要否を独立判定する。`implemented_local_evidence_captured / implementation` への再分類が必要なら早期に確定する。

## L-I827-003: spec の schema 語彙は shared zod primitives と照合してから contract 確定

workflow spec 群の field kind / visibility 表記が現行 `@ubm-hyogo/shared` の `FieldKindZ` / `FieldVisibilityZ` enum と乖離していた（stale 語彙）。実装で `DISPLAYABLE_KINDS` を enum と照合する過程で 2 度の語彙補正が発生し、Phase 4 contract 確定後に手戻りした。

- **Why:** spec が古い schema 語彙を温存すると、実装時に「spec の kind 表記 ↔ 実 enum」の突き合わせコストが発生し、adapter の許可リスト定義もぶれる。
- **How to apply:** Phase 1 / Phase 4 で `packages/shared` の `FieldKindZ` / `FieldVisibilityZ` を直読し、spec の kind / visibility 表記と一致確認してから contract を確定する。乖離を見つけたら同 wave で spec 側を現行語彙へ補正する。

## L-I827-004: filter 責務は pure adapter 境界へ集約する（3 択比較）

filter 責務の配置を 3 案で比較した。component-local filter は各 component に filter ロジックが散在し新 component 追加のたびに漏れる。API-only trust は UI 層の defense-in-depth を放棄する。adapter boundary は pure function でテストしやすく最小複雑度の安全ロックになる。結論として web-side pure adapter（`apps/web/src/lib/adapters/member-detail.ts`）を新設し、page は fetch + wiring、component は描画のみへ責務を純化した。

- **Why:** 既存 API・D1・shared schema・visual baseline を変えずに「安全性」と「component test の単純化」を同時に得られるのは adapter 境界だけ。CLAUDE.md の UI prototype alignment 不変条件「API を変えず UI 側に adapter 層を置く」とも整合する。
- **How to apply:** public facing detail の view-model 変換と visibility / display-kind filter は `apps/web/src/lib/adapters/` の pure function に集約する。page は adapter を呼んで結果を配線、component は props をそのまま render する三層分離を既定にする。

## L-I827-005: 許可リスト方式の exhaustiveness は scope 外でも follow-up 起票して規律依存を formalize する

`DISPLAYABLE_KINDS` は `FieldKindZ` の許可リスト方式で、enum に新 kind が追加されても型 / CI で検知されず silent-skip しうる。本サイクルでは adapter が唯一の entry point のため runtime 安全性は保たれ、`satisfies Record<FieldKind, KindRoute>` 化は実装スコープ外とした。ただし「規律依存リスクとして放置」ではなく `unassigned-task-detection` に 1 件（`issue-827-followup-001-displayable-kinds-exhaustiveness-guard` / issue #891 / 分類 ref / 優先度 低）として起票し、緩和策を要件発生待ちの未タスクへ formalize した。

- **Why:** allowlist 方式は enum 拡張時に「型は通るが新 kind が表示されない」 silent failure を生む。adapter が唯一の entry point である現アーキテクチャでは runtime 安全性は保たれるが、将来 consumer や kind が増えると規律依存の穴になる。「scope 外＝記録だけ」で止めると、後続開発者がリスクの所在を辿れない。
- **How to apply:** 将来 allowlist 方式の display-kind / visibility 判定を拡張する際は、`satisfies Record<FieldKind, KindRoute>` + 網羅テストで exhaustiveness を初期から設計する。本サイクルのように実装は scope 外でも、Phase 9 リスク（R-01）由来の規律依存ギャップは `unassigned-task-detection` へ follow-up 起票し、lessons-learned の観察と未タスクを相互参照させる。

---

## 横断教訓

- 「二重防御」「fail-safe」を謳う実装は、防御層が**全 consumer / 全経路**を覆っているかを close-out review で必ず突き合わせる（primary path だけの防御は防御ではない）。
- docs / 実装の区分は state ラベルではなく受け入れ基準（CONST_004）で判定する。
- spec の schema 語彙は実 zod primitives を SSOT として同 wave で補正する。
- 実装 scope 外でも、Phase 9 リスク由来の規律依存ギャップは `unassigned-task-detection` へ follow-up 起票（本サイクルは issue #891 / 1 件）し、lessons-learned の観察と未タスクを相互参照させる。
