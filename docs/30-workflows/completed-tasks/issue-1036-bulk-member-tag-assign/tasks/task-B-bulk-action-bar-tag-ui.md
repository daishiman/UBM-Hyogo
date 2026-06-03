# task-B: BulkActionBar tag picker + 一括付与/解除 + 部分失敗表示

| 項目 | 内容 |
|------|------|
| 領域 | apps/web |
| 依存 | task-A（endpoint 契約は Phase 2 で確定済みのため spec 並列可、実装は task-A 完了後） |
| AC | AC-6（UI側 regression）, AC-7 |
| 実装区分 | 実装仕様書（VISUAL_ON_EXECUTION） |

## 変更対象ファイル

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/src/features/admin/api/members.ts` | 編集 | `bulkApplyMemberTags` / `fetchTagMaster` + 型 |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | 編集 | tag picker + op 切替 + 実行 + 部分失敗表示 |
| `apps/web/src/features/admin/components/_members/__tests__/BulkActionBar.spec.tsx` | 新規 or 編集 | bulk tag UI component test |

## 既存資産の再利用（新規 primitive を生やさない）

- 選択基盤: `MembersClientShell` の `selected: Set<string>` → `BulkActionBar` props `selectedIds`（既存契約維持）
- tag pill: `apps/web/src/features/admin/components/_shared/TagPill.tsx`（`selected`/`onClick`/`disabled`/`aria-pressed`）
- mutation: `@/features/admin/hooks/useAdminMutation`（不変条件 #10）
- 部分失敗 progress パターン: `apps/web/src/features/admin/hooks/useBulkRepublish.ts`
- form primitive: `FormField` / `Button` / `Switch`（不変条件 #9）

## local state（BulkActionBar 内）

```typescript
const [tagMode, setTagMode] = useState<"assign" | "unassign">("assign");
const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
const [available, setAvailable] = useState<AdminTagRef[]>([]);
const [bulkResult, setBulkResult] = useState<BulkTagSummary | null>(null);
// 既存: const [busy, setBusy] = useState<Action | null>(null);
```

## UI 契約

- tag picker: `available`（カテゴリ別グルーピング）を `TagPill` で列挙。click で `selectedTagIds` toggle。`aria-pressed` で選択状態。
- op 切替: assign/unassign（既定 assign）。
- 実行ボタン: ラベル「{selectedIds.length}人 × {selectedTagIds.size}タグ を{付与|解除}」。disabled = selectedIds 空 or selectedTagIds 空 or busy。
- 実行: `useAdminMutation("/api/admin/members/tags/bulk", "POST", …)` → `bulkApplyMemberTags(selectedIds, [...selectedTagIds], tagMode)`。
- 結果表示: `results` を status 別集計（assigned/unassigned/noop/skipped_deleted/tag_not_found 件数）。skip/not_found は member×tag 単位で `data-testid` 付きリスト表示。
- 完了後 `onComplete()`（既存契約）で一覧 refresh。

## 入力・出力・副作用

- 入力: 選択済み member（props）+ ユーザーが選んだ tag/op。
- 出力（UI）: 件数集計 + 部分失敗リスト。
- 副作用: bulk endpoint 呼び出し、成功時 router refresh。

## DoD

- [ ] tag picker + op 切替 + 実行 + 部分失敗表示が描画される
- [ ] 既存 publish/hide/soft-delete アクションに regression 無し（AC-6）
- [ ] `useAdminMutation` 経由（不変条件 #10）・`<input>` 直書きなし（不変条件 #9）
- [ ] OKLch トークンのみ（HEX 直書き / `bg-[#xxx]` 禁止・task-18 gate）
- [ ] component test green
- [ ] `pnpm --filter @ubm-hyogo/web typecheck && pnpm lint` green
- [ ] Phase 11 で tag セクション screenshot 取得（実行時 user-gated）
