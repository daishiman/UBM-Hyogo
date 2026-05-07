# Phase 10: リリース準備 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: 本 Phase は GitHub `production-slack-delivery` environment の approver 設定、`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` を含む secret/variable の本番投入、Slack workspace 側の bot 招待・scope 確認、`gh workflow disable` を含む rollback plan、CHANGELOG 草案を扱う。GitHub 設定への副作用と Slack workspace 側の admin 操作確認を含むため CONST_004 により docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 10 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| 想定実行者 | Claude Code（チェックリスト実行）+ release oncall（GitHub environment approver 任命） |

## 目的

Phase 9 で品質ゲートを通過した実装を、production channel への自動配信を**安全に**開放できる状態に整える。具体的には:

1. GitHub Actions environment `production-slack-delivery` の approver を確定し、environment protection rule（required reviewer / wait timer）を設定済みにする
2. GitHub Secrets / Variables（`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` / `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` / `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID`）が本番投入済みであることを確認する
3. Slack workspace 側で bot user が production / dry-run の両 channel に invite 済みかつ必要 scope を保持していることを確認する
4. rollback plan（workflow 無効化手順）を文書化する
5. dry-run channel での final smoke を Phase 11 着手前に通過させる
6. CHANGELOG / release notes 草案を作成し、Phase 12 ドキュメント更新の input にする
7. monitoring（GitHub Actions failure 通知）の経路を確定する

## production environment approver 決定

| 項目 | 値 |
| --- | --- |
| environment 名 | `production-slack-delivery` |
| 必須 reviewer 数 | 1 |
| approver | release oncall（個人開発期は `@daishiman` を default approver とする。oncall 譲渡時は GitHub environment 設定で同期更新する） |
| wait timer | 0 分（incident runbook の即時配信が目的のため待機なし） |
| deployment branches | `main` のみ |
| 設定確認コマンド | `gh api repos/daishiman/UBM-Hyogo/environments/production-slack-delivery` |

**設定 JSON 例（reference のみ。実 API token 値は記載しない）**:

```json
{
  "wait_timer": 0,
  "reviewers": [{ "type": "User", "id": "<daishiman の user id>" }],
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
```

approver 決定の **記録先**: `outputs/phase-10/main.md` の「approver assignment」セクション。

## secret / variable 本番設定確認チェックリスト

| # | 種別 | 名前 | 設置先 | 確認コマンド | 期待結果 |
| --- | --- | --- | --- | --- | --- |
| S1 | GitHub Secret | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | repo secret | `gh secret list \| grep SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | 1 行 hit（値は表示されない） |
| S2 | GitHub Variable | `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` | repo variable | `gh variable list \| grep SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` | 1 行 hit（id 値は仕様書に転記しない） |
| S3 | GitHub Variable | `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` | repo variable | `gh variable list \| grep SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` | 1 行 hit |
| S4 | 1Password 正本 | `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` | 1Password vault | `op item get "Slack Bot - Incident Runbook" --vault UBM-Hyogo --field credential --reveal` をローカルで実行（出力は **画面外**で破棄） | 取得成功 / 値はファイル化しない |
| S5 | secret 派生整合 | 1P 値 == GitHub Secret 値 | rotation 時の手順 | rotation runbook 参照（本仕様書では値を比較しない） | 同期済 |

> CONST-RUN-01: token 値そのものをこのファイル・log・PR description に**書かない**。値の存在確認のみ行う。

設定不足が検出された場合の補填手順は `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の rotation セクション（Phase 12 で追記予定）に従う。

## Slack workspace 側の最終確認

