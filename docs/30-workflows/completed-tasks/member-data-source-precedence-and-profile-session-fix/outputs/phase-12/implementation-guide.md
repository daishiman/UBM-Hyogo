# 実装ガイド — 会員データソース3層プレシデンス反映 + /profile セッションエラー修正

> 本タスクは **implementation / VISUAL / implemented_local_runtime_pending**。以下のシグネチャ・契約は Phase 2 設計の正本（SSOT）からの引用であり、
> 識別子は逐語で一致させること。commit / PR / D1 適用 / deploy / 認証済み visual capture は user-gated。

## Part 1

> 中学生にもわかる説明。なぜ必要か → 何をするか。

### たとえ話: 会員名簿の「3 種類の書き込み」

学校のクラス名簿（= 会員情報）を想像してください。この名簿には、情報の出どころが **3 種類** あります。

1. **入学時にまとめて配られた名簿（= スプレッドシート初回 seed / L3）**: 最初に一括で書き写す情報。
   一度書き写したら、配られた紙が後で差し替わっても、もう書き直しません（**import-once** = 一度だけ取り込む）。
2. **本人が書いた更新届（= Google Form 再回答 / L2）**: 「引っ越したので住所を変えてください」と本人が出す正式な届け出。
   これは出すたびに反映します。
3. **先生が手で直した確定版（= 本システムでの管理者編集 / L1）**: 先生（管理者）が「ここはこう表示する」と
   名簿に赤ペンで上書きした確定情報。**一番えらい（最優先）** で、他のどの情報が来ても消えません。

名簿を見せるとき（= 公開一覧・詳細・マイページに表示するとき）のルールはシンプルです:

> **赤ペン（L1）があればそれを見せる。無ければ最新の届け出/初回名簿（L2/L3）を見せる。**

### なぜ今これが必要か: 名簿が壊れていた

調べたら、深刻な問題が見つかりました。

- **問題1（取込が壊れている）**: 「配られた名簿（スプレッドシート）」を書き写す機械（同期処理）が、
  **存在しないマス目に書き込もうとして毎回エラーで止まっていた**。つまり一人も名簿に載っていませんでした。
  さらに、表示が読むページ（`response_fields`）には**そもそも一文字も書いていなかった**。
- **問題2（同意がはじかれる）**: 「掲載してOKです」という本人の同意が、`"同意する（掲載OK）"` という
  実際の書き方を機械が知らず、「同意したか不明」扱いになって**公開されませんでした**。
- **問題3（マイページが開けない）**: 会員のマイページ（`/profile`）が「セッション情報を取得できませんでした」
  と出て**開けない**ことがありました。

### このタスクでやること

1. **取込を直す（Lane B）**: 機械が正しいマス目（実際の見出しに合った場所）に、表示ページが読む形で書けるようにする。
   「掲載OK」もちゃんと「同意した」と読む。
2. **3 種類の出どころを整理する（Lane A + C）**: 赤ペン（管理者の確定編集）専用の引き出し（新しいテーブル
   `member_field_overrides`）を作り、表示のときは「赤ペンがあれば赤ペン優先」のルールを 1 つの共通関数で守る。
   配られた名簿は一度だけ取り込む（import-once）。
3. **マイページを直す（Lane E）**: サーバーが「あなたは会員ではありません」「いま接続できません」を
   きちんと区別して返し、画面側も「会員専用ページです」など分かりやすい案内に倒す（**詰まらせない**）。

### 一番大事なルール

- **赤ペン（L1）は再同期で絶対に消えない**（本人が更新届を出しても、管理者の確定が勝つ = DEC-4）。
- **配られた名簿は一度だけ**（後から紙が差し替わっても上書きしない = import-once）。
- **本人の更新届は毎回反映**（ただし赤ペンがある項目は表示で勝てない）。

---

## Part 2

> 開発者レベル。型・契約・役割分担・エラーハンドリング・定数。識別子は Phase 2 設計から逐語引用。

