# Phase 3: 設計 / production smoke スクリプト設計 / API URL 切替 / redact filter 拡張 / session 注入方式

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流 | Phase 1（不可侵条件確定） / Phase 2（スコープ確定） |

## 目的

Phase 1 の不可侵条件 5 件と Phase 2 の endpoint surface / binding 差分を踏まえ、production smoke スクリプト 4 本（entrypoint + 3 helper）の **関数シグネチャ・正規表現・jq filter・session 注入パターン** を Phase 5-7 が参照すべき粒度で確定する。

## Step 0: 入口チェック

```bash
mkdir -p outputs/phase-3
test -f outputs/phase-1/phase-1.md && echo "OK: phase-1 present"
test -f outputs/phase-2/phase-2.md && echo "OK: phase-2 present"
```

## スクリプト構成

```
apps/api/scripts/runtime-smoke/
├── run-smoke.sh        # entrypoint (Phase 7)
├── redact-filter-production.sh           # production 固有 redact (Phase 5)
└── lib/
    ├── api-url-guard.sh                  # PRODUCTION_API_URL guard (Phase 6)
    └── evidence-summary.sh               # jq summary 抽出 helper (Phase 6)
```

## 既存 staging smoke との差分

| 項目 | staging smoke（既存） | production smoke（本タスクで追加） |
| --- | --- | --- |
| API URL env | `STAGING_API_URL` | `PRODUCTION_API_URL`（Phase 1 INV-3 guard 経由でのみ参照） |
| redact filter | staging filter（一般値のみ） | staging filter 継承 + production 固有値（INV-4） |
| session 注入 | CI 環境変数（staging 限定 dummy） | 対話的 `read -s` + `unset` + `trap`（INV-2） |
| 実行 trigger | CI 自動（issue-571 で統合済） | 手動 + user 明示承認 gate（INV-5） |
| evidence 出力先 | `outputs/staging-smoke/` | `outputs/phase-11/`（本タスク Phase 11） |
| HTTP method | GET only | GET only（同じ。Phase 1 不可侵） |

## `lib/api-url-guard.sh` 設計（Phase 6 で実装）

### 関数シグネチャ

```bash
# guard_production_api_url
#   - argv: なし
#   - reads:  PRODUCTION_API_URL, STAGING_API_URL（任意）
#   - exits:  非ゼロで abort（誤り時）
#   - prints: stderr に診断、stdout には何も出さない
guard_production_api_url() { ... }
```

### guard ルール

1. `PRODUCTION_API_URL` が unset または空 → `exit 1`（メッセージ: `PRODUCTION_API_URL is not set`）
2. `PRODUCTION_API_URL` が `^https://` で始まらない → `exit 1`
3. `PRODUCTION_API_URL` が `staging` / `dev` / `localhost` / `127\.0\.0\.1` を含む → `exit 1`（誤環境検出）
4. `STAGING_API_URL` が定義されていて `PRODUCTION_API_URL` と等しい → `exit 1`（取り違え検出）
5. オプション: production domain pattern（Phase 2 binding 差分から特定する想定。例 `^https://api\.<production-host>(/.*)?$`）にマッチしないなら `exit 1`

> production domain の具体ホスト名は本仕様書に焼かない（CLAUDE.md: 設定値・機密情報はドキュメントに残さない）。`api-url-guard.sh` 内で env または同梱 allow-list（git-ignored）から取得する設計とし、Phase 6 実装時に確定する。

## `redact-filter-production.sh` 設計（Phase 5 で実装）

### pipeline 構造

```
stdin (curl response: headers + body)
  → staging redact filter（既存。一般 cookie/Bearer/JWT を redact）
  → production-specific sed/perl pipeline
  → stdout（redacted）
```

### production 固有 pattern 一覧