| # | 確認項目 | 確認手段 | 期待結果 |
| --- | --- | --- | --- |
| W1 | bot user が `#ubm-hyogo-incident-runbook` に invite 済 | Slack `/who` または admin UI で member list 確認 | bot user が member |
| W2 | bot user が `#ubm-hyogo-incident-runbook-dryrun` に invite 済 | 同上 | bot user が member |
| W3 | bot scope に `chat:write` / `chat:write.public` / `channels:read` が付与されている | `https://api.slack.com/apps/<app_id>/oauth` admin UI、または `auth.test` API レスポンスで `bot_user_id` を確認 | 3 scope 全て enabled |
| W4 | channel id が GitHub Variables の値と一致 | Slack channel 詳細 → `Copy link` → URL 末尾の `C0XXXXX` 部分（**仕様書に値転記しない**） | id が一致（差分は admin に修正依頼） |
| W5 | workspace `team_id` = `w1618436027-ek2505248` | `https://app.slack.com/client/<TEAM_ID>` URL 構造で確認 | 一致 |
| W6 | bot user が production / dry-run channel **以外** の private channel に誤って invite されていない | admin UI で bot の channel membership 一覧 | 2 channel のみ |

確認結果は `outputs/phase-10/main.md` の「Slack workspace readiness」セクションに記録（channel id / team id 等の実値は転記せず、確認 OK / NG のみ記録）。

## dry-run final smoke（Phase 11 着手前の最後の確認）

```bash
# Phase 5/6 で整備した script を dry-run mode で実行
bash scripts/notify/slack-incident-runbook.sh --mode dryrun --release-version v0.0.0-prelaunch \
  --deployed-at "$(date -u +%FT%TZ)" --runbook-permalink "$(git rev-parse HEAD):<resolved-09b-incident-runbook-path-from-aiworkflow-quick-reference>"
```

**期待結果**:

- exit code 0
- `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` が生成され `ok=true` / `ts` / `channel` / `permalink` を含む
- token 値が log・evidence のいずれにも含まれない（`rg -n -e 'xox[abp]-[A-Za-z0-9-]{20,}|Bearer [A-Za-z0-9._-]{20,}' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` が 0 hit）

**失敗時**: Phase 9 へ差し戻し。本 Phase 10 を再実行する前に Phase 11 着手しない。

> 注: 本 Phase 10 で生成した dry-run smoke evidence は **Phase 11 evidence と同パスを共有**する（`docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json`）。Phase 11 では production 配信後に上書きせず、別ファイル（`slack-delivery-production.json`）として並置する。

## rollback plan

### rollback の発動条件

- production channel に意図しない message が配信された
- production channel への配信が連続 3 回以上失敗した
- token leak が evidence または log で検出された

### rollback 手順（即時）

| # | 手順 | コマンド | 影響 |
| --- | --- | --- | --- |
| R1 | workflow を即時無効化 | `gh workflow disable incident-runbook-slack-delivery.yml` | 以降の手動 `workflow_dispatch` / `workflow_run` 配信を全停止 |
| R2 | 直近の Slack message 削除（必要時） | Slack admin UI から手動削除（bot に `chat:write` のみ付与のため `chat.delete` は `as_user=false` で同 bot の自分メッセージのみ可） | 1 message 単位 |
| R3 | token rotation（leak 検出時のみ） | 1Password で新規 token を生成 → GitHub Secret 上書き → Slack admin で旧 token を revoke | bot 認証が新値で継続。旧値は無効化 |
| R4 | rollback 完了後の re-enable | `gh workflow enable incident-runbook-slack-delivery.yml`（修正コミット merge 後） | 配信再開 |

### rollback 記録先

`outputs/phase-10/main.md` に rollback plan セクションを置き、上記 R1〜R4 を逐語コピー可能な状態で残す。

## release notes / CHANGELOG 草案

本タスクは monorepo root の CHANGELOG を更新しないが、PR description（Phase 13）に以下を含める草案を Phase 10 で作成する:

```
### Added
- incident response runbook を Slack bot で自動配信する GitHub Actions workflow を追加
  (.github/workflows/incident-runbook-slack-delivery.yml)
- dry-run / production の二段配信と production channel への approval gate を実装
- 配信時 evidence (ts / channel / permalink) を outputs/phase-11/evidence/ に保存

### Changed
- 09c production deploy execution の Phase 11 share-evidence placeholder を本タスク evidence への参照に置換
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md に
  Slack secret 名 (SLACK_BOT_TOKEN_INCIDENT_RUNBOOK / SLACK_INCIDENT_RUNBOOK_*_CHANNEL_ID) を追記

### Security
- token 値はリポジトリ・log・evidence・PR description に一切書かない（CONST-RUN-01）
- 1Password 正本 → GitHub Secrets 派生のみ。Slack OAuth ローカル token は使わない
```

