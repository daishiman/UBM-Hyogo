# Phase 4 — テスト計画

## 目的

concern 1〜4 を TDD（RED → GREEN）で実装するための、テストケース・アサート対象・実行コマンドを固定する。文言・seed 仕様は [shared-context.md](./shared-context.md) を唯一の正本として引用し、ドリフトを禁止する。jsdom は CSS を評価しないため、検証は **DOM 構造・文言 contract・glossary 変換・seed 生成決定論** に限定し、最終視覚は staging screenshot（Phase 11・user-gated）で担保する。

## 成果物

- concern 1〜3（apps/web 表現層）の RED テストケース仕様。
- concern 4（apps/api seed + scripts）の contract / 検出整合テストケース仕様。
- focused vitest 実行コマンド（ルートからフルパス）。
- 各テストが操作する対象が **external prop か internal state か** の明示（VSCPKR-03）。

## 共通方針

- **テスト対象の入力境界**（VSCPKR-03）:
  - `IdentityConflictRow` の `item`（conflictId / sourceMemberId / candidateTargetMemberId / matchedFields / responseEmailMasked / detectedAt / syncJobId）は **external prop**。テストは `item` を構築して注入する。
  - `IdentityConflictRow` の `stage`（`idle`/`merge-confirm`/`merge-final`/`dismiss`）・`mergeReason`/`dismissReason`・optimistic フラグは **internal state**。テストは prop で直接設定せず、**ボタン操作（クリック・入力）で状態遷移を起こして** 検証する。
  - `IdentityConflictGuide` は props 無し（または `className?`）の stateless。`matchedFieldLabel` は純関数（引数 = 唯一の入力境界）。
- **mutation のモック**: `useAdminMutation` 経由の merge/dismiss endpoint は本タスクで **不変**。state machine・optimistic 挙動・endpoint URL を壊さないことを確認するテストを含めるが、文言変更が主目的のため、ネットワーク到達は検証対象外（既存挙動の回帰防止）。`window` 系をモックする場合は `Object.defineProperty(window, ...)` を使い、**`vi.stubGlobal("window", ...)` は禁止**（FB-VSCPKR-02。happy-dom/jsdom の window 差し替えで描画が壊れるため）。
- focused vitest はメモリ制約のため全件実行せず、**ルートからフルパス指定**で実行する（FB-UI-02-2）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
  apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts
```

---

## concern 1 — サイドバー命名（`shell-config.spec.ts` 編集）

対象: `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（既存ファイルに追記/編集）。
入力境界: `buildNavForRole("admin")` の出力（純関数・external なし）。

| # | ケース | アサート（RED 期待） |
| --- | --- | --- |
| C1-1 | meeting nav の label | `admin.items.find(i => i.id === "meeting")` が `{ href: "/admin/meetings", label: "開催・出席管理", icon: "meeting" }` に **matchObject**。`id`/`href`/`icon` 不変。 |
| C1-2 | identity nav の label | `admin.items.find(i => i.id === "identity")` が `{ href: "/admin/identity-conflicts", label: "会員の重複確認", icon: "identity" }` に **matchObject**。 |
| C1-3 | 既存 11 item 構成不変 | `admin.items` の length が 11 のまま・id 配列が不変（label 変更のみで構造を壊さない回帰防止）。 |

> 既存テスト（tag-master/tag-queue/schema badge/form-responses 等）は変更しない。label アサートのみ追加/更新。

---

## concern 2/3 — 用語平易化・UX（apps/web）

### identityConflictGlossary.spec.ts（新規）

対象: `apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts`。
入力境界: `matchedFieldLabel(field: string)` の引数（純関数・external prop 相当）。

