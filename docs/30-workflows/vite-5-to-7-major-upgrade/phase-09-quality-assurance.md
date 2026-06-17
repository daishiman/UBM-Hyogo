# Phase 9: Quality Assurance（品質保証）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-07（coverage 確認） / phase-08（リファクタ） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 主目的 | 全受入条件（AC-1〜AC-8）を機械的に検証し、Vite 5.4.21 → 7.x の依存アップグレードが全 shard / ビルドの green を保つことを担保 |

## 全受入条件 (AC) 検証一覧（phase-01 が本表の抜粋を参照する正本）

AC-1〜AC-8 の確定定義を本表に集約する。phase-01-requirements.md / index.md は本表を抜粋参照し、独自に値を作り変えない。実行は全て `mise exec --` 経由（Node 24.15.0 / pnpm 10.33.2 固定）。

| AC | 内容 | 検証コマンド | PASS 基準 |
| --- | --- | --- | --- |
| AC-1 | root package.json に vite 直接依存追加 | `grep -n '"vite"' package.json` | root `devDependencies` に `"vite": "^7.0.0"` が**直接 devDependency として**存在する（追加前は 0 件） |
| AC-2 | lockfile 単一 7.x 解決（重複なし） | `mise exec -- pnpm why vite` | vite が単一の `7.x` 系に解決され、5系と7系の**併存（重複）がない**（V1/V7） |
| AC-3 | typecheck green | `mise exec -- pnpm typecheck` | exit 0（green） |
| AC-4 | lint green | `mise exec -- pnpm lint` | exit 0（green） |
| AC-5 | 全 shard green・fail 0 | `mise exec -- pnpm exec vitest run` を shard 別実行（`api-unit` / `api-d1` / `web` / `og` / `packages` / `scripts` / `infra`） | 全 7 shard で fail 0（skip 増なし） |
| AC-6 | deprecation 警告 0 件 | vitest 実行ログを採取し `grep -iE 'deprecat\|splitVendorChunkPlugin\|legacy\|resolve\.conditions'` | Vite 6/7 で削除・非推奨化された API（`splitVendorChunkPlugin` / `legacy` / `resolve.conditions` 既定変更 / CJS Node API 等・V4）に起因する警告が 0 件 |
| AC-7 | D1 singleFork 維持で port exhaustion なく完走 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api` + `grep -n 'pool\|singleFork' vitest.d1.config.ts` | api-d1 shard が hang / EADDRINUSE なく完走し、`pool: 'forks'` / `singleFork: true`（issue-617 回避設計・V7）が保持されている |
| AC-8 | apps/web sanity build 成功・OpenNext bundle 健全 | `mise exec -- pnpm build` | `apps/web` の `next build --webpack`（OpenNext Workers）が成功し、deploy bundle に `[project]/...` 仮想 specifier の混入がない（V8・Vite 非依存の確認・blocker ではない） |

> **baseline**: AC-5 / AC-6 の baseline（vite 5.4.21 時点の pass/skip 件数・deprecation 警告状況）は Phase 4 の RED 採取時に控えた値を正本とする。AC-2 の追加前 ground truth は `vite@5.4.21`（単一解決・SSOT §2）。

## 破壊的変更カテゴリ（V1〜V8）との対応

AC は SSOT §5 の破壊的変更カテゴリ V1〜V8 を横断検証する。対応関係を明示する。

| カテゴリ | 確認観点 | 対応 AC |
| --- | --- | --- |
| V1 解決機構（devDep 追加で 5.4.21→7.x） | vite ^7 追加で引き上げ | AC-1 / AC-2 |
| V2 resolve.alias / optimizeDeps 挙動 | react subpath 解決が等価維持で green | AC-3 / AC-5 |
| V3 @vitejs/plugin-react interop | `plugins:[react()]` の v7 連携 warning 0 | AC-5 / AC-6 |
| V4 deprecation / removed API | 削除済み API 警告 0 | AC-6 |
| V5 esbuild 整合 | `overrides.esbuild=0.27.3` と v7 の整合 | AC-2（install 成否） |
| V6 Node engine 要件 | Node 24.15.0 で充足（NFR・対応不要） | （前提・検証外） |
| V7 vite-node / 重複バージョン | 単一解決 | AC-2 / AC-7 |
| V8 apps/web ビルド非影響 | next webpack ビルド sanity | AC-8 |

## 品質ゲート一覧

各ゲートのコマンドと期待結果。AC を横断する CI 相当の検証群。

| ゲート | コマンド | 期待結果 |
| --- | --- | --- |
| install（lockfile 確定） | `mise exec -- pnpm install` | vite 7.x 単一解決で再生成成功（peer 破壊なし・V5） |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint`（必要時 `--fix`） | exit 0 / 違反 0 |
| 全 shard vitest | `mise exec -- pnpm exec vitest run`（api-unit / api-d1 / web / og / packages / scripts / infra） | 全 7 shard green |
| coverage 閾値 | `mise exec -- bash scripts/coverage-guard.sh`（閾値判定含む） | 閾値割れなし（不変条件8 / 既存水準を下げない） |
| vite 単一解決 | `mise exec -- pnpm why vite` | 単一 7.x（重複 0・V1/V7） |
| deprecation 警告 grep | vitest 実行ログ → `grep -iE 'deprecat\|splitVendorChunkPlugin\|legacy\|resolve\.conditions'` | ヒット 0 件（V4） |
| D1 pool 設定保持 | `grep -n 'pool\|singleFork' vitest.d1.config.ts` | `pool: 'forks'` / `singleFork: true` が残存（V7） |
| apps/web sanity build | `mise exec -- pnpm build` | OpenNext bundle 健全（`[project]/...` 混入なし・V8） |

