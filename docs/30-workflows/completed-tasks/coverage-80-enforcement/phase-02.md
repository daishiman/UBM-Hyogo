# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-29 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した「全 package 一律 80%」を、`vitest.config.ts`、`scripts/coverage-guard.sh`、GitHub Actions、lefthook、branch protection の接続設計へ落とし込む。鶏卵問題を避けるため、PR① soft gate、PR② テスト追加、PR③ hard gate の3段階で導入する。

## トポロジ

```
[ developer local ]
   │  pnpm test:coverage
   ▼
[ vitest --coverage (v8 provider) ]
   │  → coverage/coverage-summary.json (per package)
   ▼
[ scripts/coverage-guard.sh ]
   │  ├─ jq で package 別 metrics 集計
   │  ├─ 全 package で 80% を超えるか判定
   │  └─ 未達 → stderr に top10 + テスト雛形 → exit 1
   ▼
[ lefthook pre-push ]   ←  PR③ で導入
   │  push 不能（80% 未達時）
   ▼
[ git push ]
   ▼
[ GitHub Actions: coverage-gate job ]
   │  PR① continue-on-error: true (soft)
   │  PR③ continue-on-error 削除 (hard, required)
   ▼
[ branch protection: required_status_checks.contexts ]
   │  PR③ で coverage-gate を contexts に登録（UT-GOV-001 / UT-GOV-004 連携）
```

## State Ownership

| 状態 | 正本 | 同期先 |
| --- | --- | --- |
| 閾値（80%） | `vitest.config.ts` の `coverage.thresholds` | `aiworkflow-requirements/quality-requirements-advanced.md`（Phase 12 で同期） |
| coverage 計測結果 | `coverage/coverage-summary.json`（vitest 出力） | `coverage-guard.sh` がメモリ内集計、CI artifact として upload |
| CI gate 状態 | `.github/workflows/ci.yml` の `coverage-gate.continue-on-error` | branch protection `required_status_checks.contexts`（UT-GOV-001 経由） |
| ローカル hook 状態 | `lefthook.yml` の `pre-push.commands` | 開発者ローカル（`pnpm install` で auto install） |

## 実行タスク

1. coverage-gate の全体トポロジを定義する。
2. `coverage-guard.sh` の入力、処理、stderr、exit code を定義する。
3. `vitest.config.ts` の coverage provider / threshold / reporter / exclude を定義する。
4. CI soft gate と hard gate の切替手順を定義する。
5. lefthook pre-push の導入境界と bypass 時の CI 再防御を定義する。
6. branch protection contexts 登録を UT-GOV-001 / UT-GOV-004 と接続する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/coverage-80-enforcement/phase-01.md` | 要件・AC・依存境界 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | coverage 閾値の正本更新対象 |
| 必須 | `.claude/skills/task-specification-creator/references/coverage-standards.md` | coverage 検証テンプレ更新対象 |
| 必須 | `vitest.config.ts` | coverage 設定追加対象 |
| 必須 | `.github/workflows/ci.yml` | `coverage-gate` job 追加対象 |
| 必須 | `lefthook.yml` | pre-push hook 追加対象 |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC × test type マトリクスへ coverage-guard / CI / lefthook の happy path を渡す |
| Phase 6 | fail path と復旧手順へ E1〜E13 の異常系入力を渡す |
| Phase 11 | baseline 計測と manual smoke のコマンド系列へ設計値を渡す |
| Phase 12 | aiworkflow-requirements / coverage-standards 同期差分へ正本更新方針を渡す |

## scripts/coverage-guard.sh I/O 仕様

### 入力

- 引数: なし（オプションは flag のみ）
  - `--changed`: `git diff origin/main...HEAD` で変更があった package のみ実行（pre-push 高速化用、デフォルト OFF）
  - `--package <name>`: 単一 package のみ計測（CI matrix 用）
  - `--threshold <num>`: 閾値上書き（デフォルト 80）
- 環境変数: `CI=true` の場合は終了コードを厳密に exit 1、ローカルでは詳細出力

### 処理

1. `pnpm -r --workspace-concurrency=1 test:coverage` 実行（`--changed` 指定時は変更 package のみ）
2. 各 package の `coverage/coverage-summary.json` を `jq` で集計
3. package 別に lines / branches / functions / statements の `pct` を取得
4. すべて閾値以上か判定
5. 未達 package があれば、`coverage/coverage-final.json` から file 別カバレッジを読み、不足ファイル top10（lines pct 昇順）を抽出
6. 各不足ファイルに対し `{src}/{file}.test.ts` のテスト雛形パスを生成

### 出力（stderr）

未達時のフォーマット例:

```
[coverage-guard] FAIL: packages/shared lines=72.4% (< 80%)
  Top10 unsatisfied files (sorted by lines%):
    1.  packages/shared/src/utils/sanitize.ts          lines=43.1%   suggested test: packages/shared/src/utils/sanitize.test.ts
    2.  packages/shared/src/lib/dateRange.ts            lines=51.0%   suggested test: packages/shared/src/lib/dateRange.test.ts
    ...
