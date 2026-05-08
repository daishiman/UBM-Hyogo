# Phase 8: rotation script 実装（rotate-salt.sh / grep gate 拡張）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 対象 | `scripts/audit-correlation/rotate-salt.sh` 新規 / `scripts/audit-correlation/lib/op-helpers.sh` 新規（必要時） / `scripts/grep-gate/audit-correlation-secrets.sh` 新規 |
| 実装区分 | 実装仕様書（bash + grep gate） |

## 目的

`AUDIT_CORRELATION_SALT` の rotation を 4 モード（`--dry-run` / `--apply` / `--rollback` / `--end-rotation`）で半自動化し、salt 実値はディスク・ログ・コミット履歴に残らない不変条件を堅持する。1Password 正本（`op` CLI）と Cloudflare Secrets（`scripts/cf.sh secret put` 経由）の双方を 1 コマンドで同期する。`scripts/grep-gate/audit-correlation-secrets.sh` を新規作成し、ビルド成果物 / log への salt literal 混入を gate する。

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `scripts/audit-correlation/rotate-salt.sh` | 新規 |
| `scripts/audit-correlation/lib/op-helpers.sh` | 新規（共通 wrapper を切り出す必要が出た場合のみ） |
| `scripts/grep-gate/audit-correlation-secrets.sh` | 新規 |

## CLI 仕様

```
Usage: bash scripts/audit-correlation/rotate-salt.sh <MODE> [--env <staging|production>]

MODE:
  --dry-run        新 salt 候補を生成し、実行予定アクションのみを stdout に出力。
                   1Password / Cloudflare Secrets には触れない。salt 実値は表示しない（hash prefix 8 文字のみ）。
  --apply          1Password 上で current → previous に退避し、新 salt を生成して current を上書き。
                   Cloudflare Secrets `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_SALT_PREVIOUS` を反映。
  --rollback       直前の --apply を取り消す。previous の値を current に書き戻し、Cloudflare Secrets も同期。
  --end-rotation   1Password の previous item を archive、Cloudflare Secrets `AUDIT_CORRELATION_SALT_PREVIOUS` を unset。
                   dual-hash 期間を終了し single-hash mode に戻す。

OPTIONS:
  --env <staging|production>   既定: staging。production 指定時は確認プロンプト 2 回 + `--yes` 必須。
  --yes                        確認プロンプトを skip（CI 用途）。
  -h, --help                   このヘルプ。
```

### exit code 規約

| code | 意味 |
| --- | --- |
| 0 | 成功 |
| 1 | 引数 / 設定不備（mode 未指定、env 不正、`op` / `scripts/cf.sh` 未検出） |
| 2 | `op` CLI 実行失敗（認証 / 通信 / item 不在） |
| 3 | `scripts/cf.sh` 実行失敗（Cloudflare API） |

> shellcheck warn 0 / `set -euo pipefail` を冒頭に必須宣言。

## 1Password vault 構造（前提）

| Vault | Item | Field |
| --- | --- | --- |
| `CloudflareSecurity` | `AuditCorrelationSalt` | `value` |
| `CloudflareSecurity` | `AuditCorrelationSaltPrevious` | `value`（rotation 期間中のみ存在） |

参照は既存 runbook と合わせて `op://CloudflareSecurity/AuditCorrelationSalt/value` / `op://CloudflareSecurity/AuditCorrelationSaltPrevious/value` 形式に統一する。仕様詳細は Phase 9 で既存正本 `references/deployment-secrets-management.md` に記載する。

## モード別の擬似処理フロー

### `--dry-run`

```
1) salt_candidate=$(openssl rand -hex 32)  # 32 byte = 64 hex
2) 既存 current の hash prefix を op read 経由で取得 → sha256 prefix 8 文字のみ表示
3) 「予定アクション」列挙: 1Password edit 計画 / cf.sh secret put 計画
4) salt_candidate / 旧 salt の literal は出力しない（環境変数からも unset）
5) exit 0
```

### `--apply`

```
1) 現在 current の値を op read で読み取り、shell 変数 SALT_CURRENT に保持（環境変数化はしない）
2) 1Password に AUDIT_CORRELATION_SALT_PREVIOUS item が無ければ `op item create`、有れば `op item edit` で SALT_CURRENT を書き込み
3) salt_new=$(openssl rand -hex 32)
4) op item edit で AUDIT_CORRELATION_SALT を salt_new に上書き
5) bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT          --config apps/api/wrangler.toml --env "$ENV"  (stdin に salt_new を流す)
6) bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT_PREVIOUS --config apps/api/wrangler.toml --env "$ENV"  (stdin に SALT_CURRENT を流す)
7) ローカル変数 SALT_CURRENT / salt_new を unset
8) 結果サマリ（hash prefix のみ）を stdout に出力
9) exit 0
```

> stdin 経由で値を渡す。引数列・環境変数経由は禁止（`ps` から見える / log に残るため）。`scripts/cf.sh` の `secret put` は内部で `wrangler secret put --env <env>` を呼び出し、stdin から secret 値を受け取る挙動（`scripts/cf.sh` の現行 wrapper 仕様に準拠）。

### `--rollback`

