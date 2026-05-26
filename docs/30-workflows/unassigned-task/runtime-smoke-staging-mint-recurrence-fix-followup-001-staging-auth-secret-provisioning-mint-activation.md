# STAGING_AUTH_SECRET 投入と mint path 有効化 - タスク指示書

## メタ情報

```yaml
issue_number: 916
task_id: runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation
task_name: STAGING_AUTH_SECRET 投入と mint path 有効化
category: インフラ運用 / secret 投入（実行タスク）
target_feature: runtime-smoke-staging mint path 恒久化（24h 静的 bearer 依存の解消）
priority: 高
scale: 小規模
status: 未実施
source_phase: docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/index.md（§6 スコープ外・R-5）/ reference/bearer-lifecycle-ssot.md（§6 恒久化導線）
created_date: 2026-05-24
dependencies:
  - runtime-smoke-staging-mint-recurrence-fix（鮮度ゲート・reason 細分化の dev マージ）
prerequisite_for:
  - "#899 ci-green-recovery-followup-001-static-bearer-fallback-retirement"
taskType: infra-ops
visualEvidence: NON_VISUAL
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation` |
| タスク名 | STAGING_AUTH_SECRET 投入と mint path 有効化 |
| 分類 | インフラ運用 / secret 投入（実行タスク） |
| 対象機能 | `runtime-smoke-staging / smoke` の mint path 恒久化（24h 静的 bearer 依存の解消） |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/index.md`（§6 スコープ外・根本原因 R-5）/ `reference/bearer-lifecycle-ssot.md`（§6 恒久化導線） |
| 発見日 | 2026-05-24 |
| taskType | infra-ops |
| visualEvidence | NON_VISUAL |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`runtime-smoke-staging / smoke` は staging API に「会員になりすました通行証（bearer = 署名付き session JWT）」を送り、本番同等環境で API が正しく応答するかを毎回確認する CI チェックである。この通行証には 2 種類ある。

- **静的 bearer**（手動で GitHub 環境 secret に登録）: 有効期限が **24 時間**。登録から 1 日で必ず期限切れになる。
- **minted bearer**（CI が実行のたびに自動発行）: 有効期限 **10 分**。毎回発行されるので実質期限切れしない。

中学生向けに言い直すと、静的 bearer は「1 日で使えなくなる紙のチケット」、minted bearer は「改札を通るたびに自動で刷り直されるチケット」である。後者にすれば「期限切れで通れない」事故は原理的に起きない。

その「自動で刷り直す」仕組み（mint path）を動かすには、刷り直しに使う鍵 `STAGING_AUTH_SECRET` を GitHub 環境（`staging-runtime-smoke`）に登録しておく必要がある。本タスクはこの鍵を登録し、自動発行を実際に有効化する作業である。

### 1.2 問題点・課題

- 親タスク #907（`ci-green-recovery-smoke-coverage-shard`）で mint path の実装は入ったが、`STAGING_AUTH_SECRET` が `staging-runtime-smoke` 環境に**未登録**のため、mint step は `if: env.STAGING_AUTH_SECRET != ''` で永久に skip され **dead code 化**している（根本原因 R-1）。
- mint が skip されると 24h TTL の静的 bearer に**サイレント fallback** し、登録から 24 時間で必ず `exp <= now` となって 401 へ退行する（R-2）。
- 親 `runtime-smoke-staging-mint-recurrence-fix` で鮮度ゲート（AC-1）・reason 細分化（AC-3）・auth-path 可視化（AC-2）を入れたが、これらは**「サイレント再発を loud fail に変える」検知層**であって、24h 失効の**根治ではない**。mint path を有効化しない限り、鮮度ゲートが失効 6h 前に loud fail し続ける。
- 恒久対策の最後の 1 手（secret 投入）が「user-gated の手動ステップ」として先送りされたまま、**どのタスク台帳にも載っていない**（R-5）。

### 1.3 放置した場合の影響

- 鮮度ゲートが dev マージ後に有効化されるため、`STAGING_AUTH_SECRET` 未投入のままだと **24h 周期で `runtime smoke staging / smoke` が必ず loud fail** する（silent → loud に変わるが失敗は止まらない）。
- `runtime smoke staging / smoke` は `dev` / `main` の required status check 候補であり、失敗が続くと CI gate を恒常的にブロックし、マージ運用が阻害される。
- **最重要**: 本タスクを台帳化せずに「runbook に書いたから OK」とすると、#907 → #907 の手動ステップ未実施 → 再発、という **R-5 の連鎖をそのまま再演する**。本タスクの存在自体が R-5 の再発防止である。
- mint 恒久化が完了しないため、後続の #899（静的 bearer fallback 撤去）に着手できない（本タスクが #899 の前提）。

---

## 2. 何を達成するか（What）

### 2.1 目的

`STAGING_AUTH_SECRET` を `staging-runtime-smoke` 環境へ投入して mint path を有効化し、`runtime smoke staging / smoke` が静的 24h bearer に依存せず毎回 minted bearer（TTL=600s）で通る恒久状態にする。

### 2.2 最終ゴール

- `staging-runtime-smoke` 環境に `STAGING_AUTH_SECRET` が登録され、その値が staging API の `AUTH_SECRET`（Cloudflare secret）と**同一**である（SSOT §3 の同期不変条件を満たす）。
- workflow 実行時に mint step（`if: env.STAGING_AUTH_SECRET != ''`）が有効化され、auth-path 可視化（AC-2）が `minted` を出力する。
- 鮮度ゲート（AC-1）が minted bearer（exp 未来）に対し PASS し、`runtime smoke staging / smoke` が green になる。

### 2.3 スコープ

#### 含むもの

- staging API `AUTH_SECRET`（Cloudflare secret）の現行値の正本（1Password）参照の確定。
- `STAGING_AUTH_SECRET` を `staging-runtime-smoke` 環境 secret へ投入（`gh secret set --env staging-runtime-smoke`、値は op 参照経由）。
- 投入後の mint path 有効化確認（auth-path notice = `minted`）。
- 鮮度ゲート PASS と `runtime smoke staging / smoke` green の runtime evidence 取得。
- SSOT §6 恒久化手順の「実施済み」反映と本タスクの close-out。

#### 含まないもの

- 静的 bearer fallback 経路の**物理削除**（#899 で対応。本タスクは fallback を維持したまま mint を有効化する）。
- staging API `AUTH_SECRET` binding 自体の再構成（`task-staging-auth-secret-binding-recovery-001` で完了済み。本タスクは値を読み出して同期するだけで API 側を変更しない）。
- 鮮度ゲート / reason 細分化 / mint 自己検証のコード変更（親 `runtime-smoke-staging-mint-recurrence-fix` で実装済み）。
- D1 schema / Google Form 仕様 / 新規 API endpoint（CLAUDE.md 不変条件）。
- production 環境の mint 化（staging 限定。production は別途判断）。

### 2.4 成果物

- `staging-runtime-smoke` 環境への `STAGING_AUTH_SECRET` 投入完了エビデンス（`gh api .../environments/staging-runtime-smoke/secrets` の name 一覧出力。値は出力しない）。
- `runtime smoke staging / smoke` の green run conclusion（auth-path = `minted`）。
- `reference/bearer-lifecycle-ssot.md` §6 への「投入実施済み」反映（実値は記載しない）。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親 `runtime-smoke-staging-mint-recurrence-fix`（鮮度ゲート・reason 細分化・mint 自己検証）が `dev` にマージ済みであること。
- staging API の `AUTH_SECRET`（Cloudflare secret）が投入済みで、その正本値が 1Password に保管されていること（`task-staging-auth-secret-binding-recovery-001` 完了前提）。
- `gh` CLI で対象リポジトリの Environment secret 設定権限が利用できること。
- 1Password CLI（`op`）で Cloudflare/Auth secret の正本 Item を参照できること。

### 3.2 依存タスク

- 完了依存: `runtime-smoke-staging-mint-recurrence-fix`（検知層の実装）/ `task-staging-auth-secret-binding-recovery-001`（API 側 binding）。
- 後続: **#899**（`ci-green-recovery-followup-001-static-bearer-fallback-retirement`）— 本タスク完了後、mint 安定を確認してから static fallback を撤去する。

### 3.3 必要な知識

- GitHub Environment secret（`staging-runtime-smoke`）と repository secret の違い。
- `gh secret set <NAME> --env <ENV>` / `gh api repos/<owner>/<repo>/environments/<env>/secrets` の使い方。
- HS256 session JWT の署名鍵＝検証鍵が一致しないと 401 `auth-secret-drift` になること（SSOT §3）。
- secret 実値・JWT 文字列・署名鍵を log / docs / コード / commit message に転記しない運用（CLAUDE.md シークレット管理）。

### 3.4 推奨アプローチ

SSOT §3 の同期不変条件（`STAGING_AUTH_SECRET` ≡ staging API `AUTH_SECRET`）を最優先で守る。値はターミナルにも残さず、`gh secret set` の標準入力へ op 参照経由で渡す。投入後はまず auth-path 可視化が `minted` に変わることを確認し、次に鮮度ゲート PASS、最後に smoke green の順で段階確認する。値の検証は「smoke が green か」で行い、JWT を出力して目視しない。

---

## 4. 実行手順

### Phase構成

1. Phase 1: 前提確認（親マージ済み・API 側 AUTH_SECRET 投入済み）
2. Phase 2: `STAGING_AUTH_SECRET` 投入（値は staging API `AUTH_SECRET` と同一）
3. Phase 3: mint path 有効化・鮮度ゲート・smoke green の runtime evidence 取得
4. Phase 4: SSOT §6 反映と close-out

### Phase 1: 前提確認

#### 目的

投入の前提（検知層マージ済み・API 側鍵投入済み・同期元の特定）を確定する。

#### 手順

1. 親 `runtime-smoke-staging-mint-recurrence-fix` が `dev` にマージ済みであること（鮮度ゲート step が workflow に存在すること）を確認する。
2. staging API `AUTH_SECRET` の正本（1Password Item / Cloudflare secret 名）を特定する（実値は表示しない）。
3. `staging-runtime-smoke` 環境に `STAGING_AUTH_SECRET` が未登録であることを `gh api .../environments/staging-runtime-smoke/secrets --jq '.secrets[].name'` で確認する。

#### 成果物

- 前提確認メモ（同期元 Item 参照名のみ。実値なし）。

#### 完了条件

- 検知層マージ済み・API 側鍵投入済み・同期元参照が確定している。

### Phase 2: `STAGING_AUTH_SECRET` 投入

#### 目的

`staging-runtime-smoke` 環境に staging API `AUTH_SECRET` と同一値の `STAGING_AUTH_SECRET` を登録する。

#### 手順

1. 1Password から staging `AUTH_SECRET` の正本値を op 参照で取得し、標準入力経由で投入する（値を引数・echo・ファイルに残さない）:
   `op read 'op://<Vault>/<Item>/<Field>' | gh secret set STAGING_AUTH_SECRET --env staging-runtime-smoke`
2. 投入確認: `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets[].name'` に `STAGING_AUTH_SECRET` が含まれることを確認する（値は返らない）。

