# Phase 6 出力 — 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 6 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| docs_only | true |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1〜3 設計に対し、`GET /public/members` の 6 query parameter（q / zone / status / tag / sort / density）に関する異常系・境界系の期待挙動を、既存実装（`apps/api/src/_shared/search-query-parser.ts` / `apps/api/src/repository/publicMembers.ts`）の根拠付きで固定する。Phase 4 のテスト戦略・Phase 11 の手動 smoke が参照する一次情報。

## 異常系一覧（query parameter 単位）

### `q`（部分一致クエリ）

| ケース ID | 入力 | 期待挙動 | 根拠 / 不変条件 |
| --- | --- | --- | --- |
| AB-Q-E1 | `?q=`（空文字） | 200 OK / `appliedQuery.q=""` / WHERE に LIKE 句を付けず全件母集団を返す | `parsePublicMemberQuery` default `""` |
| AB-Q-E2 | `?q=` を 200 文字超（例 250 文字） | 200 OK / `appliedQuery.q` は先頭 200 文字に truncate / LIKE は truncate 後の値で bind | parser の `slice(0,200)` |
| AB-Q-E3 | `?q=  Aさん   太郎  `（前後空白 / 連続空白） | 200 OK / `appliedQuery.q="Aさん 太郎"`（trim + 連続空白 1 つ正規化） | parser の `trim()` + `.replace(/\s+/g," ")` |
| AB-Q-E4 | `?q=%E3%80%80`（全角空白のみ） | 200 OK / 正規化で空文字相当に縮約後、LIKE を bypass | 同上の正規化 |
| AB-Q-E5 | `?q=%00abc`（NUL / 制御文字） | 200 OK / prepared statement の bind で安全に LIKE / 500 を返さない | D1 prepared bind |
| AB-Q-E6 | `?q=100%25` (`%` リテラル) / `?q=foo_bar` (`_` リテラル) | 200 OK / `%` `_` は `LIKE ? ESCAPE \` と `escapeLikePattern` で文字として扱う/ 500 を返さない | Phase 3 リスク表「`%` `_` 特殊一致誤動作」MVP 受容 |
| AB-Q-E7 | `?q=' OR 1=1 --`（SQL injection 試行） | 200 OK / prepared bind で escape され、結果はリテラル一致（ほぼ 0 件） | D1 prepared bind |
| AB-Q-E8 | `?q=<script>alert(1)</script>` | 200 OK / DB は LIKE bind / UI 側は React の自動 escape で XSS なし | React JSX エスケープ |
| AB-Q-E9 | `q` を repeated で複数指定（`?q=a&q=b`） | parser は string でない場合 default に fallback / Hono `c.req.queries('q')` の仕様に従い 1 件目を採用 | parser `safeParse(string)` |

### `zone`

| ケース ID | 入力 | 期待挙動 | 根拠 |
| --- | --- | --- | --- |
| AB-Z-E1 | `?zone=unknown`（enum 外） | 200 OK / `appliedQuery.zone="all"` / WHERE に zone 条件を付けない | parser `catch("all")` |
| AB-Z-E2 | `?zone=ALL` / `?zone=0_TO_1`（大文字混在） | 200 OK / 大文字小文字は **厳密一致のみ**。enum 外扱いで `all` に fallback | parser のenum 比較は厳密一致 |
| AB-Z-E3 | `?zone=`（空文字） | 200 OK / default `all` | parser default |
| AB-Z-E4 | `zone` を 2 つ指定（`?zone=0_to_1&zone=1_to_10`） | 1 件目を採用、それ以外は無視（Hono `c.req.query('zone')`） | Hono ランタイム仕様 |

### `status`

