---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 3
name: 設計レビュー
status: completed
decision: PROCEED_TO_PHASE_4
updated: 2026-06-09
---

# Phase 3 — 設計レビュー（member-data-source-precedence-and-profile-session-fix）

> 判定: **Phase 4（テスト作成）へ進む（PROCEED）**。
> 一次結論として 4 条件評価を先に示し、続いて因果・境界・残論点を補足する。

---

## 0. 真の論点（1 文固定）

> 「Google Form / スプレッドシートの会員情報が公開・会員・マイページに正しく反映されず（取込が構造的に壊れている）、かつ確定編集の上書き事故を防ぐ仕組み（3 層プレシデンス）が存在しないこと。あわせて /profile のセッションエラーが UX を塞いでいること」。

混在していた複数案件の切り分け:
- (a) 取込が動かない（RC-1/RC-2・Lane B）— **構造バグ**（存在しない列への INSERT）。
- (b) 上書き事故防止（3 層プレシデンス・Lane A/C）— **新機能**（override + import-once）。
- (c) /profile セッションエラー（RC-3・Lane E）— **独立バグ**（A と非依存）。

→ 1 ワークフロー内で扱うが Lane で責務分離（単一責務）。

---

## 1. 4 条件評価（一次結論）

| 条件 | 判定 | 根拠 |
|------|------|------|
| **価値性** | ✅ 高 | 取込が現在 SQL レベルで全失敗（Phase 1 §5.3）＝公開一覧に会員が出ない致命。Lane B で直すと「会員が表示される」という基盤価値が回復。Lane A/C の override は「管理者が表示を確定でき、再同期で消えない」運用価値。Lane E は会員のマイページ閉塞を解消。誰の（会員/管理者/閲覧者）どのコスト（表示されない/編集が消える/ページが開けない）を下げるか明確。 |
| **実現性** | ✅ 適 | 全 Lane が既存 repository 関数（`createMemberWithStatus`/`upsertResponse`/`upsertKnownField`/`setConsentSnapshot`）と既存 primitive（`FormField`/`useAdminMutation`/`SectionError`）の再利用で実装可能。新規は migration 1・repository 1・純関数 1・route 1・web component 1 に収まり、1 サイクル内の厚み。新規 D1 機構（別 provenance テーブル等）を作らず列追加で済ませる判断で実装コストを抑制。 |
| **整合性** | ✅ 閉じている | 状態所有権（L1=admin-managed override / L2,L3=response 系 / projection=純関数 state 無し）が矛盾なく分離（Phase 2 §0）。表示プレシデンスが「override 有れば override・無ければ current response」の 2 値マージに帰着し、3 経路（list/detail/builder）が同一純関数を呼ぶ。CLAUDE.md 不変条件 #1/#4/#5/#7 と整合（§2）。 |
| **運用性** | ✅ 破綻なし | import-once は `member_identities` 既存性 + provenance 列で冪等。再同期で override 消えない（DEC-4）。public read endpoint 外形契約不変（AC-6）で既存 consumer 非破壊。test は `*.spec.ts` で focused、migration apply は user-gated。監査は override 書込を audit_log に残す。 |

→ **4 条件すべて充足。Phase 4 へ進む。**

---

## 2. 依存関係・責務境界の問題点

| 観点 | 評価 |
|------|------|
| 責務境界 | Lane A（model）→ B/C-1/E（並列）→ C-2 → D（締め）で循環なし。projection 純関数を 1 箇所に集約し、list/detail/builder の 3 経路から呼ぶ＝ロジック重複なし。 |
| 状態所有権 | override 書込は `PUT /admin/member-fields` のみ（単一 writer）。sync は override を touch しない（読みもしない）。projection は state を持たない純関数。混在なし。 |
| 意思決定権 | verify fail 後の判断は validation lane（直列締め）。Sheets seed/Form 再回答の取込判断は ingestion 側（B）に閉じる。表示解決判断は projection（C）に閉じる。 |
| 強化ループ | 「override 編集 → 表示確定 → 再同期で消えない → 管理者が安心して編集」= 正のループ。 |
| バランスループ | 「Sheets seed import-once → 既存 member を上書きしない → seed の暴走を抑制」= 負のフィードバックで安定。 |

問題点なし。

---

## 3. 価値とコストの不均衡

| 項目 | 価値 | コスト | 判定 |
|------|------|--------|------|
| Lane B（取込修正）| 致命バグ解消（最大価値）| 中（書込モデル合流のリファクタ）| 価値 >> コスト。最優先。 |
| Lane A/C（override）| 運用価値（中〜高）| 中（migration + route + UI）| 均衡。1 サイクル内で回収。 |
| Lane E（session fix）| UX 閉塞解消（中）| 低（分岐 + config）| 価値 > コスト。 |
| 別 provenance テーブル | 低（冗長）| 高（join/整合）| **不採用**（列追加で代替）。 |
| alias テーブル駆動の汎用 label 解決 | 将来価値 | 高 | **本タスク非導入**（実ラベル直接是正 + 既存 schema_diff_queue 範囲・YAGNI）。将来 UI 統合候補として Phase 12 未タスク化判断に委ねる。 |

高コスト項目（汎用 alias 機構・provenance 別テーブル）を初期スコープから外し、初期価値（取込回復 + override + session fix）に集中。

---

