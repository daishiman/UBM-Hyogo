# Phase 7: カバレッジ（変更範囲の coverage 実測）

**[実装区分: 実装仕様書（`verify_existing`）]**

> 監査タスク用テンプレ（`phase-template-audit-task.md`）§Phase 7 を「**変更行の coverage 可視化**」から「**監査対象ファイル群の既存テストによる line/branch coverage 実測**」へ再解釈する。
> `verify_existing` のため新規変更行は存在しない（NFR-5 / Phase 5 で `git diff dev...HEAD -- apps/` が空であることを証跡化）。したがって計測対象は「変更行」ではなく「監査対象ファイル群（既存実装）」とし、全体 % ではなく**対象ファイルに限定した line/branch 実測値**を残す（FB-Feedback5 / BEFORE-QUIT-002：広域カバレッジ % は変動が大きく回帰保証の根拠にならないため、対象ファイル限定の実測に固定する）。

## 1. 計測対象ファイル（coverage の縦軸）

| # | レイヤ | パス | 主要関数 | 担保テスト |
|---|--------|------|---------|-----------|
| C-1 | Web component | `apps/web/src/components/admin/AuditLogPanel.tsx` | `AuditLogPanel` / `maskAuditJson` / `maskAuditText` / `summarizeAuditJson` / `formatJst` / `buildAuditHref` / `JsonDisclosure` / `AuditRow` | `AuditLogPanel.component.spec.tsx`（423 行） |
| C-2 | Web util | `apps/web/app/(admin)/admin/audit/audit-query.ts` | `jstLocalToUtcIso` | `AuditLogPanel.component.spec.tsx` 内の JST 変換ケース + `page.page.spec.ts` 経由 |
| C-3 | Web route | `apps/web/app/(admin)/admin/audit/page.tsx` | `buildAuditApiPath` / Server Component render | `page.page.spec.ts`（14 行・smoke） |
| C-4 | API route | `apps/api/src/routes/admin/audit.ts` | `createAdminAuditRoute` / `ListAuditQueryZ` / `encodeAuditCursor` / `decodeAuditCursor` / `jstInputToUtcIso` / `parseAndMask` / `toAdminMaskedValue` / `toResponseItem` | `audit.contract.spec.ts`（303 行） |
| C-5 | API redact | `apps/api/src/lib/audit/redact.ts` | `redactAuditPayload` / `redactString` | `audit.contract.spec.ts`（masking ケース経由） |

> `loading.tsx`（`AdminAuditLoading`）は Suspense fallback の静的 markup のみで分岐を持たないため coverage 縦軸からは除外し、Phase 9 の不変条件チェックで存在のみ確認する。

## 2. coverage 計測コマンド（対象ファイル限定）

全体 % ではなく、対象ファイルの line/branch 実測値を観測するため `--coverage` を対象ファイルに絞って実行する。

```bash
# 依存整合（worktree 直後の esbuild mismatch 予防 / FB-MSO-002）
mise exec -- pnpm install

# Lane A: Web 対象ファイルの coverage 実測（repo root から実行）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/components/admin/AuditLogPanel.tsx' \
  --coverage.include='apps/web/app/(admin)/admin/audit/audit-query.ts' \
  --coverage.include='apps/web/app/(admin)/admin/audit/page.tsx' \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  'apps/web/app/(admin)/admin/audit/page.page.spec.ts'

# Lane B: API 対象ファイルの coverage 実測（contract は D1 config lane）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  --coverage \
  --coverage.include='apps/api/src/routes/admin/audit.ts' \
  --coverage.include='apps/api/src/lib/audit/redact.ts' \
  apps/api/src/routes/admin/audit.contract.spec.ts
```

> `--coverage.include` を対象ファイルに限定することで、リポジトリ広域 % の変動に左右されず、回帰保証の根拠として対象ファイル単体の line/branch 実測を残す。実行ログの coverage テーブルから対象 5 ファイルの行のみを §3 に転記する。

## 3. coverage 実測記録

実行日: 2026-05-24 (JST)

証跡:

- `outputs/phase-11/evidence/web-coverage.log`
- `outputs/phase-11/evidence/api-coverage.log`

