# Issue #331 Followup 003 OIDC / Step-Scoped CF Token Cutover - タスク指示書

## メタ情報

```yaml
issue_number: null
task_id: issue-331-followup-003-oidc-step-scoped-cf-token-cutover
task_name: Issue #331 Followup 003 OIDC / Step-Scoped CF Token Cutover
category: 改善
target_feature: GitHub Actions Cloudflare deploy credential surface
priority: 中
scale: 中規模
status: 未実施
source_phase: docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-09
dependencies: []
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-331-followup-003-oidc-step-scoped-cf-token-cutover` |
| タスク名 | Issue #331 Followup 003 OIDC / Step-Scoped CF Token Cutover |
| 分類 | 改善 |
| 対象機能 | GitHub Actions Cloudflare deploy credential surface |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-09 |
| source issue | Issue #331 (CI/CD runtime warning cleanup; deferred token-split workstream) |
| taskType | runtime / security |
| visualEvidence | NON_VISUAL |
| dependencies | `[]` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #331 (CI/CD runtime warning cleanup) では `web-cd.yml` を Pages から Workers deploy へ移行し、`backend-ci.yml` を含む CI/CD は引き続き environment-scoped GitHub Secret `CLOUDFLARE_API_TOKEN` を介して Cloudflare API を叩いている。`grep` で確認した現状の参照箇所は以下の通り:

- `.github/workflows/web-cd.yml:43` — staging deploy step `env.CLOUDFLARE_API_TOKEN`
- `.github/workflows/web-cd.yml:75` — production deploy step `env.CLOUDFLARE_API_TOKEN`
- `.github/workflows/backend-ci.yml:41,52,96,107` — `cloudflare/wrangler-action@v3` の `apiToken` 入力

このトークンは long-lived な Account scoped token であり、Workers Scripts:Edit / D1:Edit / Pages:Edit を含む広い blast radius を持つ。Cloudflare は workload identity federation 相当の OIDC サポートを段階的に拡充しており、AWS / GCP と比較して実装が遅れている領域もあるため、本タスク実行時に最新サポート状況を再確認する必要がある。

### 1.2 問題点・課題

- long-lived token は GitHub Secrets / Cloudflare dashboard / 1Password の 3 箇所に存在し、漏洩時の rotation コストが高い。
- job-level の `secrets.CLOUDFLARE_API_TOKEN` 参照は同一 job 内の全 step に露出する設計になりやすく、build / lint step などにも環境変数として伝播する恐れがある。
- Issue #331 の Phase 12 unassigned-task-detection.md で deferred 扱いとなった 3 件のうち、token cutover は独立 workstream として正式化されていなかった。

### 1.3 放置した場合の影響

- token 漏洩 surface が CI 全体に広がったまま運用が継続し、rotation SOP 発動時の影響範囲が読みにくくなる。
- OIDC への将来移行コストが累積し、認証関連 task が複数 issue に分散して所有者不在になる。
- セキュリティレビュー時に `least privilege` 原則違反として再指摘されるリスクが残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

GitHub Actions の Cloudflare deploy credential を OIDC ベースまたは step-scoped fine-grained token へ cutover し、long-lived API Token の漏洩 surface を最小化する。

### 2.2 最終ゴール

- `web-cd.yml` / `backend-ci.yml` の deploy step 以外の step では `CLOUDFLARE_API_TOKEN` が未定義になる。
- staging / production deploy が green で、redaction-check で token 値が log に漏れていないことを runtime evidence として確認できる。
- 採用方式（OIDC 完全移行 / step-scoped fine-grained token / hybrid）が決定し、`deployment-secrets-management.md` に正本として反映される。

### 2.3 スコープ

#### 含むもの

- `.github/workflows/web-cd.yml` および `.github/workflows/backend-ci.yml` の deploy step を OIDC ベースまたは step-scoped token に置き換える。
- `scripts/cf.sh` 経由で新方式が動作することを保証する（既存ラッパーが env var 名 `CLOUDFLARE_API_TOKEN` に依存しているため、変数名は維持する）。
- `bash scripts/cf.sh deploy --dry-run` および staging deploy の runtime smoke evidence を取得する。
- `deployment-secrets-management.md` / 関連 references の正本更新案を作成する。

#### 含まないもの

- HEALTH_DB_TOKEN rotation SOP 等の既存 rotation 文書の本体改訂（既存 issue に委譲）。
- API 側 D1 token の cutover（別 issue として切り出す）。
- Cloudflare dashboard での既存 long-lived token の物理削除（owner approval 必須・別 issue）。
- 1Password 正本の構造変更（必要時のみ参照更新の判断材料を作成）。

### 2.4 成果物

