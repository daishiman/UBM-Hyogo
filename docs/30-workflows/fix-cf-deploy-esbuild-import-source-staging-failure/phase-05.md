# Phase 5: ローカル検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 名称 | ローカル検証 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | runtime_pending |
| 前 Phase | 4 (詳細実装手順) |
| 次 Phase | 6 (ユニットテスト影響評価) |

## 目的

第一候補 A の適用後、CI 失敗の再現エラーがローカルで解消することを確認する。
Phase 2 の採択ゲートをここで評価し、必要なら代替案 B/C へ切替判断を出す。

## 検証コマンド

### Step 1: 型・lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: PASS（CI と同じ品質ゲートが通る）。

### Step 2: `apps/api` build 相当（wrangler deploy --dry-run）

```bash
# 実 deploy を行わず bundle 生成のみ
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle
```

期待: `"import-source" is not a valid feature name` が出ない。bundle が `/tmp/api-bundle` に出力される。

> `--dry-run` フラグの wrangler 4.85.0 での正確なオプション名は `bash scripts/cf.sh deploy --help` で確認。
> `--outdir` のみで dry-run になる場合や `--dry-run` 単独で OK の場合がある。

### Step 3: `apps/web` OpenNext build

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

期待: OpenNext Cloudflare bundle 生成完了、または別 blocker で停止しても `"import-source"` エラーが出ない。

### Step 4: `scripts/cf.sh` esbuild path 確認

```bash
ls node_modules/wrangler/node_modules/@esbuild 2>/dev/null && echo "OK_WRANGLER_NESTED"
ls node_modules/esbuild/node_modules/@esbuild 2>/dev/null && echo "OK_HOISTED"
```

## 採択ゲート評価

```
Step 1-2 PASS かつ Step 3 で `"import-source"` エラーが消失?
  ├─ YES → 候補 A 確定 → Phase 6 へ
  └─ NO
       ├─ Step 2 失敗 (apps/api) → wrangler 内部互換ずれ → 候補 B (wrangler 4.92.0+) へ切替
       ├─ Step 3 で import-source 再発 → OpenNext esbuild 不整合 → 候補 B または C へ切替
       ├─ Step 3 で別 runtime blocker → 候補 A 維持、runtime_pending として Phase 11 へ記録
       └─ Step 1 失敗 → typecheck/lint の本質的問題 → 別タスク
```

候補 B/C に切替えた場合は本 Phase を最初から再実行する。

## 期待される副次効果

- `node_modules` 再ビルドにより esbuild platform binary が最新化。
- `ESBUILD_BINARY_PATH` が新 nested esbuild に解決される。

## 想定エラー一覧

| エラー | 原因 | 対応 |
| --- | --- | --- |
| `"import-source" is not a valid feature name` | override が古いまま | Phase 4 手順 1-2 をやり直す |
| `Cannot find module 'esbuild'` | lockfile 不整合 | `pnpm install --force` 再実行 |
| `ENOENT: ... @esbuild/<platform>/bin/esbuild` | fallback path 不一致 | Phase 4 手順 3 の追記を適用 |
| OpenNext 側の別 esbuild エラー | OpenNext と esbuild 0.27.x の不整合 | 候補 B/C へ切替 |

## 実行タスク

- [x] Step 1-2 を実行
- [x] Step 3 を実行し、`"import-source"` エラーが再発しないことを確認
- [ ] Step 4 の esbuild path 確認を必要時に追加実行
- [x] 結果を `outputs/phase-05/local-verification.md` に記録（PASS/FAIL + ログ要点）
- [x] 採択ゲート判定を記録

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/local-verification.md | Step 1-4 の結果・採択ゲート判定 |

## 完了条件

- [x] Step 1-3 の結果が記録されている
- [x] 採択ゲート判定（候補 A 確定 or 候補 B/C 切替）が明示されている

## 次 Phase

- 次: 6 (ユニットテスト影響評価)
- 引き継ぎ事項: 採用候補と nested esbuild path 実在の有無
- ブロック条件: Step 2 が FAIL、または Step 3 で `"import-source"` が再発したまま Phase 6 へ進まない

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
