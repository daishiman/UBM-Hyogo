# Issue #640 Followup 001 Cloudflare GitHub Actions OIDC Full Migration - タスク指示書

## メタ情報

```yaml
task_id: issue-640-followup-001-oidc-full-migration
title: Cloudflare GitHub Actions OIDC Full Migration
category: 改善
target_feature: GitHub Actions Cloudflare deploy credential surface
priority: 中
scale: 中規模
status: 未実施
source_phase: docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md
source_workflow: docs/30-workflows/issue-640-oidc-cf-token-cutover/
github_issue: 717
created_date: 2026-05-14
taskType: implementation
visualEvidence: NON_VISUAL
dependencies:
  - issue-640-oidc-cf-token-cutover (staging/production runtime evidence)
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-640-followup-001-oidc-full-migration` |
| タスク名 | Cloudflare GitHub Actions OIDC Full Migration |
| 分類 | 改善 |
| 対象機能 | GitHub Actions Cloudflare deploy credential surface |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-14 |
| 親 issue | Issue #640 (step-scoped `CLOUDFLARE_API_TOKEN` cutover) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| dependencies | `issue-640-oidc-cf-token-cutover` の staging / production runtime evidence 取得後 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #640 では `.github/workflows/web-cd.yml` における Cloudflare deploy credential を **step-scoped** `CLOUDFLARE_API_TOKEN` に絞り込み、build / lint 等の他 step に token が漏れない構成へ移行した。一方で、credential 自体は依然として GitHub Repository / Environment Secrets に保管された long-lived API Token であり、Cloudflare account scope の Workers Scripts:Edit / D1:Edit / Pages:Edit といった広い blast radius を維持している。

Cloudflare は GitHub Actions 向けの OIDC (workload identity federation) サポートを段階的に拡充している領域があり、AWS / GCP と比較して実装が遅れている部分がある。Issue #640 の Phase 12 では、OIDC 完全移行は Cloudflare 側のサポート再検証および claim mapping / rollback path の確定が必須であるため、本 cycle のスコープ外として後続 unassigned task に切り出された。

### 1.2 問題点・課題

- step-scoped token 化により blast radius は step 単位に絞られたが、token そのものは long-lived のままで GitHub Secrets / Cloudflare dashboard / 1Password の 3 箇所同期コストが残る。
- token rotation SOP 発動時のオペレーションコストが下がっていない。
- `id-token: write` permission を使った OIDC token exchange の subject claim 制限・branch / environment 条件 pin が未設計のままで、将来的に OIDC 化する際の trust boundary が不明確。
- Cloudflare 公式 OIDC サポート状況が Issue #640 着手時点と乖離している可能性があり、本 task 実行時に再検証が必要。

### 1.3 放置した場合の影響

- long-lived token の漏洩 surface が残置され、rotation 発動時の影響範囲が読みにくい状態が継続する。
- セキュリティレビュー時に「step-scoped 化止まりで credential 寿命の根本対策が未着手」と再指摘されるリスクが残る。
- OIDC 移行コストが累積し、後続 issue に分散して所有者不在になる。
- 1Password / Cloudflare dashboard / GitHub Secrets の 3 箇所同期運用が固定化され、後の自動化機会を逃す。

---

## 2. 何を達成するか（What）

### 2.1 目的

`.github/workflows/web-cd.yml`（および同等の Cloudflare deploy 経路を持つ workflow）の Cloudflare deploy credential を、Cloudflare 公式に支持された OIDC / workload identity federation ベースの認証に完全移行し、long-lived API Token への依存を staging から段階的に解消する。同時に、Issue #640 で導入した step-scoped token 経路は rollback path として明示的に温存する。

### 2.2 最終ゴール

