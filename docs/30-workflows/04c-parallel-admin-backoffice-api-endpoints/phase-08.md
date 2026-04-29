# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

命名・型・path / endpoint / module 名を Wave 4 内（04a / 04b / 04c）で統一し、middleware / zod schema / repository 呼び出しの重複を抽出する。AC matrix を破壊しない範囲のみリファクタを許可する。

## Before / After

### 命名

| Before（Phase 5 草案） | After（DRY 化） | 理由 |
| --- | --- | --- |
| `verifyAuthJsSession` | `consumeAuthSession` | 04b と共通化 |
| `adminViewModelBuilder` | `adminViewBuilder` | view と builder の冗長削除 |
| `auditLog.record({action: 'admin.member.status.update'})` | `auditLog.record({action: 'admin.member.status.update'})` | actor scope `admin.*` を維持 |
| `tagQueueRepo.resolve` | `tagAssignmentQueueRepo.resolve` | 02b の repository 名と整合 |

### 型

| Before | After | 理由 |
| --- | --- | --- |
| `AdminDashboardResponse` | `AdminDashboardView` | 01b の view model 命名と統一 |
| `AdminMemberDetailResponse` | `AdminMemberDetailView` | 同上 |
| `PatchMemberStatusBody` | `AdminMemberStatusUpdateBody` | endpoint scope `Admin*` を prefix |
| `PostAttendanceBody` | `AdminAttendanceAddBody` | 同上 |

### path / endpoint

| Before | After | 理由 |
| --- | --- | --- |
| 確定済 | spec 11 の API 表と完全一致 | 変更なし |

### module

| Before | After | 理由 |
| --- | --- | --- |
| `apps/api/src/middleware/admin-gate.ts` | `apps/api/src/middleware/adminGate.ts` | 04b の `selfMemberOnly.ts` と統一 |
| `apps/api/src/middleware/audit-trail.ts` | `apps/api/src/middleware/auditTrail.ts` | 同上 |
| `apps/api/src/services/sync-job-launcher.ts` | `apps/api/src/services/syncJobLauncher.ts` | 同上 |
| `apps/api/src/services/admin-view-model-builder.ts` | `apps/api/src/services/adminViewBuilder.ts` | 同上 + 短縮 |

## 共通化候補（Wave 4 内）

| 対象 | 04a | 04b | 04c | 共通化案 |
| --- | --- | --- | --- | --- |
| Auth.js session 検証 helper | 不要 | 必要 | 必要 | 05a が export、04b/04c が consume |
| zod request body parser middleware | 不要 | 必要 | 必要 | `zValidator('json', schema)` を共通 helper |
| エラーレスポンス型 `{ code, message?, issues? }` | 必要 | 必要 | 必要 | `apps/api/src/lib/errors.ts` |
| 4xx → JSON 整形 onError | 必要 | 必要 | 必要 | Hono `app.onError` |
| audit_log helper | 不要 | 必要 (visibility/delete request) | 必要 (全 mutation) | 02c が提供、04b/04c は consume |
| pagination helper（page, pageSize, total） | 必要 | 不要 | 必要 (members / tags / meetings) | `apps/api/src/lib/pagination.ts` |

## 守るべき境界

- middleware の共通化が AC-1 (admin gate 認可) を壊さないこと
- zod schema の共通化で `MeSessionResponse` と `AdminSessionView` を 1 型にしない
- helper 共通化が apps/web に漏れない
- pagination helper が公開 API（04a）と admin で異なる secret 値を露出しない

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 命名 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | 命名規則 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 共通化後も lint / typecheck pass |
| 04a / 04b | 同 Wave で命名と helper を揃える |

## 多角的チェック観点（不変条件マッピング）

- #4 / #11: PATCH 系 module を共通化候補から除外
- #12: zod schema 共通化で notes leak 不在を維持
- #13: tag PATCH module を共通化候補から除外
- #14: schema 変更 module は `/admin/schema/*` の 2 本に閉じる

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表作成 | 8 | completed | 命名 / 型 / path / module |
| 2 | 共通化候補抽出 | 8 | completed | 04a / 04b との突き合わせ |
| 3 | 境界確認 | 8 | completed | AC を壊さない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Phase 8 主成果物 |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 完了条件

- [ ] Before / After 表が 4 セクション完成
- [ ] Wave 4 共通化候補が表で示される
- [ ] 守るべき境界が明示

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 8 を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 命名統一後の typecheck / lint / test 通過と、無料枠見積もり / secret hygiene
- ブロック条件: 命名衝突未解消なら次 Phase に進まない
