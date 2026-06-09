# Phase 13: PR作成（user-gated） — issue-1138-smoke-runner-common-lib-extraction

[実装区分: 実装仕様書] / NON_VISUAL

## 目的

lib 実装（`scripts/smoke/lib/smoke-common.sh` 新設 + 3 runner 移行 + lib test 追加）完了後、**user の明示承認後にのみ** PR を作成する。本サイクルは `implemented_local_evidence_captured` であり、commit / push / PR は **実行しない**（CONST_002）。

## 状態

| 項目 | 値 |
| ---- | -- |
| Phase 13 status | `pending_user_approval` |
| workflow_state | `implemented_local_evidence_captured`（実装・local evidence 取得完了。commit・PR は user-gated） |
| Gate-C | **present**（commit / push / PR 作成。user-gated） |
| PR base ブランチ | `dev`（CLAUDE.md 既定。production リリース時のみ `dev → main`） |

> 本プロンプトでは commit / push / PR を実行しない（CLAUDE.md: commit / push / PR は user 明示承認後のみ・CONST_002）。issue #1138 は **CLOSED 状態を維持**する（reopen / close しない）。PR 本文では「#1138 の smoke runner 共通 lib 抽出を実装」と参照のみ行う。

## PR 作成時の手順（承認後）

1. 既定 base ブランチは `dev`。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward → 作業ブランチへ merge → conflict は CLAUDE.md 既定方針で解消。
3. 品質検証 4 コマンド: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. runner / shell 固有検証（**非退化の絶対基準**）:
   - `bash scripts/smoke/__tests__/smoke-common.test.sh` GREEN（新規 lib test）
   - `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` GREEN（11 ケース）
   - `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` GREEN（16 ケース）
   - `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` GREEN（assert 群・AC-10）
   - `shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh` clean
5. `gh pr create --base dev` で作成。本文は `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映。
6. NON_VISUAL のためスクリーンショット項目は作らない（`outputs/phase-11/` に画像なし）。

## 実行前チェック

- [ ] 既存 3 runner test 全 PASS（attendance 11 / admin-web 16 / tag-bulk assert 群）= 非退化確認
- [ ] 新規 `smoke-common.test.sh` 全 PASS
- [ ] `shellcheck` clean（対象 4 ファイル・指摘 0）
- [ ] `pnpm typecheck` / `pnpm lint` 通過
- [ ] `git status --porcelain` が空（未コミット変更なし）
- [ ] `git diff dev...HEAD --name-only` が PR 含めファイル一覧として取得済み

## 想定 PR タイトル

```
refactor(issue-1138): smoke runner 共通機構を scripts/smoke/lib/smoke-common.sh へ抽出し SSOT 化（挙動非退化）
```

## PR 本文骨格

```markdown
## 概要
issue #1138（=task-issue-1036-followup-007）。scripts/smoke/ 配下の 3 本の runtime smoke runner
（runtime-attendance-provider.sh / runtime-admin-web.sh / runtime-tag-bulk.sh）にコピー重複していた
共通機構を、新規共通 lib scripts/smoke/lib/smoke-common.sh へ抽出して SSOT 化する。共通機構の修正を
1 箇所で完結させ、drift（write_summary の routes/checks キー分岐・fail_and_exit の 3 シグネチャ）の
再発を防ぐ。**挙動非退化**（既存 runner の挙動を 1 ビットも変えない）が絶対基準。#1138 の SSOT 化を
実装（issue は CLOSED 維持）。

## 変更内容
- NEW: scripts/smoke/lib/smoke-common.sh（共通 9 関数 + SMOKE_ prefix 公開変数）
  - redact 経由ログ（smoke_redact_filter / smoke_redact_line）
  - summary 状態（smoke_summary_init / smoke_summary_pass / smoke_summary_fail_entry）
  - summary.json 書き出し（smoke_write_summary・array_key 引数化で routes/checks 両 shape を再現）
  - host allowlist 照合（smoke_assert_host_allow）/ env prefix（smoke_env_prefix）/ D1 ラッパー（smoke_run_d1）
- NEW: scripts/smoke/__tests__/smoke-common.test.sh（lib 共通関数の単体 test）
- EDIT: scripts/smoke/runtime-attendance-provider.sh（lib を source・重複削除・薄ラッパー化。write_summary array_key=routes）
- EDIT: scripts/smoke/runtime-admin-web.sh（同上。array_key=checks）
- EDIT: scripts/smoke/runtime-tag-bulk.sh（同上。array_key=checks・run_d1 ラッパー）

