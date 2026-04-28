# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 (テスト戦略) |
| 下流 | Phase 6 (異常系検証) |
| 状態 | pending |
| user_approval_required | false |

## 目的

派生実装タスクで使う `.gitattributes` 編集手順 / コミット粒度 / 検証コマンドを順序立てて記述する。本 design workflow は docs-only / NON_VISUAL のため、ここでは派生実装タスク用の設定ファイル追記手順のみを固定する。粒度を誤ると revert コストが上がる。

## 入力

- `outputs/phase-02/main.md`（確定 pattern）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-4）

## 実行手順

### ステップ 1: 事前確認（Red）

```bash
# 現状の merge attribute が unspecified であることを確認（Red）
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# => merge: unspecified （まだ pattern 適用前）
```

### ステップ 2: `.gitattributes` 編集

リポジトリルート `.gitattributes` の末尾に B-1 セクションを追記する。

```gitattributes
# === B-1: append-only skill ledger merge=union ===
# 行独立な append-only Markdown のみを対象とする。
# 適用禁止: JSON / YAML / SKILL.md / lockfile / front matter Markdown
# 解除条件: A-2 fragment 化完了（git ls-files '.claude/skills/**/_legacy.md' が空）になった時点で
#           本セクション全体を削除する。
# broad glob (`**/*.md`) は禁止。現役 fragment を巻き込む。
.claude/skills/**/_legacy.md merge=union
.claude/skills/**/LOGS/_legacy.md merge=union
.claude/skills/**/changelog/_legacy.md merge=union
.claude/skills/**/lessons-learned/_legacy*.md merge=union
.claude/skills/**/SKILL-changelog/_legacy.md merge=union
# === /B-1 ===
```

### ステップ 3: コミット粒度

| コミット | 内容 | メッセージ |
| --- | --- | --- |
| 1 | `.gitattributes` への B-1 セクション追記のみ | `chore(skill-ledger): apply merge=union for legacy ledger (B-1)` |

- 他ファイル変更を含めない（revert 単独可能性を保つため）

### ステップ 4: 検証（Green）

```bash
# 対象（TC-1）
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# => merge: union

# 除外（TC-2）
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
# => merge: unspecified
git check-attr merge -- pnpm-lock.yaml
# => merge: unspecified
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/20260101-000000-main-deadbeef.md
# => merge: unspecified
```

### ステップ 5: typecheck / lint（コード変更なしだが念のため）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 実行タスク

1. ステップ 1 Red 確認
2. ステップ 2 `.gitattributes` 編集（コメント込み）
3. ステップ 3 単独コミット
4. ステップ 4 Green 検証（TC-1 / TC-2）
5. ステップ 5 typecheck / lint

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
| 必須 | `outputs/phase-04/test-strategy.md` |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-05/implementation-runbook.md` | 編集手順 / コミット粒度 / 検証コマンド / 実行ログ |

## 完了条件 (DoD)

- [ ] 派生実装タスクのランブックに `.gitattributes` B-1 セクション追記手順が固定済み
- [ ] コメント（適用禁止 / 解除条件 / broad glob 禁止）が記述済み
- [ ] 単独コミット作成済み
- [ ] TC-1 GREEN（対象 = `union`）
- [ ] TC-2 GREEN（除外 = `unspecified`）
- [ ] typecheck / lint 成功

## 苦戦箇所・注意

- **混在コミット禁止**: 他の skill ledger 改修と同じコミットに混ぜない。revert 時に B-1 だけ戻せなくなる
- **コメント省略の誘惑**: 「pattern 見れば分かる」と思ってコメントを省くと、A-2 完了時に解除を忘れて技術負債化する
- **行末改行**: `.gitattributes` の最終行改行漏れで Git が pattern を読まないことがある。`git check-attr` で検証
- **glob 順序**: より具体的な `LOGS/_legacy.md` を後に書いても問題ないが、混乱を避けるため上から「広 → 狭」の順に統一

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 6（異常系検証）
- 引き継ぎ: 実装後の `.gitattributes` 状態 / Green ログ
