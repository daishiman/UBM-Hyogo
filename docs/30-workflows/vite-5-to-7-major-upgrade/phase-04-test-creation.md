# Phase 4: Test Creation（テスト作成 / RED 設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-01 / phase-02 / phase-03 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | 新規テスト追加ではなく、**既存 651+ spec を Vite 7 化後に走らせて RED（fail し得る箇所）を分類観測し V1〜V8 へ紐付ける** |

## TDD RED の読み替え（依存アップグレード特有）

通常の機能開発では「RED = 仕様を満たさない新規テストを先に書いて落とす」が、本タスクは**ビルド/テストツールチェーン依存（Vite）のメジャーアップグレード**であり新機能を持たない。したがって本 Phase の RED は次のように読み替える:

> **RED = root `package.json` に `"vite": "^7.0.0"` を直接 devDependency 追加して 5.4.21 → 7.x へ引き上げた状態で既存 651+ spec を実行し、Vite 5→7 の破壊的変更（V1〜V8）に起因して fail し得るテストを観測・分類すること。**

- 新しい `*.spec.{ts,tsx}` は作らない（不変条件1: test file は既存資産の green 維持が目的・新規テストは追加しない）。
- 本タスクは「**既存 651+ spec の green 維持を検証する**」性質であり、**期待値（expected result）は基本 fail 0 = green 維持**である。RED は「Vite 7 化後に破壊的変更で fail し得るテスト」を `RED-V{n}-{seq}` タグで**分類観測**する枠組みである。
- RED の対象は「既に存在するテスト」であり、GREEN（Phase 5 実装）で**期待値・config・依存定義**を最小修正して回復させる。プロダクトコードは無変更。
- RED が **ゼロ件**（破壊的変更の影響を受けるテストが無い）であれば、それ自体が望ましい観測結果であり、Phase 5 は devDep 追加 + lockfile 確認のみで完了する。

> 本タスクの主観測対象は **V2（resolve.alias / optimizeDeps の react subpath 解決）/ V3（@vitejs/plugin-react interop）/ V7（vite 重複解決）**（SSOT §5）。Vite は apps/web 本番ビルド非依存（V8）のため、観測面は vitest テストランナーと `@vitejs/plugin-react`（テスト時 JSX 変換）に閉じる。
>
> 本 Phase は「fail を採取する手順と分類の枠組み」を確定するもので、実 fail の修正は Phase 5 が担う。RED 採取は Phase 5 の Step 1（devDep 追加）→ Step 2（lockfile 再生成）完了後に同一サイクル内で実行する。

## 命名規則整合の確認（不変条件1）

新規 spec を追加しないため命名違反は発生しないが、RED 観測対象が既存資産であることを機械的に確認する。

```bash
# *.test.{ts,tsx} が存在しない（*.spec.{ts,tsx} のみ）ことの確認（CLAUDE.md 不変条件8）
grep -rlE "\.test\.(ts|tsx)$" --include="*.test.ts" --include="*.test.tsx" . 2>/dev/null && echo "NG: .test.* が存在（要 .spec.* へ）" || echo "OK: .spec.{ts,tsx} のみ"
```

## RED 採取手順（shard 別）

