---
workflow_id: member-data-source-precedence-and-profile-session-fix
doc: _shared-context (SSOT)
updated: 2026-06-09
---

# _shared-context — 単一の正本（SSOT）

このファイルは本ワークフローの全 SubAgent / 後続実装者が最初に読む唯一の正本である。
ここに矛盾する記述が phase-*.md にあれば本ファイルを優先する。

---

## 0. タスクの目的（1文）

Google Form / その回答スプレッドシートに入っている会員情報を、本システムの公開一覧 (`/members`)・
公開詳細 (`/members/[id]`)・マイページ (`/profile`) に**正しく反映**し、かつ「初回 seed = スプレッドシート、
本人更新 = Form 再回答、確定編集 = 本システム」の **3層プレシデンス**で上書き事故を防ぐ。
あわせて、現在 staging で発生している `/profile` の「セッション情報を取得できませんでした」エラーを修正する。

---

## 1. ユーザー確定事項（AskUserQuestion 回答・変更不可）

| ID | 決定 | 根拠 |
|----|------|------|
| **DEC-1** | 本タスクは **実装仕様書（コード実装あり）** として作成する。本プロンプト内でコードは実装しないが、後続実装者が迷わない粒度で書く。 | ユーザー Q1 回答 |
| **DEC-2** | `/profile` セッションエラー修正も **実装仕様書**として本ワークフローに含める（Lane E）。 | ユーザー Q1 回答 |
| **DEC-3** | 更新ポリシーは **3層プレシデンス**を採用する（下記 §2）。CLAUDE.md 不変条件 #7 は本タスクで「L2 = Form 再回答」として包含・整合させる。 | ユーザー Q2 回答（折衷確定） |
| **DEC-4** | L1（システム編集）と L2（Form 再回答）が同一フィールドで衝突した場合、**システム編集を粘着維持**する（Form 再回答では override を解除しない）。 | ユーザー Q2 回答 |

---

## 2. 3層プレシデンスモデル（表示時に上位が勝つ）

各会員プロフィールフィールド（stableKey 単位）の**表示値**は以下の優先順で解決する。

| 層 | ソース | 格納先 | 上書き挙動 | 不変条件対応 |
|----|--------|--------|-----------|--------------|
| **L1（最優先）** | 本システム内編集（admin-managed override） | 新規テーブル `member_field_overrides` | 再同期（L2/L3）で**絶対に上書きされない**。DEC-4 により Form 再回答でも解除しない。 | CLAUDE.md #4「admin-managed data 分離」に合致 |
| **L2（中）** | Google Form 本人再回答 | 既存 `member_responses` / `response_fields`（`current_response_id` 経由） | 本人更新の正式経路。L1 override 済みフィールドは**表示で勝てない**が、L2 の snapshot 自体は通常通り更新される。 | CLAUDE.md #7（Form 再回答=本人更新経路）を維持 |
| **L3（最低）** | スプレッドシート初回 seed | 既存 `member_responses` / `response_fields`（seed として書く） | **import-once**: 対象 member が D1 未登録のときだけ取り込む。一度取り込んだら後続のスプレッドシート変更で**上書きしない**。 | ユーザー要望「一時情報・一度読んだら無視・未取込なら今の値を取得」 |

### 解決規則（純関数で実装）
```
表示値(stableKey) =
  member_field_overrides[stableKey] があれば その値           // L1
  なければ response_fields[current_response_id][stableKey]    // L2/L3（同じ列に格納）
```
- L2 と L3 は**同じ格納先（member_responses / response_fields）**を共有する。区別は「初回 seed か Form 由来か」という provenance であって、表示解決上は同列。
- L3 の import-once は「**書き込み側（sync）**」で担保する（既存 member には seed を書かない）。表示解決規則は L1 override の有無だけを見る。
- したがって表示プレシデンスの本体は「**L1 override があれば override、なければ current response の値**」というシンプルな 2 値マージに帰着する。L2/L3 の差は ingestion 側の責務。

---

