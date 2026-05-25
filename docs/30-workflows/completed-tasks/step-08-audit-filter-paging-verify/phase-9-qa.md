# Phase 9: QA（FR↔テスト 1:1 coverage map）

**[実装区分: 実装仕様書（`verify_existing`）]**

> 監査タスク用テンプレ（`phase-template-audit-task.md`）§Phase 9 を「**品質保証一括判定**」として実行する。本 Phase の最重要成果物は **FR-1〜FR-6 と既存テストケースの 1:1 coverage map**（AC-5 を満たす）。未カバーの監査主張があれば partial 判定 + NR-N（未解決 record）を記録する。

## 1. FR ↔ 既存テスト 1:1 coverage map（最重要成果物・AC-5）

> 担保テストは `ファイル :: ケース名（it/describe 相当）` で対応付ける。ケース名は既存 `*.spec.*` の記述に対応する論理ケースとして列挙する（実行時にケース名差異があれば Phase 11 で補正）。

| FR | 要件（既存挙動の継続保証） | 担保テストファイル | 担保ケース | 判定 |
|----|---------------------------|-------------------|-----------|------|
| FR-1 | filter form 7 項目が `defaultValue` 反映 + `action="/admin/audit"` GET submit で URL 同期 | `AuditLogPanel.component.spec.tsx` | filter form が action/actorEmail/targetType/targetId/from/to/limit を `defaultValue` で復元描画 / form method=GET・action=/admin/audit を持つ | full |
| FR-2 | cursor paging：`buildAuditHref` が filter 保持して `nextCursor` 付与、`nextCursor=null` 時「次のページはありません」表示 | `AuditLogPanel.component.spec.tsx` / `audit.contract.spec.ts` | `buildAuditHref` が現 filter を URLSearchParams に保持しつつ cursor を付与 / `nextCursor=null` で「次のページはありません」描画 / API: `listFiltered({limit:limit+1})` で次ページ有無を判定し `nextCursor` を返す | full |
| FR-3 | PII masking：`maskAuditJson` が key/value 両パターンで再帰マスク、raw PII を可視 DOM に出さない | `AuditLogPanel.component.spec.tsx` / `audit.contract.spec.ts` | `maskAuditJson` が key パターン（email/phone/name 等）で再帰マスク / value パターン（email/phone regex）でマスク / `maskAuditText`（actorEmail）/ API: `redactAuditPayload`/`redactString` が応答前にマスク（二段防御） | full |
| FR-4 | API query validation：不正 email/limit 範囲外/不正 cursor/不正 date range/from>=to を 400、正常時 `AdminAuditListResponseZ` 準拠 | `audit.contract.spec.ts` | 不正 email→400 / limit 範囲外→400 / 不正 cursor→400 / 不正 date range→400 / from>=to→400 / 正常時 `AdminAuditListResponseZ`（items + nextCursor + appliedFilters）準拠 | full |
| FR-5 | JST 変換：`jstLocalToUtcIso`/`jstInputToUtcIso` が datetime-local→UTC ISO 一貫変換、from=start・to=end-exclusive | `AuditLogPanel.component.spec.tsx`（UI）/ `audit.contract.spec.ts`（API） | `jstLocalToUtcIso` が JST datetime-local→UTC ISO 変換 / `jstInputToUtcIso(from,false)`=start・`(to,true)`=end-exclusive / 空入力スキップ | full |
| FR-6 | 認可：`requireAdmin` 経由のみ、read-only、mutation surface なし | `audit.contract.spec.ts` | `requireAdmin` middleware 経路でのみアクセス可 / GET のみ（mutation endpoint 不在） | full |

> 全 FR が full 判定（partial / 未カバーなし）であれば AC-5（未カバーの監査主張ゼロ）を満たす。

## 2. partial / 未カバー記録（NR-N）

| NR-ID | 対象 FR | 未カバー内容 | 措置 |
|-------|---------|-------------|------|
| （実行後に partial があれば記録。0 件なら「partial / 未カバーの監査主張なし」と明記） | — | — | — |

> Phase 11（再現コマンド実行）で §1 の各ケースが実 PASS することを確認し、ケース名差異・未カバーがあれば本表に NR-N として記録する。NR が 0 件であることが verify_existing の回帰保証完了条件。

## 3. 品質ゲート判定（lint / typecheck / test）

