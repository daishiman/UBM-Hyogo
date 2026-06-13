# Phase 1: Requirements（要件定義）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 由来 | Issue #1200（vitest-2-to-3-major-upgrade-followup-001。CLOSED のまま current facts へ最適化） |
| タスク分類 | **NON_VISUAL（依存アップグレード）** — UI/UX 変更なし。Phase 11 は自動テスト結果 + deprecation 警告ログを代替証跡とする |
| implementation_mode | `new` |
| implementation_区分 | `[実装区分: 実装仕様書]` |

## 目的

monorepo 全体のテストランナー vitest を `3.2.6` から `4.1.8` へメジャーアップグレードし、`@vitest/coverage-v8` を同一バージョン（exact pin 要求）へ揃え、`@vitejs/plugin-react` を vite 6〜8 互換の `^5.2.0` へ更新したうえで、全 693 spec ファイルと全カバレッジゲートが green を維持する状態を確立する。

## 背景

- Issue #1200 は v2→v3 アップグレード（PR #1177 / `vitest-2-to-3-major-upgrade`）の followup-001 として「v4 stable リリース後に着手する将来タスク」で起票され、2026-06-12 に close された。しかしコードベースは `^3.2.6` のままであり、**課題自体は未解決**（2026-06-12 実測）。
- Vitest 4.x は **v4.0.0 GA = 2025-10-22、latest = 4.1.8（2026-06-01）** で stable 成熟期にあり、**v5.0.0 が既に beta** に入っている。v3 系の保守ウィンドウ縮小が進むため、放置すると v3→v5 の二段跳びを強制されるリスクが増す。
- v4 は v3 と異なり「設定が壊れる」変更を含む: tinypool 削除による `poolOptions` 削除（**`vitest.d1.config.ts` の `singleFork: true` が無効化**）、CLI `--minWorkers` 削除（**`apps/api` の `test:coverage:unit` が起動不能化**）、coverage の AST remapping 一本化（**数値変動を公式が明記**）。version bump 単体では shard が赤くなることが確定しているため、bump と設定/テスト修正を一体で行う必要がある。
- issue 起票時のリスク「v4 の Node 要件が mise 固定（Node 24.15.0）と衝突」「Vite major（followup-002）の先行が必要」は、調査の結果**いずれも非発生**と確定した（vitest@4.1.8 は Node >=24.0.0 適合、vite は transitive 解決）。代わりに **`@vitejs/plugin-react ^4` の Vite 8 非対応**という issue 未記載の互換問題が判明し、本タスクのスコープに `^5.2.0` 更新を含める。

## 既存コードの命名規則・実行系の分析（FB-01 / 命名規則確認）

| 対象 | 既存の事実 | 本タスクでの扱い |
| --- | --- | --- |
| test file suffix | `*.spec.ts` / `*.spec.tsx`（`*.test.*` は lefthook/CI で reject） | 維持。新規テストは原則追加しない |
| config ファイル名 | `vitest.config.ts`（unit）/ `vitest.d1.config.ts`（D1） | 維持。ファイル新設しない |
| coverage provider | `v8`（`@vitest/coverage-v8`） | 維持（istanbul へ切替えない）。v4 で AST remapping に一本化 |
| test 環境 | `jsdom`（`globals: false`） | 維持（v4 で jsdom は optional peer `'*'`、jsdom ^25 のままで可） |
| 依存指定の表記 | root / apps とも caret `^3.2.6` | 全て `^4.1.8` に統一 |
| 実行コマンド | `mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts <path>` | 維持 |
| D1 直列化 | `vitest.d1.config.ts` の `pool: "forks"` + `poolOptions.forks.singleFork: true` | **v4 表現へ書換**: `pool: "forks"` + top-level `maxWorkers: 1`。`isolate: false` は D1 mock のファイル間状態汚染を避けるため採用しない |
| CLI worker 制御 | `apps/api/package.json` `test:coverage:unit` に `--maxWorkers=1 --minWorkers=1` | `--minWorkers=1` を削除（v4 でオプション削除）。`--maxWorkers=1` は維持 |

## 機能要件 (FR)

- **FR-1**: root `package.json` の `devDependencies.vitest` を `^4.1.8` に更新する（現行 L94 `^3.2.6`）。
- **FR-2**: root `package.json` の `devDependencies["@vitest/coverage-v8"]` を `^4.1.8` に更新する（現行 L86 `^3.2.6`。v4 の peer は vitest と **exact 一致**要求）。
- **FR-3**: root `package.json` の `devDependencies["@vitejs/plugin-react"]` を `^5.2.0` に更新する（現行 L85 `^4.0.0`。vitest 4 が解決する vite ^6/^7/^8 との peer 整合のため）。
- **FR-4**: `apps/api/package.json` の `devDependencies.vitest` を `^4.1.8` に更新する（現行 L31 `^3.2.6`）。
- **FR-5**: `apps/og/package.json` の `devDependencies.vitest` を `^4.1.8` に更新する（現行 L22 `^3.2.6`）。
- **FR-6**: `apps/api/package.json` の `test:coverage:unit` script から `--minWorkers=1` を削除する（`--maxWorkers=1` は維持）。
- **FR-7**: `vitest.d1.config.ts` の `poolOptions: { forks: { singleFork: true } }` を削除し、`test` top-level に `maxWorkers: 1` を追加する（`pool: "forks"` は維持、`isolate: false` は採用しない）。
- **FR-8**: `mise exec -- pnpm install` で `pnpm-lock.yaml` を再生成し、vitest / @vitest/coverage-v8 が同一 4.1.x、vite が ^6/^7/^8 範囲、@vitejs/plugin-react の peer 警告ゼロで解決されることを確認する。
- **FR-9**: アップグレード後の vitest 実行で出力される deprecation 警告を採取し、`vitest.config.ts` / `vitest.d1.config.ts` に非推奨 API があれば最小修正する。
- **FR-10**: v3→v4 破壊的変更で fail する既存テスト・snapshot を、期待値・モック設定・snapshot 更新の修正で green に戻す（テストの意図は変えない）。
- **FR-11**: coverage AST remapping による数値変動を shard 別に実測し、閾値ゲート（`scripts/coverage-guard.sh` / `coverage-threshold-lint`）が green になる状態へ整合する（広範な閾値引き下げは禁止）。

