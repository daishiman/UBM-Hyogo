# Phase 8: リファクタリング / DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング / DRY 化 |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

resolve route と repository helper の重複・分岐肥大化を整理し、approve / reject の差分と admin gate / audit metadata 書き込みの責務を明確化する。

## 実行タスク

1. resolve route の approve / reject 分岐を `resolveRequest({ resolution, note, ... })` 形式の単一関数に集約する
2. visibility_request / delete_request の `member_status` 更新部分を type-discriminated handler に分離する（switch 文の肥大化を防ぐ）
3. admin gate（`requireAdmin`）の重複呼び出しを admin router 単位に集約する
4. audit metadata 書き込み（`resolved_by_admin_id` / `resolved_at` / `resolutionNote`）を `markResolved` / `markRejected` に閉じ、route 側で散らばらないようにする
5. apps/web の `/admin/requests` 配下で確認 modal / toast / 409 ハンドリングを共通 component に切り出す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | phase-05.md | API 実装 |
| Phase 6 | phase-06.md | UI 実装 |
| Repository | apps/api/src/repository/adminNotes.ts | helper 既存形 |

## 実行手順

### ステップ 1: 分離候補確認

| 関心 | 分離先候補 | 判定 |
| --- | --- | --- |
| approve / reject 分岐 | apps/api route 内 service 関数 | API 限定なら shared 化しない |
| type-discriminated handler | apps/api/src/services/requestResolution.ts | visibility / delete を別 handler |
| audit metadata write | repository helper 内 | route から散らさない |
| confirmation modal | apps/web/src/components/admin/ | UI 専用 |

### ステップ 2: regression test

リファクタ後に Phase 4 / 7 の TC を再実行する。AC-2〜AC-6 の atomic / 409 / rollback が引き続き PASS することを確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint / tests |
| Phase 10 | final review の構造確認 |

## 多角的チェック観点（AIが判断）

- 抽象化は重複と漏洩リスクを減らす場合だけ行う
- D1 batch の組み立てを 1 箇所に集約し、partial commit 経路が増えないようにする
- shared 化で apps/web 側に repository 型が漏れないよう、API response 用 view model だけを共有する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | resolveRequest service 集約 | pending | approve / reject 統合 |
| 2 | type handler 分離 | pending | visibility / delete |
| 3 | UI 共通 component | pending | modal / toast |
| 4 | regression test | pending | Phase 4 TC |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | refactor 記録 |

## 完了条件

- [ ] resolve 分岐が単一 service に集約されている
- [ ] audit metadata 書き込みが repository helper に閉じている
- [ ] regression test が PASS
- [ ] 不要な shared 化をしていない

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 8 を completed に更新

## 次Phase

次: 9 (品質保証)。
