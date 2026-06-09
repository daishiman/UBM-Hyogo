---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 7
name: カバレッジ設計
status: completed
updated: 2026-06-09
---

# Phase 7 — カバレッジ設計（member-data-source-precedence-and-profile-session-fix）

> 目的: 本タスクの**変更ファイル/変更ブロックに限定**した coverage 対象範囲を確定し、Lane B/C/E の concern と
> dependency edge を可視化する。純関数 `field-precedence.ts` は line/branch 100% を目標とし、実測欄を用意する。
> 広域 coverage 指定（`apps/**` 全件閾値）にはしない（Feedback BEFORE-QUIT-002 / BEFORE-QUIT-005）。

---

## 0. 計測方針（実測した既存設定に整合）

本リポジトリは **モノレポルート単一 vitest config**（`vitest.config.ts` / `vitest.d1.config.ts`）で動作し、
各 app は `--root=../..` でサブパスを指定する方式（`apps/api/package.json` / `apps/web/package.json` 実測）。
SSOT §9 の「web vitest は `--root ../..` 必須」はこの構造に由来する。

| 区分 | 既存 coverage script | provider |
|------|----------------------|----------|
| api unit | `apps/api: pnpm test:coverage:unit`（`--config=vitest.config.ts --coverage`）| v8 |
| api d1 | `apps/api: pnpm test:coverage:d1`（`--config=vitest.d1.config.ts --coverage`）| v8 |
| api merge | `apps/api: pnpm test:coverage`（unit + d1 を `scripts/coverage-merge.mjs` で合算）| v8 |
| web | `apps/web: pnpm test:coverage`（`--coverage.include=apps/web/src/**`）| v8 |

> **重要**: coverage は `--coverage.include` を**本タスクの変更ファイルに絞って**計測する（下記 §3 のコマンド）。
> リポジトリ全体の閾値 gate を新設しない（YAGNI・既存 coverage-guard の運用に委ねる）。

---

## 1. coverage 対象範囲（変更ファイル/ブロック限定）

Phase 1 §6 inventory のうち **コードを含むファイル**のみを対象とする。docs / migration SQL / config は coverage 対象外。

### 1.1 API（`apps/api` — `vitest.config.ts` + 必要に応じ `vitest.d1.config.ts`）

| # | 対象ファイル | Lane | 計測の主眼 | 目標 |
|---|--------------|------|-----------|------|
| 1 | `apps/api/src/use-cases/_shared/field-precedence.ts`（新規・純関数）| C | `resolveFieldValue` / `mergeFieldProjection` / `toOverrideMap` の全分岐 | **line 100% / branch 100%** |
| 2 | `apps/api/src/repository/memberFieldOverrides.ts`（新規）| A | `upsertOverride`(null/値) / `deleteOverride` / `listByMemberId` / `listByMemberIds`(空配列含む) | line ≥ 90% / 全 export 関数被覆 |
| 3 | `apps/api/src/repository/identities.ts`（編集ブロックのみ）| A | `markSeedImported`（seed_source NULL→set / 既存→no-op）/ `getSeedProvenance`(有/無) | 追加ブロック branch 100% |
| 4 | `apps/api/src/jobs/mappers/sheets-to-members.ts`（編集）| B | `DB_FIELD_MAP` 全ラベル一致 / `CONSENT_MAP` 実値（"同意する（掲載OK）"含む）/ zone/status 正規化 / 出力 `SheetSeedRow` shape / unmapped→extraByLabel | 変更ブロック branch 100%（マップ網羅） |
| 5 | `apps/api/src/jobs/sync-sheets-to-d1.ts`（編集）| B | import-once（既存 identity → skip / 未登録 → seed）/ `seedMemberFromSheetRow` の identity+response+fields+consent+provenance 5 副作用 | import-once 2 分岐 + seed 経路被覆 |
| 6 | `apps/api/src/jobs/sync-forms-responses.ts`（編集ブロックのみ）| B | 新規 identity 時 `markSeedImported("forms")` 1 回 / 既存再回答は従来通り（override 非 touch）| 追加分岐 branch 100% |
| 7 | `apps/api/src/use-cases/public/list-public-members.ts`（編集）| C | override batch 取得 → SUMMARY_KEYS projection マージ（override 有/無）/ 外形 shape 不変 | 変更ブロック被覆 |
| 8 | `apps/api/src/use-cases/public/get-public-member-profile.ts`（編集）| C | `mergeFieldProjection` 適用 / 公開フィルタ不変 | 変更ブロック被覆 |
| 9 | `apps/api/src/repository/_shared/builder.ts`（編集ブロック）| C | `buildMemberProfile` / `buildAdminMemberDetailView` / `buildPublicMemberProfile` の override マージ前段 | 追加 merge 呼び出し被覆 |
| 10 | `apps/api/src/routes/admin/member-fields.ts`（新規）| C | GET（一覧 + effective）/ PUT（200 upsert / 404 identity 無 / value=null クリア / audit append）| route 全分岐 contract 被覆 |
| 11 | admin router mount（`routes/admin/_shared.ts` 等・編集）| C | `/member-fields` mount が存在し requireAdmin 経由 | mount 行被覆（contract で間接） |
| 12 | `apps/api/src/routes/me/index.ts`（編集ブロック）| E | `/me/profile` の 404（PROFILE_UNAVAILABLE）/ 会員未登録区別 | 変更分岐 branch 100% |
| 13 | `apps/api/src/middleware/session-guard.ts`（編集ブロック）| E | DB 例外を握り潰さず 500 維持 / member 不在 401 維持（fail-closed）| 追加 try/catch branch 100% |

