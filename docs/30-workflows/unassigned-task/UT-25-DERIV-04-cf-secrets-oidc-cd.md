# UT-25-DERIV-04: GitHub Actions 経由の secret 自動配置（将来）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DERIV-04 |
| タスク名 | GitHub Actions OIDC + Cloudflare API Token による secret 自動配置 CD パイプライン |
| 優先度 | LOW（MVP では不要） |
| 推奨Wave | 着手判断基準到達時（secret rotation の頻発化以降） |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | なし（UT-25 本体は手動配置で完結。将来の自動化分離） |
| 組み込み先 | - |
| 検出元 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/unassigned-task-detection.md（UT-25-DERIV-04 セクション）/ docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-01.md §機会コスト |

## 目的

UT-25 で確立した手動 secret 配置（`op read ... | bash scripts/cf.sh secret put ...`）を、GitHub Actions の OIDC 連携と Cloudflare API Token を介して自動化する CD パイプラインを導入する。secret 値の供給源は 1Password / GitHub Secrets に閉じ込めたまま、配置オペレーションだけを workflow に委譲することで、rotation 頻度が上がった際の運用コストを削減する。

> **着手判断基準**: secret rotation が四半期未満の頻度で発生し始めたタイミング、または対象 secret 数が手動運用で追跡困難になった時点（目安: 同時管理 secret 数 ≥ 10、もしくは月 1 回以上の rotation 発生）。

## スコープ

### 含む

- GitHub Actions OIDC provider を Cloudflare 側で受け入れる設定（API Token 取得経路の確立）
- secret 配置専用の workflow（`.github/workflows/cf-secret-sync.yml` 想定）の追加
- 1Password Connect / GitHub Secrets から secret 値を取得し、`wrangler secret put`（`bash scripts/cf.sh secret put` の CI 等価動作）で staging / production に配置する流れの実装
- staging-first ポリシーの workflow への組み込み（production への put は staging 適用後に手動承認 step を経由）
- GitHub Environments による required reviewers / wait timer / 環境保護ルールの設定
- `::add-mask::` 等を用いた secret 値の log 漏洩防止
- workflow_dispatch 経由の手動 trigger 限定（push trigger を採用しない）
- runbook 化（rotation 時の操作手順、failure recovery、rollback 手順）

### 含まない

- 新規 secret 名の追加（個別 UT で扱う）
- secret 値そのものの更新ポリシー策定（rotation 頻度・期間ルールは別仕様）
- D1 migration や deploy パイプラインとの統合（独立 workflow として運用）
- Cloudflare Access for SaaS による Worker 直接アクセス制御（別領域）
- 1Password Connect Server のセルフホスト構築（既存運用を前提）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25（手動 secret 配置） | 配置先 secret 名・stdin 投入手順・staging-first ルールが確立済みであること |
| 上流 | scripts/cf.sh | wrangler ラッパー仕様が安定し、CI で再利用可能であること |
| 上流 | 1Password Connect or GitHub Secrets 整備 | secret 値の供給源が CI から参照可能であること |
| 下流 | rotation runbook | 自動化後の運用手順を runbook に反映する |
| 関連 | UT-05 系 CI/CD 自動化タスク群 | deploy workflow と同じ OIDC / API Token 設定を共有する可能性 |

## 着手タイミング

> **着手前提**: UT-25 完了 / scripts/cf.sh の挙動が CI 環境でも再現可能 / GitHub Environments の required reviewers 運用方針が決定済み。

| 条件 | 理由 |
| --- | --- |
| secret rotation が頻発化（四半期未満） | 手動配置の運用コストが自動化コストを上回る損益分岐点 |
| 管理対象 secret 数の増加 | 手動オペレーションでの取り違えリスクが許容できなくなる |
| GitHub OIDC + Cloudflare API Token の運用整備完了 | 自動化前提の認可基盤が必要 |
| 1Password Connect or GitHub Secrets が CI から安全に参照可能 | secret 値の supply chain が確定している必要がある |

## 苦戦箇所・知見

**1. OIDC token を Cloudflare 側で受け入れる設定**
Cloudflare は GitHub OIDC を直接 IAM に統合しないため、現実的な経路は次の 2 通りに絞られる。(a) GitHub Actions に格納した Cloudflare API Token を OIDC で取得した short-lived credential 経由で復号する（例: AWS / GCP の OIDC → Secrets Manager → Cloudflare API Token 取得）、または (b) 1Password Connect の Service Account JWT を OIDC ベースで取得し、そこから Cloudflare API Token を pull する。Cloudflare Access for SaaS は Worker 配置 API には直接効かないため誤用しない。最初は (a) の単純経路で開始し、scope を `Account > Workers Scripts: Edit` のみに限定した API Token を発行する。

