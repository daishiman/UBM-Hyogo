# Implementation Guide — coverage-80-enforcement

本ガイドは 2 部構成。
**Part 1** は中学生でも分かる例え話レベル。
**Part 2** は開発者向けに vitest config / coverage-guard.sh / CI / lefthook / 3 段階 PR の技術詳細を網羅する。

---

## Part 1（中学生レベル / 例え話）

### Q1. カバレッジって何？

> **答え**: テストが「コードのうち何%を試したか」を表す通信簿。

例え話: 100 個の問題が載った問題集を解くとき、80 個解いたら「80% 終わった」と言う。プログラムも同じで、書いたコードのうち 80 行中 64 行をテストで通したら **lines coverage = 80%**。

実は coverage は 4 種類ある:

| 名前 | 何を測る？ | 例え話 |
| --- | --- | --- |
| lines | 行を何%通ったか | 問題集の何%解いたか |
| branches | if/else の分岐を何%通ったか | 「Yes / No」両方答えた問題が何%か |
| functions | 関数を何%呼び出したか | 章ごとに少なくとも 1 問解いたか |
| statements | 文を何%実行したか | lines とほぼ同じ（より細かい）|

### Q2. なぜ 80%？

- **100% は神話**: ライブラリ内部や Edge runtime（Cloudflare Workers の特殊な場所）はテストできない領域がある。100% にしようとすると無理が出る
- **60% は穴だらけ**: 「半分しかテストしてない」状態で本番に出すと、未テストの部分でバグが出やすい
- **80% は現実解**: 重要な分岐は通っているが、過剰でない。世界中のチームが採用している通り相場

### Q3. auto-loop ってなに？

> **答え**: 「テスト実行 → 警告 → テスト追加 → 再実行」をぐるぐる回す仕組み。

```
       ┌──────────────────────────────────┐
       ▼                                  │
[ pnpm test:coverage を実行 ]               │
       │                                  │
       ▼                                  │
[ coverage-guard.sh が判定 ]                │
       │                                  │
   ┌───┴───┐                               │
   │ 80%? │                                │
   └───┬───┘                               │
   YES │  NO                               │
       │   └─→ stderr に                   │
       │      ・足りないファイル top10        │
       │      ・追加すべきテストファイル名     │
       │      を表示                        │
       │              │                    │
       │              ▼                    │
       │      [ 開発者がテストを書く ]        │
       │              │                    │
       │              └────────────────────┘
       ▼
   [ push 成功 ]
```

このループを「人間がエラーメッセージだけ見ながらテストを書き足し続ける」状態にできるのが狙い。次に何を書けばいいか機械が教えてくれるので、迷わない。

### 専門用語の言い換え表

| 用語 | 日常語への言い換え |
| --- | --- |
| threshold | 合格ライン（80%） |
| lines | 何行通ったか |
| branches | if/else の枝分かれを何種類通ったか |
| functions | 関数を何個呼んだか |
| statements | 文を何個動かしたか |
| pre-push hook | git push する前に自動で走るチェック係 |
| soft gate | 「警告だけ。落とさない」優しい門番 |
| hard gate | 「未達なら通さない」厳しい門番 |
| Codecov | カバレッジを見える化してくれる外部サービス |
| lefthook | ローカルの git 操作前後に自動でコマンドを走らせる仕組み |
| vitest | JavaScript / TypeScript のテストツール |
| monorepo | 複数のアプリ（apps/web / apps/api / packages/...）を 1 つのリポジトリにまとめている形 |

### なぜ 3 段階で導入するの？

> **「鶏卵問題」を避けるため**

仕組みを入れた最初の PR で「80% 未達なら落とす」を有効にすると、その PR 自体が落ちて永遠にマージできない。
そこで:

- **PR①「準備の段」**: 仕組みは入れるけど門番は「警告だけ」。マージ可
- **PR②「テストを書き足す段」**: package ごとに 80% を達成。複数の小 PR に分けて少しずつ
- **PR③「門番を厳しくする段」**: 全 package が 80% に達したら、門番を「未達なら落とす」に切替

---

## Part 2（開発者向け技術詳細）

### vitest config（プロジェクトルート `vitest.config.ts`）

