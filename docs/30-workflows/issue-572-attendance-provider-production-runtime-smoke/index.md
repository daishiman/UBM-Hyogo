# タスク仕様書: Issue #572 — attendanceProvider production runtime smoke 実行と issue-371 完了化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-572-attendance-provider-production-runtime-smoke |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/572 |
| 親 Issue (上位) | #531（CLOSED, staging で完了） / #371（CLOSED, attendanceProvider middleware DI 移行） |
| 関連 Issue | #571（CLOSED, staging CI 自動実行統合） |
| 起票元 source | Issue #572 (CLOSED, follow-up of #531) |
| 配置先 | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/` |
| 作成日 | 2026-05-08 |
| 状態 | implemented-local / production runtime evidence pending_user_gate |
| workflow_state | implemented-local |
| runtimeEvidence | production_smoke_pending_user_gate |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装]** — production smoke 実行スクリプト追加（`apps/api/scripts/runtime-smoke/`）、production runbook 整備（`docs/30-workflows/runbooks/`）、親タスク（issue-371）state 更新コミットを含む。CONST_004 / CONST_005 準拠の実装仕様書。 |
| 親 Issue 状態維持 | **CLOSED のまま運用**。本仕様書は Issue state を変更しない。`#572` は既に closed であり、reopen / 再 close は行わない。 |
| 優先度 | high |
| 規模 | small |
| 想定 PR 数 | 1（production smoke スクリプト + runbook + 親タスク state 更新を同一 PR にまとめる） |
| 親タスク（state 更新対象） | issue-371（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` / `completed`） |

## GitHub label / tag（Claude Code / Codex 共有用）

このタスクの仕様書を Claude Code / Codex に渡してコード実装 → PR 作成を依頼する際は、必ず以下の label / コンテキストを併送すること。`artifacts.json` の `claudeCodeContext` セクションが正本。

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#572`（`Refs: #572` を PR 本文に必ず含める。`#371` / `#531` も併記） |
| GitHub Issue labels（継承） | `priority:high`, `type:workflow`, `scale:small` |
| PR に付与する labels | `priority:high`, `type:workflow`, `scale:small`, `area:api` |
| `gh pr create` 引数 | `--label priority:high --label type:workflow --label scale:small --label area:api` |
| ブランチ名 | `docs/issue-572-attendance-provider-production-runtime-smoke`（現在ブランチ） |
| PR タイトル | `feat(api): issue-572 attendanceProvider production runtime smoke and issue-371 completion` |
| 親タスク参照 | issue-371 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` |

> **Claude Code / Codex 実行ガイド**: 仕様書を実行する際は、上記 label / context を Phase 13 の PR 作成プロンプトに必ず引き渡すこと。CLAUDE.md「PR 作成の完全自律フロー」と整合する。

## 目的

issue-531 / issue-371 で staging まで PASS 済みの attendanceProvider middleware DI 経路を、**production 環境での read-only GET smoke** で最終検証し、issue-371 の状態を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` / `completed` に昇格させる。

具体的には次を達成する:

1. production の `/admin/members*` および `/me*` を read-only GET で叩く smoke スクリプトを追加
2. DI-bound evidence（`/admin/members/:memberId` の `.attendance | type == "array"`、`/me/profile` の `.profile.attendance | type == "array"`）を summary-only で記録
3. session cookie / Bearer / cf-* token / OAuth secret / email / fullName / profile body 実値を **evidence に一切残さない** redact filter を production 固有値（`cf-ray` / `__Secure-*` 等）に拡張
4. production smoke の手順を runbook 化し、user 明示承認を gate として記録
5. issue-371 の state 昇格 commit を本 PR に含める

## スコープ

### 含む

- production smoke 実行スクリプト追加（`apps/api/scripts/runtime-smoke/run-smoke.sh` / `redact-filter-production.sh`）
- redact filter の production 固有値（`cf-ray`, `__Secure-*`, OAuth callback token, magic link token, email local part, fullName）拡張
- session 注入方式 `read -s` + `unset` パターン（shell 履歴漏洩防止）
- API URL 切替（`PRODUCTION_API_URL` env 経由のみ。`STAGING_API_URL` との取り違え検出）
- 対象 endpoint: `/admin/members`, `/admin/members/:memberId`, `/me/profile`, `/me/attendance`（read-only GET のみ）
- DI-bound evidence summary-only（jq `type == "array"` / `length` / `keys_count` のみ記録、body 値非保持）
- production smoke 用 runbook 追加（`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`）
- user 明示承認 evidence の記録（runbook 内のチェックリスト + commit message に承認 timestamp）
- 親タスク（issue-371）state 更新 commit（`docs/30-workflows/.../state.json` または該当 spec 内の state field を `PASS_RUNTIME_VERIFIED` に書き換え）

### 含まない

