# Phase 10: リリース準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-Followup-004) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リリース準備 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 9 (品質ゲート) |
| 次 Phase | 11 (受入テスト・evidence) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 親 workflow | ut-17-cloudflare-analytics-alerts |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は staging / production への適用順序・rollback 手順・monthly healthcheck runbook の切替を確定する。実 Cloudflare account への変更操作を含み、SOP として実行可能な粒度で固定する必要があるため実装仕様書扱い。`wrangler` 直接禁止条件下で `scripts/cf.sh alerts` 経由のみで完結する手順とする。 |

---

## 目的

Phase 8 / 9 を通過した IaC 実装を、Cloudflare account に対し以下順序で適用する SOP を固定する:

1. 1Password / GitHub Secrets の token 準備
2. staging account への適用と冪等性検証
3. production account への適用
4. monthly healthcheck runbook の手順差し替え
5. rollback / 緊急停止手順

実適用そのもの（`bash scripts/cf.sh alerts apply --yes`）は本 spec では実行せず、Phase 11（受入テスト）でユーザー明示承認後に実施する。

---

## 10-1. リリース前提条件

| # | 条件 | 確認方法 |
| --- | --- | --- |
| P1 | Phase 9 G1〜G12 全 gate green | `mise exec -- pnpm alerts:gate` 成功 |
| P2 | 1Password に `UBM-Hyogo Alerts Apply Token` Item 作成済（scope: `Account.Notifications:Edit`） | 1Password 手動確認 |
| P3 | 1Password に `UBM-Hyogo Alerts Read Token` Item 作成済（scope: `Account.Notifications:Read`） | 1Password 手動確認 |
| P4 | `.env` に `CLOUDFLARE_ALERTS_TOKEN_READ=op://Vault/UBM-Hyogo Alerts Apply Token/credential` の参照行を追加済 | `grep CLOUDFLARE_ALERTS_TOKEN_READ .env` |
| P5 | GitHub Secrets に `CLOUDFLARE_ALERTS_TOKEN_READ`（read-only token 実値）が登録済 | GitHub UI / `gh secret list` |
| P6 | 1Password に `UT-17-Relay` Item 作成済（`url` / `cf-webhook-auth` field） | 1Password 手動確認 |
| P7 | UT-17 relay Worker が staging / production 双方に deploy 済 | `bash scripts/cf.sh deploy ... --dry-run` で確認 |

> P2 / P3 / P5 / P6 はユーザー操作。Claude Code は代行できない。CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」に従い、ユーザー明示承認なしでは進めない。

---

## 10-2. staging 適用手順

> staging account は production account と分離されている前提（UT-17 phase-08 と同条件）。account 切替は `CLOUDFLARE_ACCOUNT_ID` 環境変数で行い、1Password 側に `UBM-Hyogo Alerts Apply Token` を staging / production 別 Item で持つ場合は `op://Vault/UBM-Hyogo Alerts Apply Token-Staging/credential` のように Item 名で切替える。

| # | アクション | コマンド | 期待 |
| --- | --- | --- | --- |
| S0 | account 切替（staging） | `export CLOUDFLARE_ACCOUNT_ID=<staging-account-id>` | env が staging に向く |
| S1 | 認証確認 | `bash scripts/cf.sh whoami` | account id が staging のものと一致 |
| S2 | 適用前 dry-run | `bash scripts/cf.sh alerts apply` | stdout に `[dry-run]` 行が 5〜6 件（webhook 1 + policy 5、R2 含む） |
| S3 | 適用前 diff (現状把握) | `bash scripts/cf.sh alerts diff` | exit 0 (既存なし) or exit 2 で missing 一覧（初回適用時は全件 missing） |
| S4 | 実適用 | `bash scripts/cf.sh alerts apply --yes` | webhook → policy 順で POST 完了。stderr に error 行なし |
| S5 | 適用直後 diff | `bash scripts/cf.sh alerts diff` | exit 0 / stdout `no drift detected` |
| S6 | 2 回目 apply で冪等性確認 | `bash scripts/cf.sh alerts apply --yes` | stdout に POST/PUT 0 件、または `no changes` |
| S7 | Cloudflare Dashboard 目視 | https://dash.cloudflare.com → staging account → Notifications → Destinations / Policies | 4 + 1 (R2) policy + 1 webhook が存在し enabled=true |
| S8 | 通知配信テスト | Cloudflare Dashboard で 1 policy を選択 → "Send Test Notification" | relay Worker に到達し Slack staging チャンネルにメッセージが表示される（UT-17 phase-11 と同一手順） |

