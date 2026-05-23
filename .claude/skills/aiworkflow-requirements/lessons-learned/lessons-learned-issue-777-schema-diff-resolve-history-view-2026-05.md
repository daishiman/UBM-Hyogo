---
task_root: docs/30-workflows/completed-tasks/issue-777-schema-diff-resolve-history-view/
synced_at: 2026-05-20
state: CONTRACT_READY_IMPLEMENTATION_PENDING / implementation / VISUAL
related_lessons:
  - lessons-learned-serial-05-step-03-schema-diff-resolve-2026-05.md
  - lessons-learned-issue-603-phase12-compliance-ci-gate-2026-05.md
  - lessons-learned-issue-589-gate-metadata-2026-05.md
related_specs:
  - docs/00-getting-started-manual/specs/01-api-schema.md
  - docs/00-getting-started-manual/specs/11-admin-management.md
  - docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/
follow_ups:
  - UI implementation (`SchemaDiffHistoryPanel.tsx` / `schema/history/page.tsx`) は user-gated
  - authenticated screenshot / staging smoke / commit / push / PR は user-gated
---

# Issue #777: schema diff resolve history view 実装/同期の苦戦箇所

> 対象タスク: `docs/30-workflows/completed-tasks/issue-777-schema-diff-resolve-history-view/`
> 同期日: 2026-05-20
> 実装範囲:
> - `apps/api/src/workflows/schemaAliasAssign.ts` audit payload に `questionText` を追加
> - `apps/api/src/workflows/schemaAliasAssign.contract.spec.ts` で payload contract を固定
> - 既存 audit endpoint (`/admin/audit?action=schema_diff.alias_assigned`) を流用する設計を Phase 2/5 で確定
> 未実装（user-gated）:
> - `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`
> - `apps/web/app/(admin)/admin/schema/history/page.tsx`
> - `apps/web/src/lib/admin/api.ts#fetchSchemaAliasHistory()`

---

## L-I777-001: 既存 audit endpoint 流用での projection 層境界

### 課題

新 endpoint を追加せず既存 `/admin/audit?action=schema_diff.alias_assigned` を流用する設計にしたが、
audit row の `before` / `after` payload は historical shape drift（旧 alias resolve 期の raw JSON / 現行 `schema_diff.alias_assigned` 期の `{ questionText, stableKey, ... }`）が混在しており、
UI 側で `projectAuditRowsToHistory` が raw → zod parse を試みると未知 shape を握り潰すか throw するかの境界判断が難しかった。

### 原因

- audit 表は事実上 append-only journal で historical drift を保持する性質を持つ
- 過去 `schema_alias_resolve` 期のレコードに `questionText` が無い
- zod の `safeParse` で失敗時に row を捨てるか placeholder で返すかが Phase 2 設計時点で曖昧だった

### 解決策

- `projectAuditRowsToHistory` は zod `safeParse` を採用し、parse 失敗 row は `historyRow.kind = 'unknown'` で握り潰し、UI 側 helper text で「過去データは一部表示できません」と明示
- 現行 `schema_diff.alias_assigned` 期の `questionText` 必須化は `schemaAliasAssign.ts` 側で固定し、focused contract spec で payload shape を build-time gate 化
- historical drift 行は client side で除外せず "unknown" として preserve（監査痕跡として残す）

### 将来適用 knowledge

- audit/event journal を UI projection する際は **historical shape drift 前提で zod `safeParse` + unknown kind 握り潰し**を default 戦略にする
- payload 必須化は write 側 contract spec で固定し、read 側 projection は drift tolerant に書く
- 「データが欠ける」エラーを throw にしない（監査痕跡を消す方が罪が重い）

---

## L-I777-002: `questionText` 部分一致 client-side filter の 50 件 window 設計トレードオフ

### 課題

UI 仕様で `questionText` の部分一致 filter を提供することにしたが、API 側で全件 search index を持たないため
**直近 50 件 window 内**に閉じ込めた client-side filter として実装する設計になった。
helper 文言で「直近 50 件から検索」と明示するが、UX 上「過去のすべての履歴から検索できる」と誤解されるリスクが残る。

### 原因

- audit 表に質問文全文の B-tree / FTS index が無い（D1 D1 制約 + workload 軽量化方針）
- 新規 endpoint 追加禁止（ui-prototype-alignment-mvp-recovery の不変条件）
- pagination cursor を追加する複雑度を MVP では取らない判断

### 解決策

- Phase 2 設計で「直近 50 件 window 内 client-side filter」を明示し、AC として「helper 文言で window 範囲を明示」を加える
- 将来拡張として「pagination cursor + server-side filter」を follow-up 候補として `unassigned-task-detection.md` に記録
- search box の placeholder と helper を 1 line で固定（例: 「直近50件から質問文を部分一致検索」）

### 将来適用 knowledge

- **既存 endpoint 流用設計では window 上限を UI 上で常に visible にする**（helper / placeholder / counter のいずれか）
- search の "完全網羅錯覚" を防ぐため、結果が window 上限に達した場合 "上限到達" を明示する
- UX トレードオフは Phase 2 で文書化し、AC に組み込む

---

## L-I777-003: `useEffect` + `useTransition` + `router.replace` の二重 fetch 防止

### 課題

`SchemaDiffHistoryPanel` の URL state 同期で、`useEffect` で初期 fetch を撃ちつつ
`useTransition` 内で `router.replace(searchParams)` を呼ぶと、router 更新が再 mount をトリガーして
初回二重 fetch が起きる事故が発生しやすい。テストも `act()` / `useTransition` の組み合わせで書きづらい。

