# Phase 5 — 実装手順

## 目的

Phase 4 のテストを GREEN にする実装手順を、後続実行者が迷わない粒度で確定する。文言・seed 仕様は [shared-context.md](./shared-context.md) を唯一の正本としてコピーし、ドリフトを禁止する。

## 成果物

- 「新規作成」「修正」ファイルパス一覧（FB-RT-03）。
- 各ファイルの Before/After 方針・具体的変更内容。
- 各変更後の検証コマンド。

## 不変条件（再掲・厳守）

- **API 非変更**: `apps/api/src/routes/admin/identity-conflicts.ts`・`apps/api/src/repository/identity-conflict.ts`・`apps/api/src/services/admin/identity-conflict-detector.ts`・`packages/shared` の identity-conflict 型/レスポンス shape は **変更しない**。`matchedFields` の `"name"`/`"affiliation"` は API のまま受け取り、**UI 表現層（glossary）で日本語化**する（adapter 層）。
- **D1 schema 非変更**: concern 4 の seed は既存テーブルのみへ INSERT。新規 migration / カラム追加禁止。
- **OKLch トークン**: 色は `var(--ubm-color-*)` のみ。HEX/`bg-[#xxx]` 禁止（`verify:tokens` gate）。
- **route/testid/href 維持**: `id`/`href`/`icon`/`data-route` の contract を壊さない。
- **state machine 不変**: `IdentityConflictRow` の `stage`・optimistic・mutation endpoint・fade animation は変更しない（文言と badge ラベルのみ変更）。
- canUseTool / IPC は本タスク非該当（記載不要）。

---

## ファイル一覧

### 新規作成

| パス | 役割 |
| --- | --- |
| `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts` | 用語集 SSOT（matchedFields→日本語 adapter） |
| `apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts` | glossary 単体テスト |
| `apps/web/src/components/admin/IdentityConflictGuide.tsx` | ページ冒頭の説明ガイド |
| `apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx` | ガイド描画テスト |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | Row 文言/glossary テスト（既存があれば編集） |
| `apps/api/src/testing/identity-conflicts/catalog.ts` | 重複ペア 5 組（10 member）の SSOT |
| `apps/api/src/testing/identity-conflicts/build-seed-sql.ts` | seed/cleanup SQL ビルダー（pure） |
| `apps/api/src/testing/identity-conflicts/index.ts` | barrel re-export |
| `scripts/gen-identity-conflict-seed.mjs` | ビルダーを呼び生成物を出力 |
| `scripts/seed-identity-conflicts.sh` | local/staging 限定の適用ラッパー |
| `apps/api/migrations/seed/identity-conflict-staging-seed.sql` | 生成物（apply 用） |
| `apps/api/migrations/seed/identity-conflict-cleanup.sql` | 生成物（cleanup 用） |
| `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts` | drift/idempotent/行数/5候補 contract test |

### 修正

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/shell/shell-config.ts` | nav label 2 箇所 |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | label アサート追加 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 文言置換＋Guide 差込 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 文言・UX・glossary badge |
| `apps/web/src/components/admin/identityConflictAnnouncements.ts` | アナウンス文言 |

---

## concern 1 — サイドバー命名

### `apps/web/src/components/shell/shell-config.ts`（修正）

`buildAdminGroup` 内の 2 行のみ label 置換（[§5.1](./shared-context.md)）。`id`/`href`/`icon` は不変。

- L86 Before: `{ id: "meeting", href: "/admin/meetings", label: "開催日", icon: "meeting" },`
  After: `{ id: "meeting", href: "/admin/meetings", label: "開催・出席管理", icon: "meeting" },`
- L89-93 Before: identity item の `label: "Identity重複"`
  After: `label: "会員の重複確認"`（`id`/`href`/`icon` 不変）。

### `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（修正）

Phase 4 C1-1〜C1-3 を追加。既存テストは変更しない。

