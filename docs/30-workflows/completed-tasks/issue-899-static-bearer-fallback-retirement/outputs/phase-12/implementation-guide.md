# Implementation Guide — issue-899-static-bearer-fallback-retirement

## Part 1: 中学生レベル説明

### なぜ必要か

CI に「夜間に動く自動テスト」があります。staging サーバの管理画面が壊れていないかを確かめるために、テスト用の「鍵（bearer token）」を使って自動でログインします。

たとえば学校の教室に入る鍵を、先生が毎日新しく配る方式にしたのに、古い合鍵も職員室に残っているイメージです。古い合鍵が残っていると、誰かが「新しい鍵がうまく配れなかったから古い合鍵を使おう」と戻してしまい、また同じ問題が起きます。

昔はこの鍵を GitHub の secret 設定に**ずっと保存**していました（=「静的 bearer」）。でもこの鍵は有効期限があり、切れるたびに人が手で更新する必要がありました。

そこで「テスト実行のたびに短命の鍵を新しく作る（mint）」仕組みを入れました。今は両方が混在しています（mint があれば mint を使い、無ければ古い静的鍵を使う）。これを **mint だけに統一**するのが #899 の目的です。

### 何をするか

1. CI 設定ファイルから古い静的鍵の参照を消す
2. mint が動かなかった時の保険ロジック（fallback）も消す
3. ドキュメントを「mint だけ」の運用に書き換える
4. 不要になった GitHub の静的鍵 secret を物理的に削除する

### 今回作ったもの

今回の wave で作ったものは、実装そのものではなく、実装 PR のための設計図です。

| 作ったもの | 内容 |
| ---------- | ---- |
| 実装仕様書 root | #899 の目的、順序制約、受入条件をまとめた入口 |
| Phase 1-13 成果物 | 要件、設計、テスト、手順、手動確認、PR 文面の準備 |
| Phase 12 strict 7 | 実装ガイド、仕様同期記録、未タスク検出、スキルフィードバック、準拠チェック |
| aiworkflow 正本索引 | 後から検索できるように、正本仕様側へ登録 |

### 既知制限

- 前提タスク #916 が完了している必要がある（短命鍵を作る署名鍵 `STAGING_AUTH_SECRET` が GitHub Environment に投入済みであること）
- 順序を間違えると CI が落ちる（必ず「workflow を直す」→「smoke を1回走らせて緑確認」→「古い secret を削除」の順）

---

## Part 2: 開発者レベル詳細

### 背景

`.github/workflows/runtime-smoke-staging.yml` には現在、3 種類の bearer 経路混在状態がある:

1. job.env レベルの静的 inject（`:29`, `:31`）
2. mint step（`:44-71`、`if: env.STAGING_AUTH_SECRET != ''` で条件実行）
3. mask step の `static-fallback` 分岐（`:88-99`）

加えて freshness gate は静的 bearer の寿命切れ吸収のため warn-only（`:37` `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'`）にされている。

### 要約

mint 経路一本化（job.env から静的 inject 削除 + mint step 常時実行 + fail-fast guard 追加 + mask 分岐除去 + freshness hard-fail 既定昇格）と、runbook / SSOT の同期更新を 1 PR で実施する。

### TypeScript 型定義

本 wave はコード変更なしの実装仕様書作成だが、後続実装 PR が満たすべき検証契約は次の shape で扱う。

```ts
type RuntimeSmokeAuthPath = "minted";

interface Issue899ImplementationContract {
  workflow: ".github/workflows/runtime-smoke-staging.yml";
  runbook: "docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md";
  ssot: "docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md";
  prerequisite: {
    issue: 916;
    stagingAuthSecretProvisioned: true;
    mintPathSmokeGreen: true;
  };
  removedStaticFallback: {
    jobEnvStaticBearers: true;
    mintStepConditionalIf: true;
    staticFallbackMaskBranch: true;
    freshnessWarnOnlyEnv: true;
  };
  runtimeEvidence: {
    authPath: RuntimeSmokeAuthPath;
    smokeConclusion: "success";
    staticSecretsDeleted: true;
  };
}
```

### IF（公開 IF 変更なし）

- workflow `workflow_call` IF は不変
- `RUNTIME_SMOKE_AUTH_PATH` env 値は `minted` 固定（理論上 `static-fallback` への分岐は存在しなくなる）
- `verify required staging secrets` step は mint step が GITHUB_ENV へ export した値で引き続き機能

### CLIシグネチャ

後続実装 PR で実行する主要 CLI は次の通り。

