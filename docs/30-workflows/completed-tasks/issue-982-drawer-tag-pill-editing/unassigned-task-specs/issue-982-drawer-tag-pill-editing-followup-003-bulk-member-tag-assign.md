# issue-982-drawer-tag-pill-editing-followup-003 — 複数 member への tag 一括付与 / 解除 (bulk tag assign)

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-982-drawer-tag-pill-editing-followup-003 |
| 分類 | implementation / API batch endpoint / admin bulk UI |
| 優先度 | 低 (priority:low) |
| 規模 | 大 (scale:large) |
| ステータス | unassigned |
| 発見元 | issue-982-drawer-tag-pill-editing Phase 12 unassigned-task-detection (scope-out 候補: bulk tag assign) |
| 発見日 | 2026-05-30 |
| 親ワークフロー | issue-982-drawer-tag-pill-editing |
| visualEvidence | VISUAL_ON_EXECUTION |

## 背景

issue-982 では **単一 member の drawer 編集** だけを対象に、管理者の手動 tag 付与 / 解除を実装した。endpoint は `POST /admin/members/:memberId/tags`（付与・冪等）/ `DELETE /admin/members/:memberId/tags/:tagId`（解除・冪等）で、repository 側は `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin`、audit は `admin.member.tag_assigned` / `admin.member.tag_unassigned` を 1 操作 1 行で記録する。いずれも `member_tags` を不変条件 #13（再定義 / issue-982）の admin manual 経路として直接 write する。

一方で「members 一覧で複数 member を選択し、選択した tag を一括で assign / unassign する」操作は、issue-982 の Phase 12 unassigned-task-detection で **future product scope, not unassigned from #982** として明示的に scope 外にした。MembersTable には既に行ごとの checkbox と `MembersClientShell` の `selected: Set<string>` による選択状態があり、`BulkActionBar` が publish / hide / soft-delete の一括操作（選択 ID を 1 件ずつループ）を提供している。ただし bulk action bar に **tag 系アクションは存在しない**。

本タスクは、この選択基盤の上に「複数 member × 複数 tag の一括付与 / 解除」を載せる将来タスクである。

## 概要

複数 memberId × 複数 tagId を一括で assign / unassign する batch endpoint を新設し、`BulkActionBar` に tag 系アクション（tag picker + 一括付与 / 一括解除）を追加する。部分失敗時の結果 shape と member ごとの audit を定義し、issue-982 の単一 endpoint および followup-001 の idempotency store と整合させる。

## 苦戦箇所【記入必須】

