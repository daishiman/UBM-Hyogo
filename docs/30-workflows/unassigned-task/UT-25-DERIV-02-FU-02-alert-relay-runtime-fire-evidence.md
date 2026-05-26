# UT-25-DERIV-02-FU-02: SA 資格情報失効 → alert relay 実発火 runtime evidence 取得 - タスク指示書

## メタ情報

```yaml
issue_number: 917
task_id: UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence
task_name: API_INTERNAL_BASE_URL 配線後の SA 資格情報失効 → alert relay 実発火 runtime evidence 取得
category: 検証
target_feature: apps/api Cloudflare Workers sheets-auth-healthcheck cron → POST /internal/alert-relay
priority: 中
scale: 小規模
status: 未実施
source_phase: issue-857 Phase 12
created_date: 2026-05-24
dependencies: ["#857"]
```

## メタ情報

| 項目         | 内容                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| タスクID     | UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence                                  |
| タスク名     | `API_INTERNAL_BASE_URL` 配線後の SA 資格情報失効 → alert relay 実発火 runtime evidence 取得 |
| 分類         | 検証（Runtime Evidence）                                                                |
| 対象機能     | `apps/api` Cloudflare Workers / `sheets-auth-healthcheck` cron → `POST /internal/alert-relay` |
| 優先度       | 中                                                                                      |
| 見積もり規模 | 小規模                                                                                  |
| ステータス   | 未実施                                                                                  |
| 発見元       | issue-857-internal-alert-relay-binding-wiring（UT-25-DERIV-02-FU-01 の消化サイクル）    |
| 発見日       | 2026-05-24                                                                              |
| 親タスク     | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`                            |
| canonical 配線元 | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`                  |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-857（UT-25-DERIV-02-FU-01 の消化サイクル）にて、`apps/api/wrangler.toml` の `[env.production.vars]` / `[env.staging.vars]` 双方へ `API_INTERNAL_BASE_URL` を配線し、`apps/api/src/scheduled/sheets-auth-healthcheck.ts` の `postAlertRelay()` が self-subrequest 先 URL を解決できる状態を確立した。送信側 token は受信 `verify-cf-webhook-auth.ts`（`CF_WEBHOOK_AUTH_SECRET` 単一照合）に合わせて `CF_WEBHOOK_AUTH_SECRET` fallback を正本化し、config guard / contract fallback の回帰テストで local 証跡を固定した（`workflow_state = implemented_local_evidence_captured`）。

ただし issue-857 の `outputs/phase-12/implementation-guide.md` の「Runtime Path x Evidence」表で **`actual alert receipt`（Workers tail after deploy and controlled SA key invalidation）は `pending_user_approval`** のまま残っている。つまり「base URL 配線によって healthcheck の no-op が実際に解消し、SA 資格情報失効時に alert relay が本物に発火するか」は実機未確認である。

### 1.2 問題点・課題

- `API_INTERNAL_BASE_URL` 配線が `[vars]` の named env 継承非対応の罠（FU-01 苦戦箇所 1）を踏まずに両環境へ正しく効いているかは、deploy 後の Workers tail でしか確証できない。
- `CF_WEBHOOK_AUTH_SECRET` fallback 経路が production / staging の実 secret 値で relay 401 を出さずに通るかは、unit / contract test では保証できない（実 secret を使う runtime のみ検証可能）。
- 親 UT-25-DERIV-02 Phase 11 の「staging secret invalidation dry-run」は、本配線が runtime で効いて初めて意味を持つ。配線の効果が実機未確認のまま dry-run しても「alert が飛ばない」原因が配線か invalidation 手順かを切り分けできない。
- issue-857 の detection は本 runtime portion を「Phase 13 / runtime boundary」として新タスク化しなかったが、Phase 13 は commit/PR 草案であり、PR merge 後に runtime 確認の未消化項目を追跡する backlog が存在しない。

### 1.3 放置した場合の影響

- SA service account key が実際に失効した本番初回イベントで、alert relay が依然 no-op（`reason: "missing API_INTERNAL_BASE_URL or token"` の解消漏れ・fallback secret 不一致など）でも、誰も気付けず監視が沈黙する。
- `ut-17-followup-001`（受信 endpoint の汎用 smoke）は受信側を叩くが、`sheets-auth-healthcheck` cron トリガー → relay という**送信トリガー経路**は別物のため、本タスクなしでは送信経路の実発火が永久に未検証で残る。
- 親 UT-25-DERIV-02 の close-out / 月次運用 SOP で「runtime evidence 不足」が後追い指摘され、再 deploy 待ちで close が遅延する。

