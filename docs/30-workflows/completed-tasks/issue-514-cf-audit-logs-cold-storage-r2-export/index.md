# タスク仕様書: Issue #514 — Cloudflare Audit Logs 90 日超 cold storage / R2 export

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-514-cf-audit-logs-cold-storage-r2-export |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/514 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-02-cold-storage.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` |
| 親 wave | `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/` |
| 配置先 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/` |
| 作成日 | 2026-05-07 |
| 状態 | implemented-local / runtime pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装済みローカル / runtime pending]** — 親 Issue は CLOSED だがユーザー指示によりタスク仕様書を作成する。本サイクルは task-specification-creator / aiworkflow-requirements 準拠の仕様・outputs・SSOT 同期に加え、R2 binding / D1 migration / scripts / workflow のローカル実装まで完了する。production runtime mutation は後続 G1-G4 承認後にのみ実行する。 |
| 優先度 | LOW |
| 想定 PR 数 | 1（後続実装 PR: R2 binding 追加 + D1 migration + export-to-r2 / restore-drill scripts + 日次 workflow + SSOT 追補。本サイクルではコミット・PR・push・production mutation を実行しない） |
| coverage AC | 適用外（GitHub Actions workflow + 単発 scripts。アプリ本体の coverage 対象外。export-to-r2 / restore-drill に focused unit test を追加する） |

## 目的

Issue #408 で構築した hourly fetcher が D1 へ蓄積する `cf_audit_log` を、30 日 TTL purge の前に Cloudflare R2 cold storage へ定期 export する仕組みを確立する。半期監査 / 事後調査 / コンプライアンス問い合わせに対し「30 日超のログを redacted な形で参照可能」とする運用を成立させ、D1 容量 50% 超過リスクを長期的に回避する。

## スコープ

### 含む

- D1 と R2 の境界 = 30 日 TTL を**契約として最初に固定**（FU-02 親仕様の知見）
- `apps/api/wrangler.toml` への R2 binding (`UBM_AUDIT_COLD_STORAGE`) 追加
- D1 migration 追加 (`apps/api/migrations/0015_add_audit_export_manifest.sql`): `cf_audit_log_export_manifest` テーブル（export 実績・object key・row count・hash・R2 etag・redaction policy version 記録）
- `scripts/cf-audit-log/export-to-r2.ts`（D1 → JSONL → gzip → R2 PutObject、redaction 二重化、manifest 書き戻し）
- `scripts/cf-audit-log/restore-drill.ts`（R2 GetObject → 検証用一時テーブル復元 → row count / hash 照合）
- `.github/workflows/cf-audit-log-cold-storage.yml`（`schedule: '0 2 * * *'` 日次 export + 1/7 月 1 日だけ restore drill）
- R2 bucket lifecycle policy 設計（`Standard` 90 日 → `Infrequent Access` への切替方針 / abort multipart / object lock 検討）
- `scripts/cf.sh` への `r2 export` / `r2 restore` サブコマンド導線追加（既存ラッパーへの追補のみ仕様化）
- SSOT 同期: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への cold storage / R2 retention / restore drill 追記

### 含まない

- Issue #408 の hourly detection 本体（既に completed_local）
- ML anomaly detection / 異常傾向の長期分析（FU-03）
- GitHub audit log との merge / 統合解析（FU-04）
- リアルタイム streaming や R2 → BigQuery / external SIEM 連携
- Slack / メール通知の追加（既存 GitHub Issue 起票で十分）
- redaction policy の刷新（既存 fetcher の policy をそのまま継承）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #408 (`completed-tasks/issue-408-cf-audit-logs-monitoring/`) | `cf_audit_log` テーブルと redaction policy が稼働していること |
| 上流 | `scripts/cf.sh` ラッパー | R2 / D1 操作の正本（本タスクで `r2 export` 系を追加） |
| 上流 | U-FIX-CF-ACCT-01 最小 scope Token 体制 | 監視 Token とは別に `Account > R2:Edit` scope を持つ export Token を発行する前提 |
| 関連 | UT-25-DERIV-03 (cf-secrets-audit-log) | redaction evidence の重複排除 |
| 関連 | U-FIX-CF-ACCT-01-DERIV-03 (rotation runbook) | export Token の 90 日 rotation を runbook と同期 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| Issue #408 の hourly fetcher が production で稼働し `cf_audit_log` に行が蓄積している | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT COUNT(*) FROM cf_audit_log"` |
| 半期監査要件確定 or D1 容量 50% 継続超過のいずれかが成立 | 監査要件文書 / D1 metrics dashboard |
| R2 bucket 作成権限のある account-level Token が 1Password に存在 | `op vault list` で `Cloudflare` vault を確認 |
| GitHub Actions workflow に `secrets: CF_AUDIT_R2_TOKEN_PROD` 登録経路がある | `.github/workflows/cf-audit-log-monitor.yml` の secrets 構造を踏襲 |

## 苦戦箇所・知見（unassigned-task / 親仕様からの継承）