- **API shape の分岐点**: issue-982 で単一 member endpoint（`POST/DELETE /admin/members/:memberId/tags`）を先に確定させたため、bulk を「単一 endpoint を web 側で N 回ループする（`BulkActionBar` の publish/hide が既に採っている方式）」か「専用 batch endpoint（`POST /admin/members/tags:batch` 等）を新設する」かで設計が割れる。N 回ループは server 実装ゼロで済むが、部分失敗の集約・audit 粒度・冪等性の保証を全て client 側に持つことになり、network 往復 N 回 × tag 件数で増幅する。専用 batch endpoint は server 1 トランザクションに寄せられるが、不変条件 #13 の write 経路に **第 3 の入口**を生やすことになり、新規 `*ByAdmin` 系の repository 関数追加が type-level write keyword gate（`memberTags.readonly.test-d.ts`）に抵触しないかの確認が要る。本仕様は **専用 batch endpoint を正本案**とし、N 回ループは fallback として位置づけるが、ここが最初の判断ポイント。
- **部分失敗（N 件中 M 件失敗）の結果返却**: all-or-nothing（1 件でも失敗したら全 rollback）にするか、部分成功レポート（成功 / 失敗を member×tag 単位で返す）にするかで UX と実装が大きく変わる。削除済み member や未登録 tag が混ざるケースが必ず発生するため、**部分成功レポート方式**を正本案とする（`{ results: [{ memberId, tagId, status: "assigned"|"unassigned"|"noop"|"skipped_deleted"|"tag_not_found" }] }`）。ただし D1 の per-statement 実行で「途中失敗の rollback 単位」をどこに引くか（member 単位 / tag 単位 / 全体）を決め切る必要がある。
- **audit 粒度**: member ごと 1 行（`admin.member.tag_assigned` を実 mutation 件数だけ append、単一 endpoint と完全 parity）か、bulk 操作 1 行（`admin.member.tags_bulk_assigned` を新 action として 1 件、対象 member/tag を after に集約）かで監査の読み方が変わる。本仕様は **既存 action と parity を取る member×tag 単位 append**（実際に row が動いた組み合わせのみ）を正本案とするが、bulk 操作の相関を取るための `correlationId`（bulk operation ごとに 1 つ）を audit row に持たせるかを判断する。
- **複数選択 UI の不足分**: 選択状態（`selected: Set<string>`）と行 checkbox は既存だが、`BulkActionBar` は status 系アクションのみで tag picker を持たない。一括付与する tag を選ぶ UI（tag master からの複数選択 picker）と、付与 / 解除のモード切替、bulk action bar 内の進行表示・部分失敗の結果表示を新設する必要がある。drawer の単一 tag pill 編集 UI とは別 surface になる。
- **冪等性の bulk 担保**: 単一 endpoint は PK `(member_id, tag_id)` の `INSERT OR IGNORE` / `DELETE` で自己冪等だが、bulk では「同一 bulk リクエストの再送（途中で network 断 → リトライ）」を followup-001 の idempotency store（issue-913 middleware）でどう一意化するかが論点。bulk リクエスト全体に 1 つの idempotency-key を載せる方式を正本案とするが、部分成功後の再送で「既に成功した分」をどう扱うか（再実行で noop に落ちることを冪等とみなす）を定義する。

## 目的

- members 一覧の既存選択基盤（checkbox + `selected: Set`）の上に、複数 member × 複数 tag の一括付与 / 解除を載せる
- 部分失敗を握りつぶさず、member×tag 単位の結果レポートで管理者に提示する
- 既存単一 endpoint（issue-982）と audit / 冪等性 / 不変条件 #13 を整合させ、regression を出さない

## スコープ

含む:

- batch endpoint 新設（正本案: `POST /admin/members/tags:batch` body `{ op: "assign"|"unassign", memberIds: string[], tagIds: string[] }` → 部分成功レポート）
- `memberTags.ts` repository に bulk 用関数を追加（既存 `*ByAdmin` 単一関数の再利用 or bulk 専用関数。type-level write keyword gate との整合を確認）
- `BulkActionBar.tsx` に tag picker（tag master 複数選択）+ 一括付与 / 解除アクション + 部分失敗結果表示を追加
- `useAdminMutation` 経由（不変条件 #10）で bulk リクエスト全体に idempotency-key を載せた配線
- audit: 実 mutation した member×tag 単位で `admin.member.tag_assigned` / `admin.member.tag_unassigned` を append（必要なら bulk correlationId を併記）
- apps/api batch route test（部分失敗 / 削除済み skip / 未登録 tag / 冪等再送）+ repository test
- apps/web bulk action bar の選択 → 付与 / 解除 → 結果表示の spec
- Playwright visual: bulk tag action bar 展開状態 + 部分失敗結果表示の baseline 追加

含まない:

- tag master の作成 / 削除 / rename（admin/tags 画面側で扱う）
- 単一 member drawer の tag pill 編集（issue-982 で実装済み）
- 一括操作の publish / hide / soft-delete 系（既存 `BulkActionBar` の責務、本タスクで触らない）
- tag に紐づく公開フィルタロジックの再設計

## 受入条件 (Acceptance Criteria)

