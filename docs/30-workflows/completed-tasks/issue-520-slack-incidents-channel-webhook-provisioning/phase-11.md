# Phase 11: 手動 channel 作成 / webhook 発行 / 実 smoke evidence — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local（ローカル redaction script / `.env.example` / test hardening は反映済み。実 channel 作成 / webhook 発行 / secret 投入 / smoke 発火は user approval 経由 runtime wave） |
| evidence_state_vocabulary | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

Slack workspace への不可逆 SaaS 操作（`#ubm-hyogo-incidents` channel 作成 / incoming webhook 発行）と、その結果 secret 値の 1Password / Cloudflare staging / Cloudflare production / GitHub Actions への配置、staging→production の段階的 smoke 着弾確認、redaction grep gate を **G1〜G4 multi-stage approval gate** で順序制御し、各段階の evidence を **redaction-safe template** に記録する手順を確定する。実操作は本仕様書 cycle では実行しない。

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`

## NON_VISUAL 縮約原則

- 本タスクは secret-only 変更（外部 SaaS provisioning + secret 配置）であり、UI スクリーンショット evidence は取得しない（`visualEvidence: NON_VISUAL`）
- D1 schema parity verification は本タスクでは **N/A**（D1 schema 変更を含まない / secret-only）と明記
- evidence は redaction-safe text log のみ。webhook URL 実値・token・URL fragment はいかなる evidence にも記載しない

## evidence 分離の原則

| 種別 | path | 役割 |
| --- | --- | --- |
| index / template / G1〜G4 サマリ | `outputs/phase-11/main.md` | Phase 11 概要 / 状態語彙 / template 集約 / G1〜G4 通過記録テーブル |
| channel + 1Password + staging secret | `outputs/phase-11/channel-provisioning-log.md` | G1 / G2 段階の作業記録（channel 作成 / webhook 発行 / 1Password 投入 / Cloudflare staging secret 配置） |
| production secret + smoke + redaction | `outputs/phase-11/webhook-smoke-log.md` | G3 / G4 段階の作業記録（Cloudflare production secret 配置 / staging smoke / production smoke / redaction grep gate） |
| 検証ログ | `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` | 機械検証 evidence（redaction grep gate / typecheck / lint / test / build） |

1 ファイルに channel/staging/production を混在させない（INV: env / 操作境界）。

## 状態語彙 PASS_BOUNDARY_SYNCED_RUNTIME_PENDING

| 段階 | 意味 |
| --- | --- |
| PASS | 該当 G ゲートの user approval が記録され、対応する操作が完了している |
| BOUNDARY | env / G ゲート境界が破られていない（staging と production が別 evidence に分離 / 順序遵守） |
| SYNCED | 1Password / Cloudflare staging / Cloudflare production / GitHub Actions の 4 配置先が同名 secret で揃っている（name-only 確認） |
| RUNTIME_PENDING | 仕様書 cycle 段階では実発火が pending であり、runtime wave で `<provisioned>` placeholder を実測値に置換する |

`outputs/phase-11/main.md` の各 G ゲートセクションでは、本語彙のいずれの状態かを明示する。

## 各 evidence ファイルの記録項目（template）

### `outputs/phase-11/main.md`（template）

```
- 状態語彙: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
- G1 (channel + webhook 作成): <pending|PASS> / approver: <user> / timestamp: <ISO8601>
- G2 (1Password + Cloudflare staging secret): <pending|PASS> / approver: / timestamp:
- G3 (Cloudflare production secret + staging smoke PASS): <pending|PASS> / approver: / timestamp:
- G4 (production smoke PASS + redaction grep 0 hit): <pending|PASS> / approver: / timestamp:
- channel-provisioning-log.md final hash (sha256, optional):
- webhook-smoke-log.md final hash (sha256, optional):
- D1 schema parity: N/A (secret-only change)
- visual evidence: N/A (NON_VISUAL)
```

### `outputs/phase-11/channel-provisioning-log.md`（template）

```
## G1: Slack channel 作成 + incoming webhook 発行

- G1 user approval timestamp (ISO8601): <required>
- G1 approver (user): <required>
- channel name: ubm-hyogo-incidents
- channel id (先頭 4 文字のみ / 末尾 redact): C***...
- channel created_at (ISO8601):
- inviter / creator (Slack user display name のみ・workspace token 記載禁止):
- incoming webhook 発行日時 (ISO8601):
- webhook URL: <provisioned> (1Password 参照のみ・実値記載禁止)
- 1Password item path: op://UBM-Hyogo/Slack Incident Webhook (production)/url
- 1Password item 登録 timestamp (ISO8601):

## G2: 1Password + Cloudflare staging secret 配置