RED 採取は CI shard の単位に揃え、各 shard を独立実行して fail をカテゴリタグ付けする。実行は全て `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を固定する。**期待値は全 shard fail 0（green 維持）**。

| shard | config | 実行コマンド（devDep 追加 + lockfile 再生成の後に実行） | fail 分類タグ付けの観点 |
| --- | --- | --- | --- |
| api-unit | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api` | V3 plugin-react interop / V4 deprecation。基本 fail 0 |
| api-d1 | `vitest.d1.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api` | V7 `pool: forks`/`singleFork` 下で vite 単一解決が壊れていないこと。port exhaustion 非再発も観測 |
| web | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web` | **主観測**: V2（`react/jsx-dev-runtime` 等 react subpath alias / optimizeDeps prebundle）/ V3（plugins:[react()]） |
| og | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og` | V4 中心（小規模）。deprecation 警告採取に最適 |
| packages | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages` | V2/V3 影響の有無確認 |
| scripts | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts` | `vitest`/vite 実行系 spec の V7 重複解決 |
| infra | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra` | V4 中心（cloudflare-alerts / sentry-alerts） |

> `--root=.` はワークツリールートを指す（root の `package.json` から実行する場合）。apps/* の package.json script は `--root=../..` を用いるため、apps 内から実行する場合は既存 script（`pnpm --filter @ubm-hyogo/api test` 等）をそのまま使ってもよい。**重要なのは config の対応（unit=`vitest.config.ts` / D1=`vitest.d1.config.ts`）を崩さないこと**（不変条件2/3）。
>
> fail 分類は各 shard 出力の `FAIL` 行から、後述の「fail 分類テーブル」のカテゴリ（V1〜V8）を該当テストごとに付与し、Phase 5 の修正対象一覧へ転記する。

## 事前検出 grep コマンド（V4 deprecation / V7 重複解決の有無確認）

devDep 追加前後どちらでも実行可能な静的・解決検出。**現 config が V4 の削除済み API を使っていないこと**と、**V7 の vite 重複解決が無いこと**を機械的に確定する。

```bash
# --- V1/V7: vite が単一バージョン（7.x）で解決されているか（重複の有無） ---
mise exec -- pnpm why vite     # 5系と7系の併存（重複）がないこと・単一 7.x を確認

# --- V4: Vite 6/7 で削除された API を config が使っていないことの確認 ---
# splitVendorChunkPlugin（v6 で削除） / legacy オプション / resolve.conditions の明示
grep -rn "splitVendorChunkPlugin\|legacy:\|resolve.conditions\|conditions:" vitest.config.ts vitest.d1.config.ts || echo "OK: V4 削除 API の記述なし（影響なし）"

# --- V4 補足: CJS Node API（require('vite')）の使用有無（v6 で deprecation） ---
grep -rn "require(['\"]vite['\"])" vitest.config.ts vitest.d1.config.ts vite.config.* 2>/dev/null || echo "OK: CJS vite Node API なし"