1. **D1 と R2 の境界 = 30 日を契約として最初に固定する**（親仕様の最重要知見）。export スクリプトはこの境界を所与として「30 日経過直前の行を漏れなく R2 に積む」ことだけに責務を絞り、TTL purge とのレース条件を契約で排除する。境界を後から変えると manifest との整合と restore drill が両方破綻する。
2. **redaction の二重化**: export 時に cold-storage 用 redaction transform（IP prefix / email domain / UA marker / raw_json drop）を適用し、その後 secret / 完全 IP / User-Agent / email pattern を grep する。ヒットしたら export を fail させる（fail-closed）。R2 に書き込んだ後の取消は実質不可能。
3. **manifest first, object second**: object を先に PUT すると manifest との整合が取れない時間帯が発生する。manifest を `pending` 行で先に書き、PUT 成功後に `completed` へ更新する 2-phase commit を採用する。
4. **object key のタイムゾーン**: `audit/v1/yyyy=YYYY/mm=MM/dd=DD/hh=HH/<batch>.jsonl.gz` を UTC 固定で生成する。JST 混在は restore drill での range 指定を確実に破綻させる。
5. **gzip 単位**: 1 日単位で 1 オブジェクトに集約。日次 export は「26〜29 日前 window の各日 partition」を対象にし、既存 manifest completed 行を skip するため、通常は 1 日あたり最大 4 object 未満に収まる。
6. **lifecycle policy で削除しない**: 半期監査要件が確定するまで auto-delete はかけない。`Standard → Infrequent Access` への移行のみを lifecycle で記述し、削除は手動 runbook（半期レビュー後）に閉じる。
7. **restore drill は半期 1 回**: 日次 export workflow 内で UTC 1 月 / 7 月の 1 日だけ restore drill を有効化し、ランダム抽出 1 オブジェクトを別 D1 一時テーブルへ復元し row count / hash を照合する。
8. **export Token の権限分離**: 監視用 `Audit Logs:Read` Token と export 用 `R2:Edit` Token は別エントリ。漏洩時の blast radius を分割する。
9. **冪等性**: 同一日 partition が複数回対象になっても manifest の `(yyyy, mm, dd)` 一意制約で重複 PUT を防ぐ。R2 側の `If-None-Match` も併用する。
10. **D1 free tier の export 帯域**: 1 回の SELECT で 30 日分を取らず、日単位ループ + cursor で取得して memory 圧迫を避ける。Workers CPU time / sub-request 上限と整合させる。

## DoD（完了条件）

- [x] `apps/api/wrangler.toml` に R2 binding `UBM_AUDIT_COLD_STORAGE` が production / preview の両 env で定義済み
- [x] D1 migration `0015_add_audit_export_manifest.sql` が作成され、`cf_audit_log_export_manifest` テーブルが production に適用可能な状態（apply は runtime gate）
- [x] `scripts/cf-audit-log/export-to-r2.ts` が D1 から redacted JSONL.gz を生成し R2 へ PUT、manifest を 2-phase commit で更新する
- [x] `scripts/cf-audit-log/restore-drill.ts` が任意 object を一時テーブルへ復元し row count / hash を照合する
- [x] `.github/workflows/cf-audit-log-cold-storage.yml` が `schedule: '0 2 * * *'` で日次稼働、半期分岐で restore drill を実行
- [x] redaction grep ガードが export 段階に組み込まれ、ヒット時に fail-closed
- [x] R2 lifecycle policy が `Standard → Infrequent Access` のみ（auto-delete 無し）で記述されている
- [x] export Token (`CF_AUDIT_R2_TOKEN_PROD`) が監視 Token と独立に 1Password / GitHub Secrets に登録経路を持つ
- [x] `observability-monitoring.md` / `15-infrastructure-runbook.md` 同期完了
- [x] `pnpm typecheck` / focused `vitest` green

## 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/514 (CLOSED)
- unassigned-task spec: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-02-cold-storage.md`
- 親タスク: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`
- SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- SSOT: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- 関連 SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- 関連: `docs/30-workflows/unassigned-task/UT-25-DERIV-03-cf-secrets-audit-log.md`
- 関連: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- Cloudflare R2 docs: https://developers.cloudflare.com/r2/
- Cloudflare R2 lifecycle: https://developers.cloudflare.com/r2/buckets/object-lifecycles/

## Phase 一覧

| Phase | 目的 | 状態 |
| --- | --- | --- |
| 1 | 要件定義・GO 判定（30 日境界契約固定 / export schedule 決定 / redaction policy 確認） | drafted |
| 2 | データモデル設計（R2 object key 構造 / manifest schema / redaction rules / retention metadata） | drafted |
| 3 | アーキテクチャ設計（exporter / R2 binding / lifecycle policy / restore drill 構成） | drafted |
| 4 | 検証シナリオ設計（fixture export / restore drill contract / redaction grep） | drafted |
| 5 | 実装（wrangler.toml / migration / scripts / workflow） | drafted |
| 6 | カバレッジ確認（export-to-r2 / restore-drill focused test） | drafted |
| 7 | カバレッジ判定（threshold 80% を scripts に限定適用） | drafted |
| 8 | 統合テスト（fixture / dry-run / lifecycle simulation） | drafted |
| 9 | 品質検証（typecheck / lint / runtime gate 識別） | drafted |
| 10 | 最終レビュー・rollback 経路（workflow 無効化 + R2 binding 解除） | drafted |
| 11 | 手動テスト / runtime evidence（初回 export object + restore drill log） | runtime_evidence_pending |
| 12 | ドキュメント整備（必須 7 成果物 + SSOT 同期） | strict_outputs_present |
| 13 | コミット・PR 作成（ユーザー承認後） | blocked_pending_user_approval |
