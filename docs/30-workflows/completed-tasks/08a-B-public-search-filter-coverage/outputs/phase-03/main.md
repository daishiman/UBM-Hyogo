# Phase 3 出力 — 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 3 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1/2 と同じ。Phase 3 では Phase 2 設計に対して 3 観点（システム系 / 戦略・価値系 / 問題解決系）の自己レビューを行い、不変条件・性能・差分影響・リスク・後続引き渡し・DoD を集約する。

## Phase 2 設計に対する自己レビュー

### システム系観点

| 項目 | 評価 | 備考 |
| --- | --- | --- |
| API contract（query / response）の zod による静的・実行時整合 | ✅ | `parsePublicMemberQuery`（catch + safeParse + clamp）/ `PublicMemberListViewZ`（strict）の 2 段階で穴を塞ぐ |
| public boundary（apps/web → apps/api 直 / D1 直なし） | ✅ | `fetchPublic` 経由限定。Server Component から D1 binding を import しない |
| SQL injection 防御 | ✅ | LIKE / EXISTS / IN すべて prepared statement bind |
| N+1 リスク | △ | summary 取得が member 件数分 query。`limit` は `[1,100]` で頭打ちなので MVP 許容。Phase 8 DRY 化で `IN (...)` バルク取得を提案 |
| Cache 戦略 | ✅ | `Cache-Control: no-store`（admin の publishState 変更を即時反映） |
| TypeScript 型安全 | ✅ | shared の `PublicMemberListView` interface を web 側で `z.infer` して整合 |

### 戦略・価値系観点

| 項目 | 評価 | 備考 |
| --- | --- | --- |
| 仕様正本との一致（`12-search-tags.md`） | ✅ | 6 parameter / enum / sort 2 種 / density 3 種が一致 |
| 不採用ポリシー遵守 | ✅ | `公開状態フィルタを公開一覧に出さない`（`status` は `member`/`non_member`/`academy`/`all` で publishState を含まない） |
| URL 正本（不変条件 #8） | ✅ | client state を持たず `router.replace` のみ。reload で復元される |
| solo dev 運用との整合 | ✅ | implementation / implemented-local / VISUAL_ON_EXECUTION / 自走禁止の境界明示 |
| MVP の最小手数 | ✅ | facets / 全文検索エンジン / 動的 fullName ORDER BY を out-of-scope |

### 問題解決系観点

| 想定問題 | 検出可否 | 緩和策 |
| --- | --- | --- |
| `q` に異常文字（NUL / 改行 / `%` / `_`） | ✅ | prepared bind で escape。`escapeLikePattern` で `%` `_` を文字として扱う |
| repeated `tag=` の URL 異常拡大 | ✅ | parser 段階で `slice(0, 5)` |
| enum 外値による 500 | ✅ | `catch` で default fallback、HTTP は 200 |
| 大量ヒット時の DOM 爆発 | ✅ | `limit=24` 固定 + ページング（既存 03-data-fetching に従う） |
| filter 連打による履歴汚染 | ✅ | `router.replace` 採用 |
| keyboard 操作で filter 到達不能 | △ | Phase 5 / 11 で `aria-label` 追加と axe-core で確認必須 |

## 不変条件 #4 / #5 / #6 への適合確認

| 不変条件 | 検証方法 | 適合 |
| --- | --- | --- |
| #4 公開状態フィルタ正確性 | `publicMembers.ts buildBaseFromWhere` の固定 WHERE / `existsPublicMember` の同形条件 / `publicMembers.test.ts` 既存ケース | ✅ |
| #5 public/member/admin boundary | `apps/web` から `D1Database` import が無いこと / `fetchPublic` 経由のみ / `apps/api` の admin route と分離 | ✅ |
| #6 admin-only field 非露出 | `PublicMemberListItemZ` strict / SELECT 句に admin field を含めない / `SUMMARY_KEYS` allowlist | ✅ |

## パフォーマンス観点

### 想定負荷

| 条件 | 件数想定 | 期待挙動 |
| --- | --- | --- |
| 全件 / sort=recent / limit=24 | 200〜500 件母集団 | LIKE なし → index 経由で COUNT/SELECT 両方 < 50ms |
| q 部分一致 / search_text LIKE `%xxx%` | 200 件 | LIKE 全走査だが MVP 規模で許容（< 200ms 期待） |
| zone × status × tag×3 AND | 200 件 | EXISTS 3 段 + tag IN/HAVING で D1 内に収まる |
| 全 enum 組合せ（4 × 4 × 5C2 × 2 × 3 = 480 通り） | - | parser fallback により 500 を出さない（AC-V1） |
| pagination total >= 200 | - | `COUNT(DISTINCT mi.member_id)` を 1 query で取得、`Promise.all` で並列 |

### 改善案（Phase 8 DRY / 後続）

- summary 取得の `listFieldsByResponseId` を `WHERE response_id IN (...)` のバルク 1 query に集約
- `search_text` に対する FTS5 / trigram index 化（D1 制約により MVP は対象外）
- `sort=name` の `fullName` 昇順実装（`response_fields` 経由 LATERAL JOIN もしくは `members.full_name` denormalized 列）