### 背景（実測確定の根本原因）

- **CORR-1（RC-1 深層）**: `member_responses` DDL（`0001_init.sql`）は `answers_json`/`extra_fields_json` のみで
  `full_name`/`ubm_zone` 等の個別列が無い。`sync-sheets-to-d1.ts` の `UPSERT_COLUMNS` は存在しない列へ INSERT →
  全失敗。さらに表示が読む `response_fields` に一切書かない。→ Sheets 経路を Form 経路（`processResponse`）と
  **同じ書込モデルへ合流**させる構造修正が必須。
- **CORR-2（RC-3）**: `me-session-resolver.ts` / `session-guard.ts` は member 不在で **401**（500 ではない）。
  汎用エラーの真因は (A) sessionGuard 内 DB 例外 → 500、(B) staging transport 未解決 → `MEMBER_SESSION_FAILED`。
- **CORR-3**: Form 経路 mapper `STABLE_KEY_BY_LABEL` の `X URL` / `その他の SNS・URL` が実ヘッダー不一致。

### Lane A — データモデル基盤

#### migration `apps/api/migrations/0027_member_field_overrides.sql`（新規・CORR-6 採番）

```sql
CREATE TABLE IF NOT EXISTS member_field_overrides (
  member_id       TEXT NOT NULL,
  stable_key      TEXT NOT NULL,            -- camelCase（STABLE_KEY 値・例 "fullName"）
  value_json      TEXT,                     -- 表示用 effective 値（JSON.stringify 済・null 可 = 明示クリア）
  raw_value_json  TEXT,                     -- 任意: 入力原文（監査用・null 可）
  updated_by      TEXT NOT NULL,            -- admin email（actor）
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, stable_key)
);
CREATE INDEX IF NOT EXISTS idx_member_field_overrides_member ON member_field_overrides(member_id);
-- L3 import-once provenance（CORR-7: 別テーブルでなく identity へ 2 列追加）
ALTER TABLE member_identities ADD COLUMN seed_source      TEXT;   -- 'sheets' | 'forms' | NULL
ALTER TABLE member_identities ADD COLUMN seed_imported_at TEXT;   -- ISO8601 / NULL
```

> FK は張らない（既存 member_status 以外の admin-managed テーブルに合わせる・app 層で identity 存在を確認）。

#### repository `apps/api/src/repository/memberFieldOverrides.ts`（新規）

```ts
export interface MemberFieldOverrideRow {
  member_id: string; stable_key: string;
  value_json: string | null; raw_value_json: string | null;
  updated_by: string; updated_at: string;
}
export async function listOverridesByMemberId(c: DbCtx, memberId: MemberId): Promise<MemberFieldOverrideRow[]>;
export async function listOverridesByMemberIds(c: DbCtx, memberIds: readonly MemberId[]): Promise<MemberFieldOverrideRow[]>; // N+1 防止
export async function upsertOverride(c: DbCtx, input: { memberId: MemberId; stableKey: StableKey; valueJson: string | null; rawValueJson: string | null; updatedBy: string }): Promise<void>;
export async function deleteOverride(c: DbCtx, memberId: MemberId, stableKey: StableKey): Promise<void>;
```

#### repository `apps/api/src/repository/identities.ts`（編集・provenance helper）

```ts
export async function getSeedProvenance(c: DbCtx, memberId: MemberId): Promise<{ seedSource: string | null; seedImportedAt: string | null } | null>;
export async function markSeedImported(c: DbCtx, memberId: MemberId, source: "sheets" | "forms", importedAt: string): Promise<void>;
// SQL: UPDATE ... SET seed_source=?2, seed_imported_at=?3 WHERE member_id=?1 AND seed_source IS NULL（import-once 根拠）
```

### Lane B — 取込是正（ingestion）

