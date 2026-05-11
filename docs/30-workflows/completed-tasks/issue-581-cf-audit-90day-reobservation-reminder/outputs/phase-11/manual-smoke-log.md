# Manual Smoke Log: Issue #581 Early Termination

実行モード: EARLY_TERMINATION (P-1 FAIL)。Phase 6/7/9 の runtime コマンドは実行しない。早期終了判定までに実行した read-only コマンドのみを記録する。

## 実行コマンドと結果

### 1. P-1 現在日付確認

```bash
$ date -u +%F
2026-05-09
```

判定: **FAIL**（`2026-05-09 < 2026-08-05`、88 日不足）

### 2. P-5 GitHub CLI 認証確認

```bash
$ gh auth status
github.com
  ✓ Logged in to github.com as daishiman (oauth_token)
  ✓ Git operations for github.com configured to use https protocol.
  ✓ Token: *******************
```

判定: **PASS**

### 3. workflow tree / outputs ディレクトリ確認

```bash
$ ls docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/
artifacts.json  phase-11/  phase-12/
```

判定: phase-12 strict 7 outputs は同一 wave で配置済み、phase-11 は本ファイル群で初期化中。

## 実行しなかったコマンド（早期終了により skip）

- `gh api --paginate /repos/.../actions/workflows/cf-audit-log-monitor.yml/runs ...`（Gate-A 入力）
- `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json --command "..."`（Gate-B 入力 / D1 readiness）
- `gh issue list -l cf-audit ...`（Gate-B alert evidence）
- 月別 tuning minutes 集計（Gate-C 入力）

## redaction note

本ログは GitHub CLI のトークン文字列をマスク（`*******************`）したまま記録している。1Password 参照値・Cloudflare API token・OAuth token の生値は一切含まない。