| ケース ID | 入力 | 期待挙動 | 根拠 / 不変条件 |
| --- | --- | --- | --- |
| AB-S-E1 | `?status=private` / `?status=withdrawn`（**非 public 値**） | 200 OK / parser の enum allowlist (`all` / `member` / `non_member` / `academy`) に該当しないため `appliedQuery.status="all"` に fallback / **そもそも repository の base WHERE で `publish_state='public'` AND `is_deleted=0` AND `public_consent='consented'` を強制適用しているため、退会・非公開・未同意の member は決して結果に含まれない** | 不変条件 #4 / `buildBaseFromWhere` 固定句 |
| AB-S-E2 | `?status=unknown`（enum 外） | 200 OK / `appliedQuery.status="all"` | parser `catch("all")` |
| AB-S-E3 | `?status=publishState`（admin 用 stable_key を狙ったレコン試行） | 200 OK / fallback `all` / SQL は `EXISTS` の bind 値が一致しないだけ。admin field は SELECT 句にも含まれず、response にも露出しない | 不変条件 #6 |

### `tag`

| ケース ID | 入力 | 期待挙動 | 根拠 |
| --- | --- | --- | --- |
| AB-T-E1 | `?tag=does-not-exist` | 200 OK / `tag_definitions.code` に存在しない値で IN bind / 該当 0 件のため空結果 | repository tag IN/HAVING |
| AB-T-E2 | `?tag=a&tag=b&tag=c&tag=d&tag=e&tag=f`（**6 件以上**、TAG_LIMIT=5 超過） | 200 OK / parser が `slice(0,5)` で先頭 5 件のみ採用 / 6 件目以降は黙って無視 / `appliedQuery.tags.length<=5` | parser の `slice(0,5)` |
| AB-T-E3 | `?tag=a&tag=a&tag=b`（重複） | 200 OK / dedup（`Array.from(new Set)`）で `["a","b"]` に縮約 / AND 条件は 2 件で評価 | parser dedup |
| AB-T-E4 | `?tag=` 空値混在（`?tag=&tag=a`） | 空文字を除外して `["a"]` を採用 | parser filter `Boolean` |
| AB-T-E5 | `?tag=' OR 1=1 --` | 200 OK / IN bind で escape / 0 件 | prepared bind |
| AB-T-E6 | `?tag=` を非 string 値で送信（理論上）| parser の `z.array(z.string())` で reject → default `[]` | zod safeParse |

### `sort`

| ケース ID | 入力 | 期待挙動 |
| --- | --- | --- |
| AB-O-E1 | `?sort=unknown` / `?sort=DESC`（enum 外） | 200 OK / `appliedQuery.sort="recent"` / ORDER BY は `last_submitted_at DESC, fullName ASC, member_id ASC` |
| AB-O-E2 | `?sort=`（空文字） | 200 OK / default `recent` |
| AB-O-E3 | `?sort=name` | 200 OK / `fullName ASC, member_id ASC` で氏名順を返す |

### `density`

| ケース ID | 入力 | 期待挙動 |
| --- | --- | --- |
| AB-D-E1 | `?density=unknown`（enum 外） | 200 OK / `appliedQuery.density="comfy"` / UI は comfy で描画 |
| AB-D-E2 | `?density=grid`（旧仕様の値） | 200 OK / fallback `comfy` |
| AB-D-E3 | `?density=`（空文字） | 200 OK / default `comfy` |

### 横断（pagination）

| ケース ID | 入力 | 期待挙動 |
| --- | --- | --- |
| AB-P-E1 | `?page=0` / `?page=-1` | clamp `1` |
| AB-P-E2 | `?page=abc` | parser `coerce.number().catch(1)` で `1` |
| AB-P-E3 | `?limit=200` | clamp `100` |
| AB-P-E4 | `?limit=0` / `?limit=-5` | clamp `1` |

## 期待 HTTP ステータスの方針

| 状況 | ステータス | 根拠 |
| --- | --- | --- |
| 全 query parameter の異常値（enum 外 / 過大 / 制御文字） | **200 OK + fallback** | AC-V1 公開導線で UX を壊さない（400 を返さない） |
| `Accept` 不一致 / メソッド違い | 405 / 406（Hono デフォルト） | フレームワーク仕様 |
| repository / DB 例外 | 500 | use-case の try/catch で握り、ログ出力 |
| Schema strict reject（response が admin field を含む規約違反） | 500（dev 環境）/ 200 で開発時に検知 | `PublicMemberListViewZ.strict()` の `parse` 失敗 |
| 422 はこのエンドポイントでは **採用しない** | — | parse エラーを 200 fallback に倒す方針のため |

