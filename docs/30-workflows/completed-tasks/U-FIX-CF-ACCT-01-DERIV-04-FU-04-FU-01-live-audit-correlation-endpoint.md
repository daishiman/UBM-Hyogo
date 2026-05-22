# U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01: Live audit-correlation endpoint - タスク指示書

## メタ情報

```yaml
parent_issue_number: 516
issue_number: 553
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01                                         |
| タスク名     | Live audit-correlation endpoint（GitHub fetch + 定期 correlation）           |
| 分類         | 機能拡張 / セキュリティ                                                       |
| 対象機能     | `apps/api/src/audit-correlation/` の Cloudflare Worker live wiring            |
| 優先度       | 中（priority:medium）                                                         |
| 見積もり規模 | 中規模（scale:medium）                                                        |
| ステータス   | 未実施（status:unassigned）                                                   |
| 発見元       | Issue #516 Phase-12 / outputs/phase-12/unassigned-task-detection.md          |
| 発見日       | 2026-05-07                                                                    |
| 親タスク     | `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`     |
| 親 Issue     | https://github.com/daishiman/UBM-Hyogo/issues/516                             |
| 着手判断     | Issue #516 fixture verify が main にマージされ、本番 GitHub Org Owner 権限で `audit_log` scope の PAT が 1Password に登録された後 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #516 で `apps/api/src/audit-correlation/` に redact-safe な correlation engine を実装し、
fixture 駆動の verify を CI で恒久化した。ただし MVP スコープ上「production GitHub
`/orgs/{org}/audit-log` への live 接続」と「Cloudflare Worker への定期実行 endpoint 追加」は
明示的に out of scope としたため、本番運用ではまだ HIGH alert 発生時に手動で
`scripts/audit-correlation/run.sh` を起動する必要がある。

### 1.2 問題点・課題

- live 接続が無いため Cloudflare 側 finding と GitHub 側 finding の cross-source merge が
  リアルタイム化していない（HIGH alert の検知遅延 = 平均 oncall 反応時間に依存）。
- `AUDIT_CORRELATION_SALT` / `GITHUB_AUDIT_PAT` を Cloudflare Secrets に登録するための
  endpoint 設計（Worker route / cron / KV cache 戦略）が未確定。
- correlation 結果の永続化（incident 履歴）も未設計のため、HIGH alert 後の振り返りが
  fixture 出力ベースに留まる。

### 1.3 放置した場合の影響

- HIGH severity の token rotation / cross-source permission change を 30 分以内に検知できず、
  既存 Cloudflare hourly monitor（Issue #408）と粒度差が拡大する。
- 親タスク `U-FIX-CF-ACCT-01-DERIV-04-FU-04` が「fixture-only」状態のまま放置され、
  cross-source 相関のビジネス価値（実 incident への即応）が realize しない。

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare Worker 上で `/orgs/{org}/audit-log` を定期 fetch し、Cloudflare audit との
correlation 結果を Slack runbook 通知 + 永続化（D1 もしくは R2）まで自動化する。

### 2.2 最終ゴール

- `apps/api` 配下に live audit-correlation route（`POST /internal/audit-correlation/run` または
  Worker cron trigger）を追加し、production secret から salt / PAT を読み込んで実行可能。
- correlation 結果の HIGH/MEDIUM finding が Slack incident channel に runbook URL 付きで通知される。
- finding 履歴が D1 もしくは R2 に redact-safe な形で永続化される（grep gate 継続適用）。

### 2.3 完了条件（DoD）

- [ ] live wiring の Worker route / cron 設計が Phase 1-3 で確定し、PR にレビュー記録が残る。
- [ ] `AUDIT_CORRELATION_SALT` / `GITHUB_AUDIT_PAT` が Cloudflare Secrets に登録され、
      1Password 参照経由で staging / production に注入される。
- [ ] live 実行ログに secret / full IP / full email / user agent / salt literal が露出しない
      grep gate が CI で恒久化される。
- [ ] HIGH alert の Slack 通知 dry-run が staging で 1 回成功し、evidence が記録される。
- [ ] runbook (`docs/runbooks/audit-correlation.md`) に live 手順が追記される。

---

## 3. どう実現するか（How）

### 3.1 想定アーキテクチャ

| パス                                              | 種別 | 役割                                                          |
| ------------------------------------------------- | ---- | ------------------------------------------------------------- |
| `apps/api/src/routes/audit-correlation/run.ts`    | 新規 | Worker route: 定期/手動 trigger entry                         |
| `apps/api/src/audit-correlation/persist.ts`       | 新規 | D1 もしくは R2 への redact-safe 永続化                         |
| `apps/api/src/audit-correlation/notify-slack.ts`  | 新規 | HIGH alert の Slack incoming webhook 通知                      |
| `apps/api/wrangler.toml`                          | 編集 | cron trigger 追加（例: `crons = ["*/15 * * * *"]`）            |
| `docs/runbooks/audit-correlation.md`              | 編集 | live 手順追記                                                 |

### 3.2 検証方法

1. staging 環境に dummy PAT / salt を登録し、cron trigger 1 回で fixture-equivalent 出力が
   永続化されることを確認。
2. HIGH severity を意図的に作る fixture を Slack dry-run channel に投稿し、runbook URL の
   組み立てが正しいか確認。
3. grep gate を staging 永続化レコードに対して実行し、PII / secret 非露出を確認。

---

## 4. 苦戦箇所（親タスクからの教訓）

### 4.1 Issue #516 で苦戦した点

- **redact-safe join key の確定**: 当初仕様書では `email|ip|ua` を hash 入力にしていたが、
  HIGH severity の「IP 急変検知」と矛盾するため email-based 方式へ Phase 1 で改訂が必要だった。
  **再現対策**: live 設計時も「同一 actor の IP 変化を group 内で観測したいか」を最優先で確定する。
- **fingerprintVersion の運用**: 1 から 2 への移行手順が runbook に未記載のまま fixture 実装が
  進み、後追いで Phase 8 governance で salt rotation 章を追加した。**再現対策**: live wiring
  でも `fingerprintVersion` のまたぎ移行（旧 hash の incident と新 hash の incident をどう繋ぐか）
  を Phase 1 で文書化してから着手する。
- **grep gate の偽陰性**: secret literal 検出パターンが緩く、PR レビューで `ghp_` プレフィックス
  検出を追加した。**再現対策**: live wiring の永続化 row に対しても同等以上の grep gate を
  適用する。

### 4.2 live wiring 固有の予想苦戦点

- Cloudflare Worker からの `Retry-After` 指数 backoff は同期的に sleep できないため、
  cron trigger では「次の cron 待ち」or `setTimeout` 代替を Phase 3 で確定する必要がある。
- D1 永続化 vs R2 永続化の選定（書き込み頻度・保持期間・コスト）。

---

## 5. システム仕様書への反映

- aiworkflow-requirements `references/audit-correlation.md` に live wiring 章を追記（PR 内）。
- `indexes/keywords.json` に `live wiring` / `cron trigger` キーワードを追加。

---

## 6. スコープ

### 含む
- live audit-correlation Worker route / cron 設計と実装
- Slack incoming webhook 通知（dry-run channel + production channel 切替）
- redact-safe 永続化（D1 もしくは R2）
- secret 登録手順の runbook 化

### 含まない
- `fingerprintVersion=2` への migrate 自動化（FU-03 の責務）
- branch protection 必須化（FU-02 の責務）
- Cloudflare 側 redaction ロジック再設計（Issue #408 の責務）

## 7. 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/516
- 親タスク仕様書: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`
- 検出元: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/outputs/phase-12/unassigned-task-detection.md`
- runbook: `docs/runbooks/audit-correlation.md`