[coverage-guard] FAIL: apps/web functions=68.2% (< 80%)
  Top10 unsatisfied files:
    ...
[coverage-guard] HINT: 上記の suggested test ファイルを作成し、`pnpm test:coverage` を再実行してください。
[coverage-guard] HINT: テスト不能領域は vitest.config.ts の coverage.exclude に追加してください（要レビュー）。
```

### Exit Code

- `0`: 全 package で全 metrics 80% 以上
- `1`: いずれかの package で未達 / coverage-summary.json 欠損
- `2`: 環境エラー（jq 未インストール / vitest 実行失敗）

### OS / 依存前提

- POSIX shell + jq 1.6+ + Node 24（mise 経由）
- macOS / Linux（Windows は WSL 経由のみサポート）

## vitest.config.ts 更新仕様

```ts
// 追加する coverage セクション（既存 test セクションは保持）
coverage: {
  provider: 'v8',
  reporter: ['text', 'json-summary', 'lcov', 'html'],
  reportsDirectory: './coverage',
  thresholds: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80,
  },
  include: [
    'apps/**/src/**/*.{ts,tsx}',
    'packages/**/src/**/*.{ts,tsx}',
  ],
  exclude: [
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/node_modules/**',
    '**/.next/**',
    '**/.open-next/**',
    '**/.wrangler/**',
    'apps/web/src/app/**/page.tsx',          // Next.js page は E2E 範囲（Phase 11 で再評価）
    'apps/web/src/app/**/layout.tsx',
    'apps/web/src/app/**/loading.tsx',
    'apps/web/src/app/**/error.tsx',
    'apps/web/src/app/**/not-found.tsx',
    'apps/web/next.config.*',
    'apps/web/middleware.ts',                 // Edge runtime
    '**/wrangler.toml',
    '**/*.d.ts',
    '**/*.config.{ts,js,mjs,cjs}',
    '**/dist/**',
    '**/build/**',
  ],
  perFile: false,                              // package 単位閾値（file 単位は coverage-guard.sh が補完）
}
```

> **monorepo 集計戦略**: 単一 root config + per-package テスト実行（`pnpm -r test:coverage`）で各 package 配下に独立 `coverage/` を生成。`coverage-guard.sh` が `apps/*/coverage/coverage-summary.json` と `packages/*/coverage/coverage-summary.json` を個別に読む。vitest workspace 機能は将来移行候補（Phase 12 unassigned-task）。

## 各 package script 統一仕様

各 `package.json` に以下を追加:

```json
{
  "scripts": {
    "test": "vitest run --root=../.. --config=../../vitest.config.ts <pkg-rel-path>",
    "test:coverage": "vitest run --coverage --root=../.. --config=../../vitest.config.ts <pkg-rel-path>"
  }
}
```

ルート `package.json` には:

```json
{
  "scripts": {
    "test:coverage": "bash scripts/with-env.sh vitest run --coverage",
    "coverage:guard": "bash scripts/coverage-guard.sh"
  }
}
```

## CI workflow 更新仕様

`.github/workflows/ci.yml` に追加する `coverage-gate` job:

```yaml
  coverage-gate:
    runs-on: ubuntu-latest
    needs: [setup]
    continue-on-error: true   # PR① では true / PR③ で削除
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: mise exec -- bash scripts/coverage-guard.sh
        env:
          CI: 'true'
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: |
            apps/*/coverage/
            packages/*/coverage/
            packages/integrations/*/coverage/
      - name: Upload to Codecov (optional)
        if: env.CODECOV_TOKEN != ''
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false
```

### soft → hard 切替（PR③）

PR③ で行う変更:
1. `continue-on-error: true` を削除
2. branch protection の `required_status_checks.contexts` に `coverage-gate` を追加（UT-GOV-001 / UT-GOV-004 経由）
3. `lefthook.yml` pre-push に統合

## lefthook.yml 更新仕様（PR③）

```yaml
pre-push:
  parallel: false   # coverage は重いので順次
  commands:
    coverage-guard:
      run: bash scripts/coverage-guard.sh --changed
      stage_fixed: false
      skip:
        - merge
        - rebase
```

> **抜け道なし方針**: `--no-verify` での bypass は CI hard gate でも block されるため事実上不可能。緊急時のみ `LEFTHOOK=0 git push` でローカル skip 可能だが、CI で同等 check が走る。

## 3 段階 PR 段取り

| PR | スコープ | CI 挙動 | merge 可否 |
| --- | --- | --- | --- |
| PR① | T0 baseline + T1 vitest config + T2 coverage-guard.sh + T3 package script + T4 CI soft gate | `coverage-gate` job 追加（continue-on-error: true）→ warning のみ | 既存 CI（typecheck/lint）が green なら merge 可 |
| PR② | T5 package 別 80% 達成テスト追加（package 数だけ sub PR に分割可） | warning が消えるまでテスト追加 | 各 sub PR は warning が green になった時点で merge |
| PR③ | T6 lefthook 統合 + T7 hard gate 化 + T8 正本同期 | `continue-on-error` 削除、required_status_checks.contexts に登録 | 全 package が 80% を満たしている前提で hard gate 化 |

## ファイル変更計画

| 操作 | パス | PR |
| --- | --- | --- |
| 新規 | scripts/coverage-guard.sh | PR① |
| 編集 | vitest.config.ts | PR① |
| 編集 | package.json (root) | PR① |
| 編集 | apps/web/package.json | PR① |
| 編集 | apps/api/package.json | PR① |
| 編集 | packages/shared/package.json | PR① |
| 編集 | packages/integrations/package.json | PR① |
| 編集 | packages/integrations/google/package.json | PR① |
| 編集 | .github/workflows/ci.yml | PR① (soft) → PR③ (hard) |
| 新規 | apps/web/src/**/*.test.ts（不足分） | PR② (sub) |
| 新規 | packages/*/src/**/*.test.ts（不足分） | PR② (sub) |
| 編集 | lefthook.yml | PR③ |
| 編集 | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | PR③ |
| 編集 | .claude/skills/task-specification-creator/references/coverage-standards.md | PR③ |
| 編集 | codecov.yml（任意・既存維持） | PR③（同期確認のみ） |