```ts
// 既存 test セクションは保持。coverage セクションを追加
coverage: {
  provider: 'v8',
  reporter: ['text', 'json-summary', 'lcov', 'html'],
  reportsDirectory: './coverage',
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
    'apps/web/src/app/**/page.tsx',
    'apps/web/src/app/**/layout.tsx',
    'apps/web/src/app/**/loading.tsx',
    'apps/web/src/app/**/error.tsx',
    'apps/web/src/app/**/not-found.tsx',
    'apps/web/next.config.*',
    'apps/web/middleware.ts',
    '**/wrangler.toml',
    '**/*.d.ts',
    '**/*.config.{ts,js,mjs,cjs}',
    '**/dist/**',
    '**/build/**',
  ],
}
```

> Vitest は coverage 計測を担当し、80% の閾値判定は coverage-guard.sh が package 単位で実施する。file 単位の不足検出は `coverage-final.json` から lines pct 昇順 top10 を取る。

### scripts/coverage-guard.sh の関数シグネチャ想定

POSIX shell + jq 1.6+ を前提とする。

```text
parse_args(argv) -> { changed: bool, package: string|null, threshold: number=80 }
  --changed / --package <name> / --threshold <num> をパースし、
  CI=true 環境では詳細出力を抑制。

collect_summary(packages: list<path>) -> map<pkg, summary_json>
  apps/*/coverage/coverage-summary.json と
  packages/*/coverage/coverage-summary.json を再帰収集。
  欠損時は exit 1（部分集計欠落）。

aggregate_pkg_pct(summary_json) -> { lines, branches, functions, statements } each in pct
  jq で .total.{metric}.pct を抽出。

format_top10_failure(pkg, coverage_final_json, threshold) -> string
  lines pct 昇順で 10 ファイルを取り、人間可読のテーブル文字列を作る。

emit_test_template_paths(failed_files) -> list<string>
  src/**/foo.ts -> src/**/foo.test.ts のパス変換。
  既存 .test.ts が存在する場合はサフィックスを変えない（.spec.ts 重複を避ける）。

main()
  1. parse_args
  2. pnpm -r --workspace-concurrency=1 test:coverage を実行（changed 指定時は変更 pkg のみ）
  3. collect_summary -> aggregate_pkg_pct
  4. 全 pkg / 全 metric が threshold 以上なら exit 0
  5. 未達 pkg があれば format_top10_failure を stderr 出力 -> exit 1
  6. 環境エラー（jq 未導入 / vitest 失敗）時 exit 2
```

### Exit code 表

| code | 意味 | 発生条件 |
| --- | --- | --- |
| 0 | PASS | 全 pkg / 全 metric ≥ 80% |
| 1 | FAIL | いずれかの pkg / metric が 80% 未満 / coverage-summary.json 欠損 |
| 2 | ENV ERROR | jq 未インストール / vitest 実行失敗 / pnpm エラー |

### stderr 出力フォーマット例（80% 未達時）

```
[coverage-guard] FAIL: packages/shared lines=72.4% (< 80%)
  Top10 unsatisfied files (sorted by lines%):
    1.  packages/shared/src/utils/sanitize.ts          lines=43.1%   suggested test: packages/shared/src/utils/sanitize.test.ts
    2.  packages/shared/src/lib/dateRange.ts            lines=51.0%   suggested test: packages/shared/src/lib/dateRange.test.ts
    ...
[coverage-guard] FAIL: apps/web functions=68.2% (< 80%)
  Top10 unsatisfied files:
    ...
[coverage-guard] HINT: 上記の suggested test を作成し、`pnpm test:coverage` を再実行してください。
[coverage-guard] HINT: テスト不能領域は vitest.config.ts coverage.exclude に追加してください（要レビュー）。
```

### CI YAML（`.github/workflows/ci.yml`）

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
```

soft → hard 切替（PR③）:

1. `continue-on-error: true` 行を削除
2. branch protection の `required_status_checks.contexts` に `coverage-gate` を追加（UT-GOV-001 / UT-GOV-004 連携、本タスクでは仕様記述のみ）
3. lefthook 統合 commit を同 PR に同梱

### lefthook YAML（PR③）

```yaml
pre-push:
  parallel: false
  commands:
    coverage-guard:
      run: bash scripts/coverage-guard.sh --changed
      stage_fixed: false
      skip:
        - merge
        - rebase