- `mappers/sheets-to-members.ts`: `DB_FIELD_MAP` の key を実 33 ヘッダー（Phase 2 §2.3 の全文）へ是正・value は `STABLE_KEY.*`（camelCase）。
  `CONSENT_MAP` に `"同意する（掲載ok）"`（lowerCase 後）を追加。`UBM_ZONE_MAP`（`"0→1"→"0_to_1"` 等）/
  `UBM_MEMBERSHIP_MAP`（`"会員"→"member"` 等）で enum 正規化。出力を `MemberResponse` 互換 shape（`SheetSeedRow`）へ変更。
- `sync-sheets-to-d1.ts`: 存在しない列への INSERT（`UPSERT_COLUMNS`/`ROW_FIELD_ORDER`）を削除。`findIdentityByEmail` で
  既存なら **skip（import-once）**、未登録なら `seedMemberFromSheetRow`（Form 経路と同じ `createMemberWithStatus` /
  `upsertResponse` / `upsertKnownField` / `setConsentSnapshot` + `markSeedImported("sheets")` 再利用）で seed。
- `sync-forms-responses.ts`: 新規 identity 作成時のみ `markSeedImported("forms")`。既存への再回答は従来通り snapshot 更新
  （import-once でブロックしない＝本人更新の正式経路 L2）。
- `packages/integrations/google/src/forms/mapper.ts`: `"X URL"→"X（Twitter）URL"`、`"その他の SNS・URL"→"その他のSNS・URL"`（CORR-3）。

### Lane C — 表示プレシデンス純関数 + admin override 書込 API

#### `apps/api/src/use-cases/_shared/field-precedence.ts`（新規・純関数・CORR-8）

```ts
export type OverrideMap = ReadonlyMap<string, string | null>;
export type ResponseFieldMap = ReadonlyMap<string, string | null>;
// L1 > L2/L3 で 1 フィールドの表示値（JSON 文字列）を解決
export function resolveFieldValue(stableKey: string, overrides: OverrideMap, responseFields: ResponseFieldMap): string | null;
// response_fields 配列に override をマージ（null=明示クリア=結果から除外・override-only key も含む）
export function mergeFieldProjection(
  fields: ReadonlyArray<{ stableKey: string; valueJson: string | null }>, overrides: OverrideMap,
): Array<{ stableKey: string; valueJson: string | null; source: "override" | "response" }>;
export function toOverrideMap(rows: ReadonlyArray<{ stable_key: string; value_json: string | null }>): OverrideMap;
```

> branch 100%: override 有/無 × response 有/無 × null クリア × override-only key。3 経路
> （`list-public-members.ts` / `get-public-member-profile.ts` / `_shared/builder.ts`）が**同一純関数を呼ぶ**。

#### route `apps/api/src/routes/admin/member-fields.ts`（新規・`requireAdmin`）

```ts
// GET /admin/member-fields/:memberId
export const AdminMemberFieldsResponseZ = z.object({
  memberId: z.string().min(1),
  fields: z.array(z.object({
    stableKey: z.string().min(1), label: z.string(),
    overrideValue: z.unknown().nullable(),   // L1
    responseValue: z.unknown().nullable(),   // L2/L3
    effectiveValue: z.unknown().nullable(),  // resolveFieldValue 結果
    hasOverride: z.boolean(),
  })),
}).strict();

// PUT /admin/member-fields/:memberId
export const AdminMemberFieldsUpdateBodyZ = z.object({
  fields: z.array(z.object({
    stableKey: z.enum(STABLE_KEY_LIST as [string, ...string[]]), // 既知 31 key のみ
    value: z.union([z.string(), z.null()]),                       // null = override クリア
  })).min(1),
}).strict();
export const AdminMemberFieldsUpdateResponseZ = z.object({ memberId: z.string().min(1), updated: z.number().int().nonnegative() }).strict();
```

副作用: (1) identity 存在確認（無ければ **404**）/ (2) `upsertOverride`（value=null は value_json=null upsert・projection の「明示クリア=除外」と整合）/ (3) `auditLogProvider.append`（action `admin.member.field_override`・actor=admin email）/ (4) member_status は触らない。

