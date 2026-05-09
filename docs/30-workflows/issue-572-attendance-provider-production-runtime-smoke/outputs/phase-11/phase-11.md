# Phase 11: 手動テスト / production runtime smoke evidence（NON_VISUAL）

> **CONST_004 / CONST_005 準拠の実装仕様書**。本ファイルは production runtime smoke 取得手順、evidence canonical path、親 Issue #371 昇格 PR 作成手順、user 明示承認 evidence キャプチャ方法を確定する。コード実装は行わない（手順記述は必須）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec 段階: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / production smoke 完遂後: `PASS_RUNTIME_VERIFIED` |
| visualEvidence | NON_VISUAL |
| 状態語彙ルール | `PASS` 単独表記禁止。spec 段階では `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `blocked_runtime_evidence_pending` を維持し、production smoke 完遂後にのみ `PASS_RUNTIME_VERIFIED` を使用する |
| 親 Issue | #572（CLOSED） |
| 関連 Issue | #531（CLOSED） / #371（CLOSED → `PASS_RUNTIME_VERIFIED` 昇格対象） / #571（CLOSED） |
| taskType | implementation |

## 目的

production 環境で `/admin/members*` および `/me*` の **read-only GET smoke** を PASS させ、issue-371（attendanceProvider DI 完了化）を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` / `completed` に昇格する。本タスクの DI-bound evidence は `.attendance | type == "array"` を `/admin/members/:memberId` と `/me/profile` の双方で確認すること。

evidence は **summary-only** で構成し、以下の実値は出力に含めない:

- session cookie / Bearer token
- `cf-*` token / OAuth secret
- `email` / `fullName` の実値（マスキング or 件数のみ）
- D1 binding 値の実値（binding 名のみ）

## ⚠️ user gate（必須）

production 環境への GET smoke および親 Issue #371 昇格 PR 作成は、**user が production runtime smoke 実行を明示承認するまで** `blocked_runtime_evidence_pending` を維持する。承認解除前は spec のみ整備し、`PASS` 単独表記を使用しない（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持）。

G1-G4 multi-stage approval gate のうち、本 Phase は **G3** に該当する。

## 環境制約

- production 環境 (`apps/api/wrangler.toml` `[env.production]`) が deploy 済
- `bash scripts/cf.sh whoami` が成功
- production 環境の `/admin/members*` / `/me*` を呼ぶための短期 admin / 一般会員 session が取得可能
- read-only GET のみ。POST / PUT / DELETE は本 Phase で実行しない
- testing アカウント:
  - admin: `manjumoto.daishi@senpai-lab.com`
  - member: `manju.manju.03.28@gmail.com`

## NON_VISUAL evidence canonical path

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck` 実行結果 |
| 2 | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint` 実行結果 |
| 3 | `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm --filter @ubm-hyogo/api test --run` 実行結果（attendanceProvider 関連） |
| 4 | `outputs/phase-11/evidence/build.log` | `mise exec -- pnpm --filter @ubm-hyogo/api build` 実行結果 |
| 5 | `outputs/phase-11/evidence/grep-gate.log` | redact 済 evidence に対する禁則 grep 結果（0 hit を期待） |
| 6 | `outputs/phase-11/production-smoke-summary.md` | production GET smoke の summary（`.attendance` type 検証 / status code / 件数 / DI-bound 確認） |
| 7 | `outputs/phase-11/redact-filter-zero-hit.log` | cookie / Bearer / cf-* / OAuth secret / email / fullName 実値の grep gate ログ（0 hit） |
| 8 | `outputs/phase-11/wrangler-binding-diff.md` | staging vs production の D1 / KV / vars binding diff（binding 名のみ） |
| 9 | `outputs/phase-11/user-approval-evidence.md` | user 明示承認の summary-only キャプチャ |

## 取得手順

### 0) lint / typecheck / test / build evidence（user gate 不要 / 副作用なし）

