# 未タスク検出 — 08a-B-public-search-filter-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 12 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 検出結果

新規未タスク: **0 件**。

今回の elegant review で検出した AC 直結の改善点は、未タスク化せず今回サイクル内で実ファイルへ反映した。

| 検出事項 | 対応 |
| --- | --- |
| `status` を公開状態として説明していた semantic drift | workflow / Phase 12 /正本 specs で参加ステータスへ修正。公開境界は API base WHERE として分離 |
| `sort=name` を `member_id ASC` MVP として扱っていた drift | `apps/api/src/repository/publicMembers.ts` を `fullName ASC, member_id ASC` に修正し、focused test を追加 |
| `q` の `%` / `_` LIKE wildcard 誤一致 | `escapeLikePattern` + `LIKE ? ESCAPE '\\'` を実装し、focused test を追加 |
| API parser の q 空白正規化 / tag 5件上限漏れ | `apps/api/src/_shared/search-query-parser.ts` と focused test を更新 |
| q / zone / status と tag AND を併用したときの SQL positional bind offset drift | `placeholders(n, start)` を追加し、tag `IN (...)` が先行 bind 数から採番されるよう修正。compound filter focused test を追加 |
| `sort=recent` の同日時 tie-break が fullName を含まない drift | `last_submitted_at DESC, fullName ASC, member_id ASC` に修正し、focused test を追加 |
| specs 4 ファイルの same-wave sync gap | `12-search-tags.md` / `05-pages.md` / `01-api-schema.md` / `09-ui-ux.md` を同一 wave 更新 |
| aiworkflow-requirements 同期漏れ | `.claude` / `.agents` の quick-reference / resource-map / task-workflow-active / SKILL changelog と `docs/30-workflows/LOGS.md` を同期 |

## 既存 downstream routing

Phase 11 runtime visual evidence は新規未タスクではなく、既存 downstream の 08b / 09a が消費する実行境界として扱う。

| runtime evidence | routing |
| --- | --- |
| `/members` screenshot 9 種 | `08b-parallel-playwright-e2e-and-ui-acceptance-smoke` / `09a-parallel-staging-deploy-smoke-and-forms-sync-validation` |
| public members curl logs | 08b local runtime / 09a staging smoke |
| axe a11y report | 08b Playwright + axe / 09a staging smoke |

## coverage layer 表

| layer | file | before | after | status |
| --- | --- | --- | --- | --- |
| api unit | `apps/api/src/_shared/search-query-parser.ts` | q truncate / tag dedup | q trim + whitespace normalize + truncate / tag dedup + empty drop + 5 limit | implemented |
| api repo | `apps/api/src/repository/publicMembers.ts` | LIKE wildcard pass-through / `member_id ASC` name sort / tag AND bind offset 未考慮 | LIKE literal escape / `fullName ASC, member_id ASC` / `placeholders(n, start)` による compound filter bind alignment | implemented |
| specs | `docs/00-getting-started-manual/specs/*.md` | pending update | query/API/page/a11y synced | implemented |

## 完了条件

- [x] 0 件でも未タスク検出ファイルを出力
- [x] 検出した AC 直結改善を今回サイクル内で修正
- [x] runtime evidence pending は既存 downstream routing に限定
- [x] 新規 unassigned task 作成が不要な理由を明記
