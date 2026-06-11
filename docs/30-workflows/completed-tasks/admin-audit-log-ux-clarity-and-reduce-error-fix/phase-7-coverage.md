# Phase 7 — カバレッジ

> 正本: [shared-context.md](./shared-context.md)。本書は coverage 目標と対象範囲を確定する。
> 実装は行わない（目標と測定方針の記述のみ）。

---

## 1. coverage 対象範囲の限定 [Feedback BEFORE-QUIT-002][Feedback 5]

**coverage 計測は「本タスクで変更したファイル / ブロックに限定」する。全体一律の coverage 閾値指定（リポジトリ全体に `--coverage` を一律強制）はしない。**

- 理由: 本タスクは `apps/web` 表現層の局所改善。無関係コードを coverage 対象に含めると、他タスクの未カバー部分で誤って fail し、CONST_007（責務分離）に反する。
- 測定方法: 対象6 spec を `--coverage` 付きで実行し、`--coverage.include` を本タスク変更ファイルに絞る（具体パスは §2）。
- gate 化はしない（CI の必須 coverage gate へ閾値を新規追加しない）。証跡として line/branch 到達を Phase 9 / Phase 11 へ残す。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage \
  --coverage.include='apps/web/src/components/admin/AuditLogCard.tsx' \
  --coverage.include='apps/web/src/components/admin/auditAppliedFilters.ts' \
  --coverage.include='apps/web/src/components/admin/auditGlossary.ts' \
  --coverage.include='apps/web/src/components/admin/auditErrorMessage.ts' \
  --coverage.include='apps/web/src/components/admin/AuditPurposeGuide.tsx' \
  --coverage.include='apps/web/src/components/admin/TagCatalogPanel.tsx' \
  --coverage.include='apps/web/src/components/admin/AuditLogPanel.tsx' \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \
  apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx
```

---

## 2. 対象ファイル別 line / branch カバレッジ目標

| ファイル | 種別 | line 目標 | branch 目標 | 根拠 |
|---------|------|----------|------------|------|
| `auditAppliedFilters.ts` | 純関数 | 100% | 100% | 副作用なし純関数。全分岐（undefined / 空 / action / from のみ / to のみ / 両方 / limit / 複合）を §6 spec で網羅 |
| `auditErrorMessage.ts` | 純関数 | 100% | 100% | 404 / 認可 / range / cursor / generic / falsy 全分岐を [UT-W3-*] で到達 |
| `auditGlossary.ts` | 純データ | 100%（参照される export のみ） | n/a（分岐なし） | 定数配列。AuditPurposeGuide spec が全エントリを描画して参照 |
| `AuditLogCard.tsx` | presentational | 90%+ | 主要分岐 100% | system/null target/both-null/fallback/parseError/batchId 有無を [UT-CARD-*] で網羅。到達困難な防御 fallback のみ許容外 |
| `AuditPurposeGuide.tsx` | presentational | 100% | n/a（分岐ほぼなし） | 静的描画。spec が全要素を assert |
| `TagCatalogPanel.tsx`（**変更ブロックのみ**） | client | 防御ガード行 100% | **両分岐到達を証跡化** | `initial?.items ?? []` / `initial?.total ?? 0` の **左辺成立（正常）と右辺フォールバック（undefined/null）両方**を [UT-RG-*] で到達。既存 mutation/operation ロジックは本タスク変更外＝対象外 |
| `AuditLogPanel.tsx`（**変更ブロックのみ**） | presentational | 変更箇所 90%+ | 変更分岐到達 | カード化・appliedFilters 描画・guide 差し込み・error 経由の新分岐を到達。既存純関数（mask 系）は既存 spec で 100% 維持 |

### 防御ガード分岐の両分岐到達（証跡必須）

`TagCatalogPanel` の防御は「正常 shape では左辺が成立」「malformed では右辺フォールバック」の **両方**を踏むことを証跡化する:

- 左辺成立: [UT-RG-NORMAL]（`{ total:2, items:[...] }`）
- 右辺フォールバック: [UT-RG-ITEMS-UNDEF] / [UT-RG-INITIAL-UNDEF] / [UT-RG-INITIAL-EMPTY] / [UT-RG-TOTAL-NULL] / [UT-RG-ITEMS-NULL]

→ coverage report の branch 列で当該行が緑（両分岐到達）であることを Phase 9 チェックリストで確認。

---

## 3. 対象外（既存の無関係コード・coverage 計測しない）

| 範囲 | 対象外理由 |
|------|-----------|
| `TagCatalogPanel.tsx` の `runOperation` / `reactivate/deactivate/physicalDelete` mutation 群（50-126） | 本タスクは防御ガードのみ追加。lifecycle ロジックは別 WF 責務（OOS-3）で変更しない |
| `tagCatalogLifecycle.ts` / `TagCatalogRow.tsx` | 本タスク非変更。既存 spec が担保 |
| `BatchIdCopyButton` / 既存 UI primitives（Card/Chip/Banner/EmptyState/FormField/Pagination） | 再利用のみ。既存 spec が担保 |
| `apps/api` 配下すべて | 不変条件1（非変更・AC-8） |
| `audit/page.tsx` の `safeServerFetch` I/O | server fetch 配線は既存 page spec（`page.page.spec.ts`）が担保。本タスクは guide 差し込みのみ |
| 他 admin 画面 / 公開画面 | スコープ外 |

---

## 4. 測定タイミングと記録

- 実装 GREEN 後に §1 コマンドを1回実行し、対象ファイルの line/branch 数値を記録。
- 純関数2本が 100% 未達の場合は未到達分岐を spec へ追加してから GREEN 確定（RED→GREEN サイクル）。
- 記録は Phase 11 manual-test の証跡 or 実装ターンの作業ログに残す（implemented_local_evidence_captured 段階では数値未確定＝pending）。
