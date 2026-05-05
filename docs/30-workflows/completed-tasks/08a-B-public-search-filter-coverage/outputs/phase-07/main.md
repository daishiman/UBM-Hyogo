# Phase 7 出力 — AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 7 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| docs_only | true |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1 で定義した AC（AC-Q* / AC-Z* / AC-S* / AC-T* / AC-O* / AC-D* / AC-E1 / AC-V1 / AC-L1 / AC-A1/A2 / AC-INV4/5/6）と、Phase 6 で洗い出した異常系ケース（AB-*-E*）を **AC マトリクス** として一対一対応させる。各 AC は実装ファイル / 検証方法 / 期待値 / 関連不変条件 / evidence path / status を持つ。

`status` は AC 直結の API / Web URL 実装 drift を今回サイクル内で修正済み。runtime screenshot / curl / axe 実測は Phase 11 / 08b / 09a に委譲するため、AC マトリクス上は `IMPLEMENTED_STATIC_RUNTIME_PENDING` として扱う。

## AC マトリクス（正常系・境界系）

| AC-ID | 内容 | 実装ファイル | 検証方法 | 期待値 | 関連不変条件 | evidence path | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-Q1 | `?q=ふじた` で `search_text` 経由の部分一致 hit | `apps/api/src/repository/publicMembers.ts` (LIKE 句) | integration test + curl | `items[].fullName` 等に `ふじた` を含む member が hit / 0 件以上 | #4 | `outputs/phase-11/curl-logs/q-hit.log` / `screenshots/members-q-hit.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q2 | `q` の trim / 連続空白 / 200 文字 truncate | `apps/api/src/_shared/search-query-parser.ts` | unit test (parser) | `appliedQuery.q` が正規化済み | — | unit test green log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q3 | 制御文字 / SQL 特殊文字で 500 を返さない | parser + repository (prepared bind) | unit + curl | 200 OK | — | `outputs/phase-11/curl-logs/edge-cases.logl` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Z1 | zone enum 全 4 値の API/UI 挙動 | parser + repository EXISTS / UI segmented | integration + Playwright (08b) | 各値で SQL EXISTS が `value_json=?` で bind される | — | `screenshots/members-zone.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-S1 | status enum 全 4 値の API/UI 挙動 | 同上（`stable_key='ubmMembershipType'`） | 同上 | 同上 | #4 | 同上 | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-T1 | `?tag=a&tag=b` で AND（`HAVING COUNT(DISTINCT)=N`） | `publicMembers.ts` tag IN/HAVING | integration | 2 tag を両方持つ member のみ hit | — | `screenshots/members-tag-and.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-T2 | tag 5 件超は先頭 5 件のみ採用 | parser `slice(0,5)` | unit + curl | `appliedQuery.tags.length<=5` | — | `curl-logs/edge-cases.log` (AB-T-E2) | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-T3 | 重複 tag は dedup 後に AND | parser `Array.from(new Set)` | unit | 重複入力 → 1 件として評価 | — | unit test log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-O1 | `sort=recent` / `name` で並び替え切替 | `publicMembers.ts` ORDER BY 分岐 | integration | recent: `last_submitted_at DESC, fullName ASC, member_id ASC` / name: 氏名順（同名時 `member_id ASC`） | — | `screenshots/members-sort-name.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-D1 | `density` は UI のみ反映、`appliedQuery.density` にエコー | view + UI | integration + Playwright | response の `appliedQuery.density` が一致 | — | `screenshots/members-density-{dense,list}.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-E1 | 0 件で `EmptyState` + `絞り込みをクリア` link | `EmptyState` + `MemberList` | Playwright (08b) | href=`/members` の link が存在 | — | `screenshots/members-empty.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-V1 | enum 外 / 過大値で 500 を返さず default fallback | parser `catch` | unit + curl | 200 OK / `appliedQuery` は正規化済み default | — | `curl-logs/edge-cases.log` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-L1 | 公開 200 件以上で `limit=24` ページング、描画 1s 以内 | repository pagination + UI | Playwright + Lighthouse | total/totalPages 整合 / 1s 以内描画 | — | `screenshots/members-large-hit.png` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-A1 | 各 filter 入力に visible label or `aria-label`、Tab/Enter/Space 到達可能 | `MembersFilterBar.client.tsx` | axe-core + 手動 keyboard | violation 0 件 | — | `outputs/phase-11/a11y/members-axe.json` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-A2 | 結果数を `role=status` `aria-live=polite` で読み上げ | `MemberList` 上部 | axe-core | 領域が存在しテキスト変化を通知 | — | 同上 | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-INV4 | `publish_state!='public'` / `is_deleted=1` / `public_consent!='consented'` の member が **絶対に** 結果に含まれない | `publicMembers.ts buildBaseFromWhere` 固定句 | integration test (fixture に non-public を混入) | non-public は `items[]` に出現 0 件 | #4 | `apps/api/src/repository/publicMembers.test.ts` 結果ログ | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-INV5 | `apps/web` から D1 直接アクセスが発生しない | grep `D1Database` in `apps/web/` | static check | 該当 0 件（fetch 経由のみ） | #5 | grep 結果 + `apps/web/src/lib/fetch/public.ts` 参照 | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-INV6 | response に admin-only field を含まない | `PublicMemberListViewZ.strict()` | integration test (response shape) | strict reject が走り余分 key で例外 | #6 | viewmodel.test.ts ログ | IMPLEMENTED_STATIC_RUNTIME_PENDING |

