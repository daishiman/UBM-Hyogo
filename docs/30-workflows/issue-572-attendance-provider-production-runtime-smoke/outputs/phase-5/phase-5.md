# Phase 5: 実装計画策定（4 ワークストリーム）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572（CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装計画仕様書 |

> 本 Phase はコード実装を行わない。実装ステップ・前後依存・evidence 取得順序を spec として固定する。

## 目的

production smoke を読み取り専用で PASS させるために必要な 4 ワークストリーム（production smoke スクリプト / redact filter 拡張 / session 注入手順 / wrangler binding 検証手順）の実装ステップ・前後依存・evidence 取得順序を確定する。

## ワークストリーム概要

| ID | ワークストリーム | 主出力 | 苦戦項目対策 |
| --- | --- | --- | --- |
| WS-1 | production smoke スクリプト | `apps/api/scripts/runtime-smoke/run-smoke.sh`（新規） | ST-3 (API URL 取り違え) |
| WS-2 | redact filter 拡張 | `scripts/lib/redaction.sh`（既存編集） + `tests/unit/redaction.test.sh`（既存編集） | ST-4 (production 偽陰性) |
| WS-3 | session 注入手順 | `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`（新規） | ST-2 (shell 履歴漏洩) |
| WS-4 | wrangler binding 検証手順 | 同 runbook 内セクション + `tests/unit/wrangler-binding-parse.test.sh`（新規） | ST-1 (binding 差分) |

## 前後依存

```
WS-2 (redact unit test 緑) ──┐
                              ├──> WS-1 (production smoke 実行可能)
WS-4 (binding diff 0 確認) ──┤
WS-3 (session 注入手順確定) ─┘
                                    └──> Phase 11 (production 本実行)
```

- WS-2 と WS-4 は並行可能。両方の test PASS を待ってから WS-1 を実行する。
- WS-3 は WS-1 のオペレーション手順として参照されるため、WS-1 の本実行前に確定が必要。

## WS-1: production smoke スクリプト

### 実装ステップ

1. `apps/api/scripts/runtime-smoke/run-smoke.sh` を新規作成。
2. 環境変数 `PRODUCTION_API_URL` / `ADMIN_SESSION` / `MEMBER_SESSION` / `TARGET_MEMBER_ID` を必須入力として受け取る（未設定時は即終了）。
3. `/admin/members`（list）/ `/admin/members/:memberId`（detail）/ `/me/profile` を curl で順次呼び出し。
4. 各レスポンスを `redact_stream` に通してから evidence ファイル `outputs/phase-11/production-smoke-summary.md` に追記。
5. `jq -e '.attendance | type == "array"'` で DI-bound evidence を assert。失敗時は非 0 終了。
6. 終了コード: 全 PASS = 0 / assert 失敗 = 1 / 環境変数欠如 = 2 / curl 失敗 = 3。

### ローカル検証コマンド

```bash
# dry-run 確認（実行はしない、引数バリデーションのみ）
bash apps/api/scripts/runtime-smoke/run-smoke.sh --dry-run

# redact 通過後の grep gate（zero-hit 確認用）
grep -E "(Cookie:|Authorization:|Bearer |ya29\.|cf-|@[A-Za-z0-9._-]+\.[A-Za-z]+)" \
  outputs/phase-11/production-smoke-summary.md && echo "FAIL" || echo "OK"
```

## WS-2: redact filter 拡張

### 追加すべき sed パターン（`redact_stream` 内）

| ID | パターン | 対象 |
| --- | --- | --- |
| R-07 | `cf-[A-Za-z0-9_-]+: [^,[:space:]]+` | Cloudflare 内部 token / cf-ray / cf-connecting-* |
| R-08 | `(google_oauth\|oauth_secret\|client_secret)[[:space:]]*[:=][[:space:]]*[^[:space:],]+` | OAuth secret 系 key=value |
| R-09 | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` | email アドレス（任意 domain） |
| R-10 | `"fullName"[[:space:]]*:[[:space:]]*"[^"]+"` | profile body 内 fullName 値 |
| R-11 | `"profile"[[:space:]]*:[[:space:]]*\{[^}]*\}` | profile body 全体（内側構造を ***REDACTED_PROFILE*** で潰す） |