- G2 user approval timestamp (ISO8601): <required>
- G2 approver (user): <required>
- 1Password staging item path: op://UBM-Hyogo/Slack Incident Webhook (staging)/url
- 1Password staging item 登録 timestamp:
- bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --env staging 実行 timestamp:
- bash scripts/cf.sh secret list --env staging 出力 (name-only 抜粋):
    SLACK_WEBHOOK_INCIDENT
- redaction quick-check (rg 'hooks\.slack\.com/services/[A-Z0-9]' channel-provisioning-log.md): 0 hit
```

### `outputs/phase-11/webhook-smoke-log.md`（template）

```
## G3: Cloudflare production secret 配置 + staging smoke PASS

- G3 前提: G1 / G2 PASS / channel-provisioning-log.md に G2 セクション完了
- G3 user approval timestamp (ISO8601): <required>
- G3 approver (user): <required>
- bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --env production 実行 timestamp:
- bash scripts/cf.sh secret list --env production 出力 (name-only 抜粋):
    SLACK_WEBHOOK_INCIDENT
- GitHub Actions secret 登録 timestamp (gh secret set --repo daishiman/UBM-Hyogo):
- gh secret list 出力 (name-only 抜粋):
    SLACK_WEBHOOK_INCIDENT

### staging smoke POST → 着弾確認

- staging POST timestamp (ISO8601):
- response.ok:
- Slack message prefix: [STAGING SMOKE]
- Slack permalink: <T*/C*/p* 形式のみ・URL fragment redaction>
- 着弾確認 timestamp (ISO8601):
- AC-5 PASS: yes/no

## G4: production smoke + redaction grep gate

- G4 user approval timestamp (ISO8601): <required>
- G4 approver (user): <required>

### production smoke POST → 着弾確認

- production POST timestamp (ISO8601):
- response.ok:
- Slack message prefix: [PRODUCTION SMOKE]
- Slack permalink: <T*/C*/p* 形式のみ・URL fragment redaction>
- 着弾確認 timestamp (ISO8601):
- AC-6 PASS: yes/no

### redaction grep gate (3 系統 + 1)

