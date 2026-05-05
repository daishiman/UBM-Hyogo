# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

`GET /admin/audit`、repository query、apps/web `/admin/audit`、admin proxy、PII mask、visual evidence の設計境界を固定する。

## 実行タスク

1. API contract を query schema / response schema / error schema に分ける
2. D1 実 schema と repository contract を照合する
3. apps/web の admin route と proxy 経由の data flow を設計する
4. PII mask と JSON viewer の表示責務を UI 層に閉じる
5. validation matrix と owner matrix を作る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| DB | apps/api/migrations/0003_auth_support.sql | `audit_log` columns |
| Repository | apps/api/src/repository/auditLog.ts | 既存 list API |
| Admin route | apps/api/src/routes/admin/attendance.ts | `requireAdmin` と audit append 例 |
| Web admin | apps/web/app/(admin)/layout.tsx | UI gate |
| Proxy | apps/web/app/api/admin/[...path]/route.ts | API gateway |
| Client | apps/web/src/lib/admin/api.ts | admin client 追加先 |

## 実行手順

### ステップ 1: API contract

`GET /admin/audit` query:

| field | type | 制約 |
| --- | --- | --- |
| action | string | 任意。完全一致 |
| actorEmail | string | 任意。完全一致または normalized lower-case |
| targetType | string | 任意。targetId と併用可 |
| targetId | string | 任意 |
| from | string | 任意。JST local datetime |
| to | string | 任意。JST local datetime |
| limit | number | 1-100、既定 50 |
| cursor | string | 任意。created_at + audit_id 由来 |

response:

```ts
type AdminAuditListResponse = {
  items: AdminAuditListItem[];
  nextCursor: string | null;
  appliedFilters: AdminAuditFilters;
};
```

API は raw `before_json` / `after_json` を response に露出しない。response item は `maskedBefore` / `maskedAfter` と `parseError` を返し、UI は defense-in-depth として再 mask する。cursor は base64url JSON `{ "createdAt": string, "auditId": string }` とし、order は `created_at DESC, audit_id DESC` に固定する。invalid cursor は 400。date range は JST 入力を UTC に変換し、`from <= created_at < toExclusive` で評価する。`actorEmail` は lower-case normalize、`targetType` は既存 `audit_log.target_type` の任意 string filter として扱い、列挙固定で将来 action を阻害しない。

### ステップ 2: DB / repository 対応表

| 仕様語 | DB column | 既存 repository | 追加要否 |
| --- | --- | --- | --- |
| auditId | audit_id | SELECT_COLS | なし |
| actorEmail | actor_email | `listByActor` | 複合 filter 追加 |
| action | action | append のみ | filter 追加 |
| targetType | target_type | `listByTarget` | 複合 filter 追加 |
| targetId | target_id | `listByTarget` | 複合 filter 追加 |
| beforeJson | before_json | SELECT_COLS | なし |
| afterJson | after_json | SELECT_COLS | なし |
| createdAt | created_at | SELECT_COLS | cursor / range 追加 |

### ステップ 3: Web topology

| layer | 責務 | 追加候補 |
| --- | --- | --- |
| apps/api route | query validation / auth / response | `apps/api/src/routes/admin/audit.ts` |
| apps/api repository | safe WHERE builder / cursor | `auditLog.listFiltered` |
| packages/shared | 必要なら zod schema / types | 既存 shared 方針に合わせる |
| apps/web proxy | Auth.js session 再検証 + Worker forwarding | 既存 proxy を流用 |
| apps/web page | filter form / table / viewer | `apps/web/app/(admin)/admin/audit/page.tsx` |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | query schema と edge case を test cases 化 |
| Phase 5 | API / repository 実装順 |
| Phase 6 | UI component 分割 |
| Phase 11 | screenshot と a11y target |

## 多角的チェック観点（AIが判断）

- action enum は固定列挙しすぎず、既存 action を候補表示、任意 string filter を許容する
- cursor は offset より変更に強いが、D1 query complexity が増すため `created_at/audit_id` の stable order を必須にする
- PII mask は保存値を変更せず、API response projection で raw 値を masked view に変換する。UI viewer は masked view だけを受け取り、DOM に raw PII を置かない

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | API contract | completed | query / response |
| 2 | DB 対応表 | completed | 存在しない column 前提なし |
| 3 | Web topology | completed | apps/web D1 直参照禁止 |
| 4 | validation matrix | completed | Phase 4 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計サマリ |
| メタ | artifacts.json | Phase 2 completed |

## 完了条件

- [x] DB / API / UI の対応表がある
- [x] admin gate が Phase 1/2/3 に重複明記されている
- [x] PII mask の責務境界が明記されている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [x] main.md 配置済み
- [x] artifacts.json の Phase 2 が completed

## 次Phase

次: 3 (設計レビュー)。MAJOR があれば Phase 2 に戻す。