## 3. 重大な実測根拠（Phase 1 検証で再確認すること）

### 3-1. 実スプレッドシートのヘッダー（Google Drive MCP で実取得・2026-06-09）
スプレッドシート `10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw`「フォームの回答 1」の実ヘッダー（33列）:

```
タイムスタンプ, メールアドレス, お名前（フルネーム）, あだ名・ニックネーム,
お住まい（都道府県・市区町村）, 生年月日, 職業・仕事内容, 出身地, UBM区画,
UBM参加ステータス, UBMに入会・参加した時期, ビジネス概要, 得意分野・スキル,
現在の課題・相談したいこと, 提供できること・協力できること, 趣味・好きなこと,
最近ハマっていること, 座右の銘・大切にしている言葉, 仕事以外の活動, ホームページ URL,
Facebook URL, Instagram URL, Threads URL, YouTube URL, TikTok URL, X（Twitter）URL,
ブログ URL, note URL, LinkedIn URL, その他のSNS・URL, 自己紹介・一言メッセージ,
ホームページへの掲載に同意しますか？, 勧誘ルール・免責事項への同意
```
実データ行の代表値: `UBM区画 = "0→1"`, `UBM参加ステータス = "会員"`,
`ホームページへの掲載に同意しますか？ = "同意する（掲載OK）"`, `勧誘ルール・免責事項への同意 = "同意する"`。

### 3-2. 🔴 根本原因 RC-1: Sheets 経路の `DB_FIELD_MAP` がヘッダーと不一致
`apps/api/src/jobs/mappers/sheets-to-members.ts` の `DB_FIELD_MAP`（L45-79）は、実ヘッダーと**ほぼ全項目で不一致**:

| 実ヘッダー | DB_FIELD_MAP の key | 一致 |
|-----------|---------------------|------|
| お名前（フルネーム） | 氏名 | ✗ |
| あだ名・ニックネーム | ニックネーム | ✗ |
| お住まい（都道府県・市区町村） | 所在地 | ✗ |
| 職業・仕事内容 | 職業 | ✗ |
| UBM区画 | UBMゾーン | ✗ |
| UBM参加ステータス | UBM会員種別 | ✗ |
| UBMに入会・参加した時期 | UBM入会日 | ✗ |
| ビジネス概要 | 事業概要 | ✗ |
| 得意分野・スキル | 強み・スキル | ✗ |
| 現在の課題・相談したいこと | 課題 | ✗ |
| 提供できること・協力できること | 提供できること | ✗ |
| 趣味・好きなこと | 趣味 | ✗ |
| 最近ハマっていること | 最近の関心 | ✗ |
| 座右の銘・大切にしている言葉 | 座右の銘 | ✗ |
| 仕事以外の活動 | その他の活動 | ✗ |
| ホームページ URL | Webサイト | ✗ |
| Facebook URL | Facebook | ✗ |
| X（Twitter）URL | X | ✗ |
| ブログ URL | ブログ | ✗ |
| note URL | note | ✗ |
| その他のSNS・URL | その他URL | ✗ |
| 自己紹介・一言メッセージ | 自己紹介 | ✗ |
| ホームページへの掲載に同意しますか？ | 公開同意 | ✗ |
| 勧誘ルール・免責事項への同意 | 規約同意 | ✗ |
| 生年月日 / 出身地 / メールアドレス / タイムスタンプ | （同名） | ✓ |

→ Sheets 同期はほぼ何もマップできず `extra_fields_json`/`unmapped` に落ちる。**RC-1 を修正しないとスプレッドシート seed は機能しない。**

### 3-3. 🔴 根本原因 RC-2: 同意値マッピングが実値を拾えない
`CONSENT_MAP`（sheets-to-members.ts L81-90）は `"同意する"` を持つが、実値 `"同意する（掲載OK）"` を持たない
→ `public_consent = unknown` 化 → `publish_state` が public にならず**公開一覧に出ない**。
（`勧誘ルール・免責事項への同意 = "同意する"` は拾える）。

