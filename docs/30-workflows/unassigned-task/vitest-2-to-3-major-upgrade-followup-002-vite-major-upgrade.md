# vitest-2-to-3-major-upgrade followup 002 / Vite メジャーアップグレード - タスク指示書

## メタ情報

```yaml
issue_number: 1201
status: 未着手
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade |
| タスク名     | Vite メジャーアップグレード |
| 分類         | 改善（ビルド/テストツールチェーン更新） |
| 対象機能     | monorepo ビルド/テストツールチェーン（`vite` / `vitest` 連動） |
| 優先度       | 低 |
| 見積もり規模 | 中規模 |
| ステータス   | 未着手 |
| GitHub Issue | #1201 |
| 発見元       | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/outputs/phase-12/unassigned-task-detection.md` の baseline 候補 |
| 発見日       | 2026-06-10 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`vitest-2-to-3-major-upgrade` ワークフローで Vitest を `^3.2.6` へ更新した。Vitest 3.2.6 は Vite 5 / 6 / 7 を許容するため、本タスクのスコープでは Vite 単体のメジャーアップグレードは不要として除外された（baseline 候補）。

### 1.2 問題点・課題

Vite を現行系に据え置くと、(1) Vitest 4.x（followup-001）が要求する Vite メジャー要件と将来衝突する可能性、(2) Vite 本体のセキュリティ patch / パフォーマンス改善の取りこぼし、(3) `@opennextjs/cloudflare`（`apps/web`）や `vitest.config.ts` の `resolve.alias` / `optimizeDeps` といった Vite 依存設定との整合ずれ、が累積する。

### 1.3 放置した場合の影響

- followup-001（Vitest 4.x）着手時に Vite メジャー更新を同時に強いられ、変更面が一気に膨らむ
- Vite の EOL 後にセキュリティ patch が止まり、強制移行を迫られる
- dependabot の Vite メジャー PR が継続的に赤くなりノイズ化する

---

## 2. 何を達成するか（What）

### 2.1 目的

Vite を現行から次のメジャー系へ更新し、ビルド（`next build --webpack` 正本含む）とテスト（Vitest 全 shard）の両方が green を維持することを確認する。

### 2.2 最終ゴール

- `vite` が次メジャー系に更新され、`vitest` 系との peer / 互換が成立する
- 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）が green
- `apps/web` の OpenNext Workers ビルド（`next build --webpack`）が成功する
- `vitest.config.ts` の `resolve.alias`（react subpath）/ `optimizeDeps` が破壊されていない
- typecheck / lint green・deprecation grep 0 件

### 2.3 スコープ

#### 含むもの

- `vite` specifier のメジャー更新と `pnpm-lock.yaml` 再生成
- `vitest.config.ts` / `vitest.d1.config.ts` の Vite メジャー由来 API / deprecation 対応（必要時のみ）
- `apps/web` ビルド互換確認（OpenNext / Cloudflare Workers bundle）
- Vite メジャー由来の test / config 最小修正

#### 含まないもの

- アプリ実装ロジック（`apps/*/src`・`packages/*/src`）の挙動変更
- D1 schema 変更・Google Form 仕様変更
- Next.js 本体のメジャーアップグレード
- Turbopack を Cloudflare Workers deploy bundle へ混入させる変更（local dev 限定の不変条件を維持）
- commit / push / PR 作成

### 2.4 成果物