- Cloudflare 公式の OIDC サポート最新状況が一次情報で確認され、判断材料が文書化されている。
- staging 限定で OIDC ベースの deploy が green になり、redaction evidence と permission 観点で step-scoped token 方式と同等以上であることが示されている。
- `id-token: write` permission の subject claim 制限（`repo`, `ref`, `environment` 等の条件）が pin されている。
- production rollout の段階手順と rollback path（step-scoped token への即時復帰）が設計されている。
- `aiworkflow-requirements` skill の `deployment-secrets-management.md` に OIDC 採用方式・claim mapping・rollback 手順が正本として反映されている。

### 2.3 スコープ（含むもの/含まないもの）

#### 含むもの

- Cloudflare 公式 OIDC / workload identity federation サポートの再検証（一次情報ベース）。
- `.github/workflows/web-cd.yml` の staging 限定 OIDC deploy proof（feature branch / staging environment 限定）。
- `permissions: id-token: write` を必要な job だけに追加し、subject claim を `ref` / `environment` で pin する設計。
- production rollout の段階手順（staging green 維持期間・cutover 判断ゲート）の設計文書化。
- rollback path として Issue #640 で導入済みの step-scoped `CLOUDFLARE_API_TOKEN` 経路を温存する条件と切り戻し手順の整理。
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 更新案の作成。

#### 含まないもの

- Cloudflare dashboard 上での legacy API Token 物理失効（`issue-640-followup-002-legacy-token-revocation` が所有）。
- `apps/api` 側の D1 token cutover 全般。
- 1Password 正本の構造変更本体（参照更新の判断材料作成にとどめる）。
- HEALTH_DB_TOKEN 等、他 rotation SOP 文書の本体改訂。
- `scripts/cf.sh` ラッパー仕様変更（env var 名 `CLOUDFLARE_API_TOKEN` の互換性は維持する）。

### 2.4 成果物

- 後続 workflow の `outputs/phase-11/cloudflare-oidc-support-revalidation.md`（一次情報サマリ）
- 後続 workflow の `outputs/phase-11/web-cd-after.yml.diff`（staging OIDC proof 用 diff）
- 後続 workflow の `outputs/phase-11/staging-oidc-deploy.log`（redacted runtime evidence）
- 後続 workflow の `outputs/phase-11/id-token-claim-design.md`（subject claim 制限の pin 設計）
- 後続 workflow の `outputs/phase-11/production-rollout-and-rollback.md`
- 後続 workflow の `outputs/phase-12/system-spec-update-summary.md`（`deployment-secrets-management.md` 同期計画）
- 後続 workflow の `outputs/phase-12/unassigned-task-detection.md`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #640 (step-scoped `CLOUDFLARE_API_TOKEN` cutover) の staging / production runtime evidence が取得済みで、step-scoped token 経路が安定稼働していること。
- Cloudflare account に対し OIDC / workload identity federation を有効化、または相当する federated credential を発行できる owner 権限がある。
- GitHub repository に `id-token: write` permission を job 単位で付与できる owner 認証がある。
- staging Workers project に対し、OIDC 経由で deploy 権限を持つ Cloudflare 側 principal（role / token policy）を発行できる。
- rollback 用に Issue #640 で構築した step-scoped `CLOUDFLARE_API_TOKEN` 経路がそのまま再活性化できる状態に保たれている。

### 3.2 アプローチ

1. **Cloudflare 公式 OIDC サポートの再検証**: Cloudflare 公式ドキュメント / changelog / `cloudflare/wrangler-action` 最新 release の `id-token` 入力対応状況を一次情報で確認する。実行時点の最新仕様を本文中で記録し、Issue #640 着手時点との差分を明示する。
2. **claim 設計**: `id-token: write` を付与する job を deploy job 単位に限定し、Cloudflare 側で受け入れる subject claim を `repo`、`ref` (例: `refs/heads/dev`)、`environment` (例: `staging`) で pin する設計を立てる。
3. **staging 限定 proof**: feature branch から staging environment に対し OIDC deploy を 1 回実施し、redaction-check / permission 観察 / deploy success を記録する。
4. **rollback path 温存**: Issue #640 の step-scoped token 経路（`secrets.CLOUDFLARE_API_TOKEN`）を削除せず、`id-token` 経路が失敗した場合に即時切り戻せる二重実装期間を設ける。
5. **production rollout 設計**: staging で十分な観察期間を経た後、production environment に対しても OIDC subject claim pin と組み合わせて段階移行する手順を文書化する（本タスクでは production 切替は実行しない）。
6. **正本同期**: `aiworkflow-requirements` skill の `deployment-secrets-management.md` に OIDC 方式・claim mapping・rollback 条件を反映する更新案を作成する。