- attendanceProvider middleware の実装変更（issue-371 で完了済み）
- staging smoke の再実行（issue-531 / issue-571 で完了済み）
- 新規 endpoint 追加（`/admin/members*` / `/me*` の現行 surface のみ対象）
- D1 schema 変更
- `/admin/members*` の write 系（POST / PATCH / DELETE）smoke
- production session cookie / OAuth secret の commit / persist（runtime のみで揮発的に注入）
- monitoring ダッシュボード / アラート整備

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | issue-371（CLOSED, attendanceProvider middleware DI 移行） | DI 経路実装の正本。本タスクで runtime verified 化する対象 |
| 上流 | issue-531（CLOSED, staging で完了） | staging smoke スクリプトの base case。production 用は本タスクで派生実装 |
| 上流 | issue-571（CLOSED, staging CI 自動実行統合） | staging smoke の CI 自動化済み。production は手動 + user 承認 gate |
| 上流 | `apps/api/scripts/runtime-smoke/` 配下の既存 staging smoke スクリプト群 | 既存 redact filter / smoke runner を流用 |
| 上流 | `apps/api/wrangler.toml` の `[env.production]` binding | binding 名差異の整理対象 |
| 下流 | issue-371 spec（state 更新先） | 本タスク完了時に `PASS_RUNTIME_VERIFIED` / `completed` に書き換え |
| 下流 | aiworkflow-requirements skill（runbook 追加反映） | runbook を `references/` から検索可能にする |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が解決済 | `mise install && mise exec -- node -v` |
| 既存 staging smoke スクリプトが参照可能 | `test -d apps/api/scripts/runtime-smoke/` |
| `apps/api/wrangler.toml` の `[env.production]` が参照可能 | `test -f apps/api/wrangler.toml` |
| `scripts/cf.sh` 経由で production 認証可能 | `bash scripts/cf.sh whoami` |
| issue-371 / issue-531 / issue-571 の state が確認可能 | `gh issue view 371,531,571 --json state` |
| user 明示承認 gate が運用フローに組み込まれている | CLAUDE.md「PR 作成の完全自律フロー」確認 |

## 苦戦箇所・知見（Issue #572 起票時の根拠を継承）

1. **wrangler.toml の `[env.production]` vs `[env.staging]` binding 名差異**: production 側は `DB`, `KV` の binding 名が staging と微妙に異なる可能性があり、smoke 実行前に必ず `[env.production]` セクションを grep して binding 名を確定する。Phase 2 で binding 差分表を作成する。
2. **production session 値の shell 履歴漏洩**: production session cookie / Bearer token を引数や `export` 変数で渡すと `~/.zsh_history` に残る。`read -s -p "session: " SESSION` + 直後 `curl` 実行 + `unset SESSION` のパターンで揮発化する。Phase 3 で具体実装を確定。
3. **`STAGING_API_URL` と `PRODUCTION_API_URL` の取り違え**: env 名が似ているため、smoke 実行前に `echo "$PRODUCTION_API_URL" | grep -E '^https://api\.<production-domain>'` で sanity check を必須化する。staging URL pattern にマッチした場合は即座に abort。
4. **redact filter の production 固有値偽陰性**: staging には現れない `cf-ray` / `__Secure-*` cookie / OAuth callback token / magic link token / email local part / fullName が production レスポンスに含まれる。staging の redact filter をそのまま流用すると evidence に実値が残る。Phase 3 で production 固有 pattern を網羅した redact filter 拡張を設計する。
5. **DI-bound evidence の summary-only 強制**: `.attendance | type == "array"` のように type / length / keys のみを抽出し、body 実値を絶対に保存しない。jq filter は redact filter を必ず通過させた後の stream に対してのみ適用する。
6. **親タスク state 更新の同一 PR 化**: issue-371 の state 昇格は本 PR に含めることで、production smoke PASS と state 更新が atomic に行われる（PR revert で state も巻き戻る）。state 更新を別 PR に分離しない。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | 新規 | production GET smoke 実行 entrypoint。`PRODUCTION_API_URL` sanity check + `read -s` session 注入 + redact filter pipeline |
| `apps/api/scripts/runtime-smoke/redact-filter-production.sh` | 新規 | production 固有 redact pattern（`cf-ray` / `__Secure-*` / OAuth token / email / fullName） |
| `apps/api/scripts/runtime-smoke/lib/api-url-guard.sh` | 新規 | `PRODUCTION_API_URL` / `STAGING_API_URL` 取り違え検出 helper |
| `apps/api/scripts/runtime-smoke/lib/evidence-summary.sh` | 新規 or 編集 | jq による `type` / `length` / `keys_count` 抽出（body 実値 drop） |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | production smoke 実行手順 + user 明示承認チェックリスト + abort 条件 |
| `docs/30-workflows/issue-371-attendance-provider-di-migration/...state...` または該当 spec | 編集 | issue-371 state を `PASS_RUNTIME_VERIFIED` / `completed` に昇格（具体パスは Phase 2 で確定） |
| `apps/api/scripts/runtime-smoke/README.md` | 編集 | production smoke entry の追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | production smoke workflow inventory 追加 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / production smoke の不可侵条件確定 / GO 判定 | completed |
| [2](phase-02.md) | スコープ確定 / wrangler.toml binding 差分整理 / endpoint surface 固定 | completed |
| [3](phase-03.md) | 設計 / production smoke スクリプト設計 / API URL 切替 / redact filter 拡張 / session 注入方式 | completed |
| [4](phase-04.md) | 統合テスト設計（dry-run / fixture でのスクリプト挙動検証） | completed |
| [5](phase-05.md) | redact filter 実装 | completed |
| [6](phase-06.md) | api-url-guard / evidence-summary helper 実装 | completed |
| [7](phase-07.md) | run-smoke.sh 本体実装 | completed |
| [8](phase-08.md) | runbook 実装（手順 / abort 条件 / user 承認チェックリスト） | completed |
| [9](phase-09.md) | SSOT 反映（aiworkflow-requirements references） | completed |
| [10](phase-10.md) | スクリプト単体テスト（shellcheck / dry-run） | completed |
| [11](phase-11.md) | runtime evidence 取得（production smoke 実行・user 明示承認 gate） | pending_user_gate |
| [12](phase-12.md) | implementation-guide / 親タスク state 昇格記録 / unassigned 検出 | completed |
| [13](phase-13.md) | commit / PR 作成（user gate） | blocked_pending_user_approval |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | [outputs/phase-1/phase-1.md](outputs/phase-1/phase-1.md) |
| 2 | [outputs/phase-2/phase-2.md](outputs/phase-2/phase-2.md) |
| 3 | [outputs/phase-3/phase-3.md](outputs/phase-3/phase-3.md) |
| 4 | outputs/phase-4/phase-4.md |
| 5 | outputs/phase-5/phase-5.md |
| 6 | outputs/phase-6/phase-6.md |
| 7 | outputs/phase-7/phase-7.md |
| 8 | outputs/phase-8/phase-8.md |
| 9 | outputs/phase-9/phase-9.md |
| 10 | outputs/phase-10/phase-10.md |
| 11 | outputs/phase-11/phase-11.md |
| 12 | outputs/phase-12/phase-12.md |
| 13 | outputs/phase-13/phase-13.md |