### 原因

- React 18+ Strict Mode 下では `useEffect` が dev で 2 回走る
- `router.replace` は client-side navigation を発生させ、初期マウントと衝突する
- `useTransition` の pending state を test で待つ assertion が `findBy*` 系では掴みづらい

### 解決策

- `didInitialFetch.current` ref guard で初回二重起動を回避
- `useEffect` 内で `if (didInitialFetch.current) return; didInitialFetch.current = true;` の pattern を採用
- test は `vi.useFakeTimers()` ではなく `findByRole`/`findByText` で transition 解決を待つ
- contract spec は API 層に閉じ込め、component spec は projection / filter の純粋関数を testing 主軸にする

### 将来適用 knowledge

- **`useEffect` + `router.replace` + `useTransition` の三点セットでは ref guard が必須**
- URL state を持つ client component は、URL state の "正本" を確定する単一 entry point を `useEffect` で 1 回だけ撃つ設計にする
- testability を高めるため、projection / filter は純粋関数として切り出し、component spec とは別の unit spec で固める

---

## L-I777-004: Phase 12 spec と compliance-check の語彙整合（`runtime_pending` vs `implementation_pending`）

### 課題

Phase 5 で `schemaAliasAssign.ts` payload 拡張 + contract spec を実装済みだったが、
Phase 12 の `phase12-task-spec-compliance-check.md` に `runtime_pending` と書いてしまい、
「実装済みなのに runtime 待ち」の矛盾が compliance check 上で発生した。
canonical state は `CONTRACT_READY_IMPLEMENTATION_PENDING`（API hardening done / UI 未実装）であり、
"runtime" 語彙とは別軸の話だった。

### 原因

- `runtime_pending` / `implementation_pending` / `pending_user_gate` の 3 軸を mix していた
- API hardening と UI implementation を同一 state vocabulary で扱おうとした
- compliance-check template の state 語彙正本（`task-specification-creator/references/`）を Phase 12 執筆時に確認しなかった

### 解決策

- canonical state を `CONTRACT_READY_IMPLEMENTATION_PENDING` に統一
  - 「API contract（payload + spec）は ready / UI 実装は pending」を 1 語で表現
- compliance-check の `runtime_pending` を `implementation_pending` の subset として位置付けず、UI gate と runtime gate を分離記述
- artifacts.json `metadata.gates` の Gate-C / Gate-D も `pending` 表記に揃える

### 将来適用 knowledge

- **task の state vocabulary は「軸」を分けて記述する**: contract / implementation / runtime / user-gated は別軸
- Phase 12 compliance-check 執筆時は state vocabulary の canonical list を `task-specification-creator/references/` から都度参照する
- "実装済みかどうか" は code diff の有無で判定し、Phase 12 文書が code 実態と乖離しないよう必ず Phase 5 outputs と cross-check する

---

## L-I777-005: system spec same-wave 同期漏れ（11-admin-management.md / LOGS.md）

### 課題

spec package と code（`schemaAliasAssign.ts` + contract spec）は同 wave で揃ったが、
`docs/00-getting-started-manual/specs/11-admin-management.md` への "schema diff history view" UI 仕様追記と、
`docs/30-workflows/LOGS.md` への wave entry 追加が遅延した。
Phase 12 documentation gate は workflow root 内の strict 7 をチェックするが、
**外部 system spec / 横断 LOGS への波及**は gate が弱く、手動チェックに頼っていた。

### 原因

- Phase 12 strict 7 は workflow root 配下しか scan しない
- system spec への "where to add" は task ごとに判断が必要（11-admin-management.md か 01-api-schema.md か）
- LOGS.md は merge=union 設定済みだが、書き忘れ自体は gate されない

### 解決策

- Phase 12 `system-spec-update-summary.md` で「波及すべき system spec ファイル一覧」を明示し、Phase 12 outputs の必須項目化
- `documentation-changelog.md` に LOGS.md / spec ファイル名を列挙し、書き忘れを diff で検知
- 横断 documentation の checklist を `task-workflow-active.md` に "same-wave doc sync" として記録

### 将来適用 knowledge

- **Phase 12 documentation gate は workflow root 内に閉じている**ことを前提に、system spec / LOGS / cross-cutting docs は `system-spec-update-summary.md` で明示宣言する
- Phase 12 で system spec 反映を宣言したら、Phase 13 PR レビュー前に diff で実反映を確認する
- 将来的に `verify-phase12-compliance` を「declared system spec への 1 line 以上の diff 存在」まで検証範囲を拡張する候補

---

## 横断教訓

- **既存 endpoint 流用設計のコスト**: L-I777-001 / L-I777-002 はいずれも「新 endpoint 不可」という不変条件下で projection / window UX のトレードオフを払う形になった。MVP 期は妥当だが、follow-up で server-side filter / pagination cursor を切り出す候補を残す。
- **state vocabulary の軸分離**: L-I777-004 のように contract / implementation / runtime / user-gated を mix しない。`CONTRACT_READY_IMPLEMENTATION_PENDING` のような複合語彙は軸を明示する。
- **Phase 12 documentation gate の盲点**: L-I777-005 で再確認した通り、workflow root 内 strict 7 だけでは system spec / LOGS への波及を保証できない。`system-spec-update-summary.md` を declaration source として運用し、Phase 13 で実 diff を verify する。
- **client-side guard pattern**: L-I777-003 の ref guard は React 18+ Strict Mode 下で URL state 同期 component を書く際の共通パターンとして `task-specification-creator` の UI Phase 5 テンプレに昇格候補。
