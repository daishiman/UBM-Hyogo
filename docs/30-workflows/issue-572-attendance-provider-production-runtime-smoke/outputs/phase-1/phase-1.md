# Phase 1: 要件定義 / production smoke の不可侵条件確定 / GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流依存 | issue-371 (CLOSED) / issue-531 (CLOSED) / issue-571 (CLOSED) |

## 目的

production runtime smoke の **不可侵条件 5 件** と **DI-bound evidence の summary-only 仕様** を Phase 1 の SSOT として確定する。これらは後続 Phase（特に Phase 3 設計 / Phase 7 実装 / Phase 11 runtime evidence 取得）で必ず参照される base constraint であり、Phase 1 で固定された後は変更しない。Phase 2（スコープ確定）着手の GO/NO-GO を判定する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-1

# 1) gh CLI が認証済（Phase 13 で PR 作成主体）
gh auth status \
  | tee outputs/phase-1/gh-auth-status.log

# 2) 親 Issue #572 / 上位 Issue が CLOSED であること
gh issue view 572 --json state,title \
  | tee outputs/phase-1/issue-572-state.json
gh issue view 531 --json state,title \
  | tee outputs/phase-1/issue-531-state.json
gh issue view 371 --json state,title \
  | tee outputs/phase-1/issue-371-state.json
gh issue view 571 --json state,title \
  | tee outputs/phase-1/issue-571-state.json

# 3) 既存 staging smoke スクリプトディレクトリの存在確認
test -d apps/api/scripts/runtime-smoke/ \
  && echo "OK: runtime-smoke dir present" \
  | tee outputs/phase-1/runtime-smoke-dir.log

# 4) wrangler.toml の [env.production] / [env.staging] 存在確認
grep -n '^\[env\.production\]' apps/api/wrangler.toml \
  | tee outputs/phase-1/wrangler-env-production.log
grep -n '^\[env\.staging\]' apps/api/wrangler.toml \
  | tee outputs/phase-1/wrangler-env-staging.log

# 5) Cloudflare 認証（scripts/cf.sh 経由のみ・wrangler 直叩き禁止）
bash scripts/cf.sh whoami 2>&1 \
  | tee outputs/phase-1/cf-whoami.log

# 6) Node 24 / pnpm 10 解決
mise exec -- node -v \
  | tee outputs/phase-1/node-version.log