- rg -n 'hooks\.slack\.com/services/[A-Z0-9]' . hit count: 0
- rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' . hit count: 0
- rg -n 'xox[bp]-' . hit count: 0
- rg -n '<workspace-fragment-pattern>' . hit count: 0  # 具体パターンは Phase 1 INV(workspace-fragment) 参照（本仕様書には記載しない）
- AC-7 PASS: yes/no
```

## 記録禁止項目（Phase 1 INV #16 再掲）

- Slack incoming webhook URL 実値（Slack の incoming webhook URL 完全形）
- Slack workspace token / bot token（Slack token 完全形）
- Slack workspace ID（`T...` の完全形 / 但し permalink 抜粋の `T*/C*/p*` プレフィックスは可）
- channel ID 完全形（先頭 4 文字 + `***` で redact）
- workspace 固有の URL fragment（issue-520 が対象とする workspace 識別子の文字列。実値は本仕様書外で管理する）
- Cloudflare API Token / 1Password session token
- raw HTTP response の secret 含有領域（response.headers / response.body のうち token / cookie 部分）

## redaction grep gate（再掲・4 系統）

```bash
rg -n 'hooks\.slack\.com/services/[A-Z0-9]' .
rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' .
rg -n 'xox[bp]-' .
# workspace 固有 fragment は別途運用 secret として管理し、grep pattern も secret 経由で注入する
```

PASS 条件: 4 系統すべて 0 hit。1 件でも hit したら G4 通過禁止 → 該当 evidence 修正 → 再 grep。

## G1〜G4 multi-stage approval gate（運用契約）

| gate | 発動条件 | user approval 必須項目 | 通過記録 path |
| --- | --- | --- | --- |
| G1 | Slack channel 作成 + incoming webhook 発行（不可逆 SaaS 操作） | timestamp / approver / channel id 先頭 4 文字 / 1Password item path | `outputs/phase-11/channel-provisioning-log.md` G1 セクション |
| G2 | 1Password 正本 item 追加 + Cloudflare **staging** secret 配置 | timestamp / approver / `cf.sh secret list --env staging` name-only 出力 | `outputs/phase-11/channel-provisioning-log.md` G2 セクション |
| G3 | Cloudflare **production** secret 配置 + staging smoke PASS（AC-5）の確認 | timestamp / approver / `cf.sh secret list --env production` name-only 出力 / staging permalink redacted | `outputs/phase-11/webhook-smoke-log.md` G3 セクション |
| G4 | production smoke PASS（AC-6）+ redaction grep 4 系統 0 hit + evidence 確定保存 | timestamp / approver / production permalink redacted / grep gate 出力 | `outputs/phase-11/webhook-smoke-log.md` G4 セクション |

**合算承認禁止**: G1〜G4 を 1 回の user approval にまとめない。各 G ゲートで独立した user approval timestamp を取得する。

## D1 schema parity verification

本タスクは secret 配置と外部 SaaS provisioning に閉じ、D1 schema を変更しない。よって D1 schema parity verification は **N/A**（`outputs/phase-11/main.md` に明記）。

## redaction-safe verification（self-check）

evidence 確定前に必ず以下を実行し、`outputs/phase-11/evidence/grep-gate.log` に出力を保存する:

```bash
{
  rg -n 'hooks\.slack\.com/services/[A-Z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hit (hooks.slack.com)"
  rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}'      docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hit (B-id/token)"
  rg -n 'xox[bp]-'                            docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hit (xoxb/xoxp)"
  rg -n "${WORKSPACE_FRAGMENT_PATTERN:?set from 1Password}" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hit (workspace fragment)"
} > outputs/phase-11/evidence/grep-gate.log 2>&1
```

PASS 条件: `OK: 0 hit` が 4 行揃うこと。

## 取得タイミング / 手段

| evidence | タイミング | 手段 |
| --- | --- | --- |
| channel-provisioning-log.md (G1) | Slack admin UI で channel 作成 + webhook 発行 直後 | channel id 先頭 4 文字を redact 形式で記録 / webhook URL は op:// 参照 path のみ |
| channel-provisioning-log.md (G2) | 1Password CLI 投入 + `cf.sh secret put --env staging` 直後 | `cf.sh secret list --env staging` の name-only 出力をコピー |
| webhook-smoke-log.md (G3) | `cf.sh secret put --env production` + staging smoke 着弾確認直後 | Slack permalink を `T*/C*/p*` プレフィックス形式で手動コピー（fragment redaction） |
| webhook-smoke-log.md (G4) | production smoke 着弾確認 + redaction grep 0 hit 確認後 | production permalink + grep gate 出力をログ保存 |
| evidence/typecheck.log etc | local static hardening の証跡。typecheck / lint / focused test / build / grep gate の結果を `outputs/phase-11/evidence/` 配下に保存する | `outputs/phase-11/evidence/typecheck.log` |

## 制約事項

- 本仕様書 cycle では `outputs/phase-11/main.md` / `channel-provisioning-log.md` / `webhook-smoke-log.md` を **template-only** として作成する（runtime PASS 証跡として扱わない）
- webhook URL 実値・workspace token・channel id 完全形を log / template / docs に書かない
- `wrangler` 直接実行禁止（必ず `bash scripts/cf.sh` 経由）
- staging-only / production-only の片側 PASS で G4 通過判定しない
- workspace 固有 URL fragment（実値は 1Password で管理）はいかなる evidence・docs・PR 本文・commit message にも記載しない

## 自走禁止操作（Phase 11 仕様書段階で禁止）

1. 実 Slack channel `#ubm-hyogo-incidents` の作成
2. 実 incoming webhook の発行
3. 1Password 正本 item への実 webhook URL 投入
4. `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT` の発火（staging / production）
5. `gh secret set SLACK_WEBHOOK_INCIDENT` の発火
6. staging / production smoke endpoint への実 POST
7. `git commit` / `git push` / PR 作成

これらは Phase 11 runtime wave で G1〜G4 を順次通過させながら user approval 後に実行する。

## 成果物

- `outputs/phase-11/main.md`（状態語彙 / G1〜G4 通過テーブル / D1 parity N/A 明記）
- `outputs/phase-11/channel-provisioning-log.md`（template-only / G1 / G2）
- `outputs/phase-11/webhook-smoke-log.md`（template-only / G3 / G4）
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`

## 完了条件（本仕様書段階）

- [ ] `outputs/phase-11/main.md` に状態語彙 PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / G1〜G4 テーブル / D1 parity N/A 明記が揃う
- [ ] `channel-provisioning-log.md` / `webhook-smoke-log.md` に G1〜G4 各セクション template が記述され、webhook URL 実値は `<provisioned>` で代替されている
- [ ] redaction grep gate（4 系統）が定義され、PASS 条件が明文化されている
- [ ] D1 schema parity verification = N/A（secret-only）が明記されている
- [ ] visualEvidence: NON_VISUAL が明記され、UI スクリーンショット evidence が要求されていない
- [ ] G1〜G4 が独立した user approval timestamp を要求する設計（合算承認禁止）が記述されている

## タスク 100% 実行確認

- [ ] template-only として作成され、実 webhook URL / token / 完全 channel ID が含まれていない
- [ ] staging / production の evidence が別ファイルに分離されている
- [ ] runtime wave で `<provisioned>` を実測値に置換する設計が明示

## 次 Phase への引き渡し

Phase 12 へ:

- AC-1〜AC-8 と evidence path（channel-provisioning-log.md / webhook-smoke-log.md）の対応
- G1〜G4 multi-stage approval gate 設計
- redaction grep gate 4 系統
- 状態語彙 PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
- D1 schema parity = N/A の根拠

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
