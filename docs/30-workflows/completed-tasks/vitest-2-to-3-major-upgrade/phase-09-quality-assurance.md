# Phase 9: Quality Assurance（品質保証）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-07（coverage 確認） / phase-08（リファクタ） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 主目的 | 全受入条件（AC-1〜8）を機械的に検証し、依存アップグレードが green を保つことを担保 |

## 全受入条件 (AC) 検証一覧（phase-01 AC を引用）

phase-01-requirements.md / index.md で確定した AC-1〜8 について、検証コマンドと PASS 基準を明記する。実行は全て `mise exec --` 経由（Node 24.15.0 / pnpm 10.33.2 固定）。

| AC | 内容 | 検証コマンド | PASS 基準 |
| --- | --- | --- | --- |
| AC-1 | package.json 3ファイルの version | `grep -n '"vitest"\|"@vitest/coverage-v8"' package.json apps/api/package.json apps/og/package.json` | root `vitest`/`@vitest/coverage-v8` ともに `^3.2.6`、apps/api・apps/og の `vitest` が `^3.2.6` |
| AC-2 | lockfile 解決 | `mise exec -- pnpm why vitest` / `mise exec -- pnpm why @vitest/coverage-v8` | 両者が `3.2.6` 系に解決され、バージョンが一致。vite は `5/6/7` のいずれかに解決 |
| AC-3 | typecheck | `mise exec -- pnpm typecheck` | exit 0（green） |
| AC-4 | lint | `mise exec -- pnpm lint` | exit 0（green） |
| AC-5 | 全 shard green | `mise exec -- bash scripts/coverage-guard.sh`（shard `[web, api-unit, api-d1, packages, og]`） | 全 shard で fail 0 |
| AC-6 | deprecation 警告ゼロ | vitest 実行ログを採取し `grep -iE 'deprecat\|deps.inline\|workspace.*projects'` | 未対応 deprecation 警告が 0 件（現行 config は `deps.inline`/`workspace` 未使用のため期待値 0） |
| AC-7 | D1 singleFork 維持 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` + `vitest.d1.config.ts` の `pool: forks`/`singleFork: true` を `grep` 確認 | D1 shard が hang/EADDRINUSE なく完走し、config の pool 設定が保持されている |
| AC-8 | skip 増加なし | アップグレード前後の vitest 出力 `Tests N passed | M skipped` を比較 | skip 件数が baseline から増えていない（`--passWithNoTests` 由来を除く） |

> AC-5 / AC-8 の baseline（v2.1.9 時点の pass/skip 件数・全 651 spec）は Phase 4 の RED 採取時に控えた値を正本とする。

## 品質ゲート一覧

各ゲートのコマンドと期待結果。AC を横断する CI 相当の検証群。

| ゲート | コマンド | 期待結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint`（必要時 `--fix`） | exit 0 / 違反 0 |
| 全 shard vitest | `mise exec -- bash scripts/coverage-guard.sh` | web / api-unit / api-d1 / packages / og 全 green |
| coverage-guard | `mise exec -- bash scripts/coverage-guard.sh`（閾値判定含む） | 閾値割れなし（C6 由来の不可避ずれを除き低下なし / NFR-5） |
| coverage 閾値 lint | `mise exec -- pnpm exec vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` | PASS |
| バージョン整合 | `mise exec -- pnpm why vitest` / `pnpm why @vitest/coverage-v8` | 両者 3.2.6 一致（NFR-1） |
| deprecation 警告 grep | vitest 実行ログ → `grep -iE 'deprecat\|deps\.inline\|workspace'` | ヒット 0 件 |
| D1 pool 設定保持 | `grep -n 'pool\|singleFork' vitest.d1.config.ts` | `pool: 'forks'` / `singleFork: true` が残存 |
| C8 非推奨記法検出 | `grep -rEn "(test|describe|it)\([^,]+,[^,]+,\s*\{" apps packages scripts` | 第3引数オブジェクト記法があれば修正済み（任意ゲート） |

## mirror parity / link 確認

| 項目 | 該当 | 内容 |
| --- | --- | --- |
| skill mirror parity | **該当なし** | 本タスクは `package.json` / `pnpm-lock.yaml` / `vitest.config.*` / `*.spec.ts` のコードのみが対象。`.claude/skills/**` の mirror 同期は本タスクのスコープ外 |
| docs link 整合 | 該当 | 本ワークフロー dir 内の相互リンク（index.md ↔ phase-NN.md）が解決すること |
| PR pre-flight gate | 該当 | `bash scripts/verify-pr-ready.sh`（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証）を PR 作成前（Phase 13）に実行 |
| verify-hook-integrity | 該当（CI） | `lefthook.yml` / `.git/hooks/*` を本タスクで編集しないこと（編集していなければ自動 PASS） |
| verify-test-suffix | 該当（CI） | 新規/修正テストが `*.spec.{ts,tsx}` であること（`*.test.*` 禁止 / 不変条件1） |

> 本タスクは依存アップグレードのため、skill ドキュメントの mirror 同期は伴わない。コード側の CI gate（typecheck / lint / vitest / coverage-guard）と PR pre-flight gate を品質保証の中心に据える。

## line budget（仕様書ファイルの妥当性）

| 項目 | 該当 | 内容 |
| --- | --- | --- |
| 仕様書 line budget | 参考 | 本ワークフローの各 phase-NN.md は index.md（約 117 行）/ phase-01〜03（約 50〜90 行）と同等の粒度に収める。冗長な再掲を避け、AC/ゲートはテーブルで簡潔に表現する |
| プロダクト line budget | 該当なし | 本タスクはプロダクトコードを増減しない（version bump + 必要時のテスト期待値修正のみ）。LOC 予算の対象外 |

## 品質保証の実行順序

```
pnpm install --force（lockfile 確定）
  → pnpm typecheck（AC-3）
  → pnpm lint（AC-4）
  → coverage-guard.sh（AC-5 / 全 shard green + 閾値）
  → pnpm why vitest / coverage-v8（AC-1/AC-2 整合）
  → deprecation 警告 grep（AC-6）
  → D1 singleFork 完走確認（AC-7）
  → skip 件数 baseline 比較（AC-8）
```

## 完了条件

- [ ] AC-1〜8 が検証コマンドと PASS 基準付きで一覧化されている
- [ ] 品質ゲート（typecheck / lint / vitest / coverage-guard / version 整合 / deprecation grep / D1 pool 保持）が一覧化されている
- [ ] mirror parity が「該当なし（コードのみ）」と明記され、該当 CI gate（verify-pr-ready.sh 等）が列挙されている
- [ ] line budget の妥当性が記載されている
- [ ] 全 AC が PASS（fail 0 / skip 増なし / deprecation 警告 0 / version 一致）
