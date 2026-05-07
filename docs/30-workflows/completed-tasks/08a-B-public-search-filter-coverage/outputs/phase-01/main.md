# Phase 1 出力 — 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 1 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| docs_only | false（Phase 12 review で AC 直結の API / Web URL 実装 drift を検出し、今回サイクル内で実コードへ反映） |

## 実装区分宣言

本タスクは `[実装区分: 実装仕様書]`。判定根拠:

- `apps/api/src/_shared/search-query-parser.ts`（query 受け取り型 / 既定値 / fallback ルール）
- `apps/api/src/routes/public/members.ts`（`GET /public/members` の handler）
- `apps/api/src/repository/publicMembers.ts`（D1 join / where / order by）
- `apps/web/src/lib/url/members-search.ts`（URL ↔ MembersSearch / `toApiQuery`）
- `apps/web/app/(public)/members/page.tsx` および `_components/MembersFilterBar.client.tsx`（UI と URL 同期）

これら 5 系統に対して contract と AC を仕様書として固定し、Phase 5 実装ランブックの根拠を作る。コード差分そのものは Phase 5 以降。

## 6 種 query parameter の意味と既知ケース

| key | 型 | 既定値 | 許容値 | 既知ケース | 不正値挙動 |
| --- | --- | --- | --- | --- | --- |
| `q` | string | `""` | 0..200 文字 / 前後 trim / 連続空白 1 つに正規化 | 部分一致 hit / 全文 hit / 空文字 / 200 文字超 truncate / 連続空白 | 200 文字超は 200 で切る。string 以外は `""` |
| `zone` | string enum | `"all"` | `all` / `0_to_1` / `1_to_10` / `10_to_100` | enum 一致 hit / `all` で素通し | enum 外は `all` |
| `status` | string enum | `"all"` | `all` / `member` / `non_member` / `academy` | enum 一致 hit / `all` で素通し | enum 外は `all` |
| `tag` | string[] | `[]` | repeated query / 0..5 件 / dedup 済み | 0 件 / 1 件 / 複数 AND / 重複入力 dedup / 6 件目以降切捨 | 全件 string でないものは除外。最大 5 件で truncate |
| `sort` | string enum | `"recent"` | `recent` / `name` | recent: `last_submitted_at DESC` / name: 氏名順（同名時 `member_id ASC`） | enum 外は `recent` |
| `density` | string enum | `"comfy"` | `comfy` / `dense` / `list` | UI のみ反映。API は appliedQuery にエコー | enum 外は `comfy` |

すべて initial value（`q=""` / `zone=all` / `status=all` / `tag=[]` / `sort=recent` / `density=comfy`）は URL 上で省略する。

## AC（query parameter 単位）

| ID | 対象 | AC |
| --- | --- | --- |
| AC-Q1 | q | `?q=ふじた` で `fullName` / `nickname` / `occupation` / `location` / `businessOverview` / `skills` / `canProvide` / `selfIntroduction` / `tags` を対象にした部分一致が成立する（`member_responses.search_text` 経由） |
| AC-Q2 | q | `?q=` 前後空白 / 連続空白は 1 つに正規化、`?q=` 200 文字超は 200 で切る |
| AC-Q3 | q | 制御文字 / SQL 特殊文字は prepared statement で escape され 500 を返さない |
| AC-Z1 | zone | enum 全 4 値で API/UI 双方の挙動が `12-search-tags.md` と一致する |
| AC-S1 | status | enum 全 4 値で API/UI 双方の挙動が一致する |
| AC-T1 | tag | repeated `?tag=a&tag=b` で AND 条件 (`HAVING COUNT(DISTINCT td.code)=N`) が成立する |
| AC-T2 | tag | tag 5 件超は先頭 5 件のみ採用、URL の追加分は無視 |
| AC-T3 | tag | 重複入力は dedup 後に AND 適用 |
| AC-O1 | sort | `recent` / `name` で並び替えが切り替わる（recent は `last_submitted_at DESC, fullName ASC, member_id ASC`） |
| AC-D1 | density | UI でのみ表示密度が切り替わり、API response の `appliedQuery.density` にエコーされる |
| AC-E1 | empty | 全 condition で 0 件のとき空状態 + `絞り込みをクリア` を `/members` リンクとして表示 |
| AC-V1 | invalid | enum 外 / 過大 limit は黙って default に fallback、500 を返さない |
| AC-L1 | large | 公開 200 件以上で `limit=24` 固定の場合 ページング meta が一貫し、UI が描画 1s 以内 |
| AC-A1 | a11y | 各 filter 入力に visible label or `aria-label` を付与し、Tab / Shift+Tab / Enter / Space で全要素到達・操作可能 |
| AC-A2 | a11y | 検索結果数 / 状態変化が `role=status` `aria-live=polite` 領域で読み上げられる |
| AC-INV4 | 不変条件#4 | `publish_state != 'public'` / `is_deleted=1` / `public_consent != 'consented'` の member は結果に含まれない |
| AC-INV5 | 不変条件#5 | `apps/web` から D1 直接アクセスが発生しない（`fetchPublic` 経由のみ） |
| AC-INV6 | 不変条件#6 | response の `items[].*` に admin-only field（`responseEmail` / `publicConsent` / `rulesConsent` / `publishState` / `isDeleted` / `internalNote` 等）が含まれない |