## 不変条件 #4 強制（status 異常入力時）

「`status=private` / `status=withdrawn` のような非 public 値が来ても、結果に非公開 member が混入してはいけない」を担保する設計:

1. `parsePublicMemberQuery` が `status` enum allowlist で reject → `all` fallback
2. **repository `buildBaseFromWhere` が固定 WHERE で公開可視性を強制**:
   ```sql
   WHERE s.public_consent = 'consented'
     AND s.publish_state  = 'public'
     AND s.is_deleted     = 0
   ```
3. `status=all` 時は `ubmMembershipType` の EXISTS を **付けない**（全公開 member を返す）
4. `status=member` 等の有効値時のみ `EXISTS (SELECT 1 FROM response_fields ... stable_key='ubmMembershipType' AND value_json=?)` を AND 追加

→ ユーザがどんな status 値を投げても、非公開 member が結果に出ない（テストは AC-INV4 配下で検証）。

## 大量ヒット（>= 200 件）の挙動

| 観点 | 仕様 |
| --- | --- |
| pagination | `limit=24` 固定で `page=1..N`、`hasNext`/`hasPrev` で遷移 |
| total | `COUNT(DISTINCT mi.member_id)` を別 query で取得（`Promise.all` 並列） |
| UI 描画 | 1 ページあたり最大 24 件、`MemberList` は仮想スクロール不採用（DOM 規模 < 100 で十分） |
| 期待レイテンシ | LIKE なし: < 200ms / LIKE あり: < 500ms（D1 edge / MVP 規模） |
| 上限 hard cap | `limit` clamp `[1, 100]`。仮に `?limit=500` が来ても 100 で頭打ち（DoS 防御） |
| 母集団 0 件 | `EmptyState` + `絞り込みをクリア` link（`href="/members"`） / AC-E1 |

## レート制限・タイムアウト時の UI 表示

| 状況 | 期待挙動 |
| --- | --- |
| Cloudflare Workers 側の sub-request タイムアウト（30s） | API 500 / Server Component で `try/catch` し、`MemberList` に「一時的な障害」メッセージ + retry リンク |
| D1 query timeout / `D1_ERROR` | API 500 / 同上 |
| Cloudflare のレート制限（1000 req/min/IP 想定） | 429 / Server Component が catch して「混雑中」メッセージ。filter UI は disable しない（再試行可） |
| client fetch error（network） | client component は server fetch のみのため発生しない（filter 操作は `router.replace` 経由で server re-render） |

> 本タスクではレート制限・タイムアウトの実装変更は行わない。UI 表示の方針のみ仕様化（Phase 8 DRY で `EmptyState` / error fallback を統合する候補）。

## a11y フォールバック

| 観点 | 期待挙動 / 評価方法 |
| --- | --- |
| JS 無効時 | `MembersFilterBar` は `<form method="GET" action="/members">` として `noscript` フォールバックは **MVP 対象外**（Server Component だが filter UI は client）。代替として `/members` 直 URL がフィルタなしで動作することを保証 |
| スクリーンリーダー（VoiceOver / NVDA） | 各 input に `aria-label`、結果数は `<div role="status" aria-live="polite">{N} 件</div>`（AC-A2）|
| キーボード操作 | Tab / Shift+Tab / Enter / Space / Arrow（segmented control 内）で全 filter に到達・操作可能（AC-A1） |
| 色のみで状態を伝えない | active filter は色 + アウトライン + テキストラベルの三重表現 |
| focus visible | `:focus-visible` outline を CSS で付与（既存 design system に準拠） |
| 過大入力時の通知 | `tag` を 6 件超入力した場合、UI は 5 件 cap を `aria-describedby` で hint（Phase 5 で実装予定） |
| 検索結果 0 件 | `EmptyState` 内のメッセージは見出し（`<h2>`）+ link で構成、reader で読み上げ可能 |

## 検証手順（Phase 11 で実施）

### unit / integration test（apps/api）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test \
  -- search-query-parser publicMembers
```

- `apps/api/src/_shared/__tests__/search-query-parser.<edge>.test.ts`（追加予定）
- `apps/api/src/repository/__tests__/publicMembers.<edge>.test.ts`（追加予定）

### unit test（apps/web）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test \
  -- members-search
```

