# Phase 9: 品質保証 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 9 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

typecheck / lint / Playwright dry-run / coverage / secret hygiene / a11y / 運用リスクの観点で品質ゲートを通過することを確認する。本タスクは visual e2e 中心のため coverage には含めない。

## 品質ゲート

| ゲート | コマンド | 期待 | 備考 |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | error 0 | spec の Playwright 型 import 含む |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | warning/error 0 | `pnpm lint --fix` 使用可 |
| Playwright dry-run | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=staging` | 7 case 列挙 | 実走行は Phase 11 |
| shellcheck | `shellcheck scripts/capture-profile-evidence.sh` | error 0 | bash の guard 句確認 |
| coverage | `mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage` | 06b-B 由来の数値から悪化させない | spec 追加は coverage 対象外なので影響なしが期待 |
| gitignore drift | `git ls-files apps/web/playwright/.auth/ \| rg -v .gitkeep` | 0 hit | state.json 流出防止 |

## free-tier / secret hygiene

| 項目 | 確認事項 |
| --- | --- |
| Cloudflare Workers 課金影響 | なし（実行は Playwright のみ） |
| Magic Link / OAuth secret | `.env` への実値書込なし、1Password 参照のみ |
| screenshot 内 PII | redaction 順序が screenshot 取得「前」になっていることを spec で確認 |
| storageState | gitignore で除外 |

## a11y

- 本タスクは UI 追加なし。a11y regression なし。
- ただし M-08 screenshot に `aria-live` 等の状態が含まれる場合、Phase 11 review で文言の妥当性を確認する。

## 運用リスク

| リスク | 緩和 |
| --- | --- |
| storageState の偶発コミット | gitignore + lefthook pre-commit grep（追加候補、本タスク必須ではない） |
| 誤って production を叩く | capture script + globalSetup の二重 guard |
| flaky test での false negative | retries=1 + DOM dump attach |

## サブタスク管理

- [ ] 品質ゲート 6 項目の確定
- [ ] secret hygiene 確認
- [ ] 運用リスク表の確定
- [ ] outputs/phase-09/main.md に QA レポート記載

## 成果物

| 成果物 | パス |
| --- | --- |
| QA レポート | `outputs/phase-09/main.md` |

## 完了条件

- [ ] 6 ゲートすべての期待値が記録されている
- [ ] coverage 影響が「なし」であることが明示されている
- [ ] secret hygiene が 1Password 参照のみで完結している

## タスク100%実行確認

- [ ] coverage を不必要に増やすために spec を unit テストに変質させていないこと
- [ ] secret 値を docs に転記していないこと

## 次 Phase への引き渡し

Phase 10 へ、品質ゲート結果を引き渡す。
