# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | pending |

## 目的

命名・型・path / endpoint / module 名を Wave 4 内（04a / 04b / 04c）で統一し、helper / converter / zod schema / repository 呼び出しの重複を抽出する。AC matrix（Phase 7）を破壊しない範囲のみリファクタを許可する。本タスクは公開境界に閉じる helper（公開フィルタ / visibility filter）を 04b/04c から流用する境界を厳しく判定する。

## Before / After

### 命名

| Before（Phase 5 草案） | After（DRY 化） | 理由 |
| --- | --- | --- |
| `buildPublicWhereParams` | `buildPublicMemberWhereParams` | 04b/04c の `buildSelfMemberWhereParams` 等と階層を揃える |
| `parsePublicMemberQuery` | `parsePublicDirectoryQuery` | endpoint scope（public-directory）を prefix |
| `keepPublicFields` | `filterPublicVisibilityFields` | 動詞 `filter` で揃える（04b/04c の view 操作と統一） |
| `existsPublic(memberId, where)` | `existsPublicMember(memberId)` | repository 名で member 区別、where は内部固定 |
| `to-public-stats` 等 | `toPublicStatsView` 等 | view モジュール内 export を camelCase + `View` suffix で統一 |

### 型

| Before | After | 理由 |
| --- | --- | --- |
| `PublicStatsView` | `PublicStatsView` | 01b 既存と一致、変更なし |
| `PublicMemberListView` | `PublicMemberListView` | 同上、変更なし |
| `PublicMemberProfile` | `PublicMemberProfileView` | view 命名規則 (`*View`) に合わせる方向で 01b に提案、整合済まで保留 |
| `FormPreviewView` | `FormPreviewView` | 既存と一致 |
| `ParsedPublicMemberQuery` | `PublicDirectoryQuery` | parser の戻り型を query の view 型として統一 |

### path / endpoint

| Before | After | 理由 |
| --- | --- | --- |
| 確定済 | `/public/stats`, `/public/members`, `/public/members/:memberId`, `/public/form-preview` | spec 03-data-fetching.md と一致、変更なし |

### module

| Before | After | 理由 |
| --- | --- | --- |
| `apps/api/src/_shared/public-filter.ts` | `apps/api/src/_shared/publicFilter.ts` | 他 shared と camelCase 統一 |
| `apps/api/src/_shared/search-query-parser.ts` | `apps/api/src/_shared/publicDirectoryQueryParser.ts` | scope を明示、04b/04c の query parser と衝突回避 |
| `apps/api/src/_shared/visibility-filter.ts` | `apps/api/src/_shared/visibilityFilter.ts` | camelCase 統一 |
| `apps/api/src/_shared/pagination.ts` | `apps/api/src/_shared/paginationMeta.ts` | meta 算出の責務を明示、04b list 系と共通化候補 |
| `apps/api/src/view-models/public/*` | 同上、ファイル名 camelCase 化 | 統一 |

## 共通化候補（Wave 4 内）

| 対象 | 04a | 04b | 04c | 共通化案 |
| --- | --- | --- | --- | --- |
| Auth.js session 検証 helper | 不要（公開 API） | 必要 | 必要 | 05a が export、04a は consume しない |
| エラーレスポンス型 `{ code, message?, issues? }` | 必要 | 必要 | 必要 | `apps/api/src/lib/errors.ts` で共通定義 |
| 4xx → JSON 整形 `app.onError` | 必要 | 必要 | 必要 | Hono の onError を共通 helper 化 |
| paginationMeta 算出 | 必要 | 必要（list 系） | 必要 | `_shared/paginationMeta.ts` を 3 タスク共有 |
| zod safeParse + default fallback パターン | 必要 | 不要 | 部分必要 | `_shared/parseWithFallback.ts` を 04a 主導で共通化 |
| 404 / NotFoundError throw | 必要 | 不要 | 必要 | `_shared/errors/notFound.ts` を共通 |
| visibility filter | 必要 | 不要 (本人は全件) | 必要（admin 一部 mask） | 04a 主導で `_shared/visibilityFilter.ts` を export |
| public filter | 必要 | 不要 | 不要（admin は全件取得） | 04a 内に閉じる |

