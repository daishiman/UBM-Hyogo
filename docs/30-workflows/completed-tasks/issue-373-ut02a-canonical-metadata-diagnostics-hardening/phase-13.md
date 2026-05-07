# Phase 13: PR 作成 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は user 承認後に commit / push / `gh pr create` を実行し GitHub に副作用を伴う。CI gate（typecheck / lint / verify-static-manifest / verify-indexes-up-to-date）の通過まで watch する。CONST_004 により実 GitHub への副作用 + repo コミット成果物 → 実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373（CLOSED 状態だが本タスクで followup 実装としてリンク）|
| phase | 13 / 13 |
| 目的 | 二重承認 gate 経由で commit / push / PR 作成し、CLOSED 状態の Issue #373 には `Refs #373` としてリンクする |
| 依存 phase | 12（ドキュメント更新完了） |
| 成果物 | `outputs/phase-13/{main.md, local-check-result.md, change-summary.md, pr-info.md, pr-creation-result.md}` + 実 PR |
| user_approval_required | **true（二重承認 gate）** |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 12 完了後、G1/G2 の独立 user approval を得た場合のみ commit / push / PR 作成を実行し、Issue #373 には `Refs #373` としてリンクする。

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-info.md`
- `outputs/phase-13/pr-creation-result.md`
- user approval 後に作成される PR URL

## 実行タスク

- [ ] G1（最終ローカル検証承認）と G2（commit/push/PR 作成承認）の **2 段階 user 承認**を独立した発言で取得する
- [ ] commit / push / `gh pr create` を G2 承認後にのみ実行する
- [ ] G1 / G2 timestamp と PR URL / CI 結果を `outputs/phase-13/main.md` に記録する
- [ ] `--no-verify`、force-push、admin merge を使わず branch protection に従う
- [ ] 完了後に `artifacts.json` の `phase-13.status` を `completed` に更新する

## 二重承認 gate（NON_VISUAL でも独立 user 承認が必要）

| Gate | 対象 | 直前提示 | 取得方法 |
| --- | --- | --- | --- |
| **G1** | 最終ローカル検証実行（pnpm install --force / typecheck / lint / verify-static-manifest / git status 確認） | 実行コマンド一覧 + 期待結果 + 差分要約 | user に「G1 承認しますか」と明示確認 |
| **G2** | commit / push / `gh pr create` 実行 | branch 名 / commit 単位 / PR タイトル / PR 本文ドラフト / rollback 手順 | user に「G2 承認しますか」と独立発言で確認 |

> **重要**: G1 と G2 は同一 user 発言で代替不可。各 gate ごとに独立した「承認します」発言と timestamp を取得する。包括承認・合算承認は禁止（CLAUDE.md solo 運用ポリシー / Phase 10 reviewer 観点 A5 と整合）。

## 実行手順

### Step 1（G1 取得前の準備）

```bash
# 1.1 status / diff
git status
git diff main...HEAD --name-only

# 1.2 placeholder / 先送り grep
grep -RE 'NOT_EXECUTED|TODO|FIXME|別 PR|将来タスク' \
  docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/

# 1.3 artifacts.json parity
test ! -e docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/artifacts.json
jq -e '.task_path == "docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening"' \
  docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/artifacts.json
```

`outputs/phase-13/local-check-result.md` に上記出力（grep 0 hit / `outputs/artifacts.json` 不在かつ root-only 正本確認 / 変更ファイル一覧）を記録。

### Step 2（G1 提示と承認取得）

user に提示する内容:

```
G1: 最終ローカル検証承認
- 実行予定: pnpm install --force / pnpm typecheck / pnpm lint / pnpm verify:static-manifest
- 期待結果: 全 exit 0
- 変更ファイル数: <N> 件（git diff main...HEAD --name-only より）
- placeholder grep: 0 hit
- artifacts.json parity: `outputs/artifacts.json` は本 workflow では作成せず root `artifacts.json` が唯一正本
承認しますか?
```

承認取得後、`outputs/phase-13/main.md` に G1 timestamp + 承認テキスト転写を記録。

### Step 3（G1 承認後のローカル検証）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:static-manifest
mise exec -- pnpm regenerate:static-manifest && git diff --exit-code apps/api/src/repository/_shared/generated/static-manifest.json
```

すべて exit 0 であることを `local-check-result.md` に追記。

CLAUDE.md「PR 作成の完全自律フロー」§品質検証失敗時の自動修復 に従い最大 3 回まで自動修復 commit を追加可能。`--no-verify` は使用しない。

### Step 4（G2 提示と承認取得）

user に提示する内容:

