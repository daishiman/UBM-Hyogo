# Implementation Guide — Issue #749 Primitive Adoption Tracker

## Part 1: 中学生レベルの概念説明

このタスクは、サイト内でよく使う小さな部品を同じ部品にそろえる作業。入力欄、空っぽ表示、ページ送り、パンくず、保存処理の仕組みが画面ごとにバラバラだと、見た目・読み上げ・保守が壊れやすい。

**なぜ統一が必要か**: 部品がバラバラだと、ある画面でだけバグが直って他の画面では直らない、スクリーンリーダーが読み上げる順序が画面ごとに違う、CSS の重複で bundle が膨れる、といった問題が積み重なる。同じ部品を全画面で使えば、一度直せば全体が直り、レビューも機械チェックで済む。

学校の制服に例えると、クラスごとに勝手な制服を作るのではなく、学校全体で同じルールにそろえる作業に近い。今回は 19 routes x 6 primitive の表を作り、使うべき場所で使えているかを機械チェックできるようにした。

## Part 2: 開発者向け実装詳細

### 正本 API

```ts
interface FormFieldProps {
  name: string;
  label: ReactNode;
  error?: string;
  helper?: ReactNode;
  required?: boolean;
  children: ReactElement;
}

interface UseAdminMutationOptions<T> {
  mutationFn?: (payload: unknown, endpointOverride?: string) => Promise<T>;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: string;
  refreshOnSuccess?: boolean;
}

interface UseAdminMutationReturn<T> {
  trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
}

interface PaginationProps {
  current: number;
  total?: number;
  pageSize?: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  nextHref?: string;
  prevHref?: string;
}
```

### 実装方針

- `FormField` + `Input`: admin panel と `DensityToggle` の raw `<input>` 直接利用を置換。
- `Breadcrumb`: admin route page は直接 `<Breadcrumb />` または `AdminPageHeader` 経由で描画。
- `EmptyState`: members / meetings / tags / schema / requests / audit / identity-conflicts の空状態へ適用。
- `Pagination`: members / requests / audit のページ送りへ適用。
- `useAdminMutation`: mutating admin panel 4 件で `.trigger()` を実使用。既存 `lib/admin/api` wrapper は `mutationFn` として通し、409 / 422 など既存の status-specific UI を維持。
- `AuditLogPanel`: read-only surface のため mutation 対象外。

### 検証

| command | result | evidence |
| --- | --- | --- |
| `bash scripts/verify-primitive-adoption.sh` | PASS | `outputs/phase-11/evidence/grep-gate.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS | `outputs/phase-11/evidence/typecheck.log` |
| focused Vitest 9 files / 144 tests | PASS | `outputs/phase-11/evidence/spec.log` |
| primitive visual harness 38 tests | PASS | `outputs/phase-11/evidence/visual/screenshots/`, `axe-report.json` |
| parallel-09 primitive visual harness 6 tests | PASS | `outputs/phase-11/evidence/visual/parallel09-screenshots/` |

### エラー / エッジケース

- `useAdminMutation.trigger()` は 409 (conflict) / 422 (validation) を投げ分け、UI 側 `error.message` + 既存 toast 経路で表示する。新規 status code は採用追跡対象外とし、`lib/admin/api` 側で個別ハンドリングする。
- `FormField` の `error` prop が未指定でも `aria-describedby` は `helper` 側を指す。両方未指定なら describedby は省略する（accessibility tree への影響を避けるため）。
- `Pagination` は `total === undefined` の場合に件数表示を抑制し、`hasNext` / `hasPrev` のみで前後ボタン状態を決める（offset pagination が cursor 化された場合の前方互換）。
- `EmptyState` は空配列だけでなく `null` / `undefined` data でも render される。loading 状態は呼び出し側で skeleton と分岐する。
- `Breadcrumb` の SSR 中は `usePathname()` から導出するため、`(admin)` route group の括弧表記は出力に含めない。

### 設定

| 設定 | 場所 | 既定値 |
| --- | --- | --- |
| primitive adoption gate の対象 path | `scripts/verify-primitive-adoption.sh` の `TARGETS` 配列 | 19 routes 配下 |
| grep gate の C1-C6 パターン | 同 script の `CHECK_*` 関数 | FormField / EmptyState / Pagination / Icon / Breadcrumb / `useAdminMutation` |
| CI 発火条件 | `.github/workflows/verify-primitive-adoption.yml` | `apps/web/**` / `scripts/verify-primitive-adoption.sh` 変更時の push / PR |
| canonical useAdminMutation path | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | legacy `lib/useAdminMutation` への新規参照は CLAUDE.md 不変条件 10 で禁止 |

### Screenshot 境界

`visualEvidence=VISUAL` は維持する。local component / primitive harness の screenshot は取得済みで、FormField / Breadcrumb / EmptyState / Pagination を含む。authenticated admin route の runtime screenshot と staging smoke は資格情報・seed に依存するため Phase 13 user-gated として残す。commit / push / PR も未実行。