```bash
mkdir -p outputs/phase-11/evidence

mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/api test --run 2>&1 | tee outputs/phase-11/evidence/test.log
mise exec -- pnpm --filter @ubm-hyogo/api build 2>&1 | tee outputs/phase-11/evidence/build.log
```

期待: 4 コマンドすべて exit 0。

### 1) ⚠️ user gate（必須）: 以降は user 明示承認後にのみ実行

### 2) wrangler binding diff

```bash
bash scripts/cf.sh whoami | tee -a outputs/phase-11/wrangler-binding-diff.md

# binding 名のみ（値は出力しない）
grep -E "^\[\[?(d1_databases|kv_namespaces|r2_buckets|vars)" \
  apps/api/wrangler.toml \
  | tee -a outputs/phase-11/wrangler-binding-diff.md
```

`wrangler-binding-diff.md` には binding 名 / `binding =` / `database_name` のみ転記し、`database_id` 等の実値は転記しない。

### 3) production GET smoke（read-only）

DI-bound evidence: `.attendance | type == "array"` を双方で確認する。

```bash
# 短期 session を取得（手順は production-smoke-summary.md に summary-only で記録）
# COOKIE 値や Bearer 値は環境変数として揮発的に保持し、ログ・ファイル化しない

# /admin/members 一覧
curl -sS -X GET "https://<production-host>/api/admin/members?limit=5" \
  -H "Cookie: $ADMIN_SESSION_COOKIE" \
  -o /tmp/admin-members.json
jq '{
  status_ok: (.items | type == "array"),
  count: (.items | length)
}' /tmp/admin-members.json

# /admin/members/:memberId — DI-bound: .attendance == array
MEMBER_ID="<one-id-from-list>"
curl -sS -X GET "https://<production-host>/api/admin/members/$MEMBER_ID" \
  -H "Cookie: $ADMIN_SESSION_COOKIE" \
  -o /tmp/admin-member-detail.json
jq '{
  attendance_is_array: (.attendance | type == "array"),
  attendance_count: (.attendance | length)
}' /tmp/admin-member-detail.json

# /me/profile — DI-bound: .attendance == array
curl -sS -X GET "https://<production-host>/api/me/profile" \
  -H "Cookie: $MEMBER_SESSION_COOKIE" \
  -o /tmp/me-profile.json
jq '{
  attendance_is_array: (.profile.attendance | type == "array"),
  attendance_count: (.profile.attendance | length)
}' /tmp/me-profile.json
```

`/tmp/*.json` の **生レスポンスは保存しない**。`production-smoke-summary.md` には以下のみ転記する:

- 各 endpoint の HTTP status（200 のみ確認）
- `.attendance | type == "array"` true/false
- `.attendance | length` の数値
- 取得時刻（UTC）
- DI-bound 確認結果

### 4) redact filter zero-hit grep

```bash
PATTERNS='(Bearer [A-Za-z0-9._-]+|sessionId=|__Secure-|cf-[A-Za-z0-9-]+|@gmail\.com|@senpai-lab\.com|fullName"\s*:\s*"[^"]+")'

if grep -E -q -r --include="*.md" --include="*.log" "$PATTERNS" outputs/phase-11/; then
  printf 'grep_exit=0\nsensitive_pattern_hit=true\n' > outputs/phase-11/redact-filter-zero-hit.log
  exit 1
fi
printf 'grep_exit=1\n0 hit\n' > outputs/phase-11/redact-filter-zero-hit.log
```

期待: `grep_exit=1`（hit 0 件）。1 件でも hit したら **redact 漏れ** として spec 段階に差し戻し、`production-smoke-summary.md` から該当行を削除して再実行する。

### 5) 親 Issue #371 昇格 PR 作成

production smoke が PASS したら、親 Issue #371 を `PASS_RUNTIME_VERIFIED` / `completed` に昇格する commit を作成する。