```

期待:

- `gh auth status` が `Logged in to github.com` を含む
- Issue #572 / #531 / #371 / #571 すべて `state: CLOSED`
- `apps/api/scripts/runtime-smoke/` ディレクトリが存在
- `apps/api/wrangler.toml` に `[env.production]` / `[env.staging]` セクションが存在
- `scripts/cf.sh whoami` が成功
- `node -v` が `v24.15.0`

## 不可侵条件（SSOT・5 件）

Phase 1 で確定した以下 5 件は Phase 2-13 を通じて変更しない base constraint。

| ID | 条件 | 根拠 | gate 実装先 |
| --- | --- | --- | --- |
| INV-1 | **evidence summary-only**: production response body の実値を evidence ファイルに保存しない。`type` / `length` / `keys_count` 等の summary metric のみ記録 | session cookie / Bearer / OAuth secret / email / fullName / profile body 実値の漏洩防止 | Phase 3 jq filter / Phase 10 redact 0-hit test |
| INV-2 | **shell 履歴非保持**: production session cookie / Bearer token を引数や `export` で渡さない。`read -s` で stdin から受け取り、curl 直後 `unset` + `trap` で揮発化 | `~/.zsh_history` / `~/.bash_history` への漏洩防止 | Phase 3 session 注入設計 / Phase 8 runbook 手順 |
| INV-3 | **API URL 取り違え検出**: `PRODUCTION_API_URL` 値が production domain pattern にマッチし、かつ `STAGING_API_URL` と等しくないことを smoke 実行前 guard で検証。失敗時 `exit 1` | env 名類似による誤環境叩き事故防止 | Phase 3 `api-url-guard.sh` 設計 / Phase 6 実装 |
| INV-4 | **redact filter production 拡張**: staging filter のみでは検出できない production 固有 pattern（`cf-ray`, `__Secure-*` cookie, OAuth callback token, magic link token, email local part, fullName）を全て placeholder 化 | production 固有値の偽陰性防止 | Phase 3 redact filter 設計 / Phase 5 実装 / Phase 10 0-hit test |
| INV-5 | **user 明示承認 gate**: production smoke 実行前に user の明示承認（承認 timestamp / 承認者 identifier）を runbook チェックリストおよび commit message に記録。承認なしで Phase 11 へ進めない | production 環境への意図しない読み取り実行防止 | Phase 8 runbook / Phase 11 evidence ファイル / Phase 13 commit message |

## DI-bound evidence 仕様（summary-only）

issue-371 で実装された attendanceProvider middleware DI 経路が production runtime で正しく結線されていることを示す **2 種の summary metric** のみを記録する。

| Endpoint | jq filter（抽出のみ・保存値） | 期待値 |
| --- | --- | --- |
| `GET /admin/members/:memberId` | `{endpoint:"/admin/members/:memberId", attendance_type: (.attendance \| type), attendance_length: (.attendance \| length? // null)}` | `attendance_type == "array"` |
| `GET /me/profile` | `{endpoint:"/me/profile", attendance_type: (.profile.attendance \| type), attendance_length: (.profile.attendance \| length? // null)}` | `attendance_type == "array"` |
| `GET /admin/members` | `{endpoint:"/admin/members", status:<http>, top_keys_count: (keys \| length)}` | `status == 200`、`top_keys_count > 0` |
| `GET /me/attendance` | `{endpoint:"/me/attendance", status:<http>, response_type: (. \| type)}` | `status == 200`、`response_type == "array"` または `"object"` |

**禁止事項**: 上記 jq filter で抽出される field 以外の値（個別 member name / email / attendance entry 内容など）を evidence ファイルに書き出してはならない。jq filter は redact filter 通過後の stream に対してのみ適用する。

## 含む / 含まない（不可侵スコープ）

### 含む（Phase 1 で確定）

- production read-only GET smoke（4 endpoint）
- redact filter の production 固有値拡張
- API URL 取り違え guard
- session 注入の shell 履歴非保持化
- DI-bound evidence summary-only 記録
- user 明示承認 gate
- 親タスク（issue-371）state 更新 commit を本 PR に含める

### 含まない（Phase 1 で禁止スコープとして固定）

- production write 系 smoke（POST / PATCH / DELETE 一切不可）
- 新規 endpoint 追加 / 既存 endpoint 仕様変更
- D1 schema 変更 / migration 追加
- production session cookie / OAuth secret の commit / persist
- monitoring ダッシュボード / アラート整備
- staging smoke の再実行（issue-531 / issue-571 で完了済み）
- Issue #572 / #371 / #531 / #571 の state 変更（既に CLOSED）

## 上流依存テーブル

| 依存 | 状態 | 確認方法 |
| --- | --- | --- |
| issue-371 (attendanceProvider DI 移行) | CLOSED | `gh issue view 371 --json state` |
| issue-531 (staging 完了) | CLOSED | `gh issue view 531 --json state` |
| issue-571 (staging CI 自動実行) | CLOSED | `gh issue view 571 --json state` |
| 既存 staging smoke スクリプト | 存在 | `test -d apps/api/scripts/runtime-smoke/` |
| `apps/api/wrangler.toml` `[env.production]` | 存在 | `grep '^\[env\.production\]' apps/api/wrangler.toml` |
| `scripts/cf.sh` ラッパー | 利用可能 | `bash scripts/cf.sh whoami` |

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | 不可侵条件 5 件（INV-1〜INV-5）が SSOT として確定 | spec grep |
| AC-2 | DI-bound evidence の summary-only 仕様（4 endpoint × jq filter）が確定 | spec grep |
| AC-3 | 禁止スコープ（write 系 / 新規 endpoint / schema 変更 / state 変更）が明文化 | spec grep |
| AC-4 | 上流依存（issue-371/531/571 CLOSED）の確認手順が固定 | Step 0 P50 ログ |
| AC-5 | Phase 2 着手 GO/NO-GO 判定基準が記載 | spec grep |

## GO/NO-GO 判定（Phase 2 着手）

- **GO 条件**: AC-1〜AC-5 が全て満たされ、Step 0 P50 チェック 6 項目が全て期待値を返した
- **NO-GO 条件**: 上流 Issue が CLOSED でない / staging smoke スクリプトが見つからない / `wrangler.toml` に `[env.production]` が無い / `scripts/cf.sh whoami` 失敗 / Node 24 解決不能 のいずれか
- **NO-GO 時アクション**: Phase 1 を再実行し、本タスクを `spec_blocked` 状態にして user に通知。特に上流 Issue が CLOSED でない場合は本タスクの前提が崩れているため即時 stop

## 想定変更ファイル一覧（Phase 1 段階）

Phase 1 では実装変更は行わず、本仕様書および P50 ログのみが成果物となる。

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `outputs/phase-1/phase-1.md` | 新規 | 本ファイル / SSOT 確定書 |
| `outputs/phase-1/*.log` / `*.json` | 新規 | P50 チェック結果 |

## テスト方針 / ローカル検証コマンド / DoD

### テスト方針

Phase 1 は仕様確定 phase のため code test は実施しない。代わりに以下の確認を行う。

```bash
# 不可侵条件 5 件が spec に記述されていること
grep -c '^| INV-[1-5] ' outputs/phase-1/phase-1.md   # 期待: 5

# AC が 5 件記述されていること
grep -c '^| AC-[1-5] ' outputs/phase-1/phase-1.md    # 期待: 5

# 上流 Issue が CLOSED であること
jq -r '.state' outputs/phase-1/issue-572-state.json  # 期待: CLOSED
jq -r '.state' outputs/phase-1/issue-371-state.json  # 期待: CLOSED
jq -r '.state' outputs/phase-1/issue-531-state.json  # 期待: CLOSED
jq -r '.state' outputs/phase-1/issue-571-state.json  # 期待: CLOSED
```

### DoD

- [ ] 不可侵条件 5 件 / DI-bound evidence 仕様 / 含む含まない / 上流依存 / AC が本ドキュメントに固定
- [ ] Step 0 P50 チェック 6 項目が PASS
- [ ] 上流 Issue 4 件（#572 / #371 / #531 / #571）が CLOSED であること確認済み
- [ ] Phase 2 着手 GO 判定が記録

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル / SSOT 確定書）
- `outputs/phase-1/gh-auth-status.log`
- `outputs/phase-1/issue-572-state.json` / `issue-531-state.json` / `issue-371-state.json` / `issue-571-state.json`
- `outputs/phase-1/runtime-smoke-dir.log`
- `outputs/phase-1/wrangler-env-production.log` / `wrangler-env-staging.log`
- `outputs/phase-1/cf-whoami.log`
- `outputs/phase-1/node-version.log`