#### 成果物

- secret name 一覧出力（`STAGING_AUTH_SECRET` 登録確認・値なし）。

#### 完了条件

- `STAGING_AUTH_SECRET` が `staging-runtime-smoke` 環境に登録されている。
- 投入過程で実値が log / 履歴 / ファイルに残っていない。

### Phase 3: mint path 有効化・smoke green の runtime evidence 取得

#### 目的

mint path が有効化され、鮮度ゲート PASS・smoke green になることを実環境で確認する。

#### 手順

1. `runtime-smoke-staging` workflow を `dev` に対して再実行する（dev push または `gh workflow run`）。
2. auth-path 可視化 step（AC-2）が `runtime-smoke auth path: minted` を出力することを確認する（`static-fallback` でないこと）。
3. 鮮度ゲート step（AC-1）が minted bearer（exp 未来・TTL=600s）に対し exit 0（PASS）であることを確認する。
4. `runtime smoke staging / smoke` job conclusion が success であることを確認する。

#### 成果物

- workflow run conclusion = success のログ参照（auth path = `minted` / 鮮度ゲート PASS / 401 0 件）。

#### 完了条件

- auth-path = `minted`、鮮度ゲート PASS、smoke green が同一 run で確認できる。

### Phase 4: SSOT 反映と close-out