```ts
it("admin の meeting nav は『開催・出席管理』ラベルで id/href/icon は不変", () => {
  const admin = buildNavForRole("admin").find((g) => g.id === "admin");
  expect(admin?.items.find((i) => i.id === "meeting")).toMatchObject({
    href: "/admin/meetings",
    label: "開催・出席管理",
    icon: "meeting",
  });
});
it("admin の identity nav は『会員の重複確認』ラベルで id/href/icon は不変", () => {
  const admin = buildNavForRole("admin").find((g) => g.id === "admin");
  expect(admin?.items.find((i) => i.id === "identity")).toMatchObject({
    href: "/admin/identity-conflicts",
    label: "会員の重複確認",
    icon: "identity",
  });
});
```

---

## concern 2/3 — 用語平易化・UX

### `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts`（新規）

[§5.5](./shared-context.md) の通り。純データ＋純関数・throw しない・未登録は原文 fallback。`source`/`target` ラベルも定数化して Row から参照する。

```ts
// API の matchedFields("name"|"affiliation") → 日本語ラベルの単方向 adapter。
// API/型は変更せず、表示の最終段でのみ変換する（不変条件 #5 / adapter 層）。
export const MATCHED_FIELD_LABELS: Record<string, string> = {
  name: "氏名",
  affiliation: "職業",
};

export const matchedFieldLabel = (field: string): string =>
  MATCHED_FIELD_LABELS[field] ?? field; // 未登録は原文を返す（fail-soft）

export const RECORD_ROLE_LABELS = {
  source: "新しい登録",
  target: "まとめ先（以前の登録）",
} as const;
```

### `apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts`（新規）

Phase 4 C2-1〜C2-5 を実装。

### `apps/web/src/components/admin/IdentityConflictGuide.tsx`（新規）

[§5.4](./shared-context.md)。props 無し（`{ className?: string }` 任意）の stateless component。既存 `AdminSectionCard`（`../../features/admin/components/_shared`）または注記用 primitive を内部合成し、新規 primitive を生やさない。色は `var(--ubm-color-*)` のみ。3 点をリスト（`<ul><li>`）表示。

```tsx
// ページ冒頭の説明ガイド。「このページで何ができるか」を 3 点で平易説明。
// 既存 primitive 合成のみ（新規 primitive 非導入）。色は var(--ubm-color-*)。
import { AdminSectionCard } from "../../features/admin/components/_shared";

export function IdentityConflictGuide() {
  return (
    <AdminSectionCard title="このページでできること" density="compact">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-[var(--ubm-color-text-secondary)]">
        <li>「同じ人が二重に登録されていそうな会員（氏名と職業が同じ）」を自動で見つけます。</li>
        <li>「統合する」＝同じ1人としてまとめる（登録内容は消えません）。</li>
        <li>「別人として確定」＝本当に別の人だと記録し、今後候補に出さないようにします。</li>
      </ul>
    </AdminSectionCard>
  );
}
```

> `AdminSectionCard` の実 props（title/description/density 等）は実装時に `apps/web/src/features/admin/components/_shared` を確認して合わせる。注記スタイルが望ましければ既存の注記 primitive を流用してよいが、**新規 primitive は作らない**。

### `apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx`（新規）

Phase 4 C4-1〜C4-2 を実装。

### `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`（修正）

[§5.2](./shared-context.md) の通り文言置換し、`AdminPageHeader` 直後・候補カードの上に `<IdentityConflictGuide />` を差し込む（empty/error/list いずれの分岐でも常に表示するため、条件分岐の **外側** に配置）。

- import 追加: `import { IdentityConflictGuide } from "../../../../src/components/admin/IdentityConflictGuide";`
- L37-46 `AdminPageHeader`:
  - `eyebrow="ADMIN / IDENTITY"` → `eyebrow="会員管理"`
  - `title="Identity 重複候補"` → `title="会員の重複確認"`
  - description ok 時: `` `name + 所属が一致した候補 ${result.data.items.length} 件` `` → `` `氏名と職業が一致する「重複の可能性がある会員」が ${result.data.items.length} 組` ``
  - description err 時: `"候補の読み込みに失敗"` → `"重複候補の読み込みに失敗しました"`
  - breadcrumbs 末尾 label: `"Identity 重複候補"` → `"会員の重複確認"`