| ゲート | コマンド | 期待 | 判定（実行後） |
|--------|---------|------|---------------|
| Web test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | `AuditLogPanel.component.spec.tsx`（423 行）+ `page.page.spec.ts`（14 行）全 PASS（AC-1） | （実測） |
| API test | `mise exec -- pnpm --filter @ubm-hyogo/api test` | `audit.contract.spec.ts`（303 行）全 PASS（AC-2） | （実測） |
| typecheck | `mise exec -- pnpm typecheck` | PASS（AC-3） | （実測） |
| lint | `mise exec -- pnpm lint` | PASS（AC-3） | （実測） |
| コード変更ゼロ | `git diff dev...HEAD -- apps/ \| head` | 空（AC-4 / NFR-5） | （実測） |

## 4. 不変条件チェック表

| # | 不変条件 | 検証手段 | 期待 | 判定 |
|---|---------|---------|------|------|
| INV-1 | D1 直接アクセス禁止（`apps/web` は `fetchAdmin` 経由のみ）— NFR-1 | `page.tsx` が `fetchAdmin<AdminAuditListResponse>` のみを呼び D1 binding を参照しないことを grep 確認 | D1 直アクセスなし | （実測） |
| INV-2 | admin form input は `FormField` 経由 — NFR-2 | `AuditLogPanel.tsx` の input が `FormField` + `Input` primitive 経由（直 `<input>` 不在） | FormField 経由 | （実測） |
| INV-3 | OKLch トークン正本化・HEX 直書き禁止 — NFR-3 | `verify-design-tokens` gate / audit UI 配下に `#xxx` / `bg-[#...]` / `text-[#...]` が無いことを grep | HEX 直書きなし | （実測） |
| INV-4 | test suffix は `*.spec.*` のみ — NFR-4 | audit 関連テストが `*.spec.{ts,tsx}` のみ（`*.test.*` 不在） | `*.spec.*` のみ | （実測） |
| INV-5 | コード変更ゼロ — NFR-5 | `git diff dev...HEAD -- apps/` が空 | 差分ゼロ | （実測） |

### 不変条件の grep 例（Phase 11 で実行）

```bash
# INV-1: D1 直アクセスがないこと（fetchAdmin のみ）
grep -n "fetchAdmin" "apps/web/app/(admin)/admin/audit/page.tsx"
grep -rn "DB\.\|d1\|D1Database\|env\.DB" "apps/web/app/(admin)/admin/audit/" || echo "no D1 direct access"

# INV-3: HEX 直書きがないこと
grep -rnE "#[0-9a-fA-F]{3,6}\b|bg-\[#|text-\[#" \
  "apps/web/src/components/admin/AuditLogPanel.tsx" \
  "apps/web/app/(admin)/admin/audit/" || echo "no HEX literal"

# INV-4: test suffix
ls "apps/web/src/components/admin/__tests__/" | grep -E "audit" 
grep -rl "\.test\.\(ts\|tsx\)" "apps/web/app/(admin)/admin/audit/" || echo "no *.test.* files"
```

## 5. QA 総合判定

| 観点 | 判定基準 | 結論（実行後） |
|------|---------|---------------|
| FR coverage map | FR-1〜FR-6 全 full（NR 0 件） | （実測） |
| 品質ゲート | test / typecheck / lint 全 PASS | （実測） |
| 不変条件 | INV-1〜INV-5 全 PASS | （実測） |
| 監査結論再現 | 元 spec「✅ OK - 改善不要」が回帰検証で裏付け | （実測） |

> 全観点 PASS かつ NR 0 件で、監査結論（改善不要）が回帰検証として固定されたと判定する。partial が残る場合は Phase 6（テスト追補）または Phase 12（scope boundary 再判定）へ差し戻す。

## 6. 完了条件（Phase 9 DoD）

- [ ] FR-1〜FR-6 と既存テストケースの 1:1 coverage map（§1）を作成し、AC-5（未カバーの監査主張ゼロ）を満たした。
- [ ] partial / 未カバーを NR-N（§2）として記録する欄を用意し、0 件であれば明記する導線を引いた。
- [ ] 品質ゲート（§3：test / typecheck / lint / diff ゼロ）の判定欄を用意した。
- [ ] 不変条件チェック表（§4：INV-1〜INV-5）と grep 検証手段を明記した。
- [ ] QA 総合判定（§5）の枠を設け、partial 残存時の差し戻し先（Phase 6 / 12）を明記した。
