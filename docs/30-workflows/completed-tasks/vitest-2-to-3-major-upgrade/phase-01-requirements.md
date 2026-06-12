# Phase 1: Requirements（要件定義）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 由来 | PR #1177（Dependabot vitest 2.1.9 → 3.2.6） |
| タスク分類 | **NON_VISUAL（依存アップグレード）** — UI/UX 変更なし。Phase 11 は自動テスト結果 + deprecation 警告ログを代替証跡とする |
| implementation_mode | `new` |
| implementation_区分 | `[実装区分: 実装仕様書]` |

## 目的

monorepo 全体のテストランナー vitest を `2.1.9`（root は `^2.0.0` 表記）から `3.2.6` へメジャーアップグレードし、`@vitest/coverage-v8` を同一バージョンへ揃えたうえで、全 651 spec ファイルとカバレッジゲートが green を維持する状態を確立する。

## 背景

- Dependabot が PR #1177 を起票（vitest 2.1.9 → 3.2.6）。変更は version bump + `pnpm-lock.yaml` のみで、メジャー跨ぎの破壊的変更への追従コードは含まれていない。
- vitest 3.0 は「破壊的変更は小さい」と公式に位置づけるが、`toEqual`/`toThrowError` のエラー比較厳格化、`vi.spyOn` 再利用 + `mockReset` 挙動変更、fakeTimers 既定変更が実プロジェクトで頻出の fail 源となる。
- 当 monorepo は vitest を 651 spec / 5 CI shard で広範に利用しており、メジャー跨ぎは全テスト実行系に波及する。安全に green を保つには、version bump とテスト/設定修正を一体で行う必要がある。

## 既存コードの命名規則・実行系の分析（FB-01 / 命名規則確認）

| 対象 | 既存の事実 | 本タスクでの扱い |
| --- | --- | --- |
| test file suffix | `*.spec.ts` / `*.spec.tsx`（`*.test.*` は lefthook/CI で reject） | 維持。新規テストは追加しない |
| config ファイル名 | `vitest.config.ts`（unit）/ `vitest.d1.config.ts`（D1） | 維持。ファイル新設しない |
| coverage provider | `v8`（`@vitest/coverage-v8`） | 維持（istanbul へ切替えない） |
| test 環境 | `jsdom`（`globals: false`） | 維持 |
| 依存指定の表記 | root は caret `^`（`^2.0.0`）、apps は `^2.1.9` | 全て `^3.2.6` に統一 |
| 実行コマンド | `mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts <path>` | 維持 |

## 機能要件 (FR)

- **FR-1**: root `package.json` の `devDependencies.vitest` を `^3.2.6` に更新する。
- **FR-2**: root `package.json` の `devDependencies["@vitest/coverage-v8"]` を `^3.2.6` に更新する。
- **FR-3**: `apps/api/package.json` の `devDependencies.vitest` を `^3.2.6` に更新する。
- **FR-4**: `apps/og/package.json` の `devDependencies.vitest` を `^3.2.6` に更新する。
- **FR-5**: `pnpm install` で `pnpm-lock.yaml` を再生成し、vitest 関連の解決バージョンが 3.2.6 系で整合することを確認する。
- **FR-6**: アップグレード後の vitest 実行で出力される deprecation 警告を採取し、`vitest.config.ts` / `vitest.d1.config.ts` に非推奨 API があれば最小修正する。
- **FR-7**: v2→v3 破壊的変更で fail する既存テストを、期待値・モック設定の修正で green に戻す（テストの意図は変えない）。

## 非機能要件 (NFR)

- **NFR-1**: vitest と `@vitest/coverage-v8` のバージョンは常に一致する（peer 要求）。
- **NFR-2**: Node 24.15.0 / pnpm 10.33.2 / jsdom 25 の現行環境で動作する（いずれも vitest 3.2.6 と互換）。
- **NFR-3**: CI の 5 shard（web / api-unit / api-d1 / packages / og）全てが green を維持する。
- **NFR-4**: `vitest.d1.config.ts` の port exhaustion 回避設計（`pool: forks` / `singleFork: true`）を壊さない。
- **NFR-5**: coverage 閾値は既存水準を下げない（`ignoreEmptyLines` 由来の不可避なずれを除く）。
- **NFR-6**: 実行は全て `mise exec --` 経由で Node/pnpm バージョンを固定する。

## スコープ境界

- 含む: vitest / coverage-v8 の version bump（3ファイル）、lockfile 再生成、config 非推奨対応、破壊的変更によるテスト修正、CI shard green 回復。
- 含まない: vitest 4.x 化、vite の明示メジャーアップ、新規テスト追加、esbuild/worktree runbook の改変（index.md スコープ参照）。

## 受入条件 (AC: 抜粋 / 全件は phase-09)

- AC-1: root / apps/api / apps/og の 3 つの `package.json` で `vitest` が `^3.2.6`、root の `@vitest/coverage-v8` が `^3.2.6` になっている。
- AC-2: `pnpm install` 後の `pnpm-lock.yaml` で vitest が 3.2.6 系に解決され、`@vitest/coverage-v8` も同一バージョンに解決される。
- AC-3: `mise exec -- pnpm typecheck` が green。
- AC-4: `mise exec -- pnpm lint` が green。
- AC-5: CI 5 shard 相当のローカル実行（`test:coverage:unit` / `test:coverage:d1` / web / og / packages）が全て green、または fail がゼロ。
- AC-6: vitest 実行ログに **未対応の** deprecation 警告（`deps.inline` / `workspace` 等）が残っていない（current 設定では未使用のため警告ゼロが期待値）。
- AC-7: `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` が維持され、D1 テストが port exhaustion なく完走する。
- AC-8: テストの skip 件数がアップグレード前から増えていない。

## 前提確認（P50チェック）

| 確認項目 | 結果 |
| --- | --- |
| current branch（`chore/vitest-3-upgrade-spec`）に実装が存在するか | **No** — version bump 未適用。通常の実装 Phase とする（`implementation_mode: new`） |
| upstream（dev）にマージ済みか | No — PR #1177 は OPEN。dev tip(`f0297ad71`) に未取込 |
| 前提タスク（依存）が完了済みか | 依存なし。issue-747 runbook は参照リソースとして完了済み |

## 完了条件

- [ ] 目的・背景・FR/NFR・AC・スコープ境界が記載されている
- [ ] 既存命名規則・実行系の分析テーブルが記載されている
- [ ] P50チェックが記録され `implementation_mode: new` が確定している
- [ ] 後続 Phase 2 が参照する移行方針の前提が固定されている
