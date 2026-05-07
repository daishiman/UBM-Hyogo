# Phase 4: テスト雛形作成（RED）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-4/phase-4.md` |

## 目的
TDD-RED で失敗するテストを先に追加する。実装は Phase 5。

## 追加テストファイル / ケース

### `apps/api/src/repository/__tests__/attendance-provider.test.ts`（既存ファイル拡張）
- 新規 describe `findByMemberId pagination` 配下:
  - `limit のみ指定: 直近 N 件 + hasMore=true / nextCursor != null`
  - `cursor 継続: 次ページが正しく続きで取得され、ソート順 (held_on DESC, session_id DESC) が維持される`
  - `最終ページ: hasMore=false, nextCursor=null`
  - `limit デフォルト = 50`
  - `limit > 200 は 200 に silent clamp`
  - `limit < 1 は Error / 400 相当 throw`
  - `不正 cursor (base64 復号失敗) は Error throw`
  - `held_on tie-break: 同日複数 session で session_id DESC により安定`

### `apps/api/src/repository/__tests__/builder.test.ts`（既存拡張）
- `attendancePage 未注入: 既存挙動 (findByMemberIds 経路) と差分なし。attendanceMeta は undefined`
- `attendancePage 注入: findByMemberId 経路で attendance + attendanceMeta が埋まる`

### `apps/api/src/routes/me/index.test.ts`（既存または新設）
- `GET /me/profile: 51 件 fixture で 50 件 + attendanceMeta.hasMore=true`
- `GET /me/attendance?cursor=<from previous>: 残り 1 件 + hasMore=false`
- `GET /me/attendance?limit=300: 200 に clamp`
- `GET /me/attendance?cursor=invalid: 400`

### `apps/api/src/routes/admin/members.test.ts`（既存拡張）
- `GET /admin/members/:id/attendance` の同等ケース

### `apps/web/__tests__/profile-attendance-load-more.spec.ts`（新規）
- mock fetch で hasMore=true → ボタン表示 → クリック → next page append、hasMore=false でボタン非表示。

## 参照資料
- `outputs/phase-4/phase-4.md`
- `outputs/phase-2/api-design.md`

## 成果物
- 上記テストファイル群（vitest が RED）
- `outputs/phase-4/red-evidence.txt`（vitest 失敗ログ）

## 完了条件
- すべての新規テストが「実装未着手のため失敗」する RED 状態である。
- vitest 出力が `outputs/phase-4/red-evidence.txt` に保存されている。
- commit / push / PR は Phase 13 の独立ユーザー承認ゲートまで実行しない。

## 実行タスク
- [ ] 上記テストを追加し、`mise exec -- pnpm --filter @ubm-hyogo/api test:run --reporter=basic` で RED を確認する。
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:run` で UI テストの RED を確認する。

## 統合テスト連携
- Phase 6 で GREEN 化を確認する。