## 不変条件マッピング

| 不変条件 | 実装根拠 | AC |
| --- | --- | --- |
| #4 公開状態フィルタ正確性 | `publicMembers.ts buildBaseFromWhere` の `WHERE s.public_consent='consented' AND s.publish_state='public' AND s.is_deleted=0` | AC-INV4 |
| #5 public/member/admin boundary | `apps/web/app/(public)/members/page.tsx` は `fetchPublic` のみ使用 / D1 binding 参照しない | AC-INV5 |
| #6 admin-only field 非露出 | `PublicMemberListItemZ` strict + view converter `toPublicMemberListView` | AC-INV6 |

## 異常系・境界系の取り扱い

| ケース | 期待挙動 |
| --- | --- |
| 空結果 | API 200 / `items=[]` / `pagination.total=0`。UI は `EmptyState` + `絞り込みをクリア`（href=`/members`） |
| 不正値（enum 外 / 過大文字数） | parser が default に fallback。HTTP は 200。`appliedQuery` には正規化済み値を返す |
| 大量ヒット（>=200 件） | `limit=24` 固定でページング。1 ページの描画で N+1 回避（`SUMMARY_KEYS` のみ取得、limit 100 で頭打ち） |
| 制御文字 / 特殊文字 | LIKE bind で安全。`%` / `_` は `escapeLikePattern` でリテラル検索にする |
| 同一 tag を複数指定 | dedup（`new Set`）で 1 件として AND |
| tag 数 6 件以上 | 5 件目以降は切り捨て、URL に残った tag は無視 |
| a11y フォーカストラップ | 一覧 → フィルタ復帰の `tabindex` 整合確認 |

## evidence path 対応表

| 種別 | パス（Phase 11 で生成） |
| --- | --- |
| screenshot: 初期表示 | `outputs/phase-11/screenshots/members-default.png` |
| screenshot: q 部分一致 | `outputs/phase-11/screenshots/members-q-hit.png` |
| screenshot: zone+status 複合 | `outputs/phase-11/screenshots/members-zone.png` |
| screenshot: tag AND | `outputs/phase-11/screenshots/members-tag-and.png` |
| screenshot: sort=name | `outputs/phase-11/screenshots/members-sort-name.png` |
| screenshot: density=dense / list | `outputs/phase-11/screenshots/members-density-{dense,list}.png` |
| screenshot: 空結果 | `outputs/phase-11/screenshots/members-empty.png` |
| screenshot: 大量ヒット paginated | `outputs/phase-11/screenshots/members-large-hit.png` |
| curl: 全 6 param 組合せ | `outputs/phase-11/curl-logs/*.log` |
| a11y: axe レポート | `outputs/phase-11/a11y/members-axe.json` |

## 自走禁止操作

このタスクの Phase 1〜3 では以下を実行しない:

- アプリケーションコード（`apps/api/src/` / `apps/web/app/`）の実改変
- `pnpm dev` / `pnpm build` 以外の deploy（`scripts/cf.sh deploy ...`）
- `git commit` / `git push` / PR 作成
- D1 production / staging への migration apply
- secret 追加 / Cloudflare binding 変更

これらは Phase 5（実装ランブック）/ Phase 11（手動 smoke）/ Phase 13（PR 作成）のゲート以降。

## 完了条件チェックリスト

- [x] 6 種 query parameter の意味・既定値・許容値・不正値挙動が表で定義されている
- [x] AC が parameter 単位で書かれ、不変条件 #4 / #5 / #6 が AC として明文化されている
- [x] 空結果 / 不正値 / 大量ヒット / a11y が AC に含まれている
- [x] evidence path（screenshot / curl / a11y）が対応付けられている
- [x] 自走禁止操作が明記されている
- [x] 既存実装ファイルの実パスを根拠として確認済み

## 次 Phase への引き渡し

Phase 2 へ以下を渡す:

- 6 query parameter の AC（AC-Q* / AC-Z* / AC-S* / AC-T* / AC-O* / AC-D* / AC-E1 / AC-V1 / AC-L1 / AC-A1/A2 / AC-INV4/5/6）
- 既存実装ファイル一覧（apps/api / apps/web 両側）
- evidence path 対応表
- 自走禁止操作の境界
