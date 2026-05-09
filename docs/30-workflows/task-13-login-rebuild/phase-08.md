# Phase 8: a11y 受け入れテスト — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 8 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

5 状態 + rules_declined すべてで jest-axe critical violation 0 を達成し、フォームラベル / role=alert / focus visible / キーボード操作 / コントラストの a11y 要件を満たす。

## 実行タスク

1. `LoginPanel` を 6 状態で render し、各 render 結果を `axe(container)` に通す。
2. 結果を `expect(results).toHaveNoViolations()` で assert（critical のみ必須、serious は警告レベル）。
3. 手動キーボード操作で Tab 順（input → submit → Google → register link）を確認。
4. Banner role が `status` / `alert` で正しく分岐することを確認（`deleted` / `error` / `rules_declined` は alert）。

## テストケース表（出典 §7.4）

| state | render | expect |
|-------|--------|--------|
| input | `<LoginPanel state="input" redirect="/profile" />` | violations 0 |
| sent | `<LoginPanel state="sent" email="a@b" />` | violations 0 |
| unregistered | `<LoginPanel state="unregistered" />` | violations 0 |
| deleted | `<LoginPanel state="deleted" />` | violations 0、role=alert 存在 |
| rules_declined | `<LoginPanel state="rules_declined" formUrl="..." />` | violations 0、role=alert 存在 |
| error | `<LoginPanel state="error" error="送信失敗" />` | violations 0、role=alert 存在 |

### 手動チェック観点

- [ ] Tab 順: email input → submit → Google OAuth → register link
- [ ] focus visible（focus ring が tokens 経由で見える）
- [ ] form `<label>` が input と関連付け（`htmlFor` / aria-labelledby）
- [ ] `aria-busy` が submit 中 true
- [ ] `deleted` / `error` / `rules_declined` は `role="alert"`、それ以外は `role="status"`
- [ ] コントラスト比 4.5:1 以上（WCAG AA）

## 参照資料

- 出典タスク §7.4（jest-axe）, §11（a11y 観点）
- Phase 6 単体テスト

## 依存 Phase 成果物参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: 実装ログ
- Phase 6: 単体テスト
- Phase 7: 統合テスト

## 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- a11y
# 手動: chrome devtools の Lighthouse a11y 監査を /login の 6 URL で実行
```

## 多角的チェック観点

- critical 0 必須、serious 0 目標
- jest-axe 設定で `disableOtherRules` 等で抜けがないこと
- 視覚的 focus indicator が dark / light モード両方で見える

## 統合テスト連携

- Phase 6 unit test と同じ role 基準で `rules_declined` / `error` / `deleted` を検証する。
- Phase 9 smoke は role と text を DOM assert し、screenshot diff に依存しない。
- 正本 `09f-screen-blueprints-member.md` の `rules_declined role="alert"` を優先し、Phase 3/6/8/9 の契約を揃える。

## サブタスク管理

- [ ] axe 6 状態 × violations 0
- [ ] Tab 順手動確認
- [ ] role=alert 配置確認
- [ ] Lighthouse a11y score ≥ 95

## 成果物

- a11y テスト結果（`outputs/phase-08/axe-report.json` 任意）
- outputs/phase-08/main.md（手動チェック記録）

## 完了条件

- [ ] jest-axe critical 0（全 6 状態）
- [ ] 手動チェック観点 6 項目 OK
- [ ] Lighthouse a11y score 確認

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 9（Playwright smoke）へ、a11y green と data-state 属性の確認結果を渡す。