## 守るべき境界

- `publicFilter` の helper を 04b（self-service）/ 04c（admin）が import して where 条件を流用しないこと（04b は本人のみ、04c は管理側で適用条件が違う）
- `visibilityFilter` の挙動が `field.visibility === 'public'` 以外を返さない（04c の admin が `visibility='member'` を見る用途では別 helper を作る）
- session middleware の共通化が 04a の公開 endpoint に誤って適用されないよう、router マウントを 04b/04c と分離する（不変条件 #5 公開境界）
- `error response 型` の共通化で `code` 名（`NOT_FOUND` / `INTERNAL` / `BAD_REQUEST`）を 4 タスクで揃える
- `responseEmail` を含む型を converter から export しない（不変条件 #3）

## DRY 化で起こり得る違反パターンと対策

| 違反パターン | 影響 | 対策 |
| --- | --- | --- |
| 04b の `loadOwnMemberProfile` を 04a が流用 | 不変条件 #11 違反（admin/self 用 view が public に漏出） | 04a は `getPublicMemberProfile` を独自実装、流用禁止を docstring 明記 |
| `buildPublicWhereParams` を 04c が流用 | 04c の admin 用の where が壊れる（admin は全件取得が前提） | 04a 内に閉じる、04c は別 where helper |
| エラー型共通化で `issues` 詳細が leak | 422 の zod error から内部 column 名が漏れる | `issues` の path を user-friendly に re-map する helper |
| paginationMeta 共通化で `total` が cache 化 | stats と member list で cache 戦略が混ざる | meta 算出は純粋関数、cache 戦略は handler で個別決定 |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/04-types.md | view model 命名 |
| 必須 | docs/30-workflows/_design/phase-2-design.md | 命名規則 |
| 必須 | outputs/phase-07/ac-matrix.md | DRY 化で AC を壊さない判定根拠 |
| 参考 | docs/00-getting-started-manual/specs/03-data-fetching.md | endpoint 一覧 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 共通化後も lint / typecheck / test が pass |
| 04b / 04c | 同 Wave で命名と helper を揃える、共通化境界で合意 |
| 08a | error 型統一を contract test に取り込み |

## 多角的チェック観点（不変条件マッピング）

- #2（consent キー統一）— `publicFilter` の共通化を 04b/04c に流用させない（理由: 流用先で条件が違う）
- #3（`responseEmail` system field）— converter export 型に含めない、検索対象 column の共通化でも除外
- #5（apps/web → D1 直禁止）— shared helper が apps/web に漏れない（apps/api 内に閉じる）
- #11（admin-managed 分離）— 04a の view-model を 04c が import して `adminNotes` を流用する経路を断つ
- #14（schema 集約）— `visibilityFilter` を `schema_questions.visibility` 参照前提で実装、enum 直書き禁止

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表作成 | 8 | pending | 命名 / 型 / path / module |
| 2 | 共通化候補抽出 | 8 | pending | 04b / 04c との突き合わせ |
| 3 | 守るべき境界明示 | 8 | pending | AC を壊さない |
| 4 | 違反パターンと対策 | 8 | pending | 4 件以上 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Phase 8 主成果物 |
| メタ | artifacts.json | Phase 8 を `completed` に更新 |

## 完了条件

- [ ] Before / After 表が 4 セクション完成
- [ ] Wave 4 共通化候補が表で示される
- [ ] 守るべき境界が明示
- [ ] DRY 化で起こり得る違反パターンと対策が 4 件以上記述

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 8 を `completed` に更新

## 次 Phase

- 次: 9（品質保証）
- 引き継ぎ事項: 命名統一後の typecheck / lint / test 通過と、無料枠見積もり / secret hygiene
- ブロック条件: 04b / 04c との命名衝突未解消、または `publicFilter` の流用判定が未確定なら次 Phase に進まない
