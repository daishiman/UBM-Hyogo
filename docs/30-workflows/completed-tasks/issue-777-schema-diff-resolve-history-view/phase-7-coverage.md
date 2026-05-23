# Phase 7: カバレッジ

## 1. 対象ファイル

| # | ファイル | 役割 | 主要分岐 |
|---|---|---|---|
| 1 | `apps/web/src/lib/admin/api.ts`（`fetchSchemaAliasHistory` / `projectAuditRowsToHistory` / `readStringField` 部分） | helper | filter param 有無 (5 分岐) / HTTP ok 失敗 / zod parse 失敗 / row.maskedBefore が object でない |
| 2 | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | client component | items 空 / nextCursor null / fetch error / filter submit / aria-busy |
| 3 | `apps/web/app/(admin)/admin/schema/history/page.tsx` | server wrapper (薄い wrapper) | searchParams 各 key の受け渡しのみ。専用 spec は作成せず、helper / component spec で間接カバー |

---

## 2. カバレッジ目標

### 2.1 helper（`fetchSchemaAliasHistory` 関連の追加部分）

| 指標 | 目標 | 根拠 |
|---|---|---|
| Lines | 95% 以上 | 投影ロジックの 5 分岐（filter param 有無）と error 系 2 経路を Phase 6 §2 で全カバー |
| Branches | 90% 以上 | `readStringField` の non-object guard / `maskedAfter` 優先 fallback 含む |
| Functions | 100% | export 関数 1 + 内部 helper 2、全て spec で参照される |
| Statements | 95% 以上 | Lines に準ずる |

### 2.2 component（`SchemaDiffHistoryPanel.tsx`）

| 指標 | 目標 | 根拠 |
|---|---|---|
| Lines | 90% 以上 | Phase 6 §1 の 4 観点 × 各 2-4 ケースで主要 path をカバー |
| Branches | 85% 以上 | `items.length === 0` / `nextCursor !== null` / `error !== null` / `actorEmail ?? "(unknown)"` 等の null 合体演算子 |
| Functions | 100% | exported component + `applyFilters` + `onNext` を全て呼ぶ |
| Statements | 90% 以上 | Lines に準ずる |

### 2.3 server wrapper（`page.tsx`）

| 指標 | 目標 | 備考 |
|---|---|---|
| Lines | 計測 exclude 候補 | 薄い wrapper のみ。Next.js App Router 規約で page wrapper の vitest 計測は不安定なため exclude を許容 |

---

## 3. exclude 対象

`apps/web/vitest.config.ts` の `coverage.exclude` に追加するか、既存 pattern で吸収できれば追加不要。本タスクで新規 exclude を導入する場合は最小限とする。

| pattern | 理由 |
|---|---|
| `apps/web/app/(admin)/admin/schema/history/page.tsx` | server wrapper（searchParams 受け渡しのみ）。helper / component spec で間接カバー |
| 型のみの export（`SchemaAliasHistoryItem` / `SchemaAliasHistoryResponse` 型 alias） | runtime に出ないため計測対象外（vitest 既定で除外） |

> **注意**: `coverage exclude ratio gate`（CI gate）の閾値に対し、本タスクで追加する exclude は server wrapper の 1 ファイルのみ。これにより exclude 比率が gate 閾値を超えないことを Phase 5 §7 の検証コマンド後に確認する。閾値超過時は wrapper spec を追加して exclude を撤回する。

---

## 4. 計測コマンド

### 4.1 対象 spec のみ coverage 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- \
  src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
  src/lib/admin/__tests__/api.spec.ts
```

### 4.2 admin 領域の regression（既存 spec 巻き込み）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/admin src/lib/admin
```

### 4.3 全体 regression

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

---

## 5. CI gate との整合

| gate | 影響 | 対応 |
|---|---|---|
| `coverage exclude ratio gate` | server wrapper を exclude する場合のみ影響 | exclude 候補は 1 ファイルのみ。gate 閾値超過時は wrapper spec を追加して撤回 |
| `verify-design-tokens` | 新 component / page の HEX 直書きを禁止 | Phase 5 §6 の grep gate で 0 件を担保 |
| `block-test-suffix` (lefthook) | `.test.tsx` 禁止 | 本タスクは `.spec.tsx` のみ作成 |
| `verify-test-suffix` (GitHub Actions) | 同上 | 同上 |
| `playwright-smoke` | `/admin/schema/history` route 追加で smoke 対象に含まれる可能性 | 追加 route は admin 領域で認証必須のため smoke 対象外として明示。必要なら別 PR で対応 |

---

## 6. coverage-guard pre-push の挙動

- 本タスクは新規 spec 2 件追加（component / helper 拡張）、既存テスト削除なし、`coverage exclude ratio gate` に違反しない見込み
- `scripts/coverage-guard.sh` の `--changed` モードでは新規ファイルの line/branch 目標を満たしていれば PASS する
- sync-merge コミットを含む push は CLAUDE.md ポリシーで自動 skip されるため、本タスク feature 単独の push でのみ guard が発火する

---

## 7. DoD（Phase 7）

- [ ] §4.1 の coverage 実行で helper Lines ≥ 95% / Branches ≥ 90% / Functions = 100%
- [ ] §4.1 の coverage 実行で component Lines ≥ 90% / Branches ≥ 85% / Functions = 100%
- [ ] §3 の exclude 追加が最小 1 ファイル以内に収まる、または exclude 追加なし
- [ ] `coverage exclude ratio gate` が PASS する
- [ ] §4.2 / §4.3 の regression 実行で既存 admin 系 spec が PASS のまま
- [ ] coverage-guard pre-push が PASS する
