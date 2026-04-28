# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（`.gitignore` 編集 / `git rm --cached` / hook idempotency guard） |
| 作成日 | 2026-04-28 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending（本ワークフローは仕様化まで / 実装は別 PR） |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 4 で固定した T1〜T5 を Green にするための **実装ステップ列** を仕様化する。本 Phase 仕様書は実装担当者（人間 / Claude Code）が別 PR で逐次実行するためのランブックであり、本ワークフロー (`task-20260428-170023`) は **仕様化までで完了**（taskType=docs-only / spec_created）。実コード適用・コミット作成は本 PR では行わない。

> **重要**: 本 Phase の冒頭で **A-2 完了の前提確認** を必須化する。A-2 未完了の場合は実装着手不可（Phase 3 NO-GO 条件）。

## A-2 完了の前提確認【実装着手前の必須ゲート】

実装担当者は **Step 1 に入る前に** 以下を必ず確認する。1 件でも該当した場合は実装着手禁止 → Phase 3 NO-GO へ差し戻す。

```bash
# A-2 完了確認（必須）
ls docs/30-workflows/skill-ledger-a2-fragment/        # 完了タスクとして配置されているか
gh issue view <A-2 issue> --json state                # state: CLOSED
rg -l "LOGS\.md.*fragment" .claude/skills/            # fragment 化が反映されているか
git log --oneline --grep "skill-ledger-a2"            # マージコミットが履歴にあるか
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| A-2 task の `status` | `completed` | `pending` / `in_progress` |
| GitHub Issue 状態 | `CLOSED` | `OPEN` |
| `LOGS.md` の fragment 化 | 反映済み | 未反映 |
| `LOGS.md` 本体が target globs に含まれていない | 含まれていない | `LOGS.md` が glob に該当 |

**1 つでも NO-GO 条件に該当 → 実装着手禁止 → 本 Phase を pending に戻し A-2 着手へ。**

## 実行タスク

- タスク1: A-2 完了ゲートを実装着手前の必須確認として固定する。
- タスク2: `.gitignore` patch、実態棚卸し、`git rm --cached`、hook guard を分離する。
- タスク3: 3 コミット粒度と rollback 境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-04.md | T1〜T5（Green 条件） |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | Step 1〜4 patch / ロールバック |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | lane 1〜4 / state ownership |
| 参考 | lefthook.yml | post-commit / post-merge hook 配置 |

## 実行手順

1. Step 0 で A-2 完了を確認し、NO-GO 条件を判定する。
2. Step 1〜4 を lane 1〜3 の順で実行する。
3. Step 5 の 4 worktree smoke は Phase 11 / 実装 PR に委譲する。

## 統合テスト連携

Phase 4 の T1〜T5 を Green 条件として参照し、Phase 6 の T6〜T10 で fail path を追加検証する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック（NOT EXECUTED テンプレ） |
| 別 PR 成果（参考） | `.gitignore` diff / `git rm --cached` ログ / hook guard diff | 本ワークフローでは生成しない |

## 実装手順（5 ステップ）

### Step 0: 前提確認（必須）

- 上記「A-2 完了の前提確認」を全項目クリア。
- T1〜T5 が現在 Red であることを確認（`.gitignore` 未追記 / tracked 派生物が残っている状態）。

### Step 1: `.gitignore` patch 適用（lane 1）

- 対象ファイル: 正本 `.gitignore`（`.git/info/exclude` ではない）
- 追記内容（runbook §Step 1 patch を踏襲）:

  ```gitignore
  # --- A-1: skill ledger 派生物（自動生成）---
  .claude/skills/*/indexes/keywords.json
  .claude/skills/*/indexes/index-meta.json
  .claude/skills/*/indexes/*.cache.json
  .claude/skills/*/LOGS.rendered.md
  ```

- 確認: T1（`git check-ignore -v` 全マッチ）が Green。
- コミット粒度: `chore(skill): add A-1 gitignore globs for auto-generated ledger`（**コミット 1**）。

### Step 2: 実態棚卸し（lane 2 前段）

- runbook 例示パスではなく **実態** で対象列挙:

  ```bash
  git ls-files .claude/skills \
    | rg "(indexes/.*\.json|\.cache\.json|LOGS\.rendered\.md)" \
    > /tmp/a1-untrack-targets.txt
  wc -l /tmp/a1-untrack-targets.txt
  ```

- 結果を `outputs/phase-05/main.md` の「実態棚卸し」セクションに記録（NOT EXECUTED 段階では未記入で OK）。
- nested skill ledger / submodule 配下を見落とさないこと（Phase 6 でも回帰検証）。

### Step 3: `git rm --cached <files>` 実行（lane 2）

- Step 2 で列挙したファイルに対して:

  ```bash
  xargs -a /tmp/a1-untrack-targets.txt git rm --cached
  ```

- worktree 実体は残す（`--cached` のみ）。
- 確認: T2（tracked 派生物 0 件）が Green。
- コミット粒度: `chore(skill): untrack auto-generated ledger files (A-1)`（**コミット 2**）。

### Step 4: hook 冪等ガード追加（lane 3）

- 対象: `lefthook.yml` または既存 hook script（post-commit / post-merge）。
- 追加内容: 各 target に対して **存在 → スキップ** ガード:

  ```bash
  # 例: indexes/keywords.json の生成箇所
  for target in .claude/skills/*/indexes/keywords.json; do
    [[ -f "$target" ]] && continue
    node scripts/generate-index.js "$(dirname "$(dirname "$target")")"
  done
  ```

- 「未存在 → 再生成」「存在 → スキップ」両分岐を備える。
- hook は **tracked canonical を書かない**（state ownership 表）。
- T-6（hook 本体未実装）の場合: 最小限の存在チェックガードに留め、本格実装は T-6 PR へ委譲（Phase 3 open question #1）。
- 確認: T3（再生成後 `git status --porcelain` 空）/ T5（二重実行で tree 不変）が Green。
- コミット粒度: `chore(hooks): add idempotency guard for skill ledger derived files`（**コミット 3**）。

### Step 5: 4 worktree smoke（lane 4 / Phase 11 で実走）

- Phase 11 で実走。本 Phase ではコマンド系列を再掲のみ（Phase 2 §「4 worktree smoke 検証コマンド系列」と同一）。
- 確認: T4（`git ls-files --unmerged | wc -l` => 0）が Green。

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `chore(skill): add A-1 gitignore globs for auto-generated ledger` | `.gitignore` のみ | glob 優先度 / 既存 ignore との衝突 |
| 2 | `chore(skill): untrack auto-generated ledger files (A-1)` | `git rm --cached` のみ | 棚卸し漏れ / 巻き込み（`LOGS.md` 本体） |
| 3 | `chore(hooks): add idempotency guard for skill ledger derived files` | hook script / lefthook.yml | tracked canonical を書かないか / 存在ガード |

> **3 コミット粒度を分離する理由**: ロールバックを各レイヤ単位で 1 コミット粒度に保つため（Phase 2 §ロールバック設計）。

## 検証コマンド（実装担当者向け）

```bash
# Step 1 完了後
git check-ignore -v .claude/skills/*/indexes/keywords.json | head    # T1

