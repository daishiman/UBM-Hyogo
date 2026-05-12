# Phase 11: NON_VISUAL Evidence 収集（縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| Source | `outputs/phase-11/main.md` |
| 区分 | Evidence 収集（NON_VISUAL 縮約テンプレ適用） |
| visualEvidence | NON_VISUAL |
| 想定所要 | 0.25 人日 |

## 目的

`visualEvidence = NON_VISUAL` のため、UI スクリーンショット / 動画は不要。代わりに validator stdout / CI run URL placeholder / link checklist を構造化テキスト evidence として記録する。

## 実行タスク

### 11.1 validator stdout snapshot

```bash
mise exec -- pnpm gate-metadata:validate 2>&1 | tee outputs/phase-11/validator-stdout.txt
```

期待 stdout 例:
```
[OK] docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json: 4 gates validated
[OK] docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json: 4 gates validated
[OK] docs/30-workflows/issue-589-gate-metadata-structured-ledger/artifacts.json: 4 gates validated
[OK] docs/30-workflows/issue-589-gate-metadata-structured-ledger/outputs/artifacts.json: 4 gates validated
[WARN] docs/30-workflows/.../<historical>/artifacts.json: metadata.gates not present, skipping

OK: 8 WARN: 322 ERROR: 0
```

### 11.2 CI run URL placeholder

| evidence | 値 |
| --- | --- |
| CI workflow file | `.github/workflows/verify-gate-metadata.yml` |
| 期待 status check 名 | `verify-gate-metadata / validate` |
| CI run URL | `<TBD: PR push 後に gh pr checks <PR> --watch で取得>` |
| actionlint stdout | `outputs/phase-11/actionlint-stdout.txt` |

### 11.3 link checklist（参照リンクの実在確認）

| 参照先 | 確認コマンド | 結果 |
| --- | --- | --- |
| index.md | `test -f docs/30-workflows/issue-589-.../index.md` | TBD |
| Issue #589 (CLOSED) | `gh issue view 589 --json state` | TBD: state=closed |
| Issue #549 (parent) | `gh issue view 549 --json state` | TBD |
| 起票元 unassigned-task | `test -f docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md` | TBD |
| zod schema 採用パターン参照 | `test -f apps/web/src/lib/env.ts` | TBD |
| Phase 12 compliance template | `test -f .claude/skills/task-specification-creator/references/phase12-checklist-definition.md` | TBD |

### 11.4 typecheck / lint / test stdout

| ゲート | 出力先 |
| --- | --- |
| `pnpm typecheck` | `outputs/phase-11/typecheck-stdout.txt` |
| `pnpm lint` | `outputs/phase-11/lint-stdout.txt` |
| `pnpm test` | `outputs/phase-11/test-stdout.txt` |
| `bash scripts/coverage-guard.sh` | `outputs/phase-11/coverage-guard-stdout.txt` |

### 11.5 evidence サマリ

`outputs/phase-11/main.md` に以下を集約:
- §11.1 validator stdout 抜粋
- §11.2 CI placeholder 表
- §11.3 link checklist 結果
- §11.4 ゲート stdout 集約

`outputs/phase-11/link-checklist.md` を §11.3 専用 file として別途保存。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 新規 | evidence サマリ |
| `outputs/phase-11/link-checklist.md` | 新規 | リンク実在確認 |
| `outputs/phase-11/validator-stdout.txt` | 新規 | validator 実行ログ |
| `outputs/phase-11/actionlint-stdout.txt` | 新規 | actionlint 実行ログ |
| `outputs/phase-11/typecheck-stdout.txt` | 新規 | typecheck ログ |
| `outputs/phase-11/lint-stdout.txt` | 新規 | lint ログ |
| `outputs/phase-11/test-stdout.txt` | 新規 | vitest ログ |
| `outputs/phase-11/coverage-guard-stdout.txt` | 新規 | coverage-guard ログ |

## 入出力・副作用

- 入力: Phase 5-10 全成果物 + ローカル実行環境。
- 出力: §11.1 ... §11.4 の stdout snapshot 群。
- 副作用: filesystem 書き込みのみ。

## テスト方針

新規テスト追加なし。Phase 9 / Phase 10 の green を再記録するだけ。

## ローカル実行・検証コマンド

§11.1 / §11.4 のコマンドをすべて実行。

## 統合テスト連携

- Phase 12 implementation-guide.md は本 Phase の evidence を引用。
- Phase 13 PR 本文は本 Phase の link checklist を引用。

## 多角的チェック観点（AIが判断）

- **NON_VISUAL 縮約**: VISUAL UI 必須要件（スクリーンショット 4 状態 / 動画 / a11y）は適用外。
- **CI URL placeholder**: PR push 前のため `<TBD>`。Phase 13 push 後に置換する旨を明記。

## サブタスク管理

- ST-1: validator stdout 取得
- ST-2: actionlint stdout 取得
- ST-3: typecheck / lint / test / coverage-guard stdout 取得
- ST-4: link checklist 実行
- ST-5: main.md に集約

## 成果物

- §11 「変更対象ファイル」表の 8 file。

## 完了条件（DoD）

- [ ] §11.1 validator stdout が `OK: N WARN: N ERROR: 0` 形式で記録されている。
- [ ] §11.2 CI placeholder 表が記録されている。
- [ ] §11.3 link checklist 全項目 PASS。
- [ ] §11.4 4 ゲート stdout すべて記録済み。
- [ ] `outputs/phase-11/main.md` が evidence を集約している。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] 8 file すべて生成済み
- [ ] Phase 12 着手 GO 判定済み

## 次Phase

[Phase 12: Implementation Guide / SSOT Sync / Strict 7 Outputs](phase-12.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 outputs and decisions