### 3-4. Form 経路（`sync-forms-responses.ts`）の label→stableKey
Form 経路は Sheets と別系統で、`packages/integrations-google` の `mapFormSchema` が返す
label→stableKey マップ（`forms-schema-sync.ts:45-59 buildLabelToStableKey`）を使う。
**Phase 1 で `mapFormSchema` の label マップが §3-1 の実ラベルと一致するかを必ず実測検証する**こと
（一致しなければ Form 経路も slug fallback → `__unknown__` 化する。Lane B で同様に是正）。

### 3-5. 🔴 根本原因 RC-3: `/profile` セッションエラー
- 画面表示: `apps/web/app/(member)/profile/page.tsx:66-74` の**汎用エラー分岐**（`title="セッション情報を取得できませんでした" / detail="時間をおいて再読み込みしてください。" / retryHref="/profile"`）。
- 発火条件: `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` が **`MEMBER_SESSION_404` 以外**の失敗を返したとき（404 は再ログイン分岐、401 は AuthRequiredError → redirect)。
- すなわち `/me` が **401 でも 404 でもない**（500 / transport 失敗 / その他）を返している。ログインバナーには管理者が出ているのでセッション cookie 自体は存在する。
- 仮説（Phase 1 で staging 実機/ログインで切り分け）:
  - H-1: 管理者セッション JWT に `memberId` claim が無く、`/me` 側で member lookup が 500 を返す（resolver は memberId 必須・`me-session-resolver.ts:67`）。本来 401/404 に倒すべきところが 500 化している可能性。
  - H-2: `resolveApiFetch` の transport 解決失敗（`transport.ts:40` throw）→ `MEMBER_SESSION_FAILED`。staging で `API_SERVICE` binding も `INTERNAL_API_BASE_URL` も解決できないケース。
  - H-3: `/me` route 内の例外（`apps/api/src/routes/me/index.ts`）。
- 是正方針（Lane E）: (a) `/me` のエラー応答を 401/404 に正しく倒す（member 未登録 = 404、未認証 = 401）、(b) web 側 `page.tsx` のエラー分岐をユーザー実態に合わせる（管理者など member レコードを持たないユーザーには「会員専用ページ」案内＋公開サイト導線を出す等。詳細は Lane E phase-1/2 で確定）。**Phase 1 で実機切り分け必須。**

---

## 4. 現状アーキテクチャ事実（Explore 監査・root cause 確定済）

- 同期は 2 系統:
  - **Sheets→D1**: `apps/api/src/jobs/sync-sheets-to-d1.ts`（手動トリガ）→ `member_responses` を**無条件フル upsert**。`mappers/sheets-to-members.ts` で map。
  - **Form回答→D1**: `apps/api/src/jobs/sync-forms-responses.ts`（手動 + scheduled cron）→ `member_identities`/`member_responses`/`response_fields`/`member_status`/tag queue。`current_response_id` を最新回答へ切替（`decideShouldUpdate`）。
  - **両系統とも import-once 不在**（既存レコードを毎回上書き）。
- データモデル（`apps/api/migrations/0001_init.sql`, `0002_admin_managed.sql`）:
  - `member_identities(member_id PK, response_email UNIQUE, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)`
  - `member_responses(response_id PK, ..., answers_json, extra_fields_json, unmapped_question_ids_json, ...)`
  - `response_fields(response_id, stable_key, value_json, raw_value_json, PK(response_id, stable_key))`
  - `member_status(member_id PK, public_consent, rules_consent, publish_state, is_deleted, updated_by, ...)` ← admin-managed
  - **「初回取込日 / 最終更新元(source) / フィールド編集ロック」を表す列は存在しない** → Lane A で新設。
