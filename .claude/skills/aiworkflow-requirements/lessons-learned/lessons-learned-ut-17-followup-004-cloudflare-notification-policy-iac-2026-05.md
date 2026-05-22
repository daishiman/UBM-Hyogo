---
task: UT-17 follow-up 004
recorded: 2026-05-14
topics: [cloudflare, alert, iac, secrets, drift, monitoring, ci-cd]
related-references:
  - docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/index.md
  - docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-12/implementation-guide.md
  - docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-12/skill-feedback-report.md
  - docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-12/system-spec-update-summary.md
  - .claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ut-17-cloudflare-analytics-alerts-2026-05.md
classification: [security/secrets, implementation/iac-boundary, design/token-scope, operations/drift-gate, design/canonicalization]
---

# Lessons Learned — UT-17 follow-up 004 Cloudflare Notification Policy IaC (2026-05)

UT-17 親タスクの Dashboard 手動 Notification Policy 設定を IaC 化する後続実装で得た教訓を classification-first で整理する。Phase 12 strict 7（`outputs/phase-12/`）と `phase12-task-spec-compliance-check.md` を出典とする。

---

## 1. セキュリティ / Token Scope 分離

### 概要
Cloudflare Alerting API に対する apply 系操作（`POST` / `PUT`）と read 系操作（`GET`）を、**異なる API Token** で分離する必要がある。同一トークンに edit 権限を付与すると、CI（PR + schedule + workflow_dispatch）に edit 権限が漏れる構造になり、drift gate が事故時に prod 設定を書き換えるリスクが残る。

### なぜ重要か
- CI（schedule / workflow_dispatch）は drift diff だけを目的としており、edit は user-gated にしなければならない。
- 単一トークンを使うと、トークン漏洩時の blast radius が拡大する。
- `apply --ci` を許可すると、merge 直後にうっかり mutation が走り、戻し方が無いまま prod が変わる。

### 再発防止アクション
- 採用する canonical 名:
  - `CLOUDFLARE_ALERTS_TOKEN_APPLY` — local apply のみ（user 手元 1Password / `op run` 経由）。
  - `CLOUDFLARE_ALERTS_TOKEN_READ` — CI drift gate + local diff/list。
- `infra/cloudflare-alerts/lib/cli.ts` で `apply --ci` を**実装時に拒否**する（CI が apply を起動できない構造で守る）。
- URL drift 検証用の `CLOUDFLARE_ALERT_RELAY_URL` も read 経路に閉じる。GitHub Secret 配置は user-gated。

---

## 2. 実装 / Cloudflare API Method の統一

### 概要
Cloudflare Alerting API v4 で既存リソースの更新方法は **policies / webhooks 双方とも `PUT`** で揃える。drift 修復時に「policy だけ `PUT`、webhook は `PATCH`」のような非対称設計にすると、`apply` 側の差分計算と Cloudflare の冪等性前提が崩れる。

### なぜ重要か
- `PATCH` は部分更新で、未指定 field が "意図せず保持される" 動作になり、desired state ファイル＝現状という IaC の不変条件が壊れる。
- `PUT` で揃えると、`infra/cloudflare-alerts/policies/*.json` と `infra/cloudflare-alerts/webhooks/*.json` の中身がそのまま Cloudflare の正本になる。

### 再発防止アクション
- canonical contract: `PUT /accounts/:account_id/alerting/v3/policies/:policy_id` / `PUT /accounts/:account_id/alerting/v3/destinations/webhooks/:webhook_id`。
- 新規作成は `POST`、それ以外は `PUT` のみ（`PATCH` を実装しない）。
- `lib/api-client.ts` の test suite で「`PUT` 以外は API client が拒否する」契約を schema-contract test で固定する。

---

## 3. 設計 / 用語と数の Canonicalization

### 概要
ドキュメント・スキル・index 間で「Notification Policy の数」「webhook ディレクトリ名」が drift しやすい。spec_created 時の表記と implementation_complete 時の表記が乖離すると、未来の読者が「どれが正本か」を判断できなくなる。

### なぜ重要か
- `4 policies` / `5 policies` / `5 policy files` の表記揺れが、parent UT-17 matrix（Pages Build / R2 Class A operations / Workers Requests / D1 read/write）との整合監査で false-mismatch を生む。
- webhook 定義ディレクトリ名が複数候補（`webhooks/` vs `destinations/` vs `relay/`）あると、CI grep gate の対象が決まらない。

