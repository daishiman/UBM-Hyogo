**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 10: 最終レビュー

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Phase 11（VISUAL capture）へ進めてよいかを判定する。

## 10.1 受け入れ基準達成判定マトリクス

### Task A — 404 修正（proxy transport 統一）

| # | 受け入れ基準 | 判定方法 | blocker か |
| --- | --- | --- | --- |
| AC-A1 | `route.ts` が `API_SERVICE` 存在時に `binding.fetch` でリクエストを転送する | vitest TC-A-binding（binding 注入で `binding.fetch` 呼び出し + upstream status 中継）+ コードレビュー | **Yes（404 根本修正の中核）** |
| AC-A2 | binding 不在時のみ `INTERNAL_API_BASE_URL` HTTP fetch に fallback。両方無ければ 500（`internal_api_base_url_missing`） | vitest TC-A-http / TC-A-missing | **Yes** |
| AC-A3 | admin gate（403）・`needsSyncAdminBearer`・cookie/authorization/content-type 中継・GET/POST/PATCH/DELETE 振り分け・body 中継が不変 | vitest 既存ケース回帰 + コードレビュー（中継ブロック未変更） | Yes（回帰） |
| AC-A4 | staging で `POST /api/admin/meetings`（cookie 付き・有効 body）が 201 を返し開催日が一覧に追加される | **staging 実測（DoD・Phase 11）** | **Yes（DoD・本タスク主目的）** |
| AC-A5 | 他 admin client mutation（tags resolve / member status / requests resolve）が回帰しない | staging 実測 + 同 proxy 経路のため transport 統一で同時回復を確認 | Yes（回帰） |

### Task B — 出席管理 UI/UX 改善

| # | 受け入れ基準 | 判定方法 | blocker か |
| --- | --- | --- | --- |
| AC-B1 | 出席者一覧が `candidates` から解決した**氏名**で表示され、解決不能時のみ memberId を表示 | vitest TC-B1 / TC-B1-fallback + Phase 11 capture | Yes |
| AC-B2 | 開催日カード見出しに出席人数バッジ（「N 名出席」/ 0 名時「出席 未登録」）が表示される | vitest TC-B2 / TC-B2-zero + capture | Yes |
| AC-B3 | カード展開操作が「出席を記録/編集する」導線として識別できる（aria-label / 可視ラベル） | vitest TC-B3（aria-label assert）+ capture | Yes |
| AC-B4 | 開催日 1 件以上時に「各回を展開して出席を記録できる」運用導線テキストが表示される | vitest TC-B4 + capture | Yes |
| AC-B5 | OKLch トークン正本 / FormField・primitive 経由を維持。新規 primitive を増やさない | Phase 9 ゲート 5/6 + コードレビュー | Yes（不変条件） |

> blocker（Yes）が 1 件でも未達なら Phase 11（VISUAL capture）に進まない。AC-A4/A5 は staging 実測が DoD（§10.5）。

---

## 10.2 partial fix 検出（producer / consumer 整合）

| 検出ポイント | 確認内容 | partial fix の兆候 |
| --- | --- | --- |
| transport producer | `getAuthEnv().API_SERVICE` を取得する helper が追加されている | helper だけ追加し `proxy` が依然 `fetch(target)` 直呼び = binding 未配線 |
| transport consumer | `proxy` 末尾が「binding あれば `binding.fetch`、無ければ HTTP」に分岐済み | HTTP 経路のまま = 404 未修正（見かけ green でも staging で再現） |
| バッジ producer | `MeetingsClientShell` が `attended` state 由来のカウントを算出 | `MeetingItem.attendance` 由来で stale（出席追加後にバッジが更新されない） |
| バッジ consumer | `MeetingTimeline` が prop の最新カウントを描画 | prop 未配線で常に 0 表示 |
| 氏名 consumer | 出席者行が `nameOf.get(mid) ?? mid` を描画 | Map は作ったが `<span>{mid}</span>` のまま = 氏名未反映 |

> レビュー時は「helper / state を追加したか」でなく「**binding.fetch まで通ったか / バッジが最新人数を描画したか**」を必ず確認する。

---

## 10.3 transport 統一による回帰の確認（最重要・単一経路リスク）