- admin 編集経路（`routes/admin/members.ts`, `repository/status.ts`）は **`member_status` のみ**を触る。氏名・職業等の**プロフィール本文を編集する経路は現状ない** → Lane C/D で新設。
- 表示が読む経路:
  - 公開一覧: `routes/public/members.ts` → `use-cases/public/list-public-members.ts`（`response_fields` の SUMMARY_KEYS + tags + photo）。
  - 公開詳細: `routes/public/member-profile.ts` → `use-cases/public/get-public-member-profile.ts`（`response_fields` 全 stableKey + schema_questions + tags + attendance）。
  - マイページ: `apps/web/app/(member)/profile/page.tsx` → `fetchAuthed("/me")` + `fetchAuthed("/me/profile")`（`apps/api/src/routes/me/`）。

---

## 5. 不変条件（本ワークフローで厳守）

1. **D1 直接アクセスは `apps/api` に閉じる**（`apps/web` から D1 binding 禁止）。CLAUDE.md #5。
2. **既存 endpoint surface を尊重**しつつ、本タスクでは admin override 用の新規 endpoint 追加は許容（UI prototype alignment の制約とは別タスク。ただし public read endpoint の契約は変えず、projection を内部で変える）。
3. **consent キーは `publicConsent` / `rulesConsent`**。`responseEmail` は system field。CLAUDE.md #2,#3。
4. **admin-managed data 分離**: L1 override は Form schema 外の admin-managed テーブル（`member_field_overrides`）に隔離。CLAUDE.md #4。
5. **OKLch トークン正本**: 色は `apps/web/src/styles/tokens.css` / `design-tokens.md`。HEX 直書き禁止（Lane D）。
6. **新規 test は `*.spec.{ts,tsx}` のみ**（`*.test.*` 禁止）。CLAUDE.md #8。
7. **admin form input は `FormField` 経由**、admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（Lane D）。CLAUDE.md #9,#10。
8. **実フォーム schema をコードに固定しすぎない**（CLAUDE.md #1）。ラベルマップ是正は「実ラベルに合わせる」だけでなく、可能なら questionId / 別名(alias)テーブル駆動に寄せ、将来のラベル変更に強くする方針を Phase 2 で検討。

---

## 6. 実装区分

`[実装区分: 実装仕様書]` — 全 Lane がコード変更を伴う。docs-only ではない。

---

## 7. Lane 分解（単一責務・1 実装サイクル内で完了）

> CONST_007: 全 Lane は後続「03.実装.md」の **1 サイクル内で完了**できるスコープ。先送り・別PR・将来タスク化はしない。
> 並列は実装時 3 lane まで。依存があるものは直列に締める。

| Lane | 責務（単一） | 主な変更対象 | 依存 |
|------|-------------|-------------|------|
| **A: データモデル基盤** | L1 override テーブル + L3 import-once provenance 列の D1 migration と repository | `apps/api/migrations/00NN_member_field_overrides.sql`（新規）, `apps/api/src/repository/memberFieldOverrides.ts`（新規）, `repository/identities.ts`（provenance 列追加 helper） | なし（最初に直列で締める） |
| **B: 取込（ingestion）是正** | RC-1/RC-2 のラベル・同意マップ是正 + L3 import-once（既存 member には seed しない） + Form 経路 label マップ実測整合 | `mappers/sheets-to-members.ts`, `jobs/sync-sheets-to-d1.ts`, `jobs/sync-forms-responses.ts`, （必要なら）`packages/integrations-google` の label alias | A |
| **C: 表示プレシデンス + admin override 書込API** | L1 override をマージする純関数 projection を list/detail/profile use-case に適用 + admin 上書き endpoint | `use-cases/public/list-public-members.ts`, `use-cases/public/get-public-member-profile.ts`, `routes/me/*`, 新規 `routes/admin/member-fields.ts` + repository(A) | A（,一部 B と疎結合で並列可） |
| **D: Web UI** | admin 詳細でプロフィールフィールド編集（L1 書込・C2 経由）+ 公開一覧/詳細/マイページが merged projection を表示することの確認・整え | `apps/web/src/components/admin/*`, `apps/web/app/(admin)/admin/members/*`, 必要に応じ public 表示 | C |
| **E: /profile セッションエラー修正** | RC-3 の根因切り分け + `/me` のステータス正規化 + web エラー分岐是正 | `apps/api/src/routes/me/index.ts`, `apps/api/src/middleware/me-session-resolver.ts`, `apps/web/app/(member)/profile/page.tsx`, `apps/web/src/lib/fetch/*` | なし（A と並列可・独立） |

