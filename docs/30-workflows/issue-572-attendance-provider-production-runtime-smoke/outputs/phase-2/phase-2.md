# Phase 2: スコープ確定 / wrangler.toml binding 差分整理 / endpoint surface 固定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流 | Phase 1（不可侵条件確定済み） |

## 目的

- `apps/api/wrangler.toml` の `[env.production]` と `[env.staging]` の binding 差分を grep ベースで整理し、production smoke が参照すべき binding 名を確定する
- production smoke 対象 endpoint surface 4 種を `apps/api/src/routes/` の現行実装と照合して固定する
- 親タスク（issue-371）の state 更新対象ファイルパスを特定し、本 PR で更新する範囲を確定する
- 含む / 含まないを Phase 1 の不可侵条件と整合させて最終固定する

## Step 0: 入口チェック

```bash
mkdir -p outputs/phase-2

# Phase 1 完了確認
test -f outputs/phase-1/phase-1.md && echo "OK: phase-1 spec present"

# 必要ツール
command -v jq && command -v grep && command -v rg
```

## wrangler.toml binding 差分整理

### 取得手順

```bash
# [env.production] / [env.staging] セクションを行範囲で取得
grep -n '^\[env\.' apps/api/wrangler.toml \
  | tee outputs/phase-2/wrangler-env-sections.log

# 各セクションの binding 行を抽出
awk '/^\[env\.production\]/,/^\[env\.[a-z]+\]/' apps/api/wrangler.toml \
  | tee outputs/phase-2/wrangler-env-production-section.log
awk '/^\[env\.staging\]/,/^\[env\.[a-z]+\]/' apps/api/wrangler.toml \
  | tee outputs/phase-2/wrangler-env-staging-section.log
```

### binding 差分表（Phase 2 で埋める）

| 種別 | staging binding 名 | production binding 名 | 差分注記 | smoke 利用 |
| --- | --- | --- | --- | --- |
| D1 database | （Phase 2 grep 結果で確定） | （Phase 2 grep 結果で確定） | 命名差異の有無 | 直接利用しない（read-only GET smoke は Worker 経由） |
| KV namespace | （同上） | （同上） | 命名差異の有無 | 直接利用しない |
| R2 bucket | （同上） | （同上） | 命名差異の有無 | 直接利用しない |
| vars | API_BASE_URL 等 | 同左 | URL 差分 | smoke スクリプトは `PRODUCTION_API_URL` env 経由でのみ読み取る |
| secrets | session secret 等 | 同左 | smoke は読み取らない | 直接利用しない（user 入力経由のみ） |

> **重要**: production smoke は wrangler binding に**直接アクセスしない**。Worker 経由の HTTP GET のみで evidence を取得する。binding 差分整理は「smoke 失敗時に production 側の設定不備が疑われる場合の調査ガイド」として記録するのみ。

## Endpoint surface 固定（4 種）

`apps/api/src/routes/` の現行 route 定義を grep して以下 4 種が存在することを確認する。

```bash
# admin members
rg -n 'app\.(get|route)\(.*"/admin/members"' apps/api/src/ \
  | tee outputs/phase-2/route-admin-members.log
rg -n 'app\.(get|route)\(.*"/admin/members/:' apps/api/src/ \
  | tee outputs/phase-2/route-admin-members-id.log

# me profile / attendance
rg -n 'app\.(get|route)\(.*"/me/profile"' apps/api/src/ \
  | tee outputs/phase-2/route-me-profile.log
rg -n 'app\.(get|route)\(.*"/me/attendance"' apps/api/src/ \
  | tee outputs/phase-2/route-me-attendance.log
```

| Endpoint | HTTP | 用途 | DI-bound assertion |
| --- | --- | --- | --- |
| `/admin/members` | GET | 管理画面 member 一覧 | `top_keys_count > 0` のみ（list shape は変動しうるため最小 assert） |
| `/admin/members/:memberId` | GET | 管理画面 member 詳細 | `.attendance \| type == "array"`（DI 経路 core） |
| `/me/profile` | GET | 会員マイページ | `.profile.attendance \| type == "array"`（DI 経路 core） |
| `/me/attendance` | GET | 会員 attendance 一覧 | `(.\| type) in ("array","object")` |

> route 定義が見つからない endpoint があれば Phase 2 段階で abort し、Phase 1 NO-GO へ rollback する。

## 親タスク（issue-371）state 更新対象パスの特定

```bash
# issue-371 spec ディレクトリを探す
find docs/30-workflows -maxdepth 1 -type d -name '*issue-371*' \
  | tee outputs/phase-2/issue-371-spec-dir.log

# state 記述箇所を探す（artifacts.json / index.md / state.json 等の candidate）
fd -t f 'artifacts\.json|state\.json|index\.md' "$(head -1 outputs/phase-2/issue-371-spec-dir.log)" \
  | tee outputs/phase-2/issue-371-state-candidates.log

# 'PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' 文字列の含有を確認
rg -n 'PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' \
  "$(head -1 outputs/phase-2/issue-371-spec-dir.log)" \
  | tee outputs/phase-2/issue-371-current-state-grep.log
```