- Guide 差込（L46 の `AdminPageHeader` 閉じ後・`{!result.ok ? ...}` の直前）:
  ```tsx
  <IdentityConflictGuide />
  ```
- L50 `AdminSectionErrorClient` の `sectionLabel="Identity 重複候補"` → `"会員の重複確認"`
- L69 EmptyState `title="現在、merge 候補はありません。"` → `"現在、重複の可能性がある会員は見つかっていません。"`
- L73 `AdminSectionCard title="候補一覧"` → `title="重複の可能性がある会員"`
- L74 `description="merge は二段階確認、別人確定は理由入力後に実行します。"` → `description="「統合」は2段階の確認、「別人として確定」は理由を入力してから実行します。"`
- L78 `aria-label="Identity 重複候補一覧"` → `aria-label="重複の可能性がある会員の一覧"`

### `apps/web/src/components/admin/IdentityConflictRow.tsx`（修正）

[§5.3](./shared-context.md) の通り文言置換。**state machine・mutation endpoint・optimistic・fade animation は不変**。badge は glossary 経由に変更。

- import 追加:
  ```ts
  import { matchedFieldLabel, RECORD_ROLE_LABELS } from "../../features/admin/identity-conflicts/identityConflictGlossary";
  ```
- L54-64 `mergeMutation` の `successMessage: "✓ 統合しました"` は **維持**（変更しない）。
- L66-76 `dismissMutation` の `successMessage: "✓ 別人として確定しました"` は **維持**。
- L164-166 conflictId 生表示 Before:
  ```tsx
  <div className="font-mono text-xs text-[var(--ubm-color-text-muted)]">
    conflict: {item.conflictId}
  </div>
  ```
  After（一覧本文から除去し、補助情報へ退避。`<details>` または `title` 属性へ）:
  ```tsx
  <details className="text-xs text-[var(--ubm-color-text-muted)]">
    <summary className="cursor-pointer">技術情報</summary>
    <span className="font-mono">照合キー: {item.conflictId}</span>
  </details>
  ```
  （`title`/aria 退避でも可。一覧に生 `conflict:` を出さなければよい。Phase 4 C3-5 が満たされる方を選択）
- L168-170 source Badge children `source` → `{RECORD_ROLE_LABELS.source}`（=`新しい登録`）。
- L175-177 target Badge children `target` → `{RECORD_ROLE_LABELS.target}`（=`まとめ先（以前の登録）`）。
- L181-183 `email:` → `メール:`（`responseEmailMasked` 表示は維持）。
- L184 `matched: {item.matchedFields.join(", ")}` → `一致した項目: {item.matchedFields.map(matchedFieldLabel).join("、")}`。
- L185-189 field Badge children `{field}` → `{matchedFieldLabel(field)}`（=`氏名`/`職業`）。
- L195 dismiss ボタン children `別人マーク` → `別人として確定`。
- L198-200 merge ボタン children `merge` → `統合する`。
- L208-211 merge-confirm 文言 → `確認 1/2：この2件を「同じ1人の会員」としてまとめます。登録内容そのものは消えず、表示上のつながりだけを更新します。`（`{item.sourceMemberId} を ... に統合します。実体本文は移動せず、canonical 解決テーブルのみ更新します。` を置換。member_id を本文から出さない方針なら id 補間を外す）。
- L217 `次へ` → 維持。
- L226 merge-final 文言 → `確認 2/2：まとめる理由を記録します（個人情報は自動で伏せられます）。`。
- L232 label `merge 理由` → `まとめる理由`。
- L241 placeholder `例: 本人確認済 / 同一人物として統合` → `例：本人確認済み／同じ人として統合`。
- L267 ボタン `merge 実行` → `統合を実行`。
- L275 dismiss 説明 `別人として確定します。再検出を抑止します。理由を記載してください。` → `別人として確定します。今後この組み合わせは重複候補に出ません。理由を記載してください。`。
- L280 label `別人マーク理由` → `別人と判断した理由`。
- L289 placeholder `例: 同姓同名 / 別組織所属で確認済` → `例：同姓同名で別人／別組織と確認済み`。
- L315 ボタン `別人として確定` → 維持。

