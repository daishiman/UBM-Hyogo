# vitest-2-to-3-major-upgrade — Workflow Entry

> PR [#1177](https://github.com/daishiman/UBM-Hyogo/pull/1177)（Dependabot: `chore(deps-dev): bump vitest from 2.1.9 to 3.2.6`）を、コード実装を確実に実行するための Phase 1-13 実装仕様書に落とし込んだワークフロー。

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `vitest-2-to-3-major-upgrade` |
| 由来 | PR #1177（Dependabot vitest bump 2.1.9 → 3.2.6） |
| PR state | OPEN（base: `dev` / head: `dependabot/npm_and_yarn/vitest-3.2.6`） |
| workflow_state | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（依存アップグレード。UI/UX 変更なし） |
| implementation_mode | `new`（作業ブランチ `chore/vitest-3-upgrade-spec` には未実装。RED/GREEN で新規実装） |
| 親 workflow | なし |
| 兄弟参照 workflow | `docs/30-workflows/completed-tasks/issue-747-vitest-esbuild-arch-and-worktree-isolation/`（vitest/esbuild runtime 復旧 runbook） |
| 元 unassigned-task spec | なし（Dependabot PR 起点） |
| 優先度 | medium（テスト基盤の更新。機能影響はないが全 651 spec の実行系に波及） |
| 見積もり規模 | 中（version bump 自体は小。破壊的変更によるテスト/設定修正の幅が不確実性の主因） |
| PR base | `dev` |

## 実装区分

**`[実装区分: 実装仕様書]`** — CONST_004 デフォルト適用。

判定根拠: 本タスクは `package.json` 3ファイル + `pnpm-lock.yaml` の変更（コード変更）を必須とし、メジャーバージョン跨ぎ（2.x → 3.x）の破壊的変更により `vitest.config.ts` の非推奨 API 対応や、`toEqual`/`toThrowError` のエラー比較厳格化・`vi.spyOn`/`mockReset` 挙動変更に起因するテストコード修正が発生し得る。「動作させる（全 651 spec を green に保つ）」ことが目的であり、ドキュメントのみでは達成不可能。よって実装仕様書として作成する。Dependabot PR は version bump + lockfile のみを含むが、本仕様書は **アップグレード後に green を保つために必要なコード修正まで** を 1 サイクルのスコープに含める（CONST_007）。

## PR #1177 現状調査サマリ

| 項目 | 状態 |
| --- | --- |
| Dependabot PR が変更するファイル | `apps/api/package.json`(+1/-1), `apps/og/package.json`(+1/-1), `package.json`(+1/-1), `pnpm-lock.yaml`(+404/-100) |
| root `package.json` の現行 vitest | `vitest: ^2.0.0` / `@vitest/coverage-v8: ^2.1.9` / `jsdom: ^25.0.0`（行 94 / 86 / 88） |
| apps/api の現行 vitest | `vitest: ^2.1.9`（行 31） |
| apps/og の現行 vitest | `vitest: ^2.1.9`（行 22） |
| apps/web / packages/* の vitest | 直接依存なし（root 共通 devDependency を利用） |
| config ファイル | `vitest.config.ts`（jsdom / v8 coverage / react alias / optimizeDeps）, `vitest.d1.config.ts`（pool: forks / singleFork: true） |
| setupFiles | なし（`vitest.config.ts` に `setupFiles` 設定なし） |
| spec ファイル総数 | 651（apps/api 198 / apps/web 348 / apps/og 6 / packages 33 / scripts 56 / infra 10） |
| CI 実行系 | `coverage-guard.sh` が shard `[web, api-unit, api-d1, packages, og]` を並列実行 / `ci.yml` で OpenNext regression spec / `verify-design-tokens.yml` |
| Node / pnpm | Node `24.15.0` / pnpm `10.33.2`（`.mise.toml`） |

## アーキテクチャ決定（移行方針）

| 苦戦箇所 | 決定 | 根拠 |
| --- | --- | --- |
| vitest と `@vitest/coverage-v8` のバージョン整合 | 両方を **完全同一バージョン `3.2.6`** に揃える（`^3.2.6`） | `@vitest/coverage-v8@3.2.6` の peerDependencies は `vitest: 3.2.6` を完全一致要求。不一致は警告/破損の原因 |
| バージョン指定の不統一（root `^2.0.0` vs apps `^2.1.9`） | 全 3 ファイルを `^3.2.6` に統一 | 単一バージョン化で drift を解消（PR #1177 と同じ方針） |
| `vite` の扱い | 明示依存があれば vitest 3.2.6 が許す `^5/^6/^7` 範囲を確認。なければ vitest 内部依存に委譲 | vitest 3.2.6 は vite を通常 dependency として持つ（`^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0-0`） |
| `vitest.config.ts` の非推奨 API | アップグレード後の警告ログを採取し、`deps.inline`/`workspace` 等の非推奨があれば current 設定では未使用のため最小修正 | 現行 config に `deps.inline`/`workspace` 記述はなし（調査済み）。警告ゼロを確認することが主作業 |
| エラー比較厳格化による test fail | RED で失敗を採取し、`Error` → `TypeError` 等 prototype 一致へ期待値修正 | v3 最頻の破壊的変更。修正は期待値側に閉じる |
| coverage `ignoreEmptyLines` 由来の閾値ずれ | 閾値ゲートが赤化したら実測に合わせ閾値を再調整（下げ過ぎない） | v2.0 から既定 true だが v3 移行を機に再確認 |
| D1 テスト（`vitest.d1.config.ts` / `pool: forks`） | pool 設定は v3 でも有効（poolOptions トップレベル化は v4）。回帰確認のみ | issue-617 の port exhaustion 回避設計を壊さない |

## 13 Phase 成果物一覧

| Phase | 区分 | 成果物 |
| --- | --- | --- |
| 1 | 要件定義 | [`phase-01-requirements.md`](phase-01-requirements.md) |
| 2 | 設計 | [`phase-02-design.md`](phase-02-design.md) |
| 3 | 設計レビュー | [`phase-03-design-review.md`](phase-03-design-review.md) |
| 4 | テスト作成 | [`phase-04-test-creation.md`](phase-04-test-creation.md) |
| 5 | 実装 | [`phase-05-implementation.md`](phase-05-implementation.md) |
| 6 | テスト拡充 | [`phase-06-test-expansion.md`](phase-06-test-expansion.md) |
| 7 | カバレッジ確認 | [`phase-07-coverage-check.md`](phase-07-coverage-check.md) |
| 8 | リファクタリング | [`phase-08-refactoring.md`](phase-08-refactoring.md) |
| 9 | 品質保証 | [`phase-09-quality-assurance.md`](phase-09-quality-assurance.md) |
| 10 | 最終レビュー | [`phase-10-final-review.md`](phase-10-final-review.md) |
| 11 | 手動テスト | [`phase-11-manual-test.md`](phase-11-manual-test.md) |
| 12 | ドキュメント更新 | [`phase-12-documentation.md`](phase-12-documentation.md) |
| 13 | PR作成 | [`phase-13-pr-creation.md`](phase-13-pr-creation.md) |

## スコープ（CONST_007: 1サイクル完了原則）

本ワークフローの実装は、後続の実装プロンプト（`03.実装.md`）の **1サイクル内で完了** させる。先送り（バックログ送り / 別PR / Phase 2 で対応）は行わない。

### 含むもの

- root `package.json` / `apps/api/package.json` / `apps/og/package.json` の `vitest` を `^3.2.6` へ、root の `@vitest/coverage-v8` を `^3.2.6` へ更新。
- `pnpm-lock.yaml` の再生成（`pnpm install`）。
- アップグレード後の deprecation 警告採取と、`vitest.config.ts` / `vitest.d1.config.ts` の最小修正（非推奨 API があれば）。
- 全 651 spec のうち、v2→v3 破壊的変更で fail するテストの修正（エラー比較厳格化 / `vi.spyOn`・`mockReset` / fakeTimers / coverage 閾値）。
- CI shard（web / api-unit / api-d1 / packages / og）全 green の回復。

### 含まないもの

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| vitest 4.x への更新 | 本タスクは 3.2.6 までが対象（PR #1177 の範囲）。v4 は Vite6+/Node20+ 必須で別スコープ | 将来タスク（必要時に別 Issue 化） |
| vite の明示メジャーアップ | vitest 3.2.6 は vite 5/6/7 を許容。vite 自体の更新は本タスクの目的外 | 別タスク |
| 新規テストの追加 | 本タスクは既存テストの green 維持が目的。新機能テストは対象外 | 該当機能タスク |
| esbuild / worktree isolation 復旧手順の改変 | issue-747 の runbook が正本。本タスクは参照のみ | `issue-747-vitest-esbuild-arch-and-worktree-isolation/` |

> **未タスク分離の有無**: 現時点で 1 サイクル完了を破綻させる外部依存・合意未済は存在しない。RED 実行で想定外の大規模 fail（例: 数百件規模のテスト書き換えが必要）が判明した場合に限り、Phase 3 設計レビューでユーザーへエスカレーションする（CONST_007 例外条件）。

## 不変条件

1. test file は `*.spec.{ts,tsx}` 固定（`*.test.*` 禁止 / CLAUDE.md 不変条件8）。新規テストの suffix も同様。
2. vitest と `@vitest/coverage-v8` は常に同一バージョンに揃える（peer 一致要求）。
3. `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を破壊しない（issue-617 port exhaustion 回避設計）。
4. config の `resolve.alias`（react subpath）と `optimizeDeps` を破壊しない（pnpm isolated node-linker / CI 限定の解決問題対応）。
5. D1 への直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件5）。本タスクで D1 schema は変更しない。
6. Node `24.15.0` / pnpm `10.33.2` を `mise exec --` 経由で固定実行する。
7. テストの green 基準を緩めない（`--passWithNoTests` 以外の skip 増加は禁止。fail はコード/期待値修正で解消する）。
8. coverage 閾値は `ignoreEmptyLines` 由来の実測ずれを除き、既存水準を下げない。

## 参照リンク

- PR #1177: https://github.com/daishiman/UBM-Hyogo/pull/1177
- vitest 3.0 migration guide: https://vitest.dev/guide/migration.html
- vitest 3.0 blog: https://vitest.dev/blog/vitest-3
- vitest 3.2 blog（workspace→projects）: https://vitest.dev/blog/vitest-3-2.html
- `@vitest/coverage-v8` peer 要件: https://www.npmjs.com/package/@vitest/coverage-v8
- issue-747 runbook: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`
- CLAUDE.md（Vitest / esbuild runtime トラブル時、不変条件群）
