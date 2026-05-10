# Phase 5: 実装（コア） — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 5 / 13 |
| wave | w5-par |
| mode | sequential |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 4 の SRP 分解に従い、`/login` 5 状態リビルドのコアコード変更を実装する。Auth.js + Magic Link API surface は不変、HEX 直書き 0 を維持する。

## 実行タスク（サブタスク順）

### 1. `LoginGateState` 拡張（`apps/web/src/lib/url/login-query.ts`）

```ts
export type LoginGateState =
  | "input" | "sent" | "unregistered" | "deleted" | "rules_declined" | "error";
```

zod schema の `state` enum に `"error"` を追加。`error` クエリは `String(error).slice(0, 200)` 相当で切り詰め、`redirect` は同一オリジン path 以外を `"/profile"` にフォールバック。

### 2. `LoginCard.tsx`（new / Server Component）

- 引数: `LoginCardProps`（`state` / `title` / `subtitle` / `footerSlot` / `children`）
- ロゴ inline SVG（UBM 兵庫支部会）, h1, slot, footer
- ルート要素に `data-testid="login-card"` `data-component="login-card"` `data-state={state}` を付与（`state` は `LoginCardProps.state` で受け取る）
- 色は `oklch(var(--ubm-color-*))` 経由のみ

### 3. `LoginStatus.tsx`（new）

- 引数: `LoginStatusProps`
- switch で 5 状態（sent / unregistered / deleted / error / rules_declined）の本文ブロックを返す
- 各状態は ui-primitive `<Banner tone>` + 本文 + CTA リンク

### 4. `LoginPanel.client.tsx`（rebuild）

- 引数: `LoginPanelProps`
- `state==="input"` のとき MagicLinkForm + GoogleOAuthButton + register link を直接配置
- それ以外は `<LoginStatus>` に委譲
- exhaustive switch（`never` チェック必須）
- `gate` クエリ存在時は input 状態に warn Banner を上乗せ

### 5. `MagicLinkForm.client.tsx`（minor）

- 既存 fetch + router.replace パターン維持
- `aria-busy` を submit 中に true、`<Banner>` を ui-primitive に置換、HEX 残存を全削除
- 60s 再送 cooldown は既存実装維持

### 6. `GoogleOAuthButton.client.tsx`（minor）

- 既存 `signIn("google", { callbackUrl })` 維持
- Google brand SVG を inline 化、border / hover の色を tokens 経由に変更

### 7. `page.tsx`（M）

- `searchParams` を `parseLoginQuery` で確定
- `<main>` 直下に `<LoginCard data-state={query.state}>` を配置し、`<LoginPanel>` を子として注入

## 参照資料

- 出典タスク §3（ファイル表）, §4（Props）, §6（データフロー）, §10（実装順序）
- docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx

## 依存 Phase 成果物参照

- Phase 1〜4: `outputs/phase-01..04/main.md`

## 実行手順（ローカル）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web dev   # 5 状態 URL を巡回
```

## 多角的チェック観点

- `git diff -- apps/web/app/api/auth/` が 0（API surface 不変）
- `grep -E '#[0-9a-fA-F]{3,6}' apps/web/app/login` が 0
- exhaustive switch が `never` で型検査通過
- `data-testid="login-card"` と `data-state` が 6 値すべてで render 結果に出現

## 統合テスト連携

- Phase 6 の `LoginCard.test.tsx` は `state` prop、`data-testid="login-card"`、`data-state` を同時に検証する。
- Phase 9 の Playwright smoke は `getByTestId("login-card").toHaveAttribute("data-state", state)` を正本 locator とする。
- Phase 10 の diff scope gate で `apps/web/app/api/auth/*` に差分がないことを確認する。

## サブタスク管理

- [ ] サブタスク 1（型拡張）完了
- [ ] サブタスク 2（LoginCard 新規）完了
- [ ] サブタスク 3（LoginStatus 新規）完了
- [ ] サブタスク 4（LoginPanel rebuild）完了
- [ ] サブタスク 5（MagicLinkForm minor）完了
- [ ] サブタスク 6（GoogleOAuthButton minor）完了
- [ ] サブタスク 7（page.tsx wrapper）完了

## 成果物

- 上記 7 ファイルのコード差分（7 サブタスク分）
- outputs/phase-05/main.md（実装ログ・残課題）

## 完了条件

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web lint` green
- [ ] dev サーバで 6 URL（input/sent/unregistered/deleted/error/rules_declined）が prototype 整合で描画
- [ ] `apps/web/app/api/auth/*` 配下の git diff が 0
- [ ] HEX 直書き grep が 0（`apps/web/app/login`）

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない（Phase 13 で行う）
- [ ] Phase 4 の DAG 順序に従って実装した

## 次 Phase への引き渡し

Phase 6（単体テスト）へ、5 状態の render 結果と Props 契約を渡す。