```
G2: commit / push / PR 作成承認
- branch: feat/issue-373-ut02a-canonical-metadata-diagnostics-hardening
- base: main
- commit 単位: 後述 4 commit（または single commit 集約）
- PR タイトル: feat: UT-02A canonical metadata diagnostics hardening (Refs #373)
- PR 本文ドラフト: 後述テンプレ
- rollback: git revert <merge_sha>
承認しますか?
```

承認取得後、`outputs/phase-13/main.md` に G2 timestamp + 承認テキスト転写を独立行で記録。

### Step 5（G2 承認後の commit / push / PR）

```bash
# branch 確認（既に feat/issue-373-* にいる前提）
git branch --show-current

# commit（4 commit 戦略を採用する場合）
git add scripts/verify-static-manifest.mjs scripts/regenerate-static-manifest.mjs package.json
git commit -m "feat(_shared): add verify/regenerate scripts for static manifest stale detection (Issue #373)"

git add apps/api/src/repository/_shared/generated/static-manifest.json apps/api/src/repository/_shared/builder.ts apps/api/src/repository/_shared/metadata.ts
git commit -m "feat(api/_shared): manifest schema sourceSpecHash + UBM-MANIFEST-UNKNOWN-KEY logWarn (Issue #373)"

git add apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts apps/api/src/repository/_shared/metadata.test.ts apps/api/src/repository/_shared/builder.test.ts
git commit -m "test(api/_shared): alias-queue-adapter contract test + manifest hash drift simulation (Issue #373)"

git add .github/workflows/ci.yml docs/00-getting-started-manual/specs/01-api-schema.md docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/ .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
git commit -m "docs(spec): static-manifest retirement section + CI verify gate + task-workflow-active sync (Refs #373)"

# push
git push -u origin feat/issue-373-ut02a-canonical-metadata-diagnostics-hardening

# PR 作成
gh pr create --title "feat: UT-02A canonical metadata diagnostics hardening (Refs #373)" --body "$(cat <<'EOF'
## Summary
- Issue #373 (UT-02A-FU-DIAG-001) UT-02A canonical metadata baseline の暫定運用化を実装
- manifest stale detection (verify-static-manifest.mjs) と決定論的再生成 (regenerate-static-manifest.mjs) を追加
- buildSectionsWithDiagnostics の unknown stable key 件数を `code: "UBM-MANIFEST-UNKNOWN-KEY"` 構造化ログ化
- alias-queue-adapter contract test を fake adapter ベースで先行配備（03a 本体実装の interface 固定）
- static-manifest.json retirement 条件を `docs/00-getting-started-manual/specs/01-api-schema.md` に正本反映
- CI に `verify-static-manifest` gate を追加

## 変更内容
- `scripts/verify-static-manifest.mjs`（新規）
- `scripts/regenerate-static-manifest.mjs`（新規）
- `apps/api/src/repository/_shared/generated/static-manifest.json`（schema 拡張: sourceSpecHash / sourceSpecVersion）
- `apps/api/src/repository/_shared/builder.ts`（logWarn 1 経路追加）
- `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`（新規・4 ケース）
- `apps/api/src/repository/_shared/metadata.test.ts` / `builder.test.ts`（hash drift / logWarn assertion 追加）
- `.github/workflows/backend-ci.yml`（verify-static-manifest step 追加）
- `package.json`（verify:static-manifest / regenerate:static-manifest scripts）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（retirement 節追記）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（current root / 実装状態同期）

## Phase 11 evidence（NON_VISUAL）
- outputs/phase-11/evidence/verify-static-manifest.log
- outputs/phase-11/evidence/regenerate-determinism.log
- outputs/phase-11/evidence/builder-diagnostics-sample.json
- outputs/phase-11/evidence/test-results.log

## DoD チェック
- [ ] pnpm typecheck / lint / verify-static-manifest 全 GREEN
- [ ] regenerate 2 連続 byte-identical
- [ ] alias-queue-adapter contract test 全 case PASS
- [ ] manifest hash drift simulation で verify が FAIL を返す
- [ ] retirement 条件が `01-api-schema.md` に追記済
- [ ] task-workflow-active.md が current root と実装完了状態を同期
- [ ] CONST_007 先送り表現 0 件
- [ ] 不変条件 #1 / #5 / #14 抵触なし

## Test plan
- [ ] CI typecheck job が green
- [ ] CI lint job が green
- [ ] CI verify-static-manifest job が green（新規追加 gate の初回実行）
- [ ] CI verify-indexes-up-to-date job が green
- [ ] apps/api 単体テスト（_shared）が green

## 関連
- Issue #373（CLOSED 状態のため `Refs #373` のみ。`Closes #373` / `Fixes #373` は使わない）
- 元 unassigned task: docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md
- 後続: 03a alias queue adapter D1-backed 実装 / static-manifest.json retirement（別タスク）

