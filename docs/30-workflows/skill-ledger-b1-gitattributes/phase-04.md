# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 (設計レビュー) |
| 下流 | Phase 5 (実装ランブック) |
| 状態 | pending |
| user_approval_required | false |

## 目的

`git check-attr merge` の対象 / 除外テスト、2 worktree smoke テストパターン、TDD Red 前のテスト設計を確定する。実装コードを書かない docs-only タスクのため、本 Phase では「検証コマンドの集合」をテストとして定義する。

## 入力

- `outputs/phase-02/main.md`（pattern / smoke 系列）
- `outputs/phase-03/main.md`（PASS 判定）

## テスト戦略

### TC-1 対象 path に `merge: union` が当たる（行独立 Markdown）

| TC ID | 対象 | 期待出力 |
| --- | --- | --- |
| TC-1-1 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | `merge: union` |
| TC-1-2 | `.claude/skills/task-specification-creator/changelog/_legacy.md` | `merge: union` |
| TC-1-3 | `.claude/skills/<任意 skill>/lessons-learned/_legacy.md` | `merge: union` |

### TC-2 除外 path が `merge: unspecified`（構造体保護）

| TC ID | 対象 | 期待出力 |
| --- | --- | --- |
| TC-2-1 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `merge: unspecified` |
| TC-2-2 | `.claude/skills/<任意>/SKILL.md` | `merge: unspecified` |
| TC-2-3 | `pnpm-lock.yaml` | `merge: unspecified` |
| TC-2-4 | `.claude/skills/aiworkflow-requirements/LOGS/20260101-000000-main-deadbeef.md`（現役 fragment） | `merge: unspecified` |

### TC-3 2 worktree smoke（並列追記で衝突 0 件）

| TC ID | シナリオ | 期待 |
| --- | --- | --- |
| TC-3-1 | 2 worktree から同一 `_legacy.md` 末尾追記 → main で順次 merge | merge 終了コード 0、`git ls-files --unmerged` 0 行、両エントリ保存 |
| TC-3-2 | 4 worktree 並列追記 stress test | merge コード 0、4 行とも保存 |

### TC-4 異常系（Phase 6 で詳細化）

| TC ID | シナリオ | 期待 |
| --- | --- | --- |
| TC-4-1 | front matter を持つ Markdown を誤対象に追加した想定 | check-attr 検証で発見、設定差し戻し |
| TC-4-2 | `**/*.md` の broad glob を入れた想定 | 現役 fragment が `union` に変わり TC-2-4 が FAIL |

## 実行タスク

1. TC-1〜TC-4 を test-strategy.md に展開
2. 各 TC に対する `git check-attr merge -- <path>` コマンドを記述
3. smoke の `setup → execute → verify → teardown` を擬似コード化
4. テスト実行順序（TC-2 → TC-1 → TC-3 → TC-4）を確定（除外確認を先行）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Skill Ledger Overview | `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md` | A-2 → A-1 → A-3 → B-1 の実装順序と責務境界 |
| Skill Ledger Gitattributes Policy | `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 `merge=union` の許可・禁止・解除条件 |
| Skill Ledger Lessons Learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | skill ledger 4施策の苦戦箇所と再発防止 |


| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/main.md` |
| 必須 | 原典 §6 検証手順 |

## 依存Phase明示

- Phase 1 成果物を参照する。
- Phase 2 成果物を参照する。
- Phase 3 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-04/test-strategy.md` | TC-1〜TC-4 / コマンド / 順序 / 期待値 |

## 完了条件 (DoD)

- [ ] TC-1〜TC-4 が成果物に記述
- [ ] 各 TC に対する具体的な `git check-attr` コマンドが書かれている
- [ ] smoke の擬似コード化完了
- [ ] テスト実行順序確定

## 検証コマンド（派生実装タスクで実行）

```bash
# TC-2 先行（除外確認）
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
git check-attr merge -- pnpm-lock.yaml

# TC-1（対象確認）
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
```

## 苦戦箇所・注意

- **TC 順序の罠**: 対象（TC-1）から検証すると除外漏れに気づきにくい。**除外（TC-2）を先に走らせる**ことで構造体破損を fail-fast 化
- **smoke の冪等性**: `verify/b1-1` worktree が前回の残骸として存在すると `new-worktree.sh` が失敗する。teardown で `git worktree remove` を必ず含める
- **現役 fragment テスト忘れ**: TC-2-4 を入れないと「`_legacy.md` 以外には当たらない」を担保できない

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 5（実装ランブック）
- 引き継ぎ: TC-1〜TC-4 / コマンド集合 / 実行順序
