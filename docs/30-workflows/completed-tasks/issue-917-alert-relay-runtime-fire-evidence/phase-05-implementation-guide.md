---
phase: 5
title: Implementation Guide
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 5: Implementation Guide — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: コード変更を一切伴わない。本フェーズは runtime evidence の取得手順と evidence MD 雛形 / secret redact ルールを規定するのみ。

## 0. 変更ファイル一覧（本サイクル）

| パス | 種別 | 備考 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/**` | 新規 | 本仕様書一式 |

> 後続 runtime サイクルで以下が変更される（本サイクルでは触らない）:
> - `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md`（新規）
> - `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md`（編集）
> - `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md`（編集）

## 1. step-01: `CF_WEBHOOK_AUTH_SECRET` name presence 確認（user-gated）

```bash
# 値は表示しない（cf.sh / wrangler 仕様で name 列のみ）
bash scripts/cf.sh secret list --env staging
bash scripts/cf.sh secret list --env production    # 実施範囲は deploy ポリシー次第
```

evidence: 出力中に `CF_WEBHOOK_AUTH_SECRET` が含まれていることを MD §1 に記録（行のみ転記・値の列なし）。

不在時のみ投入（user-gated）:

```bash
bash scripts/cf.sh secret put --env staging CF_WEBHOOK_AUTH_SECRET
# 入力 prompt: 1Password の op://Vault/Item/Field から値を貼り付け
```

## 2. step-02: 配線反映前 tail（可能な範囲で記録）

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty
```

- 配線反映前の tail に `event: "sheets.auth.healthcheck"` の `reason: "missing API_INTERNAL_BASE_URL or token"` が出ていた記録があれば evidence MD §2 before に転記。
- 過去の tail が残っていない場合は「配線後のみ観測」と明記。
- このステップは情報的価値が高いが必須ではない（後段の dry-run + 200 観測でも AC-4 は充足する）。

## 3. step-03: staging 再 deploy → deploy 後 tail（no-op 消失確認）

```bash
# deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# tail（別シェル）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty
```

- deploy 出力の `Deployed` 行と `Current Version ID` を evidence MD §2 after に転記。
- tail を 15 分以上保持し、次の `*/15 cron` 起動を待つ。
- 起動後の `event: "sheets.auth.healthcheck"` ログに `alert_relay_skipped` / `missing API_INTERNAL_BASE_URL or token` が **出ないこと** を確認。
- 出力例があれば MD §2 after に転記（必ず secret/token redact 確認）。

## 4. step-04: SA 資格情報失効 dry-run 実施（user-gated）

親 UT-25-DERIV-02 Phase 11 の controlled invalidation 手順を **そのまま** 再利用する（本タスクで再発明しない・元 spec §3.1 / §3.4 教訓）。手順の概要:

1. staging Sheets シートの SA 共有権限を一時的に剥奪する、または GOOGLE_SERVICE_ACCOUNT_JSON を一時的に無効化する（親 spec が正本）。
2. Sheets API が 401 / 403 を返す状態を 15 分以上維持する。
3. cron 起動を待つ（手動トリガが可能なら手動で起動）。
4. dry-run 終了後は SA 権限を即時復元する。

> 本仕様書では具体的な invalidation コマンドを再記述しない（親 UT-25-DERIV-02 を単一の正本とする）。

## 5. step-05: dry-run 中の tail で relay POST 到達ステータスを記録

dry-run 維持中の tail から以下を MD §3-4 に記録:

| 項目 | 期待値 |
| --- | --- |
| Sheets API 観測 status | 401 または 403 |
| `event: "sheets.auth.alert_relay_post"` の `responseStatus` | 200（ケース A 正本） |
| POST URL | `https://api-staging.ubm-hyogo.workers.dev/internal/alert-relay` |
| header `cf-webhook-auth` | `<redacted>`（実値は転記しない・出力されている場合は MD 化前に redact） |

`responseStatus: 401` が観測された場合は送受信 token 不整合の可能性があり、`CF_WEBHOOK_AUTH_SECRET` の値ずれ / `INTERNAL_ALERT_TOKEN` の誤投入を疑う（issue-857 で除外済みのケース C の罠が実機で再発していないか確認）。

## 6. step-06: 通知到達（任意）

通知先（Slack / mail）が設定されている場合のみ、UT-17 / UT-08 経路の着信を Slack channel / mailbox で確認し、MD §5 にスクリーンショット **ではなく** テキスト要約（receipt time / channel name など、機密性のない情報のみ）を記録。通知先未設定なら「relay 到達までを evidence 範囲とする」と明記。

## 7. step-07: evidence MD 作成

Phase 4 §4 の雛形に従って `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` を作成する。secret 値・token 値・cookie 値は一切転記せず、`<redacted>` 表記で統一する。

## 8. step-08: issue-857 implementation-guide 更新

Phase 4 §5 の diff を `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` に適用する。`verified` キーワードを残し、相対 link で本 evidence MD を指す。

## 9. step-09: 親 UT-25-DERIV-02 close-out 逆参照

`docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` の close-out / 関連 issue セクションに以下 1 行を追記:

```md
- runtime evidence: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md`（issue #917 / Refs; workflow spec: `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/`）
```

## 10. step-10: 元 unassigned-task spec consumed 化（後続サイクル）

`docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` の consumed 化は **本サイクルでは実施しない**。runtime evidence 取得が完了した後続サイクルで以下を行う:

- 元 spec を `docs/30-workflows/completed-tasks/` 配下へ移動、または status ヘッダのみ consumed 化（コミット履歴で trace 可能な手段を選択）。
- 移動時は内部参照（aiworkflow ledgers 等）の stale を grep で確認し、すべて新 path へ補修する。

## 11. secret / redact ルール（横断）

| 種別 | 扱い |
| --- | --- |
| `CF_WEBHOOK_AUTH_SECRET` の値 | 評価でも MD でも転記しない。`secret list` の **name 列のみ** 記録 |
| `cf-webhook-auth` header 値 | tail 出力に含まれている場合は MD 化前に `<redacted>` へ置換 |
| OAuth トークン / SA JSON | 一切表示・記録しない |
| Cloudflare Account ID | 機密ではないが本 MD では不要なため省略 |
| Worker URL | 公開 URL のため転記してよい |
| Version ID | 機密ではないため転記してよい |
