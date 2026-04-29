# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | docs-only / direction-reconciliation（PR creation / approval gate） |
| taskType | docs-only |
| docsOnly | true |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true** |
| Issue | #94 (CLOSED — 再オープンしない / `Refs #94` で参照のみ) |
| タスク状態 | blocked（採用方針確定 / docs-only 境界 / 運用ルール 2 件の遵守を本 PR の前提とする） |

## 重要な前置き（実行可否の明示）

> **本タスクは reconciliation の docs-only 文書化が目的であり、本タスク内での `git commit` / `git push` / `gh pr create` は禁止である。**
> Phase 13 仕様書自体は PR 作成手順を記述するが、実行は **user の明示承認後** に限る。
>
> **選択肢**: reconciliation 結果（仕様書一式）を PR 化する経路は 2 通りある。
>
> 1. **本タスクの Phase 13 で実行**: user 明示承認を得たうえで、本仕様書のステップ 4〜6 をそのまま実行する。
> 2. **採用方針確定後の独立タスク化**: reconciliation 仕様書を PR 化するタスク自体を別 unassigned-task として切り出し、本タスクは `spec_created` で close-out する。
>    - この場合、本 Phase 13 の実行は新規タスクへ移送し、本タスクの artifacts.json では `phases[12].status = spec_created` のまま維持する。
>    - reconciliation 結果がコード撤回・migration down と独立して PR されること（unrelated 削除混入防止 / 運用ルール 2）を担保しやすい。
>
> いずれを選ぶかは user の判断とし、Claude Code は明示指示が無い限り **選択肢 2 を default** としてステップ 4〜6 を実行しない。

## 目的

Phase 1〜12 の成果物（仕様書 13 Phase + index + outputs + artifacts.json + skill 同期）をまとめて PR を作成し、
**ユーザーの明示的な承認を経て** レビュー → マージへ進める。
承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。
Issue #94 は CLOSED のまま扱い、PR body では `Refs #94` として参照する（`Closes #94` は使用しない）。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。
> Claude Code は本 Phase の commit / push / `gh pr create` を **絶対に自走実行しない**。
> user が「reconciliation 仕様書の PR を作ってよい」と明示的に指示した場合に限りステップ 5〜6 を実行する。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| 採用方針確定 | base case = 案 a（採用 A）が Phase 3 / Phase 10 で確定 | 要確認 |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO（MAJOR ゼロ）| 要確認 |
| Phase 11 manual evidence | docs-only / NON_VISUAL のため smoke は文書照合のみ。証跡採取済み | 要確認 |
| Phase 12 必須 6 成果物 | implementation-guide / system-spec-update-summary / changelog / unassigned-task / skill-feedback / compliance-check | 要確認 |
| Phase 12 compliance check | 全 PASS | 要確認 |
| Phase 12 same-wave sync | workflow LOG / SKILL ×2 / topic-map / active guide | 要確認 |
| Phase 12 二重 ledger 同期 | root + outputs の artifacts.json（docs_only=true）| 要確認 |
| Phase 12 Step 2 条件分岐 | A 維持で stale 撤回発火 / B 採用なら広範囲発火（user 承認別途）| 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | SA JSON / Bearer / op:// 解決済み実値 / session cookie 値が無い | 要確認 |
| Issue #94 ステータス | CLOSED のまま / 再オープンしない | 要確認 |
| docs-only 境界 | apps/ / packages/ / migrations/ / wrangler.toml の差分が本 PR に混入していない | 要確認 |
| unrelated 削除混入なし | unrelated verification-report 削除が本 PR に含まれていない | 要確認 |
| pending と PASS の混同なし | 仕様書全体で pending と PASS が誤記されていない | 要確認 |
| Phase 13 実行経路の確定 | 「本タスクで PR」 or 「独立タスクに切り出し」のいずれを user が選んだか | **user 承認待ち** |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。
> user の承認は「reconciliation 仕様書の PR を作ってください」のような明示的指示で取得する。曖昧な合意では実行しない。
> 「独立タスクに切り出す」選択を user が指示した場合、ステップ 5〜6 は実行せず、本タスクは Phase 12 完了で close-out する。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. Phase 13 実行経路（本タスクで PR / 独立タスクに切り出し）を user に確認する。
3. local-check（typecheck / lint / test / spec validate）を実行・記録する（docs-only でも skill 同期で TypeScript / lint 影響が無いことを確認）。
4. 機密情報 grep + docs-only 境界 grep（apps/ や migrations/ の混入チェック）を実行する。
5. change-summary（PR description 草案）を作成する。
6. **user 承認後**、ブランチ作成 → コミット粒度ごとに commit → push → PR 作成を実行する。
7. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
8. main マージ後のクローズアウト動線を記録する（reconciliation 後段の unassigned-task 連鎖発火を含む）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/outputs/phase-12/unassigned-task-detection.md | reconciliation 後段の連鎖タスク発火 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/outputs/phase-11/main.md | docs-only smoke（文書照合）サマリー |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/index.md | PR タイトル / 説明根拠 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case = 案 a / 運用ルール 2 件 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー人数 / scripts/cf.sh ルール |
| 必須 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | UT-09 reconciliation 原典 spec |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. base case = 案 a / Phase 10 GO / Phase 12 必須 6 成果物 + compliance check が PASS していることを確認する。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. change-summary を user に提示し、**明示的な承認**を待つ。
4. 同時に **Phase 13 実行経路**（本タスクで PR / 独立タスクに切り出し）の判断を user から取得する。
5. 「本タスクで PR」を user が選んだ場合のみステップ 2 へ進む。「独立タスクに切り出し」を選んだ場合は本タスクをここで close-out（`spec_created`）し、新規 unassigned-task `task-ut09-reconciliation-pr-001` を Phase 12 unassigned-task-detection に追記する。