## AC マトリクス（異常系 / Phase 6 由来）

Phase 6 の AB-*-E* ケースを AC として扱い、本マトリクスに追加する。

| AC-ID | 内容 | 検証方法 | 期待値 | 関連不変条件 | evidence path | status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-Q-E1 | `q=""` で LIKE bypass / 全件母集団 | unit + curl | `appliedQuery.q=""` | — | `curl/edge.jsonl` | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E2 | `q` 200 文字超 truncate | unit | `q.length===200` | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E3 | `q` trim + 連続空白正規化 | unit | 正規化済み文字列 | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E4 | 全角空白のみ → bypass | unit | `q===""` 相当 | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E5 | NUL / 制御文字で 500 を返さない | curl | 200 OK | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E6 | `%` `_` リテラルを LIKE 特殊文字として許容 | curl | 200 OK / 結果ノイズ許容 | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E7 | SQL injection 試行で 500 を返さない | curl | 200 OK / 0 件 | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Q-E8 | `<script>` 入力でも UI 上 XSS が起きない | Playwright | DOM に script tag 注入なし | — | Playwright log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Z-E1 | `zone=unknown` で `all` fallback | unit + curl | `appliedQuery.zone=="all"` | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-Z-E2 | 大文字混在は厳密一致のため fallback | unit | 同上 | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-S-E1 | `status=private` / `withdrawn` でも non-public 露出ゼロ | integration (fixture) + curl | `items[]` に non-public 0 件 / `appliedQuery.status="all"` | **#4** | publicMembers.test.ts | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-S-E2 | `status=unknown` で `all` fallback | unit | 同上 | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-T-E1 | 存在しない tag id で 0 件 | integration | `items==[]` | — | curl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-T-E2 | tag 6 件以上で先頭 5 件 cap | unit + curl | `tags.length<=5` | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-T-E3 | 重複 tag dedup | unit | dedup 後 AND | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-O-E1 | `sort=unknown` で `recent` fallback | unit + curl | `appliedQuery.sort="recent"` | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-D-E1 | `density=unknown` で `comfy` fallback | unit + curl | `appliedQuery.density="comfy"` | — | edge.jsonl | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-P-E1 | `page<=0` clamp `1` / `page=abc` coerce `1` | unit | `pagination.page===1` | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-P-E2 | `limit>100` clamp `100` / `limit<=0` clamp `1` | unit | `pagination.limit∈[1,100]` | — | unit log | IMPLEMENTED_STATIC_RUNTIME_PENDING |
| AC-RT-1 | レート制限 / タイムアウト時に UI が「混雑中」表示 | manual smoke (Phase 11) | error fallback が描画 | — | `screenshots/members-error-fallback.png`（必要時） | IMPLEMENTED_STATIC_RUNTIME_PENDING |