---

## 2. 何を達成するか（What）

### 2.1 目的

issue-857 で配線した `API_INTERNAL_BASE_URL` が staging（最低限）／production（可能なら）の Cloudflare Workers runtime で実際に効き、SA 資格情報失効を模した条件下で `sheets-auth-healthcheck` が `POST /internal/alert-relay` を発火して通知が届くことを実機確認し、evidence を MD として残す。

### 2.2 最終ゴール

- staging runtime evidence MD: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md`
- 上記 MD に、配線前後の Workers tail log（`reason: "missing API_INTERNAL_BASE_URL or token"` が消失したこと）、relay POST の到達ステータス、通知着信の記録を含める。
- issue-857 `outputs/phase-12/implementation-guide.md` の「actual alert receipt」行を `pending_user_approval` から `verified`（または取得済みリンク）へ更新する逆参照を残す。

### 2.3 スコープ

#### 含むもの

- `bash scripts/cf.sh secret list --env staging` / `--env production` による `CF_WEBHOOK_AUTH_SECRET` name presence 確認（値は表示しない）
- staging deploy 後の Workers tail（`bash scripts/cf.sh` 経由）で `event: 'sheets.auth.healthcheck'` の no-op reason が消えたことの確認
- SA 資格情報失効を模した controlled dry-run（親 UT-25-DERIV-02 Phase 11 の invalidation 手順に従う）による alert relay 実発火の観測
- 正常発火・配線前 no-op との差分・fallback secret 不一致時の 401 の 3 観点を tail で記録

#### 含まないもの

- `API_INTERNAL_BASE_URL` 配線そのもの（issue-857 で完了済み）
- 受信側 `/internal/alert-relay` endpoint の汎用 smoke（`ut-17-followup-001` のスコープ）
- 別値 `INTERNAL_ALERT_TOKEN` の投入や `verify-cf-webhook-auth.ts` の multi-token 化（issue-857 で明示的に de-scope 済み）
- SA key 自体のローテーション SOP（UT-25-DERIV-01）
- Slack / mail provider 側の受信先設定（UT-07 / UT-08）

### 2.4 成果物

- staging runtime evidence MD（tail log + relay 到達 + 着信記録、secret 値は redact）
- production runtime evidence MD（任意・deploy ポリシー次第）
- issue-857 implementation-guide「actual alert receipt」行のステータス更新

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-857 の `API_INTERNAL_BASE_URL` 配線 PR が `dev`（さらに staging へ deploy）に取り込み済み
- `CF_WEBHOOK_AUTH_SECRET` が staging / production の Cloudflare Secrets に投入済み
- 親 UT-25-DERIV-02 の `sheets-auth-healthcheck` cron 実装が deploy 済み
- 受信側 `/internal/alert-relay` の通知先（Slack / mail）が UT-07 / UT-08 / UT-17 経路で設定済み（無設定なら relay 到達までを evidence 範囲とする）

### 3.2 依存タスク

- 上流: issue-857-internal-alert-relay-binding-wiring（配線・PR merge・staging deploy）
- 上流: UT-25-DERIV-02 Phase 11 staging secret invalidation dry-run 手順
- 関連: `ut-17-followup-001-alert-relay-runtime-smoke-evidence`（受信側 smoke。重複しないよう送信トリガー経路に限定）
- 下流: UT-25-DERIV-02 close-out / 月次運用 SOP

### 3.3 必要な知識

- `apps/api/src/scheduled/sheets-auth-healthcheck.ts` の `postAlertRelay()`（base URL + token 解決、no-op 条件、log event 名）
- `wrangler.toml` の `[vars]` が named env に継承されない仕様（FU-01 苦戦箇所 1）
- `bash scripts/cf.sh` 経由の deploy / secret list / tail（`wrangler` 直接実行禁止）
- 親 UT-25-DERIV-02 の SA 資格情報失効を模す controlled dry-run 手順

### 3.4 推奨アプローチ

1. deploy 前後の tail を取り、no-op reason の有無を before/after で対比できる evidence にする（配線が runtime で効いた証明）。
2. SA 資格情報失効の模倣は親 UT-25-DERIV-02 の手順を正本とし、本タスクは「発火観測」に限定する（invalidation 手順を再発明しない）。
3. 通知先が未設定なら relay POST の到達ステータス（200 / 401）までを evidence とし、着信確認は別 wave に切り出す。
4. すべて user-gated runtime のため、実行はユーザー承認後。secret 値はログ・MD に転記しない。

---

## 4. 実行手順

### Phase 構成

1. binding presence 確認
2. deploy 前後 tail 取得（no-op 解消の証明）
3. SA 資格情報失効 dry-run → alert relay 実発火観測
4. evidence MD 化 + issue-857 ステータス逆参照更新

### Phase 1: binding presence 確認

#### 目的

配線済み var と fallback secret が両環境に存在することを実機確認する。

#### 手順

1. `bash scripts/cf.sh secret list --env staging` で `CF_WEBHOOK_AUTH_SECRET` の name presence を確認（値は表示しない）
2. production も同様（deploy ポリシーで実施範囲を判断）
3. `wrangler.toml` の `API_INTERNAL_BASE_URL` が両 env vars に存在することを再確認

#### 完了条件

両環境で var + secret name presence が揃っている（または staging のみ揃いの状態が記録されている）。

### Phase 2: deploy 前後 tail 取得（no-op 解消の証明）

#### 目的

配線が runtime で効き、healthcheck の no-op reason が消えたことを示す。

#### 手順

1. 配線反映前の tail に `event: 'sheets.auth.healthcheck'` の `reason: "missing API_INTERNAL_BASE_URL or token"` が出ていた記録があれば添付（無ければ「配線後のみ観測」と明記）
2. staging deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`）
3. deploy 後 tail で同 event の no-op reason が消えたことを確認