- 後続 workflow の `outputs/phase-11/oidc-feasibility-report.md`
- 後続 workflow の `outputs/phase-11/web-cd-after.yml.diff`
- 後続 workflow の `outputs/phase-11/backend-ci-after.yml.diff`
- 後続 workflow の `outputs/phase-11/staging-deploy-smoke.log`（redacted）
- 後続 workflow の `outputs/phase-11/redaction-check.md`
- 後続 workflow の `outputs/phase-12/system-spec-update-summary.md`
- 後続 workflow の `outputs/phase-12/unassigned-task-detection.md`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Cloudflare account に OIDC / WIF (Workload Identity Federation) 相当機能が有効化できる、または fine-grained API Token 発行権限がある。
- GitHub repository に `id-token: write` permission を付与できる owner 認証がある。
- staging / production の Workers project に対し、deploy 権限を持つ運用ユーザーが存在する。

### 3.2 依存タスク

- Source workflow: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/`
- Source evidence: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md`
- 関連: `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/`（Pages 撤去後の credential 整理と整合させる）

### 3.3 必要な知識

- GitHub Actions OIDC token の発行と `id-token: write` permission の挙動。
- Cloudflare の OIDC サポート最新仕様、必要な audience / subject claims、IAM role mapping。
- `cloudflare/wrangler-action@v3` の `apiToken` 入力と env injection の優先順位。
- `scripts/cf.sh` のラッパー動作（`op run --env-file=.env` / `ESBUILD_BINARY_PATH` / `mise exec`）。
- GitHub Actions の `secrets` は job-level でしか参照できず、step 限定露出には step-scoped `env:` を使う必要があること。

### 3.4 推奨アプローチ

1. 調査フェーズで Cloudflare の OIDC サポート最新状況を一次情報で確認する。
2. OIDC 完全移行が可能なら `permissions: id-token: write` を付与し、CF 公式 action または手動 OIDC token exchange を導入する。
3. OIDC が現時点で困難な場合は step-scoped fine-grained token (Account scope: Workers Scripts:Edit, D1:Edit, Pages:Edit only) を新規発行し、`secrets.CLOUDFLARE_API_TOKEN_DEPLOY` 等の別 secret として定義する。
4. step-scoped 方式では deploy step の `env:` ブロック内でのみ `CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN_DEPLOY }}` を露出させる（job-level `env:` には置かない）。
5. staging で dry-run + 実 deploy smoke を取り、log redaction を確認した後に production へ展開する。

---

## 4. 実行手順

### Phase構成

1. Phase 1: OIDC / step-scoped feasibility 調査
2. Phase 2: workflow 改修案の作成
3. Phase 3: staging 検証と redaction 確認
4. Phase 4: production cutover と正本同期

### Phase 1: OIDC / step-scoped feasibility 調査

#### 目的

Cloudflare の現時点での OIDC / WIF サポート状況を確定し、採用方式を決定する。

#### 手順

1. Cloudflare 公式ドキュメント / changelog で OIDC サポート最新状況を確認する。
2. `cloudflare/wrangler-action` の最新 release が OIDC 入力に対応しているか確認する。
3. fallback として fine-grained token に必要な最小権限セットを定義する（Workers Scripts:Edit / D1:Edit / Pages:Edit / R2:Edit のうち実使用分のみ）。

#### 成果物

- `outputs/phase-11/oidc-feasibility-report.md`

#### 完了条件

- 採用方式（OIDC / step-scoped / hybrid）が判断材料付きで記録されている。

### Phase 2: workflow 改修案の作成

#### 目的

`web-cd.yml` / `backend-ci.yml` の改修 diff を作成し、`scripts/cf.sh` 経由でも動作する設計にする。

#### 手順

1. deploy step 以外の step が `CLOUDFLARE_API_TOKEN` を参照していないことを再 grep で確認する。
2. 採用方式に応じて step-scoped `env:` または OIDC token exchange step を追加する。
3. `scripts/cf.sh` が要求する env var 名 `CLOUDFLARE_API_TOKEN` は維持する（ラッパーの互換性確保のため）。
4. `permissions:` block に必要最小限の `id-token: write` / `contents: read` を追加する（OIDC 採用時）。

#### 成果物

- `outputs/phase-11/web-cd-after.yml.diff`
- `outputs/phase-11/backend-ci-after.yml.diff`

#### 完了条件

- diff レビュー上、deploy step 以外で token が参照されていない。

### Phase 3: staging 検証と redaction 確認

#### 目的

staging deploy が新方式で green になり、token 値が log に漏れていないことを確認する。

#### 手順

1. feature ブランチで `bash scripts/cf.sh deploy --dry-run --config apps/web/wrangler.toml --env staging` 相当を実行する。
2. staging deploy を実行し、`gh run view` で log を取得する。
3. log を `redaction-check` 観点で確認し、token suffix / account id が漏れていないことを検証する。

#### 成果物

- `outputs/phase-11/staging-deploy-smoke.log`（redacted）
- `outputs/phase-11/redaction-check.md`

#### 完了条件

- staging deploy が green で、redaction-check に token leak が記録されていない。

### Phase 4: production cutover と正本同期

#### 目的

production deploy へ展開し、`deployment-secrets-management.md` を正本として更新する。

#### 手順