## 不変条件チェック（SSOT §8 全 9 件）

QA で全 9 不変条件の保持を機械的に確認する。

| # | 不変条件 | 検証方法 | PASS 基準 |
| --- | --- | --- | --- |
| 1 | test file は `*.spec.{ts,tsx}` 固定（新規追加しない） | `git diff --name-only` で `*.test.*` 追加なし / `*.spec.*` の新規追加なし | verify-test-suffix gate PASS / 新規 spec 0 |
| 2 | `vitest.config.ts` の alias / optimizeDeps / dedupe / `plugins:[react()]` を破壊しない | config diff レビュー | 等価維持（削除・意味変更なし） |
| 3 | `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を破壊しない | `grep -n 'pool\|singleFork' vitest.d1.config.ts` | 設定残存（AC-7 と同根拠） |
| 4 | `pnpm.overrides.esbuild = "0.27.3"` を維持 | `grep -n 'esbuild' package.json` | `"esbuild": "0.27.3"` 残存（不整合時のみ Phase 3 エスカレーション） |
| 5 | D1 直接アクセスは `apps/api` に閉じる（schema 変更なし） | `git diff` で D1 schema / web 側 D1 binding 変更なし | 変更 0 |
| 6 | Node 24.15.0 / pnpm 10.33.2 を `mise exec --` 経由で固定実行 | 全コマンドが `mise exec --` プレフィックス | 直接 pnpm 実行なし |
| 7 | green 基準を緩めない（skip 増加禁止） | アップグレード前後の `passed`/`skipped` 件数比較 | skip 件数が baseline から増えていない |
| 8 | coverage 閾値を下げない | `scripts/coverage-guard.sh` 閾値判定 | 閾値割れなし |
| 9 | `apps/web` 本番ビルドは `next build --webpack` 正本維持（Turbopack 混入なし） | AC-8 build + bundle grep | `[project]/...` 仮想 specifier 混入なし |

## mirror parity / link 確認

| 項目 | 該当 | 内容 |
| --- | --- | --- |
| skill mirror parity | **該当なし** | 本タスクは `package.json` / `pnpm-lock.yaml` / `vitest.config.*` / 必要時 `*.spec.ts` のコードのみが対象。`.claude/skills/**` の mirror 同期は本タスクのスコープ外 |
| docs link 整合 | 該当 | 本ワークフロー dir 内の相互リンク（index.md ↔ phase-NN.md / `_shared-context.md`）が解決すること |
| PR pre-flight gate | 該当 | `bash scripts/verify-pr-ready.sh`（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証）を PR 作成前（Phase 13）に実行 |
| verify-hook-integrity | 該当（CI） | `lefthook.yml` / `.git/hooks/*` を本タスクで編集しないこと（編集していなければ自動 PASS） |
| verify-test-suffix | 該当（CI） | 修正テストが `*.spec.{ts,tsx}` であること（`*.test.*` 禁止 / 不変条件1） |

> 本タスクは依存アップグレードのため、skill ドキュメントの mirror 同期は伴わない。コード側の CI gate（typecheck / lint / vitest / coverage-guard）と PR pre-flight gate を品質保証の中心に据える。

## line budget（仕様書ファイルの妥当性）

| 項目 | 該当 | 内容 |
| --- | --- | --- |
| 仕様書 line budget | 参考 | 本ワークフローの各 phase-NN.md は親テンプレ（vitest 2→3 の phase-08〜10）と同等の粒度に収める。冗長な再掲を避け、AC / ゲート / 不変条件はテーブルで簡潔に表現する |
| プロダクト line budget | 該当なし | 本タスクはプロダクトコードを増減しない（vite 直接依存追加 + lockfile 再生成 + 必要時のテスト期待値修正のみ）。LOC 予算の対象外 |

## 品質保証の実行順序

```
pnpm install（lockfile 確定 / vite 7.x 単一解決・V5）
  → pnpm why vite（AC-2 / V1/V7 単一解決確認）
  → pnpm typecheck（AC-3）
  → pnpm lint（AC-4）
  → 全 shard vitest run（AC-5 / api-unit, api-d1, web, og, packages, scripts, infra）
  → deprecation 警告 grep（AC-6 / V4）
  → D1 singleFork 完走 + pool 設定 grep（AC-7 / V7）
  → coverage-guard.sh（不変条件8 閾値）
  → pnpm build（AC-8 / apps/web OpenNext sanity・V8）
  → 不変条件 9 件チェック
```

## 完了条件

- [ ] AC-1〜AC-8 が検証コマンドと PASS 基準付きで一括判定表として一覧化されている（phase-01 が抜粋参照する正本）
- [ ] 破壊的変更カテゴリ V1〜V8 と AC の対応が明示されている
- [ ] 品質ゲート（install / typecheck / lint / vitest / coverage / vite 単一解決 / deprecation grep / D1 pool 保持 / apps/web build）が一覧化されている
- [ ] 不変条件 SSOT §8 の全 9 件が検証方法・PASS 基準付きで確認されている
- [ ] mirror parity が「該当なし（コードのみ）」と明記され、該当 CI gate（verify-pr-ready.sh 等）が列挙されている
- [ ] line budget の妥当性が記載されている
- [ ] 全 AC が PASS（fail 0 / skip 増なし / deprecation 警告 0 / vite 単一 7.x 解決 / apps/web build 成功）
