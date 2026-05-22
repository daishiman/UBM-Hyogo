# attendanceProvider runtime smoke の CI 統合 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-531-ci-runtime-smoke-attendance-provider-001 |
| タスク名 | attendanceProvider runtime smoke の CI (GitHub Actions) 自動実行統合 |
| 分類 | infra / observability / CI gate |
| 対象機能 | `scripts/smoke/runtime-attendance-provider.sh` を staging deploy 後に CI で自動実行する経路の整備 |
| 優先度 | priority:medium |
| 見積もり規模 | scale:small |
| ステータス | unassigned |
| issue_number | #571 |
| 親タスク | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/`（spec_created・手動 staging evidence 範囲） |
| 親タスク状態 | `pending_user_runtime_credentials`（Phase 13 user-gate 待ち） |
| 発見元 | issue-531 Phase 12 unassigned-task-detection.md（"CI integration for runtime smoke" 候補） |
| 発見日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL（CI run log / artifact） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-531 で `scripts/smoke/runtime-attendance-provider.sh` と `scripts/smoke/redact.sh` を新設し、`/admin/members*` と `/me*` の read-only GET runtime smoke を **手動 staging 実行** で取得する設計が確定した。一方、Phase 12 unassigned-task-detection.md では「CI 統合は credential 配置ポリシーと workflow 承認が前提のため no-op now」として明示的に deferred されている。

### 1.2 問題点・課題

- 手動実行依存のままだと、新 sub-app 追加時の `attendanceProviderMiddleware` 結線漏れが staging deploy 直後に検出されない
- DI-bound throw（`attendanceProvider not bound to context`）の fail-fast 化は **runtime まで通すと 500 になる**ため、deploy → 手動 smoke の人手ループが長いと検出が遅れる
- staging credentials（Bearer / session cookie）を 1Password から CI に注入する経路が未確立
- evidence 永続化（GitHub Actions artifact / branch 内 log）と `grep-gate.log` の冪等再実行ポリシーが未定

### 1.3 放置した場合の影響

- 新 route 追加 PR の merge 直後、手動 smoke 漏れで結線抜けを production まで通すリスク
- issue-531 で整備した summary-only logging / redact filter が **CI に再現されず人間オペで発散**する
- production smoke タスク（別未タスク）への前提（automated PASS evidence）が揃わない

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/smoke/runtime-attendance-provider.sh` を staging deploy 後に GitHub Actions ジョブとして自動実行し、PASS / FAIL を required status check として gate する。secret は GitHub Environments + 1Password connect の **片方経由のみ**（後段で ADR 化）で揮発注入し、artifact には summary-only log だけを残す。

### 2.2 最終ゴール

- `.github/workflows/runtime-smoke-staging.yml`（仮称）で staging deploy 完了 trigger により smoke runner が実行される
- secret 経路 ADR が `docs/30-workflows/.../outputs/phase-03.md` 形式で確定
- evidence artifact に session cookie / Bearer / `cf-*` token / OAuth secret / email / fullName / profile body 実値が含まれない（grep gate を CI 内で実行）
- failure 時に親タスク `issue-371` の runtime PASS gate を blocker 化する

### 2.3 スコープ

#### 含むもの

- staging deploy → smoke 実行の workflow 結線（`workflow_run` trigger / reusable workflow 化）
- secret 注入経路 ADR（GitHub Environments + 1Password connect / OIDC short-lived の比較）
- artifact 永続化と redact gate の CI 内再実行
- failure 時の通知（Slack 既存 channel への redact 済み summary）
- branch protection への required check 追加判断（`dev` のみ / `main` も対象 とするかの ADR）

#### 含まないもの

- production smoke の CI 実行（別未タスク `task-issue-531-production-runtime-smoke-attendance-provider-001.md`）
- 新規 endpoint / D1 schema 変更
- runner 自体の再実装（issue-531 の bash runner を流用）
- e2e Playwright 化（curl smoke で十分という issue-531 の決定を踏襲）

### 2.4 成果物

- `.github/workflows/runtime-smoke-staging.yml` 新規
- `docs/30-workflows/<新タスクdir>/outputs/phase-03.md` ADR（secret 注入経路）
- `docs/30-workflows/<新タスクdir>/outputs/phase-11/evidence/runtime-smoke-ci.log`（CI 実行 PASS evidence）
- branch protection 更新差分（必要時のみ・gh api 経由の手順書）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-531 で `scripts/smoke/runtime-attendance-provider.sh` / `scripts/smoke/redact.sh` が `dev` に merge 済み
- `apps/api` staging deploy workflow が `workflow_run` を発火する形で存在（または完了 commit を base に同 workflow から続走できる）
- secret 注入の正本ポリシー（1Password / GitHub Environments）に対する user 承認

### 3.2 実行手順

1. **ADR 起票**: secret 注入経路 3 案比較（A: GitHub Environments + manual rotation、B: 1Password connect、C: OIDC short-lived to Cloudflare API + bearer mint）
2. **runner 引数契約の固定**: issue-531 で確定した env 変数名（例: `STAGING_BEARER` / `STAGING_SESSION` / `STAGING_API_URL`）を CI 側で再利用
3. **workflow 実装**:
   - `.github/workflows/runtime-smoke-staging.yml` を新設
   - `workflow_run` で staging deploy 完了を trigger
   - `scripts/smoke/runtime-attendance-provider.sh` を実行し、stdout は `redact.sh` 経由
   - PASS evidence を artifact に upload（保存期間は短期・90日以内）