```

> 緊急時のみ `LEFTHOOK=0 git push` でローカル skip 可能だが、CI hard gate でも block されるので事実上抜け道なし。

### 3 段階 PR 段取り（commit / branch / merge コマンド例）

#### PR①: soft gate + tooling 投入

```bash
# branch
git switch -c feat/coverage-80-pr1-soft-gate dev

# 変更ファイル（明示 add）
git add scripts/coverage-guard.sh \
        vitest.config.ts \
        package.json \
        apps/web/package.json \
        apps/api/package.json \
        packages/shared/package.json \
        packages/integrations/package.json \
        packages/integrations/google/package.json \
        .github/workflows/ci.yml

git commit -m "feat(coverage): add coverage-guard.sh + vitest coverage config + CI soft gate (PR1/3)"
git push -u origin feat/coverage-80-pr1-soft-gate

# PR 作成（base=dev）
gh pr create --base dev --title "feat(coverage): introduce 80% coverage tooling (soft gate, PR1/3)" --body "$(cat outputs/phase-13/pr1-runbook.md)"
```

期待: `coverage-gate` job は warning のみ。typecheck/lint が green なら merge 可。

#### PR②: package 別 80% 達成テスト追加（複数 sub PR 想定）

```bash
# 例: packages/shared 用 sub PR
git switch -c feat/coverage-80-pr2-shared dev
git add packages/shared/src/**/*.test.ts
git commit -m "test(shared): add unit tests to reach 80% coverage (PR2/3 - shared)"
git push -u origin feat/coverage-80-pr2-shared
gh pr create --base dev --title "test(shared): coverage 80% (PR2/3 - shared)"

# apps/web 用 sub PR、packages/integrations 用 sub PR ... と続ける
```

merge 順序は package の独立性順（依存少ない packages/shared → packages/integrations* → apps/api → apps/web）が安全。各 sub PR は coverage-gate が green になった時点で merge 可。

#### PR③: hard gate 化 + lefthook 統合 + 正本同期 + branch protection contexts 登録

```bash
git switch -c feat/coverage-80-pr3-hard-gate dev

# 変更
# - .github/workflows/ci.yml: continue-on-error 削除
# - lefthook.yml: pre-push に coverage-guard 追加
# - .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md: 80% 一律へ更新
# - .claude/skills/task-specification-creator/references/coverage-standards.md: coverage-guard.sh 参照追記
# - Codecov: 現時点では repo に codecov.yml がないため任意導入。必要なら別タスク化

git add .github/workflows/ci.yml \
        lefthook.yml \
        .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md \
        .claude/skills/task-specification-creator/references/coverage-standards.md \
        pnpm-lock.yaml

git commit -m "feat(coverage): switch coverage-gate to hard + lefthook + sync skill canon (PR3/3)"
git push -u origin feat/coverage-80-pr3-hard-gate

gh pr create --base dev --title "feat(coverage): hard gate + lefthook + canon sync (PR3/3)"

# PR③ merge 後（user 二重承認後）の別オペレーション:
# - branch protection の required_status_checks.contexts に coverage-gate を登録（UT-GOV-001 連携）
# - mise exec -- pnpm indexes:rebuild（aiworkflow-requirements indexes 再生成）
```

> **本タスクでは PR③ の実 merge / branch protection PUT / `pnpm indexes:rebuild` の実走は行わない。Phase 13 user 承認後の別オペレーションで実施する。**

### rollback 経路

| ケース | 対応 |
| --- | --- |
| PR① の coverage-guard.sh にバグ | revert PR を出して PR① を巻き戻す（warning のみなので影響範囲は限定） |
| PR② の sub PR でテスト誤検出 | 該当 sub PR を revert / 再 commit |
| PR③ で hard gate 化後に大量 PR 詰まり | branch protection から `coverage-gate` contexts を一時的に外す（UT-GOV-001 経由）→ 原因 fix → 再登録 |
| lefthook で push 詰み | `LEFTHOOK=0 git push`（CI で同等 check が走るので抜け道にはならない）|

### Part 2 で扱わない事項

- Cloudflare 系の外部シークレット注入形式（本タスクと無関係）
- `scripts/cf.sh`（Cloudflare CLI ラッパー）の使用
- E2E（Playwright）/ Turborepo / vitest workspace 移行（unassigned-task-detection の U-1〜U-3 で別タスク化）
