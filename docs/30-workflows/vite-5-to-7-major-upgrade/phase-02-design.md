# Phase 2: Design（設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-01-requirements.md |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |

## 設計方針サマリ

Vite の直接 specifier が存在しない現状を、root `package.json` への `"vite": "^7.0.0"` **新規追加**で解消し、推移的最低版 5.4.21 を 7.x へ引き上げる。メジャー跨ぎゆえ「**devDep 追加 + lockfile 再生成（直列の起点）→ RED で fail を観測 → 破壊的変更カテゴリ V1〜V8 へ分類 → 期待値/設定を修正 → GREEN（直列の締め）**」のサイクルで進める。修正は原則「テストの期待値・モック設定・config 設定」に閉じ、**プロダクトコード（`apps/*/src`, `packages/*/src`）は無変更**とする。

## 移行方針

- 機構は **specifier 更新ではなく直接 devDependency の新規追加**。直接依存化により (1) dependabot が以後追跡可能・(2) 解決バージョンが可視化され drift しにくい・(3) Issue の「specifier をメジャー更新」の意図に最も忠実、を満たす。
- 代替案 `pnpm.overrides.vite` は「強制上書き」で peer 検証を弱めるため**非採用**（フォールバックとしてのみ言及）。
- 目標は Vite 6 を経由せず **Vite 7 直行**。`@vitejs/plugin-react@4.7.0`（peer v7）と `vitest@3.2.6`（dep 上限 `^7.0.0-0`）が両方すでに 7 をサポートするため、7 が vitest 3.2.6 が許す最新メジャー = 最適到達点。
- `apps/api/package.json` / `apps/og/package.json` / `apps/web/package.json` / `packages/*` は vite を直接依存しないため bump 対象外。vite は root の単一ノードで解決される。

## 変更対象ファイル一覧（canonical）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `package.json`（root） | 編集 | `devDependencies` に `"vite": "^7.0.0"` を**新規追加**（推移依存の最低版固定を解除し 7.x へ引き上げ） |
| `pnpm-lock.yaml` | 再生成 | `mise exec -- pnpm install` による lockfile 再生成（vite を 7.x へ解決・単一バージョン維持） |
| `vitest.config.ts` | 条件付き編集 | Vite 7 で deprecation/removed API が検出された場合のみ最小修正。`resolve.alias`(react subpath) / `optimizeDeps` / `plugins:[react()]` / `dedupe` は等価維持（破壊しない） |
| `vitest.d1.config.ts` | 条件付き編集 | 同上。`pool: forks` / `singleFork: true`（issue-617 port exhaustion 回避）を破壊しない |
| 破壊的変更で fail した `*.spec.{ts,tsx}` | 条件付き編集 | RED 分類（V2/V3 該当）に限り期待値・モック設定のみ修正。プロダクトコードは無変更 |

## 既存 config 再利用（alias / optimizeDeps 等価維持）

task-specification-creator skill Phase 2 の必須項目「既存コンポーネント再利用可否」に相当する検討。本タスクは UI コンポーネントを持たないため、**既存 config の再利用可否**で代替評価する。

| 既存 config 資産 | 再利用方針 | 根拠 |
| --- | --- | --- |
| `vitest.config.ts` の `resolve.alias`（react subpath: `react/jsx-dev-runtime` 等） | **そのまま再利用（等価維持）**。Vite 7 で解決失敗が出た場合のみ同義の新 API へ等価変換 | alias 解決 API は v6/v7 で安定。新規 alias を生やさない（NFR-5） |
| `vitest.config.ts` の `optimizeDeps`（prebundle include） | **そのまま再利用** | optimizeDeps API は v7 で互換。挙動差が出たら include を等価維持で調整 |
| `vitest.config.ts` の `plugins:[react()]` | **そのまま再利用**。`@vitejs/plugin-react@4.7.0` を bump せず流用 | 4.7.0 が peer で v7 宣言済み（核心2）。新規 plugin を追加しない |
| `vitest.config.ts` の `dedupe` | **そのまま再利用** | vite 重複解決を防ぐ既存設計。V7 重複併存防止と整合 |
| `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` | **そのまま再利用（破壊禁止）** | issue-617 port exhaustion 回避設計（NFR-4） |

> 新規 config ファイル・新規 alias・新規 plugin は一切作らない。Vite 7 への引き上げは「既存 config の等価維持」が原則で、修正は破壊的変更で実害が出た行のみに限定する。

## ライブラリ選定（バージョン固定）

| パッケージ | 現行 | 目標 | 整合要件（実測） |
| --- | --- | --- | --- |
| `vite`（root 直接） | **直接依存なし**（推移的に `5.4.21` 解決） | `^7.0.0`（**新規 devDep 追加**） | Vite 7 は Node `20.19+ / 22.12+` を要求 → Node 24.15.0 で充足 |
| `@vitejs/plugin-react` | `4.7.0` | **変更なし（据え置き）** | peer `vite: ^4.2.0 \|\| ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0` → **既に Vite 7 サポート**。bump 不要 |
| `vitest` | `3.2.6` | **変更なし** | dep `vite: ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0-0` → **Vite 7 サポート / 上限は v8 未満**。よって 7 が到達上限 |
| `esbuild`（override） | `0.27.3`（`pnpm.overrides.esbuild`） | **維持** | Vite 7 が期待する esbuild レンジと整合確認。不整合時のみエスカレーション（NFR-3） |