## MECE 境界（共通化対象 / runner 固有）
- 共通化: redact / summary 状態・書き出し / host allowlist 照合 / env prefix / D1 ラッパー
- runner 残置: assert_target / assert_staging_guard / request 系 / assert_all_status / extract_count /
  record_check / trap 登録（entry shape 差・固有契約のため過剰共通化を回避）

## 受入条件
- AC-1 lib 新設で共通機構集約 / AC-2 3 runner が source + 重複削除 / AC-3 既存 3 runner test 全 PASS（非退化）
- AC-4 lib は trap 非保持（trap 登録は runner・二重実行なし）/ AC-5 runner 固有差分は lib に巻き込まない（MECE）
- AC-6 lib test 追加 / AC-7 shellcheck clean / AC-8 redact SSOT（二重実装なし）
- AC-9 write_summary の array_key 分岐（attendance=routes / 他=checks）を非退化再現
- AC-10 tag-bulk test の source "$RUNNER" → assert_all_status/extract_count 直接呼び出しが成立

## 非退化証跡
- bash scripts/smoke/__tests__/smoke-common.test.sh（AC-1/AC-6/AC-9）
- bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh（11 ケース・AC-3/AC-9）
- bash scripts/smoke/__tests__/runtime-admin-web.test.sh（16 ケース・AC-3）
- bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh（AC-3/AC-10）
- shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh（AC-7/AC-8）
- pnpm typecheck / pnpm lint
- evidence は outputs/phase-11/evidence/ 配下（smoke-common-test.log / runtime-*-test.log / shellcheck.log）

## リスク
- write_summary の array_key 取り違え → array_key 必須引数化 + runner ラッパーで明示（AC-9）
- 二段 source（test→runner→lib）で関数未解決 → runner 冒頭で lib を source（AC-10）
- source 副作用（trap / set / グローバル変数汚染）→ lib は set/trap 非保持・SMOKE_ prefix 隔離・内部 local（AC-4/AC-7）
- 過剰共通化 → entry shape 差は runner 残置で lib シグネチャを安定に保つ（AC-5）

## 不変条件
- apps/api / apps/web / D1 schema / Google Form 仕様は非変更（既存 endpoint surface のみ）
- redact ロジックは redact.sh のみ（lib は bash 呼び出しで参照）。D1 操作は scripts/cf.sh 経由（wrangler 直叩きなし）

## 状態
implemented_local_evidence_captured（本サイクル）→ user 承認後に PR
```

## PR に含めるファイル一覧

### 実装成果物（実装 wave 完了後・5 点）

| 区分 | パス |
| ---- | ---- |
| NEW | `scripts/smoke/lib/smoke-common.sh` |
| NEW | `scripts/smoke/__tests__/smoke-common.test.sh` |
| EDIT | `scripts/smoke/runtime-attendance-provider.sh` |
| EDIT | `scripts/smoke/runtime-admin-web.sh` |
| EDIT | `scripts/smoke/runtime-tag-bulk.sh` |

### 仕様書群

- 本仕様書 root（`docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction/`）一式: `index.md` / `artifacts.json` / `outputs/phase-1..13/` / Phase 12 strict 7 outputs
- Phase 11 evidence ledger（`outputs/phase-11/phase-11.md` / `manual-test-result.md` / `outputs/phase-11/evidence/`）

> 非退化 evidence（`smoke-common-test.log` / `runtime-{attendance-provider,admin-web,tag-bulk}-test.log` / `shellcheck.log`）は、実装後 user-gated 取得のうえ同 PR で `outputs/phase-11/evidence/` に tracked file として追加する。

## 完了判定

- [ ] user 承認まで commit / push / PR を実行しない（Gate-C pending / CONST_002）
- [x] PR base = `dev`、想定タイトル・本文骨格・含めるファイル一覧（実装 5 点 + 仕様書群）を固定
- [x] 実行前チェック（既存 3 runner test 全 PASS / lib test PASS / shellcheck clean / typecheck・lint）を明記
- [x] issue #1138 は CLOSED 維持（PR で参照のみ）
- [x] NON_VISUAL のためスクリーンショット項目を作らない旨を明記
- [x] 現状ステータス `pending_user_approval` を明記
