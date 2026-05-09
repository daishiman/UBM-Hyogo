# Phase 6: 実装（変更対象ファイル詳細 / 関数シグネチャ / 差分方針）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572（CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書（差分方針確定） |

> 本 Phase 内ではコード実装を行わない。別タスクの実装担当が本 spec のみで実装可能となる粒度で差分方針を固定する。実装手順は本ドキュメント内に記述する。

## 目的

Phase 5 の 4 ワークストリーム（WS-1..4）に対し、変更対象ファイル・関数/環境変数/引数シグネチャ・入出力・副作用・エラーハンドリングを確定する。

## 変更対象ファイル一覧

| # | パス | 種別 | 行数目安 | WS |
| --- | --- | --- | --- | --- |
| 1 | `apps/api/scripts/runtime-smoke/run-smoke.sh` | 新規 | ~120 | WS-1 |
| 2 | `apps/api/scripts/runtime-smoke/lib/assert-attendance.sh` | 新規 | ~30 | WS-1 |
| 3 | `scripts/lib/redaction.sh` | 既存編集 | +5 sed lines | WS-2 |
| 4 | `tests/unit/redaction.test.sh` | 既存編集 | +5 cases | WS-2 / Phase 7 |
| 5 | `tests/unit/wrangler-binding-parse.test.sh` | 新規 | ~80 | WS-4 / Phase 7 |
| 6 | `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | ~150 | WS-3 / WS-4 |
| 7 | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/main.md` | 既存編集 | state 行のみ | Phase 11 後段 |

## ファイル 1: `run-smoke.sh`（WS-1）

### コマンドラインインターフェース

```bash
bash apps/api/scripts/runtime-smoke/run-smoke.sh [--dry-run]
```

### 必須環境変数

| 変数名 | 用途 | 由来 |
| --- | --- | --- |
| `PRODUCTION_API_URL` | production API base URL | `op run --env-file=.env` 経由で 1Password から注入 |
| `ADMIN_SESSION` | admin session cookie 値 | 同上 |
| `MEMBER_SESSION` | 一般会員 session cookie 値 | 同上 |
| `TARGET_MEMBER_ID` | smoke 対象の member ID（attendance が 1 件以上ある会員） | 同上 |

### 終了コード

| code | 意味 |
| --- | --- |
| 0 | 全 endpoint PASS かつ DI-bound evidence assert 成功 |
| 1 | DI-bound evidence assert 失敗（`.attendance` が array でない） |
| 2 | 必須環境変数欠如 |
| 3 | curl 失敗（network / non-2xx） |

### 関数シグネチャ（shell function）

```bash
# arg1: endpoint path (e.g. "/admin/members")
# arg2: session cookie env var name (e.g. "ADMIN_SESSION")
# stdout: redact 通過後の response body summary
# return: 0=ok / 3=curl fail
smoke_get() { ... }

# arg1: response body (already redacted)
# stdout: jq result
# return: 0=array / 1=not array
assert_attendance_array() { ... }
```

### 副作用

- `outputs/phase-11/production-smoke-summary.md` に追記（redact 通過後）。
- `outputs/phase-11/redact-filter-zero-hit.log` に grep gate 結果を出力。
- shell 履歴・プロセス引数・evidence に session 値を残さない（`set +o history` + 環境変数参照）。

### エラーハンドリング

| 条件 | 挙動 |
| --- | --- |
| 環境変数未設定 | exit 2 + stderr に欠如変数名 |
| curl non-2xx | exit 3 + endpoint と status のみ stderr に出力（body は redact 通過後） |
| `jq` parse 失敗 | exit 1 + endpoint のみ stderr |
| redact 通過後も grep gate hit | exit 1 + 該当 line 番号のみ |

## ファイル 2: `lib/assert-attendance.sh`（WS-1）

```bash
# usage: cat response.json | assert_attendance_is_array <endpoint_label>
assert_attendance_is_array() {
  local label="$1"
  jq -e '.attendance | type == "array"' >/dev/null 2>&1 \
    && echo "PASS $label .attendance is array" \
    || { echo "FAIL $label .attendance not array" >&2; return 1; }
}
```

## ファイル 3: `scripts/lib/redaction.sh`（WS-2）