| 分類 | 正規表現（perl-style） | 置換先 |
| --- | --- | --- |
| Cloudflare ray id | `cf-ray:\s*[a-f0-9-]+` | `cf-ray: <REDACTED>` |
| `__Secure-*` cookie | `__Secure-[A-Za-z0-9_-]+=[^;\r\n]+` | `__Secure-<NAME>=<REDACTED>` |
| OAuth state / code | `(state|code)=[A-Za-z0-9_\-\.]{16,}` | `$1=<REDACTED>` |
| magic link token | `token=[A-Za-z0-9_\-\.]{16,}` | `token=<REDACTED>` |
| email local part | `\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b` | `<REDACTED>@$2`（domain だけ残す） |
| fullName JSON | `"fullName"\s*:\s*"[^"]+"` | `"fullName":"<REDACTED>"` |
| profile body 実値（attendance entry の details など） | `"(notes|comment|memo)"\s*:\s*"[^"]+"` | `"$1":"<REDACTED>"` |
| Authorization Bearer | `Authorization:\s*Bearer\s+[A-Za-z0-9_\-\.]+` | `Authorization: Bearer <REDACTED>` |
| Set-Cookie 全般 | `Set-Cookie:\s*[^=]+=[^;\r\n]+` | `Set-Cookie: <REDACTED>` |

### 0-hit 保証 test（Phase 10）

```bash
# fixture（dummy production response）に対して filter を実行
# その後、上記 pattern が 1 件も残っていないことを assertion
./redact-filter-production.sh < fixture.txt > redacted.txt
for pat in 'cf-ray:\s*[a-f0-9-]' '__Secure-[A-Za-z0-9_-]+=[A-Za-z]' \
           'Bearer\s+[A-Za-z0-9]' '"fullName"\s*:\s*"[A-Za-z]'; do
  if rg -q "$pat" redacted.txt; then
    echo "FAIL: pattern $pat leaked"; exit 1
  fi
done
echo "OK: redact filter 0-hit"
```

## `lib/evidence-summary.sh` 設計（Phase 6 で実装）

### 関数シグネチャ

```bash
# evidence_summary <endpoint_label>
#   - stdin:  redacted response body (JSON)
#   - stdout: 1 行 JSON summary（type / length / keys_count のみ）
#   - 不正 JSON は {"endpoint":"<label>","error":"non_json"} を返す（body 値非保持）
evidence_summary() { ... }
```

### endpoint 別 jq filter

| endpoint label | jq filter |
| --- | --- |
| `admin/members` | `{endpoint:"admin/members", top_keys_count:(keys\|length), response_type:(. \| type)}` |
| `admin/members/:id` | `{endpoint:"admin/members/:id", attendance_type:(.attendance \| type), attendance_length:(.attendance \| length? // null)}` |
| `me/profile` | `{endpoint:"me/profile", attendance_type:(.profile.attendance \| type), attendance_length:(.profile.attendance \| length? // null)}` |
| `me/attendance` | `{endpoint:"me/attendance", response_type:(. \| type), top_keys_count:(if (. \| type)=="object" then (keys\|length) else null end)}` |

> **禁止**: 上記 field 以外を summary に含めない。特に `name`, `email`, `id` 値, `attendance` の各 entry 内容は summary に絶対出さない。

## session 注入方式（INV-2 の bash 実装）

```bash
# run-smoke.sh の session 注入セクション設計（疑似コード）

set -euo pipefail
trap 'unset SESSION_COOKIE BEARER_TOKEN 2>/dev/null || true' EXIT INT TERM

guard_production_api_url

read -r -s -p "Paste production session cookie (input hidden): " SESSION_COOKIE
echo  # newline after hidden read
[ -n "${SESSION_COOKIE}" ] || { echo "FAIL: empty session"; exit 1; }

for endpoint in "/admin/members" "/admin/members/${MEMBER_ID}" "/me/profile" "/me/attendance"; do
  curl --silent --show-error --fail \
       --header "Cookie: ${SESSION_COOKIE}" \
       "${PRODUCTION_API_URL}${endpoint}" \
    | bash redact-filter-production.sh \
    | bash lib/evidence-summary.sh "${endpoint#/}" \
    >> "outputs/phase-11/evidence-summary.ndjson"
done

unset SESSION_COOKIE
```