> **Claude Code は user 明示承認前にステップ 2 以降を実行しない**。
> ステップ 2 (typecheck/lint/test/validate) は read-only 系だが、PR 作成 ワークフロー全体としての user 承認に紐付けて実行する。

### ステップ 2: local-check（PR 前ローカル確認 / docs-only でも skill 同期影響を確認）

```bash
# 型チェック（docs-only でも skill 同期で型影響が無いことを確認）
mise exec -- pnpm typecheck

# Lint（同上）
mise exec -- pnpm lint

# テスト（spec ledger / skill 同期に依存するテストの確認）
mise exec -- pnpm test --run --passWithNoTests

# 仕様書 ledger / spec validate
node scripts/validate-phase-output.js --task ut09-direction-reconciliation
node scripts/verify-all-specs.js
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/local-check-result.md §local-check |
| lint | exit 0 | 同上 |
| test（spec / skill 関連のみ）| 全 PASS（docs-only のため app テストは無関係）| 同上 |
| validate-phase-output.js | exit 0 | 同上 |
| verify-all-specs.js | exit 0 | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |

### ステップ 3: 機密情報 grep + docs-only 境界 grep（必須）

```bash
# 機密情報の混入チェック
git diff --cached | grep -nE "ya29\.|-----BEGIN PRIVATE|ubm-hyogo-sheets-reader@.*credentials|sk-[A-Za-z0-9]{20,}|authjs\.session-token=[A-Za-z0-9]" || echo "OK: secret leak none"

# 1Password vault 解決済み実値（op:// 参照は OK だが解決済み実値は NG）
git diff --cached | grep -nE "GOOGLE_(SHEETS|FORMS)_SA_JSON=.{50,}|SYNC_ADMIN_TOKEN=[A-Za-z0-9]{16,}" || echo "OK: env leak none"

# docs-only 境界の確認: apps/ / packages/ / migrations/ / wrangler.toml の混入チェック
git diff --cached --name-only | grep -E "^(apps/|packages/|migrations/|wrangler\.toml)" && echo "NG: code/migration/wrangler in docs-only PR" || echo "OK: docs-only boundary intact"