---

## 4. 実行手順

### Phase構成

1. Phase 1: Cloudflare OIDC サポート再検証
2. Phase 2: claim 設計と staging 用 workflow diff の作成
3. Phase 3: staging 限定 OIDC deploy proof
4. Phase 4: production rollout 設計と正本同期計画

### Phase 1: Cloudflare OIDC サポート再検証

#### 目的

実行時点での Cloudflare 公式 OIDC / workload identity federation サポート状況を確定し、`wrangler-action` 等の action 側対応も含めて採用可否を判断する。

#### 手順

1. Cloudflare 公式ドキュメント・changelog で OIDC / workload identity federation サポートを確認する（実行時点で最新を一次情報から取得する）。
2. `cloudflare/wrangler-action` 最新 release が `id-token` / OIDC 入力に対応しているかを確認する。
3. 対応していない場合は手動 OIDC token exchange step の実装可能性（CF API endpoint・必要 claim）を整理する。
4. Issue #640 の `outputs/phase-12/system-spec-update-summary.md` および `deployment-secrets-management.md` で前提となっている step-scoped token 経路との差分を整理する。

#### 成果物

- `outputs/phase-11/cloudflare-oidc-support-revalidation.md`

#### 完了条件

- 採用可否（OIDC 完全移行 / 段階移行 / 現時点では延期）が一次情報ベースで判定されている。
- `wrangler-action` 対応状況、必要 claim、必要 IAM 相当設定が記録されている。

### Phase 2: claim 設計と staging 用 workflow diff の作成

#### 目的

`id-token: write` 付与範囲と subject claim の pin 条件を設計し、`.github/workflows/web-cd.yml` の staging deploy 経路だけを OIDC へ差し替える diff を作成する。

#### 手順

1. `id-token: write` permission を staging deploy job 単位だけに付与する設計案を作成する。
2. Cloudflare 側で受け入れる subject claim を `repo`, `ref`, `environment` で pin する条件を明文化する。
3. `web-cd.yml` の staging deploy step を OIDC token exchange + Cloudflare deploy へ置き換える diff を作成する。production deploy step は本 phase では変更しない。
4. 既存の step-scoped `secrets.CLOUDFLARE_API_TOKEN` 参照を **削除せず保持**し、rollback path として温存する条件を diff コメント / PR description に明記する設計にする。
5. `scripts/cf.sh` 側は env var 名 `CLOUDFLARE_API_TOKEN` への互換性を維持し、ローカル deploy 経路の挙動が変わらないことを設計上担保する。

#### 成果物

- `outputs/phase-11/id-token-claim-design.md`
- `outputs/phase-11/web-cd-after.yml.diff`

#### 完了条件

- `id-token: write` の付与範囲が deploy job 単位に限定されている。
- subject claim の pin 条件が `ref` / `environment` で明示されている。
- diff レビュー上、production deploy 経路と rollback path が破壊されていない。

### Phase 3: staging 限定 OIDC deploy proof

#### 目的

staging environment 限定で OIDC deploy を実 run し、deploy success・log redaction・permission scope の観点で step-scoped token 方式と同等以上であることを示す。

#### 手順

1. feature branch から staging environment への deploy を実行する。
2. `gh run view <RUN_ID> --log` で log を取得し、redaction-check 観点で OIDC token / subject claim 値 / account id の漏洩がないことを確認する。
3. 取得 evidence は実行時に実 run id を本文に記録する（事前に行番号や run id を仮置きしない）。
4. step-scoped token 方式での同等 staging deploy log（Issue #640 の evidence）と比較し、permission scope の差分を要約する。