## 既存コードとの差分影響範囲

| 分類 | パス | 想定範囲 |
| --- | --- | --- |
| 追加 | `apps/api/src/_shared/__tests__/search-query-parser.<additional>.test.ts` | 既存 fallback テストに 6 param × エッジケース追加 |
| 追加 | `apps/api/src/repository/publicMembers.<additional>.test.ts` | tag AND / zone+status 複合 / sort=name のケース追加 |
| 追加 | `apps/web/src/lib/url/__tests__/members-search.<additional>.test.ts` | URL ↔ MembersSearch / `toApiQuery` の URL 省略ルール |
| 編集 | `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | `aria-label` / role / role=status の追加（AC-A1/A2） |
| 編集（必要時） | `apps/api/src/repository/publicMembers.ts` | `sort=name` を `fullName` 順に拡張する場合のみ |
| 削除 | なし | - |

> 既存 `apps/api/src/_shared/search-query-parser.ts` / `apps/web/src/lib/url/members-search.ts` の主要ロジックは大半が既に存在。Phase 5 ランブックは「仕様の固定化」「テスト追加」「a11y 微調整」が中心になる見込み。

## リスクと緩和策

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| `sort=name` の MVP 仕様が `fullName ASC, member_id ASC` で UX 期待に合わない | UX 違和感 | focused repository test で確認 |
| `q` の `%` `_` リテラル検索 | 検索結果のノイズ | MVP 受容。Phase 5 で `escape` 関数導入候補を残す |
| repeated `tag` の URL が肥大 | URL 長制限 | parser で 5 件 cap、UI でも `slice(0,5)` |
| 公開対象 0 件のテナント | 空状態のみ表示 | `EmptyState` + `絞り込みをクリア` で AC-E1 を満たす |
| a11y 退行 | スクリーンリーダ対象漏れ | Phase 11 で axe-core 実測、`outputs/phase-11/a11y/members-axe.json` を evidence |
| 大量 tag 候補（>5）入力時の暗黙切り捨て | ユーザ気づきにくい | UI 側で最大 5 件 hint を `aria-describedby` で案内（Phase 5 で対応） |

## 後続 Phase への引き渡し事項

### Phase 4 テスト戦略へ

- 6 query parameter ごとの unit / integration / e2e のレベル分担
- AC（AC-Q* / AC-Z* / AC-S* / AC-T* / AC-O* / AC-D* / AC-E1 / AC-V1 / AC-L1 / AC-A1/A2 / AC-INV4/5/6）と test 名のマッピング表雛形
- N+1 性能を計測する想定（既存 `int-test-skill` を活用）
- E2E は 08b で Playwright を実行（本タスクは spec のみ）

### Phase 5 実装ランブックへ

- 既存実装が既に存在するため、ランブックは「テスト追加」「a11y 補強」「ドキュメント整合」が主タスク
- 自走禁止操作: deploy / commit / push / PR は実行しない
- `apps/api` 側の編集が必要な場合は `pnpm --filter @ubm-hyogo/api typecheck` / unit test を gate
- `apps/web` 側の編集は `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web test` を gate

### Phase 11 手動 smoke / evidence へ

- screenshot 9 種 / curl 6 param 組合せ / axe レポート（Phase 1 evidence path 表に記載）

## DoD（Definition of Done）

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| DoD-1 | 6 query parameter すべてに parse・default・fallback・bind が実装され、テストでカバーされる | unit + integration green |
| DoD-2 | `GET /public/members` の query / response が `12-search-tags.md` と一致 | `PublicMemberListViewZ` strict 通過 + manual curl |
| DoD-3 | 不変条件 #4 / #5 / #6 が AC として明記され、各 1 つ以上のテストで担保 | publicMembers.test.ts / viewmodel.test.ts |
| DoD-4 | 空結果 / 不正値 / 大量ヒットの UI 挙動が記述・確認される | Phase 11 screenshot / e2e（後続 08b） |
| DoD-5 | a11y: filter UI が role / label / keyboard 操作で全到達 | axe-core report / 手動 keyboard 確認 |
| DoD-6 | URL 正本（不変条件 #8）: reload で全 filter 状態が復元される | `parseSearchParams` round-trip テスト |
| DoD-7 | evidence path が outputs/phase-11/ 以下に揃う | ファイル存在確認 |
| DoD-8 | 自走禁止操作（実装・deploy・commit・push・PR）を行っていない | git status / branch protection log |

## 完了判定

Phase 1〜3 設計は以下の状態で完了:

- 実装区分: 実装仕様書として、6 query parameter ごとの API/UI/D1 contract が固定された
- 既存実装パスを根拠として明記し、推測ではなく実ファイル参照で記述した
- 不変条件 #4 / #5 / #6 を AC とテスト戦略の双方に紐付けた
- 後続 Phase 4（テスト戦略）/ Phase 5（実装ランブック）/ Phase 11（evidence）への引き渡し事項を明示した
- DoD を 8 項目で集約した