> **複合確認チェック（ライブラリ選定の実測確認）**: devDep 追加 + `pnpm install` 後に `pnpm why vite` を実行し、解決された実バージョンが **単一 7.x** であること、5 系と 7 系の重複併存がないことを確認する（V1/V7）。`@vitejs/plugin-react` / `vitest` の peer 警告が出ないことも併せて確認する。

## 破壊的変更 → 影響分類マップ（V1〜V8）

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

> V1 が実装の中核アクション。V2/V3 が実 fail を生む主因。V4 は current 設定では未使用のため「警告ゼロ確認」が作業実体。V6 は対応不要（環境充足）。V8 は構造的に非影響（核心1）。

## SubAgent lane 設計（実装プロンプト 03.実装.md 向けの推奨並列構成）

実装は「devDep 追加 + lockfile 再生成（直列の起点）→ RED 観測 → shard 別検証（並列可能）→ 締め（直列）」とする。

| Lane | 担当 | 並列性 |
| --- | --- | --- |
| Lane 0（直列・起点） | root `package.json` への `vite ^7.0.0` 新規追加 + `pnpm install`（lockfile 再生成）+ `pnpm why vite` 単一 7.x 整合確認 | 直列（全 lane の前提） |
| Lane A（並列） | api shard（unit + d1）の RED 採取 → fail 分類 → 修正 | V2/V3 中心。D1 は `vitest.d1.config.ts`（pool:forks 維持） |
| Lane B（並列） | web shard（apps/web）の RED 採取 → 修正 | V2 + react alias 健全性（jsx-dev-runtime 解決） |
| Lane C（並列） | og / packages / scripts / infra shard の RED 採取 → 修正 | 小規模。V2/V4 中心 |
| Lane D（直列・締め） | deprecation grep（V4 警告ゼロ）+ esbuild 整合確認（V5）+ apps/web sanity build（V8）+ 全 shard 統合 GREEN + typecheck / lint | validation lane |

> 並列は最大 3（Lane A/B/C）に抑え、validation（Lane D）は直列で締める（skill ベストプラクティス準拠）。

## 修正判断の境界（責務所有権）

| 事象 | 修正してよい | 修正してはいけない |
| --- | --- | --- |
| react subpath alias の解決失敗（V2） | `vitest.config.ts` の alias 該当行（等価変換） | プロダクトの import 文・react 依存構成 |
| `plugins:[react()]` の interop 警告（V3） | config の plugin 呼び出し（等価維持の範囲） | `@vitejs/plugin-react` のメジャーアップ（4.7.0 据え置き） |
| Vite 7 で removed API 警告（V4） | config の該当行のみ最小置換 | alias / optimizeDeps / pool の設計意図 |
| 期待エラー型・モック挙動の差（V2/V3 起因の spec fail） | テスト期待値・モック設定（`*.spec.{ts,tsx}`） | プロダクトコード（`apps/*/src`, `packages/*/src`） |
| esbuild レンジ不整合（V5） | `pnpm verify:vitest-runtime` / `ESBUILD_BINARY_PATH` での吸収 | `pnpm.overrides.esbuild=0.27.3` の値（維持・変更時はエスカレーション） |

## 検証パス設計

```
vite ^7 devDep 追加 → pnpm install（lockfile 再生成）→ pnpm why vite（単一 7.x 確認 / V1・V7）
     → pnpm typecheck → pnpm lint
     → shard 別 vitest run（RED 観測 / 分類 V2〜V4 / 修正 / GREEN）
     → deprecation 警告 grep（warn ゼロ / V4）
     → esbuild 整合確認（V5）
     → apps/web sanity build（V8・Vite 非依存確認）
     → bash scripts/verify-pr-ready.sh
```

## リスクと対応

| リスク | 兆候 | 対応 |
| --- | --- | --- |
| 想定外の大規模 fail（数百件） | RED で広範な fail | Phase 3 でユーザーへエスカレーション（CONST_007 例外判定） |
| react subpath alias 解決失敗（V2） | jsx-dev-runtime 等の resolve エラー | alias を新 API へ等価変換（設計意図は維持）。プロダクト import は触らない |
| vite 重複併存（5系と7系）（V7） | `pnpm why vite` に複数バージョン | `dedupe` 維持確認 + lockfile 再生成。単一 7.x へ収束 |
| esbuild arch / レンジ不整合（V5） | vitest 起動前停止・peer 破壊 | `pnpm install --force` + `pnpm verify:vitest-runtime`（issue-747 runbook） |
| D1 port exhaustion 再発 | api-d1 shard が hang/EADDRINUSE | `singleFork: true` 維持を確認（issue-617/747 runbook） |
| apps/web ビルド異常（V8） | OpenNext bundle に `[project]/...` 混入 | 構造的に Vite 非依存（核心1）。発生時は Vite 由来でない別問題として切り分け（blocker でない） |

## 完了条件

- [ ] 移行方針（直接 devDep 新規追加 / Vite 7 直行 / overrides 非採用）が固定されている
- [ ] 変更対象ファイル一覧（SSOT §4 逐語）が記載されている
- [ ] 既存 config 再利用（alias/optimizeDeps 等価維持）が明記されている
- [ ] ライブラリ選定表（plugin-react 4.7.0 据え置き / vitest 3.2.6 の vite 上限 v8 未満）が記載されている
- [ ] 破壊的変更カテゴリ V1〜V8 が記載されている
- [ ] SubAgent lane（0/A/B/C/D）と並列性が設計されている
- [ ] 修正判断の境界（責務所有権）とリスク対応が明示されている