#### 成果物

- `outputs/phase-11/staging-oidc-deploy.log`（redacted）
- 上記成果物中に Issue #640 step-scoped token 方式との比較セクションを含める。

#### 完了条件

- staging deploy が新方式で green。
- redaction-check で OIDC token / claim 値の log 漏洩が記録されていない。
- step-scoped token 方式に対する permission scope 上の優位性（または同等性）が記録されている。

### Phase 4: production rollout 設計と正本同期計画

#### 目的

production environment への展開手順と rollback path を設計し、`aiworkflow-requirements` skill の正本仕様への反映計画を作成する。本 phase では production deploy は実行しない。

#### 手順

1. staging proof を踏まえ、production environment に OIDC を適用する段階手順を設計する（staging 安定期間、cutover 判断ゲート、observation window）。
2. rollback path として、Issue #640 step-scoped `CLOUDFLARE_API_TOKEN` 経路への即時切り戻し手順を明文化する。
3. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に追加する更新案（OIDC 採用方式・claim mapping・rollback 条件）をドラフトする。
4. 後続未タスクとして、legacy long-lived token 物理失効（`issue-640-followup-002-legacy-token-revocation`）との依存順を再確認する。

#### 成果物

- `outputs/phase-11/production-rollout-and-rollback.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`

#### 完了条件

- production rollout 手順と rollback path が文書化されている。
- 正本同期対象が `system-spec-update-summary.md` に列挙されている。
- legacy token 物理失効タスクとの実行順制約が明示されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] Cloudflare 公式 OIDC サポート状況が一次情報で再検証され、採用可否が記録されている。
- [ ] `.github/workflows/web-cd.yml` の staging deploy 経路が OIDC ベースで green になっている。
- [ ] `id-token: write` permission が deploy job 単位に絞られ、subject claim が `ref` / `environment` で pin されている。
- [ ] step-scoped `CLOUDFLARE_API_TOKEN` 経路が rollback path として温存されている。

### 品質要件

- [ ] redaction-check で OIDC token / claim 値 / account id が log に出現しない。
- [ ] staging proof で permission scope が step-scoped token 方式と同等以上であることが示されている。
- [ ] `scripts/cf.sh` 経由のローカル deploy 互換性が壊れていない（env var 名 `CLOUDFLARE_API_TOKEN` 維持）。

### ドキュメント要件

- [ ] `deployment-secrets-management.md` 更新案に OIDC 採用方式・claim mapping・rollback 条件が含まれている。
- [ ] production rollout 手順と rollback path が成果物として残されている。
- [ ] legacy token 物理失効タスクとの依存順が `unassigned-task-detection.md` に明示されている。
- [ ] `outputs/phase-12/system-spec-update-summary.md` に正本同期対象が列挙されている。

---

## 6. 検証方法

### テストケース

- staging environment への OIDC deploy が green で完走すること。
- `gh run view` log に OIDC token / subject claim 実値が出現しないこと。
- workflow yml grep で、`id-token: write` が staging deploy job 単位以外に拡散していないこと。
- step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路が削除されておらず、rollback 切り戻しが可能な状態であること。

### 検証手順

```bash
# id-token: write の付与範囲を確認（実行時に grep)
# Cloudflare deploy job 単位に限定されていることを目視確認する

# staging 限定 OIDC deploy 実行（実行時に実 run id を本文に追記する想定）
# gh run list --workflow=web-cd.yml --branch=<feature-branch> --limit=1
# gh run view <RUN_ID> --log

# redaction-check
# bash scripts/redaction-check.sh --log <log-path> --account-id <staging-account-id>
```

期待: staging OIDC deploy が green、log に token / claim 漏洩なし、`id-token: write` の付与範囲が deploy job 単位、step-scoped token 経路が rollback path として温存されている。

