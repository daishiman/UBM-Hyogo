---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 8
name: リファクタリング
status: completed
updated: 2026-06-09
---

# Phase 8 — リファクタリング（member-data-source-precedence-and-profile-session-fix）

> 目的: duplicate（重複ロジック）と navigation drift（参照の散逸）を削る方針を確定する。
> 特に **projection ロジックを 3 経路で重複させない**（`field-precedence.ts` への集約・CORR-8）。
> Sheets 経路と Form 経路の書込モデル合流後の共通化（CORR-1）の重複排除観点を含む。
> 変更内容は `対象 / Before / After / 理由` テーブルで記録する（Feedback RT-03）。

---

## 0. リファクタリング原則

1. **集約 > 散逸**: 同一意図のロジックは 1 箇所に置き、呼び出し側は DI / import するだけ（CORR-8 / Clean Code SRP）。
2. **新機構を生やさない**: 既存 repository write 関数・既存 primitive・既存純関数置き場を再利用（YAGNI・Phase 3 §3 で高コスト機構を初期スコープから除外済）。
3. **外形契約不変**: public read endpoint のレスポンス shape は変えず、内部解決規則のみ差し替える（AC-6）。
4. **GREEN 維持**: リファクタは Phase 5 GREEN 後に行い、§4 の verify を都度緑に保つ（Continuous Delivery）。

---

## 1. projection ロジックの集約（CORR-8・最重要）

### 1.1 問題（リファクタ前の構造リスク）

表示が `response_fields` を読む経路は **3 系統**（Phase 1 §5.6 実測）:

- `use-cases/public/list-public-members.ts`（`SUMMARY_KEYS` を独自に読む）
- `use-cases/public/get-public-member-profile.ts`（`listFieldsByResponseId` 全 stableKey）
- `repository/_shared/builder.ts`（`buildMemberProfile` / `buildAdminMemberDetailView` / `buildPublicMemberProfile`）

ここに L1 override マージを**各経路で個別に書く**と、「override 優先」「value=null は明示クリア」「override-only key の追加」
というルールが 3 箇所に重複（duplicate）し、片方だけ修正される drift が起きる。

### 1.2 方針（集約）

**純関数 `apps/api/src/use-cases/_shared/field-precedence.ts` を唯一の正本**とし、3 経路はこれを呼ぶだけにする。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| projection ルール | （未実装・3 経路に分散実装される設計リスク）| `field-precedence.ts` に `resolveFieldValue` / `mergeFieldProjection` / `toOverrideMap` を 1 セット集約 | duplicate 排除・branch 100% を 1 spec で担保（CORR-8）|
| `list-public-members.ts` | `SUMMARY_KEYS` を response_fields から直接 parse して item 構築 | override を batch 取得し各 SUMMARY_KEY を `resolveFieldValue` で解決 | override 適用ロジックを自前に書かない |
| `get-public-member-profile.ts` | fieldRows から view 組成 | `mergeFieldProjection(fieldRows, overrides)` を通してから組成 | 同上 |
| `builder.ts`（3 builder）| `fields` を `buildSections` に直渡し | `mergeFieldProjection` を通してから `buildSections` | 同上・3 builder で同一関数 |

> drift 防止チェック: 実装後 `grep -rn "value_json === null\|source: \"override\"" apps/api/src` が
> **`field-precedence.ts` 内のみ**にヒットすること（projection 判定ロジックの再実装が他ファイルに無い）。

### 1.3 navigation drift 防止

- override 取得 helper（`listOverridesByMemberId` / `listOverridesByMemberIds`）は `repository/memberFieldOverrides.ts` の
  単一 export とし、各 use-case が同じ関数を import する（read 経路の散逸を防ぐ）。
- list は N+1 を避けるため `listOverridesByMemberIds`（複数 id 一括）を使う（detail/builder は単一 id 版）。

---

## 2. Sheets / Form 書込モデルの共通化（CORR-1）

### 2.1 問題

現行 `sync-sheets-to-d1.ts` は存在しない `member_responses` 列へ INSERT して全失敗（Phase 1 §5.3）。
これを Form 経路（`processResponse`）と同じ書込モデルに合流させる際、**seed の書込手続きを Sheets 専用に新規実装**すると、
Form 経路の `createMemberWithStatus` / `upsertResponse` / `upsertKnownField` / `setConsentSnapshot` と重複する。