> #5・#6 は D1 を触る contract のため、必要なら `vitest.d1.config.ts`（`test:coverage:d1`）側で計測し merge する。
> 純関数・mapper（#1・#4）は in-memory で unit 計測可（`vitest.config.ts`）。

### 1.2 packages（`packages/integrations/google`）

| # | 対象ファイル | Lane | 計測の主眼 | 目標 |
|---|--------------|------|-----------|------|
| 14 | `packages/integrations/google/src/forms/mapper.ts`（編集）| B | `STABLE_KEY_BY_LABEL` の `X（Twitter）URL`→urlX / `その他のSNS・URL`→urlOthers が一致（slug fallback しない）| 変更 2 ラベルの解決 branch 被覆 |

### 1.3 web（`apps/web` — `--root ../..` 必須）

| # | 対象ファイル | Lane | 計測の主眼 | 目標 |
|---|--------------|------|-----------|------|
| 15 | `apps/web/src/components/admin/MemberFieldEditor.tsx`（新規）| D | 初期値 = effectiveValue / dirty 判定 / value=null クリア送信 / effectiveValue prop 変更時 re-sync（useEffect）| line ≥ 85% / 主要 branch 被覆 |
| 16 | `apps/web/app/(member)/profile/page.tsx`（編集ブロック）| E | エラー分岐 3 系統（MEMBER_SESSION_404 / _FAILED / default）の文言分離 | 追加 switch 全 case 被覆 |
| 17 | `apps/web/src/lib/fetch/transport.ts`（編集・必要時）| E | transport 未解決 → `_FAILED` に倒る経路（変更がある場合のみ）| 変更ブロック被覆 |
| 18 | admin client（`apps/web/src/lib/api/admin/*`・編集）| D | `PUT /admin/member-fields/:memberId` 呼び出し client | 追加関数被覆 |

> web component の coverage は behavior（dirty / clear / re-sync）が被覆されれば line% は副次的とし、過剰な
> snapshot 量産はしない（Feedback RT 系・最小 focused test）。

---

## 2. concern × dependency edge coverage 可視化

「変更が起点となる concern」と「それが依存/被依存するエッジ」を 1 対 1 でテストが押さえることを保証する。

### 2.1 Lane B（取込・ラベル/consent/import-once/値正規化）