4. **grep gate**: artifact に対し `grep -E "Cookie:|Authorization:|cf-[a-z-]+:|@.*\\." -c` を実行して 0 hit を確認
5. **failure 通知**: Slack `#ubm-staging-alerts`（既存 channel・別タスクで命名済みのもの）に summary post
6. **required check 化判断**: `dev` のみ required にするか、`main` 直前 gate にするかを ADR で確定し `gh api repos/{owner}/{repo}/branches/{branch}/protection` で適用

### 3.3 受入条件 (AC)

- AC-1: staging deploy 成功後、自動で smoke job が start し、PASS / FAIL が GitHub Actions UI に表示される
- AC-2: artifact は status / jq contract / count summary のみで、raw response body / cookie / token を含まない
- AC-3: secret 注入経路の ADR が 3 案比較 + 採用根拠付きで `outputs/phase-03.md` に存在
- AC-4: failure 時、Slack に redact 済み summary が post される（実 cookie / token は post されない）
- AC-5: required status check への昇格判断が ADR 化され、適用差分（branch protection JSON）が evidence として残る

---

## 4. 苦戦箇所【記入必須】

- 対象: `scripts/smoke/runtime-attendance-provider.sh` の env 変数契約
- 症状: issue-531 で env 変数経由（`$STAGING_BEARER` 等）に確定したが、CI に注入する際に **Bash 配列の sourcing と GitHub Actions secret masking の相互作用**で実値がログに漏れる事故が起こりやすい。`echo "::add-mask::$VAR"` を job 冒頭で必ず宣言し、その後で `set -x` を有効化しないこと。`with-env.sh` ラッパー経由で動かすと `op run` の dry-run 内 expansion で実値が GitHub Actions runner shell に降りる瞬間があるため、`op run` ステップと smoke 実行ステップを **同一 step 内で完結**させる必要がある。
- 対象: `apps/api/wrangler.toml` の staging env と `workflow_run` の base ref
- 症状: `workflow_run` trigger は **base ref が default branch（`main`）の workflow しか発火しない**仕様があり、`dev` 上の deploy workflow を base にしたい場合は別途 `repository_dispatch` 化が必要。issue-371 の deploy workflow が `dev` で動いている場合、CI 統合は `repository_dispatch` 経由を選ぶ判断が安全。
- 対象: redact gate の偽陰性
- 症状: `grep -E "Cookie:|Authorization:"` だけだと **base64 化された session cookie 値**（`Cookie:` ヘッダ名なしで出る場合）を検出できない。redact filter は **値レベルの正規表現 + ヘッダ名レベルの正規表現の and 検出**にする必要がある。
- 参照: `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-12/implementation-guide.md`

---

## 5. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| secret が CI ログに混入 | 高 | `::add-mask::` 宣言を job 冒頭で実施。`set -x` 禁止。redact gate を CI 内で再実行 |
| `workflow_run` base ref 制約で `dev` 起点 trigger が動かない | 中 | `repository_dispatch` に切替える ADR を Phase 3 で確定 |
| staging credentials が rotation で CI 側だけ古いまま | 中 | 1Password 正本 + 月次 rotation チェックタスクを並走（既存 SOP に追記） |
| required check 化で `dev` への merge が staging unhealthy 時に全停止 | 中 | manual override 手順を runbook 化（`docs/30-workflows/runbooks/`） |
| production smoke タスクとの責務漏れ | 中 | 本タスクは staging のみと明記し、production 側は別未タスクで管理 |

---

## 6. 検証方法

### 単体検証

```bash
# workflow YAML の lint
mise exec -- pnpm dlx action-validator .github/workflows/runtime-smoke-staging.yml

# runner local 実行（dry-run mode）
DRY_RUN=1 bash scripts/smoke/runtime-attendance-provider.sh
```

### 統合検証（CI runtime）

- `dev` に runtime smoke workflow を merge 後、staging deploy を 1 回 trigger
- GitHub Actions UI で smoke job が PASS することを確認
- artifact をダウンロードし `grep -E "Cookie:|Authorization:|Bearer "` が 0 hit
- 故意に `STAGING_BEARER` を空にして re-run し、smoke job が FAIL することを確認（fail-fast 経路 evidence）

---

## 7. スコープ

### 含む

- `.github/workflows/runtime-smoke-staging.yml` 新設
- secret 注入経路 ADR
- evidence artifact upload + grep gate
- failure 通知（Slack）
- required status check 適用判断と差分

### 含まない

- production smoke の CI 実行（別未タスク）
- runner の再実装
- 新規 endpoint / D1 schema 変更
- e2e Playwright 化

---

## 8. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| depends-on | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` | runner / redact filter / evidence canonical path の正本 |
| depends-on | `apps/api` staging deploy workflow | trigger 起点 |
| depends-on | 1Password Vault（staging credentials） | secret 正本 |
| blocks | `task-issue-531-production-runtime-smoke-attendance-provider-001.md` | staging CI PASS evidence が production gate の前提 |
| related | `scripts/cf.sh` / `scripts/with-env.sh` | secret 注入ラッパー |
| related | `.github/workflows/verify-indexes.yml` | CI gate 拡張のリファレンス |