- `apps/web/src/lib/url/__tests__/members-search.<edge>.test.ts`（追加予定）

### curl 手動検証

```bash
# 各異常系（evidence: outputs/phase-11/curl-logs/<case>.log）
curl -s "https://<host>/public/members?q=$(python -c 'print("x"*250)')" | jq .appliedQuery
curl -s "https://<host>/public/members?zone=unknown"                     | jq .appliedQuery
curl -s "https://<host>/public/members?status=private"                   | jq .appliedQuery
curl -s "https://<host>/public/members?tag=a&tag=b&tag=c&tag=d&tag=e&tag=f" | jq '.appliedQuery.tags|length'
curl -s "https://<host>/public/members?sort=DESC"                        | jq .appliedQuery.sort
curl -s "https://<host>/public/members?density=grid"                     | jq .appliedQuery.density
curl -s "https://<host>/public/members?limit=500&page=0"                 | jq .pagination
curl -s "https://<host>/public/members?q=%27%20OR%201%3D1%20--"          | jq '.items|length'
```

### Playwright（08b 委譲）

異常系 E2E は本タスクの spec を根拠として 08b-A-playwright-e2e-full-execution が実装する。

## evidence path

| 種別 | パス（Phase 11 で生成） |
| --- | --- |
| curl 異常系一括 | `outputs/phase-11/curl-logs/edge-cases.logl` |
| screenshot: 大量ヒット paginated | `outputs/phase-11/screenshots/members-large-hit.png` |
| screenshot: 空結果 | `outputs/phase-11/screenshots/members-empty.png` |
| screenshot: status 異常入力 | `outputs/phase-11/screenshots/members-status-fallback.png` |
| screenshot: tag 6 件 cap | `outputs/phase-11/screenshots/members-tag-cap.png` |
| a11y axe report | `outputs/phase-11/a11y/members-axe.json` |

## 自走禁止操作

- 実装ファイルの編集は Phase 5 ランブック以降
- deploy / commit / push / PR は Phase 13 まで実行しない
- D1 production / staging への migration apply は実施しない

## DoD

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| DoD-6-1 | 6 query parameter ごとに異常系ケース ID が定義されている | 本ファイル内の表 |
| DoD-6-2 | `status` 非 public 値が来ても不変条件 #4 で除外される設計になっている | 本ファイル「不変条件 #4 強制」節 |
| DoD-6-3 | tag 6 件超 / 重複 / 存在しない tag id の挙動が明記されている | AB-T-E1〜E6 |
| DoD-6-4 | enum 外値で 400 を返さず 200 + fallback の方針が明記されている | 「期待 HTTP ステータスの方針」 |
| DoD-6-5 | 大量ヒット / レート制限 / タイムアウト / a11y フォールバック が記述されている | 各節 |
| DoD-6-6 | 検証手順（unit / curl / Playwright）と evidence path が対応付けられている | 「検証手順」/「evidence path」 |
| DoD-6-7 | 自走禁止操作（実装・deploy・commit・push・PR）を実行していない | git status |

## 多角的チェック観点（4 条件）

| 条件 | 確認 |
| --- | --- |
| 矛盾なし | parser fallback 値（`all` / `recent` / `comfy` / `[]`）が Phase 1/2 と一致 |
| 漏れなし | 6 query parameter × （正常 / 境界 / 異常）+ 横断（pagination / a11y / レート / タイムアウト）を網羅 |
| 整合性 | `appliedQuery` が必ず正規化済み値を返す（UI が URL と整合） |
| 依存関係整合 | parser → repository base WHERE → view strict の三段で公開境界を担保（不変条件 #4/#5/#6） |

## 次 Phase への引き渡し

Phase 7 へ:

- 異常系ケース ID（AB-Q-E* / AB-Z-E* / AB-S-E* / AB-T-E* / AB-O-E* / AB-D-E* / AB-P-E*）
- 各ケースの期待挙動と evidence path
- HTTP ステータス方針（200 + fallback で統一）
- 不変条件 #4 / #5 / #6 への異常系経由の強制ロジック