### Lane E — /profile セッションエラー修正

- `apps/api/src/middleware/session-guard.ts`: DB lookup を try/catch で囲み、**例外を 500 で漏らさず分類**（fail-closed・既存 401 分岐維持）。真の internal error（D1 unavailable）のみ 500。
- `apps/api/src/routes/me/index.ts`: `GET /me` は session 通過時 200（DB lookup 無）を維持。404（PROFILE_UNAVAILABLE）と会員未登録を区別する応答整理。
- `apps/web/app/(member)/profile/page.tsx`: エラーコード分岐:

```ts
switch (meResult.error.code) {
  case "MEMBER_SESSION_404":    // 会員未登録 → 案内
    return <SectionError title="会員情報が見つかりませんでした" detail="会員登録が完了していない可能性があります。再ログインするか、登録をご確認ください。" actionHref="/login?redirect=/profile" actionLabel="再ログイン" />;
  case "MEMBER_SESSION_FAILED": // transport 未解決
    return <SectionError title="ただいま接続できません" detail="サーバーへの接続に問題が発生しています。時間をおいて再度お試しください。" retryHref="/profile" />;
  default:                      // 500 等
    return <SectionError title="セッション情報を取得できませんでした" detail="時間をおいて再読み込みしてください。" retryHref="/profile" />;
}
```

### 定数（seed 専用・R-2 決定）

| 定数 | 値 | 用途 |
|------|----|----|
| `SHEETS_SEED_FORM_ID` | 実 formId `119ec539...hp7Xg` | Sheets seed の `member_responses.form_id` |
| `revisionId` | `"sheets-seed"` | seed 由来の出自マーカー |
| `schemaHash` | `"sheets-seed"` | 同上（schema_versions 連携不要） |

### 既知制限 / 境界

- enum 値正規化（zone/status）は本タスクでは「取込が成立する（AC-1）」最小範囲のみ持つ。検索 UI 側の整形は別 WF `members-search-filter-ux-and-api-fix` に委ねる（R-3）。
- 汎用 alias テーブル駆動の label 解決は本タスク非導入（YAGNI・実ラベル直接是正 + 既存 schema_diff_queue 範囲）。将来 UI 統合候補は unassigned-task-detection.md baseline 参照。
- Lane E transport 真因（staging binding）の実機切り分けは Gate-B 時 user-gated。コード設計は (A) 500 / (B) transport の両真因で UX が壊れないよう fail-safe に完結。

### 検証コマンド（user gate 後・implemented_local_runtime_pending では未実行）

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint
cd apps/api && mise exec -- pnpm vitest run src/repository src/jobs src/use-cases/_shared src/use-cases/public src/routes/admin src/routes/me src/middleware
cd packages/integrations/google && mise exec -- pnpm vitest run src/forms/mapper.spec.ts
cd apps/web && mise exec -- pnpm vitest run app/\(member\)/profile src/components/admin/MemberFieldEditor.spec.tsx --root ../..
```

---

## 視覚証跡

本タスクは **VISUAL（Lane D）かつ `workflow_state=implemented_local_runtime_pending`** のため、Phase 11 スクリーンショットは
**0 枚（pending_runtime_visual）**。実描画 UI（`MemberFieldEditor` / merged 表示）はuser gate 後にのみ存在するため、
実撮影は staging deploy + bearer mint を前提に **user-gated** で行う。

capture 計画（6 PNG・canonical `<component>-<state>.png`）と 3 層評価観点（Semantic / Visual / AI-UX）は
以下に記述済み:

- `outputs/phase-11/ui-sanity-visual-review.md`（VISUAL 宣言 + Apple HIG + 3 層評価計画）
- `outputs/phase-11/phase11-capture-metadata.json`（各 entry `status=pending_runtime_visual`）
- `outputs/phase-11/manual-test-result.md`（主証跡 = focused vitest 計画・件数）