> UX: 人を識別する情報（メール・一致項目）を主役にし、内部 ID（member_id）は font-mono の控えめ表示のままラベルを日本語化。2 段階確認の意図（取り消し可能性・記録される旨）を平易文で明示。

### `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（新規）

Phase 4 C3-1〜C3-11 を実装。`item` は external prop で構築、`stage` 遷移は `fireEvent.click` で起こす。`window` モックが必要なら `Object.defineProperty(window, ...)`（`vi.stubGlobal("window")` 禁止）。

### `apps/web/src/components/admin/identityConflictAnnouncements.ts`（修正）

[§5.6](./shared-context.md):

- `merge: "merge を実行しました。候補を一覧から非表示にしました。"` → `merge: "統合しました。一覧から非表示にしました。"`
- `dismiss: "別人として確定しました。候補を一覧から非表示にしました。"` → `dismiss: "別人として確定しました。一覧から非表示にしました。"`

> `IdentityConflictAction` 型・`announcementFor` 関数 signature は不変。

---

## concern 4 — 専用 staging seed

### `apps/api/src/testing/identity-conflicts/catalog.ts`（新規）

[§6.2/6.3](./shared-context.md) を定数化。`lastSubmittedAt` は固定（決定論）。既存 test-accounts catalog は import しない（分離）。

