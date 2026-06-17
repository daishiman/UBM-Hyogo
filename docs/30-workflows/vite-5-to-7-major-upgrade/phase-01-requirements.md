# Phase 1: Requirements（要件定義）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 由来 | Issue [#1201](https://github.com/daishiman/UBM-Hyogo/issues/1201)（`[vitest-2-to-3-major-upgrade-followup-002] Vite メジャーアップグレード`・**CLOSED のまま維持**） |
| タスク分類 | **NON_VISUAL（ビルド/テストツールチェーンの依存更新）** — UI/UX 変更なし。Phase 11 は自動テスト結果 + deprecation 警告ログ + `pnpm why vite` を代替証跡とする |
| implementation_mode | `new`（Vite の直接依存追加を本サイクルで新規実装済み） |
| implementation_区分 | `[実装区分: 実装仕様書]` |
| workflow_state | `implemented_local_evidence_captured` |

## 目的

monorepo のテストツールチェーンが推移的に解決している `vite@5.4.21`（直接依存なし）を、root `package.json` への `vite ^7.0.0` 直接 devDependency **新規追加** により **Vite 7.x へ引き上げ**、全 vitest shard（api-unit / api-d1 / web / og / packages / scripts / infra）と `apps/web` の OpenNext ビルド（sanity）が green を維持する状態を確立する。

## 背景

- Issue #1201 は親タスク `vitest-2-to-3-major-upgrade`（vitest 2.1.9→3.2.6・完了）の followup として 2026-06-10 に起票され、当時は「次メジャー（5→6 想定）」を前提に書かれた。
- しかし 2026-06-13 の事前調査（ground truth）で、現在のコードに照らすと前提が更新される事実が確定した:
  - 当 repo に **Vite の直接 devDependency は存在しない**（全 `package.json` に `"vite":` 直接指定 0 件）。`vite@5.4.21` は推移的制約の共通最低版が選ばれているだけ。
  - `@vitejs/plugin-react@4.7.0` の peer（`vite: ^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`）と `vitest@3.2.6` の dep（`vite: ^5.0.0 || ^6.0.0 || ^7.0.0-0`）が **両方すでに Vite 7 をサポート**済み。よって 6 を経由せず **Vite 7 直行**が最適到達点。
  - Vite を消費するのは vitest（テストランナー）と `@vitejs/plugin-react`（テスト時 JSX 変換）のみ。`apps/web` 本番ビルドは `next build --webpack`（Next.js / OpenNext Workers）で **Vite を一切使わない**ため、Issue が最大リスク視した「apps/web ビルド破壊」は構造的にほぼ無効。
- Vite メジャー跨ぎは全 vitest 実行系に波及するため、依存追加と config/テスト修正を一体で行い green を保つ必要がある。

## 既存コードの命名規則・実行系の分析（命名規則確認）

| 対象 | 既存の事実 | 本タスクでの扱い |
| --- | --- | --- |
| test file suffix | `*.spec.ts` / `*.spec.tsx`（`*.test.*` は lefthook/CI で reject） | 維持。新規テストは追加しない |
| config ファイル名 | `vitest.config.ts`（unit）/ `vitest.d1.config.ts`（D1） | 維持。ファイル新設しない |
| coverage provider | `v8`（`@vitest/coverage-v8`） | 維持（istanbul へ切替えない） |
| Vite の依存表記 | **直接依存なし**（全 `package.json` に `"vite":` 0 件）。`vite@5.4.21` は推移的最低版解決 | root `package.json` の `devDependencies` に `"vite": "^7.0.0"` を**新規追加**して 7.x へ引き上げ |
| Vite を引き込む経路 | `@vitejs/plugin-react@4.7.0` / `vitest@3.2.6`（`@vitest/mocker` 経由）/ `vite-node@3.2.4` | 経路はそのまま。root の単一ノードで 7.x に解決させる |
| esbuild override | `package.json` の `pnpm.overrides.esbuild = "0.27.3"`（vite 以外の override なし） | 維持 |
| 実行コマンド | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts <path>` | 維持 |

## 機能要件 (FR)

- **FR-1**: root `package.json` の `devDependencies` に `"vite": "^7.0.0"` を**新規追加**する（直接 specifier がない現状を解消し、推移的最低版 5.4.21 を 7.x へ引き上げる中核アクション）。
- **FR-2**: `mise exec -- pnpm install` で `pnpm-lock.yaml` を再生成し、vite が 7.x 系に解決されることを確認する。
- **FR-3**: `pnpm why vite` で vite が **単一 7.x バージョンに解決**され、5 系と 7 系の重複併存がないことを確認する。
- **FR-4**: アップグレード後の vitest 実行で出力される deprecation / removed API 警告を採取し、`vitest.config.ts` / `vitest.d1.config.ts` に該当があれば**最小修正**する（現 config は未使用見込みのため警告ゼロが期待値）。
- **FR-5**: Vite 5→7 の破壊的変更で fail した既存テストを、期待値・モック設定の修正で green に戻す（テストの意図は変えない。プロダクトコードは無変更）。
- **FR-6**: `apps/web` の OpenNext ビルド（`pnpm build`）を sanity 実行し、Vite 非依存である事実（`[project]/...` 仮想 specifier 混入なし・bundle 健全）を確認する。blocker ではない。

## 非機能要件 (NFR)

- **NFR-1**: Vite 7 の Node engine 要件（`20.19+ / 22.12+`）を、現環境 Node `24.15.0` が充足する（対応不要）。
- **NFR-2**: 全 vitest shard（api-unit / api-d1 / web / og / packages / scripts / infra）が green を維持する。
- **NFR-3**: `pnpm.overrides.esbuild = "0.27.3"` を維持し、Vite 7 が期待する esbuild レンジと整合させる（不整合時のみ Phase 3 でエスカレーション）。
- **NFR-4**: `vitest.d1.config.ts` の port exhaustion 回避設計（`pool: forks` / `singleFork: true`）を壊さない（issue-617）。
- **NFR-5**: `vitest.config.ts` の `resolve.alias`（react subpath）/ `optimizeDeps` / `dedupe` / `plugins:[react()]` を破壊しない（等価維持）。
- **NFR-6**: coverage 閾値は既存水準を下げない。skip 件数を増やさない。
- **NFR-7**: 実行は全て `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を固定する。
- **NFR-8**: `apps/web` 本番ビルドは `next build --webpack` 正本を維持（Turbopack を deploy bundle に混入させない）。

