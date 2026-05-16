# staging/production Environment secret provisioning runbook - タスク指示書

## メタ情報

```yaml
issue_number: 662
task_id: ci-secret-alignment-followup-002-staging-production-secret-runbook
task_name: staging/production Environment secret provisioning runbook
category: ドキュメント補強
target_feature: GitHub Environment secret provisioning（CF deploy 経路）
priority: 中
scale: 小規模
status: consumed_by_workflow
consumed_by: docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/
consumed_at: 2026-05-14
source_phase: docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md（In-scope 未充足項目）
created_date: 2026-05-10
dependencies: []
taskType: implementation
visualEvidence: NON_VISUAL
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `ci-secret-alignment-followup-002-staging-production-secret-runbook` |
| タスク名 | `staging` / `production` Environment secret provisioning runbook |
| 分類 | ドキュメント補強 |
| 対象機能 | GitHub Environment secret provisioning（CF deploy 経路） |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | consumed_by_workflow |
| 発見元 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md`（In-scope 未充足項目） |
| 発見日 | 2026-05-10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

> Canonical Status: consumed by `docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/` on 2026-05-14. This file remains as a historical pointer only; do not execute it as an open unassigned task.

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

GitHub Environment Secret は、GitHub Actions の workflow が「特定の環境（例: `staging` / `production`）にデプロイするとき」だけ参照できる秘密の値の保管庫である。リポジトリ全体に公開される `repository secret` と違い、環境ごとに値を切り替えられるので「staging では検証用トークン、production では本番トークン」のように分離できる。中学生向けに言い直すと、「ロッカーに名前札（環境名）が付いていて、名前札ごとに違う鍵（secret 値）を入れておける仕組み」である。

今回の `ci-secret-alignment-and-runtime-smoke-recovery` workflow では、`web-cd / deploy-staging` job が `secrets.CLOUDFLARE_API_TOKEN` を参照して Cloudflare へデプロイする。task-01 で workflow 側の参照名を実 secret 名に整合させたが、**「どの環境に・誰が・どの値を・どう投入するか」の正規 runbook は未作成**であり、`staging-runtime-smoke` 用の `runbooks/secret-provisioning.md` だけが存在する状態である。

### 1.2 問題点・課題

- `staging` / `production` Environment 用の Cloudflare deploy secret 投入手順が canonical 化されていない。
- task-02 phase-12 で「task-01 のスコープ（または別 runbook）」と明示的に deferred されたが、task-01 phase-12 でも追加されていない。
- token rotation や新規環境追加のたびに workflow YAML / wrangler.toml を読み直して再構築する必要がある。

### 1.3 放置した場合の影響

- secret 名 drift / 値欠測の事故が再発し、`web-cd` 経路が再度 fail するリスクがある。
- 障害対応時に「どの environment に何が登録されているか」を即時特定できず、復旧 MTTR が伸びる。
- 1Password 正本との対応関係が口伝化し、retire / rotate の判断が遅延する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`staging` / `production` の GitHub Environment に Cloudflare deploy 用 secret を投入する手順を canonical runbook として整備し、token rotation・障害対応・新規参画の起点を一本化する。

### 2.2 最終ゴール

`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/` 配下に `staging-secret-provisioning.md` と `production-secret-provisioning.md` の 2 ファイルが存在し、既存 `secret-provisioning.md` と同じ章立て（目的 / 必要 secret 一覧 / 投入手順 / 投入確認 / 動作確認 / ローテーション運用 / 禁止事項）で記述されている。

### 2.3 スコープ

#### 含むもの

- `runbooks/staging-secret-provisioning.md` の新規作成
- `runbooks/production-secret-provisioning.md` の新規作成
- `CLOUDFLARE_API_TOKEN` 1 件の取得経路・投入手順・rotation 運用・禁止事項の文書化
- 親 `index.md` のサブタスク表 / 不変条件との整合確認

#### 含まないもの

- 実 secret 値の記述（`op://Vault/Item/Field` 参照と `gh secret set --env <env>` 形式のみ）
- `CLOUDFLARE_ACCOUNT_ID` などの非機密 var の管理（GitHub Variables 側で別管理）
- workflow YAML 側の修正（task-01 で完了済み）
- token 実値の rotation 実施（runbook 整備に閉じる）
- `staging-runtime-smoke` runbook の機能変更（ただし stale CLI guidance の最小補正は consumed workflow 内で実施済み）

### 2.4 成果物

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md`
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md`
- 親 `index.md` In-scope 「GitHub Environments の secret provisioning runbook」項目の充足エビデンス

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親 `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md` が存在し、In-scope 定義が確認できること。
- 既存 `runbooks/secret-provisioning.md` の章立てが正本として参照可能であること。
- `gh` CLI で repo admin 権限が利用できること（記述検証時のみ）。
- 1Password に Cloudflare API Token の正本 Item が存在すること（参照名のみ runbook に記載）。

### 3.2 依存タスク