# unrelated verification-report 削除の混入チェック（運用ルール 2）
git diff --cached --name-only | grep -E "verification-report" && echo "NG: unrelated verification-report mixed" || echo "OK: no unrelated cleanup"
```

- 期待:
  - 機密情報 grep: 0 件
  - docs-only 境界 grep: 0 件（apps/ / packages/ / migrations/ / wrangler.toml の差分なし）
  - unrelated 削除 grep: 0 件
- 検出時: 即時停止 / Phase 12 secret hygiene / docs-only 境界 / 運用ルール 2 のいずれかに差し戻し。

### ステップ 4: change-summary（PR description 草案）

`outputs/phase-13/change-summary.md` に以下構造で記述する。

#### 概要

UT-09 direction reconciliation（GitHub Issue #94, CLOSED）に基づき、`task-sync-forms-d1-legacy-umbrella-001` で確定した
current Forms 分割方針と、本ワークツリーで進行した Sheets API 直接実装の二重正本を解消する。
本 PR は **docs-only / NON_VISUAL** であり、reconciliation 設計（base case = 案 a / 採用 A）と 5 文書同期チェック手順、
撤回 / 移植マッピング、選択肢 A / B 比較マトリクス、30 種思考法レビュー、運用ルール 2 件、Phase 12 必須 6 成果物を仕様書化する。

実コード撤回・migration down・Cloudflare Secret 削除・aiworkflow-requirements references の書き換えは
**本 PR には含めず**、Phase 12 unassigned-task-detection.md で 10 件の別タスクとして登録済み。

#### 動機

- GitHub Issue: #94 (CLOSED) — UT-09 direction reconciliation
- 本ワークツリーに追加された Sheets API 直接実装（`apps/api/src/jobs/sync-sheets-to-d1.ts` 系・`apps/api/src/routes/admin/sync.ts` / `sync_locks` + `sync_job_logs` migration）と
  current 方針（Forms API 分割 / `sync_jobs` ledger / `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint）の二重正本を解消する。
- 二重正本のまま PR 化すると 03a / 03b / 04c / 09b の正本が壊れ、後続タスクが連鎖 blocked 化するため、
  reconciliation を **PR 経路の必須前提** として docs-only で確定する。

#### 変更内容

**仕様書 / ドキュメント**:

- `docs/30-workflows/ut09-direction-reconciliation/`（Phase 1〜13 + index.md + artifacts.json + outputs/）
- `docs/30-workflows/LOGS.md`（UT-09 reconciliation 完了行追加）
- `- `
**双方向リンク追記**:

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md`
- `docs/30-workflows/02-application-implementation/03a-.../index.md`
- `docs/30-workflows/02-application-implementation/03b-.../index.md`
- `docs/30-workflows/02-application-implementation/04c-.../index.md`
- `docs/30-workflows/09b-.../index.md`
- `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md`
- `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md`

**含めないもの（運用ルール / docs-only 境界 / 別タスク化）**:

- `apps/api/src/jobs/sync-sheets-to-d1.ts` 系の削除（→ `task-ut09-sheets-impl-withdrawal-001`）
- `apps/api/src/routes/admin/sync.ts` 単一 endpoint の削除（同上）
- migration `sync_locks` / `sync_job_logs` down（→ `task-ut09-sheets-migration-withdrawal-001`）
- Cloudflare Secret `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` の削除（→ `task-ut09-sheets-secrets-withdrawal-001`）
- 旧 UT-09 root の direct implementation 化記述の撤回（→ `task-ut09-legacy-umbrella-restore-001`）
- references stale audit（→ `task-ut09-references-stale-audit-001`）
- unrelated verification-report 削除（→ `task-verification-report-cleanup-001`）

> 上記 10 件は Phase 12 unassigned-task-detection.md に登録済み。本 PR では参照のみ。

#### 動作確認（docs-only / NON_VISUAL）

- `validate-phase-output.js` exit 0
- `verify-all-specs.js` exit 0
- `mise exec -- pnpm typecheck` exit 0（skill 同期に型影響なし）
- `mise exec -- pnpm lint` exit 0
- `git status` で `apps/` / `packages/` / `migrations/` / `wrangler.toml` 差分なし
- `git diff --cached` に SA JSON / Bearer / op:// 解決値 / verification-report 削除なし
- 5 文書同期チェック表（Phase 2 / 9）が legacy umbrella / 03a / 03b / 04c / 09b すべてカバー

#### リスク・後方互換性

- **破壊的変更なし**（コード差分なし / 仕様書追加のみ）
- 後続 10 件の unassigned-task で実コード撤回 / migration down / Secret 削除を順次実施する想定
- 03a / 03b / 04c / 09b の正本は無変更（A 採用のため）
- Issue #94 は CLOSED のまま、`Refs #94` で参照（`Closes #94` 不可）