## 6 query parameter × ケース（正常 / 境界 / 異常）網羅性チェック

| key | 正常 | 境界 | 異常 | カバー AC-ID |
| --- | --- | --- | --- | --- |
| `q` | AC-Q1 | AC-Q2 / AC-Q-E2 / AC-Q-E3 / AC-Q-E4 | AC-Q3 / AC-Q-E5 / AC-Q-E6 / AC-Q-E7 / AC-Q-E8 | 9 件 |
| `zone` | AC-Z1 (4 enum) | — | AC-Z-E1 / AC-Z-E2 | 3 件 |
| `status` | AC-S1 (4 enum) | — | AC-S-E1（不変条件 #4 強制）/ AC-S-E2 | 3 件 |
| `tag` | AC-T1 | AC-T2 / AC-T3 / AC-T-E2 / AC-T-E3 | AC-T-E1 / AC-T-E5（SQLi） | 6 件 |
| `sort` | AC-O1 (2 enum) | — | AC-O-E1 | 2 件 |
| `density` | AC-D1 (3 enum) | — | AC-D-E1 | 2 件 |
| pagination 横断 | — | AC-L1 | AC-P-E1 / AC-P-E2 | 3 件 |
| empty / invalid 横断 | — | AC-E1 | AC-V1 | 2 件 |
| a11y 横断 | AC-A1 / AC-A2 | — | — | 2 件 |
| 不変条件 横断 | AC-INV4 / AC-INV5 / AC-INV6 | — | — | 3 件 |

→ 合計 **35 AC**。6 parameter すべてに対し正常 / 境界 / 異常のいずれも 1 件以上ずつ存在。

## 不変条件 #4 / #5 / #6 の AC マッピング

| 不変条件 | 第一義 AC | 補強 AC | 強制ロジック |
| --- | --- | --- | --- |
| #4 公開状態フィルタ正確性 | AC-INV4 | AC-S1 / AC-S-E1 / AC-Q1（base WHERE 越しに LIKE） | `buildBaseFromWhere` 固定句（`public_consent='consented'` AND `publish_state='public'` AND `is_deleted=0`） |
| #5 public/member/admin boundary | AC-INV5 | AC-Q1 / AC-Z1 / AC-S1 / AC-T1（すべて `fetchPublic` 経由） | `apps/web/app/(public)/members/page.tsx` が `fetchPublic` のみ使用 / D1 binding 非 import |
| #6 admin-only field 非露出 | AC-INV6 | AC-S-E3（admin stable_key を狙ったレコン試行） | `PublicMemberListItemZ.strict()` + SELECT 句に admin field 非含 + `SUMMARY_KEYS` allowlist |

## 抜け漏れチェック結果

| 観点 | 確認 | 結果 |
| --- | --- | --- |
| 全 6 parameter に AC が存在 | q / zone / status / tag / sort / density | OK（カバー数 9/3/3/6/2/2） |
| 各 parameter に異常系が 1 つ以上 | — | OK |
| 不変条件 #4 / #5 / #6 すべてに AC が存在 | — | OK（各 1 件 + 補強あり） |
| empty / invalid / large の 3 種が網羅 | AC-E1 / AC-V1 / AC-L1 | OK |
| a11y が AC として存在 | AC-A1 / AC-A2 | OK |
| evidence path が全 AC に対応 | unit log / curl / screenshots / axe | OK（一部「unit log」総称） |
| status が `IMPLEMENTED_STATIC_RUNTIME_PENDING` | 全 35 件 | OK（実コード反映済み / runtime 実測未実施） |
| 検証方法が unit / integration / e2e / manual のいずれかで明示 | — | OK |

