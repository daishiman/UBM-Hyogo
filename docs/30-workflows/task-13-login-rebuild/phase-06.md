# Phase 6: 単体テスト（Vitest） — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 6 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

5 状態 + rules_declined の render と form validation / state machine を Vitest で網羅する。

## 実行タスク

1. `LoginPanel.test.tsx` を新規作成し、6 状態 × 期待要素の render を検証する。
2. `LoginCard.test.tsx` を新規作成し、ロゴ・title・footerSlot・data-component 属性を検証する。
3. `MagicLinkForm.test.tsx`（既存があれば追記）に空 / 無効 / 正常 / API 失敗 / cooldown を追記する。
4. `login-query.test.ts`（既存があれば追記）に `error` 状態 parse と open redirect fallback を追記する。

## テストケース表（出典 §7.1〜7.2）

### LoginPanel.test.tsx（6 ケース + 1 fallback）

| state | 入力 props | 期待 |
|-------|-----------|------|
| input | `{state:"input", redirect:"/profile"}` | h1 / form / GoogleButton / register link |
| input + gate=admin_required | `{gate:"admin_required"}` 同梱 | warn Banner "管理者権限が必要" |
| sent | `{state:"sent", email:"a@b"}` | success Banner "メールを送信しました" + 60s cooldown 案内 + 別メール link |
| unregistered | `{state:"unregistered"}` | warn Banner + `/register` link |
| deleted | `{state:"deleted"}` | role=alert + 管理者問い合わせ CTA |
| rules_declined | `{state:"rules_declined", formUrl:"https://..."}` | warn Banner + 外部 form link |
| error | `{state:"error", error:"送信失敗"}` | role=alert + "送信失敗" 文字列 + 再試行 link |

### LoginCard.test.tsx

- ロゴ alt = `"UBM 兵庫支部会"`
- title prop が `<h1>` に描画
- footerSlot prop が render される
- `state` prop が root `data-state` に反映される
- `data-testid="login-card"` が root に付与される
- `data-component="login-card"` が root に付与
- `data-state={state}` が prop と一致

### MagicLinkForm.test.tsx（追記）

| ケース | 入力 | 期待 |
|--------|------|------|
| 空 email submit | `""` | `aria-invalid=true`、API 呼び出し 0 |
| 無効 email | `"abc"` | エラーメッセージ表示、API 呼び出し 0 |
| 正常 email | `"a@b.com"` | fetch 1 回、router.replace `?state=sent` |
| API 500 | mock 500 | router.replace `?state=error` |
| cooldown 中 | 1 度送信後 | submit disabled、残時間表示 |

### login-query.test.ts（追記）

- `parseLoginQuery({state:"error", error:"x"})` が error 値を保持
- `parseLoginQuery({state:"unknown"})` → `"input"` fallback
- `parseLoginQuery({redirect:"https://evil.com"})` → `"/profile"` fallback
- `parseLoginQuery({redirect:"/admin"})` → `"/admin"` 保持

## 参照資料

- 出典タスク §7.1, §7.2
- Phase 5: 実装結果

## 依存 Phase 成果物参照

- Phase 5: 実装ログ
- Phase 3: Props 型シグネチャ

## 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- LoginPanel
mise exec -- pnpm --filter @ubm-hyogo/web test -- LoginCard
mise exec -- pnpm --filter @ubm-hyogo/web test -- MagicLinkForm
mise exec -- pnpm --filter @ubm-hyogo/web test -- login-query
```

## 多角的チェック観点

- 各状態でユーザーに見える要素（テキスト / link / role）を `getByRole` / `getByText` で取得（implementation detail に依存しない）
- mock は `vi.spyOn(global, "fetch")` ベース
- `expect.assertions(N)` で漏れ防止
- `cleanup` を `afterEach` で確実に実行

## 統合テスト連携

- Phase 7 integration は Phase 6 の unit contract と同じ `LoginGateState` 6 値を使う。
- Phase 9 Playwright と同じ `data-testid="login-card"` / `data-state` contract を unit test で先に固定する。
- `rules_declined` と `error` は `role="alert"` を期待し、Phase 8 a11y と同一基準にする。

## サブタスク管理

- [ ] LoginPanel.test.tsx 7 ケース green
- [ ] LoginCard.test.tsx 5 観点 green
- [ ] MagicLinkForm.test.tsx 5 ケース green
- [ ] login-query.test.ts 4 ケース green

## 成果物

- `apps/web/app/login/_components/__tests__/LoginPanel.test.tsx`
- `apps/web/app/login/_components/__tests__/LoginCard.test.tsx`
- `apps/web/app/login/_components/__tests__/MagicLinkForm.test.tsx`（追記）
- `apps/web/src/lib/url/__tests__/login-query.test.ts`（追記）
- outputs/phase-06/main.md（テスト実行ログ）

## 完了条件

- [ ] 4 ファイル × 全ケース green
- [ ] coverage が既存閾値以上を維持
- [ ] mock の網羅性（成功 / 失敗 / cooldown）

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 7（統合テスト）へ、Vitest green 結果と mock 戦略を渡す。