| concern | dependency edge（呼び出し関係）| 押さえる spec | 被覆する分岐 |
|---------|-------------------------------|---------------|--------------|
| ラベル→stableKey マップ（Sheets）| `sheets-to-members.mapSheetRows` → `DB_FIELD_MAP` | `sheets-to-members.spec.ts` | 全 31 ラベル一致 / unmapped→extraByLabel |
| consent 実値正規化 | `mapSheetRows` → `CONSENT_MAP[value.trim().toLowerCase()]` | `sheets-to-members.spec.ts` | "同意する（掲載OK）"→consented / "同意する"→consented / "いいえ"→declined / 未知→unknown |
| zone/status 値ドメイン正規化 | `mapSheetRows` → `UBM_ZONE_MAP` / `UBM_MEMBERSHIP_MAP` | `sheets-to-members.spec.ts` | "0→1"→"0_to_1" / "会員"→"member" / 未知→保持 or null |
| Sheets 書込モデル合流 | `sync-sheets-to-d1.seedMemberFromSheetRow` → `createMemberWithStatus`/`upsertResponse`/`upsertKnownField`/`setConsentSnapshot`/`markSeedImported` | `sync-sheets-to-d1.spec.ts` | 5 副作用すべて呼ばれる / response_fields に書かれる（AC-1） |
| import-once（Sheets）| `sync-sheets-to-d1` → `findIdentityByEmail` | `sync-sheets-to-d1.spec.ts` | 既存→skip（書込 0）/ 未登録→seed |
| Form 経路 provenance | `sync-forms-responses.processResponse` → `markSeedImported("forms")` | `sync-forms-responses.spec.ts` | 新規 identity→1 回 mark / 既存→mark せず override 非 touch |
| Form ラベル是正 | `mapper.STABLE_KEY_BY_LABEL` | `mapper.spec.ts` | `X（Twitter）URL`→urlX / `その他のSNS・URL`→urlOthers |

### 2.2 Lane C（projection / endpoint）

| concern | dependency edge | 押さえる spec | 被覆する分岐 |
|---------|-----------------|---------------|--------------|
| 純関数 projection | `resolveFieldValue` / `mergeFieldProjection` / `toOverrideMap`（依存 0・純粋）| `field-precedence.spec.ts` | **下記 §2.4 真理値表（branch 100%）** |
| list への適用 | `list-public-members` → `listOverridesByMemberIds` → `resolveFieldValue` | `list-public-members.spec.ts` | override 有→override 値 / 無→response 値 / 外形 shape 不変 |
| detail への適用 | `get-public-member-profile` → `listOverridesByMemberId` → `mergeFieldProjection` | `get-public-member-profile.spec.ts` | merge 後 view 組成 / 公開フィルタ不変 |
| builder への適用 | `builder.build*` → `listOverridesByMemberId` → `mergeFieldProjection` | `builder.spec.ts` | profile / admin detail / public で override マージ |
| admin override 書込 | `member-fields PUT` → `upsertOverride` / `auditLogProvider.append` | `member-fields.contract.spec.ts` | 200 upsert / 404 identity 無 / value=null クリア / audit 1 件 |

### 2.3 Lane E（fail-safe 分岐）

| concern | dependency edge | 押さえる spec | 被覆する分岐 |
|---------|-----------------|---------------|--------------|
| session-guard DB 例外分類 | `sessionGuard` → `findIdentityByMemberId`/`getStatus` throw | `session-guard.spec.ts` | 例外→500（握り潰さない）/ member 不在→401（fail-closed 維持） |
| /me 応答整理 | `routes/me/index` `GET /me/profile` | `me/index.contract.spec.ts` | 会員未登録区別 / 404（PROFILE_UNAVAILABLE） |
| web エラー分岐 | `profile/page.tsx` ← `safeServerFetch` code | `profile` web spec | `MEMBER_SESSION_404` / `_FAILED` / default の 3 文言 |

### 2.4 純関数 `field-precedence.ts` 真理値表（branch 100% 目標）