```bash
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml
pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/issue-899-static-bearer-fallback-retirement/artifacts.json docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/artifacts.json
pnpm verify:phase12-compliance
gh workflow run runtime-smoke-staging.yml --ref dev
gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke
gh secret delete STAGING_ME_BEARER --env staging-runtime-smoke
```

### 実装ステップ

1. branch 作成: `feat/issue-899-retire-static-bearer-fallback`
2. `.github/workflows/runtime-smoke-staging.yml` を Phase 2 § 1 / Phase 5 § 2 に従って編集
3. `secret-provisioning.md` を Phase 2 § 2 / Phase 5 § 3 に従って編集
4. `bearer-lifecycle-ssot.md` § 6 を Phase 2 § 3 / Phase 5 § 4 に従って更新
5. local 検証（Phase 5 § 5）
6. commit / push / PR（user-gated）
7. merge 後、Phase 11 § 2 の手順で mint-only smoke green + physical secret delete を実施

### 使用例

```bash
# 仕様書作成 wave の Phase 12 guide 構成チェック
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow docs/30-workflows/issue-899-static-bearer-fallback-retirement \
  --json

# 後続実装 PR で workflow から fallback が消えたことを確認
! grep -n 'static-fallback' .github/workflows/runtime-smoke-staging.yml
! grep -nE 'if:[[:space:]]+env\.STAGING_AUTH_SECRET' .github/workflows/runtime-smoke-staging.yml
```

### テスト構成

| レイヤ | コマンド | 目的 |
| ------ | -------- | ---- |
| workflow lint | `actionlint .github/workflows/runtime-smoke-staging.yml` | YAML / GitHub Actions 構文の退行検出 |
| grep gate | `grep -n ...` | 静的 bearer fallback の残存検出 |
| workspace quality | `pnpm typecheck` / `pnpm lint` | 既存 TypeScript / lint 契約の退行検出 |
| task spec quality | `validate-phase12-implementation-guide.js` / `verify:phase12-compliance` | Phase 12 strict 7 と実装ガイド構成の検証 |
| runtime evidence | `gh workflow run runtime-smoke-staging.yml --ref dev` | merge 後に auth-path=`minted` / job success を確認 |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml

grep -n 'static-fallback' .github/workflows/runtime-smoke-staging.yml
grep -nE 'if:[[:space:]]+env\.STAGING_AUTH_SECRET' .github/workflows/runtime-smoke-staging.yml
grep -n 'RUNTIME_SMOKE_FRESHNESS_ENFORCE' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ADMIN_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ME_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml

pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/issue-899-static-bearer-fallback-retirement/artifacts.json docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/artifacts.json
pnpm verify:phase12-compliance
bash scripts/verify-pr-ready.sh
```

### エラーハンドリング

| ケース                                                       | 期待挙動                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `STAGING_AUTH_SECRET` 未設定で mint step 到達                | mint step 冒頭 fail-fast guard が `::error::` + `exit 1`                                   |
| mint step が internal error で fail                          | freshness step 以降到達せず job fail。`gh run view --log` で root cause 特定               |
| freshness gate hard-fail（既定昇格後）で expired bearer 検出 | smoke job fail。原因は短命 JWT TTL（600s）超過 → mint helper を再走                       |
| physical secret 削除を workflow edit より先に実施            | 撤去前 workflow が secret 欠落で fail。順序制約違反として runbook に明示                  |

### エッジケース

| ケース | 対応 |
| ------ | ---- |
| #916 未完了のまま実装 PR を merge しようとする | merge 禁止。`STAGING_AUTH_SECRET` provisioning と mint path smoke green を先に確認 |
| mint helper が bearer を出力しない | `verify required staging secrets` で必須 env 欠落として fail |
| `RUNTIME_SMOKE_AUTH_PATH` が `minted` 以外になる | `mask staging credentials` と Phase 11 grep で `static-fallback` 残存を検出 |
| closed issue #899 を PR で誤 close しようとする | PR 文脈は `Refs #899` のみ。`Closes/Fixes/Resolves` は使わない |

### 設定項目と定数一覧

| 定数                          | 値      | 出典                                                |
| ----------------------------- | ------- | --------------------------------------------------- |
| `MINT_TTL_SECONDS`            | `'600'` | `.github/workflows/runtime-smoke-staging.yml`（不変）|
| auth path canonical value     | `minted`| mint step の GITHUB_ENV export                      |
| freshness gate 既定挙動       | hard-fail | `scripts/smoke/bearer-freshness-gate.mts` 既定    |

### 視覚証跡

NON_VISUAL のため screenshot / axe 検証は対象外。runtime evidence は CLI log（Phase 11 § 4 の inventory）で代替する。
