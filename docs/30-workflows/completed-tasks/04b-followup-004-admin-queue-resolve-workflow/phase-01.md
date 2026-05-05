# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

Issue #319 の admin queue resolve workflow を、実装着手可能な要件へ固定する。closed issue は reopen せず、元単票と 04b-followup-001 で追加された `admin_member_notes` 拡張列（`request_status` / `resolved_at` / `resolved_by_admin_id`）と `markResolved` / `markRejected` repository helper を前提に、admin が pending 依頼を pickup → 確定する一連の経路を AC として番号化する。

## 実行タスク

1. P50 チェックとして `apps/api/src/repository/adminNotes.ts` の `markResolved` / `markRejected` helper と、`admin_member_notes.request_status` / `resolved_at` / `resolved_by_admin_id` 列の存在を確認する
2. `GET /admin/requests` 一覧 API と `POST /admin/requests/:noteId/resolve` 確定 API の責務を Phase 7 で検証可能な番号付き AC に変換する
3. D1 transaction での `member_status` + `admin_member_notes` atomic 更新、論理削除の不変条件、二重 resolve の冪等性を要件として固定する
4. admin gate（apps/web layout / proxy + apps/api `requireAdmin`）の二段防御、不変条件 #4 / #5 の遵守を明記する
5. Phase 1-3 完了前に Phase 4 へ進まない gate を明記する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/319 | 入力要件・完了条件 |
| 元単票 | docs/30-workflows/unassigned-task/04b-followup-004-admin-queue-resolve-workflow.md | 元タスク仕様 |
| 前提単票 | docs/30-workflows/unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md | request_status 列追加 |
| API 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin API 契約 |
| DB 正本 | .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | admin_member_notes / member_status |
| 実装アンカー | apps/api/src/repository/adminNotes.ts | markResolved / markRejected 既存 helper |
| 編集削除仕様 | docs/00-getting-started-manual/specs/07-edit-delete.md | visibility / delete request 設計 |
| Admin 正本 | docs/00-getting-started-manual/specs/11-admin-management.md | admin gate 二段防御 |

## 実行手順

### ステップ 1: P50 チェック

実装者は `rg -n "markResolved|markRejected|request_status|resolved_at|resolved_by_admin_id" apps/api` を実行し、04b-followup-001 で追加された列および helper が存在することを確認する。さらに `rg -n "/admin/requests" apps/api apps/web` で resolve API / queue 画面の未実装を確認する。

### ステップ 2: AC 定義

- AC-1: admin が pending 依頼を一覧で取得できる。非 admin は UI / API の双方で 401/403 または redirect として拒否される
- AC-2: visibility_request 承認（resolution=approve）で `member_status.publish_state` が依頼内容に応じて更新される
- AC-3: delete_request 承認（resolution=approve）で `member_status.is_deleted=1` が立つ（物理削除は行わない）
- AC-4: resolution=reject では `member_status` を一切変更せず、`admin_member_notes.request_status='rejected'` と audit metadata のみを更新する
- AC-5: `request_status` が `pending` 以外（resolved / rejected）の noteId への二重 resolve は 409 Conflict として拒否される
- AC-6: D1 transaction の途中失敗時は `member_status` と `admin_member_notes` の両方が rollback され、部分更新が残らない

補助不変条件:

- `resolutionNote` は任意 string（最大 500 文字）として `admin_member_notes.body` の resolution envelope に記録し、PII を含めない運用ガイドを Phase 12 で明示する
- 07a admin UI から queue 一覧 → 詳細 → resolve 操作が可能で、resolve 完了後に当該行が pending 一覧から消える

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | AC を test matrix（API / repository transaction / web / visual）に変換 |
| Phase 7 | AC matrix の正本 |
| Phase 11 | admin queue 画面の screenshot / a11y evidence の対象 |

## 多角的チェック観点（AIが判断）

- 真の論点: 依頼を「受け付けた」だけでは利用規約上の「自己情報削除権」を満たせないため、admin 確定経路の atomic 性と audit 完全性が本質
- 依存境界: schema 拡張は 04b-followup-001 で完了済み、本タスクは resolve API + UI に限定する
- 価値とコスト: 通知 / メール連携は運用価値があるが MVP では別タスクとして切り出し、本タスクは confirm 済みの行が永続化される所までを責務とする

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | P50 チェック定義 | spec_created | 実装時に再実行 |
| 2 | AC-1〜AC-6 定義 | spec_created | Phase 7 へ引き継ぎ |
| 3 | 不変条件固定 | spec_created | index.md と重複記載 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義サマリ |
| メタ | artifacts.json | Phase 1 spec_created |

## 完了条件

- [ ] AC が番号付きで定義されている
- [ ] P50 チェックが明記されている
- [ ] Phase 1-3 gate が明記されている
- [ ] D1 transaction / 論理削除 / 二重 resolve 409 の不変条件が AC に表現されている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置済み
- [ ] 仕様作成時は artifacts.json の Phase 1 が `spec_created` のまま維持され、実行完了時にのみ `completed` へ更新する運用が明記されている

## 次Phase

次: 2 (設計)。Phase 2 は API / repository transaction / web UI / admin proxy / visual evidence の topology を固定する。
