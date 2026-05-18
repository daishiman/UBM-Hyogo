# implementation-guide — fix-ci-cache-and-cf-token-pr795

task-01 (shell-lint cache fix) と task-02 (CF API token staging secret fix) を同一 PR に同梱した実装ガイド。

---

## Part 1 — 中学生レベルの概念説明

### このタスクは何をしたか

GitHub Actions という「コードを保存するたびに自動でテストやデプロイをやってくれるロボット工場」で、2 種類のロボットが止まっていたので両方修理した。

**ロボット A: シェルスクリプト検査ロボット (`workflow-shell-lint`)**

シェルスクリプトの文法だけをチェックする軽量ロボット。本来は重い部品 (npm パッケージ) をダウンロードしなくていいのに、「キャッシュ機能だけは動かそう」とすると、キャッシュすべき部品が無いと怒って警告を出していた。

→ 修理方針: 「キャッシュを使うかどうか」をロボットごとに選べるスイッチを追加し、このロボットだけスイッチを OFF にした。

**ロボット B: ステージング自動デプロイロボット (`deploy-staging`)**

Cloudflare というサーバーに自動でアップロードするロボット。アップロード前に「Cloudflare に入るためのパスワード」を渡す必要がある。今までは「窓口で手渡し」(YAML の `with.apiToken`) だけを使っていたが、窓口担当 (GitHub Secret) がパスワードを忘れている (登録されていない) と止まっていた。

→ 修理方針: 同じ正しいパスワードを `with.apiToken` と step-level `env.CLOUDFLARE_API_TOKEN` の両方に渡し、`wrangler-action` と内部 `wrangler` のどちらの読み取り口でも同じ値を見られるようにする。ただしこれは別 secret による独立 fallback ではないため、GitHub environment secret の登録・存在確認は必須の外部ゲートとして残る。

### なぜこれが大事か

両方のロボットが止まっていると、新しいコードを書いても「本当に動くか」が自動で確認できず、開発スピードが落ちる。今回の修正で、開発者が PR を出すたびに 2 つのロボットが正しく緑色 (成功) を返してくれる。

---

## Part 2 — 技術的詳細

### 2. 背景と動機

- PR #795 マージ後も以下 2 件の CI failure が残存:
  1. `workflow-shell-lint` job: `actions/setup-node@v4` の `Path Validation Error: Path(s) specified in the action for caching ...` annotation
  2. `backend-ci.yml` / `deploy-staging` job: `wrangler-action` が `CLOUDFLARE_API_TOKEN environment variable` 必須エラーで exit 1
- 影響: dev branch protection の required check 候補が常時 red 化リスク + staging 自動デプロイ lane の機能停止

### 3. 設計判断

#### task-01

- **採用 A1**: `setup-project` composite に `cache` input を追加し、default `'pnpm'` で後方互換維持。`install: 'false'` caller (`workflow-shell-lint`) のみ `cache: ''` で無効化
- 不採用 A2: composite 回避 (再利用性損失)
- 不採用 A3: `continue-on-error` 握り潰し (根本原因隠蔽)

#### task-02

- **採用 B1 + B2 併用**: GitHub environment secret 登録 (B1) と YAML 側 step-level `env:` block 追加 (B2) を両輪で実施
  - B1 が真の復旧条件。secret が空なら `with.apiToken` と `env.CLOUDFLARE_API_TOKEN` はどちらも空になり、CI は正しく fail する
  - B2 は独立 fallback ではなく、`wrangler-action` / `wrangler` の token 読み取り口を同じ scoped secret に揃える互換性対策
- 不採用 B3: repository scope secret 統一 (environment governance 放棄のため却下)

### 4. 実装の要点

#### task-01 差分

`.github/actions/setup-project/action.yml`:

```yaml
# inputs に追加
  cache:
    description: 'Cache strategy passed to actions/setup-node (node-setup path). Use empty string to disable.'
    required: false
    default: 'pnpm'

# Setup Node.js step の cache:
        cache: ${{ inputs.cache }}    # 旧: cache: pnpm
```

`.github/workflows/ci.yml` (workflow-shell-lint job):

```yaml
      - name: Setup project
        uses: ./.github/actions/setup-project
        with:
          node-version: '24'
          install: 'false'
          cache: ''                    # 追加
```

#### task-02 差分

`.github/workflows/backend-ci.yml` (deploy-staging job):

```yaml
      - name: Apply D1 migrations
        id: migrate
        uses: cloudflare/wrangler-action@v3
        env:                                                              # 追加
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_D1_STAGING }}        # 追加
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}        # 追加
        with:
          apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}
          ...

      - name: Deploy Workers app
        id: deploy
        uses: cloudflare/wrangler-action@v3
        env:                                                              # 追加
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}   # 追加
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}        # 追加
        with:
          apiToken: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
          ...
```

### 5. テストと検証