| ファイル | Line % | Branch % | Func % | 備考 |
|----------|--------|----------|--------|-------------|
| `AuditLogPanel.tsx` | 100 | 98.76 | 100 | branch 未到達は line 84 の defensive branch のみ。FR-1/2/3/5 は full |
| `audit-query.ts` | 100 | 100 | 100 | `jstLocalToUtcIso` の空/正常/境界（end-exclusive）分岐を担保 |
| `page.tsx` | N/A | N/A | N/A | include 対象に入れたが実測表に個別行が出なかった。page smoke は `page.page.spec.ts` 2 tests PASS で AC-1 側に記録 |
| `audit.ts` | 96.48 | 87.23 | 100 | query validation/cursor/date range/masking/nextCursor を contract spec 9 tests が担保 |
| `redact.ts` | 81.9 | 81.57 | 66.66 | API contract 経由で raw JSON 非露出・broken JSON・redaction 経路を担保。未到達は cold branches |

> 実測値が著しく低い（例: branch < 80%）ファイルがあれば、その未到達 branch を §4 に列挙し、Phase 9 の coverage map で FR との対応を再点検する。`verify_existing` のため新規テスト追加は原則しないが、監査主張（FR-1〜FR-6）に対応する branch が未到達であれば Phase 6 の追補判断へ差し戻す。

## 4. 未到達 branch の点検結果

| ファイル | 未到達 branch | FR 対応 | 判定（許容 / Phase 6 差し戻し） |
|----------|--------------|---------|-------------------------------|
| `AuditLogPanel.tsx` | line 84 | FR-3 defensive object masking branch | 許容。statement/line/function 100%、FR-3 は key/value/recurse/raw PII 非露出で担保済み |
| `audit.ts` | lines 116-118, 200-204 | FR-4/FR-5 周辺の defensive parse/format branch | 許容。contract 9 tests が validation/cursor/date/masking を担保 |
| `redact.ts` | lines 113, 135-150 | FR-3 の cold defensive branches | 許容。API contract と `lib/audit/redact.spec.ts` が主経路を担保 |

> 「未到達 branch なし」を記録できれば、既存テストが監査対象ファイルの全分岐を網羅していることが coverage 側から裏付けられる（Phase 9 の FR↔テスト 1:1 map と二重に保証）。

## 5. coverage と FR の対応（Phase 9 への引き継ぎ）

| FR | 主担保ファイル | coverage 観点 |
|----|---------------|--------------|
| FR-1 filter form 同期 | `AuditLogPanel.tsx` / `page.tsx` | defaultValue 反映・GET submit の render 分岐 |
| FR-2 cursor paging | `AuditLogPanel.tsx`（`buildAuditHref`）/ `audit.ts`（`encode/decode/limit+1`） | nextCursor 有無の両 branch |
| FR-3 PII masking | `AuditLogPanel.tsx`（`maskAuditJson/maskAuditText`）/ `redact.ts` | key/value 両パターン・再帰の branch |
| FR-4 query validation | `audit.ts`（`ListAuditQueryZ`） | 不正 email/limit/cursor/date range の reject branch |
| FR-5 JST 変換 | `audit-query.ts`（`jstLocalToUtcIso`）/ `audit.ts`（`jstInputToUtcIso`） | from=start・to=end-exclusive の境界 branch |
| FR-6 認可 | `audit.ts`（`requireAdmin`）| read-only・mutation surface なしの経路 |

## 6. 完了条件（Phase 7 DoD）

- [ ] 計測対象 5 ファイル（§1）を `--coverage.include` 限定の計測コマンド（§2）として固定した。
- [ ] 広域 % ではなく対象ファイル限定の line/branch を実測する方針を明記した（FB-Feedback5 / BEFORE-QUIT-002）。
- [ ] 実測値（§3）と未到達 branch 点検結果（§4）を記録した。
- [ ] coverage と FR-1〜FR-6 の対応（§5）を Phase 9 へ引き継ぐ形で記録した。
- [ ] `verify_existing` のため変更行ゼロ（計測対象は既存ファイル）である旨を明記した。