1. owner approval を経て production deploy を新方式で実行する。
2. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に新方式と secret 命名規約を反映する更新案を作成する。
3. 旧 long-lived token の rotation / 削除タイミングを後続未タスクとして切り出す（本 task ではトリガー削除しない）。

#### 成果物

- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`

#### 完了条件

- production deploy が green で、正本仕様の更新案がレビュー可能な状態になっている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `web-cd.yml` の deploy step 以外で `CLOUDFLARE_API_TOKEN` が unavailable であることが grep evidence で示されている。
- [ ] `backend-ci.yml` の `cloudflare/wrangler-action@v3` 呼び出し 4 箇所がすべて新方式に置き換わっている。
- [ ] staging / production deploy が新方式で green になっている。

### 品質要件

- [ ] `scripts/cf.sh` 経由のローカル deploy が新 secret 名でも動作する（または変数名が維持されている）。
- [ ] redaction-check で token 値 / 部分文字列が log に出現しない。
- [ ] `permissions:` block が必要最小限に絞られている（OIDC 採用時）。

### ドキュメント要件

- [ ] `deployment-secrets-management.md` に採用方式・secret 命名規約・rotation 方針が反映されている。
- [ ] 旧 long-lived token の物理削除と 1Password 整合は別 unassigned task に切り出されている。
- [ ] `outputs/phase-12/system-spec-update-summary.md` に正本同期対象が記録されている。

---

## 6. 検証方法

### テストケース

- 改修後 workflow で `secrets.CLOUDFLARE_API_TOKEN` を build / lint step が参照していないこと。
- staging deploy が新方式で完走し、`wrangler deployments list` 相当で新 deployment が確認できること。
- production deploy log の redaction-check で token leak が検出されないこと。

### 検証手順

```bash
# deploy step 以外で token が参照されていないことを確認
grep -n "CLOUDFLARE_API_TOKEN" .github/workflows/web-cd.yml .github/workflows/backend-ci.yml

# staging dry-run（feature branch）
bash scripts/cf.sh deploy --dry-run --config apps/web/wrangler.toml --env staging

# staging deploy log の取得
gh run list --workflow=web-cd.yml --branch=dev --limit=1
gh run view <RUN_ID> --log
```

期待: `CLOUDFLARE_API_TOKEN` の参照が deploy step 直下の `env:` ブロックのみに限定され、log に token 値が含まれない。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| Cloudflare の OIDC サポートが想定より限定的で完全移行できない | 中 | 中 | step-scoped fine-grained token を fallback として準備し、hybrid 構成を採用する |
| `scripts/cf.sh` ラッパーが新 secret 名に対応せずローカル deploy が壊れる | 中 | 中 | env var 名 `CLOUDFLARE_API_TOKEN` を維持し、GitHub Secret 側だけ別名化する設計にする |
| step-scoped 化したつもりが job-level `env:` に残り全 step に露出する | 高 | 低 | PR レビューで `env:` の階層を必ず確認し、redaction-check で実 log を検証する |
| 旧 long-lived token の即時失効で進行中 deploy が落ちる | 高 | 低 | 旧 token は本 task では失効させず、別 unassigned task で stage 削除する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md`（フォーマット参考）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

### 参考資料

- GitHub Actions OIDC documentation (`id-token: write`)
- Cloudflare API Tokens / fine-grained scopes documentation
- `cloudflare/wrangler-action@v3` README
- `scripts/cf.sh` ラッパー実装（op + esbuild + mise）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | Issue #331 のスコープ内では `web-cd.yml` の Workers cutover に集中する必要があり、token 分離 workstream まで踏み込めなかった |
| 原因 | OIDC / step-scoped 化は GitHub Secrets / Cloudflare dashboard / 1Password の 3 箇所同期が必要で、Issue #331 の deploy migration 自体と独立した検証フェーズを要する |
| 対応 | Issue #331 Phase 12 で deferred 扱いとし、本 unassigned task を独立 workstream として formalize した |
| 再発防止 | Cloudflare の OIDC サポートは AWS/GCP より遅れている可能性があるため、本 task 実行時に必ず最新仕様を一次情報で再確認する。step-scoped fine-grained token を現実的な妥協案として準備し、`scripts/cf.sh` の env var 名互換性を維持する設計を既定とする |
| 参照 | `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md` |

### レビュー指摘の原文（該当する場合）

該当なし。Issue #331 Phase 12 unassigned-task-detection.md の "Deferred Operational Items" 1 行目「OIDC / step-scoped `CF_TOKEN_*` cutover」を formalize したもの。

### 補足事項

- Phase 13 の commit / PR はユーザー承認ゲートであり、本タスクの作成時点では実行しない。
- 1Password 正本との整合性は、step-scoped token を新規発行した場合のみ判断材料を作成する。整合作業自体は別 issue で扱う。
- `secrets.CLOUDFLARE_API_TOKEN` を即時無効化すると進行中の他 workflow が落ちるため、cutover は staging → production の順で段階的に行い、旧 secret の削除は別 unassigned task で扱う。
