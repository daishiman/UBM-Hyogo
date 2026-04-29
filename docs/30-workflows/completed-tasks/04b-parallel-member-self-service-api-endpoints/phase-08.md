# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

命名・型・path / endpoint / module 名を Wave 4 内（04a / 04b / 04c）で統一し、middleware / zod schema / repository 呼び出しの重複を抽出する。AC matrix を破壊しない範囲のみリファクタを許可する。

## Before / After

### 命名

| Before（Phase 5 草案） | After（DRY 化） | 理由 |
| --- | --- | --- |
| `verifyAuthJsSession` | `consumeAuthSession` | 04a / 04c と共通名にする（05a が helper を export） |
| `loadMemberProfileForSelf` | `loadOwnMemberProfile` | "self" 命名は middleware 名 (`self-member-only`) と統一 |
| `selfRequestQueue` | `memberSelfRequestQueue` | 02c の adminMemberNotes と命名階層を揃える |
| `audit_log.record({action: 'self.visibility_request'})` | `audit_log.record({action: 'member.self.visibility_request'})` | actor scope を prefix で表現（04c の admin.* と区別） |

### 型

| Before | After | 理由 |
| --- | --- | --- |
| `GetMeResponse` | `MeSessionResponse` | URL 文字列を含めず、view model 命名に揃える |
| `GetMeProfileResponse` | `MeProfileResponse` | 同上 |
| `PostVisibilityRequestBody` | `MeVisibilityRequestBody` | endpoint scope (`Me*`) を prefix |
| `PostDeleteRequestBody` | `MeDeleteRequestBody` | 同上 |

### path / endpoint

| Before | After | 理由 |
| --- | --- | --- |
| 確定済 | `/me`, `/me/profile`, `/me/visibility-request`, `/me/delete-request` | spec 07-edit-delete.md と一致、変更なし |

### module

| Before | After | 理由 |
| --- | --- | --- |
| `apps/api/src/services/edit-response-url.ts` | `apps/api/src/services/editResponseUrl.ts` | apps/api 内の他サービス（camelCase）と統一 |
| `apps/api/src/services/self-request-queue.ts` | `apps/api/src/services/memberSelfRequestQueue.ts` | 同上 |
| `apps/api/src/middleware/self-member-only.ts` | `apps/api/src/middleware/selfMemberOnly.ts` | 同上 |

## 共通化候補（Wave 4 内）

| 対象 | 04a | 04b | 04c | 共通化案 |
| --- | --- | --- | --- | --- |
| Auth.js session 検証 helper | 不要（公開 API） | 必要 | 必要 | 05a が export、04b/04c が consume |
| zod request body parser middleware | 不要 | 必要 | 必要 | `zValidator('json', schema)` を共通 helper 化 |
| エラーレスポンス型 `{ code, message, issues? }` | 必要 | 必要 | 必要 | `apps/api/src/lib/errors.ts` で共通定義 |
| 4xx → JSON 整形 onError | 必要 | 必要 | 必要 | Hono `app.onError` で共通化 |
| audit_log helper | 不要 | 必要 | 必要 | 02c が提供、04b/04c は consume |

## 守るべき境界

- middleware の共通化が AC-1 (401 + memberId 不開示) を壊さないこと
- zod schema の共通化で `MeSessionResponse` と `AdminSessionResponse` を 1 型にしない（admin と member は別モデル）
- helper 共通化が apps/web に漏れない（apps/api 内に閉じる）

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/04-types.md | view model 命名 |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | 命名規則 |
| 参考 | docs/00-getting-started-manual/specs/02-auth.md | session helper |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 共通化後も lint / typecheck が pass |
| 04a / 04c | 同 Wave で命名と helper を揃える |

## 多角的チェック観点（不変条件マッピング）

- #4: PATCH 系 module を共通化候補から除外（理由: 不在を維持）
- #11: middleware 共通化が memberId 露出を生まない（理由: 認可境界）
- #12: zod schema 共通化で notes leak しない（理由: response 型に notes 不在を維持）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表作成 | 8 | pending | 命名 / 型 / path / module |
| 2 | 共通化候補抽出 | 8 | pending | 04a / 04c との突き合わせ |
| 3 | 境界確認 | 8 | pending | AC を壊さない |

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
