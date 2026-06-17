# Phase 6: Test Expansion（テスト拡充 / 回帰ガード）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-04 / phase-05 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | 新規機能テストは増やさず、**Vite 7 化の回帰ガード**（単一 vite 解決・react subpath / optimizeDeps 健全・D1 forks pool 健全・deprecation ゼロ）を継続確認できる状態にする |

## 本タスクでのテスト拡充の読み替え

通常の機能開発では「テスト拡充 = エッジケース・境界値・新規シナリオの追加」だが、本タスクは**ビルド/テストツールチェーン依存（Vite）のメジャーアップグレード**であり、新しいプロダクト挙動を導入しない。新規 `*.spec.{ts,tsx}` を追加すると「既存 651+ spec の green 維持」という目的から逸脱する（不変条件1）。したがって本 Phase の拡充は次の 4 点に読み替える:

> **(a) 単一 vite 解決の回帰ガード** — vite が 7.x 単一で解決され続け、5系と7系の重複（V7）が再発しないことを観測する。
> **(b) react subpath / optimizeDeps 健全の回帰確認** — `react/jsx-dev-runtime` 等の subpath 解決・optimizeDeps prebundle（V2）が web shard で壊れていないことを確認する。
> **(c) D1 forks pool 設計の回帰確認** — `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` が維持され、port exhaustion なく完走することを確認する。
> **(d) deprecation 警告ゼロの継続確認** — V4 の削除済み API（`splitVendorChunkPlugin` / `legacy` / `resolve.conditions`）が混入していないことを確認する。

これらは「新規テストの追加」ではなく、**Phase 5 の GREEN 状態が将来も崩れないことを担保する観測手順**として確立する。新規 spec ファイルは作成しない（不変条件1）。

## 回帰ガードテーブル

| 回帰観点 | 何を守るか | 確認手段 | 関連カテゴリ / 不変条件 |
| --- | --- | --- | --- |
| 単一 vite 解決 | vite が 7.x 単一解決（5系と7系の重複なし） | `mise exec -- pnpm why vite` の解決バージョン突合（単一 7.x） | V1 / V7 |
| react subpath 健全 | `react/jsx-dev-runtime` 等 subpath の alias 解決が web で壊れていない | web shard 実行が `Cannot find module` なく green | V2 |
| optimizeDeps prebundle 健全 | optimizeDeps の依存最適化が esm/cjs interop を壊さない | web shard の JSX 変換 spec が green | V2 |
| plugin-react interop | `plugins:[react()]` が runtime warning ゼロ | web/api shard 実行ログに plugin-react warning なし | V3 |
| D1 singleFork 動作 | `pool: forks`/`singleFork: true` 維持・port exhaustion 非再発 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api` が hang/EADDRINUSE なく完走 | V7 / 不変条件3 |
| jsx-dev-runtime 解決 | 開発時 JSX 変換ランタイムの解決が壊れていない | web shard の tsx spec が transform 段階で fail しない | V2 / V3 |
| coverage shard 全 green | CI shard（web / api-unit / api-d1 / og / packages / scripts / infra）相当の green 維持 | 各 shard の実行が green | 不変条件7 |
| deprecation 警告ゼロ | V4（`splitVendorChunkPlugin`/`legacy`/`resolve.conditions`）の非混入 | grep 静的検出 + vitest 実行ログの warn ゼロ | V4 |
| esbuild 整合 | `pnpm.overrides.esbuild=0.27.3` と vite 7 の peer 整合 | `pnpm install` が peer 破壊なく解決 | V5 / 不変条件4 |
| apps/web Vite 非依存 | next build --webpack が Vite に影響されない | `mise exec -- pnpm build` 完走・OpenNext bundle 健全 | V8 / 不変条件9 |

> 上表は新規テストファイルではなく、Phase 7（カバレッジ確認）/ Phase 9（品質保証）/ CI で繰り返し実行される「回帰観点」のチェックリストとして機能する。

## Vite 7 固有の回帰を守る補助コマンド

```bash
# (a) 単一 vite 解決の回帰ガード（V1/V7）
mise exec -- pnpm why vite     # 単一 7.x・重複なしを継続確認

# (b) react subpath / optimizeDeps / jsx-dev-runtime 健全（V2）— web shard が主検証面
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web 2>&1 | grep -i "cannot find module\|jsx-dev-runtime\|optimizeDeps" || echo "OK: V2 解決エラーなし"

# (c) D1 forks pool 健全（V7 / 不変条件3）— hang/EADDRINUSE なく完走
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api

# (d) deprecation 警告ゼロ継続確認（V4）
grep -rn "splitVendorChunkPlugin\|legacy:\|resolve.conditions\|conditions:" vitest.config.ts vitest.d1.config.ts || echo "OK: V4 なし"
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```

## skip 件数が増えていないことの確認手順

アップグレードに伴い「fail を skip でごまかして緑にする」退行を防ぐため、devDep 追加前後で `.skip` の件数を突合する（不変条件7）。

```bash
# --- before（devDep 追加前 / origin/dev 相当のベースラインで取得しておく） ---
# 例: git stash や別 worktree、もしくは dev tip でカウントしてメモする
grep -rn "\.skip\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l

# describe.skip / it.skip / test.skip / .skipIf も含めた網羅カウント
grep -rnE "(describe|it|test)\.(skip|skipIf)\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l

# --- after（devDep 追加 + 修正後 / 本ブランチで取得） ---
grep -rn "\.skip\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l
grep -rnE "(describe|it|test)\.(skip|skipIf)\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l
```

判定:
- **after の件数 ≤ before の件数** であること（増加していたら、その差分は Vite 7 化 fail を握り潰した skip でないかを個別確認 → fail はコード/期待値修正で解消する方針へ戻す）。
- `--passWithNoTests` による「テストゼロ pass」は既存 script の設計であり skip 増加には数えない。

## 完了条件

- [ ] 「依存アップグレードにおけるテスト拡充の読み替え（(a)(b)(c)(d)）」が記載されている
- [ ] 回帰ガードテーブル（単一 vite 解決 / react subpath / optimizeDeps / D1 singleFork / deprecation ゼロ / esbuild 整合 / apps/web 非依存）が記載されている
- [ ] Vite 7 固有の回帰（jsx-dev-runtime 解決・optimizeDeps prebundle・d1 forks pool 健全）を守る補助コマンドが記載されている
- [ ] skip 件数の before/after 比較手順（grep コマンド）が記載されている
- [ ] 新規 spec ファイルを追加しない方針が明記されている（既存の網羅で担保）
- [ ] 各回帰観点が関連カテゴリ（V1/V2/V3/V4/V5/V7/V8）・不変条件へ紐付いている