### 実装ステップ

1. `scripts/lib/redaction.sh` の `redact_stream` 関数末尾に R-07..R-11 を sed で追加。
2. R-09 (email) は R-03 (URL query) より前に置き、URL 内の `user@host` 部分を先に潰す。
3. `tests/unit/redaction.test.sh` に R-07..R-11 の `assert_redacted` ケースを 5 本追加（合成サンプルのみ使用）。
4. `bash tests/unit/redaction.test.sh` を実行し全 PASS を確認。

### ローカル検証コマンド

```bash
bash tests/unit/redaction.test.sh
```

期待: R-01..R-11 すべて PASS。

## WS-3: session 注入手順

### 手順仕様

1. session cookie / Bearer は **1Password に保管**し、`.env` には `op://Vault/Item/Field` 参照のみを記述（CLAUDE.md `apps/web` env アクセス不変条件と整合）。
2. 実行時は `op run --env-file=.env -- bash apps/api/scripts/runtime-smoke/run-smoke.sh` の形でラップ。token は環境変数として揮発的に渡るのみ・ファイル / shell 履歴 / プロセス引数に残らない。
3. `set +o history` を script 冒頭で実行（保険）。
4. curl は `-H "Cookie: $ADMIN_SESSION"` のように環境変数参照とし、値の直書きを禁止。
5. evidence ファイルへの記録時は redact 通過後の summary のみを書き込む。
6. 実行後に `history | grep -E "Cookie|Bearer|cf-"` を実行し 0 hit を確認する手順を runbook に明記。

## WS-4: wrangler binding 検証手順

### 手順仕様

1. `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production` で最新 deploy commit が `issue-371` 親タスク commit を含むことを確認。
2. `apps/api/wrangler.toml` の `[env.staging]` / `[env.production]` セクションを diff し、binding 名（D1 / KV / R2 / vars）の構造同型性を確認。
3. 値（D1 database_id / KV namespace_id）は環境ごとに異なるが、**binding name** は同一であることを assert。
4. `tests/unit/wrangler-binding-parse.test.sh` で staging のみ存在 / production のみ存在 / 双方共通だが値が異なる の 3 シナリオを describe 化。
5. diff 結果を `outputs/phase-11/wrangler-binding-diff.md` に summary-only で記録（database_id 実値は除外、binding name のみ）。

### ローカル検証コマンド

```bash
bash tests/unit/wrangler-binding-parse.test.sh
```

## evidence 取得順序（Phase 11 用前提）

1. WS-2 unit test 緑
2. WS-4 binding diff 0
3. WS-3 session 注入手順確定（runbook PR レビュー済）
4. WS-1 production smoke 実行 → `production-smoke-summary.md` 生成
5. redact zero-hit grep gate → `redact-filter-zero-hit.log` 生成
6. user 明示承認取得 → `user-approval-evidence.md` 生成
7. 親 Issue #371 `workflow_state` 昇格 PR 作成

## DoD（完了定義）

- [ ] WS-1..WS-4 の前後依存が確定（WS-2 / WS-4 → WS-1 / WS-3 → WS-1 → Phase 11）
- [ ] 各 WS のローカル検証コマンドが記述されている
- [ ] redact filter 拡張パターン 5 種（R-07..R-11）が確定
- [ ] session 注入が `op run` ラップに統一されている
- [ ] wrangler binding 検証で「name 同型 / 値環境別」の判定基準が確定
- [ ] 苦戦項目 ST-1..ST-4 が WS にマッピングされている

## 次 Phase の前提条件

Phase 6 で各 WS の変更対象ファイル詳細・関数 / 環境変数 / 引数シグネチャ・差分方針を確定する。
