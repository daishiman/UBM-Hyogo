# Implementation Guide — issue-917 alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

再判定根拠: runtime evidence の到達確認には tail 上の `responseStatus` が必要だが、現コードは relay POST 成功/401 応答をログ化していなかった。CONST_009 に従い、実観測できる状態にするため最小の API コード変更と contract spec 更新を含める。

## Part 1: 初学者向け

学校の防災ベルがすでに「校長室に通報する」と決まっていても、本当にベルを鳴らしたときに通報が届くかは、ベルを実際に鳴らす訓練でしか確かめられません。今回やることは、(a) 通報先の合い言葉（鍵の名前）が登録されているか名簿で確認し、(b) ベルを訓練的に鳴らして、(c) 校長室に音声が届いた記録を残すこと、それだけです。新しい配線工事はしません。すでに済んでいる配線が「本当に鳴ること」を見届けて記録するだけです。

| 用語 | 言い換え |
| --- | --- |
| Worker | インターネット上で動く小さな係 |
| vars | 公開してよい設定メモ |
| Secret | 隠しておく合い言葉 |
| alert relay | 異常のお知らせを運ぶ係 |
| SA 資格情報 | Google サービスアカウントの鍵 |
| staging | 本番前の試し打ち場所 |
| tail | Worker の動作ログを横で見るしくみ |

## Part 2: 技術者向け

### Unchanged Runtime Contract

`apps/api/src/scheduled/sheets-auth-healthcheck.ts` resolves alert relay transport as (issue-857 で確定済み):

```ts
const base = env.API_INTERNAL_BASE_URL;
const token = env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET;
```

`apps/api/src/middleware/verify-cf-webhook-auth.ts` accepts only `CF_WEBHOOK_AUTH_SECRET`. This cycle does NOT change either side. It only observes that the wiring is effective in the live Worker.

### Files Changed (本サイクル)

| Path | Change |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/**` | New — Phase 1-13 + outputs/phase-{11,12} + artifacts.json (root/output) + SCOPE.md + index.md |
| `apps/api/src/scheduled/sheets-auth-healthcheck.ts` | Add structured runtime log `event: "sheets.auth.alert_relay_post"` with `responseStatus` after relay POST returns |
| `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | Add assertions for 200 and 401 relay response status evidence logging |

No alert relay endpoint contract, token verification rule, Worker vars, or notification provider behavior is changed. The code delta only makes the already-required runtime evidence observable in Workers tail.

### Files Changed (後続 runtime サイクル)

| Path | Change |
| --- | --- |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` | New — runtime evidence MD (sections per Phase 4 §4 contract) |
| `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` | Edit — "actual alert receipt" row updated from `pending_user_approval` to `verified` with relative link |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | Edit — close-out back-reference to evidence MD |

### Runtime Path x Evidence

| Runtime path | Evidence | Status (本サイクル時点) |
| --- | --- | --- |
| issue-857 configuration parity | `apps/api/wrangler.toml` `[env.{production,staging}.vars].API_INTERNAL_BASE_URL` | already_in_repo（issue-857 結果） |
| staging secret name presence | `bash scripts/cf.sh secret list --env staging` で `CF_WEBHOOK_AUTH_SECRET` 確認 | pending_user_approval |
| staging deploy 前後 tail | `event: "sheets.auth.alert_relay_skipped"` 消失 | pending_user_approval |
| SA 資格情報失効 dry-run | 親 UT-25-DERIV-02 Phase 11 invalidation 手順 | pending_user_approval |
| relay POST 到達 | `event: "sheets.auth.alert_relay_post"` / `responseStatus: 200` | pending_user_approval |
| 通知到達（任意） | Slack / mail 着信 | pending_user_approval（任意） |
| issue-857 implementation-guide 更新 | "actual alert receipt" 行 `verified` 化 | pending_post_runtime |

### Redact Rule

`cf-webhook-auth` header 値・`CF_WEBHOOK_AUTH_SECRET` 実値・OAuth トークン・SA JSON は evidence MD / 仕様書 / commit いずれにも転記しない。tail 出力に含まれている場合は `<redacted>` に置換。`bash scripts/cf.sh secret list` は name 列のみを記録し、その他列は転記しない。

### Local Verification

`pnpm exec vitest run apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts --root=. --config=vitest.config.ts` で relay POST responseStatus logging contract を固定する。