## 4. CLAUDE.md 不変条件整合確認（#1 / #4 / #5 / #7）

| # | 条件 | 整合 | 確認 |
|---|------|------|------|
| **#1** | 実フォーム schema をコードに固定しすぎない | ✅ | ラベルマップは実ラベル準拠で是正。汎用 alias 新機構は作らず既存 `schema_diff_queue`/alias 範囲に留める。将来のラベル変更耐性は Phase 12 未タスク候補として記録。 |
| **#4** | admin-managed data 分離 | ✅ | L1 override は Form schema 外の独立テーブル `member_field_overrides`（admin-managed）に隔離。`member_status` 同様の admin-managed 系列。 |
| **#5** | D1 直接アクセスは apps/api に閉じる | ✅ | override read/write はすべて `apps/api` repository。web は `PUT /admin/member-fields`（admin client）+ `fetchAuthed`/`safeServerFetch` 経由のみ。新規 D1 binding を web に追加しない（AC-8）。 |
| **#7** | MVP は Form 再回答を本人更新の正式経路 | ✅ | L2 = Form 再回答を維持（DEC-3）。既存 identity への再回答は従来通り snapshot 更新・current_response 切替。import-once は Sheets（L3）側のみに適用し Form は毎回反映（本人更新経路の保全）。 |

衝突なし。

---

## 5. 残論点と決定

| ID | 論点 | 決定 |
|----|------|------|
| R-1 | 会員未登録ユーザー（管理者等）の /profile 体験を 401→/login 維持か、専用案内に倒すか | **決定**: `/me` の外形契約（MeSessionResponse shape）を変えない最小変更を優先。401→/login を維持しつつ login 画面に「会員登録がまだの方へ」案内を出す（Lane E §5.2 最終決定）。`MEMBER_SESSION_404` 分岐は将来の `/me` 404 化に備えた防御コードとして用意。 |
| R-2 | Sheets seed の `formId`/`revisionId`/`schemaHash` をどう埋めるか（Form と異なる出自）| **決定**: 固定値 `SHEETS_SEED_FORM_ID`（実 formId）/ `revisionId="sheets-seed"` / `schemaHash="sheets-seed"` を seed 専用定数で埋める。schema_versions 連携は不要（seed は表示のための snapshot のみ）。 |
| R-3 | zone/status の enum 値正規化を本タスクで持つか別タスクか | **決定**: `response_fields.value_json` が enum 値であることが AC-1 達成条件のため、Sheets/Form 取込時に zone/status の正規化マップ（Phase 2 §2.3）を本タスクで持つ。`members-search-filter-ux-and-api-fix` と重複し得るが、本タスクは「取込が成立すること」を満たす最小範囲で実装し、検索 UI 側の整形は当該タスクに委ねる。 |
| R-4 | transport 未解決（staging binding）の真因特定タイミング | **決定**: Lane E phase-1（実機ログ）は Gate-B（実装レビュー）時に user-gated で実施。設計は (A) DB 例外→500、(B) transport→FAILED の両方を web で fail-safe に分岐させ、binding 設定は config（user-gated）で解消。コード設計はどちらの真因でも UX が壊れないよう完結。 |
| R-5 | override の value バリデーション厳格度 | **決定**: route は文字列 or null のみ受理（最小）。enum 系 stableKey の妥当性は UI の select で担保。過剰な zod 型別バリデーションは YAGNI（Phase 2 §4.1）。 |

未解決でブロックする論点なし。

---

## 6. 補足: 因果ループ / KJ クラスタ / 戦略仮説

### 因果ループ
- 強化 R: `override 編集 → 表示確定 → 再同期耐性 → 編集の信頼 → さらに編集` ＝ admin が表示を統制できる正のループ。
- バランス B: `Sheets 行追加 → import-once 判定 → 既存 member 不変 → seed 暴走抑制` ＝ 安定化ループ。

### KJ クラスタ（変更の塊）
1. 取込回復（Lane B + mapper）= 「会員が表示される」基盤。
2. 上書き防止（Lane A + C）= 「編集が消えない」運用。
3. 閉塞解消（Lane E）= 「マイページが開く」UX。

### 戦略仮説
- why now: staging で「会員が一覧に出ない」「/profile が開けない」が同時顕在化し、両方ともデータソース起点。1 ワークフローで根治するのが最小コスト。
- why this way: 既存 Form 経路の書込モデルが正しく動いている（`processResponse`）ため、Sheets 経路をそこへ合流させるのが最短。projection 純関数 1 つで 3 経路の override 適用を統一するのが整合最大。

---

## 7. Phase 4 への申し送り

- targeted vitest リスト（Phase 1 §8）に沿って RED→GREEN。
- projection 純関数 `field-precedence.ts` は branch 100%（override 有/無 × response 有/無 × null クリア × override-only key）。
- Sheets seed の `seedMemberFromSheetRow` は「既存 identity ありで skip / 無しで identity+response+fields+consent+provenance を書く」を contract test で検証。
- `PUT /admin/member-fields/:memberId` は 404（identity 無）/ 200（upsert）/ value=null クリア / audit append を contract test で検証。
- Lane E は session-guard の DB 例外分類（500 維持）と web 分岐（404/FAILED/default）を spec test で検証。
- migration apply・staging 実機ログ・PR は user-gated（Gate-B/C）。
