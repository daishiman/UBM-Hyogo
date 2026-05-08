# attendanceProvider production runtime smoke 実行 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-531-production-runtime-smoke-attendance-provider-001 |
| タスク名 | attendanceProvider middleware DI の production runtime smoke 実行と親タスク state 完了化 |
| 分類 | runtime verification / production gate |
| 対象機能 | `apps/api` production Worker への `/admin/members*` および `/me*` read-only GET runtime smoke。DI-bound evidence は `/admin/members/:memberId` と `/me/profile` |
| 優先度 | priority:high |
| 見積もり規模 | scale:small |
| ステータス | unassigned |
| issue_number | #572 |
| 親タスク | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/`（staging のみで close 予定） |
| 親タスク状態 | issue-371 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（staging PASS 後も production 未検証のため `PASS_RUNTIME_VERIFIED` に昇格不可） |
| 発見元 | issue-531 Phase 12 unassigned-task-detection.md（"production smoke" 候補・user-gated by Phase 13） |
| 発見日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL（HTTP response summary / log artifact） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-371 では `attendanceProvider` middleware DI の **silent fallback 廃止 → throw 化**を実装し、issue-531 で staging runtime smoke を整備した。一方 issue-531 のスコープは staging に限定されており、Phase 12 unassigned-task-detection.md は "Production execution is explicitly out of scope and user-gated by Phase 13" として production smoke を deferred としている。production への切替は **user 明示承認**を要する別タスクとして起票する必要がある。

### 1.2 問題点・課題

- staging PASS だけでは middleware 結線が production wrangler env で再現される保証はない（`apps/api/wrangler.toml` の `[env.production]` binding 差異）
- 親タスク `issue-371` の `workflow_state: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は staging PASS では `PASS_RUNTIME_VERIFIED` に昇格できない（環境境界の差を埋めない限り偽 verification）
- production の admin / 一般会員 session を smoke 用に発行する経路が標準化されていない
- production への誤実行（production を staging と取り違え）リスクは issue-531 の「production URL を環境変数に入れない」原則を継続強化する必要がある

### 1.3 放置した場合の影響

- production 切替後、初回 admin / `/me` リクエストで結線漏れ顕在化 → 即 500 → 管理ダッシュボードと会員マイページが同時停止
- silent fallback 廃止の意図（fail-fast 化）が production で初めて検証される設計負債化
- issue-371 の close-out が永続的に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のまま固着

---

## 2. 何を達成するか（What）

### 2.1 目的

production deploy 済み Worker に対し read-only GET smoke を実行し、attendanceProvider middleware が結線されていることを **summary-only evidence** で確認したうえで、親タスク `issue-371` を `PASS_RUNTIME_VERIFIED` / `completed` に遷移させる。

### 2.2 最終ゴール

- production で `/admin/members`, `/admin/members/:memberId`, `/admin/members/:memberId/attendance` が `200` を返し、DI-bound `/admin/members/:memberId` で `attendance` 配列が hydrate されている
- production で `/me/`, `/me/profile`, `/me/attendance` が `200` を返し、DI-bound `/me/profile` で `profile.attendance` 配列が hydrate されている
- evidence は summary-only（status / jq contract / count）で raw body / cookie / token を含まない
- 親タスク `issue-371` の `workflow_state` が `PASS_RUNTIME_VERIFIED` / `completed` に更新される PR が作成される

### 2.3 スコープ

#### 含むもの

- production Worker への `/admin/members*` read-only GET smoke
- production Worker への `/me*` read-only GET smoke
- DI-bound evidence の取得と redact gate の再実行
- 親タスク `issue-371` の workflow_state 更新 PR
- production 用 admin / 一般会員 session の取得手順 runbook 化（既存 SOP に追記）

#### 含まないもの

- production への新規 deploy（既存 deploy を smoke 対象とする。deploy 自体は別経路）
- POST 系 endpoint の実行（read-only に限定。`/me/visibility-request` 等は inventory のみ）
- 新規 endpoint / D1 schema 変更
- production への CI 自動 smoke 化（別未タスク `task-issue-531-ci-runtime-smoke-attendance-provider-001.md` で staging CI 化が先行・production CI 化はそのさらに後段）

### 2.4 成果物