- `vite` specifier + `pnpm-lock.yaml` の更新差分
- ビルド（`apps/web` OpenNext）/ 全 shard / typecheck / lint / deprecation grep の NON_VISUAL 証跡
- Vite メジャー breaking-change 対応記録

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Vitest 系が現行（v3.2.6 以降）で安定していること
- 対象 Vite メジャーが `vitest` と `@opennextjs/cloudflare` の双方でサポートされていること
- 直前の安定状態が dev / main に取り込まれていること

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`
- 関連: followup-001（Vitest 4.x。v4 が Vite メジャーを要求する場合、本タスクが先行依存になる）

### 3.3 必要な知識

- Vite メジャー migration guide / breaking change
- `vitest.config.ts` の `resolve.alias` / `optimizeDeps` と Vite resolve パイプラインの関係
- `@opennextjs/cloudflare` と Vite / esbuild バージョン整合（`ESBUILD_BINARY_PATH` / `scripts/cf.sh`）
- `apps/web` の production build は `next build --webpack` が正本（Turbopack は local dev 限定）

### 3.4 推奨アプローチ

`vite` specifier をメジャー更新して lockfile を再生成し、まず Vitest 全 shard を緑に保てるか確認する。その後 `apps/web` の OpenNext Workers ビルドが成功するかを確認する。`vitest.config.ts` の alias / optimizeDeps は壊さず、Vite メジャー由来の deprecation のみ最小修正する。

---

## 4. 実行手順

### Phase 1: vite bump + lockfile 再生成

#### 目的

vite を次メジャーへ上げ依存解決を更新する。

#### 手順

1. `vite` specifier をメジャー更新（vitest が許容する範囲で最新メジャーへ）
2. `mise exec -- pnpm install` で `pnpm-lock.yaml` 再生成
3. `mise exec -- pnpm why vite` で解決バージョンと重複有無を確認

#### 完了条件

- vite が目標メジャーに解決され、vitest との peer 不整合がない

### Phase 2: テスト緑化

#### 目的

Vite メジャー由来のテスト / config 破壊を解消する。

#### 手順

1. 各 shard で `vitest run` を実行し失敗を収集
2. `resolve.alias` / `optimizeDeps` / `pool` 設定が壊れていないか確認
3. Vite メジャー由来の最小修正を適用

#### 完了条件

- 全 shard green・alias / optimizeDeps 維持

### Phase 3: ビルド互換確認

#### 目的

`apps/web` の OpenNext Workers ビルドが成功するか確認する。

#### 手順

1. `mise exec -- pnpm build`（`apps/web` は `next build --webpack` 正本）
2. Cloudflare Workers bundle に `[project]/...` 仮想 module specifier が混入していないか確認
3. typecheck / lint / deprecation grep で締める

#### 完了条件

- ビルド成功・bundle 健全・typecheck / lint green

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `vite` が目標メジャーに更新され vitest と互換している
- [ ] 全 shard が green
- [ ] `apps/web` OpenNext Workers ビルドが成功する

### 品質要件

- [ ] `vitest.config.ts` の `resolve.alias` / `optimizeDeps` を破壊していない
- [ ] アプリ実装ロジックを変更していない
- [ ] Turbopack を deploy bundle に混入させていない
- [ ] deprecation grep 0 件

### ドキュメント要件

- [ ] Vite メジャー breaking-change 対応記録が残っている
- [ ] NON_VISUAL 証跡（build / shard / typecheck / lint / grep）が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm install
mise exec -- pnpm why vite
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

期待: vite が目標メジャーに解決。typecheck / lint / build exit 0。全 shard green。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| Vite メジャーで `resolve.alias`（react subpath）/ `optimizeDeps` の挙動が変わりテストが壊れる | 高 | 中 | 既存設定を維持しつつ、Vite メジャーの新 resolve API へ等価変換し shard 単位で検証する |
| `@opennextjs/cloudflare` が対象 Vite メジャーに未対応で `apps/web` ビルドが壊れる | 高 | 中 | 着手前に OpenNext の対応バージョンを確認し、未対応なら本タスクを保留する |
| esbuild バージョン不整合でデプロイ bundle が壊れる | 中 | 中 | `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 自動解決を維持し、`pnpm verify:vitest-runtime` で確認する |
| followup-001（Vitest 4.x）と更新タイミングが競合する | 中 | 中 | v4 が Vite メジャーを要求する場合は本タスクを先行させ、依存順序を明示する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`
- `vitest.config.ts` / `vitest.d1.config.ts`
- `apps/web/wrangler.toml`

### 参考資料

- Vite 公式 migration guide（メジャー）
- `@opennextjs/cloudflare` 対応 Vite バージョン
- CLAUDE.md: `apps/web` production build は `next build --webpack` が正本

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | （将来）Vite メジャーで `resolve.alias` / `optimizeDeps` の挙動変更によりテストが壊れる、または `apps/web` の OpenNext ビルドが失敗する見込み |
| 原因 | Vite メジャーは resolve / optimizeDeps / dev server API に破壊的変更を持ち込み、OpenNext や esbuild との整合が崩れやすいため |
| 対応 | vite bump → 全 shard green → OpenNext ビルド成功確認、の順で段階検証し、alias / optimizeDeps は等価維持する |
| 再発防止（future-self への観点） | (1) `vitest.config.ts` の `resolve.alias`（react subpath）/ `optimizeDeps` は Vite メジャー後も等価維持し、削除でなく新 API へ変換する (2) 着手前に `@opennextjs/cloudflare` の対応 Vite バージョンを必ず確認する（未対応なら保留） (3) esbuild 不整合は `scripts/cf.sh` の `ESBUILD_BINARY_PATH` と `pnpm verify:vitest-runtime` で吸収する (4) followup-001（Vitest 4.x）が Vite メジャーを要求する場合は本タスクを先行依存として順序を固定する |

### 補足事項

本タスクは Vitest 系が安定している前提で着手する将来タスクである。followup-001（Vitest 4.x）が Vite メジャー要件を持つ場合、本タスクが先行依存となる。commit / push / PR 作成はスコープ外。