## 非機能要件 (NFR)

- **NFR-1**: vitest と `@vitest/coverage-v8` のバージョンは常に完全一致する（v4 peer は exact pin）。
- **NFR-2**: Node 24.15.0 / pnpm 10.33.2 / jsdom 25 の現行環境で動作する（vitest@4.1.8 `engines.node: ^20.0.0 || ^22.0.0 || >=24.0.0` に適合）。
- **NFR-3**: CI の 5 shard（web / api-unit / api-d1 / packages / og）と補助 suite（`test:scripts` / `test:alerts` / `test:sentry-alerts` / infra）全てが green を維持する。
- **NFR-4**: `vitest.d1.config.ts` の port exhaustion 回避設計（issue-617: D1 テストの単一プロセス直列実行）を v4 等価表現で維持する。
- **NFR-5**: coverage 閾値は既存水準を下げない（AST remapping 由来の不可避な実測ずれを除く。下げる場合は実測 diff を証跡化）。
- **NFR-6**: 実行は全て `mise exec --` 経由で Node/pnpm バージョンを固定する。
- **NFR-7**: skip テスト件数をアップグレード前から増やさない。obsolete snapshot を残さない（**v4 は CI 上の obsolete snapshot で fail する**）。

## スコープ境界

- 含む: vitest / coverage-v8 / plugin-react の version bump（package.json 3ファイル）、`test:coverage:unit` script 修正、`vitest.d1.config.ts` の pool API 書換、lockfile 再生成、config 非推奨対応、破壊的変更によるテスト/snapshot 修正、coverage 閾値整合、CI shard green 回復。
- 含まない: vitest 5.x（beta）、vite の明示メジャーアップ（followup-002 として独立管理のまま）、アプリ実装ロジック変更、D1 schema 変更、新規機能テスト追加、commit/push/PR（Phase 13 で user 承認後のみ）。

## 受入条件 (AC: 抜粋 / 全件は phase-09)

- AC-1: root の `vitest` / `@vitest/coverage-v8` が `^4.1.8`、`@vitejs/plugin-react` が `^5.2.0`、apps/api・apps/og の `vitest` が `^4.1.8` になっている。
- AC-2: `pnpm why vitest` / `pnpm why @vitest/coverage-v8` の解決バージョンが同一 4.1.x で一致し、`pnpm why vite` が ^6/^7/^8 範囲、`pnpm install` 出力に plugin-react の peer 警告がない。
- AC-3: `mise exec -- pnpm typecheck` が green。
- AC-4: `mise exec -- pnpm lint` が green。
- AC-5: CI 5 shard 相当のローカル実行（web / api-unit / api-d1 / packages / og の `test:coverage*`）+ `test:scripts` / `test:alerts` / `test:sentry-alerts` が全て green。
- AC-6: vitest 実行ログに未対応の deprecation 警告（v4.1 の `vitest/*` エントリポイント / spy `toBe*` 系等）が残っていない、または対応不要と分類記録されている。
- AC-7: `vitest.d1.config.ts` が `pool: "forks"` + `maxWorkers: 1`（`isolate: false` 不採用）で D1 テストを port exhaustion なく完走する。
- AC-8: テストの skip 件数がアップグレード前から増えておらず、obsolete snapshot が 0 件。
- AC-9: v3→v4 breaking-change の分類記録（C1-C8 v4 版）と対応差分が `outputs/` に残っている。

## 前提確認（P50チェック）

| 確認項目 | 結果 |
| --- | --- |
| current branch（`docs/issue-1200-vitest-3-to-4-major-upgrade-spec`）に実装が存在するか | **No** — version bump 未適用（root/apps とも `^3.2.6` を 2026-06-12 に実測）。通常の実装 Phase とする（`implementation_mode: new`） |
| upstream（dev）にマージ済みか | No — dev tip `82971d195` に v4 化コミットなし |
| 前提タスク（依存）が完了済みか | 親 `vitest-2-to-3-major-upgrade` は完了済み（v3.2.6 が dev に取込済み）。issue-747 runbook は参照リソースとして完了済み。**Vite major（followup-002）の先行は不要と調査で確定** |

## 完了条件

- [ ] 目的・背景・FR/NFR・AC・スコープ境界が記載されている
- [ ] 既存命名規則・実行系の分析テーブルが記載されている
- [ ] P50チェックが記録され `implementation_mode: new` が確定している
- [ ] issue #1200 の前提（v4 stable 待ち / Vite 先行 / Node 衝突）が current facts へ更新されている
- [ ] 後続 Phase 2 が参照する移行方針の前提が固定されている

---

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `index.md`, `artifacts.json`, npm registry snapshot, parent `vitest-2-to-3-major-upgrade` workflow
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-01-requirements.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
