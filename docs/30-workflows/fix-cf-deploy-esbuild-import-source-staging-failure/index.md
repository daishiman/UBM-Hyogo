# fix-cf-deploy-esbuild-import-source-staging-failure - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: ルート `package.json` の `pnpm.overrides.esbuild` bump と `pnpm-lock.yaml` 再生成、必要に応じて `scripts/cf.sh` の fallback ロジック追記が成果物。docs 単独では完結せず、GitHub Actions `web-cd / deploy-staging` と `backend-ci / deploy-staging` の緑化を DoD とする 1 PR 完結の実装タスク。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | FIX-CF-DEPLOY-ESBUILD-IMPORT-SOURCE |
| タスク名 | Cloudflare deploy ワークフロー失敗 (`"import-source" is not a valid feature name`) の修正 |
| ディレクトリ | docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure |
| 親タスク | なし（独立した障害修正） |
| ブランチ | fix/cf-deploy-esbuild-import-source-staging-failure |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| 優先度 | HIGH（staging / production deploy パイプライン全停止中） |
| 関連 PR | #461（再現確認元 / 修正適用先候補） |

## 障害概要

GitHub Actions の以下ジョブが共通エラーで失敗している:

- `web-cd / deploy-staging`（`apps/web` の OpenNext Cloudflare build 経由 deploy）
- `web-cd / deploy-production`（同上）
- `backend-ci / deploy-staging`（`apps/api` の wrangler deploy）
- `backend-ci / deploy-production`（同上）

エラー出力（要旨）:

```
✘ [ERROR] Build failed with 1 error:
  ✘ [ERROR] "import-source" is not a valid feature name for the "supported" setting
```

`supported` は esbuild の build option で、`import-source` feature 名は **esbuild 0.25.5 以降 / 0.27.x 系で導入**されたもの。現在ルート `package.json` の `pnpm.overrides.esbuild` が `"0.25.4"` に固定されているため、wrangler 4.85.0 が内部で要求する esbuild（`0.27.3`）が override によって 0.25.4 にダウングレードされ、`import-source` feature 名を parse できず即座に build error になる。

## 目的

Cloudflare deploy パイプラインを緑化し、staging / production への deploy 経路を復旧する。
ローカルでも同等の build 失敗が再現する（`scripts/cf.sh deploy --dry-run` で同一エラー想定）ため、ローカル検証経路も同時に正常化する。

## スコープ

### 含む

- ルート `package.json` の `pnpm.overrides.esbuild` を wrangler 4.85.0 / OpenNext 互換版へ bump（第一候補: `"0.27.3"` 以上）
- `pnpm-lock.yaml` の `pnpm install --force` による再生成
- `scripts/cf.sh` の `ESBUILD_BINARY_PATH` fallback ロジックの動作確認（必要に応じて nested esbuild が存在しなくなった場合の path 解決を追記）
- 互換性検証: `@opennextjs/aws` / `@opennextjs/cloudflare` が要求する esbuild メジャー範囲の確認
- 代替案ゲート: 第一候補で OpenNext 不整合が出た場合、`wrangler` 自身を `4.92.0` 以降へ bump して再評価
- `apps/api` / `apps/web` のローカル build 検証（dry-run / outdir）
- CI 緑化確認（`web-cd / deploy-staging` と `backend-ci / deploy-staging` の両 job）

### 含まない

