# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | approval_required |
| タスク分類 | implementation / PR creation（approval gate） |
| user_approval_required | **true** |

## 目的

Phase 1〜12 の成果物（仕様書 / smoke 証跡 / 403 troubleshooting runbook / docs sync）をまとめて PR を作成し、ユーザーの **明示的な承認** を経てレビュー → マージへ進める。承認ゲート前のいかなる commit / push / PR 作成も禁止。Issue #41 は CLOSED のため reopen せず "Re-link to closed issue #41 (UT-26)" として PR 本文で参照する（governance 採用条件）。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | 9 項目すべて採取済（または N/A 理由明記） | 要確認 |
| Phase 11 troubleshooting-runbook | 403 切り分け 4 ステップ整備済 | 要確認 |
| Phase 12 compliance check | 必須 7 ファイル + same-wave sync + 二重 ledger PASS | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | SA JSON / Bearer / private_key / client_email / 完全な spreadsheetId 実値が無い | 要確認 |
| production 書き込みチェック | `--env production` deploy / write 系 API 呼び出しが一切無い | 要確認 |
| Issue #41 CLOSED governance | reopen せず "Re-link" として参照 | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint / build / smoke）を実行・記録する（placeholder としては `pnpm typecheck` / `pnpm lint` / `pnpm build` の 3 項目固定）。
3. change-summary（PR description 草案）を作成する。
4. 機密情報 grep を実行する（`grep -nE "ya29\.|-----BEGIN PRIVATE|client_email"`）。
5. user 承認後、ブランチ作成 → commit → push → PR 作成を実行する。
6. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
7. PR 本文で Issue #41 CLOSED に対する "Re-link to closed issue #41 (UT-26)" を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-11/manual-smoke-log.md | 動作確認サマリー |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-11/troubleshooting-runbook.md | 403 runbook |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー人数（solo 開発・必須レビュアー数 0） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | Phase 13 必須成果物 4 点 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 manual evidence + troubleshooting-runbook / Phase 12 compliance check が PASS していることを確認する。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. 機密情報 grep を実行し 0 件であることを確認する。
4. change-summary を user に提示し、**明示的な承認**を待つ。
5. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

### ステップ 2: local-check-result（PR 前ローカル確認 / placeholder）

`outputs/phase-13/local-check-result.md` に以下を記録する。

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# ビルド
mise exec -- pnpm build

# （任意）smoke route ローカル疎通の最終確認
cd apps/api
mise exec -- bash ../../scripts/with-env.sh pnpm wrangler dev &
sleep 3
curl -i -X GET 'http://localhost:8787/admin/smoke/sheets' \
  -H "Authorization: Bearer $SMOKE_ADMIN_TOKEN"
