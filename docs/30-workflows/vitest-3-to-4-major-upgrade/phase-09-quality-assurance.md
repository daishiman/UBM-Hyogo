# Phase 9: Quality Assurance（品質保証）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-07-coverage-check.md / phase-08-refactoring.md |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 主目的 | 全受入条件（AC-1〜AC-9）を機械的に検証し、依存アップグレードが green を保つことを担保 |

## 全受入条件 (AC) 検証一覧（phase-01 AC-1〜AC-9 を正本として完全列挙）

phase-01-requirements.md / index.md で確定した AC-1〜AC-9 について、検証コマンドと PASS 基準を明記する。実行は全て `mise exec --` 経由（Node 24.15.0 / pnpm 10.33.2 固定）。検証コマンドは artifacts.json の `mutation_commands` を正本とする。

| AC | 内容 | 検証コマンド | PASS 基準 |
| --- | --- | --- | --- |
| AC-1 | package.json 3ファイルの version | `grep -n '"vitest"\|"@vitest/coverage-v8"\|"@vitejs/plugin-react"' package.json apps/api/package.json apps/og/package.json` | root の `vitest` / `@vitest/coverage-v8` が `^4.1.8`、`@vitejs/plugin-react` が `^5.2.0`、apps/api・apps/og の `vitest` が `^4.1.8` |
| AC-2 | lockfile 解決 / version parity | `mise exec -- pnpm why vitest` / `mise exec -- pnpm why @vitest/coverage-v8` / `mise exec -- pnpm why vite` / `mise exec -- pnpm why @vitejs/plugin-react`（pnpm why ×4） | vitest と coverage-v8 が同一 4.1.x で完全一致（exact pin）。vite が ^6/^7/^8 範囲に解決。`mise exec -- pnpm install` 出力に plugin-react の peer 警告がない |
| AC-3 | typecheck | `mise exec -- pnpm typecheck` | exit 0（green） |
| AC-4 | lint | `mise exec -- pnpm lint` | exit 0（green） |
| AC-5 | 全 shard green | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` / `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit` / `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` / `mise exec -- pnpm --filter @ubm-hyogo/og test:coverage` + packages + `mise exec -- pnpm test:scripts` / `mise exec -- pnpm test:alerts && mise exec -- pnpm test:sentry-alerts` | CI 5 shard 相当（web / api-unit / api-d1 / packages / og）+ 補助 suite（scripts / alerts / sentry-alerts / infra）全てで fail 0 |
| AC-6 | deprecation 警告ゼロ | shard 実行ログを採取し `grep -iE 'deprecat'`（v4.1 の `vitest/*` エントリポイント / spy `toBe*` 系 / `vi.mock` トップレベル外 を含む） | 未対応の deprecation 警告が 0 件、または「対応不要」と分類記録されている（Phase 8 の記録と整合） |
| AC-7 | D1 直列化の v4 表現 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` + `grep -n 'pool\|maxWorkers\|isolate' vitest.d1.config.ts` | D1 shard が hang / EADDRINUSE（port exhaustion）なく完走し、config が `pool: "forks"` + `maxWorkers: 1` になっている。`isolate: false` は存在しない |
| AC-8 | skip 非増加 + obsolete snapshot 0 件 | shard 実行ログの `Tests N passed \| M skipped` を Phase 4 RED 採取時の baseline と比較 + 実行ログ `grep -i 'obsolete'` | skip 件数が baseline から増えていない（`--passWithNoTests` 由来を除く）かつ obsolete snapshot 0 件（**v4 は CI 上の obsolete snapshot で fail する**ため必須） |
| AC-9 | C1-C8（v4 版）分類記録 | `ls docs/30-workflows/vitest-3-to-4-major-upgrade/outputs/` + 記録ファイルの目視確認 | v3→v4 breaking-change の分類記録（C1-C8 v4 版）と対応差分が `outputs/` に残っている |

> AC-5 / AC-8 の baseline（v3.2.6 時点の pass/skip 件数・全 693 spec）は Phase 4 の RED 採取時に控えた値を正本とする。

## 品質ゲート一覧

各ゲートのコマンドと期待結果。AC を横断する CI 相当の検証群。

| ゲート | コマンド | 期待結果 |
| --- | --- | --- |
| install（lockfile 確定） | `mise exec -- pnpm install` | peer 警告なしで解決（plugin-react ^5.2.0 × vite 6-8） |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint`（必要時 `--fix`） | exit 0 / 違反 0 |
| 全 shard vitest | AC-5 のコマンド一式 | web / api-unit / api-d1 / packages / og + 補助 suite 全 green |
| coverage-guard | `mise exec -- pnpm coverage:guard` | 閾値割れなし（C2 由来の不可避ずれを除き低下なし / NFR-5。調整した場合は Phase 7 の実測 diff 証跡と整合） |
| version parity ×4 | `mise exec -- pnpm why vitest` / `@vitest/coverage-v8` / `vite` / `@vitejs/plugin-react` | vitest = coverage-v8（exact 一致）、vite ^6/^7/^8、plugin-react 5.2.x で peer 整合 |
| deprecation 警告 grep | shard 実行ログ → `grep -iE 'deprecat'` | ヒット 0 件（対応不要分類分を除く） |
| obsolete snapshot 0 件 | shard 実行ログ → `grep -i 'obsolete'` | ヒット 0 件 |
| skip 数非増加 | shard 実行ログの skipped 件数 vs Phase 4 baseline | 増加 0 |
| D1 pool 設定保持 | `grep -n 'pool\|maxWorkers\|isolate' vitest.d1.config.ts` | `pool: "forks"` / `maxWorkers: 1` が存在し、`poolOptions` / `singleFork` / `isolate: false` が残存していない |
| C8 残党 grep | `grep -rEn "defineWorkspace\|poolMatchGlobs\|environmentMatchGlobs\|deps\.(external\|inline\|fallbackCJS)\|optimizer\.web" vitest.config.ts vitest.d1.config.ts apps packages scripts` | ヒット 0 件（未使用確認の証跡化） |

## mirror parity / link 確認

| 項目 | 該当 | 内容 |
| --- | --- | --- |
| skill mirror parity | **該当なし** | 本タスクは `package.json` / `pnpm-lock.yaml` / `vitest.config.*` / `*.spec.ts(x)` のコードのみが対象。`.claude/skills/**` の mirror 同期は本タスクのスコープ外（Phase 12 の workflow docs 同期は別管理） |
| docs link 整合 | 該当 | 本ワークフロー dir 内の相互リンク（index.md ↔ phase-NN.md ↔ outputs/）が解決すること |
| PR pre-flight gate | 該当 | `bash scripts/verify-pr-ready.sh`（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証）を PR 作成前（Phase 13）に実行 |
| verify-hook-integrity | 該当（CI） | `lefthook.yml` / `.git/hooks/*` を本タスクで編集しないこと（編集していなければ自動 PASS） |
| verify-test-suffix | 該当（CI） | 新規/修正テストが `*.spec.{ts,tsx}` であること（`*.test.*` 禁止 / 不変条件1） |

## line budget（仕様書ファイルの妥当性）

| 項目 | 該当 | 内容 |
| --- | --- | --- |
| 仕様書 line budget | 参考 | 本ワークフローの各 phase-NN.md は index.md / phase-01〜03 と同等の粒度（約 50〜130 行）に収める。冗長な再掲を避け、AC/ゲートはテーブルで簡潔に表現する |
| プロダクト line budget | 該当なし | 本タスクはプロダクトコードを増減しない（version bump + config/scripts/テスト期待値・snapshot 修正のみ）。LOC 予算の対象外 |

## 品質保証の実行順序

```
mise exec -- pnpm install（lockfile 確定 / peer 警告ゼロ）
  → mise exec -- pnpm typecheck（AC-3）
  → mise exec -- pnpm lint（AC-4）
  → 全 shard + 補助 suite 実行（AC-5 / ログ採取）
  → mise exec -- pnpm coverage:guard（閾値判定 / NFR-5）
  → pnpm why ×4（AC-1/AC-2 整合）
  → deprecation 警告 grep（AC-6）
  → D1 直列化完走 + config grep（AC-7）
  → skip baseline 比較 + obsolete snapshot grep（AC-8）
  → outputs/ の C1-C8 分類記録確認（AC-9）
```

## 完了条件

- [ ] AC-1〜AC-9 が検証コマンドと PASS 基準付きで完全列挙されている
- [ ] 品質ゲート（typecheck / lint / 全 shard / coverage:guard / deprecation grep / version parity ×4 / obsolete snapshot / skip 非増加 / D1 pool 保持 / C8 残党 grep）が一覧化されている
- [ ] obsolete snapshot 0 件が QA 完了条件に含まれている（v4 の CI fail 仕様対応）
- [ ] mirror parity が「該当なし（コードのみ）」と明記され、該当 CI gate が列挙されている
- [ ] line budget の妥当性が記載されている
- [ ] 全 AC が PASS（fail 0 / skip 増なし / deprecation 警告 0 / obsolete snapshot 0 / version 一致）

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `artifacts.json` mutation commands, Phase 11 evidence paths
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-09-quality-assurance.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