- 完了依存: task-01 (`web-cd-secret-name-alignment`) — workflow 側の secret 参照名整合
- 参照依存: 既存 `runbooks/secret-provisioning.md`（`staging-runtime-smoke` 用）

### 3.3 必要な知識

- GitHub Environments と Environment Secret / Variables の違い
- `gh secret set --env <env>` / `gh api repos/<owner>/<repo>/environments/<env>/secrets` の使い方
- Cloudflare API Token の最小権限 scope（Workers Scripts:Edit, Account:Read, Pages:Edit）
- 1Password CLI (`op`) を経由した secret 参照ポリシー（`op://Vault/Item/Field`）

### 3.4 推奨アプローチ

既存 `secret-provisioning.md` を template として複製し、対象 environment と必要 secret 一覧だけを差し替える。`staging` / `production` で文面の重複が大きいため、章立ての統一を優先する。実値・token 値・OAuth トークンは絶対に記述せず、1Password 参照のみ書く。

---

## 4. 実行手順

### Phase構成

1. Phase 1: template 確認と差分整理
2. Phase 2: `staging-secret-provisioning.md` 作成
3. Phase 3: `production-secret-provisioning.md` 作成
4. Phase 4: 親 `index.md` 整合確認

### Phase 1: template 確認と差分整理

#### 目的

既存 `secret-provisioning.md` を canonical template として採用し、`staging` / `production` 用に差し替える要素を確定する。

#### 手順

1. `runbooks/secret-provisioning.md` の章立てを抽出する。
2. `staging` / `production` で必要な secret が `CLOUDFLARE_API_TOKEN` 1 件であることを `web-cd.yml` から確認する。
3. `vars.CLOUDFLARE_ACCOUNT_ID` は非機密 var として GitHub Variables 側にあり runbook 対象外であることを明記する。

#### 成果物

- 差分整理メモ（作成中の作業ノート、コミット対象外）。

#### 完了条件

- 章立てと差し替え対象が確定している。

### Phase 2: `staging-secret-provisioning.md` 作成

#### 目的

`staging` Environment 用 Cloudflare deploy secret 投入手順を canonical 化する。

#### 手順

1. 「目的」: `staging` Environment が `web-cd / deploy-staging` job から参照する `CLOUDFLARE_API_TOKEN` を投入することを明記。
2. 「必要 secret 一覧」: `CLOUDFLARE_API_TOKEN` の取得元として `op://UBM-Hyogo/Cloudflare API Token (staging)/credential` を記述（実値ではない参照）。
3. 「投入手順」: `gh secret set CLOUDFLARE_API_TOKEN --env staging` を先頭スペース付きで提示。
4. 「投入確認」: `gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets --jq '.secrets[].name'` の期待出力を記述。
5. 「動作確認」: `gh workflow run web-cd.yml --ref dev` 後の `deploy-staging` job が PASS することを確認する手順を記述。
6. 「ローテーション運用」: Cloudflare ダッシュボードで token rotate → 1Password 更新 → `gh secret set` 上書きの順序を明記。
7. 「禁止事項」: 実値記述禁止 / commit message 禁止 / AI エージェントへの実値投入依頼禁止 / `wrangler login` の OAuth トークン保持禁止を列挙。

#### 成果物

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md`

#### 完了条件

- 既存 `secret-provisioning.md` と同じ 7 章立てで構成されている。
- 実 secret 値が含まれていない。

### Phase 3: `production-secret-provisioning.md` 作成

#### 目的

`production` Environment 用 Cloudflare deploy secret 投入手順を canonical 化する。

#### 手順

1. Phase 2 と同じ章立てで `production` 環境用に文面を差し替える。
2. 「必要 secret 一覧」の取得元参照を `op://UBM-Hyogo/Cloudflare API Token (production)/credential` に変更する。
3. 「投入手順」を `gh secret set CLOUDFLARE_API_TOKEN --env production` に変更する。
4. 「投入確認」を `gh api repos/daishiman/UBM-Hyogo/environments/production/secrets` に変更する。
5. 「動作確認」は `dev → main` の PR マージ後に `web-cd / deploy-production` job が PASS することを確認する手順とする。
6. 「ローテーション運用」と「禁止事項」は Phase 2 と同方針で production 文脈に整える（rotate 影響範囲が production であることを明記）。

