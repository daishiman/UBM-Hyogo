# Phase 8: リファクタリング

Green 達成後、重複・navigation drift・再計算の観点で最小限の整理を行う。本タスクは差分が小さいため大規模 refactor は不要。

---

## 8.1 重複 / navigation drift チェック

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `tagLabelById` の構築 | render ごとに `available` から毎回 lookup を再構築すると再計算コスト | `useMemo(..., [available])` 化 | `available` 変化時のみ再構築。`groupedTags` と同じ最適化方針に揃える（既存パターンへの整合・drift 回避） |
| `membersById` の構築（MembersClientShell） | `initial.members` から毎 render 再構築 | `useMemo(..., [initial.members])` 化 | `republishCandidates` の既存 useMemo パターンと一致させ、構築方針を統一（navigation drift 防止） |
| 表示名/label 解決ロジック | skipped/notFound 行内のインライン式 | インラインのまま保持（li map 内の局所変数 `name` / `label`） | 解決ロジックは 1 行で自明・抽出すると過剰間接化（YAGNI）。共通ヘルパ化は他 component で同種需要が出た時点で検討（現時点で 1 箇所のみ） |
| `responseEmail` の扱い | prop shape から除外 | 維持 | PII 最小化を優先し、今回の AC に不要な email は渡さない。将来需要が確認された場合のみ別途検討する |

---

## 8.2 navigation / 既存資産との整合

- `BulkRepublishDrawer` への `republishCandidates`（`displayName: fullName`）注入と、本タスクの `membersById`（`fullName`）注入は **同じ親 `MembersClientShell` から `initial.members` を起点に派生する** 点で一貫している。新規 primitive・新規 data 取得経路を生やさない（不変条件 #3 / Phase 1-3 SSOT）。
- 表示名は `MembersTable` の表示ポリシー（fullName 主・email は副）に整合し、email を summary に出さないことで PII 表示拡大を回避する。

## 8.3 リファクタ後の再検証

- `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx` が引き続き green。
- `typecheck` / `lint` exit 0。
- 既存 testid / li key 不変であることを差分で確認。