**2. GitHub Actions runner の権限境界**
production 配置 step は GitHub Environments の `production` を required reviewers 付きで作成し、`environment: production` を job に紐付ける。staging step は `staging` Environment（reviewer 任意）。workflow は `permissions: id-token: write, contents: read` のみに絞り、`actions: write` などは付与しない。`workflow_dispatch` 限定にし、`push` trigger を採用しない（誤発火防止）。fork PR からの workflow 実行は Cloudflare API Token に到達できないよう `pull_request_target` を使わない。

**3. secret 値を GitHub Actions log に漏らさない**
1Password / GitHub Secrets から取り出した値は `echo "::add-mask::$VALUE"` で即座に mask 登録し、その後の任意 step でも log に出ないようにする。`secret put` への投入は stdin 経由を維持し、`run:` 内で展開しない（`run: echo "$SECRET" | wrangler ...` ではなく、`run: |` 内でも変数展開を避け、ファイル経由は使わない）。`set -x` を使わない。`continue-on-error: true` で失敗内容を log に流さない設計にする。

**4. rotation 頻度が低いうちは手動で十分というトレードオフ**
MVP 段階では secret 数が少なく rotation 頻度も低いため、自動化の構築コスト（OIDC 設定・workflow 実装・required reviewers 運用・テスト）の方が手動配置の累積コストを上回る。Phase 1 §機会コストで明示された通り、rotation 頻発化前の前倒し導入は YAGNI 違反になる。着手判断基準（rotation 頻度、secret 数）を満たすまでは UT-25 の手動経路を運用継続する。

**5. staging-first を workflow で強制する**
single workflow 内で staging job → production job の依存関係（`needs: staging`）を設定し、staging が成功しない限り production job が起動しないようにする。production job には `environment: production` を付与し、required reviewers 経由の手動承認を経て初めて secret put が走る。

**6. rollback 経路の自動化はスコープ外**
secret の rollback は 1Password の旧 revision からの再投入が正本（UT-25 ルール）。workflow に rollback step を組み込むと旧 revision の取得経路が複雑化するため、rollback は引き続き手動オペレーションとし、workflow は forward apply のみを担う。

## 実行概要

1. Cloudflare API Token を発行（scope: `Account > Workers Scripts: Edit` のみ）し、1Password に保存する
2. GitHub Environments で `staging` / `production` を作成し、production に required reviewers と wait timer を設定する
3. `.github/workflows/cf-secret-sync.yml` を新規作成し、`workflow_dispatch` 限定 trigger / `permissions: id-token: write, contents: read` / staging job → production job の依存を実装する
4. 各 job で 1Password Connect or GitHub Secrets から secret 値を取得し、`::add-mask::` で mask 登録する
5. `bash scripts/cf.sh secret put <NAME> --config apps/api/wrangler.toml --env <env>` を stdin 経由で実行する step を組む
6. staging 適用後に `bash scripts/cf.sh secret list` で name 確認し、production job の手動承認 → 同手順で適用する
7. runbook（UT-25 派生 runbook）に自動化後の rotation 手順・failure recovery・rollback（手動）を追記する
8. dry-run mode（`--dry-run` 相当の skip step）を実装し、初回適用前に経路確認できるようにする

## 完了条件

- [ ] `.github/workflows/cf-secret-sync.yml` が `workflow_dispatch` 限定で動作し、staging job → production job の依存が機能する
- [ ] production job が GitHub Environments の required reviewers 承認を経ないと secret put を実行しない
- [ ] secret 値が GitHub Actions の log に出力されない（`::add-mask::` 効果を実 run で確認）
- [ ] 1Password / GitHub Secrets から取得した値が stdin 経由でのみ `wrangler secret put` に渡る
- [ ] Cloudflare API Token の scope が `Account > Workers Scripts: Edit` のみに限定されている
- [ ] runbook に自動化後の rotation 手順・failure recovery・rollback（手動経路維持）が記載されている
- [ ] dry-run 経路が用意され、実 secret 投入前に workflow path を検証できる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 手動 secret 配置の正本ルール（stdin 投入 / staging-first / rollback） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets / GitHub Secrets の正本仕様 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-01.md | §機会コスト（手動運用継続の判断根拠） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/unassigned-task-detection.md | UT-25-DERIV-04 検出元の詳細 |
| 参考 | https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect | GitHub OIDC ハードニング |
| 参考 | https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ | Cloudflare API Token scope |
| 参考 | https://docs.github.com/en/actions/security-guides/encrypted-secrets#masking-a-value-in-log | `::add-mask::` による log 漏洩防止 |
| 参考 | scripts/cf.sh | CI 環境でも利用する canonical wrapper |