## 完了条件（DoD: タスク全体）

### 機能要件（AC・6件）

- [ ] **AC-1**: production の `/admin/members`, `/admin/members/:memberId`, `/me/profile`, `/me/attendance` GET smoke が PASS（HTTP 200 + DI-bound evidence 抽出成功）
- [ ] **AC-2**: redact filter が production evidence に対して 0 hit（session cookie / Bearer / cf-* / OAuth / email / fullName / profile body 実値が evidence ファイルに含まれていないことを grep gate で保証）
- [ ] **AC-3**: 親タスク（issue-371）の state が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` / `completed` に更新された commit が本 PR に含まれる
- [ ] **AC-4**: production smoke 実行 runbook が `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` に整備済み
- [ ] **AC-5**: user 明示承認 evidence（承認 timestamp / 承認者 identifier）が runbook チェックリストおよび commit message に記録されている
- [ ] **AC-6**: DI-bound evidence summary（`.attendance | type == "array"` / `.profile.attendance | type == "array"`）が `outputs/phase-11/` 配下に summary-only で記録されている

### 品質要件

- [ ] `STAGING_API_URL` と `PRODUCTION_API_URL` 取り違え検出 guard が実装済（誤った URL での実行が abort される test fixture で確認）
- [ ] `wrangler.toml` の `[env.production]` vs `[env.staging]` binding 差分が Phase 2 で文書化済
- [ ] session 値が shell 履歴に残らないこと（`read -s` + `unset` パターン採用、`history | grep` で session 値非検出を runbook に明記）
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` clean
- [ ] shellcheck が production smoke 関連スクリプトに対して clean

### ドキュメント要件

- [ ] aiworkflow-requirements skill の references / topic-map / keywords に runbook が反映済（必要時）
- [ ] `mise exec -- pnpm indexes:rebuild` 後に skill indexes drift 無し
- [ ] PR 本文に `Refs: #572`, `Refs: #371`, `Refs: #531` が併記され、`priority:high` / `type:workflow` / `scale:small` / `area:api` label が付与される

## 参照情報

- 親 Issue #572 (CLOSED): https://github.com/daishiman/UBM-Hyogo/issues/572
- 上位 Issue #531 (CLOSED, staging 完了): https://github.com/daishiman/UBM-Hyogo/issues/531
- 上位 Issue #371 (CLOSED, DI 移行): https://github.com/daishiman/UBM-Hyogo/issues/371
- 関連 Issue #571 (CLOSED, staging CI 統合): https://github.com/daishiman/UBM-Hyogo/issues/571
- 既存 staging smoke スクリプト群: `apps/api/scripts/runtime-smoke/`
- 既存 production wrangler 設定: `apps/api/wrangler.toml`（`[env.production]` セクション）
- Cloudflare CLI ラッパー: `scripts/cf.sh`（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）
- 類似 spec フォーマット: `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/`