## Visual Evidence
[NON_VISUAL] API 内部実装 + CI gate のみで UI 変更なし。screenshot は不作成（false green 防止）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Step 6（PR 作成後）

- PR URL を `outputs/phase-13/pr-creation-result.md` に記録
- CI 状態を `gh pr checks <PR番号> --watch` で確認し結果を記録
- `artifacts.json` の `phases.phase-13.status` を `completed` に更新
- `outputs/phase-13/main.md` に G1 / G2 timestamp / PR URL / CI 結果を最終記録

## branch / base / branch protection

- branch name: `feat/issue-373-ut02a-canonical-metadata-diagnostics-hardening`
- base: `main`
- branch protection（main）: `required_pull_request_reviews=null` / `required_status_checks` 通過 / `required_linear_history=true` / `required_conversation_resolution=true` / force-push & 削除禁止
- solo 運用ポリシーにより必須レビュアー数 0 だが、`required_status_checks` の通過は必須（typecheck / lint / verify-static-manifest / verify-indexes-up-to-date）

## 失敗時の対処

| 状況 | 対処 |
| --- | --- |
| Step 3 ローカル検証で typecheck / lint / verify が FAIL | 自動修復（最大 3 回）。それでも残るなら Phase 5 / 9 に戻す |
| Step 5 lefthook pre-commit hook FAIL | hook ログに従い修正し新規 commit を追加（amend 禁止）。`--no-verify` 禁止 |
| Step 5 push 拒否（branch 保護 / non-fast-forward） | `git fetch origin main` で同期 → main を merge → 再 push（`--force` 禁止） |
| `gh pr create` 失敗 | エラー要因（branch protection / token scope / 既存 PR 重複）を切り分け解消 |
| CI verify-static-manifest job が FAIL | regenerate を実行し新規 commit で manifest を最新化 → push |
| CI verify-indexes-up-to-date が FAIL | `mise exec -- pnpm indexes:rebuild` 実行 → 差分を新規 commit |

CONST_007: いずれの失敗も「次の PR で対応」型の先送り禁止。本 Phase で commit 追加または前 Phase に戻して解消する。

## 完了条件 / DoD

- [ ] G1 / G2 が独立した user 発言で承認取得済（timestamp が strictly increasing）
- [ ] commit が分割または集約戦略で作成済（G2 承認時に提示した戦略どおり）
- [ ] push / PR 作成成功し PR URL を取得
- [ ] CI（typecheck / lint / verify-static-manifest / verify-indexes-up-to-date）全 green
- [ ] `outputs/phase-13/main.md` に G1 / G2 timestamp + PR URL + CI 結果が記録
- [ ] `artifacts.json` の `phase-13.status` が `completed`
- [ ] `--no-verify` / force-push / admin merge を使っていない
- [ ] PR 本文に Issue #373 / Phase 11 evidence path / DoD チェックが含まれている

## タスク 100% 実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 二重承認 gate（G1 / G2）を独立 timestamp で取得した
- [ ] CONST_007 違反（先送り表現）がない
- [ ] secret / PII の plaintext を本仕様書 / PR 本文に書いていない
- [ ] solo-dev branch protection 不変条件を侵していない（force-push / admin merge / `--no-verify` 不使用）

## 完了レポート最終形

PR 作成完了後、ユーザーに次を 1 回だけ報告:

- PR URL
- 採用 branch 名
- G1 / G2 timestamp
- 実行した自動修復履歴（あれば）
- 残課題（unassigned-task 起票結果との対応 / 03a 本体実装 / static-manifest retirement 実行 など）

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-09.md` 〜 `phase-12.md`
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/artifacts.json`
- `CLAUDE.md`「PR 作成の完全自律フロー」「branch 戦略」「solo 運用ポリシー」「Cloudflare CLI 実行ルール」
- `.github/workflows/ci.yml`
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`（参照可能なら）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-13.md`（フォーマット参照）

## 次タスクへの引き継ぎ事項

- PR merge 後の後続タスク:
  - 03a alias queue adapter D1-backed 実装（contract test を満たすだけで完了する設計）
  - static-manifest.json retirement 実行（03a 完成後・別タスク）
- `artifacts.json` の `phase-13.status=completed` 反映により本ワークフローは終端
- `task-workflow-active.md` の本タスク行は Phase 13 成功後に `implemented-local / Phase 13 pending_user_approval resolved` 相当へ昇格し、以降の進捗 polling 対象外
