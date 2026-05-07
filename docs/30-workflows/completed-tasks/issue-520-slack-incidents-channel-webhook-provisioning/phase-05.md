# Phase 5: 実装ランブック — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜4 の AC / G1〜G4 / テスト戦略を踏まえ、Phase 11 で G1〜G4 を通過させながら発火する **手動 / 半自動オペレーション手順** を 1 サイクルでなぞれる runbook 形式で確定する。本 Phase は仕様確定のみ（実 channel 作成 / webhook 発行 / secret 投入 / smoke 発火・commit / push / PR は Phase 11 / Phase 13）。

> **機密保持原則**: 本ランブックには webhook URL 実値・token 値・workspace 識別子の path token を一切記載しない。記録可能な値は `<webhook-url-from-1password>` プレースホルダまたは `op://...` 参照記法のみ。

## 入力

- Phase 1〜4 確定アウトプット
- `scripts/cf.sh`（Cloudflare CLI ラッパー / op 経由 token 注入）
- `.env.example`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md`

## 0. 事前準備

| 項目 | 確認方法 | DoD |
| --- | --- | --- |
| Slack workspace admin 権限 | Slack Web UI で `Settings & administration` → `Workspace settings` が開けること | admin と確認 |
| Cloudflare API token | `bash scripts/cf.sh whoami` で account email が出力されること（`wrangler` 直接実行禁止） | whoami 成功 |
| 1Password CLI 認証 | `op vault list` で `UBM-Hyogo-Production` / `UBM-Hyogo-Staging` が見えること | vault list 成功 |
| GitHub CLI 認証 | `gh auth status` で `daishiman/UBM-Hyogo` への write 権限確認 | auth status PASS |
| 作業ブランチ | feat/issue-520 ブランチに居ること | `git branch --show-current` |
| Node 環境 | `mise exec -- node -v` が `v24.15.0` | mise OK |

事前準備が 1 つでも欠けたら **Phase 11 着手禁止**。

---

## Step A: Slack channel `ubm-hyogo-incidents` 作成（G1）

| 項目 | 内容 |
| --- | --- |
| 公開/非公開 | **非公開（Private channel）** を既定とする。incident 情報には member PII を一時的に含む可能性があるため。Slack 内の admin がメンバー追加で運用する |
| 招待者リスト | workspace owner / admin と incident 一次対応者（本 MVP では 1 名から開始可） |
| retention 設定 | workspace 既定値（90 日 or `#general` と同等）を継続。設定変更は MVP では行わない |
| topic / description | `incident 一次受け / smoke target. PII禁止.` を設定 |

### 手順

1. Slack workspace に admin としてログイン
2. `+ Add channel` → `Create channel` → name = `ubm-hyogo-incidents` / Private を選択して作成
3. 既存同名 channel がある場合は **再作成せず再利用**（idempotency）
4. channel に worker（招待者リスト）を invite
5. channel ID（`C` で始まる）の **先頭 4 文字のみ** を `outputs/phase-11/channel-provisioning-log.md` の G1 セクションに記録

### DoD

- [ ] `#ubm-hyogo-incidents` が workspace に存在
- [ ] Private channel として作成
- [ ] G1 通過記録が channel-provisioning-log.md に追記

### Rollback

不可逆（Slack channel は archive のみ可・delete は admin 限定）。誤った workspace に作成した場合は archive し、別 workspace で再実行。

---

## Step B: incoming webhook app 作成 + URL 発行（G1 と同時実行）

### 手順

1. Slack で `Apps` → `Manage` → `Custom Integrations` → `Incoming Webhooks` を開く（または Slack API site で `Create New App` → `From scratch` → workspace 選択 → `Incoming Webhooks` を ON）
2. `Add New Webhook to Workspace` → channel = `#ubm-hyogo-incidents` を選択 → Authorize
3. 発行された webhook URL を **コピーバッファに置いたまま、ターミナル / エディタに貼らない**。op item 投入（Step C）まで連続で実行する
4. 既存 webhook が channel に紐づいている場合は **再発行せず再利用**（idempotency）

### DoD

- [ ] `#ubm-hyogo-incidents` 向け webhook が有効化されている
- [ ] webhook URL が **どのファイルにも記録されていない**

### Rollback

webhook URL を誤って Slack 外（チャット / メモ / git）に出した場合: 即座に Slack admin で当該 webhook を `Disable / Remove` し、Step B から再発行。1Password / Cloudflare / GitHub に投入済みなら全配置先で rotate（Step C〜G を再実行）。

