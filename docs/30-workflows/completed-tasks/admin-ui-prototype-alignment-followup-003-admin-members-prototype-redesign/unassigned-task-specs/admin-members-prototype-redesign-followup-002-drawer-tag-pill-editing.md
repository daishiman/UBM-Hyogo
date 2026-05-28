# admin-members-prototype-redesign-followup-002 — persisted Drawer tag pill editing

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-members-prototype-redesign-followup-002 |
| 分類 | implementation / API endpoint / admin mutation |
| 優先度 | 中 (priority:medium) |
| 規模 | 中 (scale:medium) |
| ステータス | unassigned |
| 発見元 | admin-ui-prototype-alignment-followup-003 Phase 12 unassigned-task-detection (候補 2) |
| 発見日 | 2026-05-27 |
| 親ワークフロー | admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign |
| visualEvidence | VISUAL_ON_EXECUTION |

## 背景

親ワークフローで `MemberDrawer` の TAGS セクションをプロトタイプ準拠で再構成したが、tag write endpoint が未整備のため tag pill は disabled (見せかけ) 表示のみで、編集 affordance を意図的に抑止している。プロトタイプ正本では tag pill クリック → 追加/削除 が drawer 内で完結する想定。

`tag_assignments` テーブル (多対多) への管理者操作 API は現状未提供で、`apps/web/src/features/admin/hooks/useAdminMutation` 経由で発火できる admin route が無い。

## 概要

`tag_assignments` への管理者付与 / 解除 API を新設し、Drawer 内 tag pill の追加 / 削除を persist する。audit log も併設する。

## 苦戦箇所【記入必須】

- 親 workflow は「既存 API surface のみ利用」を不変条件にしていたため、tag pill を disabled 表示で hold する以外に選択肢が無かった。結果として「tag を見せる UI」「tag を編集する UI」が同居しない不安定な状態が残っている。
- tag は member と多対多 (`tag_assignments`)。管理者操作で「全置換 (PUT) / 個別追加 (POST) / 個別削除 (DELETE)」のどれを正本にするかで API shape が割れる。冪等性 (idempotency-key) と audit action の名前空間を最初に決めないと、issue-913 系の idempotency 設計と乖離する。
- tag 追加時の「未登録 tag を自動作成するか / 管理者が事前に master を整備するか」で UX が変わる。MVP では事前 master 前提で行きたいが、master の正本管理 (admin/tags 画面) との同期が必要。
- 公開 / 非公開状態と tag の関係 (公開 member だけ tag を出すか) は現行 list endpoint と整合させる必要があり、followup-001 の list enrichment と shape を揃える方が安全。

## 目的

- Drawer 内で tag pill の追加 / 削除を完了させ、UI と persistence の乖離を解消する
- 既存 `useAdminMutation` 経路 + idempotency-key 経路 (issue-913 既実装) に乗せる
- 管理者操作を `admin.member.tag_assigned` / `admin.member.tag_unassigned` audit に残す

## スコープ

含む:

- `apps/api/src/routes/admin/members/:id/tags` 系 endpoint 新設 (POST 追加 / DELETE 解除)
- `tag_assignments` repository に管理者付与 / 解除関数を追加
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` の tag pill を編集可能化
- `useAdminMutation` 経由で idempotency-key を載せた呼び出し配線
- audit action 2 件追加 (`admin.member.tag_assigned` / `admin.member.tag_unassigned`)
- apps/api route + repository test、apps/web Drawer 編集 spec
- Playwright visual: drawer-tag-edit 状態の追加

含まない:

- tag master の作成 / 削除 / rename (admin/tags 画面側で扱う)
- tag に紐づく公開フィルタロジックの再設計
- 一括操作 (bulk assign) — 単一 member 単位のみ

## 受入条件 (Acceptance Criteria)

- AC-1: `POST /admin/members/:id/tags { tagId }` で `tag_assignments` に row が persist され、再 POST が冪等 (idempotency-key middleware 経由) で 200
- AC-2: `DELETE /admin/members/:id/tags/:tagId` で row が削除され、未存在に対する再 DELETE は 204 で冪等
- AC-3: Drawer 内 tag pill が click で add / remove でき、楽観更新 → 失敗時 rollback + toast
- AC-4: audit action `admin.member.tag_assigned` / `admin.member.tag_unassigned` が actor + memberId + tagId で 1 件記録される
- AC-5: 削除済み member (`isDeleted=true`) への tag mutation は 409 を返す
- AC-6: 既存 list / detail endpoint の response に regression が無い

## リスクと対策

| リスク | 対策 |
| --- | --- |
| tag 追加で N+1 / race condition | tag_assignments に (memberId, tagId) unique 制約 + idempotency-key 一意化 |
| 未登録 tag の自動作成で master 汚染 | tag master 未存在は 404 を返し、tag master 整備は admin/tags 側で実施 |
| audit ログ漏れ | route test で audit row 1 件を必ず assert |

## 検証方法

- apps/api: route test (POST/DELETE 冪等性 + audit + 409 規則)、repository test
- apps/web: MemberDrawer の add / remove インタラクション spec、楽観更新 rollback spec
- Playwright visual: drawer-tag-edit 状態の baseline 追加

## 上流前提

- followup-001 (list response enrichment) の shape と整合 (list 行 tag pill / drawer tag pill の data source を共有)
- issue-913 idempotency middleware が apps/api admin 経路に配線済み (既完了)

## 関連参照

- `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-12/unassigned-task-detection.md` (候補 2 の出典)
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` (現行 drawer)
- `apps/api/src/routes/admin/members.ts`
- `tag_assignments` table (migration 既存)

## GitHub Issue

- #982 — https://github.com/daishiman/UBM-Hyogo/issues/982
- labels: `priority:medium`, `scale:medium`, `type:followup`, `area:api`, `area:web`, `area:admin-ui`, `wave:2-plus`, `unassigned`
