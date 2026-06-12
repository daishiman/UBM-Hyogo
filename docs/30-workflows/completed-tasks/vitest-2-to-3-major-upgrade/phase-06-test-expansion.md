# Phase 6: Test Expansion（テスト拡充 / 回帰ガード）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-04 / phase-05 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | 新規機能テストは増やさず、**アップグレードの回帰ガード**（バージョン整合・D1 pool 設計・deprecation ゼロ）を継続確認できる状態にする |

## 本タスクでのテスト拡充の読み替え

通常の機能開発では「テスト拡充 = エッジケース・境界値・新規シナリオの追加」だが、本タスクは**依存ライブラリのメジャーアップグレード**であり、新しいプロダクト挙動を導入しない。新規 `*.spec.ts` を追加すると「既存テスト資産の維持」という目的から逸脱する（不変条件）。したがって本 Phase の拡充は次の 3 点に読み替える:

> **(a) バージョン整合の回帰ガード** — vitest と `@vitest/coverage-v8` が 3.2.6 系で一致し続けることを観測する。
> **(b) D1 pool 設計の回帰確認** — `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` が維持され、port exhaustion なく完走することを確認する。
> **(c) deprecation 警告ゼロの継続確認** — C4/C5/C8 の非推奨記法が混入していないことを確認する。

これらは「新規テストの追加」ではなく、**Phase 5 の GREEN 状態が将来も崩れないことを担保する観測手順**として確立する。新規 spec ファイルは作成しない。

## 回帰ガードテーブル

| 回帰観点 | 何を守るか | 確認手段 | 関連カテゴリ / AC |
| --- | --- | --- | --- |
| バージョン整合 | vitest と coverage-v8 の 3.2.6 完全一致（peer 要求） | `mise exec -- pnpm why vitest` / `pnpm why @vitest/coverage-v8` の解決バージョン突合 | C7 / AC-1 / AC-2 |
| vite 解決範囲 | vitest 3.2.6 が許す vite `5/6/7` 範囲内の解決 | `mise exec -- pnpm why vite`（範囲外なら peer 警告） | NFR-2 |
| D1 singleFork 動作 | `pool: forks`/`singleFork: true` 維持・port exhaustion 非再発 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api` が hang/EADDRINUSE なく完走 | C3 / AC-7 / NFR-4 |
| coverage shard 全 green | CI 5 shard（web / api-unit / api-d1 / packages / og）相当の green 維持 | 各 shard の `test:coverage` 実行が green | NFR-3 / AC-5 |
| deprecation 警告ゼロ | C4（deps.inline）/ C5（workspace）/ C8（第3引数オブジェクト）の非混入 | grep 静的検出 + vitest 実行ログの warn ゼロ | C4 / C5 / C8 / AC-6 |
| coverage 閾値維持 | C6（ignoreEmptyLines）実測ずれ範囲を超えて閾値が下がっていない | 閾値ゲートの green と「v2→v3 実測差分」記録 | C6 / 不変条件 8 |

> 上表は新規テストファイルではなく、Phase 7（カバレッジ確認）/ Phase 9（品質保証）/ CI（`coverage-guard.sh`）で繰り返し実行される「回帰観点」のチェックリストとして機能する。

## skip 件数が増えていないことの確認手順

アップグレードに伴い「fail を skip でごまかして緑にする」退行を防ぐため、bump 前後で `.skip` の件数を突合する（不変条件 7 / AC-8）。

```bash
# --- before（bump 前 / origin/dev 相当のベースラインで取得しておく） ---
# 例: git stash や別 worktree、もしくは dev tip でカウントしてメモする
grep -rn "\.skip\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l

# describe.skip / it.skip / test.skip / .skipIf も含めた網羅カウント
grep -rnE "(describe|it|test)\.(skip|skipIf)\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l

# --- after（bump + 修正後 / 本ブランチで取得） ---
grep -rn "\.skip\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l
grep -rnE "(describe|it|test)\.(skip|skipIf)\b" --include="*.spec.ts" --include="*.spec.tsx" . | wc -l
```

判定:
- **after の件数 ≤ before の件数** であること（増加していたら、その差分は v3 fail を握り潰した skip でないかを個別確認 → fail はコード/期待値修正で解消する方針へ戻す）。
- `--passWithNoTests` による「テストゼロ pass」は既存 script の設計であり skip 増加には数えない。

## 完了条件

- [ ] 「依存アップグレードにおけるテスト拡充の読み替え（(a)(b)(c)）」が記載されている
- [ ] 回帰ガードテーブル（バージョン整合 / vite 範囲 / D1 singleFork / shard green / 警告ゼロ / 閾値維持）が記載されている
- [ ] skip 件数の before/after 比較手順（grep コマンド）が記載されている
- [ ] 新規 spec ファイルを追加しない方針が明記されている
- [ ] 各回帰観点が関連カテゴリ（C3/C6/C7/C8）・AC へ紐付いている