更新対象は `rg` 結果に含まれる **全ファイル**（artifacts.json の metadata field / index.md の状態欄など複数箇所が想定される）。Phase 12 で diff 生成、Phase 13 で commit に含める。

| 候補 | 更新内容 |
| --- | --- |
| `docs/30-workflows/issue-371-.../artifacts.json` | `metadata.runtimeEvidence` / `state` を `PASS_RUNTIME_VERIFIED` / `completed` に書き換え |
| `docs/30-workflows/issue-371-.../index.md` | 状態欄の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を `PASS_RUNTIME_VERIFIED` に書き換え |
| `docs/30-workflows/issue-371-.../outputs/phase-12/implementation-guide.md`（存在時） | runtime verified note 追記 |

## 含む / 含まない（最終固定）

Phase 1 の禁止スコープと整合させて以下を最終固定する。

### 含む

- production GET smoke（4 endpoint）の追加実装
- redact filter production 拡張
- API URL 取り違え guard
- session 注入の shell 履歴非保持化
- DI-bound evidence summary-only 記録
- runbook 整備
- user 明示承認 evidence 記録
- 親タスク（issue-371）state 更新 commit

### 含まない

- write 系 smoke 一切
- 新規 endpoint 追加
- D1 schema 変更
- Issue state 変更（#572 / #371 / #531 / #571 の close/reopen 一切しない。state 更新は **spec ファイルの metadata field** に対してのみ行う）
- monitoring ダッシュボード
- staging 再実行

## 想定変更ファイル一覧（Phase 2 段階）

Phase 2 は仕様確定 phase。実装ファイル変更は Phase 5-8 で行う。本 phase で確定する「想定変更ファイル一覧（タスク全体）」は以下:

| ファイル | 種別 | 確定する Phase | 概要 |
| --- | --- | --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | 新規 | Phase 7 実装 | production GET smoke entrypoint |
| `apps/api/scripts/runtime-smoke/redact-filter-production.sh` | 新規 | Phase 5 実装 | production 固有 redact pattern |
| `apps/api/scripts/runtime-smoke/lib/api-url-guard.sh` | 新規 | Phase 6 実装 | API URL 取り違え guard |
| `apps/api/scripts/runtime-smoke/lib/evidence-summary.sh` | 新規 or 編集 | Phase 6 実装 | jq summary 抽出 helper |
| `apps/api/scripts/runtime-smoke/README.md` | 編集 | Phase 8 | production smoke entry 追記 |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | Phase 8 | runbook 本体 |
| `docs/30-workflows/issue-371-.../artifacts.json` | 編集 | Phase 12 | state 昇格 |
| `docs/30-workflows/issue-371-.../index.md` | 編集 | Phase 12 | state 欄書き換え |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | Phase 9 | Issue #572 workflow inventory 追加 |

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | wrangler.toml binding 差分が grep ログとして取得済 | `outputs/phase-2/wrangler-env-*.log` の存在 |
| AC-2 | endpoint surface 4 種が route 定義と照合済 | `outputs/phase-2/route-*.log` が全て非空 |
| AC-3 | 親タスク state 更新対象ファイルが特定済 | `outputs/phase-2/issue-371-current-state-grep.log` が非空 |
| AC-4 | 含む / 含まないが Phase 1 不可侵条件と整合 | spec grep |
| AC-5 | 想定変更ファイル一覧（タスク全体）が確定 | spec grep |

## GO/NO-GO 判定（Phase 3 着手）

- **GO 条件**: AC-1〜AC-5 全て満たし、4 endpoint の route 定義が確認できる
- **NO-GO 条件**: いずれかの endpoint route が見つからない / issue-371 spec ディレクトリが見つからない / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 文字列が grep でヒットしない
- **NO-GO 時アクション**: Phase 1 へ rollback し、上流前提の再確認

## テスト方針 / ローカル検証コマンド / DoD

### テスト方針

Phase 2 は仕様確定 phase のため code test 不要。grep/rg ベースの存在確認のみ。

### ローカル検証コマンド

```bash
# 4 endpoint route 全部が grep でヒット
for f in route-admin-members route-admin-members-id route-me-profile route-me-attendance; do
  test -s outputs/phase-2/${f}.log || { echo "FAIL: ${f}"; exit 1; }
done
echo "OK: all 4 endpoints present"

# 親タスク state grep
test -s outputs/phase-2/issue-371-current-state-grep.log || { echo "FAIL: issue-371 state grep"; exit 1; }
```

### DoD

- [ ] wrangler binding 差分表 / endpoint surface / 親タスク state 対象 / 含む含まない / 想定変更ファイル一覧が本ドキュメントに記述
- [ ] Step 0 入口チェック PASS
- [ ] AC-1〜AC-5 全て満たす
- [ ] Phase 3 着手 GO 判定記録

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）
- `outputs/phase-2/wrangler-env-sections.log` / `wrangler-env-production-section.log` / `wrangler-env-staging-section.log`
- `outputs/phase-2/route-admin-members.log` / `route-admin-members-id.log` / `route-me-profile.log` / `route-me-attendance.log`
- `outputs/phase-2/issue-371-spec-dir.log` / `issue-371-state-candidates.log` / `issue-371-current-state-grep.log`
