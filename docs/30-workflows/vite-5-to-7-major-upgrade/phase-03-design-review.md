# Phase 3: Design Review（設計レビュー）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-01 / phase-02 |
| 判定 | **PASS（Phase 4 へ進行可）** |
| Gate-A 判定 | **passed** |

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点が固定されているか | OK | 論点は「直接依存のない vite@5.4.21 を直接 devDep 新規追加で 7.x へ引き上げ、全 shard を green に保つこと」。単なる specifier 更新ではなく『直接依存の新規追加 + 破壊的変更追従』が主問題と明示 |
| 依存関係・責務境界 | OK | 修正はテスト期待値/モック/config に閉じ、プロダクトコード（`apps/*/src`, `packages/*/src`）不変。Lane 境界（0/A/B/C/D）が明確 |
| 価値とコストの均衡 | OK | 価値=テスト基盤の最新化・将来 EOL/脆弱性回避・解決バージョンの可視化。コスト=不確実な fail 修正幅。RED 観測で早期に規模を測り、過大時はエスカレーション |
| 改善優先順位 | OK | Lane 0（devDep 追加 + lockfile）→ A/B/C（shard 検証・並列）→ D（締め）の順序が妥当 |
| 4条件評価 | OK | 下表 |

## 4条件評価

- **価値性**: 開発者全員のテスト実行基盤を Vite 7 系へ更新し、5.x の保守終了リスクと既知バグを回避。直接依存化により dependabot 追跡・drift 防止という運用価値も得る。誰の何のコストを下げるか明確。
- **実現性**: 1サイクルで devDep 追加 + lockfile + config + test 修正が収まる想定。`@vitejs/plugin-react@4.7.0`（peer v7）と `vitest@3.2.6`（dep 上限 v8 未満）が両方すでに Vite 7 をサポート済みのため、追加のメジャーアップ連鎖は発生しない。実 fail は V2/V3 起因の局所と見込む（全書き換えではない）。
- **整合性**: vite 7 直行（6 経由なし）、`@vitejs/plugin-react` 据え置き、react alias / optimizeDeps / dedupe / D1 pool 設計の等価維持、esbuild override 0.27.3 維持で矛盾なく閉じる。`apps/web` は `next build --webpack` で Vite 非依存（核心1）のため deploy bundle への波及がない。
- **運用性**: 全 shard の green 回復を完了条件に置き、`pnpm why vite` の単一 7.x 確認で drift を担保。後続 resume も `pnpm install` 起点で再現可能。`mise exec --` 経由で Node/pnpm 固定。

## 真の論点

- Issue #1201 本文の「vite specifier をメジャー更新」は、**そのままでは不可**（直接 specifier が存在しない）。真の論点は「直接 devDependency を新規追加して推移的最低版 5.4.21 を 7.x へ引き上げる」こと。
- 目標メジャーは Issue 起票時想定の 6 ではなく **7 直行**。vitest 3.2.6 の vite 上限が `^7.0.0-0`（v8 未サポート）であり、7 が到達上限であることを正本とする。
- apps/web ビルド破壊リスクは構造的にほぼ無効（Vite はテストツールチェーン専用）。よって sanity 確認に留め blocker としない。

## 依存関係・責務境界

- 変更は root `package.json`（vite devDep 追加）/ `pnpm-lock.yaml`（再生成）/ 条件付きで `vitest.config.ts` `vitest.d1.config.ts` `*.spec.{ts,tsx}` に限定。
- `apps/api` / `apps/og` / `apps/web` / `packages/*` の `package.json` は vite を直接依存しないため非変更。vite は root の単一ノードで解決される。
- プロダクトコード（`apps/*/src`, `packages/*/src`）・D1 schema・Google Form 仕様は無変更。

## 因果ループ（簡易）

- 強化ループ: devDep 追加 → RED fail 観測 → V1〜V8 分類精度向上 → 修正の的確化 → GREEN 到達速度向上。
- バランスループ: 修正範囲拡大 → プロダクトコード巻き込みリスク増 → 「責務境界（Phase 2）」で抑制 → 範囲をテスト/config に収束。

## CONST_007（1サイクル完了性）の確認

- スコープは本実行サイクルの **1サイクル内で完了**した。先送り（バックログ送り / 別 PR / Phase 2 で対応）は行わない。
- 1サイクル完了を破綻させる外部依存・合意未済は現時点で**存在しない**:
  - `@vitejs/plugin-react` / `vitest` は既に Vite 7 をサポート済み → 連鎖メジャーアップ不要。
  - Node engine 要件（V6）は現環境 24.15.0 で充足済み → 環境変更不要。
  - apps/web ビルド（V8）は Vite 非依存で blocker でない。
- 唯一の不確実性は RED 実行時の実 fail 規模だが、V2/V3 は期待値修正で解決する性質であり、局所修正で収まる見込み。

## エスカレーション条件（CONST_007 例外の発火点）

以下のいずれかを RED 観測時に検知したら、実装を止めてユーザーへ確認する:

1. 単一の破壊的変更で **数百件規模** のテスト書き換えが必要（局所修正で収まらない）。
2. プロダクトコードの挙動変更なしには green にできない fail がある（Vite 7 が前提とする実装契約の変化）。
3. `pnpm.overrides.esbuild=0.27.3` を変更しないと Vite 7 が peer 解決できない（不変条件4 の破壊を伴う）。
4. coverage 閾値を実測ずれの範囲を超えて下げないと通らない（品質低下を伴う）。

> いずれも現時点の調査では発生可能性は低い（V2/V3 は期待値/config 修正で解決する性質。V4 は current 設定で未使用 → 警告ゼロ期待。V5/V6/V8 は事前調査で吸収済み）。RED で大規模 fail が判明した場合に限り発火する。

## 残課題（Phase 4 への申し送り）

- RED 採取は shard 単位で行い、fail を V1〜V8 のどのカテゴリかタグ付けして記録する（Phase 4 のテスト設計表に反映）。
- Vite 6/7 で removed な API（`splitVendorChunkPlugin` / CJS Node API / `legacy` 等）の有無は `grep -rn` で事前検出し、警告ゼロ期待を裏付ける。
- `pnpm why vite` の単一 7.x 解決は Lane 0 完了直後に必ず確認する（V1/V7 のゲート）。

## Gate-A 判定の根拠

**passed**。判定根拠:

- Phase 1（要件: FR-1〜6 / NFR-1〜8 / AC-1〜8 / P50チェック）と Phase 2（移行方針 / 変更対象ファイル / 既存 config 再利用 / ライブラリ選定 / V1〜V8 / Lane 設計 / 責務境界 / リスク）が SSOT の canonical facts と矛盾なく整合している。
- canonical facts（vite@5.4.21 / 直接依存なし / plugin-react 4.7.0 peer v7 / vitest 3.2.6 dep 上限 v8 未満 / apps/web は next build --webpack で Vite 非依存 / 機構=直接 devDep 追加）を逐語で反映し、独自に値を作り変えていない。
- 実装可能な粒度（変更ファイル・依存定義差分・検証コマンド・DoD）に達している。
- 1サイクル完了を破綻させる外部依存・合意未済が存在しない。

## 判定

**PASS** — 設計は実装可能な粒度に達している。Phase 4（テスト作成 / RED 設計）へ進む。