```ts
export const IDENTITY_CONFLICT_SEED_ACTOR = "seed:identity-conflicts";
export const IDENTITY_CONFLICT_EMAIL_DOMAIN = "test.ubm-hyogo.invalid";

export interface DupMember {
  readonly memberId: `TEST-MEM-${string}`;   // TEST-MEM-21..30
  readonly responseId: `TEST-RES-${string}`; // TEST-RES-21..30
  readonly email: string;                    // test-dup-2x@test.ubm-hyogo.invalid（UNIQUE）
  readonly fullName: string;                 // 原文（全角/末尾空白も原文のまま保存）
  readonly occupation: string;               // 原文
  readonly ubmZone: string;
  readonly location: string;
  readonly businessOverview: string;
  readonly selfIntroduction: string;
  readonly lastSubmittedAt: string;          // 2026-06-09T10:00..10:09（ペア内で a<b）
}

export interface IdentityConflictSeedCatalog {
  readonly actor: string;
  readonly formId: string;        // 例: "TEST-FORM-DUP"
  readonly revisionId: string;    // "TEST-REV-DUP"
  readonly schemaHash: string;    // "TEST-SCHEMA-HASH-DUP"
  readonly members: readonly DupMember[]; // 10 件
}

export const identityConflictSeedCatalog: IdentityConflictSeedCatalog = {
  actor: IDENTITY_CONFLICT_SEED_ACTOR,
  formId: "TEST-FORM-DUP",
  revisionId: "TEST-REV-DUP",
  schemaHash: "TEST-SCHEMA-HASH-DUP",
  members: [
    // P1 完全一致（二重登録）
    { memberId: "TEST-MEM-21", responseId: "TEST-RES-21", email: "test-dup-21@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 完全一致 太郎", occupation: "行政書士", ubmZone: "0_to_1",
      location: "兵庫県神戸市", businessOverview: "完全一致の二重登録デモ。", selfIntroduction: "同一人物が2回登録されたケースです。",
      lastSubmittedAt: "2026-06-09T10:00:00.000Z" },
    { memberId: "TEST-MEM-22", responseId: "TEST-RES-22", email: "test-dup-22@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 完全一致 太郎", occupation: "行政書士", ubmZone: "0_to_1",
      location: "兵庫県神戸市", businessOverview: "完全一致の二重登録デモ（新しい側＝source）。", selfIntroduction: "新しい登録側です。",
      lastSubmittedAt: "2026-06-09T10:01:00.000Z" },
    // P2 表記ゆれ（NFKC 全角→半角で一致）
    { memberId: "TEST-MEM-23", responseId: "TEST-RES-23", email: "test-dup-23@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 表記ゆれ 花子", occupation: "ＷＥＢデザイナー", ubmZone: "1_to_10",
      location: "兵庫県西宮市", businessOverview: "全角WEBの表記ゆれデモ。", selfIntroduction: "全角表記の登録です。",
      lastSubmittedAt: "2026-06-09T10:02:00.000Z" },
    { memberId: "TEST-MEM-24", responseId: "TEST-RES-24", email: "test-dup-24@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 表記ゆれ 花子", occupation: "WEBデザイナー", ubmZone: "1_to_10",
      location: "兵庫県西宮市", businessOverview: "半角WEBの表記ゆれデモ。", selfIntroduction: "半角表記の登録です。",
      lastSubmittedAt: "2026-06-09T10:03:00.000Z" },
    // P3 余白（末尾空白 trim で一致）
    { memberId: "TEST-MEM-25", responseId: "TEST-RES-25", email: "test-dup-25@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 余白 次郎", occupation: "製造コンサルタント", ubmZone: "10_to_100",
      location: "兵庫県姫路市", businessOverview: "末尾空白なしの登録。", selfIntroduction: "空白なし側です。",
      lastSubmittedAt: "2026-06-09T10:04:00.000Z" },
    { memberId: "TEST-MEM-26", responseId: "TEST-RES-26", email: "test-dup-26@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 余白 次郎 ", occupation: "製造コンサルタント ", ubmZone: "10_to_100",
      location: "兵庫県姫路市", businessOverview: "末尾空白ありの登録（trim で一致）。", selfIntroduction: "空白あり側です。",
      lastSubmittedAt: "2026-06-09T10:05:00.000Z" },
    // P4 転居（同一人物が別ゾーン・別メールで再登録）
    { memberId: "TEST-MEM-27", responseId: "TEST-RES-27", email: "test-dup-27@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 転居 三郎", occupation: "不動産業", ubmZone: "0_to_1",
      location: "兵庫県尼崎市", businessOverview: "転居前ゾーンの登録。", selfIntroduction: "旧ゾーンの登録です。",
      lastSubmittedAt: "2026-06-09T10:06:00.000Z" },
    { memberId: "TEST-MEM-28", responseId: "TEST-RES-28", email: "test-dup-28@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 転居 三郎", occupation: "不動産業", ubmZone: "1_to_10",
      location: "兵庫県明石市", businessOverview: "転居後ゾーンの登録（統合 demo）。", selfIntroduction: "新ゾーンの登録です。",
      lastSubmittedAt: "2026-06-09T10:07:00.000Z" },
    // P5 同姓同名（別人想定→「別人として確定」demo）
    { memberId: "TEST-MEM-29", responseId: "TEST-RES-29", email: "test-dup-29@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 同姓同名 美咲", occupation: "美容師", ubmZone: "1_to_10",
      location: "兵庫県宝塚市", businessOverview: "同姓同名の別人デモ A。", selfIntroduction: "別人想定 A です。",
      lastSubmittedAt: "2026-06-09T10:08:00.000Z" },
    { memberId: "TEST-MEM-30", responseId: "TEST-RES-30", email: "test-dup-30@test.ubm-hyogo.invalid",
      fullName: "[TEST] 重複 同姓同名 美咲", occupation: "美容師", ubmZone: "10_to_100",
      location: "兵庫県川西市", businessOverview: "同姓同名の別人デモ B。", selfIntroduction: "別人想定 B です。",
      lastSubmittedAt: "2026-06-09T10:09:00.000Z" },
  ],
} as const;
```

> 既存 TEST-MEM-01..10 の職業（経営者/デザイナー/マーケター/営業/士業/製造/コミュニティ運営/金融/人事/R&D…）とは全て非一致 → cross-collision なし → 期待候補数 = ちょうど 5（[§6.3 注記](./shared-context.md)）。

### `apps/api/src/testing/identity-conflicts/build-seed-sql.ts`（新規）

[§6.4](./shared-context.md)。`sqlString`/`sqlJson`/`sqlNumber`/`buildInsert` は test-accounts/build-seed-sql の helper を**ローカル再実装**（共有 module を汚さない）。出力テーブルは検出・表示・会員レンダリングに必要な最小セット。`value_json` は `JSON.stringify` 後に SQL クォート（`json_extract` 互換）。`INSERT OR REPLACE`・明示 BEGIN/COMMIT なし（D1 remote 制約）。

