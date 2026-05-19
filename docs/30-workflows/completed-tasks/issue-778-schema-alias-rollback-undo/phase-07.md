# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | spec_created |

## 目的

T-09 / T-10 / T-12 で追加するテストケースを列挙し、エッジケース網羅を担保する。

## API test (`apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts`)

| ID | ケース | 期待 |
| --- | --- | --- |
| A-01 | 正常系: resolve 済 alias を rollback | 200 / `audit_log` 1 行追加 / `schema_aliases.deleted_at` set / `schema_diff_queue.status = 'queued'` |
| A-02 | version mismatch | 409 / row 不変 / audit 0 行 |
| A-03 | not_found（存在しない aliasId） | 404 |
| A-04 | already_deleted | 404 |
| A-05 | If-Match ヘッダ無し | 400 |
| A-06 | batch_failed（mock で 2 番目 statement fail） | 500 / row 不変（atomicity 検証） |
| A-07 | non-admin actor | 403 (`requireAdmin` middleware) |
| A-08 | rollback 行の `after_json.relatedAuditId` が元 resolve audit を正しく参照 | row 確認 |
| A-09 | 影響件数算出: response 0 件 → `recomputeRequired = false` | response shape |
| A-10 | 影響件数算出: response 3 件 → `recomputeRequired = true / affectedResponseCount = 3` | response shape |

## Component test (`apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`)

| ID | ケース | 期待 |
| --- | --- | --- |
| C-01 | HistoryPane に resolved alias 一覧が描画される | role=list / 各 row に rollback ボタン |
| C-02 | rollback ボタン click → 確認 modal 表示 | modal に actor email / 影響件数表示 |
| C-03 | 確認 modal で confirm → API 呼出 → list 更新 | helper mock 確認 / row 消える |
| C-04 | confirm → API 409 → reload prompt 表示 | error UI |
| C-05 | confirm → API 500 → retry prompt 表示 | error UI |
| C-06 | resolve 完了直後に undo toast 表示 | toast role / "取消" link |
| C-07 | undo toast click → API 呼出（rollback と同経路） | helper mock 確認 |
| C-08 | resolve 後 4:59 で undo 可、5:00 で 1ms 後 hidden | timer mock |
| C-09 | resolve 後 5:01 経過時点で undo toast 非表示 | timer mock |
| C-10 | rollback modal の focus trap | a11y |
| C-11 | rollback ボタンに `aria-label` 設定 | a11y |
| C-12 | OKLch token のみ使用（HEX 直書きなし） | snapshot grep |

## E2E / Visual (Playwright)

| ID | ケース | 期待 |
| --- | --- | --- |
| V-01 | `/admin/schema` の SchemaDiffPanel rollback modal screenshot | baseline 追加 (4 screens: desktop / mobile / dark / light) |
| V-02 | undo toast screenshot | baseline 追加 |

## 命名・規約

- 全 test file は `*.spec.{ts,tsx}` 命名（CLAUDE.md #8 / lefthook block-test-suffix）
- API spec は `vitest`、Component spec は `vitest + @testing-library`、Visual は `@playwright/test`

## 完了条件

- [ ] A-01〜A-10、C-01〜C-12、V-01〜V-02 すべて pass
- [ ] coverage が `pnpm coverage` で既存閾値以上

## 次 Phase

- 次: 8（ドキュメント更新）