### 2.2 方針（既存 write 関数を再利用して合流）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `sync-sheets-to-d1.ts` `upsertMembers` | `UPSERT_COLUMNS` / `ROW_FIELD_ORDER` で**存在しない列**へ INSERT（全失敗）| 削除し、`seedMemberFromSheetRow` が **Form 経路と同じ既存 write 関数**（`createMemberWithStatus`/`upsertResponse`/`upsertKnownField`/`setConsentSnapshot`/`markSeedImported`）を呼ぶ | 構造バグ解消 + write モデルの単一化（重複実装を作らない・FB-SDK-07-1 既存資産再利用）|
| `sheets-to-members.ts` 出力 | `MemberRow`（個別フィールド・snake_case 列前提）| `SheetSeedRow`（`answersByStableKey` / consent / extraByLabel = `MemberResponse` 互換 shape）| Sheets/Form の seed が同一 write 関数を共有できる形へ正規化 |
| consent 正規化 | `CONSENT_MAP`（実値欠落）| 実値 `"同意する（掲載ok）"` 等を追加（RC-2）| 既存 map の拡張で重複関数を作らない |
| zone/status 正規化 | （無し → enum 不一致）| `UBM_ZONE_MAP` / `UBM_MEMBERSHIP_MAP` を mapper 内に閉じ込め | 正規化責務を ingestion 1 箇所に集約（表示側に正規化を漏らさない）|

### 2.3 「seed 専用 helper」をどこに置くか

- `seedMemberFromSheetRow` は `sync-sheets-to-d1.ts`（または `jobs/mappers` 隣接）に置く。**Form 経路の `processResponse` をそのまま呼ばない**
  （Form 経路は `current_response_id` 切替・tag queue・status 連携など Sheets seed に不要な責務を含むため）。
- 共通化の単位は「**個々の repository write 関数**」レベルに留める（`processResponse` 全体を共有すると Sheets に不要な副作用が混入する）。
  → 過剰な共通化（God 関数化）を避ける = 適切な粒度の DRY。

### 2.4 import-once ガードの単一化

- import-once 判定は `findIdentityByEmail`（既存）の有無に等価（Phase 2 §2.1）。Sheets 側のみで判定し、
  Form 側はガードしない（本人更新経路の保全・DEC-3）。判定ロジックを Sheets/Form で重複させない。

---

## 3. Lane E のリファクタ（fail-safe の重複排除）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `session-guard.ts` | DB lookup 例外がそのまま伝播し 500 になる箇所が不明瞭 | DB 例外を try/catch で**意図的に**捕捉し、internal error は 500、member 不在は 401（fail-closed）に明示分類 | 「握り潰し」と「正しい 500」を区別（CORR-2）|
| `profile/page.tsx` | `MEMBER_SESSION_404` 以外を**単一の汎用エラー**で受ける（文言混在）| `switch (error.code)` で 404 / FAILED / default に分離 | error code 1 箇所判定・文言の navigation drift 防止 |
| error UI | 各分岐で `SectionError` を別実装する誘惑 | 既存 `SectionError` primitive に props（title/detail/action）を渡すのみ | 新規 error コンポーネントを生やさない（FB-SDK-07-1）|

---

## 4. リファクタ後 verify（GREEN 維持・直列締め）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint           # lint-boundaries（D1 境界）+ lint-stablekey + verify:no-inline-style 含む
# 対象 vitest（Phase 7 §3 のコマンド・branch 100% を field-precedence で確認）
# duplicate チェック（projection 判定の再実装が他ファイルに無いこと）
grep -rn 'source: "override"' apps/api/src | grep -v 'field-precedence' || echo "OK: projection 判定は field-precedence に集約"
```

> リファクタは挙動を変えない（テストが Before/After で同一 GREEN）。挙動変更を伴う場合は Phase 5 実装に差し戻す。

---

## 5. 非対象（リファクタしない）

| 非対象 | 理由 |
|--------|------|
| Form 経路 `processResponse` の構造 | 正しく動作中（Phase 3 §6）。Sheets を寄せるのみで Form 側は触らない（変更面最小化）|
| 既存 `SUMMARY_KEYS` 定義 / public endpoint shape | 外形契約不変（AC-6）|
| 別 provenance テーブル化 | Phase 3 §3 で不採用確定（列追加で代替・冗長排除）|
| 汎用 alias テーブル駆動 label 解決 | YAGNI（Phase 3 §3・実ラベル直接是正のみ）。将来候補は Phase 12 未タスク化判断（phase-10 §MINOR 参照）|