- `docs/30-workflows/<新タスクdir>/outputs/phase-11/evidence/runtime-smoke-production.log`（status / jq contract / count summary）
- `docs/30-workflows/<新タスクdir>/outputs/phase-11/evidence/grep-gate-production.log`（redact 検証 0 hit）
- `docs/30-workflows/runbooks/<production-smoke-runbook>.md`（session 取得 / 実行 / rollback 手順）
- 親タスク `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` の `workflow_state` 更新差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-531 staging smoke が PASS 済み（`PASS_RUNTIME_VERIFIED` を staging スコープで取得）
- `task-issue-531-ci-runtime-smoke-attendance-provider-001.md` の staging CI 統合が PASS している（推奨。手動でも進行可だが推奨）
- production deploy 済み（最新 commit が `apps/api/wrangler.toml [env.production]` で deploy 反映済み）
- production 用 session（admin / 一般会員）の取得手順が user 承認済み
- **user 明示承認**: production smoke 実行のタイミングと session 取得方針を user が approve

### 3.2 実行手順

1. **production deploy 確認**:
   - `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production`
   - 最新 deploy が issue-371 commit を含むことを確認
2. **production session 取得**:
   - admin: 1Password の production admin account から OAuth ログイン → session cookie を export（環境変数経由・ファイル化禁止）
   - 一般会員: テストアカウント `manju.manju.03.28@gmail.com` で magic link ログイン → session cookie を export
3. **read-only smoke 実行**:
   - `STAGING_API_URL` ではなく `PRODUCTION_API_URL` を **smoke コマンドの直前に export**（事前に shell 履歴に残さない）
   - `bash scripts/smoke/runtime-attendance-provider.sh` を production 向け env で起動
4. **redact gate**:
   - `grep -E "Cookie:|Authorization:|Bearer |cf-[a-z-]+:|@.*\\." outputs/phase-11/evidence/runtime-smoke-production.log` が 0 hit
5. **DI-bound contract 検証**:
   - `/admin/members/:memberId` の jq contract: `.attendance | type == "array"`
   - `/me/profile` の jq contract: `.profile.attendance | type == "array"`
6. **failure 時の rollback**:
   - smoke 失敗時は production を即時 rollback（`bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`）
7. **親タスク state 更新**:
   - 全 PASS なら `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` の関連 `workflow_state` を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` / `completed` に更新する PR

### 3.3 受入条件 (AC)

- AC-1: production で `/admin/members`, `/admin/members/:memberId`, `/admin/members/:memberId/attendance` が `200` を返し、DI-bound endpoint で `attendance` 配列が hydrate されている
- AC-2: production で `/me/`, `/me/profile`, `/me/attendance` が `200` を返し、DI-bound endpoint で `profile.attendance` 配列が hydrate されている
- AC-3: evidence log に session cookie / Bearer / `cf-*` token / OAuth secret / email / fullName / profile body 実値が一切含まれない（grep gate 0 hit）
- AC-4: 親タスク `issue-371` の `workflow_state` が `PASS_RUNTIME_VERIFIED` / `completed` に更新される PR が作成される
- AC-5: production rollback 手順が runbook 化され、smoke 失敗時の rollback コマンドと前提が evidence に記録される
- AC-6: production smoke 実行は **user 明示承認後**にのみ実施され、承認 evidence（user 承認のテキスト）が `outputs/phase-13/` に保存される

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/wrangler.toml` の `[env.production]` と `[env.staging]` の binding 差異
- 症状: D1 binding / KV binding / Service binding が staging と production で **微妙に名前が違う**ケースがあり、middleware 結線は同じコードでも実環境で attendanceProvider が undefined になる事故が発生しうる。production smoke 前に `bash scripts/cf.sh d1 list` と `wrangler.toml [env.production]` の binding 名を **手作業で 1 件ずつ突合**する手順を runbook に必ず入れること。
- 対象: production session の取得経路
- 症状: production admin OAuth ログインで取得した session cookie を **shell 履歴 / scrollback / log file** に残さずに環境変数経由で smoke runner に渡すのは難しい。`read -s` で stdin から取得し変数 export する方式を採用し、smoke 完了後 `unset` を必ず実行する。`history -d` での履歴削除は信頼性が低い（zsh 設定差で消えないことがある）ため、最初から履歴に残らない方式を運用ルールとする。
- 対象: production への誤実行
- 症状: `STAGING_API_URL` と `PRODUCTION_API_URL` を同 shell session 内に共存させると、smoke runner の env 解決順次第で **staging の URL が production の token で叩かれる**事故が起こりうる。production smoke は **専用の新規 shell session** で `PRODUCTION_API_URL` のみを export し、smoke 完了で session を即終了するルールを runbook に明記する。
- 対象: redact gate の偽陰性（production 環境固有値）
- 症状: production の `cf-ray` ヘッダや `set-cookie: __Secure-*` 等、staging には現れない token shape が evidence log に混入しうる。redact filter は staging で出ないパターンも明示的に網羅する必要がある。
- 参照: `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-12/implementation-guide.md`、`docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/index.md` AC-5