## monitoring: 配信失敗時の通知

| # | 失敗種別 | 通知経路 | 通知先 |
| --- | --- | --- | --- |
| M1 | GitHub Actions job failure | GitHub default email notification（actor へ） | release oncall |
| M2 | Slack API non-200 / `ok=false` | workflow が exit 非 0 → M1 と連動 | 同上 |
| M3 | secret 解決失敗 (`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` 未設定) | workflow `env` step で fail-fast | 同上 |
| M4 | dry-run の channel id と production の channel id が同一値 | unit test（`scripts/notify/__tests__/slack-incident-runbook.test.ts`）で fail | CI gate 段階で検出 |

別 Slack channel への失敗通知は MVP scope 外。GitHub Actions の標準 email 通知で当面の運用とし、必要時に Phase 12 unassigned-task として起票する。

## サブタスク管理

- [ ] approver 決定 / GitHub environment 設定確認
- [ ] secret S1〜S5 確認チェックリストを完了
- [ ] Slack workspace W1〜W6 確認チェックリストを完了
- [ ] dry-run final smoke を成功させる
- [ ] rollback plan R1〜R4 を `outputs/phase-10/main.md` に記録
- [ ] CHANGELOG 草案を Phase 12 入力として保存
- [ ] monitoring M1〜M4 経路を `outputs/phase-10/main.md` に記録

## 多角的チェック観点

- production channel への直接配信が unit test / runtime 双方で承認なしに発生しないこと
- token 値が確認手順のいずれにもファイル化されないこと
- rollback plan が「GitHub Actions disable」「Slack message delete」「token rotation」の 3 段で揃っていること
- `gh workflow disable` が現環境で実行可能（`gh auth status` が valid）であることを Phase 11 着手前に検証
- monitoring 経路が「失敗を見逃さない」最小構成であり、別 Slack channel 通知のような scope 拡張は unassigned-task に分離されていること

## 統合テスト連携

- 上流: Phase 9 品質ゲート（typecheck / lint / unit test）pass
- 下流: Phase 11 runtime evidence（dry-run / production 双方の chat.postMessage 200）

## 成果物

- `outputs/phase-10/main.md`
  - approver assignment
  - secret/variable 確認結果（OK/NG のみ。値は転記しない）
  - Slack workspace readiness
  - dry-run final smoke 結果（log path 参照）
  - rollback plan（R1〜R4）
  - CHANGELOG 草案
  - monitoring 経路（M1〜M4）

## 完了条件 (DoD)

- [ ] approver が確定し GitHub environment `production-slack-delivery` に reviewer 1 名以上設定済
- [ ] S1〜S5 チェックリスト 5 件すべて OK
- [ ] W1〜W6 チェックリスト 6 件すべて OK
- [ ] dry-run final smoke が `ok=true` で完了し evidence に token leak 0
- [ ] rollback plan R1〜R4 が `outputs/phase-10/main.md` に保存されている
- [ ] CHANGELOG 草案が `outputs/phase-10/main.md` 内に保存され、Phase 12 で参照可能
- [ ] 本 Phase で commit / push / PR を実行していない（Phase 13 で扱う）
- [ ] CONST-RUN-01（token 値の非記載）を遵守

## 次 Phase への引き渡し

Phase 11 へ:

- approver / environment 設定済の記録（user approval gate 取得時に参照）
- dry-run final smoke の evidence path
- rollback 即時手順（incident 発生時に Phase 11 から呼び戻せる状態）

## 参照資料

- `docs/30-workflows/09c-incident-runbook-slack-delivery/index.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/artifacts.json`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-01.md`（FR / NFR / CONST）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（Phase 12 で追記）
- `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」「ローカル `.env` の運用ルール」