---

## Step C: 1Password item 登録（G2 直前）

### 手順

```bash
# 1Password CLI で item 作成（webhook URL は stdin から渡し、コマンドラインに残さない）
# 値は Slack admin UI のコピーバッファから直接 op に貼り付ける。
# 以下は具体値を出さない疑似手順。

op item create \
  --category "API Credential" \
  --vault "UBM-Hyogo-Production" \
  --title "SLACK_WEBHOOK_INCIDENT" \
  url[password]="<webhook-url-from-1password>"
```

実運用では 1Password GUI で:

1. vault `UBM-Hyogo-Production` を開く
2. `+ New Item` → `API Credential`（または `Password`）
3. title = `SLACK_WEBHOOK_INCIDENT`
4. field `url` を **password 種別**（concealed）として作成し、Slack コピーバッファから貼り付け
5. Save
6. 参照 path `op://UBM-Hyogo/Slack Incident Webhook (production)/url` を runbook 作業 worksheet に控える（実値は控えない）

### DoD

- [ ] `op item get "SLACK_WEBHOOK_INCIDENT" --vault UBM-Hyogo-Production` が成功
- [ ] field `url` が password / concealed 種別

### Rollback

誤値投入時: `op item edit` で url field を空に置換 → Slack で webhook を `Disable` → Step B から再発行 → C を再実行。

---

## Step D: `.env.example` に op:// 参照追加（G2 と同時 / コード変更）

### 変更内容

```diff
+ # incident channel #ubm-hyogo-incidents 向け incoming webhook (production / staging 共有)
+ SLACK_WEBHOOK_INCIDENT="op://UBM-Hyogo/Slack Incident Webhook (production)/url"
```

実値は **絶対に書かない**。op:// 参照のみ。

### DoD

- [ ] `.env.example` に `SLACK_WEBHOOK_INCIDENT` の op:// 参照が存在
- [ ] `.env`（実体・gitignore 済み）にも実値ではなく op:// 参照のみ

### Rollback

git diff で行を削除して revert。

---

## Step E: Cloudflare Workers staging secret 投入（G2）

### 手順

```bash
# 値は op 経由で stdin に直接渡し、コマンドラインに値を残さない
# scripts/cf.sh が op run --env-file=.env でラップしている前提
op read "op://UBM-Hyogo/Slack Incident Webhook (production)/url" \
  | bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT \
      --config apps/api/wrangler.toml \
      --env staging

# 直後に name-only 確認（値は表示されない）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  | grep SLACK_WEBHOOK_INCIDENT
```

### DoD

- [ ] secret list に `SLACK_WEBHOOK_INCIDENT` の name が出る
- [ ] terminal scrollback / shell history に **webhook URL 実値が残っていない**（`history -c` を実行）

### Rollback

```bash
bash scripts/cf.sh secret delete SLACK_WEBHOOK_INCIDENT \
  --config apps/api/wrangler.toml --env staging
```

その後 Step E を再実行。

---

## Step F: Cloudflare Workers production secret 投入（G3 承認後）

### 前提

- G3: staging smoke が `[STAGING SMOKE]` prefix で着弾済み（`outputs/phase-11/webhook-smoke-log.md` の G3 セクション記録）
- redaction grep gate（Phase 4）が repo 全域で 0 hits

### 手順

```bash
op read "op://UBM-Hyogo/Slack Incident Webhook (production)/url" \
  | bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT \
      --config apps/api/wrangler.toml \
      --env production

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \
  | grep SLACK_WEBHOOK_INCIDENT
```

### DoD

- [ ] production env でも secret name 確認
- [ ] G3 通過記録（webhook-smoke-log.md）

### Rollback

`bash scripts/cf.sh secret delete SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env production` を実行し、Step F を再実行。

---

## Step G: GitHub Secrets 登録

### 手順

```bash
# stdin で値を渡し、shell history に値を残さない
op read "op://UBM-Hyogo/Slack Incident Webhook (production)/url" \
  | gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo

# name-only 確認
gh secret list --repo daishiman/UBM-Hyogo | grep SLACK_WEBHOOK_INCIDENT
```

### DoD

- [ ] `gh secret list` の name 列に表示
- [ ] history に値が残っていない

### Rollback

`gh secret delete SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo` を実行し、Step G を再実行。

---

## Step H: redaction grep 全リポジトリ実行（G4 直前）

### 手順