### 並列・直列の締め方（実装時の指針。本ワークフローの spec 作成も同構造）
1. **直列ゲート**: Lane A（データモデル）を最初に確定（後続が依存）。
2. **並列 wave-1**: Lane B, Lane C(の projection 純関数部分), Lane E を並列。
3. **直列締め**: Lane C(admin endpoint) → Lane D（UI）→ 統合検証。

---

## 8. Acceptance Criteria（受入条件・全 Lane 横断）

| AC | 内容 | 主担当 Lane |
|----|------|------------|
| **AC-1** | 実スプレッドシート（§3-1 の実ヘッダー）の全項目が正しい stableKey にマップされ、`response_fields` に格納される（unmapped 0、生年月日/出身地等の既存一致も維持）。 | B |
| **AC-2** | `"同意する（掲載OK）"` が `public_consent = consented` に正規化される。`"同意する"` 系の表記揺れ網羅。 | B |
| **AC-3** | スプレッドシート seed は **対象 member（response_email 単位）が D1 未登録のときだけ**取り込む。既存 member には seed で上書きしない（import-once）。provenance 列で取込済みを記録。 | A,B |
| **AC-4** | Form 再回答は従来通り snapshot を更新するが、L1 override 済みフィールドの**表示**は override を維持する（DEC-4）。 | A,C |
| **AC-5** | admin が本システムで会員プロフィールフィールドを編集すると `member_field_overrides` に保存され、一覧/詳細/マイページの表示で最優先される。再同期で消えない。 | A,C,D |
| **AC-6** | 公開一覧 `/members`・公開詳細 `/members/[id]`・マイページ `/profile` が、L1>L2/L3 のマージ済み projection を表示する。public read endpoint の**外形契約（レスポンス shape）は不変**。 | C,D |
| **AC-7** | `/profile` の「セッション情報を取得できませんでした」が解消する。member レコードを持たないユーザー（管理者等）には適切な分岐（401→ログイン / 会員未登録→案内）を出し、500 汎用エラーで詰まらない。 | E |
| **AC-8** | `apps/web` から D1 直接アクセスを追加しない。新規 read は既存 transport 経由。 | 全 |
| **AC-9** | 新規/変更コードは focused test（`*.spec.ts`）で RED→GREEN。`pnpm typecheck` / `pnpm lint` / 対象 vitest が緑。HEX 直書き 0。 | 全 |

---

## 9. テスト方針（共通）

- API: `cd apps/api && pnpm vitest run src/<対象>`（contract/unit）。repository は D1 in-memory or fixture。
- web: `cd apps/web && pnpm vitest run src/<対象> --root ../..`（vitest root が repo ルートのため `--root ../..` 必須・memory 既知）。
- 純関数 projection（C）は branch 100% を狙う（override 有/無・L3/L2・visibility）。
- migration: `bash scripts/cf.sh d1 migrations apply`（**ローカル/適用は user-gated**。spec では SQL と検証 SELECT を記述）。

