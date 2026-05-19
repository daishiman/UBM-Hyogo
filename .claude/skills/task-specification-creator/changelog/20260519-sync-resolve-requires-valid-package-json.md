# sync:resolve は package.json が JSON-valid であることを前提とする (2026-05-19)

`feat/issue-256-e2e-coverage-baseline-runbook` に `origin/dev` を取り込んだ際、`pnpm sync:resolve` が package.json の conflict マーカー残置により即時失敗した事例。

## 教訓（task-specification-creator スキル適用先）
タスク仕様書の Phase 11（コンフリクト解消）/ sync-merge ワークフロー記述では、resolver 呼び出し前に **設定ファイル系（package.json / lockfile / tsconfig）を手動解消する pre-step を明示**すること。

## 正規順序
1. `git merge dev --no-edit`
2. **設定ファイル系 conflict を先に手動解消**（自律判断ルール B-1: dev 側採用 + 意味的再適用）
3. `git add <設定ファイル>` → `pnpm sync:resolve` で skill / indexes を自動 union
4. `lessons-learned/*` 等の append-only ファイルは L-DEVSYNC-012（両側ブロック保持）で手動解消
5. `pnpm indexes:rebuild` 後 `git commit`

## 不変条件
- `pnpm sync:resolve` は **設定ファイル系を解消対象から意図的に除外**している（依存バージョン上書き事故防止）
- 設定ファイル conflict 残置時に resolver を呼ぶと JSON parse error で即時 abort する

## 今回の判断例（参照用）
- `package.json scripts.observation:lint`: dev 側の glob 版 (`.github/workflows/*.yml` + actionlint 1.7.7) を採用。feature 側の個別列挙は drift 源となるため放棄
- 詳細は `aiworkflow-requirements/changelog/20260519-sync-resolve-requires-valid-package-json.md`