signature:

```ts
export const buildIdentityConflictSeedSql = (
  catalog: IdentityConflictSeedCatalog = identityConflictSeedCatalog,
): string => { /* schema_versions(1) + schema_questions(最小) + member_responses(10)
                  + response_fields(6種×10=60) + member_identities(10) + member_status(10) */ };

export const buildIdentityConflictCleanupSql = (
  catalog: IdentityConflictSeedCatalog = identityConflictSeedCatalog,
): string => { /* member_id IN (..21..30) / response_id IN (..) / revision_id='TEST-REV-DUP' で scoped DELETE */ };
```

出力テーブル詳細（test-accounts/build-seed-sql.ts の該当 buildInsert を簡略移植）:

1. `schema_versions`: `revision_id='TEST-REV-DUP'`, `form_id`, `schema_hash`, `state='active'`, `synced_at=最古 lastSubmittedAt 等固定`, `field_count`, `unknown_field_count=0`, `source_url='seed:identity-conflicts'`。
2. `schema_questions`: 最小セット（fullName / occupation / ubmZone / location / businessOverview / selfIntroduction）。`question_pk=`${revisionId}:${stableKey}``, `revision_id='TEST-REV-DUP'`, `stable_key`, position 連番, `visibility`（fullName/occupation/ubmZone/location/businessOverview/selfIntroduction は public）, `status='active'`, `choice_labels_json='[]'`。
3. `member_responses`（10）: `response_id`, `form_id`, `revision_id`, `schema_hash`, `response_email=member.email`, `submitted_at=member.lastSubmittedAt`, `edit_response_url`, `answers_json`/`raw_answers_json`（fullName/occupation/ubmZone/location/businessOverview/selfIntroduction の object）, `extra_fields_json={"source":actor}`, `unmapped_question_ids_json='[]'`, `search_text=fullName+occupation+email`。
4. `response_fields`（60）: 各 member × 6 stable_key。`value_json`=`sqlJson(原文値)`（**全角/末尾空白を原文のまま保存** — 検出側 detector が trim+NFKC で一致させる）。`raw_value_json` も同値。**fullName/occupation は全 member 必須**（検出条件）。
5. `member_identities`（10）: `member_id`, `response_email=member.email`, `current_response_id=member.responseId`, `first_response_id=member.responseId`, `last_submitted_at=member.lastSubmittedAt`, `created_at`/`updated_at`=member.lastSubmittedAt。
6. `member_status`（10）: `public_consent='declined'`, `rules_consent='consented'`, `publish_state='member_only'`, `is_deleted=0`, `hidden_reason=NULL`, `updated_by=actor`, `updated_at=member.lastSubmittedAt`, `notification_opt_out=0`（[§6.4](./shared-context.md)）。

> repository の `fetchIdentitySnapshots` は `member_identities` × `response_fields`（stable_key='fullName' を name、'occupation' を affiliation）を JOIN する（[shared-context §4](./shared-context.md)）。よって **fullName/occupation の response_fields 行が検出の必須条件**。`member_field_visibility` は検出に不要だが、公開詳細レンダリング検証を Phase 11 で行うなら最小投入してもよい（行数 contract に含めるか Phase 5 実装時に確定。デフォルトは投入しない＝最小セット）。

### `apps/api/src/testing/identity-conflicts/index.ts`（新規）

```ts
export * from "./catalog.ts";
export * from "./build-seed-sql.ts";
```

### `scripts/gen-identity-conflict-seed.mjs`（新規）

`scripts/gen-test-accounts-seed.mjs` と同型。`--check` で drift 検出、無指定で生成。

