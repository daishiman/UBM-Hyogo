# Phase 7: CI/CD 統合 / 既存 gate 整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 区分 | 実装（新規 workflow 追加なし、既存 gate との整合確認のみ） |
| 想定所要 | 0.25 人日 |

## 目的

本タスクは新規 GitHub Actions workflow を追加しない。既存の CI gate (typecheck / lint / vitest / verify-design-tokens / playwright-smoke / verify-indexes / verify-gate-metadata) が本タスクの差分に対しても green になることを確認する。

## 既存 gate との整合性

| Gate (required status check) | 影響 | 対応 |
| --- | --- | --- |
| `typecheck` | あり | Phase 5 で型整合維持 |
| `lint` (eslint + prettier) | あり | ESLint rule に違反しないコードで実装 |
| `unit test (vitest)` | あり | focused spec 7 tests が TC-CHART-01〜14 を網羅して green になる |
| `verify-design-tokens / verify-design-tokens` | あり | HEX 直書き 0 件、OKLch token 経由 |
| `playwright-smoke / smoke (chromium)` | あり | admin dashboard 表示が壊れない |
| `playwright-smoke / visual (chromium, 4 screens)` | あり | snapshot 差分が想定通り（chart 追加のみ） |
| `verify-indexes-up-to-date` | なし | skill indexes に影響しない |
| `verify-gate-metadata` | あり | `artifacts.json` の zod schema 整合 |
| `verify-phase12-compliance` | あり | Phase 12 必須 7 outputs を Phase 12 で出力 |

## visual snapshot 更新方針

chart 表示追加により `playwright-smoke / visual` の admin dashboard snapshot に差分が出る。次の手順で更新する:

1. PR 作成前に `mise exec -- pnpm e2e:visual --update-snapshots --project=visual-chromium` を実行
2. 更新された snapshot を Phase 11 の evidence として保存
3. PR 本文にレビュー対象 snapshot diff を明記

## CI run 確認手順

```bash
# PR push 後、GH Actions run を確認
gh pr checks <PR番号>
# 失敗時は個別 job ログを確認
gh run view <run-id> --log-failed
```

## pre-push hook 整合

`lefthook.yml` に登録された pre-push hook `coverage-guard` / `verify-indexes-up-to-date` / `verify-gate-metadata` が本差分で fail しないこと。fail した場合は CLAUDE.md の sync-merge 例外ポリシーに従い、`--no-verify` ではなく原因解消で対処。

## 実行タスク

- Phase 7: 既存 CI gate と visual evidence 境界を確認する。

## 参照資料

- - `phase-05.md`
- - `phase-06.md`
- - `apps/web/package.json`

## 成果物

- - CI required check と visual update 境界を `phase-07.md` に記録する。

## 統合テスト連携

- - Phase 11 visual summary と Phase 12 compliance に接続する。

## 完了条件

- [ ] 上記 required status check 一覧が green
- [ ] visual snapshot 更新が含まれる場合は Phase 11 evidence に保存済
- [ ] pre-push hook が全件 pass

## 依存Phase trace

- Phase 5 / phase-05.md
- Phase 6 / phase-06.md