- ローカル静的検証:
  - `actionlint .github/workflows/ci.yml .github/workflows/backend-ci.yml` → exit 0
  - `grep -rn "uses: ./.github/actions/setup-project" .github/workflows/ | wc -l` → 9 (caller 数不変)
  - `grep -rn "cache: ''" .github/workflows/` → ci.yml の workflow-shell-lint のみ
  - `git diff .github/workflows/backend-ci.yml | grep -Ei '(eyJ[A-Za-z0-9_-]{20,}|[a-f0-9]{40,})'` → no match (実 token 値の混入なし)
- CI run evidence: `outputs/phase-11/evidence.md` 参照。push 後に追記する想定 (本実装サイクルでは push 禁止)。

### 6. 影響範囲

- 変更ファイル 4 件、+51/-1 行:
  - `.github/actions/setup-project/action.yml` (+6/-1)
  - `.github/workflows/ci.yml` (+1)
  - `.github/workflows/backend-ci.yml` (+12)
  - `scripts/__tests__/workflow-env-scope.test.sh` (+33)
- caller マトリクス (task-01 phase-6 参照): 9 caller 中、`workflow-shell-lint` のみ挙動変更 (cache 無効化)。残り 8 caller は default `cache: 'pnpm'` 解決で挙動不変。
- `deploy-production` job も same-wave 横展開済み。D1 / Workers の production step も scoped secret を `with.apiToken` と step-level `env.CLOUDFLARE_API_TOKEN` の両方で受け取る。

### 7. リスクと緩和

| リスク | 緩和策 |
| ------ | ------ |
| `cache` input の default 取り違えで他 caller が cache miss | default `'pnpm'` を明示し、grep gate で `cache: ''` の追加箇所が `workflow-shell-lint` のみであることを確認 |
| `env:` と `with.apiToken` の併用を独立 fallback と誤解する | 両方とも同じ scoped secret を参照するため、secret 未登録時は fail する。Phase 11 / Phase 12 では runtime boundary として記録する |
| Secret 登録時に実 token 値がログ・diff に漏出 | `gh secret set --body "$(op read ...)"` で揮発注入、`op read` 結果を変数代入しない |
| 既存 caller の `cache: 'pnpm'` が壊れる | composite default が `'pnpm'` のため後方互換維持。task-01 phase-6 マトリクスで verify |

### 8. 運用ガイド

- 新たに `setup-project` を `install: 'false'` で呼び出す workflow を追加する場合、`cache: ''` を必ず併記する (理由: pnpm store 未生成での post-cleanup 失敗を回避)
- 通常 caller (`install: 'true'`) は default で pnpm cache が効くため指定不要
- staging deploy 失敗時の手動再検証は `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で token 単体検証
- Secret rotation 時は `gh secret list --env staging --repo daishiman/UBM-Hyogo` で名称一致を確認

### 9. 参照

- `docs/30-workflows/fix-ci-cache-and-cf-token-pr795/SCOPE.md`
- `docs/30-workflows/fix-ci-cache-and-cf-token-pr795/outputs/phase-{1,2,3}/phase-N.md`
- `docs/30-workflows/fix-ci-cache-and-cf-token-pr795/outputs/phase-11/evidence.md`
- `docs/30-workflows/fix-ci-cache-and-cf-token-pr795/tasks/task-01-shell-lint-cache-fix/`
- `docs/30-workflows/fix-ci-cache-and-cf-token-pr795/tasks/task-02-cf-api-token-staging-secret-fix/`
- `.github/actions/setup-project/action.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/backend-ci.yml`
- CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール
- `actions/setup-node@v4` README (cache disable 動作仕様)
- `cloudflare/wrangler-action@v3` README (env vs with priority)

---

## 残課題 (Follow-up)

| ID | 内容 | 種別 |
| -- | ---- | ---- |
| UNASSIGNED-01 | `backend-ci.yml` に `workflow_dispatch` trigger 追加 (pre-merge dry-run 化) | 任意改善。現行 push gate 維持のため未タスク化しない |
| UNASSIGNED-02 | `deploy-production` job への step-level env 併用 | 同 cycle で実装済み |
| Secret 登録 | task-02 phase-5 Step 4 のユーザー承認後 Secret 登録 (`gh secret set CF_TOKEN_D1_STAGING / CF_TOKEN_WORKERS_STAGING --env staging`) | 必須 (ユーザー操作) |
| CI run evidence | dev push 後の `gh run view --log` 出力で Phase 11 evidence 表を埋める | 次工程 |

## 「今回完了させない理由」明示 (CONST_009)

本実装サイクルで完了させていない作業は以下:

1. **commit / push / PR 作成**: ユーザー指示で禁止 (本プロンプト Layer 5 / Layer 7)
2. **Secret 登録 (task-02 Step 4)**: 仕様書 phase-5 が「ユーザー明示承認後に実行」と規定 (CLAUDE.md §シークレット管理に従う破壊的操作)
3. **CI run evidence 取得**: push 後にしか取得不可能 (1 と 2 の依存)

いずれもプロンプト規約・仕様書規約・CLAUDE.md セキュリティポリシーに基づく明示的な保留であり、「時間/面倒」による先送りではない。実施時期は PR 作成プロンプトおよびユーザー承認直後。