```js
#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildIdentityConflictSeedSql, buildIdentityConflictCleanupSql }
  from "../apps/api/src/testing/identity-conflicts/index.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputs = [
  ["apps/api/migrations/seed/identity-conflict-staging-seed.sql", buildIdentityConflictSeedSql()],
  ["apps/api/migrations/seed/identity-conflict-cleanup.sql", buildIdentityConflictCleanupSql()],
];
const check = process.argv.includes("--check");
let drift = false;
for (const [relativePath, content] of outputs) {
  const absolutePath = resolve(root, relativePath);
  if (check) {
    const current = await readFile(absolutePath, "utf8").catch(() => "");
    if (current !== content) { console.error(`drift: ${relativePath}`); drift = true; }
    continue;
  }
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
  console.log(`wrote ${relativePath}`);
}
if (drift) process.exit(1);
```

### `scripts/seed-identity-conflicts.sh`（新規）

`scripts/seed-test-accounts.sh` をコピーし、`SQL_FILE` を identity-conflict 用に変更。local/staging ガード・production 到達不可・`cf.sh d1 execute` 経路は維持。

- `usage()` のテキストを `scripts/seed-identity-conflicts.sh --env local|staging --action apply|cleanup` に。
- L47-50 を:
  ```bash
  SQL_FILE="apps/api/migrations/seed/identity-conflict-staging-seed.sql"
  if [[ "$ACTION" == "cleanup" ]]; then
    SQL_FILE="apps/api/migrations/seed/identity-conflict-cleanup.sql"
  fi
  ```
- env ガード（local/staging 以外 reject）・`cf.sh` 経由 remote 実行はそのまま流用。

### `apps/api/migrations/seed/identity-conflict-staging-seed.sql` / `identity-conflict-cleanup.sql`（新規・生成物）

`node scripts/gen-identity-conflict-seed.mjs` の実行で生成（手書きしない）。contract test が drift を検出する。

### `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts`（新規）

Phase 4 C5-1〜C5-10 + C6-1〜C6-4。`test-accounts-seed.contract.spec.ts` の `stripComments`/`splitStatements`/`execAll`/`setupD1` を踏襲。drift は生成物 SQL とビルダー出力のバイト一致で、検出整合は `detectConflictCandidates` を import して catalog snapshot で 5 候補を検証。

---

## 検証コマンド（変更後）

```bash
mise exec -- pnpm install --force          # 依存（必要時）
mise exec -- pnpm typecheck                # 型
mise exec -- pnpm lint                     # lint（--fix 可）
mise exec -- pnpm verify:tokens            # OKLch トークン gate（HEX 直書き 0）

# concern 4: 生成 → contract（drift 0 / idempotent / 行数 / 5候補）
node scripts/gen-identity-conflict-seed.mjs

# focused vitest（ルートからフルパス）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
  apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts

# API 非変更の確認（concern 4 の testing/migrations を除き空であること）
git diff --name-only -- apps/api/src/routes apps/api/src/repository apps/api/src/services packages/shared

# seed の local apply smoke（任意・user-gated）
bash scripts/seed-identity-conflicts.sh --env local --action apply

# gate
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/artifacts.json \
  docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/artifacts.json
```

## 統合テスト連携

- concern 1-3: focused vitest（shell-config / glossary / Row / Guide）緑。jsdom は CSS 非評価のため視覚は Phase 11 screenshot（user-gated）。
- concern 4: `gen-identity-conflict-seed.mjs` → contract test（drift 0 / idempotent / 行数 / ちょうど 5 候補）緑 → local D1 apply → `/admin/identity-conflicts` に 5 組表示を Phase 11 で目視。
- API 非変更を `git diff --name-only` で確認（AC-8）。
- gate（phase12-compliance / gate-metadata / tokens）を validation lane で締める。

## 完了条件

- [ ] 新規/修正ファイル一覧（FB-RT-03）を全件記載した。
- [ ] concern 1（shell-config label）・concern 2/3（glossary/Guide/Row/announcements/page 文言）の Before/After を [shared-context](./shared-context.md) コピーで明記した。
- [ ] concern 4（catalog/build-seed-sql/index/gen/sh/生成 SQL/contract）の実装内容・signature を明記した。
- [ ] API/型/D1 schema 非変更（adapter 層方針）を明記した。
- [ ] 各変更後の検証コマンド（typecheck/lint/tokens/gen/focused vitest/contract/gate）を列挙した。