> S2〜S8 の各実行結果（stdout / Dashboard スクリーンショット）は Phase 11 で `outputs/phase-11/evidence/` に保存する evidence 候補。

---

## 10-3. production 適用手順

staging で S5（drift なし）と S8（通知配信成功）が確認できた後にのみ実行する。

| # | アクション | コマンド | 期待 |
| --- | --- | --- | --- |
| P0 | account 切替（production） | `export CLOUDFLARE_ACCOUNT_ID=<production-account-id>` | env が production に向く |
| P1 | 認証確認 | `bash scripts/cf.sh whoami` | account id が production のものと一致 |
| P2 | 適用前 dry-run | `bash scripts/cf.sh alerts apply` | stdout に `[dry-run]` 行 |
| P3 | 適用前 diff | `bash scripts/cf.sh alerts diff` | exit 2 で全件 missing（初回） or 既存と一致なら 0 |
| P4 | webhook destination 単独適用 | （後述 10-3a） | webhook 1 件のみ POST |
| P5 | webhook 通知到達テスト（test fire） | Cloudflare Dashboard で 1 policy を仮作成 → test notification（または `scripts/cf.sh alerts test-fire <webhook-name>`、Phase 13 unassigned-task で機能拡張案） | relay Worker のログに到達確認 |
| P6 | policy 一括適用 | `bash scripts/cf.sh alerts apply --yes` | 全 5 policy が POST 完了 |
| P7 | 適用直後 diff | `bash scripts/cf.sh alerts diff` | exit 0 / `no drift detected` |
| P8 | 2 回目 apply 冪等性 | `bash scripts/cf.sh alerts apply --yes` | POST/PUT 0 件 |
| P9 | 通知配信テスト | Dashboard "Send Test Notification" × 1 policy（無料枠超過状態は作れないため代替） | Slack production チャンネルにメッセージ表示 |

### 10-3a. webhook destination 単独適用（P4 詳細）

webhook destination は policy より先に必ず存在している必要があるため、**初回 production 適用は段階分離**する:

```bash
# webhook destination だけ apply（policy はスキップ）
bash scripts/cf.sh alerts apply --yes --only=webhooks
```

> `--only=webhooks` フラグは Phase 8 cli.ts に追加する。policy より先に webhook を確実に作るための安全弁。staging では同フラグ未使用でも順序保証されるが、production 初回のみ明示的に分離する。

---

## 10-4. monthly healthcheck runbook 切替

