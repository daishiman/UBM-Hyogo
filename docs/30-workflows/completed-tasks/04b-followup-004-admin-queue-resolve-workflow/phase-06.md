# Phase 6: Web UI 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 6 / 13 |
| Phase 名称 | Web UI 実装 |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (API / repository 実装) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |

## 目的

`apps/web/app/(admin)/admin/requests/page.tsx` に visibility_request / delete_request の依頼キュー UI を追加し、admin が pickup → 詳細確認 → approve / reject まで操作できる画面を提供する。

## 実行タスク

1. AdminSidebar に `/admin/requests` 導線を追加する（07a admin sidebar と同期）
2. Server Component で admin proxy 経由 `GET /admin/requests?status=pending` を取得し、queue table を描画する
3. 行 pickup → 詳細表示（依頼者 / 依頼種別 / 依頼内容 payload / 提出日時）を render する
4. approve / reject ボタン → confirmation modal → `POST /admin/requests/:noteId/resolve` を呼ぶ client action を実装する
5. resolution 後は `revalidatePath` または client refetch でキューを最新化する
6. empty / error / loading / mobile layout を実装する
7. 二重 resolve の 409 を受けたときの再取得 + メッセージ表示を実装する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Admin layout | apps/web/app/(admin)/layout.tsx | admin gate |
| Sidebar | apps/web/src/components/layout/AdminSidebar.tsx | ナビ追加 |
| Fetch | apps/web/src/lib/admin/server-fetch.ts | server fetch |
| Proxy | apps/web/app/api/admin/[...path]/route.ts | API 経由 |
| Spec | docs/00-getting-started-manual/specs/07-edit-delete.md | UX 要件 |

## 実行手順

### ステップ 1: route placement

既存 admin 画面の構造に合わせ、`apps/web/app/(admin)/admin/requests/page.tsx` を作成する。`/admin/requests` URL が成立し、admin gate 未満は redirect されることを確認する。

### ステップ 2: queue UI

filter は `type=visibility_request|delete_request|all` を主 filter、`status=pending` をデフォルトとする。table は `提出日時 / 依頼者 / 種別 / 概要 / アクション` の列構成。FIFO 表示（古い順）。

### ステップ 3: detail / confirmation

行クリックで右側 drawer または同画面下部に詳細を展開する。approve / reject ボタンは modal で最終確認を取り、approve 時の影響（公開状態変更 / 論理削除）を文言で明示する。`resolutionNote` を任意入力できるようにする。

### ステップ 4: 結果反映

resolve 成功後はキューから該当行を消し、toast / banner で結果を通知する。409 が返った場合は「既に他の admin が処理済み」を明示し、画面を再読込する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-21〜TC-27（UI flow） |
| Phase 7 | AC-1〜AC-6 evidence |
| Phase 11 | screenshot target（queue / detail / modal / empty） |

## 多角的チェック観点（AIが判断）

- approve は破壊的操作のため confirmation を必ず挟む
- audit metadata は server 側で記録するため、UI 側で操作者情報を入力させない
- 依頼 payload に PII が含まれる可能性があるため、不要な raw 表示は避ける
- read-only 閲覧と write 操作の境界を視覚的に区別する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | route/page 追加 | pending | apps/web |
| 2 | queue table | pending | server component |
| 3 | detail drawer | pending | payload 表示 |
| 4 | resolve modal / action | pending | client action |
| 5 | Sidebar 導線 | pending | 07a 同期 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Web 実装記録 |
| コード | apps/web/app/(admin)/admin/requests/page.tsx | 画面 |
| コード | apps/web/src/components/layout/AdminSidebar.tsx | 導線 |
| コード | apps/web/src/components/admin/RequestQueue*.tsx | queue / detail / modal |

## 完了条件

- [ ] `/admin/requests` が admin gate 配下で表示される
- [ ] pickup → approve / reject → 結果反映の一連の flow が機能する
- [ ] 409 ハンドリングと empty / error / loading が実装済み
- [ ] PII raw 値が DOM に不要に出ていない

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 6 を completed に更新

## 次Phase

次: 7 (AC マトリクス)。
