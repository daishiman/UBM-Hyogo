# task-claude-code-permissions-apply-001 — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| ディレクトリ | docs/30-workflows/task-claude-code-permissions-apply-001 |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| Wave | - |
| 実行種別 | completed_with_blocked_followup（TC-05 は前提タスク未完のため継続管理） |
| 作成日 | 2026-04-28 |
| 担当 | dev-environment / tooling |
| 状態 | completed（TC-05 BLOCKED 注記付き。Phase 13 はユーザー承認待ち） |
| タスク種別 | implementation（host 環境ファイル書き換え + ドキュメント更新） |
| visualEvidence | NON_VISUAL（CLI 出力テキスト主証跡） |
| 優先度 | HIGH |
| 見積もり規模 | 小規模 |

## 目的

`task-claude-code-permissions-decisive-mode`（spec_created）で確定した設計を、必須前提タスク 2 件の完了後に実機へ反映するための仕様書を整備する。実反映対象は以下:

- `~/.claude/settings.json`
- `~/.claude/settings.local.json`
- `<project>/.claude/settings.json`（必要 project は `settings.local.json` も）
- `~/.zshrc`（`cc` alias）

最終的に Claude Code 起動時の Bypass Permissions Mode を恒久化し、permission prompt フォールバック事故を 0 件にする。

`task-claude-code-permissions-deny-bypass-verification-001` と
`task-claude-code-permissions-project-local-first-comparison-001` は当初の必須前提だったが、Phase 3 のユーザー強行承認（選択肢 C）により FORCED-GO として実機反映した。TC-05 は前提結論なしでは判定不能のため **BLOCKED** とし、`outputs/phase-12/unassigned-task-detection.md` で継続管理する。

## 背景

`task-claude-code-permissions-decisive-mode` は `spec_created / docs-only / NON_VISUAL` で完了し、設計だけが成果物。実 settings ファイルおよび `cc` alias の書き換えは「実装担当者向け宿題」として未タスク化されており、本タスクがその受け皿。issue #140 は CLOSED だが、台帳上は未実施のため Phase 1-13 の仕様書を整備する。

## スコープ

### 含む（本タスクの実装対象）

- E-1: settings 3 層の `defaultMode` を `bypassPermissions` で統一（採用案 A）
- E-2: `cc` alias を `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` に正準化
- E-3: `<project>/.claude/settings.json` の `permissions.allow` / `deny` を設計どおりに更新
- 変更前 backup（`.bak.<TS>`）取得と rollback 手順の整備
- TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 を `outputs/phase-11/manual-smoke-log.md` に記録

### 含まない

- bypass モード下での `permissions.deny` 実効性の検証 — `task-claude-code-permissions-deny-bypass-verification-001`
- project-local-first 適用案の比較設計 — `task-claude-code-permissions-project-local-first-comparison-001`
- MCP server / hook の permission 挙動検証
- `Edit` / `Write` の whitelist 化（Phase 10 MINOR 保留）
- enterprise managed settings 対応

## 受入条件 (AC)

| ID | 内容 |
| --- | --- |
| AC-1 | `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.local.json` の `defaultMode` が `bypassPermissions` で統一されている |
| AC-2 | `<project>/.claude/settings.json` の `permissions.allow` / `deny` が `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §4 と完全一致。元タスク `whitelist-design.md` との差分は Phase 2/3 で明示 |
| AC-3 | `cc` alias が `CC_ALIAS_EXPECTED` に正準化され、`type cc` 出力 1 行と `grep -nE '^alias cc=' <定義ファイル>` 1 ヒットが一致 |
| AC-4 | `*.bak.<TS>` 4 ファイル（settings ×3 + zshrc ×1）が取得済みで、ファイルサイズが元と一致 |
| AC-5 | TC-01〜TC-04 / TC-F-01〜TC-F-02 / TC-R-01 が PASS、TC-05 は前提タスク結論と整合。前提未完了なら本 AC は BLOCKED |
| AC-6 | `outputs/phase-5/runbook-execution-log.md` に rollback 手順が記録されている |
| AC-7 | NON_VISUAL のため screenshot は不要。`outputs/phase-11/manual-smoke-log.md` を主証跡とする |
| AC-8 | Phase 12 で 7 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / final-30-method-elegant-verification）が揃う |
| AC-9 | 元タスク `task-claude-code-permissions-decisive-mode` の `outputs/phase-12/skill-feedback-report.md` に「U1 反映完了」が追記されている |

## 重要な不変条件

- グローバル `~/.claude/settings.json` 変更は **他プロジェクトへ波及する**。実装前に `grep -rn defaultMode` で他 project の override を再走査し、想定外の上書きがないことを Phase 1 で確認する
- 平文 `.env` / API token / OAuth token をログ・コミット・記録ノートに**残さない**（CLAUDE.md ルール準拠）
- `wrangler` 直接実行禁止 — 本タスクは無関係だが破らない
- 実機編集は backup → JSON validity → alias 重複検出を必須ガードとして runbook 順で実施
- `~/Library/Preferences/.wrangler/config/default.toml` の OAuth トークン残置を持ち込まない

## 前提タスク

| ID | 必須 | 状態 |
| --- | --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` | ✅ 必須前提（TC-05） | completed-tasks 台帳あり。TC-05 の追跡は本タスクの unassigned 検出で継続 |
| `task-claude-code-permissions-project-local-first-comparison-001` | ✅ 必須前提（比較設計） | completed-tasks 台帳あり。採用候補 (b) で本タスクは FORCED-GO |
| `task-claude-code-permissions-decisive-mode` | ✅ 設計入力 | spec_created（completed-tasks 配下） |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/{main,inventory,carry-over}.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{main,topology,validation-path}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/{main,impact-analysis,go-no-go}.md |
| 4 | テスト作成 | phase-04.md | completed | outputs/phase-04/{main,test-scenarios,expected-results}.md |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05/{main,runbook-execution-log,backup-manifest}.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-06/{main,fail-path-tests}.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-07/{main,coverage-matrix}.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/{main,quality-gate-result}.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/{main,final-review-result}.md |
| 11 | 手動テスト | phase-11.md | completed | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md（NON_VISUAL） |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check,final-30-method-elegant-verification}.md |
| 13 | PR作成 | phase-13.md | blocked | PR description（user 承認後のみ） |

## 関連タスク

| タスク | 関係 | パス |
| --- | --- | --- |
| `task-claude-code-permissions-decisive-mode` | 設計入力 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |
| `task-claude-code-permissions-deny-bypass-verification-001` | 必須前提 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md` |
| `task-claude-code-permissions-project-local-first-comparison-001` | 必須前提 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` |

## 参照ドキュメント

- 設計入力: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md`
- 実機反映 runbook: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-5/runbook.md`
- 元タスク台帳: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- Claude Code 設定詳細: `docs/00-getting-started-manual/claude-code-config.md`

## 重要ルール

- PR / commit はユーザーの明示承認後のみ（Phase 13）
- Phase 4 以降は Phase 3 `go-no-go.md` が Go かつ user 承認済みになるまで実行禁止
- Phase 11 は NON_VISUAL のため screenshot 不要、`screenshots/.gitkeep` も置かない
- Phase 12 で `skill-feedback-report.md` / `unassigned-task-detection.md` は 0 件でも出力必須
- worktree 環境でも `.claude` 正本（`~/.claude/*`）の更新を先送りしない（host 編集タスクの宿命）
