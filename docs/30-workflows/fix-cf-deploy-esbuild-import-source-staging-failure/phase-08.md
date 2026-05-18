# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 名称 | ドキュメント更新 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | 7 (統合テスト方針) |
| 次 Phase | 9 (受入確認) |

## 目的

本タスクで生じる documentation drift を最小限に補正する。コードと文書の整合性を保ち、
次回同様の事故時に参照可能な note を残す。

## 更新候補一覧

| ファイル | 必要性 | 更新内容（案） |
| --- | --- | --- |
| `scripts/cf.sh` 内コメント (`scripts/cf.sh:5-8`) | 推奨 | override 値の参照先（wrangler 4.85.0 同梱版に整合）を明記 |
| `CLAUDE.md` 「Cloudflare 系 CLI 実行ルール」周辺 | 不要 | 既存記述で十分。追記しない |
| `docs/00-getting-started-manual/specs/` | 不要 | API / DB 仕様に影響なし |
| `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` 配下 | 必須 | 本タスク仕様書群（本仕様書） |

## `scripts/cf.sh` コメント更新案（参考）

```diff
 # - グローバル/サブパッケージ esbuild とのバージョン不整合を ESBUILD_BINARY_PATH で自動解決
-# - OpenNext build の host/binary mismatch 再発時は root package.json の pnpm.overrides.esbuild を
-#   @opennextjs/aws が使用する esbuild version に合わせ、pnpm install 後に build:cloudflare を再検証する
+# - OpenNext build の host/binary mismatch 再発時は root package.json の pnpm.overrides.esbuild を
+#   @opennextjs/aws と wrangler の両方が使用する esbuild version の共通最大版に合わせ、
+#   pnpm install --force 後に build:cloudflare と apps/api deploy --dry-run を再検証する
+#   （wrangler 4.85.0 同梱版は 0.27.x。0.25.x 系では "import-source" feature 名を parse できず deploy が失敗する）
```

> 実コメント編集は本サイクルで反映する。

## CHANGELOG / リリースノート

本リポジトリに CHANGELOG.md は存在しないため、ドキュメント更新は上記範囲に閉じる。
PR 本文（Phase 13）に「依存メタ bump の経緯」を記載し、それを履歴の正本とする。

## 実行タスク

- [ ] 更新候補一覧を確定
- [ ] `scripts/cf.sh` コメント更新の必要性を最終判断
- [ ] `outputs/phase-08/docs-updates.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/docs-updates.md | ドキュメント更新候補一覧と判定 |

## 完了条件

- [ ] 更新候補一覧が表で記載されている
- [ ] `scripts/cf.sh` コメント案が記録されている

## 次 Phase

- 次: 9 (受入確認)
- ブロック条件: なし

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