- `apps/api` / `apps/web` の機能変更
- D1 schema 変更
- Cloudflare Secrets / Variables の追加変更
- `wrangler.toml` の機能設定変更（cron / vars / bindings）
- `.github/workflows/web-cd.yml` / `backend-ci.yml` の job ロジック変更（wranglerVersion のピン更新は代替案採用時のみ）
- esbuild メジャー bump に伴う Node.js / OpenNext の大規模追従

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | package.json | `pnpm.overrides.esbuild` 正本 |
| 必須 | pnpm-lock.yaml | 再生成対象 |
| 必須 | scripts/cf.sh | esbuild path 解決ロジック・override の意図コメント |
| 必須 | apps/api/wrangler.toml | wrangler 経由 build の対象 |
| 必須 | apps/web/wrangler.toml | OpenNext 経由 build の対象 |
| 必須 | .github/workflows/web-cd.yml | `web-cd / deploy-staging` の発火源 |
| 必須 | .github/workflows/backend-ci.yml | `backend-ci / deploy-staging` の発火源・`wranglerVersion: 4.85.0` ピン |
| 必須 | CLAUDE.md | `scripts/cf.sh` 運用ルール / `wrangler` 直接禁止 |
| 参考 | https://esbuild.github.io/api/#supported | esbuild `supported` feature 一覧 |
| 参考 | https://github.com/evanw/esbuild/releases/tag/v0.25.5 | `import-source` feature 導入リリース |
| 参考 | https://github.com/cloudflare/workers-sdk/releases | wrangler 4.85.0 / 4.92.0 リリースノート |
| 参考 | https://opennext.js.org/cloudflare | OpenNext Cloudflare adapter |

## 受入条件 (AC)

- **AC-1**: ルート `package.json` の `pnpm.overrides.esbuild` が wrangler 4.85.0 同梱版（`0.27.3` 以上）と整合する値に更新されている。
- **AC-2**: `pnpm-lock.yaml` が `pnpm install --force` で再生成され、wrangler / OpenNext / esbuild の依存ツリーがすべて新 override 値で resolve されている。
- **AC-3**: `mise exec -- pnpm typecheck` が PASS。
- **AC-4**: `mise exec -- pnpm lint` が PASS。
- **AC-5**: ローカルで `apps/api` の wrangler build 相当（`scripts/cf.sh deploy --dry-run` または `--outdir` ビルド）が成功し、`"import-source" is not a valid feature name` エラーが出ない。
- **AC-6**: ローカルで `apps/web` の OpenNext build（`pnpm --filter @ubm-hyogo/web build` 相当）が成功する。
- **AC-7**: PR push 後、GitHub Actions の `web-cd / deploy-staging` ジョブが緑になる。
- **AC-8**: PR push 後、GitHub Actions の `backend-ci / deploy-staging` ジョブが緑になる。
- **AC-9**: 既存テスト（`vitest` 利用箇所）が esbuild override 変更で regression を起こさない（`pnpm test` の影響範囲を Phase 6 で確認）。
- **AC-10**: ロールバック手順（override を `0.25.4` に戻す / wrangler ピンを 4.85.0 に固定維持する）が Phase 10 に明文化されている。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 現状把握 | phase-01.md | completed | outputs/phase-01/dependency-map.md |
| 2 | 候補解比較・採択 | phase-02.md | completed | outputs/phase-02/option-comparison.md |
| 3 | 全体設計 | phase-03.md | completed | outputs/phase-03/change-plan.md |
| 4 | 詳細実装手順 | phase-04.md | completed | outputs/phase-04/implementation-steps.md |
| 5 | ローカル検証 | phase-05.md | runtime_pending | outputs/phase-05/local-verification.md |
| 6 | ユニットテスト影響評価 | phase-06.md | runtime_pending | outputs/phase-06/test-impact.md |
| 7 | 統合テスト方針 | phase-07.md | runtime_pending | outputs/phase-07/integration-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | runtime_pending | outputs/phase-09/acceptance.md |
| 10 | ロールバック手順 | phase-10.md | completed | outputs/phase-10/rollback.md |
| 11 | NON_VISUAL evidence | phase-11.md | runtime_pending | outputs/phase-11/ci-evidence.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,...}.md |
| 13 | PR・振り返り | phase-13.md | blocked | outputs/phase-13/pr-summary.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/dependency-map.md | esbuild / wrangler / OpenNext の依存マップと CI 失敗ログ要約 |
| ドキュメント | outputs/phase-02/option-comparison.md | 3 候補（override bump / wrangler bump / 両者）の比較と採択結果 |
| ドキュメント | outputs/phase-03/change-plan.md | 変更対象ファイル一覧と Phase 4 以降の俯瞰 |
| ドキュメント | outputs/phase-04/implementation-steps.md | `package.json` diff 案・`pnpm install --force` 手順・`scripts/cf.sh` 確認 |
| ドキュメント | outputs/phase-05/local-verification.md | ローカル typecheck / lint / build dry-run 手順と期待値 |
| ドキュメント | outputs/phase-10/rollback.md | 退避手順 2 種 |
| ドキュメント | outputs/phase-11/ci-evidence.md | CI Run URL canonical 保管規約 |
| ドキュメント | outputs/phase-12/implementation-guide.md | PR 本文転記用ガイド（CONST_005 11 パート） |
| 管理 | artifacts.json | workflow state / Phase 1-13 status |