#### 完了条件

deploy 後 tail で no-op reason が出ていないことが evidence に残る。

### Phase 3: SA 資格情報失効 dry-run → alert relay 実発火観測

#### 目的

失効模倣条件下で relay が実際に POST 発火することを観測する。

#### 手順

1. 親 UT-25-DERIV-02 Phase 11 の controlled invalidation 手順に従い、Sheets API が 401/403 を返す状態を模す
2. cron 実行（または手動トリガ）後の tail で `postAlertRelay()` が relay へ POST し、到達ステータス（200 / 401）を記録
3. 通知先設定済みなら着信（Slack / mail）も記録。未設定なら到達ステータスまでを evidence とする

#### 完了条件

relay POST の到達ステータスが記録され、no-op でないことが確認できる。

### Phase 4: evidence MD 化 + issue-857 ステータス逆参照更新

#### 目的

取得した runtime evidence を正本化し、issue-857 の pending 行を解消する。

#### 手順

1. `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` を作成
2. issue-857 `outputs/phase-12/implementation-guide.md` の「actual alert receipt」行を取得済みリンクへ更新
3. 親 UT-25-DERIV-02 の close-out チェックに本 evidence を反映

#### 完了条件

issue-857 の「actual alert receipt」が pending でなくなり、親 close-out から evidence へ逆参照が張られている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] staging で `CF_WEBHOOK_AUTH_SECRET` name presence 確認済み
- [ ] staging deploy 後 tail で no-op reason が消失
- [ ] SA 資格情報失効 dry-run で relay POST が発火し到達ステータスを記録
- [ ] （通知先設定済みの場合）Slack / mail 着信を確認
- [ ] production の実施範囲を deploy ポリシーに沿って判断・記録

### ドキュメント要件

- [ ] `outputs/phase-11/evidence/alert-relay-fire-staging.md` 作成
- [ ] issue-857 implementation-guide「actual alert receipt」行を更新
- [ ] 親 UT-25-DERIV-02 close-out から evidence へ逆参照

### 品質要件

- [ ] 実 secret 値はログ / MD に転記しない（CLAUDE.md シークレット管理ルール準拠）
- [ ] tail / curl ログの `cf-webhook-auth` ヘッダ値は redact 済み
- [ ] `wrangler` 直接実行なし（`bash scripts/cf.sh` 経由のみ）

---

## 6. 苦戦箇所・知見（再発防止）

issue-857 配線サイクルで実際に詰まった / 本 runtime 検証で詰まり得るポイントを、将来の同種タスク（Cloudflare cron → internal subrequest 系の runtime evidence）で活かせる粒度で記録する。

### 6.1 `wrangler.toml` `[vars]` の named env 非継承で「片肺配線」が静かに発生する

