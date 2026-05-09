# タスク仕様書: Issue #554 — `audit-correlation-verify / verify` を branch protection の required status check に登録

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-554-audit-correlation-branch-protection-required-check |
| タスクコード | U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/554 (state: CLOSED — 仕様書はクローズドのまま作成) |
| 親 Issue 状態維持 | **CLOSED のまま運用**。本仕様書は Issue state を変更しない（`gh issue view 554` 実態は `state: CLOSED`）。Issue 操作（reopen 含む）は本タスク範囲外 |
| 起票元 source | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02-branch-protection-required-check.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/` |
| 配置先 | `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/` |
| 作成日 | 2026-05-08 |
| 状態 | spec_created |
| workflow_state | spec_created |
| runtimeEvidence | not_started |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Phase 12 状態 | CONTRACT_READY_IMPLEMENTATION_PENDING（外部 GitHub PUT / commit / push / PR は Phase 13 user gate） |
| 実装区分 | **[実装区分: 実装仕様書]** — コード変更（`.github/CODEOWNERS` / governance ドキュメント / aiworkflow-requirements skill references・indexes）と、`gh api` を介した GitHub 設定変更（branch protection PUT）を含む。仕様書冒頭判定根拠: 目的達成には GitHub 設定変更とそれに整合するリポジトリ内テキスト変更が必須であり、ドキュメントのみで完結しない |
| 優先度 | medium (`priority:medium`) |
| 規模 | small (`scale:small`) |
| 想定 PR 数 | 1（governance 文書反映 PR を 1 本。GitHub branch protection の PUT 自体は API 呼び出しで完結し、PR 履歴を伴わない設定変更だが、`outputs/phase-11/` に before/after スナップショット evidence を残す） |
| coverage AC | 該当なし（コード ロジック追加なし。governance 文書とインデックス再生成が gate） |

## GitHub label / tag（Claude Code / Codex 共有用）

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#554`（PR 本文に `Refs: #554` を必ず含める。Issue は CLOSED のまま運用するため、PR 本文側で reference するのみ） |
| GitHub Issue labels（継承） | `priority:medium`, `type:security`, `scale:small`, `status:unassigned` |
| PR に付与する labels | `priority:medium`, `type:security`, `scale:small`（`status:unassigned` は PR には付けない） |
| `gh pr create` 引数 | `--label priority:medium --label type:security --label scale:small` |
| ブランチ名 | `docs/issue-554-branch-protection-required-check` |
| PR タイトル | `docs(issue-554): register audit-correlation-verify as required status check on dev/main` |
| PR base | `dev`（CLAUDE.md「PR 作成の完全自律フロー」の既定どおり） |

## 目的

Issue #516 で追加した `.github/workflows/audit-correlation-verify.yml` の `verify` job を、`dev` および `main` の branch protection における **required status check（`required_status_checks.contexts`）** に正式登録する。あわせてリポジトリ内 governance 文書（CLAUDE.md / aiworkflow-requirements skill `references/branch-protection.md`・`indexes/`）を実態に整合させる。

具体的には次を達成する:

