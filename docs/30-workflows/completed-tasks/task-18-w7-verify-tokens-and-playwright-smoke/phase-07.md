# Phase 7: リファクタリング / 共通化 / IPC 契約整合

## 目的

GREEN 後のコードを、後続実装者が読み解きやすい構造に整える。本タスクは UI 層を含まず IPC 契約は無関係なため、主に scripts と e2e helpers の整理を行う。

## 7.1 リファクタ対象

| 対象 | 内容 |
| --- | --- |
| `scripts/verify-design-tokens.ts` | parser を関数分割（`parseSpec` / `parseTokensCss` / `parseThemeBridge` / `compareTokens`）。pure 関数化して test しやすく |
| `apps/web/playwright/tests/full-smoke.spec.ts` | `ROUTES` 配列を `routes.ts` に抽出するかは判断ポイント。本タスクでは inline 維持（19 件のため可読性優先） |
| `apps/web/playwright/fixtures/auth.ts` | cookie 共通部分を private helper に切り出し、`adminLogin` / `memberLogin` から再利用 |
| `apps/web/playwright.config.ts` | baseURL 解決の優先順位を comment で 1 行明示（hidden constraint） |

## 7.2 命名・型整理

- `TokenDrift.reason` の enum 文字列を `DriftReason` type に固定（Phase 3 §3.2）
- `SmokeRoute` interface を `full-smoke.spec.ts` 内に閉じる（外部 export しない）

## 7.3 `.gitignore` 整合

`apps/web/playwright-report/` / `apps/web/test-results/` が tracked にならないこと（baseline `__screenshots__/` は **tracked**）:

```bash
git check-ignore -v apps/web/playwright-report/
git check-ignore -v apps/web/test-results/
git check-ignore -v apps/web/playwright/tests/visual/__screenshots__/dummy.png  # → not ignored
```

## 7.4 hidden constraint コメント

以下 4 箇所に最小限の理由コメントを書く（過剰コメント禁止）:

1. `playwright.config.ts` baseURL 解決順 — `// PLAYWRIGHT_BASE_URL > PLAYWRIGHT_STAGING_BASE_URL > localhost`（staging deploy preview で base 切替するため）
2. `apps/web/playwright/tests/full-smoke.spec.ts` の `disableRules(['color-contrast'])` — `// token verify is separate from a11y contrast`
3. `auth.ts` の `secure: false` — `// e2e fixture only; staging/prod uses real auth flow`
4. `playwright.config.ts` `toHaveScreenshot.maxDiffPixelRatio: 0.02` — `// suppresses font-hinting flakiness on ubuntu-latest`

## 完了条件

- [ ] verify-design-tokens.ts が pure 関数 4 分割
- [ ] auth.ts に共通 helper
- [ ] `.gitignore` に reports / test-results が含まれ、baseline は含まれない
- [ ] 4 箇所の hidden constraint comment が記載

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- GREEN 後の parser、fixture、evidence path を最小責務へ整理する。

| Task | 内容 |
| --- | --- |
| 7-A | parser / fixture helper を最小責務に分割する |
| 7-B | baseline path が `.gitignore` で除外されないことを確認する |
| 7-C | hidden constraint コメントを実在ファイルへ配置する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 6 | `phase-06.md` | GREEN 実装結果 |
| `.gitignore` | `.gitignore` | ignored evidence / screenshots 除外確認 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 7 仕様 | `phase-07.md` | リファクタリング手順 |

## 統合テスト連携

Phase 7 後に Phase 8 の全 gate を再実行する。リファクタ単独で PASS claim せず、Phase 8 evidence を正本にする。
