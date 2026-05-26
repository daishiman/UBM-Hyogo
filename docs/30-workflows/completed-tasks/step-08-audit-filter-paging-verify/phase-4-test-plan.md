# Phase 4: テスト計画（既存テスト inventory + targeted regression run 設計）

**[実装区分: 実装仕様書（verify_existing）]**

> Phase 3 §1 の再解釈方針に従い、本 Phase は実装タスクの「TDD RED」を **「既存テストの inventory 化 + targeted regression run の設計」** に置き換える。新規 failing test は書かない。既存 `*.spec.*` を「回帰の正本」として走らせる手順・期待結果を確定する。

## 1. 回帰対象テスト inventory（正本）

| # | テスト | パス | 行数 | lane | 検証層 |
|---|--------|------|------|------|--------|
| T1 | Web component | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 423 | A | masking / paging href / JST / summarize / render 分岐 |
| T2 | Web page smoke | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 14 | A | page module import smoke |
| T3 | API contract | `apps/api/src/routes/admin/audit.contract.spec.ts` | 303 | B | query validation / cursor / date range / masking / nextCursor |
| T4 | E2E smoke | `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` | 151 | E2E | route 操作 smoke（Lane C 補助・任意） |
| T5 | Visual | `visual-full` snapshot `admin-audit-{desktop,tablet,mobile}` | — | 流用 | 既存 baseline 流用（新規撮影なし） |

## 2. FR ↔ 既存テストケース対応（見取り図）

| FR（Phase 1 §4） | 既存テストケース | テスト |
|------|-----------------|--------|
| FR-1 filter 7 項目の `defaultValue` 反映 + GET submit URL 同期 | `defaultValue` 反映 / `action="/admin/audit"` form / 空文字フィールド skip | T1 |
| FR-2 cursor paging（`buildAuditHref` filter 保持 / `nextCursor=null` 時「次のページはありません」） | paging href（全空→最小URL / cursor 空文字・null・未指定スキップ）/ render 分岐（nextCursor=null）| T1, T3（nextCursor 生成）|
| FR-3 PII masking（key/value 両パターン再帰マスク） | masking（nested PII / null・undefined / primitive / 配列再帰 / 多段 nest / PII key 非文字列 String化）| T1（UI）, T3（API redact）|
| FR-4 API query 400 分岐 + 正常応答 schema | query validation（不正 email / limit 範囲外 / 不正 cursor / 不正 date range / from>=to）/ `AdminAuditListResponseZ` 準拠 | T3 |
| FR-5 JST→UTC ISO 一貫変換（from=start / to=end-exclusive） | date range（`jstInputToUtcIso` from=start, to=end-exclusive）/ formatJst（JST 跨ぎ）| T3, T1 |
| FR-6 認可（`requireAdmin`、mutation surface なし） | render 分岐（編集・削除・再実行ボタンが存在しないこと）| T1（mutation 不在）, T3（middleware 経路）|

> 全 FR が既存テストで被覆される見込み。1:1 の厳密突合（partial 検出）は Phase 9 coverage map で確定する。

## 3. targeted regression run コマンド（SIGKILL 回避・ファイル限定）

```bash
# STEP 0: 依存整合（worktree 直後の esbuild darwin mismatch 予防 / FB-MSO-002）
mise exec -- pnpm install

# STEP 1: Lane A — Web component / page（対象ファイル限定 run）
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  "app/(admin)/admin/audit/page.page.spec.ts"

# STEP 2: Lane B — API contract（対象ファイル限定 run）
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  src/routes/admin/audit.contract.spec.ts
```

> filter 引数なしの全件 `pnpm test` はメモリ制約で SIGKILL のリスクがあるため、上記のとおり Phase 1 §2 で列挙した対象ファイルに限定して実行する（Phase 3 §4 リスク対策）。
> Lane A/B は相互依存がないため別ターミナルで並列実行可（Phase 2 §2）。

## 4. 期待結果（全 PASS 見込み）

| run | 対象 | 期待 |
|-----|------|------|
| STEP 1 | T1 (`AuditLogPanel.component.spec.tsx`) + T2 (`page.page.spec.ts`) | 2 ファイル全 PASS。失敗 0 件 |
| STEP 2 | T3 (`audit.contract.spec.ts`) | 1 ファイル全 PASS。失敗 0 件 |

- 期待される失敗件数: **0**。失敗が出た場合は監査結論（「✅ OK」）と実コードが乖離している兆候であり、Phase 5 の「コード変更ゼロ」前提が崩れるため、原因を Phase 10 MINOR/MAJOR 追跡に記録する。
- 新規テスト追加は本 Phase では行わない（fail path カバレッジ点検は Phase 6 の責務）。

## 5. 検証ケース内訳（T1 / T3 の網羅範囲）

| グループ | T1（Web component）が持つケース |
|---------|------------------------------|
| masking | nested PII / null・undefined / primitive / 配列再帰 / 多段 nest / PII key 非文字列 String化 |
| paging href | 全空→最小URL / cursor 空文字・null・未指定スキップ / 空文字フィールド skip |
| formatJst | JST 跨ぎ / 不正文字列そのまま / 空文字 |
| maskAuditText | null / undefined / 空 → "system" |
| summarizeAuditJson | null→"なし" / 配列→"N items" / 空obj→"empty object" / 4キー以下カンマ / 4超→"+N" / primitive→typeof |
| render 分岐 | nextCursor=null 時「次のページはありません」/ before・after summary / targetType・targetId null→"-" / parseError 警告 / defaultValue 反映 / empty・error state / 編集・削除・再実行ボタン不在 |

| グループ | T3（API contract）が持つケース |
|---------|-----------------------------|
| query validation | action / actorEmail(email) / targetType / targetId / from / to / cursor / limit(1..100 default50) の検証、不正値 400 |
| cursor | `encodeAuditCursor` ↔ `decodeAuditCursor` の round-trip、不正 cursor → 400 |
| date range | `jstInputToUtcIso`（from=start, to=end-exclusive）、from>=to → 400 |
| masking | `parseAndMask` / `toAdminMaskedValue` / `redactAuditPayload` / `redactString` |
| nextCursor | `listFiltered({limit:limit+1})` で `rows.length>limit` → nextCursor 生成、それ以外 null |

## 6. 完了条件（Phase 4 DoD）

- [ ] 回帰対象テスト inventory（§1、T1〜T5）を確定した。
- [ ] FR-1〜FR-6 と既存テストケースの見取り図（§2）を作成した。
- [ ] targeted regression run コマンド（§3、ファイル限定）を確定した。
- [ ] 期待結果（§4、全 PASS / 失敗 0 件見込み）を明記した。
- [ ] 新規 failing test を書いていない（verify_existing 方針を維持した）。