## 不変条件

1. **CONST_005 適合**: 変更対象ファイル / 構造（依存メタとしての overrides オブジェクト） / 入出力（pnpm install の依存解決挙動） / テスト方針（local + CI） / ローカル実行コマンド / DoD（CI 2 job 緑化）を本仕様書内で漏れなく記述する。
2. **CONST_007 適合（1 サイクル完結）**: 本タスクは「override bump + lockfile 再生成 + CI 緑化確認 + 必要なら OpenNext 互換補正」を 1 PR 内で完了させる。将来タスクや別 PR への先送りは禁止。
3. **`wrangler` 直接実行禁止**: ローカル検証は `bash scripts/cf.sh` ラッパー経由のみ。
4. **`.env` 実値禁止**: 平文 secret は触れない。
5. **`apps/web` の D1 直接アクセス禁止**: 本タスクで境界に変更は加えない。
6. **`apps/web` の `next build --webpack` 維持**: CLAUDE.md の不変条件に従い Turbopack を production build に混入させない。
7. **ピン更新の最小化**: `wranglerVersion: 4.85.0` ピンは第一候補で問題解決すれば変更しない。代替案採用時のみ Phase 2 の判定に従って bump する。
8. **CI gate を bypass しない**: `--no-verify` での push 禁止。lefthook / required status checks をすべて通す。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| esbuild bump で OpenNext build が別エラーに変わる | Phase 5 のローカル `apps/web` build 検証で先行検知。失敗時は Phase 2 ゲートに戻り wrangler bump 案へ切替 |
| `pnpm-lock.yaml` 大規模差分で review コスト増 | diff 量が大きくても override 起因の決定的差分。PR 本文に「依存解決の必然差分」と明示 |
| nested esbuild path 構造変化で `scripts/cf.sh` の fallback が当たらない | Phase 5 で `ls node_modules/wrangler/node_modules/@esbuild` を確認し、必要なら `scripts/cf.sh` の探索 path 配列を拡張 |
| vitest が esbuild 0.27.x で挙動変化（trans piler の差分） | Phase 6 で `pnpm test` 影響範囲をサンプル実行し regression を検出 |
| 代替案（wrangler 4.92.0 bump）採用時に `wranglerVersion` ピン箇所漏れ | Phase 2 の代替案決定時に `.github/workflows/*.yml` の `wranglerVersion:` 全箇所を grep ベースで列挙 |
| ローカル成功・CI 失敗のドリフト | Phase 11 で CI Run URL を canonical evidence として保管し、再現条件を記録 |

## Phase マップ

```
phase-01 (現状把握)
  └─ outputs/phase-01/dependency-map.md
       │
       ▼
phase-02 (候補解比較・採択)
  └─ outputs/phase-02/option-comparison.md
       │
       ▼
phase-03 (全体設計) → phase-04 (詳細手順) → phase-05 (ローカル検証)
       │
       ▼
phase-06 (テスト影響) → phase-07 (統合テスト方針) → phase-08 (docs)
       │
       ▼
phase-09 (受入) → phase-10 (rollback) → phase-11 (evidence)
       │
       ▼
phase-12 (正本同期) → phase-13 (PR・振り返り)
```

## 注意点

- 本タスクは「依存メタの 1 行 bump + lockfile 再生成」を主成果とし、CONST_004/005 に従って実ファイルと Phase outputs を同一 wave で反映した。
- `outputs/phase-12/` の状態語彙は **`implemented_local_evidence_captured / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`**。CI 実行で staging deploy 緑化を観測した時点で `completed` 相当へ昇格する。
- Phase 13 の commit / push / PR は user-gated（CLAUDE.md の「PR 作成の完全自律フロー」依頼があった場合のみ実行）。
