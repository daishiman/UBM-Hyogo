# Phase 4: テスト戦略 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 / 13 |
| 入力 | Phase 2 設計 / Phase 3 残課題 R-1（redaction 偽陰性） |
| 出力 | `outputs/phase-04/main.md`（テストファイル一覧 / fixture / assertion / 実行コマンド） |

## 目的

CI 統合に固有の **non-runtime テスト**（shell script の単体動作 / redaction filter 偽陰性 / workflow YAML lint / `set -x` 禁止 grep gate）を確定し、Phase 5 実装時に追加すべきテストファイルを列挙する。

## テスト範囲

### T-1. `scripts/smoke/__tests__/redact.test.sh`（新設）

#### 目的
`scripts/smoke/redact.sh` が以下を確実に redact することを assert:
- `Cookie: <value>` の `<value>`
- `authorization: Bearer <token>` の `<token>`
- `cf-*` 系 token

加えて **base64 化 cookie 値の偽陰性**を検出:
- input: `Cookie: c2Vzc2lvbj0xMjM0NTY3ODkw` (= `session=1234567890` の base64)
- expected: redact 後に `c2Vzc2lvbj0xMjM0NTY3ODkw` も `1234567890` も含まれない

#### fixture

| ID | 入力（stdin） | 期待出力 |
| --- | --- | --- |
| F-1 | `Cookie: session=abcdef123` | `Cookie: [REDACTED]` |
| F-2 | `authorization: Bearer sample-token` | `authorization: [REDACTED]` |
| F-3 | `cf-access-jwt-assertion: token123` | `cf-access-jwt-assertion: [REDACTED]` |
| F-4 | `Cookie: c2Vzc2lvbj0xMjM0NTY3ODkw` | `Cookie: [REDACTED]` (元 base64 文字列・base64 decode 後文字列いずれも含まない) |
| F-5 | `status=200` (機微情報なし) | `status=200`（変更なし） |

#### 実行
```bash
bash scripts/smoke/__tests__/redact.test.sh
# 期待: 全 fixture PASS、exit 0
```

### T-2. workflow YAML lint

`.github/workflows/runtime-smoke-staging.yml` を `actionlint` で検証:
```bash
docker run --rm -v "$(pwd)":/repo rhysd/actionlint:latest -color .github/workflows/runtime-smoke-staging.yml
# 期待: 0 issue
```

`actionlint` をローカルに入れる場合は `mise exec -- pnpm dlx @rhysd/actionlint`（または brew）。本サイクルでは Phase 11 evidence で実行ログを取得。

### T-3. `set -x` / `bash -x` 禁止 grep gate

```bash
! grep -rEn 'set -x|bash -x|set -o xtrace' \
    scripts/smoke/ \
    .github/workflows/runtime-smoke-staging.yml
# 期待: 0 hit (exit 1 を ! で反転して PASS)
```

### T-4. `runtime-attendance-provider.sh --out-dir` 単体動作

CI 環境 mock（環境変数 stub + 401 を返す local server）で `--out-dir /tmp/test-out` 指定時に出力ファイルが指定 dir に生成されることを assert。実 staging への curl は行わず、`STAGING_API_BASE=http://127.0.0.1:0` 等で意図的に fail させ、failure 時の出力契約（`runtime-smoke.log` / `summary.json`）が満たされることを確認。

```bash
# 仕様: --out-dir 省略時は既存 path、指定時は dir を作成して書き込む
test_dir=$(mktemp -d)
STAGING_API_BASE=http://127.0.0.1:1 \
STAGING_ADMIN_BEARER=stub \
STAGING_MEMBER_ID=stub \
STAGING_ME_BEARER=stub \
  bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir "$test_dir" || true
test -f "$test_dir/runtime-smoke.log"
test -f "$test_dir/summary.json"
```

### T-5. `ci-summary-post.sh` dry-run

`SLACK_WEBHOOK_INCIDENT` 未設定時は post せず stdout に redact 済み message を出すこと:
```bash
unset SLACK_WEBHOOK_INCIDENT
echo '{"status":"FAIL","route":"/admin/members","http":500,"count":0}' > /tmp/summary.json
bash scripts/smoke/ci-summary-post.sh /tmp/ --dry-run
# 期待: stdout に redact 済み summary、Slack post 0 通
```

### T-6. 既存 unit test PASS（regression check）

issue-371 / issue-531 で確立した既存 unit:
```bash
mise exec -- pnpm exec vitest run \
  apps/api/src/middleware/__tests__/repository-providers.test.ts \
  apps/api/src/repository/__tests__/builder.test.ts
# 期待: 全 PASS（attendanceProvider not bound to context throw assert を含む）
```

## テストファイル inventory

| 種別 | パス | 用途 |
| --- | --- | --- |
| 新規 | `scripts/smoke/__tests__/redact.test.sh` | redaction 偽陰性 fixture |
| 新規 | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | `--out-dir` / `--ci-summary` option 単体 |
| 新規 | `scripts/smoke/__tests__/ci-summary-post.test.sh` | `--dry-run` 時の post 抑制 |
| 既存 | `apps/api/src/repository/__tests__/builder.test.ts` | regression（編集なし） |
| 既存 | `apps/api/src/middleware/__tests__/repository-providers.test.ts` | regression（編集なし） |

## 検証コマンド

```bash
SPEC_DIR=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration
grep -q "T-1\|T-6" "$SPEC_DIR/outputs/phase-04/main.md"
grep -q "redact.test.sh\|actionlint\|set -x" "$SPEC_DIR/outputs/phase-04/main.md"
grep -q "base64" "$SPEC_DIR/outputs/phase-04/main.md"
```

## 完了条件（DoD）

- [ ] T-1〜T-6 のテスト範囲 / fixture / 実行コマンドが確定
- [ ] redaction 偽陰性（base64）の fixture が F-4 として明示
- [ ] workflow YAML lint（actionlint）の実行コマンドが確定
- [ ] `set -x` 禁止 grep gate のコマンドが確定
- [ ] テストファイル inventory 5 件（新規 3 / 既存 regression 2）
