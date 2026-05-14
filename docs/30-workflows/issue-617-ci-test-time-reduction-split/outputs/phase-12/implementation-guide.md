# Implementation Guide — Issue #617 CI test time reduction split

## Part 1: 中学生レベル

### なぜ必要か

学校の給食で、全員が同じ列に並ぶと時間がかかります。ご飯の列、汁物の列、おかずの列に分ければ、同時に進められて待ち時間が短くなります。

このタスクも同じです。今の CI では、重い backend test、frontend test、packages test が同じ大きな流れで待たされています。役割ごとに列を分け、最後に結果を集めることで、待ち時間を減らします。

### 何を変えるか

- backend (apps/api) のテストを、D1 (小さなデータベース) を使う重いものと、それ以外の軽いものに分けます。
- frontend (apps/web) のテストを別の列で動かします。
- packages のテストも別の列で動かします。
- 最後に `coverage-gate` という同じ名前のチェック係が、4 列の結果を集めて 80% 以上ちゃんとテストできているかを確認します。

### 専門用語セルフチェック

| 用語 | 日常語での説明 |
| --- | --- |
| CI | 変更を本番に出す前に自動で行うチェック作業 |
| coverage (カバレッジ) | テストがコードのうちどれくらいの範囲を実際に動かして確認できたかの割合 |
| matrix (マトリクス) | 同じ作業を条件別 (今回は 4 種類) に並べて同時に動かす仕組み |
| D1 | Cloudflare が用意している小さなデータベース。テストごとにポート (通り道) を 1 つずつ使う |
| artifact (アーティファクト) | チェックの結果として後で見るために残しておくファイル |
| shard (シャード) | 1 つの大きな作業を分割した 1 つ分の小さな塊 |
| required status check | この緑になっていないと PR がマージできない、必須のチェック項目 |

## Part 2: 技術者レベル

### 背景

