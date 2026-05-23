# Phase 3: Design Review — issue-801 admin error focus transfer

## レビュー観点

### 1. 親 spec section 4.3 整合

| 要件 | 設計反映 | OK |
|---|---|---|
| `aria-live` 通知 | `aria-live="assertive"` を wrapper に付与 | ✅ |
| h1 への自動 focus | `useRef` + `tabIndex={-1}` + `useEffect` で `focus({preventScroll:true})` | ✅ |
| digest 表示 | `error.digest && ...` 分岐 | ✅ |
| 構造化ログ | `logger.error({ event: "error.boundary.caught", scope: "admin", ... })` | ✅ |
| 本番 stack 抑制 | `isDev` 分岐で `<pre>` 出し分け | ✅ |
| OKLch トークン | `text-danger` / `text-text-3` / `bg-surface-2` / `border-border` / `bg-accent` / `text-panel` のみ | ✅ |

### 2. CLAUDE.md 不変条件

- 不変条件 1（既存 API のみ接続）: ✅ API endpoint 変更なし
- 不変条件 2（OKLch トークン）: ✅ HEX 直書きなし
- 不変条件 3（プロトタイプ正本）: ✅ 既存 primitives のみ（button / Link / pre / div / h1 / p / code）
- 不変条件 4（D1 直接アクセス禁止）: ✅ apps/web 側のみ
- env アクセス不変条件: ✅ `process.env.NODE_ENV` のみで、機密 env を増やさない

### 3. admin auth gate との競合

- `redirect('/login')` は `NEXT_REDIRECT` として処理されるため error boundary を通らない → 競合なし
- 仮に server-side で auth error が throw されても、リンク先が `/`（公開 top）のため login への自然導線が確保される → 無限ループ回避

### 4. logger import path

- `apps/web/app/(admin)/admin/error.tsx` から `apps/web/src/lib/logger` への相対パス: `../../../src/lib/logger` (3 階層上 / `app/(admin)/admin/error.tsx` → `app/(admin)` → `app` → `apps/web` → `src/lib/logger`)
- Phase 5 実装時に tsconfig path alias `@/lib/logger` が利用可能なら優先（要確認）

### 5. スコープ妥当性（CONST_007 単一サイクル）

- 差分: 1 ファイル rewrite + 1 ファイル新規 = 単一 PR 想定で問題なし
- 「将来タスクへの先送り」は無し。共通 hook 抽出は別 issue (followup-001) として正規記録済み

### 6. テスト網羅性（Phase 4 へ送出）

- AC-9〜AC-10 で要求する観点が網羅されているか → Phase 4 で TC マッピング

## 判定

**設計承認 → Phase 4 へ進む**。