- AC-1: batch endpoint で複数 memberId × 複数 tagId を `op: "assign"` で一括付与でき、`op: "unassign"` で一括解除できる
- AC-2: 部分失敗時、レスポンスは member×tag 単位の結果 shape（`{ results: [{ memberId, tagId, status }] }`、status ∈ `assigned`/`unassigned`/`noop`/`skipped_deleted`/`tag_not_found`）で成功・失敗を区別して返す
- AC-3: 実際に row が動いた（assigned / unassigned）member×tag の組み合わせごとに audit が 1 件記録される（既存単一 endpoint と action 名 parity）
- AC-4: 削除済み member（`member_status.is_deleted=1`）は status `skipped_deleted` で skip され、他の member の処理は継続する（全体 fail にしない）
- AC-5: 同一 idempotency-key での bulk リクエスト再送が冪等（既成功分は noop に落ち、追加の audit / 副作用が発生しない）
- AC-6: 既存単一 endpoint（`POST/DELETE /admin/members/:memberId/tags`）と既存 `BulkActionBar`（publish/hide/soft-delete）に regression が無い
- AC-7: MembersTable の既存複数選択（checkbox + `selected: Set`）を再利用し、`BulkActionBar` に tag picker + 一括付与 / 解除アクション + 部分失敗結果表示が追加される

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 不変条件 #13 に第 3 の write 入口を生やす | bulk 関数は既存 `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` を内部再利用する設計を優先し、新規 `*ByAdmin` export 追加時は `memberTags.readonly.test-d.ts` の allow list 整合を必ず確認する |
| 部分失敗の握りつぶし | all-or-nothing にせず member×tag 単位の結果レポートを必須返却し、route test で混在ケース（成功 + skipped_deleted + tag_not_found）を assert |
| audit 行の爆発（M×N） | 実 mutation した組み合わせのみ append（noop / skip は audit しない）。bulk 相関は correlationId 1 つで束ねる |
| bulk 再送での二重副作用 | bulk リクエスト全体に 1 idempotency-key を載せ、issue-913 middleware で一意化。PK 冪等と二段で担保 |
| 選択 × tag picker の状態複雑化 | 選択状態は既存 `selected: Set` を single source とし、tag picker 状態は `BulkActionBar` ローカルに閉じる |

## 検証方法

- apps/api: batch route test（assign / unassign / 部分失敗混在 / skipped_deleted / tag_not_found / idempotency 再送 / audit 件数）、repository bulk 関数の test
- apps/web: `BulkActionBar` の tag picker → 一括付与 / 解除 → 部分失敗結果表示の spec、楽観更新を行う場合の rollback spec
- Playwright visual: bulk tag action bar 展開状態 + 部分失敗結果表示の baseline 追加

## 上流前提

- issue-982 で単一 member tag endpoint（`POST/DELETE /admin/members/:memberId/tags`）+ repository `*ByAdmin` 関数 + audit action 2 件が実装済み（本タスクはこれを再利用 / parity 維持する）
- followup-001（list response enrichment）の idempotency store / shape と整合（bulk リクエストの idempotency-key 一意化に再利用）
- issue-913 idempotency middleware が apps/api admin 経路に配線済み（既完了）
- MembersTable の行 checkbox + `MembersClientShell` の `selected: Set<string>` 選択基盤が既存（再利用前提）

## 関連参照

- issue-982 workflow Phase 12 unassigned-task-detection（scope-out 候補: bulk tag assign の出典）
- `apps/api/src/routes/admin/members.ts`（単一 member tag write endpoint の現状: L488-600）
- `apps/api/src/repository/memberTags.ts`（`assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` / `getMemberDeletedFlag` / 不変条件 #13 の記述）
- `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`（type-level write keyword gate / allow list）
- `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`（既存一括操作 bar: publish/hide/soft-delete）
- `apps/web/src/features/admin/components/_members/MembersClientShell.tsx`（`selected: Set` 選択状態）
- `apps/web/src/features/admin/components/_members/MembersTable.tsx`（行 checkbox）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（不変条件 #10 の標準 mutation 経路）

## GitHub Issue

- Issue: 起票予定（本サイクル Phase 3 で作成）
- labels: `priority:low`, `scale:large`, `type:followup`, `area:api`, `area:web`, `area:admin-ui`, `wave:2-plus`, `unassigned`