- `apps/api` の test は Miniflare D1 binding のセットアップを伴うため重い。並列化すると port exhaustion (#577) で `EADDRNOTAVAIL` が出るので、旧構成では `--maxWorkers=1 --minWorkers=1` で全 138 件を直列化していた。
- `apps/web` / `packages/*` も同じ単一 runner の `coverage-gate` job で逐次 `test:coverage` していたため、全体 wall-clock が圧迫されていた。

### やること (Scope)

1. root `vitest.config.ts` を unit 既定とし、D1 binding 利用 test は `exclude` 列挙で除外
2. `vitest.d1.config.ts` を新設し、`pool: forks` / `singleFork: true` で port を 1 つだけ使う構成
3. `apps/api/package.json` を `test:coverage:unit` / `test:coverage:d1` / `test:coverage` (両者 + merge) に分割
4. `apps/web/package.json` に `test:coverage:web` alias を追加 (既存 `test:coverage` は後方互換維持)
5. `scripts/coverage-merge.mjs` (新規) で Istanbul `coverage-final.json` を merge し `coverage-summary.json` を再計算
6. `scripts/coverage-guard.sh` に `--group web|api-unit|api-d1|packages` を追加。group mode は shard の coverage artifact 生成確認だけを行い、80% 閾値判定は集約 `--no-run` モードだけが担当する。集約 `--no-run` は unit+d1 を必要に応じて auto-merge
7. `.github/workflows/ci.yml` に `coverage-gate-shard` matrix (4 並列) を導入し、後段 `coverage-gate` で artifact を download → merge → `--no-run` 判定。**required status check 名 `coverage-gate` を維持**

### やらないこと

- `apps/api` / `apps/web` の実装ロジック変更
- D1 schema / migration 変更
- coverage 閾値変更 (80% 維持)
- 既存 test の assertion 内容変更
- Vitest version up (`^2.1.9` 維持)
- E2E (Playwright) workflow 変更
- branch protection mutation (`coverage-gate` 名維持のため不要)

### 変更ファイル一覧

| Path | 種別 | 内容 |
| --- | --- | --- |
| `vitest.config.ts` | edit | D1 依存 16 個の glob/path を `test.exclude` に追加 |
| `vitest.d1.config.ts` | new | D1 専用 config (forks/singleFork)、`include` を D1 16 glob に限定、coverage は `apps/api/coverage/d1` |
| `apps/api/package.json` | edit | `test:coverage:unit` / `test:coverage:d1` / `test:coverage` (両者 + root cwd で `coverage-merge.mjs`)。unit shard は observed transform timeout 回避のため `--maxWorkers=1 --minWorkers=1` を付与 |
| `apps/web/package.json` | edit | `test:coverage:web` alias 追加 |
| `scripts/coverage-merge.mjs` | new | Istanbul `coverage-final.json` を s/f/b 加算で merge し summary 再生成 |
| `scripts/__tests__/coverage-merge.test.mjs` | new | node --test 3 case (sum / preserve only-one-side / summary 再計算) |
| `scripts/__tests__/__fixtures__/coverage-{a,b}.json` | new | merge test fixture |
| `scripts/coverage-guard.sh` | edit | `--group <web\|api-unit\|api-d1\|packages>` 追加。group mode は artifact-only、`--no-run` で unit+d1 auto-merge fallback + threshold 判定 |
| `.github/workflows/ci.yml` | edit | `coverage-gate-shard` matrix (4 並列) + `if: always()` 集約 `coverage-gate` (download / merge / `--no-run` / shard fail-closed)。required context 名 `coverage-gate` を維持 |
| `docs/30-workflows/issue-617-ci-test-time-reduction-split/outputs/phase-04/classification.md` | edit | 実測 classification (unit=44 / d1=94 / disjoint 確認済) |
| `docs/30-workflows/issue-617-ci-test-time-reduction-split/outputs/phase-11/{main,before-after}.md` | edit | ローカル実行 evidence + 残作業 (CI matrix wall-clock は PR push 後計測) |

### 動作確認 (ローカル — 実行済)

```bash
mise exec -- pnpm install --frozen-lockfile          # 0 exit
mise exec -- pnpm typecheck                          # 0 exit
mise exec -- pnpm lint                               # 0 exit
mise exec -- node --test scripts/__tests__/coverage-merge.test.mjs   # 3/3 pass
mise exec -- pnpm exec vitest list --config=vitest.d1.config.ts      # 94 files
mise exec -- pnpm exec vitest list --config=vitest.config.ts apps/api # 44 files (disjoint)
bash scripts/coverage-guard.sh --group invalid                       # exit 2 (CLI guard)
bash scripts/coverage-guard.sh --group api-unit --no-run             # MISSING (期待動作)
bash scripts/coverage-guard.sh --no-run                              # MISSING (期待動作)
```

詳細: `outputs/phase-11/main.md` 参照。

### 動作確認 (CI — PR push 後)

- `coverage-gate-shard (web|api-unit|api-d1|packages)` 4 並列 success
- aggregate `coverage-gate` success
- `coverage-summary.json` (merge 後) で全 4 metric ≥ 80%
- shard log に `EADDRNOTAVAIL` / `EADDRINUSE` が出ない

### before/after evidence

`outputs/phase-11/before-after.md` に記録。ローカル apps/api unit shard で 1 件 pre-existing flake を確認 (Vite SSR transform timeout)、別タスク化候補。

### Rollback

revert PR で以下を元に戻す:

- `vitest.d1.config.ts` 削除
- `vitest.config.ts` の `test.exclude` から D1 path 群を削除
- `apps/api/package.json` の `test:coverage` を旧 1 行 (`--maxWorkers=1 --minWorkers=1`) に戻し、`unit` / `d1` script を削除
- `apps/web/package.json` の `test:coverage:web` alias を削除
- `.github/workflows/ci.yml` を旧 single `coverage-gate` 構成に戻す

`scripts/coverage-merge.mjs` / `scripts/coverage-guard.sh --group` は残置しても呼ばなければ no-op。

### Branch Protection

`coverage-gate` という最終 required status check 名を維持するため、branch protection mutation **不要**。

将来 context 名を変更する場合のみ、dev / main 個別 GET snapshot、PATCH payload、user approval marker、after GET snapshot を Phase 13 evidence に追加してから実行する。

Refs #617