> 注: 実 run id や grep の行番号は本タスク作成時点では推測しない。実行時に確認した値を成果物本文へ追記する。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| Cloudflare の OIDC サポートが想定より限定的で完全移行が現実的でない | 中 | 中 | Phase 1 一次情報ベースで判定し、必要に応じ段階移行 / 延期判断を成果物に明示する。step-scoped token 経路を rollback path として温存する |
| `id-token: write` の付与範囲が広がり workflow trust boundary が緩む | 高 | 中 | job 単位付与・subject claim を `ref` / `environment` で pin・PR diff で permission 階層を必ず確認 |
| OIDC 切替で staging deploy が壊れる | 中 | 中 | staging 限定 proof を先行・rollback path（step-scoped token）を温存して即時復帰可能にする |
| `scripts/cf.sh` ラッパーの env var 名前提が壊れる | 中 | 低 | env var 名 `CLOUDFLARE_API_TOKEN` を維持する設計を Phase 2 で確定し、GitHub Actions 側 OIDC token を同名 env に渡す |
| legacy token 物理失効を先行させてしまい rollback できなくなる | 高 | 低 | 物理失効は `issue-640-followup-002-legacy-token-revocation` が所有・本タスクでは触らない。依存順を成果物に明示 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/unassigned-task/issue-331-followup-003-oidc-step-scoped-cf-token-cutover.md`（前身タスク・consumed）
- `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`（依存後続タスク）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.github/workflows/web-cd.yml`

### 参考資料

- GitHub Actions OIDC documentation (`id-token: write` / `getIDToken()` / subject claim formats)
- Cloudflare 公式: API Tokens / workload identity / OIDC サポート最新ドキュメント（実行時に再取得）
- `cloudflare/wrangler-action` 最新 release notes
- `scripts/cf.sh` ラッパー実装（op + esbuild + mise）

---

## 9. 備考（苦戦箇所もここに含める）

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | Issue #640 の cycle 内では Cloudflare deploy が repository / environment secrets 依存のままで、`id-token: write` への置換に踏み込めなかった |
| 原因 | Cloudflare 公式 OIDC サポートの範囲・必要 claim・`wrangler-action` 側の対応状況が Issue #640 着手時点では再検証できておらず、claim mapping と rollback path が確定するまで long-lived API token を OIDC で置換できない |
| 対応 | Issue #640 では step-scoped `CLOUDFLARE_API_TOKEN` 経路で blast radius を step 単位に絞るところまでをスコープとし、OIDC 完全移行は本 unassigned task に分離。staging 限定 proof と rollback path 温存を前提に段階移行する設計とした |
| 再発防止 | Cloudflare の OIDC サポートは AWS/GCP より遅れている領域がある可能性があるため、本タスク実行時に Phase 1 で一次情報を必ず再取得する。`id-token: write` の付与範囲は job 単位に絞り、subject claim を `ref` / `environment` で pin する設計を既定とする。Issue #640 で導入済みの step-scoped token 経路は OIDC 安定化が確認できるまで rollback path として削除しない |
| 参照 | `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md` / `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/system-spec-update-summary.md` |

### レビュー指摘の原文（該当する場合）

該当なし。Issue #640 Phase 12 `unassigned-task-detection.md` の "Cloudflare OIDC full migration" 行を formalize したもの。

### 補足事項

- Phase 13 の commit / PR はユーザー承認ゲートであり、本タスクの作成時点では実行しない。
- production rollout 実施および legacy long-lived token の物理失効は本タスクのスコープ外。前者は本タスク内で **設計** のみ、後者は `issue-640-followup-002-legacy-token-revocation` に委譲する。
- 1Password 正本との整合作業は別 issue で扱う。本タスクでは参照更新の判断材料を作成するにとどめる。
- `scripts/cf.sh` の env var 名 `CLOUDFLARE_API_TOKEN` 互換性はローカル deploy 経路の安定性のため維持を既定とする。