### 追加 sed パターン（既存 `redact_stream` 末尾に append）

```bash
# R-07: cf-* token / cf-ray / cf-connecting-*
-e 's/(cf-[A-Za-z0-9_-]+)[[:space:]]*[:=][[:space:]]*[^,[:space:]]+/\1: ***REDACTED_CF***/Ig' \

# R-08: OAuth secret 系
-e 's/(google_oauth|oauth_secret|client_secret|refresh_token)([[:space:]]*[:=][[:space:]]*"?)[^",[:space:]]+/\1\2***REDACTED_OAUTH_SECRET***/Ig' \

# R-09: email
-e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/***REDACTED_EMAIL***/g' \

# R-10: profile body fullName
-e 's/("fullName"[[:space:]]*:[[:space:]]*)"[^"]+"/\1"***REDACTED_NAME***"/g' \

# R-11: profile body 全体（保守的）
-e 's/("profile"[[:space:]]*:[[:space:]]*)\{[^}]*\}/\1{"***REDACTED_PROFILE***":true}/g'
```

### sed 評価順序の不変条件

R-09 (email) は R-03 (URL ?query) より前に置く。さもないと URL 内の `?email=foo@bar.com` のうち URL query が先に潰され、email pattern が hit しない経路ができる。

### 副作用

- 既存 R-01..R-06 の挙動は変更しない（regression 0）。
- 新規 5 パターンのみ追加。

## ファイル 4: `tests/unit/redaction.test.sh`（WS-2 / Phase 7）

Phase 7 で詳細を記述。本 Phase では「assert_redacted ケース 5 本を追加し、合成サンプル（実 token / 実 secret / 実 email を含まない）のみ使用」する方針のみ確定。

## ファイル 5: `tests/unit/wrangler-binding-parse.test.sh`（WS-4 / Phase 7）

Phase 7 で詳細を記述。

## ファイル 6: runbook（WS-3 / WS-4）

### 構成

```
production-runtime-smoke-attendance.md
├── 1. 前提条件（user 承認 / op CLI / scripts/cf.sh）
├── 2. session 注入手順（op run --env-file=.env ラップ）
├── 3. wrangler binding diff 検証
├── 4. production smoke 実行
├── 5. redact zero-hit gate
├── 6. evidence 配置（outputs/phase-11/）
└── 7. 親 Issue #371 workflow_state 昇格 PR 手順
```

## ファイル 7: 親タスク state 更新

```diff
- workflow_state: implemented-local
+ workflow_state: completed
- runtime: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
+ runtime: PASS_RUNTIME_VERIFIED
+ production_smoke_commit: <commit-hash>
+ production_smoke_at: 2026-05-XX
```

## 入出力サマリ

| 入力 | 出力 |
| --- | --- |
| `PRODUCTION_API_URL` / `ADMIN_SESSION` / `MEMBER_SESSION` / `TARGET_MEMBER_ID`（環境変数） | `production-smoke-summary.md` / `redact-filter-zero-hit.log` / `wrangler-binding-diff.md` |

## ローカル検証コマンド（実装後の検証）

```bash
# unit test
bash tests/unit/redaction.test.sh
bash tests/unit/wrangler-binding-parse.test.sh

# dry-run
bash apps/api/scripts/runtime-smoke/run-smoke.sh --dry-run

# typecheck / lint（apps/api 周辺の影響確認）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

## DoD（完了定義）

- [ ] 7 ファイルの変更種別（新規 / 既存編集）が一覧化
- [ ] `run-smoke.sh` の必須環境変数 4 種・終了コード 4 種が確定
- [ ] `redact_stream` への追加 5 パターン（R-07..R-11）の sed コードが確定
- [ ] sed 評価順序の不変条件（R-09 を R-03 の前）が明記
- [ ] session 注入が `op run --env-file=.env` ラップに統一されている
- [ ] 親 Issue #371 state 更新の diff 方針が確定
- [ ] 本 Phase ではコード実装を行わない（別タスクで実装）旨が冒頭で明示

## 次 Phase の前提条件

Phase 7 で `tests/unit/redaction.test.sh` の追加ケース 5 本と `tests/unit/wrangler-binding-parse.test.sh` の 3 シナリオを単体テスト仕様として確定する。