kill %1
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| build | exit 0 | 同上 |
| smoke 最終疎通 | HTTP 200 | 同上（任意） |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| 機密情報 grep | `grep -nE "ya29\.|-----BEGIN PRIVATE|client_email"` で 0 件 | 同上 |
| production deploy / write 系 API 痕跡 | 0 件 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` に以下構造で記述する。

#### 概要

UT-26 に基づき、Cloudflare Workers Edge Runtime から Google Sheets API v4 への end-to-end 疎通を実機検証するための仕様書 13 Phase および dev/staging 限定 smoke route `GET /admin/smoke/sheets` を整備する。fetch mock では検出不能だった JWT 署名（Web Crypto API / RSA-SHA256）・OAuth 2.0 token endpoint・`spreadsheets.values.get` の HTTP 200 取得・アクセストークン in-memory キャッシュ・401/403/429 エラー分類を保証し、403 発生時の 4 ステップ切り分け runbook（SA 共有 / JSON 改行 / Sheets API 有効化 / spreadsheetId 取り違え）を残す。

#### 動機

- GitHub Issue: #41 (CLOSED) — UT-26: Sheets API エンドツーエンド疎通確認
- 取扱い: **Re-link to closed issue #41 (UT-26)**（reopen せず仕様作成のみで履歴完結 / governance 採用）
- UT-09（Sheets→D1 同期ジョブ）が本番 Sheets API に安全アクセスできる前提を確立
- UT-10（エラーハンドリング標準化）に実機観測の 401/403/429 分類を渡す

#### 変更内容

**新規ファイル一覧（仕様書）**:

- `docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/index.md`
- `docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/artifacts.json`
- `docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-{01..13}/*`（成果物）

**新規ファイル一覧（実装側 / 想定）**:

- `apps/api/src/routes/admin/smoke-sheets.ts`（dev/staging 限定 smoke route）
- `apps/api/src/scripts/smoke-test-sheets.ts`（任意 / CLI 経路）
- `apps/api/test/admin/smoke/sheets.spec.ts`（unit + authorization）

**修正ファイル一覧（想定）**:

- `apps/api/wrangler.toml`（`[env.dev.vars]` / `[env.staging.vars]` で smoke route 関連 var 追加。`[env.production]` には未バインド）
- `apps/api/src/index.ts`（dev/staging のみ route 登録 / production では runtime 404 を返す）
- `.dev.vars.example`（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN`）
- `docs/30-workflows/LOGS.md` / `.claude/skills/aiworkflow-requirements/LOGS.md` / `.claude/skills/task-specification-creator/LOGS.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`（smoke route dev only 規約）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（403 切り分け 4 ステップ）
- `.claude/skills/aiworkflow-requirements/references/topic-map.md`

#### 動作確認

- Phase 11 manual smoke 9 項目すべて採取（local + staging / cache miss + hit / 401 / 403 + runbook 適用 / 429 観測 or N/A）
- 自動テスト: unit / contract / smoke / authorization 全 PASS（Phase 9 サマリー転記）
- production への deploy / write 系 API 呼び出しが 0 件（grep + git diff 双方で確認）

#### リスク・後方互換性

- **破壊的変更なし**（既存ルートに影響しない、新規 dev/staging 限定 route のみ追加）
- 新規 D1 テーブル: なし
- 新規 Cloudflare Secret: なし（UT-25 で配置済の `GOOGLE_SHEETS_SA_JSON` を参照のみ）
- 新規 Variable: `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN`（dev / staging のみ。production には設定しない）
- 後方互換性: 既存 API クライアントへの影響なし
- production には smoke route が mount されないことを compliance check で確認済

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/<task> であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . は使わない）
git add docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/ \
        docs/30-workflows/LOGS.md \
        .claude/skills/aiworkflow-requirements/LOGS.md \
        .claude/skills/task-specification-creator/LOGS.md \
        .claude/skills/aiworkflow-requirements/references/

# 実装側が含まれる場合のみ追加
# git add apps/api/src/routes/admin/smoke/ \
#         apps/api/src/scripts/smoke-test-sheets.ts \
#         apps/api/test/admin/smoke/ \
#         apps/api/wrangler.toml \
#         apps/api/src/index.ts \
#         .dev.vars.example

# コミット
git commit -m "$(cat <<'EOF'
feat(api): UT-26 Sheets API e2e smoke test spec + dev-only smoke route

- Phase 1〜13 仕様書整備（spec_created）
- dev/staging 限定 GET /admin/smoke/sheets（production 未バインド）
- 403 切り分け 4 ステップ runbook（SA 共有 / JSON 改行 / Sheets API / spreadsheetId）
- token cache（hit/miss）・401/403/429 エラー分類の実機検証手順
- same-wave sync (LOGS x2 / SKILL x2 / topic-map) + 二重 ledger 同期

Re-link to closed issue #41 (UT-26)
EOF
)"

# push
git push -u origin feat/<task-name>

# PR 作成
gh pr create \
  --title "feat(api): UT-26 Sheets API e2e smoke test (Re-link #41)" \
  --base dev \
  --head feat/<task-name> \
  --body "$(cat <<'EOF'
## 概要
UT-26 に基づき、Cloudflare Workers Edge Runtime から Google Sheets API v4 への end-to-end 疎通を実機検証するための仕様書 13 Phase と dev/staging 限定 smoke route を整備します。

## 動機
- GitHub Issue: #41 (CLOSED) — UT-26
- 取扱い: **Re-link to closed issue #41 (UT-26)** — reopen せず仕様作成のみで履歴完結（governance）
- UT-09 / UT-10 への前提整備

## 変更内容
- 新規: docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/ (Phase 1〜13 + outputs)
- 新規（実装が含まれる場合）: apps/api/src/routes/admin/smoke-sheets.ts / test
- 修正: wrangler.toml（dev/staging のみ）/ .dev.vars.example / LOGS x2 / SKILL references

## 動作確認
- Phase 11 manual smoke 9 項目（local + staging / cache hit / 401 / 403 + runbook）
- unit / contract / smoke / authorization 自動テスト 全 PASS
- production deploy / write 系 API 呼び出し 0 件

## リスク・後方互換性
- 破壊的変更なし（dev/staging only / production 未バインド）
- 新規 Secret なし（UT-25 配置済の GOOGLE_SHEETS_SA_JSON を参照のみ）
- Variable は dev/staging のみ設定

## 関連 Issue
Re-link to closed issue #41 (UT-26)
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `feat(api): UT-26 Sheets API e2e smoke test (Re-link #41)` |
| body | 概要 / 動機 / 変更内容 / 動作確認 / リスク・後方互換性 / 関連 Issue（上記参照） |
| reviewer | solo 開発のため必須レビュアー数 0（CLAUDE.md ブランチ戦略 / `required_pull_request_reviews=null`） |
| base | `dev`（推奨） → 後段で `main` へ昇格 |
| head | `feat/<task-name>`（feature → dev → main） |
| labels | `area:api` / `task:UT-26` / `wave:1` / `docs` |
| linked issue | #41 (CLOSED) — Re-link only / `Closes #41` は使わない（既に CLOSED のため） |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`dev` から `main` への昇格 PR を別途作成する。
- マージ完了後、artifacts.json の Phase 1〜12 を `completed` に更新（Phase 13 は完了時点で `completed`）。
- Issue #41 (CLOSED) には PR 番号と仕様書リンクの comment のみを残し、reopen はしない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | manual smoke 結果と troubleshooting-runbook を PR の動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 / Issue #41 CLOSED governance を承継 |

## Phase 13 必須成果物 4 点

| 成果物 | パス | 承認前の扱い |
| --- | --- | --- |
| local check | outputs/phase-13/local-check-result.md | typecheck / lint / build / smoke 最終確認の実行計画または実測を記録 |
| change summary | outputs/phase-13/change-summary.md | PR description 草案を記録し、ユーザー承認前に提示 |
| PR info | outputs/phase-13/pr-info.md | 承認前は blocked、PR 作成後に URL / CI 状態を記録 |
| PR creation result | outputs/phase-13/pr-creation-result.md | 承認前は blocked、PR 作成後に実行ログを記録 |

## 多角的チェック観点

- 価値性: PR が Issue #41 を re-link し、AC-1〜AC-11 の証跡へリンクできているか。
- 実現性: local-check-result が typecheck / lint / build すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が dev → main 昇格時に必要十分な情報を含むか。
- 認可境界: コミット差分に Bearer token / SA JSON / private_key / client_email / 完全な spreadsheetId が混入していないか（grep）。
- 後方互換性: 既存ルート / 既存テーブルに破壊的変更が無いことを diff レビューで再確認したか。
- production 安全性: `[env.production]` に smoke route が mount されないこと、`--env production` deploy が一切行われていないこと。
- governance: Issue #41 CLOSED に対する re-link 取扱が PR 本文・コミットメッセージの両方で明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | approval_required | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/build） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | production deploy / write 痕跡 grep | 13 | spec_created | 0 件 |
| 5 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 6 | branch / commit / push | 13 | spec_created | 承認後のみ |
| 7 | gh pr create | 13 | spec_created | base=dev / head=feat / Re-link #41 |
| 8 | CI 確認 | 13 | spec_created | gh pr checks |
| 9 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |
| 10 | Issue #41 への comment（仕様書 + PR リンク / reopen 禁止） | 13 | spec_created | governance 維持 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 本体サマリー |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint / build / smoke 最終確認 |
| ドキュメント | outputs/phase-13/change-summary.md | PR description 草案 |
| ドキュメント | outputs/phase-13/pr-info.md | PR URL / CI 結果（承認前 blocked） |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 作成プロセス実行ログ（承認前 blocked） |
| PR | user 承認後に作成 | UT-26 仕様書 + smoke route PR（Re-link #41） |
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / build 全 PASS
- [ ] 機密情報 grep が 0 件（SA JSON / Bearer / private_key / client_email / 完全な spreadsheetId）
- [ ] production deploy / write 系 API 痕跡が 0 件
- [ ] change-summary が PR body と一致している
- [ ] Phase 13 必須成果物 4 点（local-check-result / change-summary / pr-info / pr-creation-result）が揃っている
- [ ] PR が作成され Issue #41 に re-link されている（`Closes #41` ではなく "Re-link to closed issue #41 (UT-26)"）
- [ ] CI（`gh pr checks`）が green
- [ ] solo 開発ポリシーに従い必須レビュアー数 0 で merge 可能（CLAUDE.md 準拠）
- [ ] マージ後、Issue #41 へ PR + 仕様書リンクの comment が残されている（reopen はしない）
- [ ] マージ後、artifacts.json の全 Phase が `completed`

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`（Task 1 のみ `approval_required`）
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- マージ操作は user の領域として明確に分離されている
- Issue #41 CLOSED governance（reopen せず re-link のみ）が PR 本文・commit message の双方で明示
- artifacts.json の `phases[12].user_approval_required = true`、`status = approval_required`

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、UT-09 で本番 Sheets API への同期ジョブ実装を着手可能
  - UT-10 へ実機観測の 401/403/429 分類を提供
  - production post-deploy smoke は UT-09 後段（09b-cron-runbook 等）に委譲
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - production deploy / write 痕跡が検出された（→ 即時停止 / Phase 5 / 11 再設計）
  - Issue #41 を誤って reopen した（→ 即時 close / governance 違反として記録）