## スコープ境界

- 含む: root `package.json` への `vite ^7.0.0` 直接 devDependency 追加、`pnpm-lock.yaml` 再生成、単一 7.x 解決確認、Vite 6/7 deprecation 採取と config 最小修正、全 shard green 回復、`apps/web` sanity build。
- 含まない: Vitest 4.x 化（別 followup #1200）、`@vitejs/plugin-react` メジャーアップ（4.7.0 が既に v7 サポート）、Vite 8 化（`vitest@3.2.6` は v8 未サポート・上限 `^7.0.0-0`）、アプリ実装/D1 schema/Google Form 変更、Next.js 本体メジャー、commit / push / PR 作成（CONST_002 / CONST_006）。

## 受入条件 (AC: 抜粋 / 全件は phase-09)

- **AC-1**: root `package.json` の `devDependencies` に `"vite": "^7.0.0"` が新規追加されている。
- **AC-2**: `pnpm install` 後の `pnpm-lock.yaml` で vite が 7.x 系に解決されている。
- **AC-3**: `mise exec -- pnpm why vite` で vite が単一 7.x に解決され、5 系と 7 系の重複併存がない。
- **AC-4**: `mise exec -- pnpm typecheck` が green。
- **AC-5**: `mise exec -- pnpm lint` が green。
- **AC-6**: 全 vitest shard（api-unit / api-d1 / web / og / packages / scripts / infra）が green、または fail がゼロ。
- **AC-7**: vitest 実行ログに**未対応の** Vite 6/7 deprecation / removed API 警告（`splitVendorChunkPlugin` / CJS Node API / `legacy` 等）が残っていない（current 設定では未使用のため警告ゼロが期待値）。
- **AC-8**: `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` が維持され、D1 テストが port exhaustion なく完走する。`apps/web` の OpenNext ビルドが sanity で健全（`[project]/...` 仮想 specifier 混入なし）。

## 前提確認（P50チェック）

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在するか | **No** — vite 直接依存は未追加（`grep '"vite":' --include=package.json` で 0 件）。通常の実装 Phase とする（`implementation_mode: new`） |
| 由来 Issue の状態 | #1201 は **CLOSED**。本タスクで再 open しない。実装は CLOSED のまま進める |
| 前提タスク（依存）が完了済みか | 依存なし。親 `vitest-2-to-3-major-upgrade` は完了。issue-747 runbook は参照リソースとして完了済み |

## 完了条件

- [ ] 目的・背景・FR/NFR・AC・スコープ境界が記載されている
- [x] 既存命名規則・実行系の分析テーブル（test suffix / config / coverage / 実装前 vite 直接依存なし）が記載されている
- [ ] P50チェックが記録され `implementation_mode: new` が確定している
- [x] 後続 Phase 2 が参照する移行方針（Vite 7 直行 / 直接 devDep 新規追加）の前提が固定されている