#### 目的

恒久化完了を SSOT に反映し、本タスクと後続 #899 の依存を更新する。

#### 手順

1. `reference/bearer-lifecycle-ssot.md` §6 のステップ 1 を「投入実施済み（YYYY-MM-DD）」へ更新する（実値は記載しない）。
2. 本未タスクの status を `完了` に更新し、対応 Issue を close する。
3. #899（static fallback 撤去）の前提が満たされたことを #899 にコメントする。

#### 成果物

- SSOT §6 の実施済み反映。
- 本タスク close-out 記録。

#### 完了条件

- SSOT が恒久化実施済みを反映し、#899 へ前提充足が連携されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `STAGING_AUTH_SECRET` が `staging-runtime-smoke` 環境 secret に登録されている。
- [ ] 投入値が staging API `AUTH_SECRET`（Cloudflare secret）と同一である（smoke green で間接確認）。
- [ ] workflow の auth-path 可視化が `minted` を出力する。
- [ ] 鮮度ゲートが minted bearer に対し PASS し、`runtime smoke staging / smoke` が green である。

### 品質要件

- [ ] secret 実値・JWT 文字列・署名鍵が log / docs / コード / commit message / シェル履歴に一切残っていない。
- [ ] 静的 bearer fallback 経路（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`）を削除していない（#899 の責務）。
- [ ] required status check の context 名（`runtime smoke staging / smoke`）を変更していない。

### ドキュメント要件

- [ ] `reference/bearer-lifecycle-ssot.md` §6 が恒久化実施済みを反映している。
- [ ] #899 に前提充足が連携されている。

---

## 6. 検証方法

### テストケース

- 投入確認: `staging-runtime-smoke` 環境 secret name 一覧に `STAGING_AUTH_SECRET` が含まれる（値は返らない）。
- mint 有効化: auth-path 可視化 step が `minted` を出力する。
- 鮮度ゲート: minted bearer（exp 未来）に対し exit 0。
- smoke green: `runtime smoke staging / smoke` job conclusion = success、401 reason 0 件。

### 検証手順

```bash
# 投入確認（値は返らない）
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | grep -x STAGING_AUTH_SECRET

