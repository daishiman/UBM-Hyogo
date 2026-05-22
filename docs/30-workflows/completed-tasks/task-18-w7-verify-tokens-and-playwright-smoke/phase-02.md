# Phase 2: ドメイン定義 / 用語 / 不変条件 / Validation Matrix

## 目的

本タスクで扱うドメイン語彙と不変条件を確定し、各 Phase が参照する正本を 1 箇所に集約する。

## 用語集

| 用語 | 定義 |
| --- | --- |
| 17 URL routes smoke | Playwright で巡回する 17 URL route 集合。各 route で「HTTP < 400 / 主要 landmark visible / axe-core `serious`/`critical` 0 件」を合格条件とする |
| Token drift | 09b §9 JSON の CSS token と `tokens.css` の CSS custom properties、`globals.css` の `@theme inline` bridge を比較した差分。`value-mismatch` / `missing-in-tokens-css` / `missing-in-09b` / `missing-theme-bridge` の 4 種で分類 |
| Visual baseline | `apps/web/playwright/tests/visual/__screenshots__/` 配下にコミットする PNG 群。`maxDiffPixelRatio: 0.02` を上限 |
| Required check | GitHub branch protection の `required_status_checks.contexts` に登録された context 名。マージ前に green 必須 |
| TRACKED_TOKEN_NAMES | verify-design-tokens が監視対象とする token 名集合。`--ubm-color-*`、`--ubm-radius-*`、`--ubm-shadow-*`、`--ubm-font-*`、`--ubm-text-*`、`--ubm-space-*`、`--ubm-dur-*`、`--ubm-ease-*` |

## 不変条件

1. `apps/api/` の本番コードに触れない（API は smoke の呼び出し対象としてのみ存在）
2. `apps/web/src/styles/tokens.css` と `apps/web/src/styles/globals.css` の `@theme inline` bridge は本タスクで**値を変えない**（drift 検知対象）
3. `09b-design-tokens.md §9 JSON` を token value SSOT とする。設計値変更は本タスクで禁止。転記漏れ・bridge 欠落のような SSOT 同期漏れは同一 PR で `tokens.css` / `globals.css` 側を補正し、意図的な値変更は別 workflow に分離する
4. 既存 Playwright project（`desktop-chromium` / `firefox` / `mobile-webkit`）を温存し、`testMatch` で smoke / visual を完全分離
5. solo dev ポリシー（`required_pull_request_reviews=null`）の前提を崩さず、品質保証は `required_status_checks` に追加するのみ
6. `.env` に実値を書かない。`E2E_*_SESSION_TOKEN` は GitHub Secrets / 1Password 参照のみ
7. visual baseline は ubuntu-latest（CI と同一 OS）で採取
8. 既存 hook（`lefthook.yml`）を本タスクから書き換えない

## Validation Matrix（Phase 2 必須）

> 実在の package.json scripts と test runner のみを gate コマンドとして書く（task-specification-creator v2026.05.08 `command-contract-drift` 反映）。

| Workspace | typecheck | lint | unit test | build |
| --- | --- | --- | --- | --- |
| repo root | `mise exec -- pnpm typecheck` | `mise exec -- pnpm lint` | `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts` | — |
| `@ubm-hyogo/web` | `pnpm --filter @ubm-hyogo/web typecheck` | `pnpm --filter @ubm-hyogo/web lint` | — | `pnpm --filter @ubm-hyogo/web build` |

E2E 系:

| Suite | 実行コマンド |
| --- | --- |
| smoke（実装後 script） | `pnpm --filter @ubm-hyogo/web e2e:smoke` |
| visual（実装後 script） | `pnpm --filter @ubm-hyogo/web e2e:visual` |
| visual update（実装後 script / 意図的更新時） | `pnpm --filter @ubm-hyogo/web e2e:visual:update` |
| smoke（現行 fallback） | `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/full-smoke.spec.ts --project=smoke-chromium` |
| visual（現行 fallback） | `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual --project=visual-chromium` |

## 既存 API 契約（不変）

- `getEnv()` / `getPublicEnv()`（task-02 確定）
- `apps/web/playwright.config.ts` の既存 `desktop-chromium` / `firefox` / `mobile-webkit` プロジェクト
- `.github/workflows/e2e-tests.yml`（functional E2E）

## 完了条件

- [ ] 用語集が確定
- [ ] 不変条件 8 件確定
- [ ] Validation Matrix のコマンドが実在の package.json scripts と一致（Phase 6 で実装後に再検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- 用語、不変条件、実装前後の command contract を確定する。

| Task | 内容 |
| --- | --- |
| 2-A | 用語と不変条件を現行 Playwright 配置へ同期する |
| 2-B | 実装予定 script と現行 fallback command を分けて Validation Matrix に記録する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| package root | `package.json` | 現行 root scripts |
| web package | `apps/web/package.json` | 現行 Playwright scripts |
| command drift rule | `.claude/skills/task-specification-creator/references/phase-template-core.md` | 実在 command gate |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 2 仕様 | `phase-02.md` | 用語・不変条件・Validation Matrix |

## 統合テスト連携

Phase 2 は command contract の設計段階。実行は Phase 8 で行い、現行 fallback command は script 追加前の drift 検知にのみ使う。
