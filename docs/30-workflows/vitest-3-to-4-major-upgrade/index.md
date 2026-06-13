# vitest-3-to-4-major-upgrade — Workflow Entry

> Issue [#1200](https://github.com/daishiman/UBM-Hyogo/issues/1200)（`[vitest-2-to-3-major-upgrade-followup-001] Vitest 4.x メジャーアップグレード`）を、**現在のコードベース（2026-06-12 時点）の最新事実に最適化した** Phase 1-13 実装仕様書に落とし込んだワークフロー。親 `vitest-2-to-3-major-upgrade`（PR #1177）の直接後続。

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `vitest-3-to-4-major-upgrade` |
| 由来 | Issue #1200（vitest-2-to-3-major-upgrade-followup-001。Vitest 4.x stable リリース後に着手する将来タスクとして起票） |
| Issue state | CLOSED（2026-06-12 close。**ユーザー指示により closed のまま本仕様書を作成**。コードベースは vitest `^3.2.6` のままで課題は未解決と調査で確定） |
| workflow_state | `implementation_review_partial` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（依存アップグレード。UI/UX 変更なし） |
| implementation_mode | `new`（作業ブランチ `docs/issue-1200-vitest-3-to-4-major-upgrade-spec` には未実装。RED/GREEN で新規実装） |
| 親 workflow | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`（v2→v3 の移行手順・C1-C8 分類の正本） |
| 兄弟参照 workflow | `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/`（vitest/esbuild runtime 復旧 runbook） |
| 元 unassigned-task spec | `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-001-vitest-4-major-upgrade.md` |
| 優先度 | medium（起票時は low だったが、v4 stable 成熟 + v5 beta 開始により v3 系の保守ウィンドウ短縮が進行中） |
| 見積もり規模 | 中（version bump + config/CLI 書換は確定的・小。coverage AST remapping による数値変動と mock/snapshot 挙動変更によるテスト修正幅が不確実性の主因） |
| PR base | `dev` |

## 実装区分

**`[実装区分: 実装仕様書]`** — CONST_004 デフォルト適用。

判定根拠: 本タスクは `package.json` 3ファイル + `pnpm-lock.yaml` + `vitest.d1.config.ts` + `apps/api/package.json` の scripts 行の変更（コード変更）を必須とする。v4 では `poolOptions.forks.singleFork` と CLI `--minWorkers` が**削除**されており、変更なしでは D1 shard が起動すらしない。「全 693 spec / 全 CI shard を green に保ったまま v4 系へ動作させる」ことが目的であり、ドキュメントのみでは達成不可能。よって実装仕様書として作成する（CONST_005 必須項目は phase-05 / phase-09 に記載）。

## Issue #1200 現状調査サマリ（2026-06-12 実測・issue 本文の current facts 最適化）

| 項目 | issue 起票時（2026-06-10）の前提 | 現在の実測 | 判定 |
| --- | --- | --- | --- |
| 課題は解決済みか | — | root/apps/api/apps/og とも `vitest: ^3.2.6` のまま。v4 化コミットなし | **未解決。本タスクは必要** |
| Vitest 4.x stable | 「stable リリース後に着手」（将来） | **v4.0.0 GA = 2025-10-22 / latest = v4.1.8（2026-06-01）/ v5.0.0 は beta** | **前提成立。着手可能** |
| Node 要件衝突リスク | 「v4 が Node を引き上げ mise 固定（24.15.0）と衝突」（中確率） | vitest@4.1.8 `engines.node: ^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` | **非発生。Node 24.15.0 適合** |
| Vite major 先行（followup-002）の要否 | 「衝突時は Vite major を先行」 | vite はリポジトリの直接依存に**存在しない**。vitest 4.1.8 が direct dependency `vite: ^6 \|\| ^7 \|\| ^8` として transitive 解決 | **先行不要**。followup-002 は本タスクの前提条件から外れる |
| plugin-react 互換（issue 未記載の新事実） | — | `@vitejs/plugin-react: ^4.0.0`（root L85）の vite peer は `^4.2 \|\| ^5 \|\| ^6 \|\| ^7` で **Vite 8 非対応**。vitest 4 が vite 8 を解決すると peer 不整合 | **本タスクで `^5.2.0` へ同時更新が必須**（vite 6〜8 全対応） |
| `pool: forks` 系 API 変更リスク | 「v4 で変更され D1 port exhaustion 再発」（中確率） | **確定的に変更**: tinypool 削除により `poolOptions` 削除。`singleFork: true` → top-level `maxWorkers: 1` へ書換必須。`isolate: false` は D1 mock の状態汚染を起こすため採用しない。`pool: "forks"` 自体と forks デフォルトは存続 | リスクではなく**確定作業**として Phase 5 に組込 |
| CLI フラグ | — | `apps/api/package.json` `test:coverage:unit` の `--minWorkers=1` は v4 で削除（`--maxWorkers=1` は有効） | **削除必須** |
| coverage 計測 | 「ignoreEmptyLines 等」 | v8 provider が AST ベース remapping に一本化（`v8-to-istanbul` 廃止）。**「v3 から更新すると数値が変わることが想定される」と公式明記**。`coverage.all`/`ignoreEmptyLines`/`extensions` 削除 | 閾値ゲートの実測再確認を Phase 7 に組込 |
| spec ファイル総数 | （v2→v3 時 651） | **693**（apps/api 201 / apps/web 385 / apps/og 6 / packages 35 / scripts 56 / infra 10） | Phase 4 の RED 採取対象 |

> **issue 最適化の結論**: issue #1200 の「目的・スコープ・不変条件」は現在も有効。ただし (1) 前提条件「v4 stable 待ち」は成立済み、(2) 「Vite major 先行」は不要（代わりに `@vitejs/plugin-react` ^5.2.0 同時更新が必須）、(3) 「pool API 変更リスク」は確定作業へ昇格、の 3 点を current facts へ更新した。issue は closed のまま、本仕様書を実行正本とする。

## アーキテクチャ決定（移行方針）

| 苦戦箇所 | 決定 | 根拠 |
| --- | --- | --- |
| vitest と `@vitest/coverage-v8` のバージョン整合 | 両方を **`^4.1.8`** に揃え、`pnpm why` で解決実バージョンの完全一致を確認 | `@vitest/coverage-v8@4.1.8` の peerDependencies は `vitest: 4.1.8` を**完全一致（exact pin）**要求 |
| `vitest.d1.config.ts` の直列化（issue-617 port exhaustion 回避） | `pool: "forks"` を維持し、`poolOptions.forks.singleFork: true` を **top-level `maxWorkers: 1`** へ書換。`isolate: false` は採用しない | v4 で tinypool 削除・`poolOptions` 削除。公式 migration guide の `isolate: false` 併用は旧 singleFork に近いが、本 repo の D1 mock ではファイル間状態汚染を起こすため、実測 fallback として `maxWorkers: 1` のみで直列性を確保する |
| `--minWorkers=1` CLI フラグ（apps/api `test:coverage:unit`） | フラグごと削除（`--maxWorkers=1` は残す） | v4 で `minWorkers` オプション自体が削除 |
| `@vitejs/plugin-react` | `^4.0.0` → **`^5.2.0`** へ同時更新 | vitest 4 の vite 解決（^6\|\|^7\|\|^8）に対し ^4 系は vite 8 非対応。^5.2.0 は vite 4.2〜8 全対応で最も安全 |
| coverage 数値変動（AST remapping） | Phase 7 で shard 別に実測し、閾値割れは「実測差分の最小調整のみ」。広範な引き下げは禁止（不変条件8） | 公式が数値変動を明記。下げ幅の根拠は実測 diff に限定 |
| snapshot 差分 | `[MockFunction spy]` → `[MockFunction]` 等の機械的差分は `--update` で更新し、diff を目視確認して意図的変更のみ受け入れる。**CI は obsolete snapshot で fail する**ため残骸も同時清掃 | v4 の getMockName デフォルト変更 + CI 挙動変更 |
| mock/spy 挙動変更（`vi.restoreAllMocks` 限定化 / `invocationCallOrder` 1 始まり / spyOn constructor） | RED で fail を採取し C1-C8（v4 版）分類表へタグ付けして期待値/モック設定のみ修正 | v2→v3 で確立した手順を踏襲。プロダクトコード不変 |
| jsdom / testing-library | 変更なし（jsdom ^25 は vitest 4 の optional peer `'*'` で適合） | registry 実測 |

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

- root `package.json` の `vitest` / `@vitest/coverage-v8` を `^4.1.8` へ、`@vitejs/plugin-react` を `^5.2.0` へ更新。
- `apps/api/package.json` / `apps/og/package.json` の `vitest` を `^4.1.8` へ更新。
- `apps/api/package.json` `test:coverage:unit` script から `--minWorkers=1` を削除。
- `vitest.d1.config.ts` の `poolOptions.forks.singleFork: true` を `maxWorkers: 1` へ書換（`isolate: false` は採用しない）。
- `pnpm-lock.yaml` の再生成（`mise exec -- pnpm install`）。
- アップグレード後の deprecation 警告採取と、`vitest.config.ts` / `vitest.d1.config.ts` の最小修正（非推奨 API があれば）。
- 全 693 spec のうち、v3→v4 破壊的変更で fail するテスト・snapshot の修正（C1-C8 v4 版分類）。
- coverage AST remapping による数値変動の実測と、閾値ゲート（`coverage-guard.sh` / `coverage-threshold-lint`）の整合回復。
- CI shard（web / api-unit / api-d1 / packages / og）+ ローカル補助 suite（scripts / alerts / sentry-alerts / infra）全 green の回復。

### 含まないもの

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| vitest 5.x（beta）への更新 | v5 は beta。stable 後に別互換ウィンドウで判断 | 将来タスク（必要時に別 Issue 化） |
| vite の明示メジャーアップ（followup-002） | vite は直接依存に存在せず、vitest 4 の transitive 解決で完結。followup-002 は独立スコープのまま | `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade.md` |
| アプリ実装ロジック（`apps/*/src`・`packages/*/src`）の挙動変更 | 修正はテスト期待値・モック・snapshot・config に閉じる（真バグ発見時はエスカレーション） | 該当機能タスク |
| coverage 閾値の広範な引き下げ | 品質低下を伴うため禁止。実測差分の最小調整のみ許容 | — |
| D1 schema 変更・Google Form 仕様変更 | CLAUDE.md 不変条件 | — |
| 新規テストの追加 | 既存テストの green 維持が目的（v4 起因の回帰 guard 追加は Phase 6 で最小限可） | 該当機能タスク |
| commit / push / PR 作成 | Phase 13 でユーザー明示承認後のみ | Phase 13 |

> **未タスク分離の有無**: 現時点で 1 サイクル完了を破綻させる外部依存・合意未済は存在しない（Node/Vite 互換は調査で解消済み）。RED 実行で想定外の大規模 fail（数百件規模のテスト書き換え）が判明した場合に限り、Phase 3 のエスカレーション条件に従いユーザーへ確認する（CONST_007 例外条件）。

## 不変条件

1. test file は `*.spec.{ts,tsx}` 固定（`*.test.*` 禁止 / CLAUDE.md 不変条件8）。
2. vitest と `@vitest/coverage-v8` は常に同一バージョンに揃える（v4 は **exact pin** のため必須）。
3. D1 テストの直列実行設計（issue-617 port exhaustion 回避）を破壊しない。v4 では `pool: "forks"` + `maxWorkers: 1` を正本表現とし、`isolate: false` は D1 mock の状態汚染を避けるため採用しない。
4. config の `resolve.alias`（react subpath）と `optimizeDeps` を破壊しない（pnpm isolated node-linker / CI 限定の解決問題対応）。
5. D1 への直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件5）。本タスクで D1 schema は変更しない。
6. Node `24.15.0` / pnpm `10.33.2` を `mise exec --` 経由で固定実行する。
7. テストの green 基準を緩めない（`--passWithNoTests` 以外の skip 増加は禁止。fail は期待値/モック/snapshot 修正で解消する）。
8. coverage 閾値は AST remapping 由来の実測ずれを除き、既存水準を下げない。下げる場合は実測 diff を証跡に残す。

## 参照リンク

- Issue #1200: https://github.com/daishiman/UBM-Hyogo/issues/1200 （CLOSED のまま運用）
- 元 unassigned-task spec: `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-001-vitest-4-major-upgrade.md`
- vitest v4 migration guide: https://vitest.dev/guide/migration
- vitest v4.0.0 release notes: https://github.com/vitest-dev/vitest/releases/tag/v4.0.0
- vitest v4.1.0 release notes: https://github.com/vitest-dev/vitest/releases/tag/v4.1.0
- `@vitest/coverage-v8` peer 要件: https://registry.npmjs.org/@vitest/coverage-v8/latest
- 親 workflow: `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`（C1-C8 v3 版分類・移行手順の正本）
- issue-747 runbook: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`
- CLAUDE.md（Vitest / esbuild runtime トラブル時、不変条件群）