| # | ケース | アサート（RED 期待） |
| --- | --- | --- |
| C2-1 | `matchedFieldLabel("name")` | `=== "氏名"` |
| C2-2 | `matchedFieldLabel("affiliation")` | `=== "職業"` |
| C2-3 | 未登録キー fallback | `matchedFieldLabel("unknown")` が **throw せず** `=== "unknown"`（原文返却・fail-soft、WEEKGRD-02） |
| C2-4 | `MATCHED_FIELD_LABELS` の純データ性 | `name`/`affiliation` の 2 キーを持つ Record であること |
| C2-5 | `RECORD_ROLE_LABELS`（任意・定数化する場合） | `source === "新しい登録"` / `target === "まとめ先（以前の登録）"`（[§5.3](./shared-context.md)） |

### IdentityConflictRow.spec.tsx（新規）

対象: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`。
入力境界: `item`（external prop）を構築して `render(<IdentityConflictRow item={item} />)`。`stage` は internal state なので **クリック操作で遷移** させる。

テスト用 item の例（[§6.3](./shared-context.md) の P1 を模す）:

```ts
const item: IdentityConflictRow = {
  conflictId: "TEST-MEM-22__TEST-MEM-21",
  sourceMemberId: "TEST-MEM-22",
  candidateTargetMemberId: "TEST-MEM-21",
  matchedFields: ["name", "affiliation"],
  detectedAt: "2026-06-09T10:01:00.000Z",
  responseEmailMasked: "t***@test.ubm-hyogo.invalid",
  syncJobId: null,
};
```

| # | ケース | アサート（RED 期待） | 操作対象 |
| --- | --- | --- | --- |
| C3-1 | source ラベル日本語 | `新しい登録` が描画され、英語 `source` は描画されない | prop（初期描画） |
| C3-2 | target ラベル日本語 | `まとめ先（以前の登録）` が描画され、英語 `target` は描画されない | prop |
| C3-3 | matched 項目が glossary 経由 | `matchedFields` の Badge が `氏名` / `職業` で描画され、英語 `name`/`affiliation` は描画されない。`一致した項目:` ラベルが日本語 | prop → glossary |
| C3-4 | email ラベル日本語 | `メール:` が描画され、英語 `email:` は描画されない。`responseEmailMasked` は表示維持 | prop |
| C3-5 | conflictId 非露出 | 一覧本文に生の `conflict: ...` テキストは描画されない（`照合キー:` を `title`/aria/`<details>` へ退避。[§5.3 L89](./shared-context.md)） | prop |
| C3-6 | ボタン文言 | 初期 idle で `別人として確定` / `統合する` ボタンが描画される（英語 `merge`/`別人マーク` は無し） | internal state（idle） |
| C3-7 | merge 確認 1/2 文言 | `統合する` クリック後、`確認 1/2：この2件を「同じ1人の会員」としてまとめます。登録内容そのものは消えず、表示上のつながりだけを更新します。`（[§5.3](./shared-context.md)）が描画され、`canonical 解決テーブル` は描画されない | クリックで internal state → merge-confirm |
| C3-8 | merge 確認 2/2 文言 | `次へ` クリック後、`確認 2/2：まとめる理由を記録します（個人情報は自動で伏せられます）。` が描画され、`PII`/`redaction` は無し。理由 label `まとめる理由`、placeholder `例：本人確認済み／同じ人として統合`、実行ボタン `統合を実行` | クリックで merge-final |
| C3-9 | dismiss 文言 | `別人として確定` クリック後、`別人として確定します。今後この組み合わせは重複候補に出ません。理由を記載してください。` が描画され、label `別人と判断した理由`、placeholder `例：同姓同名で別人／別組織と確認済み` | クリックで dismiss |
| C3-10 | merge endpoint 不変（回帰） | `mergeMutation` の URL が `/api/admin/identity-conflicts/${conflictId}/merge` のまま（既存挙動 — endpoint・state machine 非変更の保証。`useAdminMutation` をモックして呼び出し URL を検証、または既存テストが無ければ optimistic 非破壊のみ確認） | 不変条件 |
| C3-11 | 成功 toast 文言維持 | `successMessage` が `✓ 統合しました` / `✓ 別人として確定しました` のまま（[§5.3 L107-108](./shared-context.md) で「維持」） | 不変条件 |

> jsdom: CSS 非評価のため余白・色は検証しない。font-mono の有無等は class 名 contract で必要時のみ確認。

### IdentityConflictGuide.spec.tsx（新規）

対象: `apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx`。
入力境界: props 無し（stateless）。`render(<IdentityConflictGuide />)`。

| # | ケース | アサート（RED 期待） |
| --- | --- | --- |
| C4-1 | 説明 3 点が描画される | [§5.4](./shared-context.md) の 3 文（「同じ人が二重に登録されていそうな会員（氏名と職業が同じ）」を自動で見つけます / 「統合する」＝同じ1人としてまとめる（登録内容は消えません） / 「別人として確定」＝本当に別の人だと記録し、今後候補に出さないようにします）が全て描画される |
| C4-2 | 新規 primitive 非導入 | 既存 primitive（`AdminSectionCard` 等）合成で構成され、独自 raw 要素を増やさない（render 成功＋role/heading の存在確認） |

### page.tsx 文言（jsdom 検証可能範囲）

page.tsx は Server Component（`async`）で `safeServerFetch` に依存するため、フル render テストは行わず、**文言定数の単体検証 or 既存 page テストがあれば文言更新**に留める。検証は主に手動/Playwright（Phase 11）と、文言が glossary/定数に切り出せる範囲のみ vitest 化する。最低限、[§5.2](./shared-context.md) の文言（title `会員の重複確認` / empty `現在、重複の可能性がある会員は見つかっていません。` / card title `重複の可能性がある会員` / card description / aria-label `重複の可能性がある会員の一覧`）が実装に反映されていることを Phase 11 でスクリーンショット確認する。

---

## concern 4 — 専用 staging seed（contract / 検出整合）

### identity-conflict-seed.contract.spec.ts（新規）

対象: `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts`。
テンプレ: `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` の構造を踏襲（`stripComments`/`splitStatements`/`execAll`/`setupD1` in-memory D1）。

| # | ケース | アサート（RED 期待） |
| --- | --- | --- |
| C5-1 | drift 検出（バイト一致） | `readFileSync("identity-conflict-staging-seed.sql")` が `buildIdentityConflictSeedSql()` と **完全一致**。`readFileSync("identity-conflict-cleanup.sql")` が `buildIdentityConflictCleanupSql()` と一致 |
| C5-2 | idempotent | seed SQL を **2 回** `execAll` しても各テーブル件数が 1 回適用時と同じ（`INSERT OR REPLACE` 方針の確認） |
| C5-3 | member_identities 行数 | `TEST-MEM-2x`〜`3x` で **10 行**（`WHERE member_id LIKE 'TEST-MEM-2%' OR LIKE 'TEST-MEM-3%'`、または `IN ('TEST-MEM-21'..'30')`） |
| C5-4 | member_status 行数 | **10 行**（同条件） |
| C5-5 | member_responses 行数 | **10 行**（`response_id IN ('TEST-RES-21'..'30')`） |
| C5-6 | response_fields 行数 | 各 member の stable_key = {fullName, occupation, ubmZone, location, businessOverview, selfIntroduction}（6 種）× 10 member = **60 行**。最低限 fullName/occupation の 2 種が全 member に存在することを別途確認（検出条件）。<br>※実装の field セットが変わる場合は build-seed-sql の `RESPONSE_FIELD_KEYS` 実数に合わせて期待値を確定（Phase 5 で固定） |
| C5-7 | schema_questions 行数 | `TEST-REV-DUP` の question_pk が build の question 数と一致（最小セット。fullName/occupation/ubmZone 等を含む）。`WHERE revision_id = 'TEST-REV-DUP'` |
| C5-8 | 正規化後一致ペア | 各ペアの 2 member について、`fullName.trim().normalize("NFKC")` と `occupation.trim().normalize("NFKC")` が **ペア内で一致** する（P2=全角/半角 WEB、P3=末尾空白を含め一致）。catalog から導出した snapshot で検証 |
| C5-9 | cleanup の scoped 削除 | seed 適用後 cleanup を 2 回 `execAll` → `TEST-MEM-2x/3x`・`TEST-RES-2x/3x`・`TEST-REV-DUP` の行が **0**。既存 `TEST-MEM-01`（別途 seed 投入してあれば）を巻き込まないことを `IN` 句条件で担保 |
| C5-10 | cleanup idempotent | cleanup を 2 回適用してもエラーにならず 0 件のまま |

### 検出整合テスト（ちょうど 5 候補）

対象: 同 contract spec 内 or `apps/api/src/testing/identity-conflicts/__tests__/catalog-detection.spec.ts`。
方針: API/repository を変えないため、**`detectConflictCandidates`（pure function）を import** し、catalog の 10 member から `IdentitySnapshot[]`（name=fullName, affiliation=occupation）を生成して検証する。`norm = trim + NFKC` は detector 実装に内蔵済（[detector L24](../../../apps/api/src/services/admin/identity-conflict-detector.ts) 参照）。

| # | ケース | アサート（RED 期待） |
| --- | --- | --- |
| C6-1 | ちょうど 5 ペア | catalog 10 member を全 snapshot とし、各 member を順に source として `detectConflictCandidates([src], snapshots)` を回す（自己除外あり）。dedup 後の **ユニークなペア（無向）数 = 5**。1 ペア = 1 候補 |
| C6-2 | 各ペアの matchedFields | 全候補の `matchedFields` が `["name","affiliation"]` |
| C6-3 | cross-collision なし | 5 ペア以外の組（異なるペア間）は候補化されない（既存 TEST-MEM-01..10 の職業群とも非一致）。期待ペア集合 = `{21-22, 23-24, 25-26, 27-28, 29-30}` |
| C6-4 | NFKC/trim パターン | P2（全角 `ＷＥＢデザイナー` vs 半角 `WEBデザイナー`）と P3（末尾空白）が **正規化後一致で候補化**されることを、当該ペアのみ抽出して確認 |

> repository（`listIdentityConflicts`）の dedup・source/target 正規化・aliases/dismissals 除外は **不変ロジック**であり、本タスクでは変更しないため再テストしない（pure detector の整合と seed 行数で間接担保）。local D1 への実 apply 後の `/admin/identity-conflicts` 5 件表示は Phase 11 の機能 smoke（user-gated）。

---

## 統合テスト連携

- focused vitest（shell-config / glossary / IdentityConflictRow / IdentityConflictGuide / identity-conflict-seed.contract）を `--root=. --config=vitest.config.ts apps/...` フルパスで実行（上記コマンド）。
- seed の機能検証: `node scripts/gen-identity-conflict-seed.mjs` で生成 → contract test が drift 0 / idempotent / 行数 / 5 候補を緑にする。その後 `bash scripts/seed-identity-conflicts.sh --env local --action apply`（任意・user-gated）で local D1 に投入し `/admin/identity-conflicts` に 5 組表示されることを Phase 11 で目視。
- jsdom は CSS 非評価のため、色（`var(--ubm-color-*)`）・余白は構造/class contract で確認し、最終視覚は staging screenshot（Phase 11・user-gated）。
- gate: `verify:phase12-compliance` / `gate-metadata:validate` / `verify:tokens` を validation lane で締める。

## 完了条件

- [ ] concern 1（shell-config）の label アサート（meeting/identity・id/href/icon 不変）を定義した。
- [ ] concern 2/3（glossary / Row / Guide）の文言・glossary 経由 badge・state machine 不変の RED ケースを定義した。
- [ ] external prop（item）と internal state（stage/reason）の操作区分を全ケースで明示した（VSCPKR-03）。
- [ ] `vi.stubGlobal("window")` 禁止・`Object.defineProperty` 使用を明記した（FB-VSCPKR-02）。
- [ ] concern 4 の contract（drift / idempotent / 行数）と検出整合（ちょうど 5 候補）の RED ケースを定義した。
- [ ] focused vitest 実行コマンドを `--root=. --config=vitest.config.ts apps/...` フルパスで明記した。