# --- V2: react subpath alias / optimizeDeps の現状記述を確認（等価維持の対象） ---
grep -rn "jsx-dev-runtime\|jsx-runtime\|optimizeDeps\|resolve.alias\|alias:\|dedupe" vitest.config.ts || echo "（参考）react subpath alias / optimizeDeps の記述位置を確認"
```

> V2 の alias / optimizeDeps は **API が v6/v7 で安定**しており等価維持で green が期待値（SSOT §5）。grep はヒットすることが正常で、Phase 5 は当該記述を**破壊しない**（不変条件2）。jsx-dev-runtime 解決失敗が出た場合のみ alias を新 API へ等価変換する。

## fail 分類テーブル（RED テストケース ID と想定 fail）

RED 採取で観測されうる典型 fail を、テスト ID 形式 `RED-V{n}-{seq}` で事前カタログ化する。**実 fail の有無は devDep 追加後の実行で確定する**（期待値は fail 0）が、万一 fail した場合 Phase 5 はこのカタログに沿って分類・修正する。

| RED ID | カテゴリ | 想定 fail の典型例 | Vite 5→7 で何が変わるか | Phase 5 の修正方針 |
| --- | --- | --- | --- | --- |
| RED-V2-01 | V2 | `react/jsx-dev-runtime` 等の react subpath が解決できず web shard の JSX 変換テストが `Cannot find module` で fail | Vite 7 の `resolve.alias` / optimizeDeps prebundle 既定挙動の差で subpath 解決が変化し得る | `resolve.alias` の react subpath マッピングを Vite 7 の等価 API へ最小変換（マッピング先 import 名は不変・SSOT §4） |
| RED-V2-02 | V2 | `optimizeDeps.include` の prebundle 対象が変わり、web の特定 spec で esm/cjs interop 不整合が出る | optimizeDeps の依存最適化挙動が v6/v7 で更新される | `optimizeDeps.include` を等価に保ちつつ、必要なら明示 include を最小追加（プロダクトコードは無変更） |
| RED-V3-01 | V3 | `plugins:[react()]` 経由の JSX 変換が runtime warning（plugin-react interop）を出す / 一部 tsx spec が transform 段階で fail | `@vitejs/plugin-react@4.7.0` の Vite 7 連携。peer は v7 宣言済みのため通常は green | runtime warning 0 を確認。warning が出た場合のみ plugin オプション（`jsxRuntime` 等）を等価に明示。plugin-react のメジャーアップは行わない（SSOT 含まないもの） |
| RED-V7-01 | V7 | `pnpm why vite` が 5系と7系を併存解決し、`vite-node@3.2.4` の peer 不整合で実行系 spec が fail | 直接 devDep 追加後も別経路の最低版制約が残ると重複解決が発生し得る | lockfile を再生成（`pnpm install`）し単一 7.x へ収束。収束しない場合のみ `pnpm.overrides.vite`（フォールバック）を検討しエスカレーション |
| RED-V7-02 | V7 | api-d1 shard（`pool: forks` / `singleFork: true`）で vite 解決の差により worker 起動が hang する | forks pool 環境で vite 7 の解決が単一でないと worker 初期化が不安定化し得る | 単一 7.x 解決を先に保証（RED-V7-01）。`pool: forks`/`singleFork` 設定自体は破壊しない（不変条件3） |

> V4（deprecation / removed API）と V5（esbuild 整合）は spec の `FAIL` ではなく**実行時の警告ログ / `pnpm install` の peer 解決**として現れるため、上表の RED 採取ではなく Phase 5 Step 5（deprecation grep）/ Step 2（lockfile・esbuild 整合）で扱う。V6（Node engine 要件）は Node 24.15.0 で充足済み・対応不要（SSOT §5）。V8（apps/web ビルド非影響）は Vite 非依存の sanity 確認であり spec fail を生まない。

## ローカル実行コマンド一覧

```bash
# 0) devDep 追加後の前提（Phase 5 Step 1-2 完了が前提）
mise exec -- pnpm install     # lockfile 再生成
mise exec -- pnpm why vite    # 解決バージョンが単一 7.x で一致するか（V1/V7）

# 1) shard 別 RED 採取（fail をカテゴリタグ付けして記録・期待値は全 shard fail 0）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api    # api-unit
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api # api-d1
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web    # web（主観測 V2/V3）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og     # og
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages    # packages
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts     # scripts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra       # infra

# 2) 静的・解決検出（V4/V7）
mise exec -- pnpm why vite
grep -rn "splitVendorChunkPlugin\|legacy:\|resolve.conditions\|conditions:" vitest.config.ts vitest.d1.config.ts || echo "OK: V4 なし"

# 3) deprecation 警告の採取（stderr を含めて確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```

## 完了条件

- [ ] 「依存アップグレードにおける RED の読み替え（期待値 = fail 0 / green 維持）」が記載されている
- [ ] 主観測対象が V2 / V3 / V7 であることが明示されている
- [ ] shard 別（api-unit / api-d1 / web / og / packages / scripts / infra）の RED 採取手順と実行コマンドが記載されている
- [ ] V4（削除 API）/ V7（vite 重複解決）の事前検出 grep / `pnpm why vite` が具体的に記載されている
- [ ] fail 分類テーブル（`RED-V2-01` 等の ID で V2/V3/V7 の典型 fail を 3 件以上）が記載されている
- [ ] 命名規則整合（`*.spec.{ts,tsx}` のみ・新規追加なし）の確認手順が記載されている
- [ ] RED の分類結果が Phase 5 の修正対象一覧へ転記される導線が示されている