`resolveFieldValue(stableKey, overrides, responseFields)`:

| ケース | overrides.has(key) | overrides.get | responseFields.get | 期待返り値 |
|--------|--------------------|--------------|--------------------|-----------|
| C1 | true | 値 | （無関係）| override 値 |
| C2 | true | null（明示クリア）| 値あり | null（クリア優先）|
| C3 | false | — | 値 | response 値 |
| C4 | false | — | undefined | null |

`mergeFieldProjection(fields, overrides)`:

| ケース | fields に key | overrides に key | override 値 | 期待結果 |
|--------|---------------|------------------|------------|----------|
| M1 | あり | なし | — | response（source="response"）|
| M2 | あり | あり | 値 | override で置換（source="override"）|
| M3 | あり | あり | null | 結果から除外（明示クリア）|
| M4 | なし | あり | 値 | 追加（override-only key・source="override"）|
| M5 | なし | あり | null | 何も出さない（除外）|

`toOverrideMap(rows)`: 空配列 / 複数行 / value_json=null 行を含む Map 構築。

> C1..C4 + M1..M5 + toOverrideMap の 3 系統を `field-precedence.spec.ts` で網羅 → branch 100% を満たす設計。

---

## 3. 計測コマンド（DoD・対象限定）

### 3.1 API（unit・純関数/mapper/use-case）— 変更ファイル include 限定

```bash
cd apps/api && mise exec -- pnpm vitest run \
  --config=../../vitest.config.ts --root=../.. --coverage --coverage.reportsDirectory=coverage/task \
  --coverage.include="apps/api/src/use-cases/_shared/field-precedence.ts" \
  --coverage.include="apps/api/src/repository/memberFieldOverrides.ts" \
  --coverage.include="apps/api/src/jobs/mappers/sheets-to-members.ts" \
  --coverage.include="apps/api/src/use-cases/public/list-public-members.ts" \
  --coverage.include="apps/api/src/use-cases/public/get-public-member-profile.ts" \
  --coverage.include="apps/api/src/repository/_shared/builder.ts" \
  --coverage.include="apps/api/src/routes/admin/member-fields.ts" \
  --coverage.include="apps/api/src/routes/me/index.ts" \
  --coverage.include="apps/api/src/middleware/session-guard.ts" \
  apps/api/src/use-cases/_shared/field-precedence.spec.ts \
  apps/api/src/repository/memberFieldOverrides.spec.ts \
  apps/api/src/jobs/mappers/sheets-to-members.spec.ts \
  apps/api/src/use-cases/public/list-public-members.spec.ts \
  apps/api/src/use-cases/public/get-public-member-profile.spec.ts \
  apps/api/src/repository/_shared/builder.spec.ts \
  apps/api/src/routes/admin/member-fields.contract.spec.ts \
  apps/api/src/routes/me/index.contract.spec.ts \
  apps/api/src/middleware/session-guard.spec.ts
```

### 3.2 API（D1 contract・import-once / seed 副作用）

D1 を触る `sync-sheets-to-d1` / `sync-forms-responses` / `identities` provenance は `vitest.d1.config.ts` 側で計測:

```bash
cd apps/api && mise exec -- pnpm vitest run \
  --config=../../vitest.d1.config.ts --root=../.. --coverage --coverage.reportsDirectory=coverage/task-d1 \
  --coverage.include="apps/api/src/jobs/sync-sheets-to-d1.ts" \
  --coverage.include="apps/api/src/jobs/sync-forms-responses.ts" \
  --coverage.include="apps/api/src/repository/identities.ts" \
  apps/api/src/jobs/sync-sheets-to-d1.spec.ts \
  apps/api/src/jobs/sync-forms-responses.spec.ts \
  apps/api/src/repository/identities.spec.ts
```
> spec が unit config 側に置かれる場合は §3.1 へ統合。glob disjoint 制約（`vitest.config.ts` と `vitest.d1.config.ts` の include は重複禁止・root config コメント L57 実測）に従い、D1 fixture を使うものだけ d1 config へ。

