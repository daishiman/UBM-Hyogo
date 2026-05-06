# Phase 11: 手動 smoke / 実測 evidence — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created（実 evidence は user approval 経由 runtime wave で取得） |

## 目的

staging→production の段階的 smoke 実行と evidence 取得の **template / redact 規則 / G1〜G4 通過記録 / staging-production 分離保存** を確定する。実 smoke 実行は本仕様書作成 cycle では行わない。

## evidence 分離の原則

- **staging evidence** → `outputs/phase-11/staging-smoke-log.md`
- **production evidence** → `outputs/phase-11/production-smoke-log.md`
- 1 ファイルに staging / production を混在させない（INV: env 境界）
- `outputs/phase-11/main.md` は両 log の index と template 集約

## evidence file 一覧

| # | path | 用途 | 取得 phase |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | template / redact 規則 / G1〜G4 通過記録テーブル定義 | 本仕様書 |
| 2 | `outputs/phase-11/staging-smoke-log.md` | staging smoke の event id / Slack permalink / redaction grep 結果 / G2 前提 PASS 記録 | runtime wave |
| 3 | `outputs/phase-11/production-smoke-log.md` | production smoke の event id / Slack permalink / redaction grep 結果 / G1〜G4 通過 timestamp | runtime wave |

## 各 log に記録する項目（template）

### staging-smoke-log.md（template）

```
- staging smoke timestamp (ISO8601):
- target: both
- response.ok:
- sentry.event_id (短縮 hex 8 桁):
- sentry.environment: staging
- slack.status:
- slack.permalink (T*/C*/p* のみ・webhook URL 記録禁止):
- slack.message prefix: [STAGING SMOKE]
- redaction grep 3 系統 hit count: 0 / 0 / 0
- AC-1〜AC-5 PASS 確認: yes/no
```

### production-smoke-log.md（template）

```
- G1 通過 timestamp / 承認者:
- G2 通過 timestamp（staging PASS 確認） / 承認者:
- G3 通過 timestamp / 承認者:
- production smoke timestamp:
- target: both
- response.ok:
- sentry.event_id (短縮 hex 8 桁):
- sentry.environment: production
- slack.status:
- slack.permalink (T*/C*/p* のみ):
- slack.channel id/name (redacted or non-secret name only):
- slack.message prefix: [PRODUCTION SMOKE]
- redaction grep 3 系統 hit count: 0 / 0 / 0
- AC-P1〜AC-P6 PASS 確認: yes/no
- G4 通過 timestamp / 承認者:
```

## 記録禁止項目

- DSN URL（`https://<key>@<host>/<project>` 形式）
- Slack webhook URL（`https://hooks.slack.com/services/...`）
- token 値（Sentry auth token / Cloudflare API token / SMOKE_ADMIN_TOKEN）
- secret 値の hash / base64
- Sentry project の numeric id
- 受信 raw response の JSON のうち secret を含む可能性のあるフィールド全文

## 取得タイミング / 手段

| evidence | タイミング | 手段 |
| --- | --- | --- |
| staging-smoke-log.md | G2 前提として staging smoke 実行直後 | `curl ... /admin/smoke/observability?target=both` の response を redact filter にかけて記録 + Sentry dashboard で event id 目視 + Slack permalink copy |
| production-smoke-log.md | G1〜G4 を順次通過しながら | G1: secret 配置直前 / G3: production smoke 直前 / 実行後 event id・permalink 記録 / G4: redaction grep 0 確認後 |
| redaction grep | 各 log 確定前 | T-10 の `rg -n` 3 系統 |

## grep gate（再掲・3 系統）

```
rg -n 'hooks\.slack\.com/services/[A-Z0-9]+' .
rg -n 'sentry\.io/[0-9]+/[0-9]+' .
rg -n 'xox[bp]-' .
```

PASS 条件: 3 系統すべて 0 hit。1 件でも hit したら G4 通過禁止 → Phase 6 A-05 へ。

## approval gate（runtime wave）

| gate | 条件 |
| --- | --- |
| G1 | 1Password に production 用 3 item が揃っている / Phase 10 GO |
| G2 | `staging-smoke-log.md` の AC-1〜AC-5 PASS が user 確認済 |
| G3 | production smoke 実行直前。Phase 6 連投禁止が遵守 |
| G4 | redaction grep 3 系統 0 hit / `production-smoke-log.md` 全項目埋め完了 |

## 制約事項

- 本仕様書 cycle では `outputs/phase-11/main.md` と `staging-smoke-log.md` / `production-smoke-log.md` を template-only として作成する。runtime wave までは PASS 証跡として扱わない
- 実 secret 値・DSN URL・webhook URL を log / template / docs に書かない

## 成果物

- `outputs/phase-11/main.md`（template / redact 規則 / approval gate / 取得手段）
- `outputs/phase-11/staging-smoke-log.md` / `outputs/phase-11/production-smoke-log.md`（template-only。runtime wave で `PENDING_RUNTIME_EVIDENCE` を実測値に置換）

## 完了条件（本仕様書段階）

- `outputs/phase-11/main.md` に template と分離規則が確定
- redact 規則 / grep gate / G1〜G4 が網羅
- staging-smoke-log.md / production-smoke-log.md は template-only として存在し、runtime PASS と混同しない（spec_created 維持）

## 次 Phase への引き渡し

Phase 12 へ: AC / blocker / evidence path / runtime wave 取得契約。