UT-17 で作成した `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の「Notification Policy 5 件が存在し webhook が紐付いていることを Dashboard で目視確認」項目を以下に差し替える:

| Before (Dashboard 目視) | After (本タスク完了後) |
| --- | --- |
| Cloudflare Dashboard を開き、Notifications タブで policy が 5 件存在し webhook destination が紐付いていることを目視 | `bash scripts/cf.sh alerts diff` を実行し exit 0 (`no drift detected`) を確認。drift があれば該当行を runbook の証跡欄に貼り付け、`apply --yes` で復元 |

追加項目:

| # | 月次チェック項目 | コマンド | 合格基準 |
| --- | --- | --- | --- |
| M1 | drift 検知 | `bash scripts/cf.sh alerts diff` | exit 0 |
| M2 | quota-base 差分確認 | Cloudflare 公式 free tier 値（10-1 P2 参照 URL）と `infra/cloudflare-alerts/quota-base.json` を目視照合 | 差分なし。あれば PR を起票し `quota-base.json` を更新 |
| M3 | token rotation 残期間 | 1Password Item の `expires` field を確認 | 残 30 日以上 |
| M4 | 通知配信テスト | Cloudflare Dashboard "Send Test Notification" × 1 policy | Slack に到達 |

差し替え PR は本 Phase 完了時に Phase 11 evidence 取得とセットで作成する。runbook 修正は本 Phase の成果物の一部。

---

## 10-5. rollback / 緊急停止手順

### 10-5a. policy 単位の無効化（推奨・低リスク）

drift / 誤適用を発見したが repo 側定義を rollback する必要がない場合（例: Cloudflare 側の値を一時的に repo 定義通りに戻すだけ）:

```bash
bash scripts/cf.sh alerts apply --yes
```

repo 定義が正本なので、`apply` で repo 状態に強制同期される。

### 10-5b. policy 単位の一時停止

production で誤検知が頻発し、特定 policy を一時的に停止したい場合:

| 手順 | 内容 |
| --- | --- |
| 1 | 当該 `infra/cloudflare-alerts/policies/<name>.json` の `enabled: true` → `false` を PR で変更 |
| 2 | PR merge 後、`bash scripts/cf.sh alerts apply --yes` で反映 |
| 3 | `bash scripts/cf.sh alerts diff` で `enabled=false` 状態の drift なし確認 |
| 4 | 原因解消後、`enabled: true` に戻す PR を作成し再 apply |

> Dashboard から直接停止すると drift が出るため、必ず repo 経由で行う。これが IaC 化の根幹。

### 10-5c. webhook destination の緊急 rotate

`CF_WEBHOOK_AUTH_SECRET` が漏洩した疑いがある場合:

| 手順 | 内容 |
| --- | --- |
| 1 | UT-17 phase-07 の rotation runbook（`outputs/phase-07/rotation-runbook.md`）に従い新 secret を 1Password に保存 |
| 2 | `infra/cloudflare-alerts/webhooks/ut-17-relay.json` の `secretHeader.valueRef` は変更不要（参照先 1Password の値だけ rotate） |
| 3 | `bash scripts/cf.sh alerts apply --yes` で webhook destination を PUT。新 secret が Cloudflare 側に流れる |
| 4 | UT-17 relay Worker 側の `CF_WEBHOOK_AUTH_SECRET` も `bash scripts/cf.sh secret put` で同時更新 |
| 5 | テスト通知で新 secret 経路が通ることを確認 |

### 10-5d. 完全停止（最終手段）

万一全 policy を即時停止したい場合:

| 手順 | 内容 |
| --- | --- |
| 1 | Cloudflare Dashboard → Notifications → 全 policy を手動 disable（drift を承知の上） |
| 2 | repo 側で全 policy の `enabled: false` を 1 PR で適用 |
| 3 | `bash scripts/cf.sh alerts apply --yes` で repo と Cloudflare を再同期 |

> Dashboard 直叩きは drift を必ず生むため、その後 repo 側でも `enabled: false` に揃えるまで `alerts diff` は exit 2 を返す。これは設計通りの挙動（drift 検知の正常動作）。

### 10-5e. 削除（将来機能）

現 Phase 10 では `cf.sh alerts delete --name <name>` はスコープ外（YAGNI）。削除運用は Cloudflare Dashboard / API の明示的な手動オペレーションとして扱い、IaC の通常運用は `apply` / `diff` / `list` に限定する。

それまでは Dashboard 手動削除 + repo 側ファイル削除 + `apply --yes` の 3 ステップで運用する。

---

## 10-6. リリース後 evidence 取得計画

Phase 11（受入テスト・evidence）で取得する evidence の事前計画:

| Evidence | 取得方法 | 保存先 |
| --- | --- | --- |
| staging 適用ログ | 10-2 S2 / S4 / S5 / S6 の stdout | `outputs/phase-11/evidence/staging-apply.log` |
| production 適用ログ | 10-3 P2 / P6 / P7 / P8 の stdout | `outputs/phase-11/evidence/production-apply.log` |
| Cloudflare Dashboard スクリーンショット | 10-2 S7 / 10-3 P9 | `outputs/phase-11/evidence/dashboard-{staging,production}.png` |
| Slack 通知到達スクリーンショット | 10-2 S8 / 10-3 P9 | `outputs/phase-11/evidence/slack-{staging,production}.png` |
| `alerts diff` exit code 0 ログ | 10-2 S5 / 10-3 P7 | `outputs/phase-11/evidence/diff-after-apply.log` |
| 冪等性検証 (2 回目 write-log 空) | 10-2 S6 / 10-3 P8 | `outputs/phase-11/evidence/idempotency.log` |
| runbook 差し替え PR | 10-4 | PR URL を `outputs/phase-11/evidence/runbook-update-pr.md` に記録 |

---

## 10-7. リリース承認ゲート

ユーザー明示承認が必要な操作（Claude Code 単独実行禁止）:

| # | 操作 | 承認方法 |
| --- | --- | --- |
| A1 | staging `apply --yes` 初回実行 | ユーザーがコマンドを発話 or PR コメントで「staging apply OK」 |
| A2 | production `apply --yes --only=webhooks` 実行 | 同上「production webhook apply OK」 |
| A3 | production `apply --yes` 本体実行 | 同上「production policy apply OK」 |
| A4 | rollback (10-5c の secret rotate) | 同上「rotate OK」 |
| A5 | GitHub Actions workflow yml の commit / push | 同上「workflow commit OK」 |

> 上記いずれも `bash scripts/cf.sh` の read-only 操作（`whoami` / `alerts list` / `alerts diff` / `alerts plan` / dry-run `alerts apply`）は事前 evidence として承認なしで実行可能。書き込み系のみ承認必須。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-08.md | 実装本体 |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-09.md | 品質ゲート |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 差し替え対象 runbook |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-08.md | UT-17 親タスクの staging→production フロー |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-07/rotation-runbook.md | cf-webhook-auth rotation |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | wrangler 直接禁止 |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | webhook destination 仕様 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/release-sop.md | 10-1〜10-7 の確定版 |
| ドキュメント | outputs/phase-10/staging-checklist.md | 10-2 の S0〜S8 をチェックリスト化 |
| ドキュメント | outputs/phase-10/production-checklist.md | 10-3 の P0〜P9 + 10-3a をチェックリスト化 |
| ドキュメント | outputs/phase-10/rollback-runbook.md | 10-5a〜10-5e を独立 runbook 化 |
| ドキュメント | outputs/phase-10/monthly-healthcheck-diff.md | 10-4 の Before / After + M1〜M4 |
| メタ | artifacts.json | phase-10 を completed に更新 |

---

## 完了条件

- [ ] 10-1 リリース前提条件 P1〜P7 が確定し、各確認方法が固定
- [ ] 10-2 staging 適用手順 S0〜S8 がコマンドレベルで固定（`wrangler` 直接呼び出しがない）
- [ ] 10-3 production 適用手順 P0〜P9 と 10-3a webhook 単独 apply フラグ `--only=webhooks` が固定
- [ ] 10-4 monthly healthcheck runbook の差し替え内容（Before / After + M1〜M4）が固定
- [ ] 10-5 rollback 手順 5 種（a〜e）が固定、削除機能の YAGNI 判断と将来 followup 起票方針が明記
- [ ] 10-6 evidence 取得計画 7 種が固定
- [ ] 10-7 承認ゲート A1〜A5 が固定（ユーザー明示承認なしの実適用禁止）
- [ ] CONST_007「テスト先送り禁止」: Phase 7 テストが本 Phase 着手時点で green であること（Phase 9 G9 / G10 で担保）

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（受入テスト・evidence）
- 引き継ぎ事項:
  - 10-6 evidence 取得計画を Phase 11 がそのまま実行
  - 10-7 承認ゲート A1〜A5 をユーザーから順次取得し、取得後に staging / production 適用を実施
  - 10-4 monthly healthcheck runbook 差し替え PR は Phase 11 evidence 取得と同時に作成
  - GitHub Actions workflow yml（Phase 9 9-5）は本 Phase 完了後、ユーザー承認 A5 を得てから commit / push
- ブロック条件:
  - Phase 9 G1〜G12 のいずれかが red の場合は本 Phase 10 に進めない
  - 1Password Item P2 / P3 / P6 が未発行の場合は staging 適用に進めない
  - production 適用は staging S5 + S8 成功なしには許可しない