`outputs/phase-13/change-summary.md` に同等の文面を保存する。

### ステップ 5: コミット粒度・branch / commit / push（user 承認後のみ）

コミット粒度は以下の単位で分離し、レビューしやすい順に積む。

| # | コミット | 含むファイル |
| --- | --- | --- |
| 1 | `docs(workflows): UT-09 direction reconciliation phase 1-13 specifications` | docs/30-workflows/ut09-direction-reconciliation/ 配下全体 |
| 2 | `docs(workflows): UT-09 reconciliation outputs (phase-01..13)` | docs/30-workflows/ut09-direction-reconciliation/outputs/ 配下 |
| 3 | `docs(workflows): UT-09 reconciliation cross-links to legacy umbrella / 03a / 03b / 04c / 09b / ut-09 / ut-21` | 関連 7 タスクの index.md リンク追記予定 |
| 4 | `docs(skills): UT-09 reconciliation same-wave sync (SKILL x2 / topic-map / active guide)` | .claude/skills/aiworkflow-requirements/SKILL.md / indexes/topic-map.md / references/task-workflow-active.md / .claude/skills/task-specification-creator/SKILL.md |
| 5 | `docs(workflows): UT-09 LOGS.md completion row` | docs/30-workflows/LOGS.md |

```bash
# 現在のブランチが feat/ut09-direction-reconciliation であることを確認
git status
git branch --show-current

# 例: 1 番目のコミット
git add docs/30-workflows/ut09-direction-reconciliation/phase-*.md \
        docs/30-workflows/ut09-direction-reconciliation/index.md \
        docs/30-workflows/ut09-direction-reconciliation/artifacts.json
git commit -m "$(cat <<'EOF'
docs(workflows): UT-09 direction reconciliation phase 1-13 specifications

current Forms 分割方針と Sheets API 直接実装の二重正本を解消する
reconciliation の docs-only 仕様書を Phase 1〜13 で作成。base case = 案 a
（採用 A / current Forms 分割方針へ寄せる）を MAJOR ゼロ・MINOR ゼロで確定。

Refs #94
EOF
)"

# ... 残りの 4 コミットも同様に粒度ごとに作成

# push (user 操作後のみ)
git push -u origin feat/ut09-direction-reconciliation
```

### ステップ 6: PR 作成（user 承認後のみ）

```bash
gh pr create \
  --title "docs(workflows): UT-09 direction reconciliation (Refs #94)" \
  --base dev \
  --head feat/ut09-direction-reconciliation \
  --body "$(cat <<'EOF'
## Summary

- UT-09 direction reconciliation: current Forms 分割方針 vs Sheets API 直接実装の二重正本を解消（docs-only / NON_VISUAL）
- base case = 案 a（採用 A / current Forms 分割方針へ寄せる / MAJOR ゼロ・MINOR ゼロ）を Phase 3 / Phase 10 で確定
- 5 文書同期チェック手順（legacy umbrella / 03a / 03b / 04c / 09b）/ 撤回・移植マッピング / 選択肢 A・B 比較 / 30 種思考法レビュー / 運用ルール 2 件 を仕様書化
- 実コード撤回・migration down・Cloudflare Secret 削除・references 書き換えは **本 PR に含めず**、10 件の unassigned-task として登録済み

## Test plan

- [ ] `mise exec -- pnpm typecheck` が exit 0
- [ ] `mise exec -- pnpm lint` が exit 0
- [ ] `node scripts/validate-phase-output.js --task ut09-direction-reconciliation` が exit 0
- [ ] `node scripts/verify-all-specs.js` が exit 0
- [ ] `git status` で `apps/` / `packages/` / `migrations/` / `wrangler.toml` 差分が 0
- [ ] `git diff --cached` に SA JSON / Bearer / op:// 解決値 / verification-report 削除が 0
- [ ] 5 文書同期チェック表が legacy umbrella / 03a / 03b / 04c / 09b 全カバー
- [ ] Phase 12 必須 6 成果物（implementation-guide / system-spec-update-summary / changelog / unassigned-task-detection / skill-feedback / compliance-check）が `outputs/phase-12/` に揃っている
- [ ] same-wave sync（workflow LOG / SKILL ×2 / topic-map / active guide）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が `docs_only=true` / `taskType=docs-only` で同期
- [ ] Issue #94 が CLOSED のまま（`Closes #94` を使用していない）

