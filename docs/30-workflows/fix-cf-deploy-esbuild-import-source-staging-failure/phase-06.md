# Phase 6: ユニットテスト影響評価

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 名称 | ユニットテスト影響評価 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | runtime_pending |
| 前 Phase | 5 (ローカル検証) |
| 次 Phase | 7 (統合テスト方針) |

## 目的

vitest および esbuild に依存する既存テスト群が、esbuild 0.27.x への bump で regression を起こさないことを確認する。

## 影響範囲

| 領域 | 利用 esbuild | 影響有無 |
| --- | --- | --- |
| `vitest` (`^2.0.0`) | 内部で esbuild を transformer として利用 | 中: 0.27.x の trans piler 挙動差を要確認 |
| `tsx` (`^4.19.0`) | esbuild ベース | 中: `scripts/*.ts` 実行系 |
| `@vitest/coverage-v8` | esbuild 経由 transform | 低 |
| `apps/api` (wrangler bundle) | wrangler の esbuild | 高（本タスクの直接対象） |
| `apps/web` (OpenNext) | OpenNext + 内部 esbuild | 高（本タスクの直接対象） |

## 検証コマンド

### Step 1: vitest スモーク実行

```bash
mise exec -- pnpm test 2>&1 | tee /tmp/vitest-smoke.log
```

> 既存の `apps/api` 統合テスト群が `EADDRNOTAVAIL` 等のローカル非依存エラーで FAIL するパターンは
> 既知（過去 task の Phase 12 DoD でも記録されている）。esbuild bump 起因の新規 FAIL を区別する。

### Step 2: tsx スクリプト実行確認

```bash
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
```

期待: 既存挙動と同じ結果（コードに変更がない以上、esbuild 差し替えで結果が変わらないこと）。

### Step 3: regression 判定

| 結果 | 判定 |
| --- | --- |
| Step 1 のうち、bump 前後で同じ test が同じ理由で FAIL | esbuild bump とは無関係（既知 FAIL） |
| bump 後に新規 FAIL が出現 | esbuild bump 起因の regression 疑い → ログを Phase 6 成果物に記録し、Phase 2 ゲートに戻る |
| Step 2 が新たに FAIL | tsx 互換問題 → 同上 |

## 想定リスク

- esbuild 0.27.x で `tsconfig` の `target` / `module` 解釈が変わるケース（過去事例: `useDefineForClassFields` のデフォルト変更）。
- `vitest` 2.x が esbuild 0.27.x と最新 peer 整合性を持つか要確認（vitest 3.x への bump は本タスク out of scope）。

## 実行タスク

- [ ] Step 1 を実行し、bump 前後の FAIL 集合を比較
- [ ] Step 2 を実行し、tsx スクリプトの再現性を確認
- [x] dependency/build tooling に影響範囲が集中することを判定
- [x] `outputs/phase-06/test-impact.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/test-impact.md | vitest / tsx の影響評価結果 |

## 完了条件

- [ ] vitest スモーク結果が記録されている
- [x] regression 判定境界が明示されている

## 次 Phase

- 次: 7 (統合テスト方針)
- 引き継ぎ事項: regression なし → 候補 A 維持。あり → Phase 2 ゲートに戻る
- ブロック条件: regression が解消されないまま Phase 7 へ進まない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