### 再発防止アクション
- canonical wording を Phase 12 main.md の **Normalized Decisions** で固定:
  - `4 categories / 5 policy files`
  - canonical webhook directory: `infra/cloudflare-alerts/webhooks/`
  - Pages 対象: `Pages Build`
  - R2 対象: `R2 Class A operations`
- これらの用語は `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` の **同一 wave** で同期する（一方だけ更新しない）。

---

## 4. 運用 / Drift Gate の発火タイミング分離

### 概要
PR で **本物の** Cloudflare API を叩く drift gate を発火させると、`pull_request` イベントが fork からも来うる前提で `CLOUDFLARE_ALERTS_TOKEN_READ` が untrusted コンテキストに露出する。一方で `schedule` / `workflow_dispatch` だけだと、merge 直後の drift を即時検知できない問題は残る。

### なぜ重要か
- PR で読み取りだけでも token を渡すと、`pull_request_target` 系の罠（PR 由来のコード実行に secrets が露出）に巻き込まれやすい。
- merge 後 drift の即時性は、cron 間隔と `workflow_dispatch` 手動 trigger のセットで担保すれば運用上十分。

### 再発防止アクション
- `.github/workflows/cloudflare-alerts-drift.yml` の発火条件:
  - `pull_request`: **local validate のみ**（`pnpm test:alerts`、Cloudflare API 非接続）。
  - `schedule`: read-only drift diff（`CLOUDFLARE_ALERTS_TOKEN_READ` 使用）。
  - `workflow_dispatch`: 同上（手動即時実行用）。
- `apply` 系は workflow に組み込まない（GitHub Secret として `CLOUDFLARE_ALERTS_TOKEN_APPLY` を置かない方針）。

---

## 5. 設計 / 未知 alert_type の安全側 default

### 概要
Cloudflare の `alert_type` 文字列は将来増える。新 policy を `enabled: true` で追加し、type 名が Cloudflare 側で未定義／typo だった場合、`apply` は成功するが actual には何もマッチせず、silent な「通知が来ない」状態になる。

### なぜ重要か
- 「通知が来ない」は事故が起きるまで気付けない最悪のクラスの silent failure。
- IaC で `enabled: true` を default にすると、レビューでも見落とされやすい。

### 再発防止アクション
- 新規 policy 追加時は **`enabled: false`** を default とし、Cloudflare 上で alert_type を確認してから別 PR で `true` に切り替える 2-step を必須化。
- `lib/canonicalize.ts` で「未知 alert_type を含む desired state」を warn 出力し、人間レビューを誘導する。

---

## 6. ガバナンス / Phase 12 strict 7 と artifacts.json の parity

### 概要
spec_created 時の workflow root には `outputs/phase-12/main.md` 以下 strict 7 が揃っていても、root 直下の `artifacts.json` と `outputs/artifacts.json` の **byte-identical parity** が崩れていると Phase 12 compliance CI gate（`verify-phase12-compliance`）が fail する。

### なぜ重要か
- artifacts.json は「成果物台帳」の正本で、root 直下と outputs 直下の 2 ファイルが同一でないと、どちらを読むかで状態判断が割れる。
- implementation_complete に状態遷移する際、`workflow_state` を片方だけ更新する事故が起きやすい。

### 再発防止アクション
- artifacts.json 更新時は必ず両ファイル同時に書き換え、`diff -q` で byte-identical を確認。
- Phase 12 sync の wave で resource-map / quick-reference / task-workflow-active / artifacts.json (×2) を同期対象として **同時 commit** に含める。
- `verify-phase12-compliance` を required status check として `dev` / `main` の branch protection に置く運用（task-18 と整合）。

---

## メモ

- 本タスクは Cloudflare runtime mutation / GitHub Secret 配置 / commit / push / PR を **すべて user-gated** で残した。lessons-learned は local 実装完了時点の知見で、runtime smoke 後に追補する余地がある。
- 関連: `lessons-learned-ut-17-cloudflare-analytics-alerts-2026-05.md`（親 UT-17 の Slack 日本語化リレー側教訓）。