```bash
cd "$(git rev-parse --show-toplevel)"

rg -n 'hooks\.slack\.com/services/' . && echo "FAIL" || echo "OK: 0 hits"
rg -n 'B[0-9A-Z]{8,}' . && echo "FAIL" || echo "OK: 0 hits"
rg -n 'xox[bp]-' . && echo "FAIL" || echo "OK: 0 hits"

# .gitignore された .env 等も含めた raw 全 scan
rg -n --hidden --no-ignore 'hooks\.slack\.com/services/' . \
  | grep -v '^\.env:' \
  | grep -v '^node_modules/' \
  || echo "OK"
```

### DoD

- [ ] すべての pattern で repo tracked file は **0 hits**
- [ ] `.env`（実体）に op:// 参照のみで実値が無いことを `op://` を含む行のみで確認

### Rollback

hit があった場合: 当該 file を編集して fragment を `<webhook-url-from-1password>` プレースホルダに置換 → 即座に webhook rotate（Step B〜G 再実行）→ 再 grep。

---

## Step I: skill references の編集

### I-1. `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

| 追記内容 | 概要 |
| --- | --- |
| incident channel | `#ubm-hyogo-incidents` を staging / production smoke + 実 incident の一次受けと明記 |
| env-aware Slack prefix | `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` の二重識別規約（issue-495 spec 継続） |
| webhook 命名 | `SLACK_WEBHOOK_INCIDENT`（staging / production 共有） |
| redaction 規約 | response / log / evidence / PR body に webhook URL fragment を出さないことの正本記載 |

### I-2. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

| 追記内容 | 概要 |
| --- | --- |
| secret 配置先 | 1Password (`op://UBM-Hyogo/Slack Incident Webhook (production)/url`) → Cloudflare Workers (staging+production) → GitHub Actions の同期順 |
| 投入経路 | `bash scripts/cf.sh secret put` のみ（`wrangler` 直接禁止） |
| 値非表示原則 | `secret list` での name-only 確認、`op read` の出力を terminal に残さない、shell history への値混入禁止 |
| rotate 手順 | webhook 漏洩時の Slack disable → 1Password 更新 → cf.sh 再投入 → gh secret 上書き |

### DoD

- [ ] 両ファイルに channel 名・secret 名・op:// 参照規約・redaction 規約が反映
- [ ] 既存記述との衝突なし
- [ ] indexes 再生成（`mise exec -- pnpm indexes:rebuild`）を実行し、drift 0 を確認

---

## Step J: 運用 runbook 新規作成

### path

`docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md`

### 章立て（最低限）

1. 目的（incident channel + webhook の定常運用）
2. 事前準備（Step 0 と同等）
3. channel 作成（Step A 要約）
4. webhook 発行（Step B 要約）
5. 1Password / Cloudflare / GitHub の同期手順（Step C〜G 要約）
6. redaction grep gate（Step H 要約）
7. rotate 手順（webhook 漏洩 / channel archive 事故時）
8. archive 禁止規約（`#ubm-hyogo-incidents` を archive する場合の事前 G ゲート）
9. 関連リンク（observability-monitoring.md / deployment-secrets-management.md / issue-495 / issue-520 spec）

### DoD

- [ ] runbook が新規作成
- [ ] 機密値・URL fragment が一切記載されていない（プレースホルダ + op:// 参照のみ）
- [ ] grep gate コマンドが runbook 内に embedded

---

## 全体 DoD

- [ ] Step A〜J の DoD すべて PASS
- [ ] G1 (Step A/B) → G2 (Step C/D/E) → G3 (Step F + staging smoke) → G4 (production smoke + Step H) の順序を守った
- [ ] 機密値が repo / log / shell history / PR body / evidence のいずれにも残っていない

## 検証コマンド

```bash
# 仕様書 dir に実値混入なし
! rg -n 'hooks\.slack\.com/services/[A-Za-z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# 必須 step
grep -q "Step A\|Step J" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-05.md
grep -q "scripts/cf.sh secret put" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-05.md
grep -q "gh secret set" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-05.md
grep -q "op://UBM-Hyogo/Slack Incident Webhook (production)/url" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-05.md
```

## 成果物

- `outputs/phase-05/main.md`

## 次 Phase への引き渡し

Phase 6 へ: Step A〜J の DoD / Rollback / G1〜G4 紐付け / 機密保持規約。Phase 6 では各 Step に対する異常系シナリオを設計する。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- [ ] 必須成果物が存在する
- [ ] runtime pending と static PASS の境界が明記されている

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
