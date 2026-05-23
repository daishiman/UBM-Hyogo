[実装区分: 実装仕様書]

# Phase 9: 品質保証

## 目的

lint / typecheck / Playwright list / CI dry-run / GitHub Actions yaml lint を実施し、Phase 5〜8 の成果物を品質ゲートで検証する。仕様書作成時点では未実行であり、実装サイクルで実測値へ差し替える。

---

## 入力

- `outputs/phase-5/implementation-notes.md`
- `outputs/phase-6/test-additions.md`
- `outputs/phase-7/coverage.md`
- `outputs/phase-8/refactor.md`

---

## 1. 品質ゲート実行コマンド

```bash
# 1. 型チェック
mise exec -- pnpm typecheck

# 2. lint
mise exec -- pnpm lint

# 3. workflow yaml 構文チェック（actionlint）
# brew install actionlint  # 未インストール時のみ
actionlint .github/workflows/playwright-visual-full.yml
actionlint .github/workflows/playwright-visual-baseline-update.yml

# 4. playwright local（参考: macOS 上では baseline 差分が出るため、構文・実行可否のみ確認）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-full-chromium-desktop --list

# 5. baseline 51 件確認（Phase 7 §1）
COUNT=$(ls -1 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "baseline count: ${COUNT}"
test "${COUNT}" = "51"
```

---

## 2. CI dry-run

```bash
# PR を draft で push して playwright-visual-full workflow が path-filter 対象として起動するか確認
gh pr create --draft --base dev --title 'wip: task-18-fu' --body 'dry-run for visual-full workflow'
gh run watch
```

→ 実装サイクルで workflow が起動し、matrix の 3 viewport が並列実行されること、各 job が baseline 取得を試みることを確認する。baseline 未存在の fail を required check として許容しない。

---

## 3. ローカル CI 等価実行（オプション）

ubuntu container でローカル CI 等価を再現したい場合:

```bash
# act がインストールされていれば
act -W .github/workflows/playwright-visual-full.yml -j visual-full --matrix viewport:desktop
```

---

## 4. チェックリスト

| 項目 | 期待結果 | spec_created 時点 |
|------|---------|
| `pnpm typecheck` | `completed` | `runtime_pending` |
| `pnpm lint` | `completed` | `runtime_pending` |
| `actionlint` (2 ファイル) | `completed` | `runtime_pending` |
| `playwright test --list` で 17 × 3 = 51 test 列挙 | `completed` | `runtime_pending` |
| `playwright-visual-full` workflow CI 起動 | `completed` | `runtime_pending` |
| 51 baseline 全件存在 | `completed` | `runtime_pending` |

---

## 5. DoD

1. 実装サイクルで §1 の 5 コマンドすべてが `completed` になる
2. §2 CI dry-run で workflow trigger が path-filter 通り発火する
3. §4 チェックリスト全項目で期待結果一致を実測ログへ転記する

---

## 6. 成果物

- `outputs/phase-9/qa.md`
