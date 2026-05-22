# Phase 1: Requirements

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve
- 由来: Issue #776 / unassigned-task `serial-05-step-03-followup-002-schema-alias-bulk-resolve.md`

## 目的
`SchemaDiffPanel` に複数 diff の一括 alias resolve UI を追加し、Google Form schema 改訂時の admin 運用負荷を削減する要件を固定する。

## 背景

- 現行 `apps/web/src/components/admin/SchemaDiffPanel.tsx` は 1 件ずつ inline edit → confirm modal → `postSchemaAlias` POST の single-resolve 経路のみ。
- Google Form 改訂時には section 全体（最大 30 件規模）の rename が同時発生する想定。1 件ずつでは 10 分以上のリードタイムが発生し、UI が長時間ブロックされる。
- 親 workflow Phase 12 unassigned-task §3 に「alias bulk resolve」が後続候補として記録済（未 consumed）。

## 機能要件 (FR)

- **FR-1**: `/admin/schema` 画面で `unresolved` / `changed` カテゴリの diff 行を行 checkbox で複数選択できる。`added` / `removed` 行には checkbox を表示しない（誤操作防止）。
- **FR-2**: カテゴリ単位の select-all（`unresolved 全選択` / `changed 全選択`）が可能。
- **FR-3**: 選択件数バッジに breakdown 表示（例: `12 件選択中（unresolved 8 / changed 4）`）。
- **FR-4**: 「Bulk Resolve」ボタン押下で batch confirm modal を表示。modal 内に選択 diff の一覧と、各行に対する stableKey 入力欄、`aliasRecommendation` service 推奨値の auto-fill ボタンを配置。
- **FR-5**: modal の confirm 押下で全選択行に対し `postSchemaAlias` を bounded concurrency（初期値 8、上限 50 件）で実行し、行ごとに pending / success / retryable / error 状態を modal 内に表示する。最終結果は aggregate するが、進捗表示は各 request の完了ごとに更新する。
- **FR-6**: 部分失敗（一部 409 alias_conflict / 422 invalid stableKey）発生時は、成功分を確定し、失敗分のみ理由付きで modal に残し、admin が失敗分のみ stableKey を訂正して再 submit できる。
- **FR-7**: 全件成功時は modal を閉じ、`SchemaDiffPanel` を refetch して最新 diff を反映する。
- **FR-8**: 既存 single-resolve 経路（行 inline edit → confirm）は破壊せず共存する。

## 非機能要件 (NFR)

- **NFR-1**: stableKey validation regex は single 経路と完全共有（duplicate 禁止 / Single Source of Truth）。
- **NFR-2**: bulk submit 中も browser の応答性を保つ（modal 内 progress 表示。modal 外操作は disabled）。
- **NFR-3**: design token は OKLch のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。
- **NFR-4**: a11y: checkbox に `aria-label`、batch modal に `role="dialog"` / `aria-labelledby` / focus trap。jest-axe で violation 0。
- **NFR-5**: 30 件 bulk submit が 30 秒以内で完了する（client-side fan-out / concurrency 8、local dev または branch preview で計測し、staging 計測は Phase 13 後の runtime gate）。

## スコープ境界

含む: Phase 2-13 の全タスク（`index.md` スコープ参照）。
含まない: alias rollback / undo / diff history view / admin notification（独立 followup）。

## 受入条件 (AC: 抜粋 / 全件は phase-09)

- AC-1: 複数 diff 行を checkbox で選択し、batch confirm modal を介して一括 resolve できる
- AC-2: 部分失敗時に成功分は確定し、失敗分のみ理由付きで再操作可能
- AC-3: 既存 single-resolve 経路が回帰なし
- AC-4: stableKey validation 規則が single 経路と単一定義で共有
- AC-5: spec test が partial failure シナリオを含めて green
- AC-6: design token 違反 0（`verify-design-tokens` gate green）

## 完了条件

- [ ] FR-1..8 / NFR-1..5 が確定し phase-02-design.md に展開可能
- [ ] スコープ境界と含まないものが明文化済み
- [ ] 元 unassigned-task spec の §1〜§3 と整合
