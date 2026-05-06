# Phase 8: 統合テスト（schedule 1 サイクル e2e）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 | Phase 5（実装）/ Phase 6-7（focused unit test 完了）|

## 目的

`cf-audit-log-monitor.yml` workflow を 1 サイクル end-to-end で実走させ、Cloudflare Audit Logs API → D1 ingest → 異常検知 → GitHub Issue 起票 → 重複抑止 → watchdog による監視 workflow 障害検知の **全経路** が production 相当環境で接続成立することを確認する。Phase 6-7 は単体ロジックの検証であり、本 Phase は **schedule 1 サイクル分の実走経路** を保証する。

## スコープ

### 含む

- `gh workflow run cf-audit-log-monitor.yml` による手動 trigger
- 1 時間分の実 audit event ingest と D1 `cf_audit_log` テーブル row 検証
- 合成 HIGH event（fixture injection）による Issue 自動起票確認
- 同一合成 event での 2 回目実行による de-duplication 確認
- watchdog workflow による主 workflow 停止検知

### 含まない

- 7 日 baseline 学習の結果評価（Phase 9）
- 30 日 TTL purge の経年確認（Phase 9 の cost 章で見積りのみ）
- Slack / メール通知経路（MVP 範囲外）

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-8/phase-8.md` | 本ファイル（Phase 8 仕様 index） |
| `outputs/phase-8/e2e-scenario.md` | schedule 1 サイクル e2e のシナリオ・コマンド・期待結果 |
| `outputs/phase-8/watchdog-test.md` | 監視 workflow 停止 → watchdog Issue 起票の検証手順 |

## e2e サイクル概要

| ステップ | 操作 | 期待結果 |
| --- | --- | --- |
| 1 | `gh workflow run cf-audit-log-monitor.yml` | run が `queued` → `in_progress` → `completed`（`success`） |
| 2 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT COUNT(*) FROM cf_audit_log WHERE ingested_at_ms > (unixepoch() - 3600) * 1000"` | row 数 ≥ 1（直近 1h の audit event が ingest されている） |
| 3 | fixture HIGH event を analyze input に inject し再 trigger | `gh issue list --label "type:security,priority:high" --search "cf-audit-log-monitor"` で 1 件 NEW |
| 4 | 同 fixture で 2 回目 trigger | Issue 数が増えない（fingerprint hash で de-duplicate） |
| 5 | watchdog 単独 trigger（主 workflow 一時 disable 状態で） | watchdog が `priority:high` Issue を独立起票 |

## 統合テストの判定基準

- Phase 8 PASS = 1 〜 5 のすべてが期待結果通り、かつ secret value / token / 個人情報 が evidence に転記されていない
- Phase 8 FAIL = いずれかが期待結果から外れた場合 → Phase 5/6 へ rollback

## 関連

- `outputs/phase-8/e2e-scenario.md`
- `outputs/phase-8/watchdog-test.md`
- 上流: `outputs/phase-5/`（実装）/ `outputs/phase-7/`（coverage 判定）
- 下流: `outputs/phase-9/`（quality gate）/ `outputs/phase-11/`（runtime evidence 採取）