```bash
# 親タスク state 更新対象（例 / 実体は repo の state file に依存）
# - .claude/skills/aiworkflow-requirements/references/task-workflow.md の issue-371 entry
# - docs/30-workflows/issue-371-*/ 配下の state ファイル

git add .claude/skills/aiworkflow-requirements/references/task-workflow.md \
        docs/30-workflows/issue-371-*/
git commit -m "$(cat <<'EOF'
docs(issue-371): promote attendanceProvider DI completion to PASS_RUNTIME_VERIFIED

production GET smoke PASS for /admin/members/:memberId and /me/profile.
DI-bound evidence: .attendance | type == "array" confirmed on both endpoints.
Redact filter zero-hit verified.

Refs: #371
Refs: #572

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# commit hash を summary に記録
git rev-parse HEAD >> outputs/phase-11/production-smoke-summary.md
```

`production-smoke-summary.md` には commit hash と「issue-371 を `PASS_RUNTIME_VERIFIED` / `completed` に昇格」の文言を必ず含める。

### 6) user 明示承認 evidence のキャプチャ

user の明示承認（"production smoke を実行してよい" / "Phase 13 を実行してよい" 等）を summary-only で `user-approval-evidence.md` に記録する:

```markdown
# User Approval Evidence (summary-only)

| 項目 | 値 |
| --- | --- |
| 承認日時 (UTC) | 2026-05-08T<HH:MM:SS>Z |
| 承認内容 | production runtime smoke 実行 / issue-371 昇格 PR 作成 / Phase 13 PR 作成 |
| 承認者 | user (project owner) |
| 媒体 | Claude Code CLI session |
| 承認文言 (summary) | "<user の承認発言を要約 / 実値の email 等は含めない>" |
```

メールアドレス・実名・session ID 等の実値は転記しない。

## 期待結果

| ファイル | 期待 |
| --- | --- |
| `evidence/typecheck.log` | exit 0 |
| `evidence/lint.log` | exit 0 |
| `evidence/test.log` | exit 0（attendanceProvider 関連 test PASS） |
| `evidence/build.log` | exit 0 |
| `evidence/grep-gate.log` | 禁則パターン 0 hit |
| `production-smoke-summary.md` | `/admin/members/:memberId` と `/me/profile` で `.attendance | type == "array"` true / HTTP 200 / commit hash 記載 |
| `redact-filter-zero-hit.log` | `grep_exit=1`（0 hit） |
| `wrangler-binding-diff.md` | binding 名のみ転記 / 実値なし |
| `user-approval-evidence.md` | summary-only / 実値なし |

## DoD

- [ ] 9 evidence ファイルが実体配置（user gate 解除後に取得）
- [ ] `/admin/members/:memberId` と `/me/profile` で `.attendance | type == "array"` を確認
- [ ] `redact-filter-zero-hit.log` が 0 hit
- [ ] 親 Issue #371 を `PASS_RUNTIME_VERIFIED` / `completed` に昇格する commit が作成済
- [ ] user 明示承認 evidence が summary-only でキャプチャ済
- [ ] `PASS` 単独表記が outputs 配下に存在しない（grep 確認）

## 状態遷移

- spec 作成完了時: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `blocked_runtime_evidence_pending`
- user 承認 + production smoke evidence 取得完了時: `PASS_RUNTIME_VERIFIED`
- 親 Issue #371 昇格 commit 作成完了時: `completed`

## G1-G4 multi-stage approval gate との関係

| Gate | 条件 | 本 Phase での扱い |
| --- | --- | --- |
| G1 | typecheck / lint / test / build PASS | 本 Phase 0) で取得 |
| G2 | grep-gate redact zero-hit | 本 Phase 4) で取得 |
| G3 | production smoke evidence + 親 Issue #371 昇格 commit | **本 Phase の主目的（5）** |
| G4 | user 明示承認 | 本 Phase 6) でキャプチャ → Phase 13 で再確認 |

## 成果物

- `outputs/phase-11/phase-11.md`（本ファイル）
- 上記 9 evidence ファイル群（user gate 解除後に取得）

## 次 Phase の前提条件

9 evidence ファイルが実体配置されていること。`production-smoke-summary.md` の commit hash と昇格文言を Phase 12 implementation guide / system-spec-update-summary に反映する。