## リスクと緩和策

| # | リスク | 緩和策 | 紐付き Phase |
| --- | --- | --- | --- |
| 1 | 鶏卵問題（仕組み導入 PR が落ちる） | PR① で `continue-on-error: true`、PR③ で削除 | Phase 5 / 13 |
| 2 | monorepo 集計困難 | per-package coverage/ 出力 + coverage-guard.sh で集約 | Phase 6 異常系 |
| 3 | Edge runtime / OpenNext exclude 範囲不足 | exclude リストを Phase 11 baseline で再評価 | Phase 11 |
| 4 | OS 依存（jq / bash） | POSIX + jq 1.6+ 前提を README / runbook に明記 | Phase 12 |
| 5 | soft→hard 切替忘却 | Phase 13 PR③ runbook + Phase 12 unassigned-task | Phase 12 / 13 |
| 6 | codecov.yml 二重正本 drift | Phase 12 で同期 | Phase 12 |
| 7 | pre-push 遅延 | `--changed` 限定モード + parallel 検討 | Phase 2 / 11 |

## 4 条件評価（再確認）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | CI + ローカル二重 gate で 80% 未満 merge を構造 block |
| 実現性 | PASS | vitest v8 / lefthook / GHA すべて既存技術 |
| 整合性 | PASS | 不変条件 #5 / CLAUDE.md branch 戦略と整合 |
| 運用性 | PASS | coverage-guard.sh stderr 出力で auto-loop 成立、3 段階 PR で鶏卵回避 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計主成果物 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] トポロジ図に developer / vitest / coverage-guard / lefthook / CI / branch protection が含まれる
- [x] coverage-guard.sh の I/O / exit code / 出力フォーマットが仕様化
- [x] vitest.config.ts の coverage セクション全フィールドが確定
- [x] 各 package の test / test:coverage script が統一フォーマットで規定
- [x] CI coverage-gate job の YAML スケルトンが確定（soft / hard 切替）
- [x] lefthook pre-push 統合の YAML スケルトンが確定
- [x] 3 段階 PR 段取り（PR① / PR② / PR③）がファイル変更計画と一致
- [x] 苦戦想定 7 件すべてに緩和策と Phase 紐付き
- [x] 4 条件評価 全 PASS

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - 4 リスク同時封じ + 鶏卵問題の 3 段階 PR 解
  - coverage-guard.sh I/O 完全仕様
  - vitest config 完全仕様
  - 代替案比較対象: 一律 80% / package 別閾値 / monorepo 集約 / Codecov 単独 / Turborepo cache
- ブロック条件:
  - exclude リストが Edge runtime / OpenNext を網羅していない
  - 3 段階 PR の merge 前提条件が曖昧
