# sync:resolve は package.json が JSON-valid であることを前提とする (2026-05-19)

`feat/issue-256-e2e-coverage-baseline-runbook` に `origin/dev` を取り込んだ際、`pnpm sync:resolve` が `Expected double-quoted property name in JSON at position N while parsing ... package.json` で即時失敗した。

## 失敗時の状況
- `git merge dev --no-edit` で skill / index / `package.json` が conflict 状態
- `package.json` 内に `<<<<<<<` / `|||||||` / `=======` / `>>>>>>>` マーカーが残置
- resolver スクリプト (`scripts/sync/resolve-skill-merge-conflicts.sh`) は内部で `package.json` を JSON parse するため、conflict マーカー残置時点で abort

## 確立した手順（正規順序）
1. `git merge dev --no-edit` で conflict 検出
2. **package.json / pnpm-lock.yaml / tsconfig 等の設定ファイル系を先に手動解消**（自律判断ルール B-1）
3. 設定ファイル系を `git add` してから `pnpm sync:resolve` を実行
4. resolver が skill / indexes の union 解消と `pnpm indexes:rebuild` を実行
5. 残った `lessons-learned/*` 等の append-only ファイルは L-DEVSYNC-012 ルール（両側ブロック保持）で手動解消

## 不変条件
- `pnpm sync:resolve` は **設定ファイル conflict を解消対象に含めない**。設定ファイル系の自動マージは事故源（依存バージョン上書き等）であるため意図的に外している
- 設定ファイル系の解消方針は CLAUDE.md「コンフリクト解消の既定方針」表が正本: package.json は dev 側採用 + ローカル差分の意味的再適用、lockfile は再生成可能なら削除→再生成

## 今回適用した解消例（actionlint 行）
- HEAD 側: 個別 workflow 列挙 (`post-release-observation-reminder.yml ci.yml web-cd.yml runtime-smoke-staging.yml verify-esbuild.yml verify-coverage-exclude-ratio.yml`)
- dev 側: glob `.github/workflows/*.yml` + `actionlint` version pin `1.7.7`
- 採用: **dev 側**（glob 版は feature 追加分 `verify-coverage-exclude-ratio.yml` を既に包含し、かつ将来追加 workflow も自動カバーするため列挙の drift が発生しない）

## 適用先
- `task-specification-creator` skill: sync-merge ワークフロー記述で同様の前提が必要。並列 changelog を追加（`20260519-sync-resolve-requires-valid-package-json.md`）
- このスキル: indexes / SKILL.md レベルへの昇格は不要（CLAUDE.md の既定方針表で十分カバー、本 changelog は適用例として残す）
