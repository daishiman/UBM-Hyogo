# Phase 12 Implementation Guide

## Part 1: 中学生レベル

### なぜ必要か

Issue #371 で、出席情報を読む係を Hono の仕組みに正式登録した。ただし staging で動いていても、本番環境で同じように動くとは限らない。本番で「出席情報が取れる形で返るか」だけを安全に確認する道具が必要だった。何をするかというと、本番 API に読み取りだけの確認をして、出席情報が配列として返るかを確かめる。

### 日常の例え

クラスの出席簿で考えると、先生が「今日の出席簿を見せて」と頼んだとき、返ってくるものは名前が並んだリストである必要がある。紙そのものの中身を全部コピーして持ち出す必要はなく、「リストとして存在する」「何件ある」だけ分かれば、出席簿を渡す係が正しく動いているか確認できる。

### 今回作ったもの

今回作ったのは、本番 API に read-only の GET だけを投げる smoke runner と runbook。データの追加・変更・削除はしない。Cookie、Bearer token、メールアドレス、名前、Cloudflare cookie などは保存せず、`attendance` が配列かどうかと件数だけを証跡に残す。production 実行、Issue #371 昇格 commit、push、PR は user approval gate 後だけに残す。

## Part 2: 技術者レベル

本サイクルでは Issue #572 を `implemented-local / implementation / NON_VISUAL / runtime pending user gate` として扱う。production への実 GET smoke は user 明示承認後に限るが、ローカルで実装できる runner、redaction、assertion、runbook、単体テスト、正本同期は同一 wave で反映した。

実装済み:

| Path | Role |
| --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | `--env production|staging` と `--readonly` を必須にした単一 runner |
| `apps/api/scripts/runtime-smoke/run-production-smoke.sh` | 互換 wrapper。正本は `run-smoke.sh` |
| `apps/api/scripts/runtime-smoke/lib/api-url-guard.sh` | production URL が staging / preview / localhost / `STAGING_API_URL` 同値でないことを fail-closed 検証 |
| `apps/api/scripts/runtime-smoke/lib/evidence-summary.sh` | jq による summary-only 抽出 |
| `apps/api/scripts/runtime-smoke/redact-filter-production.sh` | 既存 `scripts/lib/redaction.sh` の production redaction 経路 |
| `scripts/lib/redaction.sh` | `__Secure-*`, `_cfuvid`, `_cf_bm`, Cloudflare headers, OAuth state, email local part, name fields を redaction |
| `tests/unit/redaction.test.sh` | production redaction ケース追加 |
| `tests/unit/runtime-smoke.test.sh` | shell syntax, dry-run, URL guard を検証 |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | user gate 付き production smoke runbook |

Production smoke 実行後にのみ、Issue #371 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` へ昇格する。commit / push / PR は Phase 13 の user approval gate に残す。

DI-bound 判定は記録だけでなく fail-closed assertion として扱う。`/admin/members/:memberId` の `.attendance` と `/me/profile` の `.profile.attendance` が `array` でない場合、`evidence-summary.sh` は exit 1 で停止し、AC-1 / AC-6 を未達として扱う。

### CLIシグネチャ

```bash
bash apps/api/scripts/runtime-smoke/run-smoke.sh --env production|staging --readonly [--dry-run] [--output-dir DIR]
bash apps/api/scripts/runtime-smoke/run-production-smoke.sh --readonly [--dry-run] [--output-dir DIR]
```

`--readonly` は必須。`--env production` は `PRODUCTION_API_URL` を使い、`--env staging` は `STAGING_API_URL` を使う。production URL が staging / preview / localhost / `STAGING_API_URL` 同値の場合は fail closed で停止する。

### 使用例

```bash
export PRODUCTION_API_URL="https://api.ubm-hyogo.workers.dev"
unset STAGING_API_URL
bash apps/api/scripts/runtime-smoke/run-smoke.sh --env production --readonly --dry-run
```

実行時は fresh terminal で runner を起動し、prompt に admin / member session cookie を貼る。runner は `read -s` で受け取り、終了時に `unset ADMIN_SESSION_COOKIE MEMBER_SESSION_COOKIE` する。

### API / jq 契約

| Endpoint | Assertion |
| --- | --- |
| `GET /admin/members?limit=5` | HTTP 200。`items[0].id` または `members[0].id` から `SMOKE_MEMBER_ID` を導出できる |
| `GET /admin/members/:memberId` | HTTP 200。`.attendance | type == "array"` |
| `GET /me/profile` | HTTP 200。`.profile.attendance | type == "array"` |
| `GET /me/attendance` | HTTP 200。array または `items` 配列として件数を summary-only 記録 |

```ts
type RuntimeSmokeEnv = "production" | "staging";

interface AttendanceSmokeSummary {
  endpoint: "/admin/members/:memberId" | "/me/profile";
  attendance_type: "array";
  attendance_length: number;
}
```

### エラーハンドリング

| Failure | Behavior |
| --- | --- |
| API URL 未設定 | exit 2 |
| production URL が staging / preview / localhost | exit 2 |
| `--readonly` なし | exit 2 |
| HTTP status が 200 以外 | exit 1 |
| `SMOKE_MEMBER_ID` 導出不可 | exit 1 |
| `.attendance` / `.profile.attendance` が array 以外 | exit 1 |
| redaction grep hit | matched value は保存せず `sensitive_pattern_hit=true` のみ記録して exit 1 |

### エッジケース

| Case | Handling |
| --- | --- |
| `/admin/members` が空 | `SMOKE_MEMBER_ID` を明示しない限り停止 |
| `/me/profile` が `.attendance` ではなく `.profile.attendance` を返す | `.profile.attendance` を正本として assertion |
| 手順書に例示メールが含まれる | runner の grep 対象から手順書を除外し、runtime summary のみ検査 |
| production 実行承認前 | `implemented-local` のまま、runtime PASS へ昇格しない |

### 設定項目と定数一覧

| Env | 用途 |
| --- | --- |
| `PRODUCTION_API_URL` | production smoke の base URL |
| `STAGING_API_URL` | staging rehearsal の base URL。production と同値なら abort |
| `SMOKE_MEMBER_ID` | `/admin/members` から導出できない場合の明示 member id |
| `ADMIN_SESSION_COOKIE` | admin session。未設定時は `read -s` prompt |
| `MEMBER_SESSION_COOKIE` | member session。未設定時は `read -s` prompt |

### テスト構成

| Test | Coverage |
| --- | --- |
| `tests/unit/runtime-smoke.test.sh` | shell syntax、dry-run、production URL guard、staging URL 誤用 reject、DI-bound array assertion |
| `tests/unit/redaction.test.sh` | R-01〜R-07 redaction、`__Secure-*` cookie 名・値、Cloudflare header、email local part、fullName、OAuth state |
| `shellcheck -x ...` | runner / helper / test shell static check |

### Evidence 境界

`phase-11.md` は手順書なので redaction grep の走査対象にしない。runner は `production-smoke-summary.md` と `outputs/phase-11/evidence/` のみを走査し、自己文書中の例示メールアドレスで false positive を起こさない。runbook は Phase 11 正本に合わせ、runtime 3 ファイルだけでなく local evidence 4 ファイル、grep gate、binding diff、user approval を含む 9 ファイル構成を参照する。