1. `audit-correlation-verify.yml` が main の最新 commit 上で **1 回以上 empirical green** になっていることを `gh run list` 等で確認する（着手判断ゲート）
2. 現行 protection 設定（`dev` / `main`）の before スナップショットを `outputs/phase-11/` に保存する
3. `jq` で既存 `contexts` 配列に `audit-correlation-verify / verify` を merge し、`gh api -X PUT` で `dev` → `main` の順に PUT する
4. PUT 後の after スナップショットを保存し、`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の不変条件 drift がないことを `grep`/`jq` で検証する
5. CLAUDE.md governance 章 / aiworkflow-requirements `references/branch-protection.md` / `indexes/topic-map.md` / `indexes/keywords.json` を更新し、`pnpm indexes:rebuild` で drift を解消する

## スコープ

### 含む

- `dev` / `main` の `required_status_checks.contexts` への `audit-correlation-verify / verify` 追加（GitHub API PUT）
- before / after protection スナップショット evidence 取得（`outputs/phase-11/`）
- CLAUDE.md「Governance / CODEOWNERS」「ブランチ戦略」章の追記更新
- aiworkflow-requirements skill `references/branch-protection.md`（無ければ新規作成）
- `indexes/topic-map.md` / `indexes/keywords.json` への anchor / keyword 追加
- `pnpm indexes:rebuild` による drift 解消
- UT-GOV-001 系 drift check が引き続き green であることの確認

### 含まない

- workflow 自体（`.github/workflows/audit-correlation-verify.yml`）の編集 — Issue #516 の責務
- `required_pull_request_reviews` の有効化 — solo 運用ポリシーに反する
- `audit-correlation-verify` 以外の workflow を required に追加すること
- production deploy / `audit-correlation-verify` の振る舞い変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | `.github/workflows/audit-correlation-verify.yml` (Issue #516 で merged) | 本タスクが required 登録する対象。main 上で 1 回以上 green が前提 |
| 上流（参照） | `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/` | 親タスクの設計・運用文脈 |
| 下流（SSOT） | `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 採用結果の正本反映先（無ければ新規） |
| 下流（インデックス） | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | anchor / keyword 反映 |
| 隣接（共通 governance） | `CLAUDE.md`「ブランチ戦略」「Governance / CODEOWNERS」 | 運用参照の追記 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| `gh api` で branch protection 読み取り可能 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /dev/null` |
| `audit-correlation-verify` が main で 1 回以上 green | `gh run list --workflow=audit-correlation-verify.yml --branch=main --status=success --limit=1` が 1 件以上返ること |
| `jq` がローカルで利用可能 | `command -v jq` |
| Node 24 / pnpm 10 が解決済 | `mise install && mise exec -- node -v` |

## 苦戦箇所・知見（親タスク継承 + 本タスク固有）

1. **PUT API は `contexts` を全置換する**: `gh api -X PUT branches/.../protection` は `required_status_checks.contexts` を全置換するため、必ず before スナップショットを `jq` で取得し、`.required_status_checks.contexts += ["audit-correlation-verify / verify"]` で merge してから PUT する。
2. **`required_pull_request_reviews=null` の表現**: PUT API では明示 `null` 送信と key 削除の挙動が異なるケースがあるため、本タスクでは「現行設定を取得 → contexts のみ書き換え → 同形で PUT」の方針で副作用を最小化する。
3. **dev → main の順序**: dev で先に PUT し、`audit-correlation-verify` が dev PR で待機状態になることを確認してから main へ伝播する。main 先行で PUT すると（理論上は）main 直 push 抑止が効く環境で fallback が必要となるため避ける。
4. **governance 文書とリポジトリ実態の drift**: CLAUDE.md は運用参照、GitHub 側 protection が正本。本タスクで両者を同期したうえで、Phase 11 evidence で drift ゼロを保証する。
5. **`audit-correlation-verify` job 名の表記**: required context の文字列は `audit-correlation-verify / verify`（workflow 名 + job 名、半角スラッシュ前後にスペース）。これは GitHub API が要求する canonical 表記である。Phase 5 / 7 の実装でこの文字列を**そのまま**埋めること。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `CLAUDE.md` | 編集 | 「ブランチ戦略」「Governance / CODEOWNERS」章に `audit-correlation-verify / verify` の required 登録を追記 |
| `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 新規 or 編集 | branch protection 不変条件 + required contexts 一覧の正本（無ければ新規） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集（再生成） | governance 章に branch-protection.md の anchor を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集（再生成） | `audit-correlation-verify` / `branch protection` / `required status check` 等の keyword 追加 |
| `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/outputs/phase-11/before-dev-protection.json` | 新規 | dev branch protection PUT 前スナップショット |
| `docs/30-workflows/issue-554-.../outputs/phase-11/before-main-protection.json` | 新規 | main 同上 |
| `docs/30-workflows/issue-554-.../outputs/phase-11/after-dev-protection.json` | 新規 | dev PUT 後スナップショット |
| `docs/30-workflows/issue-554-.../outputs/phase-11/after-main-protection.json` | 新規 | main 同上 |
| `docs/30-workflows/issue-554-.../outputs/phase-11/diff-summary.md` | 新規 | before/after の差分 + drift チェック結果 |
| `docs/30-workflows/issue-554-.../outputs/phase-12/implementation-guide.md` | 新規 | 実施結果 / 採用判断 / SSOT 反映先一覧 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / GO 判定（main 上の `audit-correlation-verify` empirical green 確認） | spec_created |
| [2](phase-02.md) | branch protection JSON schema 設計 / merge 戦略確定 | spec_created |
| [3](phase-03.md) | governance 文書 / SSOT 反映先設計 | spec_created |
| [4](phase-04.md) | 検証手順設計（before/after diff / 不変条件 grep） | spec_created |
| [5](phase-05.md) | dev branch protection PUT 実装（API 呼び出し手順） | blocked_until_user_approval |
| [6](phase-06.md) | main branch protection PUT 実装 | blocked_until_user_approval |
| [7](phase-07.md) | governance 文書（CLAUDE.md）反映実装 | spec_created |
| [8](phase-08.md) | aiworkflow-requirements skill references / indexes 反映 | spec_created |
| [9](phase-09.md) | `pnpm indexes:rebuild` で drift 解消 | spec_created |
| [10](phase-10.md) | UT-GOV-001 系 drift check 再実行で不変条件確認 | spec_created |
| [11](phase-11.md) | runtime evidence 取得（before captured / after JSON / dev PR pending 確認） | blocked_until_user_approval |
| [12](phase-12.md) | implementation-guide / 中学生レベル概念説明 / unassigned 検出 / skill feedback / compliance | spec_created |
| [13](phase-13.md) | commit / PR 作成（user gate） | blocked_until_user_approval |

