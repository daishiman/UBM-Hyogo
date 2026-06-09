# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]` / status: `completed` / 本ファイルは最終レビューの evidence。

本サイクルで apps/web 実装・focused tests・typecheck を実行した。runtime/staging screenshot・commit・push・PR のみ user-gated とする。

## 10.1 AC-0..AC-9 受け入れ基準と紐付け

| AC | PASS 基準 | 対応 test / evidence | 判定 |
|----|-----------|----------------------|----------------------|
| AC-0 | route `/admin/tags/catalog` が存在し `GET /admin/tags`（q/page/pageSize）を消費して code/label/category/active を一覧表示 | `page.tsx` + `TagCatalogPanel.component.spec.tsx` + shell nav tests | PASS |
| AC-1 | inactive 行から reactivate 成功 → active + 一覧即時反映（200 row） | `TagCatalogRow`（reactivate 出現）+ panel が trigger→`router.refresh`。`TagCatalogPanel.component.spec.tsx` AC-1 ケース | PASS |
| AC-2 | active 行から physical delete → 不可逆明示の ConfirmDialog 表示・確認なしには削除されない | `ConfirmDialog`（isDestructive・「元に戻せない」）+ state machine confirm_pending。spec「confirm なし→mutation 未呼出」 | PASS |
| AC-3 | physical delete 409 `tag_has_references` → referenceCount を「N 人に使用中のため削除不可」表示 | `parseTagLifecycleError`（tag_has_references inline error）+ panel inline 表示。`tagCatalogLifecycle.spec.ts` + panel spec AC-3 | PASS |
| AC-4 | 3 操作が視覚的・文言的に区別され混同して誤操作できない | descriptor 確定値（buttonLabel/intent/requiresConfirm）+ `availableOps(active)` 出し分け。`tagCatalogLifecycle.spec.ts` + `TagCatalogRow.component.spec.tsx` | PASS |
| AC-5 | 既存 `/admin/tags`（TagQueuePanel）・tag picker が退化しない（additive） | 新規 route の additive 追加・既存ファイル非改変。Phase 9 G9（変更ファイル 6 限定）+ 既存 spec 不変 | PASS |
| AC-6 | reactivate 冪等（既 active への reactivate）を error 扱いしない（200 + 現 row・静かに維持） | state machine success 扱い・バナー抑止。panel spec AC-6 ケース | PASS |
| AC-7 | 404 `tag_not_found` が読める形で表示・操作が詰まらない | `parseTagLifecycleError`（not_found）→「既に削除済みです」+ pendingTagId 全解放（Phase 8 RT-5）。`tagCatalogLifecycle.spec.ts` + panel spec AC-7 | PASS |
| AC-8 | desktop / mobile で操作部品・ダイアログ・409 表示が崩れず重ならない | responsive CSS + component DOM tests。runtime/staging screenshot は user-gated | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-9 | 色は OKLch token 正本のみ・HEX / `bg-[#xxx]` 禁止 | `verify-design-tokens` gate（Phase 9 G3）。`.admin-tag-catalog-*` は既存 token 参照のみ | PASS |

## 10.2 不変条件・gate サマリ

| 項目 | 状態 |
|------|------|
| 既存 API 消費のみ（新 endpoint・D1 schema 変更なし） | 守られている（消費のみ・Phase 1 §1.5） |
| D1 直アクセス禁止 | 守られている（Phase 9 G5 grep 0） |
| FormField 経由（#9）/ useAdminMutation 経由（#10） | 守られている（Phase 9 G6/G7） |
| `*.test.*` 不在（#8）・全 `*.spec.*` | 守られている（Phase 9 G8） |
| OKLch token 正本（HEX 禁止） | 守られている（Phase 9 G3 / AC-9） |
| 非退化（既存 tag picker / TagQueuePanel） | 守られている（additive・AC-5） |

## 10.3 blocker 判定

**blocker: なし**。

- 設計契約（route・component 境界・型・descriptor 確定値・state machine・409 adapter・token 方針）は Phase 2 で固定済み・Gate-A（Phase 3）PASS。
- useAdminMutation の `FetchAuthedError.bodyText` と nav 定義の実パスは実コードで確認・実装済み。

## 10.4 MINOR 指摘 / 未タスク化候補 [Feedback]

**MINOR なし。**

- 本タスクのスコープ（catalog 画面 + 3 lifecycle 配線）に閉じた MINOR は検出されない。
- physical delete 強制移行 migration（#1070 followup-001）・member_tags FK 評価（#1070 followup-003）は**既存の別タスクとして既起票済み**であり、本タスクで新たに未タスク化する候補ではない（Phase 3 §3.4）。
- 将来余地（catalog のページネーション UI 拡充・category filter の高度化）は AC に含まれず YAGNI として未起票で妥当（Rule of Three 未成立）。

## 10.5 Phase 11 / Phase 12 へ進む条件

### Phase 11（手動テスト / screenshot）進行条件
- user-gated runtime/staging cycleで Phase 5（実装）が着地し、Phase 9 gate（G1-G9）が全 PASS していること。
- desktop / mobile で以下を screenshot 取得（VISUAL・AC-8）:
  1. catalog 一覧（active / inactive 混在）
  2. reactivate 導線（inactive 行のボタン）
  3. physical delete の ConfirmDialog（不可逆明示）
  4. 409 referenceCount 表示（「N 人に使用中のため削除不可」）
  5. mobile レイアウト（操作ボタンが重ならない）
- 取得画像は `outputs/phase-11/` に配置し、Phase 12 の evidence 表に status=`present` で反映する。

### Phase 12（doc 同期）進行条件
- Phase 11 の screenshot 配置完了後、`verify:phase12-compliance`（canonical 9 見出し逐語 + Phase 11 evidence 表 status=`present`/`pending`/`n/a`）を満たすこと。
- `gate-metadata:validate`（root/outputs 双方・approver schema・evidence_path 実在）が ERROR 0。
- skill index（`indexes:rebuild`）drift なし。

## 10.6 最終判定

**PASS_BOUNDARY_SYNCED_RUNTIME_PENDING** — local implementation / focused tests / typecheck は PASS。blocker なし・MINOR なし。runtime/staging screenshot・commit・PR は user-gated。