### shell 履歴非保持の検証手順（runbook で gate）

実行後、user は以下を runbook に従って実行し記録する:

```bash
history | tail -50 | grep -i 'cookie\|bearer\|session=' || echo "OK: no session leak in history"
```

## error handling 設計

| エラー種別 | 検出箇所 | 動作 |
| --- | --- | --- |
| `PRODUCTION_API_URL` 不正 | `api-url-guard.sh` | `exit 1`、smoke 開始前に abort |
| HTTP 非 200 | `curl --fail` | `exit non-zero`、後続 endpoint 中断 |
| jq 不正 JSON | `evidence-summary.sh` | summary に `"error":"non_json"` を記録、後続継続 |
| redact filter 0-hit assertion 失敗 | Phase 10 test | CI fail、PR merge 不可 |
| `STAGING_API_URL` と一致 | `api-url-guard.sh` | `exit 1`（取り違え検出） |
| user 承認 timestamp 欠落 | runbook checklist（Phase 8） | Phase 11 へ進めない（manual gate） |

## API contract 不変保証

production smoke は **read-only GET** のみで、`apps/api/src/routes/` の現行 endpoint surface を一切変更しない。本仕様書のいかなる Phase においても以下を禁止する:

- `apps/api/src/routes/` 配下のファイル編集
- D1 migration 追加
- `apps/api/wrangler.toml` の binding 名変更
- attendanceProvider middleware 実装変更（issue-371 で完了済み）

## 想定変更ファイル一覧（Phase 3 段階）

Phase 3 は設計 phase。本 phase での実ファイル変更は以下のみ:

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `outputs/phase-3/phase-3.md` | 新規 | 本ファイル / 設計確定書 |

タスク全体の想定変更ファイルは Phase 2 で確定済（再掲不要）。

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | スクリプト 4 本の構成・関数シグネチャが確定 | spec grep |
| AC-2 | redact filter の production 固有 pattern 一覧（9 種以上）が確定 | spec grep |
| AC-3 | jq evidence summary の endpoint 別 filter（4 種）が確定 | spec grep |
| AC-4 | session 注入の bash 実装パターン（`read -s` + `trap` + `unset`）が記述 | spec grep |
| AC-5 | error handling 表（6 種以上）が確定 | spec grep |
| AC-6 | API contract 不変保証（routes 編集禁止 / migration 追加禁止）が明記 | spec grep |

## GO/NO-GO 判定（Phase 4 着手）

- **GO 条件**: AC-1〜AC-6 全て満たし、Phase 5-7 実装が本仕様書のみを参照して書ける粒度で記述されている
- **NO-GO 条件**: 関数シグネチャ・正規表現・jq filter のいずれかが不確定 / API contract 不変保証が記述されていない
- **NO-GO 時アクション**: Phase 3 を再実行し、不足箇所を補完

## テスト方針 / ローカル検証コマンド / DoD

### テスト方針

Phase 3 は設計 phase。code test 不要。設計の網羅性を spec grep で確認。

### ローカル検証コマンド

```bash
# AC を満たす記述があるか grep
grep -c '^| AC-[1-6] ' outputs/phase-3/phase-3.md     # 期待: 6
grep -c 'guard_production_api_url' outputs/phase-3/phase-3.md  # 期待: >=1
grep -c 'redact-filter-production' outputs/phase-3/phase-3.md  # 期待: >=2
grep -c 'evidence_summary' outputs/phase-3/phase-3.md          # 期待: >=1
grep -c 'read -r -s -p' outputs/phase-3/phase-3.md             # 期待: >=1
grep -c "trap " outputs/phase-3/phase-3.md                     # 期待: >=1
```

### DoD

- [ ] スクリプト 4 本の構成・シグネチャ・pattern・jq filter・session 注入・error handling が本ドキュメントに固定
- [ ] API contract 不変保証が明記
- [ ] AC-1〜AC-6 全て満たす
- [ ] Phase 4 着手 GO 判定記録

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル / 設計確定書）
