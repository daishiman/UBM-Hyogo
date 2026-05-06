# 09c-incident-runbook-slack-delivery

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 9c-fu |
| mode | serial |
| owner | - |
| 状態 | spec_created / implementation-spec / runtime-contract-formalization / Phase 1-13 spec contract drafted / Phase 11 runtime evidence pending_user_approval |
| visualEvidence | NON_VISUAL（Slack message timestamp + JSON evidence。UI screenshot は対象外） |
| 関連 Issue | [#349](https://github.com/daishiman/UBM-Hyogo/issues/349)（CLOSED のまま仕様書化。close-out 後の正本昇格扱い） |

## purpose

09b/09c の incident response runbook を Slack bot で **指定 channel に自動配信**し、`message timestamp` と `evidence path` を `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` に保存する運用 workflow を、後続実行者（人間オペレーターまたは Claude Code）がそのままコード実装・実行できる粒度の実装仕様書として確定する。

09c の release runbook share evidence は手動 URL / Email placeholder 前提で、message timestamp と宛先証跡が残らないため、incident 発生時に最新 runbook の所在確認から始まり初動が遅れる。本タスクでこの placeholder を Slack bot 経由の自動配信＋ timestamp 永続化に置換する。

## why this is not a restored old task

本タスクは完了済み 09c production deploy 本体タスクの復活ではない。09c Phase 12 unassigned-task-detection で発行された `task-09c-incident-runbook-slack-delivery-001`（Issue #349, CLOSED）を、`docs/30-workflows/unassigned-task/` の骨子から正規 workflow ディレクトリへ昇格させ、Phase 1-13 の実装可能粒度に分解したものである。Issue は close 済みのまま正本ドキュメントとして整備する（CLOSED issue → spec promotion ルート）。

## scope in / out

### Scope In

- Slack delivery workflow（GitHub Actions または Cloudflare Workers Cron 経由のいずれかを Phase 2 で確定）
- Slack bot token の secret 配置設計（1Password 正本 → GitHub Secrets / Cloudflare Secrets への派生）
- dry-run channel と production channel の分離（誤配信防止）
- production channel 送信時の user approval gate
- message timestamp / channel id / permalink を `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` に保存する仕組み
- 09c Phase 11 の `share-evidence` placeholder を本タスク evidence への参照に置換する手順
- runbook 本文の参照リンク固定化（本文は本タスクのスコープ外、参照のみ保持）
- aiworkflow-requirements skill の `deployment-secrets-management.md` への Slack secret 名追記

### Scope Out

- incident runbook **本文**の再設計・新規執筆（本文は 09b/09c 既存仕様を参照のみ）
- Slack token 値そのもののドキュメント記載（`op://` 参照のみ）
- Slack workspace の admin 操作（bot 招待・channel 作成は手動オペレーション側で完了済み前提）
- production deploy 本体ロジックの変更
- PagerDuty 等 Slack 以外の通知経路

## dependencies

### Depends On

- 09c production deploy execution（Phase 11 share-evidence placeholder の存在）
- 09b incident response runbook 本文（current canonical は aiworkflow `quick-reference.md` §Cron Monitoring / Release Runbook を参照。現 worktree では旧 `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` が削除差分中のため、本タスクでは本文を復元しない）
- 1Password vault（Slack bot token の正本保管）
- Slack workspace（team id `w1618436027-ek2505248`）にて bot user とチャンネル作成済みであること

### Blocks

- なし（incident response readiness の品質改善タスクであり、後続タスクの blocker ではない）

## refs

- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`（昇格前 骨子）
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`（share-evidence placeholder の出元）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` §Cron Monitoring / Release Runbook（09b runbook current canonical lookup）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（Slack secret 名の正本反映先）
- Issue [#349](https://github.com/daishiman/UBM-Hyogo/issues/349)

## Slack delivery 設計概要（Phase 2 で詳細化）

### Slack workspace / channel naming

| 項目 | 値 | 備考 |
| --- | --- | --- |
| workspace / team id | `w1618436027-ek2505248` | ユーザー指示。`https://app.slack.com/client/<TEAM_ID>` の URL 構成要素として保持 |
| channel naming prefix | `ubm-hyogo-` | ユーザー指示の「UBM兵庫」プレフィックス（原文表記: 「UBM標語」。本仕様書では支部正式名称に整合する `ubm-hyogo-` を採用し、原文表記を併記する） |
| production channel 名 | `#ubm-hyogo-incident-runbook` | production release 後の incident response runbook 配信先 |
| dry-run channel 名 | `#ubm-hyogo-incident-runbook-dryrun` | template 検証・誤配信ガード。production 配信前に必ず通過 |
| channel id 保存先 | GitHub Variables (`SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` / `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID`) | 値は Phase 5 ランブック実行時に挿入。仕様書には placeholder のみ |

### 配信メッセージ要件（Phase 2 で完全定義）

- Slack Block Kit で構造化（header / context / actions / divider）
- 必須要素: release version (`semver`)、deployed_at (ISO8601)、runbook permalink、oncall handle、approval thread guidance
- 末尾に永続的な runbook permalink（`docs/30-workflows/...09b.../incident-runbook.md` の GitHub blob URL）

## AC (Acceptance Criteria)

- Slack token の配置先と secret 名が `deployment-secrets-management.md` に正本化されている
- dry-run channel と production channel が分離されている（環境変数で切り替え、誤配信防止 unit test あり）
- 1 回の配信ごとに `message timestamp` / `channel id` / `permalink` が `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-*.json` に保存される
- runbook 本文の所有者（owner）と更新元 path が message footer に明示される
- production channel 送信は user approval（GitHub Actions `environment: production-slack-delivery` ゲート）を経由する
- dry-run 経路で `chat.postMessage` 200 が再現でき、message timestamp が evidence ファイルに書き込まれる ローカル検証手順が phase-08 に記載されている
- 09c Phase 11 share-evidence placeholder が本タスク evidence path への相対参照に置換される（diff レベルで Phase 12 に明記）

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 実装
- [phase-07.md](phase-07.md) — テスト実装
- [phase-08.md](phase-08.md) — テスト実行
- [phase-09.md](phase-09.md) — 品質ゲート
- [phase-10.md](phase-10.md) — リリース準備
- [phase-11.md](phase-11.md) — 運用検証 / runtime evidence
- [phase-12.md](phase-12.md) — ドキュメント更新 / skill 反映
- [phase-13.md](phase-13.md) — PR 作成

## Definition of Done（タスク全体）

1. `.github/workflows/incident-runbook-slack-delivery.yml`（または同等の Cloudflare Workers Cron handler）が Slack に dry-run / production の両モードで `chat.postMessage` 200 を返す
2. message timestamp が evidence file に保存され、curl で permalink を再取得できる
3. `pnpm typecheck` / `pnpm lint` / 単体テスト（誤配信ガード、template render、secret 解決）すべて pass
4. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に Slack secret 名が追記され、`pnpm indexes:rebuild` が drift なし
5. 09c Phase 11 share-evidence placeholder が本タスク evidence への参照に置換されている
6. PR がレビューで approve され、main へマージされる（CONST_002: マージはユーザー承認後）