## Linked Issue

Refs #94 (CLOSED — 仕様書化のため再オープンせず参照のみ)

## Risk / 後方互換性

- 破壊的変更なし（コード差分なし / 仕様書追加のみ）
- 後続 10 件の unassigned-task で実コード撤回・migration down・Secret 削除・references stale audit・unrelated verification-report 削除を順次実施する想定
- 03a / 03b / 04c / 09b の正本は無変更（A 採用のため）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

`outputs/phase-13/pr-info.md` に上記 PR タイトル / body / labels を記録し、
PR 作成結果（PR 番号 / URL / CI 状態）を `outputs/phase-13/pr-creation-result.md` に記録する。

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(workflows): UT-09 direction reconciliation (Refs #94)` |
| body | Summary / Test plan / Linked Issue / Risk（上記 HEREDOC） |
| reviewer | solo 開発のため 0（CLAUDE.md ブランチ戦略・CI gate のみで保護） |
| base | `dev`（推奨） → 後段で `main` へ昇格 PR を別途作成 |
| head | `feat/ut09-direction-reconciliation` |
| labels | `area:docs` / `task:UT-09-reconciliation` / `wave:reconciliation` / `type:docs-only` |
| linked issue | #94（`Refs #94` のみ。`Closes #94` は使用しない / Issue は CLOSED のまま） |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

## main マージ後のクローズアウト動線

1. `dev` → `main` 昇格 PR を作成（solo 運用のため reviewer 0 / CI gate + 線形履歴で保護）。
2. main マージ後、artifacts.json の全 Phase を `completed` に更新（root + outputs の二重 ledger 同期）。
   - `task.metadata.docsOnly = true` / `taskType = docs-only` / `visualEvidence = NON_VISUAL` を維持。
   - `task.metadata.status = merged`（`task-sync-forms-d1-legacy-umbrella-001` 系の関連タスクへ反映完了後）。
3. **コード撤回 / migration down / Secret 削除は本 PR に含まれない**。Phase 12 unassigned-task-detection.md の 10 件を順次起票する:
   - `task-ut09-sheets-impl-withdrawal-001`
   - `task-ut09-sheets-migration-withdrawal-001`
   - `task-ut09-sheets-secrets-withdrawal-001`
   - `task-ut09-legacy-umbrella-restore-001`
   - `task-ut09-references-stale-audit-001`
   - `task-verification-report-cleanup-001`
   - `task-ut09-d1-contention-mitigation-port-001`（03a / 03b / 09b への移植）
4. 03a / 03b / 04c / 09b の各タスク index.md に reconciliation 結論（base case = 案 a）の参照行が反映されていることを確認。
5. Issue #94 は **CLOSED のまま**。クローズアウト記録は Phase 12 で追加済みのコメントで完了とする。
6. `bash scripts/cf.sh` 経由でない `wrangler` 直接実行が後続 unassigned-task で発生していないかを定期確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | docs-only smoke（文書照合）結果を PR 動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 / unassigned-task-detection 10 件の連鎖発火を main マージ後に管理 |

## 多角的チェック観点

- 価値性: PR が UT-09 の二重正本を解消し、Phase 11 / 12 証跡へリンクできているか。
- 実現性: local-check が typecheck / lint / spec validate すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が dev → main 昇格時の reviewer / CI gate に必要十分な情報を含むか。
- docs-only 境界: コミット差分に `apps/` / `packages/` / `migrations/` / `wrangler.toml` が混入していないか（grep）。
- Secret hygiene: コミット差分に SA JSON / Bearer / op:// 解決値が混入していないか（grep）。
- unrelated 削除混入なし: verification-report 削除が混入していないか（grep / 運用ルール 2）。
- pending と PASS 区別: PR 文 / 仕様書全体で staging smoke pending と PASS が混同されていないか（運用ルール 1）。
- Issue 整合: `Closes #94` を使わず `Refs #94` で参照しているか（Issue を再オープンしていないか）。
- CLI 規約: `wrangler` 直接実行ではなく `bash scripts/cf.sh` 経由を後続タスクへ引き継いでいるか。
- Phase 13 経路: 「本タスクで PR / 独立タスクに切り出し」のいずれを user が選んだか明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 明示承認必須** |
| 2 | Phase 13 実行経路の確認 | 13 | spec_created | 本タスク or 独立タスク化 |
| 3 | local-check（typecheck/lint/test/validate） | 13 | spec_created | 全 PASS |
| 4 | 機密情報 grep + docs-only 境界 grep | 13 | spec_created | 0 件 |
| 5 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 6 | コミット粒度ごとに commit | 13 | spec_created | 5 コミット予定 |
| 7 | branch / push | 13 | spec_created | 承認後のみ |
| 8 | gh pr create | 13 | spec_created | base=dev / head=feat / `Refs #94` |
| 9 | CI 確認 | 13 | spec_created | gh pr checks |
| 10 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |
| 11 | main マージ後クローズアウト動線 | 13 | spec_created | 10 件の unassigned-task 連鎖発火 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint / test / validate 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | PR description 草案 + 変更ファイルリスト + docs-only 境界確認 |
| ドキュメント | outputs/phase-13/pr-info.md | PR タイトル / body / labels / base / head |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 番号 / URL / CI 状態 / 承認ログ / クローズアウト動線 |
| PR | user 承認後に作成（or 独立タスクへ移送）| UT-09 reconciliation 仕様書 PR（`Refs #94` / Issue は CLOSED のまま）|
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed）|

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] Phase 13 実行経路（本タスクで PR / 独立タスクに切り出し）が user 判断で確定
- [ ] local-check-result が typecheck / lint / test / validate / verify 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] docs-only 境界 grep が 0 件（apps/ / packages/ / migrations/ / wrangler.toml 差分なし）
- [ ] unrelated verification-report 削除 grep が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #94 に `Refs #94` で紐付いている（Issue は CLOSED のまま）/ または独立タスクへ移送済み
- [ ] CI（`gh pr checks`）が green
- [ ] コミット粒度が 5 単位で分離されている
- [ ] マージ後、artifacts.json の全 Phase が `completed`
- [ ] main マージ後のクローズアウト動線（10 件の unassigned-task 連鎖発火）が記録されている
- [ ] `wrangler` 直接実行が一切無く、`bash scripts/cf.sh` 経由のみが後続タスクへ引き継がれている
- [ ] pending と PASS が仕様書全体で混同されていない（運用ルール 1）