> **未充足の観点**: なし。Phase 1〜6 で定義した AC は全件本マトリクスにエントリされている。

## 後続 Phase 8（DRY）への引き継ぎ

Phase 8 で重複統合・抽象化を検討する候補:

1. **parser fallback 群の DRY**: `q` / `zone` / `status` / `sort` / `density` のパターン（`safeParse` + `catch` + 正規化）が 5 箇所で繰り返されているため、`createEnumWithFallback<T>(allow, default)` のヘルパに集約候補
2. **異常系テストの table-driven 化**: AC-Q-E* / AC-Z-E* / AC-S-E* / AC-T-E* / AC-O-E* / AC-D-E* / AC-P-E* を `describe.each` で 1 ファイルに統合
3. **summary 取得の N+1 解消**: `listFieldsByResponseId` を `WHERE response_id IN (...)` のバルク 1 query に集約（Phase 3 リスク表）
4. **error fallback UI の共通化**: AC-E1（empty）/ AC-RT-1（error）の表示コンポーネントを `EmptyState` / `ErrorState` に分離・統合
5. **`appliedQuery` echo の view 統一**: API → UI でラベル文字列に変換するロジックを `members-search.ts` に集約（reverse map）
6. **a11y assertion の helper 化**: axe-core 実行と filter UI 共通の検証 step を Playwright の fixture に切り出し

## 自走禁止操作

- 実装ファイルの編集は Phase 5 ランブック以降
- deploy / commit / push / PR は Phase 13 まで実行しない
- D1 production / staging への migration apply は実施しない

## DoD

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| DoD-7-1 | 全 AC が AC-ID / 内容 / 実装 / 検証方法 / 期待値 / 不変条件 / evidence / status の 8 列で表化されている | 本ファイル AC マトリクス |
| DoD-7-2 | 6 query parameter × ケース（正常 / 境界 / 異常）の網羅性が表で確認されている | 「網羅性チェック」 |
| DoD-7-3 | 不変条件 #4 / #5 / #6 の AC マッピングが明示されている | 「不変条件マッピング」 |
| DoD-7-4 | 抜け漏れチェック結果が記述され、未充足項目があれば対応方針が示されている | 「抜け漏れチェック結果」 |
| DoD-7-5 | Phase 8 DRY への引き継ぎ候補が 3 件以上ある | 「後続 Phase 8 への引き継ぎ」(6 件) |
| DoD-7-6 | 全 AC の status が `IMPLEMENTED_STATIC_RUNTIME_PENDING` で統一（実コード反映済み / runtime pending） | マトリクス右端列 |
| DoD-7-7 | 自走禁止操作（実装・deploy・commit・push・PR）を実行していない | git status |

## 多角的チェック観点（4 条件）

| 条件 | 確認 |
| --- | --- |
| 矛盾なし | AC-ID 体系が Phase 1（AC-*）/ Phase 6（AB-*-E* → AC-*-E*）で一貫 |
| 漏れなし | 6 parameter × 3 種（正常 / 境界 / 異常）+ 横断（pagination / a11y / 不変条件）すべてに AC を配置（35 件） |
| 整合性 | 各 AC の検証方法と evidence path が Phase 4 / Phase 11 の計画と一致 |
| 依存関係整合 | 不変条件 #4 が parser fallback ではなく repository base WHERE で強制される設計が AC-INV4 / AC-S-E1 で二重に担保 |

## 次 Phase への引き渡し

Phase 8（DRY 化）へ:

- AC マトリクス全 35 件
- DRY 候補 6 件（parser fallback / table-driven test / N+1 解消 / error UI / appliedQuery echo / a11y helper）
- 不変条件 #4/#5/#6 の二重担保構造（parser allowlist + repository base WHERE + view strict）