```
1) op read で AUDIT_CORRELATION_SALT_PREVIOUS の値を取得（無ければ exit 1）
2) op item edit で AUDIT_CORRELATION_SALT を previous の値に書き戻し
3) cf.sh secret put AUDIT_CORRELATION_SALT に previous 値を流す
4) cf.sh secret delete AUDIT_CORRELATION_SALT_PREVIOUS（Cloudflare 側も削除）
5) op item delete（または archive）AUDIT_CORRELATION_SALT_PREVIOUS
6) ローカル変数 unset
7) exit 0
```

### `--end-rotation`

```
1) cf.sh secret delete AUDIT_CORRELATION_SALT_PREVIOUS --env "$ENV"
2) op item delete (archive) AUDIT_CORRELATION_SALT_PREVIOUS
3) staging は `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` まで実行して env binding を更新する
4) production は deploy を実行せず、user gate 後の明示コマンドを stdout に表示する
5) exit 0
```

## 不変条件

1. salt の literal 値（旧 / 新 / previous）は **stdout / stderr / コミット / log ファイル** のいずれにも書き出さない。表示する場合は sha256 prefix 8 文字のみ。
2. `--apply` / `--rollback` / `--end-rotation` は `--env production` 指定時、確認プロンプト 2 回 + `--yes` 明示が無ければ実行しない（事故防止）。
3. `wrangler` を直接呼ばない。すべて `scripts/cf.sh` 経由。
4. `op` の認証は呼び出し元（ユーザー or CI）に委ねる。`OP_SERVICE_ACCOUNT_TOKEN` 利用可否は環境次第。
5. `set -euo pipefail` を最初に宣言。サブシェルでも errexit を継承。

## `op-helpers.sh`（必要時のみ）

`rotate-salt.sh` 内で `op item get/edit/create/delete` を 4 回以上呼ぶため、共通化が必要なら以下を切り出す:

```bash
op_read_field "Production" "AUDIT_CORRELATION_SALT" "credential"
op_write_field "Production" "AUDIT_CORRELATION_SALT" "credential" <<< "$value"
op_archive_item "Production" "AUDIT_CORRELATION_SALT_PREVIOUS"
```

入出力は stdin / stdout 経由のみ。引数列に値を渡さない。

## grep gate（`scripts/grep-gate/audit-correlation-secrets.sh`）

### 目的

dual-hash 期間中の出力（log / dist / cache）に salt literal が混入していないことを検査する。

### 検査対象

```
apps/api/dist/**
apps/api/.wrangler/**
apps/api/.open-next/**
outputs/**
.logs/**
```

### NG パターン

- `op://` 参照以外の 64 文字連続 hex（`/[a-f0-9]{64}/`）が含まれていた場合 fail（注: SHA-256 hash literal 自体も 64 hex なので、許可リストとして「NormalizedAuditEvent bridge shape JSON 内の hash 値」「test fixture」は除外する）。
- 文字列 `AUDIT_CORRELATION_SALT=` の右辺に hex 値らしきものが現れる場合 fail。
- `ghp_*` / `github_pat_*` / Cloudflare API token pattern も既存 grep-gate と整合させて含める（既存 `scripts/audit-correlation/grep-gate.sh` から共通 pattern を import）。

### 許可リスト戦略

ファイルレベルの allowlist（`scripts/grep-gate/audit-correlation-secrets.allowlist.txt`）でテスト fixture を除外する。

### exit code

| code | 意味 |
| --- | --- |
| 0 | 検出なし（OK） |
| 1 | NG 検出（PR 失敗） |

## ローカル実行コマンド

```bash
shellcheck scripts/audit-correlation/rotate-salt.sh
shellcheck scripts/grep-gate/audit-correlation-secrets.sh

# dry-run（staging）
bash scripts/audit-correlation/rotate-salt.sh --dry-run --env staging \
  | tee outputs/phase-8/dry-run-staging.log

# grep gate
bash scripts/grep-gate/audit-correlation-secrets.sh \
  | tee outputs/phase-8/grep-gate.log
```

## テスト方針（Phase 10 と連携）

- `--dry-run` を bats / Node 子プロセスで起動し、stdout が salt literal を含まないことを正規表現で assert。
- `--apply` のドライ呼び出しは Phase 10 では skip し、Phase 11 staging evidence でのみ実行。
- grep gate の正常系: クリーンな repo で exit 0。
- grep gate の異常系: テスト fixture に `AUDIT_CORRELATION_SALT=<64hex>` を埋め込み exit 1 を assert。
- shellcheck warn 0 を CI gate にする。

## 完了条件（DoD）

- [ ] 4 モードの引数 / 副作用 / exit code が確定。
- [ ] salt literal 非露出の不変条件が明記。
- [ ] 1Password vault 構造の前提が確定（`op://Production/AUDIT_CORRELATION_SALT/credential`）。
- [ ] `scripts/cf.sh` 経由の secret put / delete コマンド形式が確定。
- [ ] grep gate の検査対象 / NG パターン / 許可リスト戦略が確定。
- [ ] shellcheck warn 0 が CI gate として記載。
- [ ] production 実行時の 2 重確認プロンプトが明記。

## 次 Phase 連携

- Phase 9 runbook で本 script の 4 モードを呼ぶ運用手順を記載する。
- Phase 10 で shellcheck / dry-run test を実行。
- Phase 11 staging で `--apply` を 1 回成功させ、HIGH alert 連続性を観察する。