## 10. ローカル検証コマンド（DoD 共通）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
cd apps/api && mise exec -- pnpm vitest run src/jobs src/repository src/use-cases/public src/routes/me src/routes/admin
cd apps/web && mise exec -- pnpm vitest run app/\(member\)/profile src/components/admin --root ../..
# design tokens (Lane D): HEX 直書き 0 を grep gate で確認
```

## 10b. 🔴 Phase 1 実コード検証で確定した訂正（SSOT 更新・2026-06-09）

設計ゲート（Phase 1-3）の実コード裏取りで、SSOT §3-§4 より深刻・または異なる事実が確定した。**以降の全 Lane はこの訂正を正本とする。**

- **CORR-1（RC-1 深層・最重要）**: `member_responses` テーブルには `full_name`/`ubm_zone` 等の**個別列が存在しない**（DDL は `answers_json`/`extra_fields_json` のみ・列追加 ALTER migration も無し・確認済 `0001_init.sql:49-65` / migrations grep 0件）。しかし `jobs/sync-sheets-to-d1.ts:215` の `UPSERT_COLUMNS` は `full_name`/`ubm_zone`/`url_x` 等の**存在しない列へ INSERT**しようとする → **Sheets 同期は SQL レベルで 1 行も書き込めず全失敗**。さらに Sheets 経路は表示が読む `response_fields` に**一切書かない**。
  → **Lane B はラベルマップ是正だけでは不足**。Sheets 経路を Form 経路（`sync-forms-responses.ts` の `processResponse`）と**同じ書込モデル**（`member_identities` ensure + `member_responses(answers_json)` + `response_fields`(stable_key 単位) + `member_status` consent）へ合流させる**構造修正**が必要。
- **CORR-2（RC-3 訂正）**: `me-session-resolver.ts` / `session-guard.ts` は member 不在で **401**（500 ではない・H-1 は誤り）。`GET /me` は DB lookup を持たず session 解決のみで 200。汎用エラーの真因は (A) sessionGuard 内 DB 例外による 500、または (B) staging の transport 未解決（`MEMBER_SESSION_FAILED`）に限定。
  → **Lane E は両真因に web 側 fail-safe 分岐で耐性**を持たせる（500/transport 失敗時も「会員専用ページ」案内＋公開導線 or 再ログイン導線を出し、汎用「時間をおいて」で詰まらせない）。Phase 1 で staging 実機切り分け（ログイン状態の `/me` レスポンス status 実測）を残課題として明記。
- **CORR-3（Form 経路も RC-1 該当・限定的）**: `packages/integrations/google/src/forms/mapper.ts` の `STABLE_KEY_BY_LABEL` のうち **`"X URL"`（実ヘッダー `"X（Twitter）URL"`）** と **`"その他の SNS・URL"`（実 `"その他のSNS・URL"`・全角スペース差）** の 2 ラベルが不一致 → `urlX`/`urlOthers` が slug fallback で unknown 化。残り 29 ラベルは一致。Lane B で 2 ラベルを実ヘッダーに合わせる。
- **CORR-4（パス訂正）**: integrations 実体は `packages/integrations/google/src/forms/mapper.ts`（SSOT の `packages/integrations-google` は誤記）。
- **CORR-5（値ドメイン正規化）**: `STABLE_KEY` は **camelCase**（`response_fields.stable_key` も camelCase・31 key）。enum 値（例 `ubmZone="0_to_1"`）と実スプレッドシート値（`"0→1"` / `"会員"`）が異なるため、**取込時に値ドメイン正規化**（`"0→1"`→`"0_to_1"` 等のマップ）が必要。Lane B のマッピング設計に含める（既存 memory `project_members_search_filter_ux_and_api_fix_spec` の真因とも整合）。
- **CORR-6（採番）**: 最新 migration = `0026_member_status_fk_constraint.sql` → 新規は **`0028_member_field_overrides.sql`**。
- **CORR-7（provenance 設計確定）**: import-once provenance は別テーブルではなく **`member_identities` に 2 列追加**（`seed_source TEXT` / `seed_imported_at TEXT`。identity と 1:1・最小コスト）。同 migration 0028 に同梱。
- **CORR-8（projection 純関数）**: `apps/api/src/use-cases/_shared/field-precedence.ts`（純関数 `resolveFieldValue` / `mergeFieldOverrides`）を 1 つ作り、list / detail / (me/profile) の 3 経路で共有する（ロジック重複排除・branch 100%）。

> 詳細な DDL・関数シグネチャ・契約は `phase-2-design.md` を正本とする。

## 11. 禁止事項

- コミット / PR / push / D1 への実適用 / staging deploy は**すべて user 明示承認後**。本ワークフローでは実施しない。
- `.env` の実値読み取り禁止。`wrangler` 直接呼び出し禁止（`scripts/cf.sh` 経由）。