## Outputs 導線

Phase 12 以外の `outputs/phase-*` は実行時に作成する予約パスであり、`spec_created` 時点では evidence-shaped placeholder を置かない。Phase 12 は strict 7 outputs を実体化済み。

| Phase | Output |
| --- | --- |
| 1 | reserved: `outputs/phase-1/phase-1.md` |
| 2 | reserved: `outputs/phase-2/phase-2.md` |
| 3 | reserved: `outputs/phase-3/phase-3.md` |
| 4 | reserved: `outputs/phase-4/phase-4.md` |
| 5 | reserved: `outputs/phase-5/phase-5.md` |
| 6 | reserved: `outputs/phase-6/phase-6.md` |
| 7 | reserved: `outputs/phase-7/phase-7.md` |
| 8 | reserved: `outputs/phase-8/phase-8.md` |
| 9 | reserved: `outputs/phase-9/phase-9.md` |
| 10 | reserved: `outputs/phase-10/phase-10.md` |
| 11 | reserved: `outputs/phase-11/{before-dev-protection.json,before-main-protection.json,after-dev-protection.json,after-main-protection.json,diff-summary.md}` |
| 12 | [outputs/phase-12/phase-12.md](outputs/phase-12/phase-12.md) |
| 13 | reserved: `outputs/phase-13/phase-13.md` |

## 完了条件（DoD: タスク全体）

> 2026-05-08 改善メモ: 本 workflow は branch protection PUT という外部設定変更を含むため、Phase 12 では「仕様・手順・正本同期が完了した状態」までを PASS とする。read-only before JSON は取得済み。実 `gh api -X PUT`、after JSON、commit、push、PR 作成はユーザー明示承認後の Phase 13 でのみ実行する。

### 機能要件

- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の `required_status_checks.contexts` に `audit-correlation-verify / verify` が含まれる
- [ ] 同 `branches/main/protection` も同様
- [ ] `outputs/phase-11/` に before/after スナップショット 4 ファイル + `diff-summary.md` が揃っている

### 不変条件

- [ ] `required_pull_request_reviews=null`（solo 運用ポリシー）が dev / main 双方で維持されている
- [ ] `lock_branch=false` / `enforce_admins=true` が維持されている
- [ ] `required_linear_history=true` / `required_conversation_resolution=true` が維持されている
- [ ] `audit-correlation-verify / verify` 以外の既存 contexts に欠落がない（before の contexts ⊂ after の contexts）

### ドキュメント / SSOT 要件

- [ ] CLAUDE.md「ブランチ戦略」「Governance / CODEOWNERS」章に required contexts の記述が存在する
- [ ] `.claude/skills/aiworkflow-requirements/references/branch-protection.md` が更新済み
- [ ] `mise exec -- pnpm indexes:rebuild` 後に `.claude/skills/aiworkflow-requirements/indexes/` に drift がない（`verify-indexes-up-to-date` gate green）
- [ ] PR 本文に `Refs: #554` / `priority:medium` / `type:security` / `scale:small` ラベル付与

### 品質要件

- [ ] `mise exec -- pnpm typecheck` clean（変更ファイル種別から typecheck は事実上 no-op だが、CI gate の一貫性確保のため実行）
- [ ] `mise exec -- pnpm lint` clean
- [ ] UT-GOV-001 系 drift check が green

## 参照情報

- 起票元 unassigned spec: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02-branch-protection-required-check.md`
- 親タスク: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- 対象 workflow: `.github/workflows/audit-correlation-verify.yml`
- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/516
- 本タスク Issue: https://github.com/daishiman/UBM-Hyogo/issues/554 (CLOSED)
- governance 参照: CLAUDE.md「ブランチ戦略」「Governance / CODEOWNERS」