#### 成果物

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md`

#### 完了条件

- `staging` 用と章立てが一致し、対象 environment / 取得元 / 動作確認手順だけが差分になっている。

### Phase 4: 親 `index.md` 整合確認

#### 目的

親 workflow の In-scope 「secret provisioning runbook」項目の充足を明記する。

#### 手順

1. 親 `index.md` の In-scope / サブタスク表 / 不変条件を読み、新 runbook 2 本を参照する位置を確認する。
2. 必要なら親 `index.md` に runbook 参照行を追記する（task の本旨は runbook 作成のため、index 更新は最小限）。
3. `staging-runtime-smoke` 用 `secret-provisioning.md` は既存のまま残し、3 ファイル並立構成になることを確認する。

#### 成果物

- 親 `index.md` の整合確認メモ（必要に応じて軽微な追記）。

#### 完了条件

- 3 つの runbook（`secret-provisioning.md` / `staging-secret-provisioning.md` / `production-secret-provisioning.md`）が並列で参照される構造になっている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `runbooks/staging-secret-provisioning.md` が新規作成されている。
- [ ] `runbooks/production-secret-provisioning.md` が新規作成されている。
- [ ] 必要 secret は `CLOUDFLARE_API_TOKEN` 1 件として記述されている。
- [ ] `vars.CLOUDFLARE_ACCOUNT_ID` は非機密 var で別管理である旨が明記されている。

### 品質要件

- [ ] 既存 `secret-provisioning.md` と同じ 7 章立て（目的 / 必要 secret 一覧 / 投入手順 / 投入確認 / 動作確認 / ローテーション運用 / 禁止事項）で揃っている。
- [ ] 実 secret 値・OAuth トークン値・API Token 値がドキュメント内に一切含まれていない。
- [ ] secret 値の取得元は `op://Vault/Item/Field` 参照のみで記述されている。

### ドキュメント要件

- [ ] 親 `index.md` In-scope 「secret provisioning runbook」項目の充足が確認できる。
- [ ] `staging-runtime-smoke` 用既存 runbook と並立する構造になっている。
- [ ] token rotation 手順と禁止事項が両 runbook に記載されている。

---

## 6. 検証方法

### テストケース

- runbook 章立ての一致確認: 既存 `secret-provisioning.md` と新規 2 本の見出しが揃っているか。
- 禁止事項に「実値記述禁止」「commit message に書かない」「AI エージェントへの実値投入依頼禁止」が含まれているか。
- 投入確認コマンドが `staging` / `production` それぞれの environment 名を正しく参照しているか。

### 検証手順

```bash
# 章立て一致確認
grep -E '^## ' docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md
grep -E '^## ' docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md
grep -E '^## ' docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md

# 実値混入チェック（hex / JWT 形式の漏洩がないことを目視確認）
grep -nE '(eyJ[A-Za-z0-9_-]{10,}|[a-f0-9]{32,})' \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md \
  || echo "OK: no secret-like literals"

# environment 名参照確認
grep -nE '--env (staging|production)\b' \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md
```

期待: 章立てが 3 ファイルで一致、secret 様文字列がヒットせず、`--env staging` / `--env production` が各 runbook で正しく参照される。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| runbook 内に実 token 値が混入する | 高 | 低 | `op://Vault/Item/Field` 参照のみを記述し、検証手順で hex / JWT 形式 grep gate を回す |
| `staging` / `production` で文面が乖離し片方だけ最新化される | 中 | 中 | 両 runbook で 7 章立てを揃え、token rotation セクションを共通テンプレ化する |
| `CLOUDFLARE_ACCOUNT_ID` を Environment Secret に誤投入する | 中 | 中 | runbook 冒頭で「Account ID は GitHub Variables 側で別管理」と明記する |
| `staging-runtime-smoke` 用 runbook と混同して `staging` deploy に runtime smoke 用 secret を投入する | 中 | 低 | 各 runbook 冒頭で対象 environment と参照 workflow（`web-cd.yml` / `runtime-smoke-staging.yml`）を明示する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md`
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`（`staging-runtime-smoke` 用既存 runbook）
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/`
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/`
- `.github/workflows/web-cd.yml`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

### 参考資料

- GitHub Docs: Environments and deployment protection rules
- Cloudflare Docs: API tokens (Workers Scripts:Edit / Pages:Edit / Account:Read scope)
- 1Password CLI `op run --env-file=.env` 経由の secret 注入運用（`scripts/cf.sh` / `scripts/with-env.sh`）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | PR #648 マージ後の `web-cd / deploy-staging` 失敗時、「どの環境にどの secret が登録されているべきか」の正規ドキュメントが無く、復旧判断に時間を要した |
| 原因 | `staging-runtime-smoke` 用 runbook のみ整備され、`staging` / `production` の Cloudflare deploy 用 secret 投入手順が文書化されていなかった |
| 対応 | 暫定的に `web-cd.yml` 修正（task-01）で workflow 側の参照名を実 secret 名に揃えたが、運用ドキュメントは未整備のまま |
| 再発防止 | 本タスクで `staging` / `production` 用 runbook を新規作成し、token rotation 手順と禁止事項を含めて canonical 化する |
| 参照 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md` In-scope, `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` |

### レビュー指摘の原文（該当する場合）

該当なし。親 `index.md` In-scope と task-02 phase-12 の deferred 記述から formalize した。

### 補足事項

Phase 13（commit / push / PR）はユーザー承認ゲートであり、本タスクの作成時点では実行しない。runbook の章立ては既存 `secret-provisioning.md` を canonical template として再利用し、`staging` / `production` で章立てが乖離しないことを優先する。