## タスク100%実行確認【必須】

- 全実行タスク（11 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- マージ操作・production deploy は user の領域として明確に分離されている
- Issue #94 を CLOSED のまま扱い、`Closes #94` を使わず `Refs #94` で参照する設計になっている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`、`task.metadata.docsOnly = true`
- 「本タスクで PR / 独立タスクに切り出し」の 2 経路が冒頭で明示されている

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、Phase 12 unassigned-task-detection.md の 10 件を順次起票する。
  - 03a / 03b / 09b へ D1 contention mitigation 知見を移植する別タスクを発火する。
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。
  - reconciliation 後段で `merged` ステータスへ遷移するタイミング（関連 5 タスクへの反映完了時）を user に通知する。
  - 「pending と PASS の混同防止」運用ルールを task-specification-creator skill 改善（Phase 12 skill-feedback）として継続。
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない（厳守）
  - 「独立タスクに切り出し」を user が選んだ場合、ステップ 5〜6 を実行しない
  - local-check のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - 機密情報 grep / docs-only 境界 grep / unrelated 削除 grep で 1 件以上検出（→ 即時停止 / 該当 Phase へ差し戻し）
  - Issue #94 を誤って再オープン / `Closes #94` で誤って再 close を試みた
  - `wrangler` 直接実行が後続タスクで混入した（→ `scripts/cf.sh` 経由に修正）
  - apps/ や migrations/ の差分が本 PR に混入（→ 該当 unassigned-task に切り出し）
  - 採用方針 B（Sheets 採用）を user 承認なしで base case にしようとした