### 3.3 packages

```bash
cd packages/integrations/google && mise exec -- pnpm vitest run \
  --config=../../../vitest.config.ts --root=../../.. --coverage \
  --coverage.include="packages/integrations/google/src/forms/mapper.ts" \
  packages/integrations/google/src/forms/mapper.spec.ts
```

### 3.4 web（`--root ../..` 必須・変更ファイル include 限定）

```bash
cd apps/web && mise exec -- pnpm vitest run \
  --config=../../vitest.config.ts --root=../.. --coverage --coverage.reportsDirectory=coverage/task \
  --coverage.include="apps/web/src/components/admin/MemberFieldEditor.tsx" \
  --coverage.include="apps/web/app/(member)/profile/page.tsx" \
  --coverage.include="apps/web/src/lib/fetch/transport.ts" \
  'apps/web/app/(member)/profile' \
  apps/web/src/components/admin/MemberFieldEditor.spec.tsx
```

---

## 4. 実測欄（実装フェーズで埋める）

> spec 段階では未計測。**実装時（Phase 5 GREEN 後）に下表へ実測値を記入**する。

| ファイル | line % | branch % | 目標達成 | 備考 |
|----------|--------|----------|----------|------|
| `field-precedence.ts` | _実装時_ | _実装時_ | line 100 / branch 100 | C1..C4 + M1..M5 + toOverrideMap |
| `memberFieldOverrides.ts` | _実装時_ | _実装時_ | line ≥ 90 / 全 export 被覆 | — |
| `identities.ts`（追加ブロック）| _実装時_ | _実装時_ | 追加 branch 100 | markSeedImported no-op 分岐含む |
| `sheets-to-members.ts`（変更ブロック）| _実装時_ | _実装時_ | マップ branch 100 | consent/zone/status 網羅 |
| `sync-sheets-to-d1.ts`（変更ブロック）| _実装時_ | _実装時_ | import-once 2 分岐 + seed | — |
| `sync-forms-responses.ts`（追加ブロック）| _実装時_ | _実装時_ | 追加 branch 100 | — |
| `list-public-members.ts`（変更ブロック）| _実装時_ | _実装時_ | override 有/無 | — |
| `get-public-member-profile.ts`（変更ブロック）| _実装時_ | _実装時_ | merge 適用 | — |
| `builder.ts`（変更ブロック）| _実装時_ | _実装時_ | 3 builder で merge | — |
| `member-fields.ts`（route）| _実装時_ | _実装時_ | 200/404/clear/audit | — |
| `me/index.ts`（変更ブロック）| _実装時_ | _実装時_ | 会員未登録区別 | — |
| `session-guard.ts`（変更ブロック）| _実装時_ | _実装時_ | 例外 500 / 不在 401 | — |
| `mapper.ts`（変更 2 ラベル）| _実装時_ | _実装時_ | 2 ラベル解決 | — |
| `MemberFieldEditor.tsx` | _実装時_ | _実装時_ | line ≥ 85 | dirty/clear/re-sync |
| `profile/page.tsx`（変更ブロック）| _実装時_ | _実装時_ | switch 3 case | — |

---

## 5. 非対象（明示）

| 非対象 | 理由 |
|--------|------|
| `apps/api/migrations/0028_*.sql` | SQL DDL は実行で検証（migration apply・user-gated）。coverage 対象外。 |
| `apps/web/app/(admin)/admin/members/[id]/...`（editor 配置箇所のページ統合）| 配置のみの場合は coverage 寄与小。behavior は `MemberFieldEditor.spec.tsx` で被覆。 |
| リポジトリ全体の閾値 gate 新設 | YAGNI（既存 coverage-guard 運用に委ねる・広域指定回避 Feedback BEFORE-QUIT-005）|
| 既存 Form 経路の非変更ブロック | 本タスクで触らない行は対象外（変更ブロック限定原則）|