# Step 3 完了後
git ls-files .claude/skills | rg "(indexes/.*\.json|\.cache\.json|LOGS\.rendered\.md)" | wc -l  # T2 => 0

# Step 4 完了後
pnpm indexes:rebuild && git status --porcelain                       # T3 => empty
pnpm indexes:rebuild && t1=$(git write-tree) && pnpm indexes:rebuild && t2=$(git write-tree) && [ "$t1" = "$t2" ] # T5

# Step 5（Phase 11）
# Phase 2 §「4 worktree smoke 検証コマンド系列」を実走 → T4
```

## 完了条件

- [ ] Step 0〜4 が `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] A-2 完了確認が冒頭ゲートとして明記されている
- [ ] 3 コミット粒度（gitignore patch / untrack / hook guard）が分離設計されている
- [ ] hook が canonical を書かない境界が再掲されている
- [ ] 実装担当者が別 PR で実走できる粒度になっている
- [ ] 本ワークフローでは実コミットを作成しない旨が明示されている

## 苦戦防止メモ

1. **A-2 未完了で着手しない**: 履歴喪失事故の主要因。Step 0 ゲートで block する。
2. **棚卸しは実態ベース**: runbook 例示パスをコピペすると nested skill ledger を見落とす。`git ls-files` の実出力を採用する。
3. **`git rm --cached` の `--cached` 必須**: `--cached` を忘れると worktree 実体まで削除される。
4. **hook が canonical を書く事故**: Step 4 では「派生物のみ生成」「未存在時のみ実行」を必ず両立させる。
5. **3 コミットを混ぜない**: 1 コミットに混ぜると revert コストが跳ね上がる。
6. **本 Phase 自身は実装しない**: 仕様化のみ。実装は別 PR（実装担当者が Phase 5 / 6 / 11 を順次走らせる）。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 3 コミット粒度の分離が異常系（hook 循環 / regression）の前提
  - Step 2 棚卸し結果が Phase 6 fail path テストの入力
- ブロック条件:
  - A-2 完了確認ゲートが欠落
  - hook が canonical を書く設計が残っている
  - `LOGS.md` 本体が target globs に含まれている