proxy は全 admin API の単一経路のため、transport 切替は全 mutation を巻き込む（Phase 3.2 強化ループリスク）。

| 確認 | 結果 |
| --- | --- |
| binding 不在 local dev で HTTP fallback が効く（AC-A2） | `getAuthEnv().API_SERVICE` undefined 時に既存 HTTP 経路 = local 回帰なし |
| admin gate（403）/ sync bearer 付与が不変（AC-A3） | `requireAdmin` / `needsSyncAdminBearer` ブロック未変更 |
| tags resolve / member status / requests resolve が同時回復 | 同 proxy 経路を共有。staging 実測で確認（AC-A5） |
| GET（server-fetch 経路）は元から binding で成功・変更なし | `page.tsx` / `server-fetch.ts` 不変。GET 退行なし |

---

## 10.4 不変条件・スコープ最終確認

| 確認 | 結果 |
| --- | --- |
| 編集対象は apps/web の 4 product file + 対応 spec のみ | 範囲逸脱なし |
| `apps/api/**` / D1 migrations / Google Form schema 未変更（#1） | 維持（`git diff --name-only` で apps/api 0 件確認） |
| `api.ts` attendance パス / `server-fetch.ts` / `env.ts` 未変更 | 維持 |
| `useAdminMutation`（features hook 経由）/ FormField・primitive 維持（#9 / #10） | 維持 |
| `/admin/dashboard/attendance`（read 分析）/ `/admin/members` 未変更（IA 分離） | 維持 |

---

## 10.5 staging 実測が DoD であること（明示）

本タスクの主目的（404 解消）は staging 実機でのみ最終確認できる。AC-A4 / AC-A5 は **staging 実測が DoD**。

| 実測項目 | 期待 |
| --- | --- |
| staging `/admin/meetings` で開催日を追加 | `POST /api/admin/meetings` 201、開催日が一覧に追加（「0 件」が解消） |
| 追加した開催日を展開し出席を記録 | 出席追加 201、出席者が**氏名**で表示、バッジが「N 名出席」へ更新 |
| 他 admin mutation（tags resolve / member status / requests resolve）の 1 つ以上 | 404 を出さず正常応答（同 proxy 回復の確認・AC-A5） |

> 万一 binding 統一後も staging で 404 が出る場合は、proxy 以外の要因（api 未デプロイ / `INTERNAL_API_BASE_URL` 誤設定）を index スコープ外注記に従い別途確認する。

---

## 10.6 MINOR 指摘と未タスク化（unassigned-task-guidelines 準拠）

blocker ではない MINOR 指摘は Phase 12 の未タスク（unassigned-task）化対象として記録する。

| 候補 | 区分 | 根拠 | 扱い |
| --- | --- | --- | --- |
| 出席 CSV import の UI 化 | MINOR / followup | 既存 `POST /admin/meetings/:id/attendance/import` は実装済だが本タスクの 404/UX 課題に不要（index スコープ外注記済み） | 未タスク候補（Phase 12 detection で formalize 判定）。本サイクルでは実装しない |
| route transport 選択ロジックの `server-fetch.ts` との共通 util 化 | MINOR / refactor | 現状は YAGNI で意図的に見送り（Phase 8.3）。transport 利用が 3 箇所目に増えた場合のみ再検討 | 未タスク候補（優先度低・現時点では over-abstraction） |
| 出席人数バッジの色強調（多数出席時のハイライト等）視覚演出 | MINOR / enhancement | 機能要件は人数表示で充足。視覚演出は token 追加を伴うため別関心 | 未タスク候補（優先度低） |

> 上記は blocker ではないため Phase 11 進行を阻害しない。Phase 12 の unassigned-task-detection で formalize 要否を判定する。

---

## 10.7 最終レビュー判定

**GATE: PASS 条件** — AC-A1〜A5 / AC-B1〜B5 が全て green、§10.2 の partial fix（binding 未配線 / バッジ stale / 氏名未反映）が検出されず、§10.3 の admin mutation 回帰なし、§10.4 のスコープ逸脱なしが確認されること。AC-A4/A5 は §10.5 の staging 実測を DoD とする。MINOR（CSV import / transport 共通化 / バッジ色強調）は未タスク候補として Phase 12 へ送る。条件を満たせば VISUAL capture（Phase 11）へ進行可。
