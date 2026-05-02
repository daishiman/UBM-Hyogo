# Phase 04 Main — テスト戦略

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `04 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## verify suite（4 層）

| 層 | 対象 | 例 | 担当 path |
| --- | --- | --- | --- |
| unit | query builder（filter/q/zone/tag/sort/density/page）, audit logger, web fetch helper | `q` の trim+normalize+max 200 / repeated `tag` の AND / `sort` 許可リスト判定 / `density` enum 判定 | apps/api unit (vitest) + packages/shared |
| contract | apps/api 4 endpoint の I/O | `GET /api/admin/members?filter=published&q=foo&tag=a&tag=b&density=dense` の response shape / detail の `auditLogs[]` / delete `{ id, isDeleted, deletedAt }` / restore `{ id, restoredAt }` | apps/api integration |
| authorization | require-admin middleware | guest=401 / member=403 / admin=200 を 4 endpoint × 3 ロールで網羅 | apps/api authz |
| E2E | apps/web 一覧→詳細→delete→restore | Playwright（**08b admin members E2E** で実行）seeded/sanitized fixture 前提 | 08b-A |

## 検索パラメータ組合せ table（12-search-tags 網羅）

| 組合せ | 期待動作 | 検証層 |
| --- | --- | --- |
| filter=published | 公開中メンバーのみ | contract |
| filter=hidden | 非公開のみ | contract |
| filter=deleted | 論理削除済みのみ | contract |
| q=有効 trim | 前後空白除去・連続空白を 1 つに | unit |
| q 長さ 201 文字 | 422 | contract / failure |
| zone=A | 該当 zone のみ | contract |
| tag=a&tag=b（repeated） | a AND b（積集合） | unit + contract |
| sort=name / createdAt / 範囲外 | 範囲内 200 / 範囲外 422 | unit + contract |
| density=comfy / dense / list / その他 | 前 3 つ 200 / その他 422 | unit + contract |
| page=99999 | 200 + items: [] | contract |

## audit 検証

- delete / restore handler 呼出後、`audit_log` に actor / target memberId / action / timestamp が必ず 1 行追加されることを contract test で SELECT して確認。
- audit 書込み失敗時は handler 全体が transaction rollback すること（5xx）。

## 08b（E2E）への引き渡し

- seeded fixture: admin / member / guest 各 1、`active`×3 / `hidden`×1 / `deleted`×1、tag 2 種、zone 2 種
- sanitized 前提: 実会員 PII を含めない
- E2E 範囲: list → detail → delete → restore → audit 表示 → 403/401 redirect

## 完了条件チェック

- [x] 4 層のテスト責務分離
- [x] 検索パラメータ組合せが 12-search-tags 全項目網羅
- [x] audit 書込み検証が contract に含まれる

## 次 Phase への引き渡し

Phase 5 へ、4 層テスト suite と 08b 引き渡し fixture 仕様を渡す。