# auth-path = minted / smoke green の確認（最新 run）
gh run list --workflow runtime-smoke-staging.yml --branch dev --limit 1 \
  --json conclusion,databaseId
# → conclusion=success を確認し、当該 run のログで "auth path: minted" を確認

# SSOT に実 secret 様文字列が混入していないこと
grep -nE '(eyJ[A-Za-z0-9_-]{10,}|[A-Fa-f0-9]{32,})' \
  docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md \
  || echo "OK: no secret-like literals"
```

期待: `STAGING_AUTH_SECRET` が登録済み、最新 run が success かつ auth path = `minted`、SSOT に secret 様文字列が 0 件。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 投入値が staging API `AUTH_SECRET` と不一致（署名鍵 drift） | 高 | 中 | 投入後 smoke が 401 `auth-secret-drift` を出したら SSOT §3 の不変条件に従い両 secret を同一値へ再同期する。本タスクは API 側を読み出して同期するのみで binding を変更しない |
| 投入過程で secret 実値が log / シェル履歴 / ファイルに残る | 高 | 中 | `op read ... \| gh secret set` の標準入力経由のみを使い、引数・echo・一時ファイルに値を置かない。投入後 JWT を出力して目視しない |
| static fallback を併存させたまま mint が不安定で fallback に戻る | 中 | 低 | 本タスクは fallback 維持（AC-6）。mint 安定を smoke green 連続で確認してから #899（fallback 撤去）へ進む |
| 親タスク未マージのまま投入し鮮度ゲートが存在しない状態で運用 | 中 | 低 | Phase 1 で親マージ済みを必須確認する |
| 本タスクが再び user-gated のまま台帳から漏れて忘却される（R-5 再演） | 高 | 中 | 本タスクを Issue 化して台帳追跡し、鮮度ゲートの 24h 周期 loud fail を「投入を促す強制トリガー」として機能させる |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/index.md`（§2 根本原因 R-1/R-5、§6 スコープ外）
- `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`（§3 同期不変条件、§6 恒久化導線）
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`（投入手順）
- `.github/workflows/runtime-smoke-staging.yml`（mint step `if: env.STAGING_AUTH_SECRET != ''`）
- `scripts/smoke/mint-staging-bearers.mts`（mint 実装・self-verify）
- `scripts/smoke/bearer-freshness-gate.mts`（鮮度ゲート）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

### 関連 Issue

- **#899** `ci-green-recovery-followup-001-static-bearer-fallback-retirement`（本タスクの後続。mint 恒久化後に static fallback を撤去）

### 参考資料

- GitHub Docs: Environment secrets and deployment protection rules
- 1Password CLI `op read` / `op run` 経由の secret 注入運用（`scripts/with-env.sh` / `scripts/cf.sh`）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | `runtime smoke staging / smoke` が `dev` マージのたびに `http=401 ... reason=auth-token-invalid-or-expired` で繰り返し失敗し、過去 6 回の recovery を要した。 |
| 原因 | 恒久対策（mint path）が #907 で実装されたが、有効化に必要な `STAGING_AUTH_SECRET` 投入が **user-gated の手動ステップ**として先送りされ、**どのタスク台帳にも載らずに忘却**された（R-5）。mint が dead-code 化し、24h TTL の静的 bearer にサイレント fallback して 24h 周期で失効した。 |
| 対応 | 親タスクで鮮度ゲート・reason 細分化・auth-path 可視化を実装し、サイレント再発を loud fail に変えた。ただしこれは検知層であり、根治（mint 有効化）は本タスクに分離した。 |
| 再発防止 | **「user-gated だから未タスク化しない」判断こそが R-5 の発生原因**である。残作業の secret 投入を承認境界として流さず、本タスクとして台帳化・Issue 化して追跡する。鮮度ゲートの 24h 周期 loud fail を「投入を促す強制トリガー」として併用し、忘却を構造的に防ぐ。 |
| 参照 | `runtime-smoke-staging-mint-recurrence-fix/index.md` §2 R-5、`reference/bearer-lifecycle-ssot.md` §6 |

### レビュー指摘の原文（該当する場合）

親 `outputs/phase-12/unassigned-task-detection.md` は本項目を「外部操作（GitHub secret 投入）は user-gated であり承認境界として扱う」として 0 件判定していた。本未タスクは、その判断が根本原因 R-5（user-gated 手動ステップの台帳漏れ → 忘却 → 再発）を再演するリスクを持つため、ユーザー承認のうえ formalize したものである。実行自体は引き続き user-gated だが、**追跡対象としての台帳化**を承認境界と分離する。

### 補足事項

- 実行（secret 投入・workflow 再実行）は user-gated であり、本タスク（spec 作成）時点では実行しない。
- 本タスクは #899（static fallback 撤去）の**前提タスク**であり、mint 安定確認後に #899 へ着手する依存順序を持つ。
- Phase 13（commit / push / PR）はユーザー承認ゲートであり、本タスク作成時点では実行しない。
