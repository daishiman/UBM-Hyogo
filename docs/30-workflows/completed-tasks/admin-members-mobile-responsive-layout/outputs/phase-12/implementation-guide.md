# 実装ガイド — admin 会員管理モバイルレスポンシブ・レイアウト

## Part 1（中学生にもわかる説明）

スマホで管理画面の「会員管理」を開くと、会員の一覧が横に長い表で出ます。スマホは横幅が狭いので、表の右のほうにある「公開」のスイッチなどが画面の外にはみ出し、押しにくくなっていました。

たとえるなら、大きな模造紙に書いた横長の表を、小さなノートに無理やり貼って右端が切れてしまう状態です。今回は、画面が小さいときだけ、1人ぶんの情報を名刺カードのように縦に並べるようにしました。

パソコンの大きい画面では今までどおり表のままです。データの取り方や保存の仕組みは変えず、見た目の並べ方だけを変えるので、会員情報そのものには触りません。

## 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| DOM | 画面を作る部品の並び |
| CSS | 見た目を決める決まり |
| media query | 画面サイズごとに見た目を変える合図 |
| viewport | 画面の見えている広さ |
| selector | どの部品に見た目を当てるかの目印 |

## Part 2（開発者向け技術詳細）

### 型定義 / コンポーネント契約

```ts
export interface MembersTableProps {
  readonly items: ReadonlyArray<AdminMemberListView["members"][number]>;
  readonly selected: ReadonlySet<string>;
  readonly onToggleSelect: (memberId: string) => void;
  readonly onToggleSelectAll: () => void;
  readonly onOpenRow: (memberId: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
}
```

### API / CLI シグネチャ

API は不変。`GET /admin/members?...` の response shape、D1 schema、Google Form schema、auth middleware は変更しない。

実行コマンド:

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-members-mobile-responsive-layout/outputs/phase-11 PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm --filter @ubm-hyogo/web exec playwright test --list apps/web/playwright/tests/admin-members-mobile.spec.ts
```

### 実装ステップ

1. `MembersTable.tsx` に `data-component="admin-members-table"` と `data-testid="admin-members-table"` を追加する。
2. 各 `<td>` に `data-cell` と `data-mobile-label` を付与する。行・セル順序、既存 testid、既存 aria-label は変更しない。
3. `globals.css` の `@media (max-width: 640px)` に限定し、単一 `<table>` DOM をカード表示へ変換する。
4. `MembersTable.spec.tsx` に TC-MT-21〜24 を追加し、属性契約、単一 table 維持、公開セル click 境界、a11y を固定する。
5. `admin-members-mobile.spec.ts` を追加し、375px / 640px / 1280px の overflow と公開操作を検証できる状態にする。

### エラーハンドリング / エッジケース

| ケース | 方針 |
| --- | --- |
| CSS media query は jsdom で computed 検証できない | DOM 属性契約を Vitest、実表示を Playwright に分担 |
| 公開セルクリックが行編集へ伝播する | 既存 `onClick={(e) => e.stopPropagation()}` を維持し TC-MT-23 で固定 |
| 長いメール / chip 群がはみ出す | mobile CSS で `overflow-wrap: anywhere` と grid layout を使用 |
| デスクトップ回帰 | media query を 640px 以下に閉じ、単一 table / thead / row testid を維持 |

### 設定値 / 定数

| 項目 | 値 |
| --- | --- |
| breakpoint | `@media (max-width: 640px)` |
| root selector | `[data-component="admin-members-table"]` |
| cell identifiers | `select`, `member`, `email`, `status`, `tags`, `updated`, `publish`, `actions` |
| visual routes | `/admin/members` |
| CSS-contract screenshots | 375px / 640px / 1280px（captured） |

### テスト構成

| Test | Result |
| --- | --- |
| `MembersTable.spec.tsx` | 25 tests PASS |
| Playwright CSS contract | desktop-chromium 5 tests PASS |
| CSS-contract screenshots | 375 / 640 / 1280 PNG captured, overflowPass=true |
| authenticated route screenshots | pending user gate |

Screenshot evidence:

- `outputs/phase-11/screenshots/admin-members-table-mobile-card-375.png`
- `outputs/phase-11/screenshots/admin-members-table-mobile-card-640.png`
- `outputs/phase-11/screenshots/admin-members-table-desktop-table-1280.png`
- `outputs/phase-11/screenshots/screenshot-metrics.json`
