# Phase 6: 異常系検証 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 / 13 |
| 入力 | Phase 5 実装 |
| 出力 | `outputs/phase-06/main.md`（異常系シナリオ / 期待動作 / 検証コマンド） |

## 目的

CI 統合における **想定外入力 / 障害シナリオ** を網羅的に列挙し、各シナリオで期待される挙動と検証手段を確定する。Phase 11 の failure injection evidence の入力にもなる。

## 異常系シナリオ

| ID | シナリオ | トリガ | 期待動作 | 検証 |
| --- | --- | --- | --- | --- |
| E-1 | staging API が 5xx | `STAGING_API_BASE` を到達不可 URL に差し替え | smoke job が exit 1 / artifact upload / Slack post 1 通 / log に redact 済み summary | Phase 11 failure injection（手動 dispatch + 不正 env override） |
| E-2 | Bearer 期限切れ → 401 | 期限切れ token を staging Environment に投入（test 用） | smoke job が exit 1 / Slack post / 401 を summary.json に記録 / Bearer 値は log に出ない | Phase 11 evidence。本サイクル内は dry-run |
| E-3 | `STAGING_ADMIN_BEARER` 未設定 | Environment secret 削除 | runner が必須 env チェックで exit 2 / artifact に env 名のみ記録（値は記録しない） | T-4 で stub 欠落で再現可能 |
| E-4 | `runtime-attendance-provider.sh` 失敗時に summary.json 未生成 | 引数 fail / 早期 exit | `ci-summary-post.sh` が `summary.json not found` と exit 1。Slack post せず | T-5 fixture |
| E-5 | Slack webhook が 5xx | webhook URL を 404 に差し替え | `ci-summary-post.sh` が exit 2 / job は failure 化（既に failure 状態なので影響軽微） | Phase 11 で webhook URL 差し替え |
| E-6 | `Cookie:` 文字列が response body に混入し evidence に書かれる | API が誤って Set-Cookie response → curl で保存 | `redact.sh` が `[REDACTED]` 化 / grep gate で 0 hit | T-1 fixture |
| E-7 | base64 化 cookie が leak | curl 出力に `Cookie: <base64>` を含む | redact.sh が hit、F-4 fixture が PASS | T-1 fixture F-4 |
| E-8 | `set -x` が PR で再導入 | 誰かが debug 用 `set -x` を追加 | grep gate T-3 が CI で fail（PR が block） | Phase 9 で `verify-no-debug-trace` gate に追加 |
| E-9 | reusable workflow call drift | `backend-ci.yml` から `runtime-smoke-staging.yml` への `uses:` が壊れる | API deploy 後に smoke が走らない | actionlint + grep gate |
| E-10 | smoke 複数並列発火 | deploy 連打 | concurrency `cancel-in-progress: false` で queue され順次実行 | timeout-minutes 10 内に完了 |
| E-11 | Environment secret が production と混線 | 設定ミス | smoke が production API に当たる前に host allowlist / staging env marker / token audience check で fail | G1 setup runbook で name 検証 + `STAGING_API_BASE` host allowlist + `/health` 等の staging marker check |
| E-12 | artifact に PII（attendance 配列内の氏名）が含まれる | response body を artifact に保存 | runtime-attendance-provider.sh は body を保存せず summary（status / count）のみ → PII 0 件 | T-1 fixture / Phase 11 grep |

## 検証コマンド

### E-1, E-2 dry-run（local では到達不可 stub）

```bash
test_dir=$(mktemp -d)
STAGING_API_BASE=http://127.0.0.1:1 \
STAGING_ADMIN_BEARER=stub \
STAGING_MEMBER_ID=stub \
STAGING_ME_BEARER=stub \
  bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir "$test_dir" --ci-summary || echo "expected failure"

test -f "$test_dir/summary.json"
jq -e '.status == "FAIL"' "$test_dir/summary.json"
```

### E-3 必須 env 欠落

```bash
test_dir=$(mktemp -d)
unset STAGING_ADMIN_BEARER
STAGING_API_BASE=http://127.0.0.1:1 \
STAGING_MEMBER_ID=stub \
STAGING_ME_BEARER=stub \
  bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir "$test_dir" 2>&1 | grep -q "STAGING_ADMIN_BEARER"
```

### E-6, E-7 redaction grep gate

```bash
echo "Cookie: c2Vzc2lvbj0xMjM0NTY3ODkw" | bash scripts/smoke/redact.sh > /tmp/redacted.log
! grep -E "c2Vzc2lvbj=|session=1234567890|c2Vzc2lvbj0xMjM0" /tmp/redacted.log
grep -q "REDACTED" /tmp/redacted.log
```

### E-8 `set -x` 再発防止

```bash
! grep -rEn 'set -x|bash -x|set -o xtrace' scripts/smoke/ .github/workflows/runtime-smoke-staging.yml
```

### E-11 secret name leak

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort | tee /tmp/env-secret-names.txt
# 期待: STAGING_API_BASE / STAGING_ADMIN_BEARER / STAGING_MEMBER_ID / STAGING_ME_BEARER / SLACK_WEBHOOK_INCIDENT のみ
```

Name check は値の混線を検出できないため、Phase 11 実走前に値を出さずに以下も確認する:

```bash
# host allowlist: 値は出力せず判定結果だけを残す
case "${STAGING_API_BASE:?}" in
  *staging*|*dev*) echo "PASS: staging host marker present" ;;
  *) echo "FAIL: STAGING_API_BASE host marker is not staging/dev" >&2; exit 1 ;;
esac

# runtime marker: response body は保存せず status / expected marker だけを残す
curl -fsS "${STAGING_API_BASE%/}/health" | jq -e '.environment == "staging" or .env == "staging"' >/dev/null
echo "PASS: runtime environment marker is staging"
```

## 完了条件（DoD）

- [ ] E-1〜E-12 全シナリオに期待動作と検証手段が紐付け
- [ ] redaction 偽陰性（E-7）が T-1 fixture で常時保証
- [ ] `set -x` 再発（E-8）が grep gate で常時保証
- [ ] Environment secret 混線（E-11）が secret name check + host allowlist + staging marker check で常時保証
- [ ] PII leak（E-12）が summary-only 設計で構造的に防止