---

## 5. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| production session 値が log / scrollback に混入 | 致命 | `read -s` 経由取得 + 完了後 `unset` + 専用 shell session で smoke 実行 |
| middleware 結線抜けが production で 500 顕在化 | 高 | staging PASS evidence を必須前提とし、production deploy 直後に最小サブセットで smoke 開始（先頭 1 件 PASS で残りを実行） |
| binding 名差異で attendanceProvider が undefined | 高 | `wrangler.toml` の `[env.production]` と `[env.staging]` の binding 名突合を runbook 必須手順化 |
| `STAGING_API_URL` と `PRODUCTION_API_URL` の取り違え | 高 | 専用新規 shell session で smoke。完了後 session を破棄 |
| production rollback 判断の遅延 | 高 | smoke 失敗時の rollback コマンドを runbook に固定し、判断者を 1 名に限定 |
| user 承認なしの先走り実行 | 致命 | Phase 13 を user 承認 gate として spec 設計し、明示承認が evidence に残るまで smoke を起動しない |

---

## 6. 検証方法

### 単体検証

```bash
# binding 突合
bash scripts/cf.sh d1 list
grep -A 5 "\[env.production\]" apps/api/wrangler.toml
grep -A 5 "\[env.staging\]" apps/api/wrangler.toml
```

### 統合検証（production runtime・user 承認後のみ実行）

```bash
# 専用新規 shell session で実行
read -s -p "PRODUCTION_ADMIN_SESSION: " ADMIN_SESSION; export ADMIN_SESSION
read -s -p "PRODUCTION_MEMBER_SESSION: " MEMBER_SESSION; export MEMBER_SESSION
export PRODUCTION_API_URL="https://<production-api-host>"

bash scripts/smoke/runtime-attendance-provider.sh \
  --env production \
  --api-url "$PRODUCTION_API_URL"

# redact gate
grep -E "Cookie:|Authorization:|Bearer |cf-[a-z-]+:" \
  docs/30-workflows/<新タスクdir>/outputs/phase-11/evidence/runtime-smoke-production.log \
  && echo "FAIL: secret leak" || echo "OK"

# 完了後の片付け
unset ADMIN_SESSION MEMBER_SESSION PRODUCTION_API_URL
exit
```

期待:
- 全 read-only GET が `200`
- DI-bound endpoint で `attendance` 配列が hydrate
- redact gate 0 hit
- evidence は summary-only

---

## 7. スコープ

### 含む

- production Worker への `/admin/members*` および `/me*` read-only GET smoke
- DI-bound evidence の取得と redact gate
- 親タスク `issue-371` の `workflow_state` 更新 PR
- production smoke runbook 整備

### 含まない

- production への新規 deploy
- POST 系 endpoint の実行
- 新規 endpoint / D1 schema 変更
- production CI 自動化（さらに後段の別タスク）

---

## 8. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| depends-on | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` | staging PASS evidence + runner / redact filter の正本 |
| depends-on | `task-issue-531-ci-runtime-smoke-attendance-provider-001.md` | 推奨 PASS（必須ではないが、staging CI PASS で結線安定性が担保される） |
| depends-on | `apps/api` production deploy | 既存 deploy が smoke 対象 |
| depends-on | user 明示承認 | production smoke 起動の必須 gate |
| blocks | issue-371 の `PASS_RUNTIME_VERIFIED` / `completed` 化 | production smoke PASS でのみ昇格可 |
| related | `scripts/cf.sh` / `scripts/with-env.sh` | secret 注入ラッパー |
| related | `docs/30-workflows/runbooks/` | runbook 配置先 |