- top-level `[vars]` は named environment（`[env.staging]` / `[env.production]`）へ継承されない。issue-857 では `[env.production.vars]` と `[env.staging.vars]` の**両方**に `API_INTERNAL_BASE_URL` を書いて回避したが、片方だけだと sibling 環境で healthcheck が no-op に落ち、しかも unit test では検出できない。
- 対策: 新 binding 追加時は両 env vars + secret の parity を deploy 前後 tail で必ず実機確認する。本 runtime evidence タスクはその parity を「no-op reason 消失」で証明する役割を持つ。
- 教訓: Workers の env binding 欠落は「型は通る・test は通る・runtime だけ沈黙」という最悪の failure mode を取る。runtime tail evidence を close-out gate に組み込むのが唯一の確実な検出経路。

### 6.2 issue 原文の token 投入手順が陳腐化していた（受信契約を正本にする）

- issue #857 / 元 FU-01 は「別値 `INTERNAL_ALERT_TOKEN` を Cloudflare Secrets へ投入」を前提にしていたが、受信 `verify-cf-webhook-auth.ts` は `CF_WEBHOOK_AUTH_SECRET` のみを照合する。別値を投入すると relay が 401 を返し alert が黙って drop する陳腐化トラップだった。
- 対策: 送信側 `INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET` の fallback を正本とし、新 secret を投入しない方針に最適化。本 runtime 検証では「fallback secret で relay が 401 を出さず通る」ことを実機で確かめるのが核心。
- 教訓: issue が古い前提を含む場合、実装着手前に受信側コントラクトを読み、送受信の token 照合を突き合わせる。runtime evidence では「想定どおり 200 で通る」だけでなく「誤設定なら 401 になる」negative path も 1 ケース観測しておくと、後の運用切り分けが速い。

### 6.3 「送信トリガー経路」と「受信 endpoint smoke」は別タスクで取り違えやすい

- `ut-17-followup-001` は `/internal/alert-relay` を直接 curl で叩く受信側 smoke。一方本タスクは `sheets-auth-healthcheck` cron → relay という送信トリガー経路の発火検証で、検証対象が異なる。混同すると「受信 smoke 済みだから送信も OK」と誤判定し、cron トリガーの no-op が見逃される。
- 対策: evidence MD のタイトル・スコープに「送信トリガー経路（cron→relay）」を明記し、受信 smoke とは別ファイルで保管する。
- 教訓: relay/中継系は「誰が叩くか」で経路が分岐する。runtime evidence は経路単位で 1 ファイルに分け、相互リンクで重複検証を避ける。

### 6.4 runtime evidence は user-gated で deploy ポリシーに律速される

- secret list / deploy / tail / SA 資格情報失効 dry-run はすべて user-gated（CLAUDE.md Cloudflare CLI ルール）。production 実施は deploy ポリシー次第で staging のみ先行になりやすい。
- 対策: staging で evidence を確定し、production は実施範囲を MD に明記して段階分離する。pending 行は issue-857 implementation-guide 側にも残し、二重で追跡漏れを防ぐ。
- 教訓: 「local evidence captured」と「runtime verified」は別ゲート。前者で close せず、runtime portion を独立タスク化して backlog に残すのが、PR merge 後の追跡漏れを防ぐ唯一の方法。

---

## 7. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/index.md`
- `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md`（「Runtime Path x Evidence」表）
- `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`（親・Phase 11 invalidation 手順）
- `docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md`（消化元・配線スコープ）
- `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md`（受信側 smoke・重複回避）

### 関連ソース

- `apps/api/src/scheduled/sheets-auth-healthcheck.ts`（`postAlertRelay` 送信側）
- `apps/api/src/middleware/verify-cf-webhook-auth.ts`（`CF_WEBHOOK_AUTH_SECRET` 単一照合）
- `apps/api/wrangler.toml`（`[env.production.vars]` / `[env.staging.vars]` の `API_INTERNAL_BASE_URL`）
- `apps/api/src/env.ts`（`API_INTERNAL_BASE_URL` / `INTERNAL_ALERT_TOKEN` 型宣言）

### 関連 issue / task

- 配線元 issue: [#857](https://github.com/daishiman/UBM-Hyogo/issues/857)（CLOSED）
- 親: ut-25-deriv-02-sa-key-expiry-monitoring
- 同種先行例: `docs/30-workflows/completed-tasks/task-09a-A-exec-staging-smoke-001.md`
- 同種先行例: `docs/30-workflows/completed-tasks/task-09b-a-runtime-provider-smoke-execution-001.md`
