# Phase 9: 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 名称 | 受入確認 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | runtime_pending |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (ロールバック手順) |

## 目的

index.md で定義した AC-1〜AC-10 を逐一チェックし、本タスクの受入合否を判定する。

## AC チェックリスト

| AC | 内容 | 検証手段 | 期待 |
| --- | --- | --- | --- |
| AC-1 | `pnpm.overrides.esbuild` が `0.27.3` 以上に bump されている | `package.json` diff 確認 | 値が新 override に更新 |
| AC-2 | `pnpm-lock.yaml` 再生成済み | `git status` で lockfile 変更を確認 | lockfile が新 override 値で resolve |
| AC-3 | `mise exec -- pnpm typecheck` PASS | コマンド実行 | exit 0 |
| AC-4 | `mise exec -- pnpm lint` PASS | コマンド実行 | exit 0 |
| AC-5 | `apps/api` build dry-run 成功 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` | `"import-source"` エラーなし |
| AC-6 | `apps/web` OpenNext build 成功 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0 |
| AC-7 | `web-cd / deploy-staging` 緑化 | GitHub Actions Run URL 確認 | conclusion: success |
| AC-8 | `backend-ci / deploy-staging` 緑化 | GitHub Actions Run URL 確認 | conclusion: success |
| AC-9 | 既存 vitest に regression なし | Phase 6 `outputs/phase-06/test-impact.md` 参照 | regression なし |
| AC-10 | ロールバック手順が文書化されている | Phase 10 `outputs/phase-10/rollback.md` 参照 | 手順 2 種（override 戻し / wrangler ピン維持）が記載済 |

## 判定基準

- 全 AC PASS → 受入完了 → Phase 10 へ
- いずれかの AC FAIL → 該当 Phase へ差し戻し（AC-5/6 失敗 → Phase 5 / 2 ゲート、AC-7/8 失敗 → Phase 7 再評価）

## 実行タスク

- [x] AC-1〜AC-5 / AC-10 を検証
- [ ] AC-6〜AC-9 の runtime / CI 境界を解消
- [x] 結果を `outputs/phase-09/acceptance.md` に記録（PASS/FAIL + evidence 参照）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/acceptance.md | AC-1〜AC-10 のチェック結果 |

## 完了条件

- [x] 全 AC の判定が記録されている
- [x] FAIL / pending があれば差し戻し先 Phase が明示されている

## 次 Phase

- 次: 10 (ロールバック手順)
- ブロック条件: AC-3/4/5/6/9 のいずれかが FAIL のまま Phase 10 に進まない（AC-7/8 は PR push 後の観測待ち）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
