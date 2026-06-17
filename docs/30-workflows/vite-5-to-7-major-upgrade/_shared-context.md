# _shared-context — vite-5-to-7-major-upgrade（SSOT）

> 本ファイルは phase-01〜13 仕様書および outputs 成果物が参照する**唯一の正本（Single Source of Truth）**。
> 各 phase ファイルはここの canonical facts を逐語で引用し、独自に値を作り変えない。

## 0. このタスクの位置づけ

| Key | Value |
| --- | --- |
| workflow_id | `vite-5-to-7-major-upgrade` |
| 由来 Issue | [#1201](https://github.com/daishiman/UBM-Hyogo/issues/1201)（`[vitest-2-to-3-major-upgrade-followup-002] Vite メジャーアップグレード`） |
| Issue 状態 | **CLOSED（クローズドのまま維持。本タスクで再 open しない）** |
| 親 workflow | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`（vitest 2.1.9→3.2.6・完了） |
| 元 unassigned-task | `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade.md` |
| workflow_state | `implemented_local_evidence_captured`（Vite 7 依存追加・lockfile 再生成・local evidence 採取済み。commit / PR は行わない） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（ビルド/テストツールチェーンの依存更新。UI/UX 変更なし） |
| implementation_mode | `new`（Vite の直接依存追加を本サイクルで新規実装済み） |
| 実装区分 | **`[実装区分: 実装仕様書]`**（CONST_004 デフォルト適用） |
| 優先度 | low（Vitest 系が安定している前提の保守タスク） |
| 見積もり規模 | 小〜中（依存追加自体は小。Vite メジャー跨ぎの破壊的変更検証が不確実性の主因だが、後述の事前調査でリスクは大幅低下） |
| PR base | `dev` |

## 1. 実装区分の判定根拠（CONST_004 / CONST_005）

`[実装区分: 実装仕様書]`。判定根拠:

- 本タスクは `package.json`（root）への `vite` devDependency 追加 + `pnpm-lock.yaml` 再生成という**コード（依存定義）変更**を必須とする。
- 目的は「Vite を次メジャーへ更新し、全 vitest shard と apps/web ビルドが green を維持する」という**動作保証**であり、ドキュメントのみでは達成不可能。
- メジャー跨ぎ（5.x → 7.x）に伴う `vitest.config.ts` / `vitest.d1.config.ts` の deprecation 対応・テスト修正が発生し得る。
- よって実装仕様書として作成し、CONST_005 必須項目（変更対象ファイル・シグネチャ相当の依存定義差分・入出力/副作用・テスト方針・ローカル実行コマンド・DoD）をすべて含める。

## 2. 事前調査で確定した現状の事実（ground truth・2026-06-13 計測）

| 項目 | 確定事実 | 出典 |
| --- | --- | --- |
| 現在の Vite 解決バージョン | **`vite@7.3.5`**（単一バージョン解決） | `pnpm why vite` |
| Vite の直接依存 | **実装前は存在しなかった**。本サイクルで root `package.json` に `"vite": "^7.0.0"` を新規追加済み | 実装前: `grep '"vite":' --include=package.json` で 0 件 / 実装後: root `package.json` |
| Vite を引き込む経路 | `@vitejs/plugin-react@4.7.0` / `vitest@3.2.6`（`@vitest/mocker` 経由）/ `vite-node@3.2.4` | `pnpm why vite` |
| 5.4.21 に解決されていた理由 | 直接 specifier がなく、推移的制約の共通最低版が選ばれていた。現在は root 直接 devDependency で 7.x に固定 | 同上 |
| `@vitejs/plugin-react` 互換 | `4.7.0` / peer `vite: ^4.2.0 \|\| ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0` → **Vite 7 を既にサポート** | `node_modules/@vitejs/plugin-react/package.json` |
| `vitest@3.2.6` の vite 依存 | dep `vite: ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0-0` → **Vite 7 を既にサポート / 上限は v8 未満** | `node_modules/vitest/package.json` |
| esbuild override | `package.json` の `pnpm.overrides.esbuild = "0.27.3"`（vite 以外の override なし） | `package.json` L101-105 |
| Node / pnpm | Node `24.15.0` / pnpm `10.33.2`（`.mise.toml`） | CLAUDE.md |
| `@opennextjs/cloudflare` | `1.19.4`（`apps/web/package.json` L34） | grep |

## 3. 「Issue を現在のコードに最適化」した3つの核心（重要）

Issue #1201 は 2026-06-10 起票で「次メジャー（当時想定 5→6）」を前提に書かれていたが、現在のコードに照らすと以下に最適化される。**phase 仕様はこの最適化後の方針を正本とする。**

### 核心1: Vite はテストツールチェーン専用（apps/web 本番ビルドは Vite 非依存）

- `apps/web` の本番ビルドは `next build --webpack`（Next.js / OpenNext Workers）であり、**Vite を一切使わない**。`apps/web/next.config.*` / `wrangler.toml` に vite 参照なし（grep 0 件）。
- Vite を消費するのは **`vitest`（テストランナー）と `@vitejs/plugin-react`（テスト時 JSX 変換）のみ**。
- 帰結: Issue が最大リスクとした「`@opennextjs/cloudflare` の Vite メジャー非対応で apps/web ビルド破壊」は**構造的にほぼ無効**。Vite は deploy bundle に関与しない。apps/web ビルドは sanity 確認に留め、blocker ではない。

### 核心2: 目標は Vite 6 ではなく **Vite 7 直行**

- `@vitejs/plugin-react@4.7.0` と `vitest@3.2.6` が**両方すでに Vite 7 を peer/dep でサポート**済み。`@vitejs/plugin-react` を 5.x へ上げる必要はない。
- `vitest@3.2.6` の vite 依存上限は `^7.0.0-0`（v8 は未サポート）。よって **Vite 7 が vitest 3.2.6 が許す最新メジャー = 最適到達点**。
- 中間の Vite 6 を経由する必要はなく、7 へ直行する。

### 核心3: 機構は「specifier 更新」ではなく「直接 devDependency の新規追加」

- 実装前は Vite の直接 specifier が存在しなかったため、Issue 本文の「vite specifier をメジャー更新」は**そのままでは不可**だった。
- 実装は root `package.json` の `devDependencies` に **`"vite": "^7.0.0"` を新規追加**して推移的最低版 5.4.21 を 7.x へ引き上げる（採用方針）。
  - **採用理由**: 直接依存にすることで (1) dependabot が以後追跡可能・(2) 解決バージョンが可視化され drift しにくい・(3) Issue の「specifier をメジャー更新」の意図に最も忠実。
  - 代替案 `pnpm.overrides.vite` は「強制上書き」で peer 検証を弱めるため非採用（フォールバックとしてのみ言及）。

## 4. 変更対象ファイル一覧（canonical・全 phase 共通）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `package.json`（root） | 編集 | `devDependencies` に `"vite": "^7.0.0"` を**新規追加**（推移依存の最低版固定を解除し 7.x へ引き上げ） |
| `pnpm-lock.yaml` | 再生成 | `mise exec -- pnpm install` による lockfile 再生成（vite を 7.x へ解決・単一バージョン維持） |
| `vitest.config.ts` | 条件付き編集 | Vite 7 で deprecation/removed API が検出された場合のみ最小修正。`resolve.alias`(react subpath) / `optimizeDeps` / `plugins:[react()]` / `dedupe` は等価維持（破壊しない） |
| `vitest.d1.config.ts` | 条件付き編集 | 同上。`pool: forks` / `singleFork: true`（issue-617 port exhaustion 回避）を破壊しない |
| 破壊的変更で fail した `*.spec.{ts,tsx}` | 条件付き編集 | RED 分類（V2/V3 該当）に限り期待値・モック設定のみ修正。プロダクトコードは無変更 |

> `apps/api/package.json` / `apps/og/package.json` / `apps/web/package.json` / `packages/*` は vite を直接依存しないため bump 対象外。vite は root の単一ノードで解決される。

## 5. Vite 5→7 破壊的変更カテゴリ（V1〜V8・phase-04/05 で使用）

| ID | カテゴリ | 内容 | 当 repo での想定影響 |
| --- | --- | --- | --- |
| V1 | 解決機構 | 直接 vite 依存が無いため、devDep 追加（`vite ^7`）で 5.4.21→7.x へ引き上げる（実装の中核アクション） | 必須作業。`pnpm why vite` が単一 7.x になることを確認 |
| V2 | resolve.alias / optimizeDeps 挙動 | react subpath（`react/jsx-dev-runtime` 等）の alias 解決・`optimizeDeps.include` の prebundle 挙動 | API は v6/v7 で安定。等価維持で green 期待。jsx-dev-runtime 解決失敗が出たら alias を新 API へ等価変換 |
| V3 | @vitejs/plugin-react interop | `plugins:[react()]` の Vite 7 連携 | 4.7.0 が peer で v7 宣言済み。runtime warning 0 を確認 |
| V4 | deprecation / removed API | Vite 6/7 で削除された API（`splitVendorChunkPlugin`・CJS Node API・`resolve.conditions` 既定変更・`legacy` オプション等） | 現 config は未使用（grep で確認）→ 警告 0 期待。出たら最小置換 |
| V5 | esbuild 整合 | `pnpm.overrides.esbuild=0.27.3` と Vite 7 が期待する esbuild レンジの整合 | `pnpm install` が peer 破壊なく解決するか確認。不整合時は `scripts/cf.sh` の `ESBUILD_BINARY_PATH` / `pnpm verify:vitest-runtime` で吸収 |
| V6 | Node engine 要件 | Vite 7 は Node 20.19+/22.12+ を要求 | 現環境 Node 24.15.0 で充足（NFR・対応不要） |
| V7 | vite-node / 重複バージョン | `vite-node@3.2.4` の vite peer と単一バージョン解決 | `pnpm why vite` で重複（5系と7系の併存）がないことを確認 |
| V8 | apps/web ビルド非影響 | Next.js webpack ビルドが Vite 非依存である事実の明示確認 | sanity `pnpm build` で OpenNext bundle 健全（`[project]/...` 仮想 specifier 混入なし）を確認。blocker ではない |

## 6. テスト shard（全 green を維持する対象）

`api-unit` / `api-d1`（`vitest.d1.config.ts` / pool:forks）/ `web` / `og` / `packages` / `scripts` / `infra`。

## 7. スコープ（CONST_007: 1サイクル完了原則）

本実行サイクル内で Vite 7 依存追加・lockfile 再生成・local evidence 採取まで完了させた。先送り（バックログ送り / 別PR / Phase 2 で対応）は行わない。

### 含むもの

- root `package.json` への `vite ^7.0.0` 直接 devDependency 追加 + `pnpm-lock.yaml` 再生成。
- Vite 7 解決の単一バージョン確認（`pnpm why vite`）。
- Vite 6/7 deprecation 警告採取と `vitest.config.ts` / `vitest.d1.config.ts` の最小修正（必要時のみ）。
- 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の green 維持・破壊的変更で fail したテストの修正。
- `apps/web` OpenNext ビルドの sanity 確認 + typecheck / lint / deprecation grep の締め。

### 含まないもの

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| Vitest 4.x への更新 | 別 followup（#1200 / followup-001）のスコープ。v4 は本タスクと独立 | 別 Issue（#1200） |
| `@vitejs/plugin-react` のメジャーアップ | 4.7.0 が既に Vite 7 を peer サポート。上げる必要なし | 不要 |
| Vite 8 への更新 | `vitest@3.2.6` は vite v8 を未サポート（上限 `^7.0.0-0`）。v8 は Vitest 4 系と同時検討 | 将来（Vitest 4 化と連動） |
| アプリ実装ロジック変更 / D1 schema / Google Form 仕様 | 本タスクは toolchain 依存更新に限定 | 該当機能タスク |
| Next.js 本体メジャー / Turbopack を deploy bundle へ混入 | 不変条件維持（`next build --webpack` 正本） | 対象外 |
| commit / push / PR 作成 | 本プロンプト責務外（CONST_002 / CONST_006） | ユーザー明示承認後 |

> **未タスク分離の有無**: 現時点で 1 サイクル完了を破綻させる外部依存・合意未済は存在しない。RED 実行で想定外の大規模 fail が判明した場合に限り Phase 3 でユーザーへエスカレーションする（CONST_007 例外条件）。

## 8. 不変条件

1. test file は `*.spec.{ts,tsx}` 固定（`*.test.*` 禁止 / CLAUDE.md 不変条件8）。新規テストは追加しない。
2. `vitest.config.ts` の `resolve.alias`（react subpath）/ `optimizeDeps` / `dedupe` / `plugins:[react()]` を破壊しない（等価維持）。
3. `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を破壊しない（issue-617 port exhaustion 回避設計）。
4. `pnpm.overrides.esbuild = "0.27.3"` を維持する（vite 7 と整合しない場合のみ Phase 3 でエスカレーション）。
5. D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件5）。本タスクで D1 schema は変更しない。
6. Node `24.15.0` / pnpm `10.33.2` を `mise exec --` 経由で固定実行する。
7. テストの green 基準を緩めない（skip 増加禁止。fail はコード/期待値修正で解消）。
8. coverage 閾値は既存水準を下げない。
9. `apps/web` 本番ビルドは `next build --webpack` 正本を維持（Turbopack を deploy bundle に混入させない）。

## 9. ローカル検証コマンド（canonical）

```bash
mise exec -- pnpm install            # lockfile 再生成
mise exec -- pnpm why vite           # 単一 7.x 解決の確認（V1/V7）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# shard 別 green
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra
# deprecation 警告ゼロ確認（V4）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
# apps/web sanity build（V8・Vite 非依存の確認）
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

## 10. 参照リンク

- Issue #1201: https://github.com/daishiman/UBM-Hyogo/issues/1201
- 親 workflow: `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`
- 元 unassigned-task: `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade.md`
- Vite migration guide（v6 / v7）: https://vite.dev/guide/migration.html
- issue-747 runbook: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`
- CLAUDE.md（Vitest/esbuild runtime トラブル時 / `apps/web` env 不変条件 / `next build --webpack` 正本）
