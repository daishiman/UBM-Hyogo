# __fixtures__ / __tests__ prod build 除外設定 foundation - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | 02c-followup-002-fixtures-prod-build-exclusion                                |
| タスク名     | apps/api `__fixtures__` / `__tests__` の prod build 除外設定 foundation       |
| 分類         | 改善 / foundation                                                             |
| 対象機能     | apps/api ビルド成果物から dev-only コードを除外する tsconfig / vitest 構成    |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 02c Phase 12 unassigned-task-detection #6                                     |
| 発見日       | 2026-04-27                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02c は `apps/api/src/repository/__fixtures__/admin.fixture.ts` と `apps/api/src/repository/__tests__/_setup.ts` を **dev fixture / test loader** として実装した（不変条件 #6: production seed として扱わない）。これらは **production import path に登場してはならない** が、現状の `apps/api/tsconfig.json` は単一構成で、build / test の include 範囲が分離されていない。

### 1.2 問題点・課題

- `apps/api/tsconfig.json` が build / test 共用で、`__fixtures__/` / `__tests__/` が production bundle に含まれる可能性
- miniflare 等の test 専用依存が production runtime に流入するリスク
- `__fixtures__/admin.fixture.ts` の seed データ（`owner@example.com` 等）が実 deploy 成果物に紛れ込むと監査上の懸念
- 02a / 02b も同じ `_setup.ts` を共有利用するため、影響範囲は apps/api 全体

### 1.3 放置した場合の影響

- production deploy で test fixture コードが Worker bundle に含まれ、サイズ膨張 / 攻撃面増加
- 不変条件 #6（dev fixture を production seed に昇格させない）が build 構成で守られていない
- 後続タスク（03a 以降）が新規 fixture を追加するたびに同じ判断を再現性なく毎回することになる

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api` の build 成果物から `__fixtures__/` / `__tests__/` を **構成上強制的に除外** し、production runtime に dev-only コードが流入しない状態を foundation として固定する。

### 2.2 最終ゴール

- `apps/api/tsconfig.build.json` または `tsconfig.json` の `exclude` 設定で `__fixtures__/**` / `__tests__/**` が build 対象外
- vitest 専用 include で test 実行は影響を受けない
- `wrangler deploy --dry-run` 相当の build 成果物に fixture / test ファイルが含まれないことを確認

### 2.3 スコープ

#### 含むもの

- `apps/api/tsconfig.json` 分割（build / test）または exclude 追加
- `vitest.config.ts` の include / exclude 整合
- `.dependency-cruiser.cjs` への production import path violation rule 追加（`src/**/*.{ts,tsx}` から `__fixtures__` / `__tests__` への import を禁止）
- 02c implementation-guide.md 不変条件 #6 節への反映

#### 含まないもの

- 02a / 02b の test refactor（fixture 共有契約は 02c 正本のまま）
- production fixture / seed の新規実装（別タスク）
- monorepo 全体の tsconfig 構成見直し

### 2.4 成果物

- `apps/api/tsconfig.build.json`（新規）または `tsconfig.json` exclude 差分
- `apps/api/vitest.config.ts` 整合差分
- `.dependency-cruiser.cjs` rule 追加
- `wrangler deploy --dry-run` での bundle 内訳確認ログ
- 02c implementation-guide.md 不変条件 #6 補強差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `apps/api/src/repository/__fixtures__/` / `__tests__/` の現状ファイル一覧を把握
- 02c の不変条件 #6 を理解
- vitest 設定の現状を理解

### 3.2 実行手順

1. `apps/api/tsconfig.json` を build / test に分割するか、`exclude` を追加
2. `vitest.config.ts` の include に `__tests__/**/*.test.ts` 等を明示
3. `.dependency-cruiser.cjs` に `no-prod-import-from-fixtures` ルールを追加
4. `pnpm build` 後の成果物に `__fixtures__` / `__tests__` が無いことを確認
5. `pnpm test` が引き続き通ることを確認
6. 02c implementation-guide.md の「やってはいけないこと」リストに「production import path から `__fixtures__` を import しない」を追記

### 3.3 受入条件 (AC)

- AC-1: `apps/api` build 成果物に `__fixtures__/**` / `__tests__/**` のファイルが含まれない（成果物 ls で確認）
- AC-2: `pnpm test` が引き続き通る（fixture loader が動く）
- AC-3: production code（`src/**` で `__tests__` / `__fixtures__` 配下以外）から `__fixtures__` への import が `.dependency-cruiser.cjs` で error になる
- AC-4: 02a / 02b の test も影響を受けず通る（`_setup.ts` 共有契約維持）
- AC-5: `wrangler deploy --dry-run` または `pnpm build` の bundle サイズが fixture 除外で縮小していることを記録

---

## 4. 苦戦箇所 / 学んだこと（02c で得た知見）

### 4.1 dev fixture の production 流入リスク

02c では `__fixtures__/admin.fixture.ts` に `owner@example.com` 等の seed データを含めたが、これが production bundle に紛れ込むと監査上「production seed として混入した」と誤認される可能性がある。**build 構成で物理的に除外** する仕組みが必要。

### 4.2 単一 tsconfig の限界

`apps/api/tsconfig.json` 単一構成では、test と build で異なる include 範囲を持てない。`tsconfig.build.json` を分けて `wrangler` ビルドはこちらを参照させる構成が一般的。ただし、参照切り替えの設定箇所（`wrangler.toml` / `package.json` scripts）を一通り更新する必要がある。

### 4.3 三重防御の継続

skill-feedback-report の提案 #3「dep-cruiser + ESLint + 自前 lint script の三重防御」を fixture 除外にも適用する。tsconfig exclude（build 時）+ dep-cruiser rule（CI 時）+ implementation-guide 注意書き（人間レビュー時）の 3 層で防御する。

---

## 5. 関連リソース

- `apps/api/src/repository/__fixtures__/admin.fixture.ts` - dev fixture 本体
- `apps/api/src/repository/__tests__/_setup.ts` - test loader 本体
- `apps/api/tsconfig.json` - 現行 build / test 共用 config
- `.dependency-cruiser.cjs` - boundary rule
- 02c implementation-guide.md 不変条件 #6 / `_setup.ts` 節
- skill-feedback-report.md #3 (三重防御)
- unassigned-task-detection.md #6
