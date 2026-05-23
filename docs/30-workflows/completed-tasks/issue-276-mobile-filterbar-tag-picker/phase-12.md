# Phase 12: ドキュメント更新 / 仕様反映（implementation-guide）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 12 |
| 前提 | Phase 11 完了 |
| 後続 | Phase 13 |

## 目的

aiworkflow-requirements 正本仕様への反映と、PR 本文の元になる `implementation-guide.md` 作成。

## 中学生レベル概念説明（必須）

**この機能の目的**: メンバー一覧ページ（`/members`）で、訪問者が「自分が興味あるテーマ（タグ）でメンバーを絞り込む」操作を簡単にする改修です。

**なぜ必要か**: 今のページではタグで絞り込みするには URL を直接編集するしかなく、初めて訪れた人は「どんなタグがあるのか」を知ることができません。今回の改修で「人気のタグ一覧（chip = 角丸のボタン）」が画面に並び、押すだけで絞り込みが効くようになります。

**スマホ対応**: スマホで開くと検索 box・絞り込みメニュー・タグ chip が縦に並んで画面下まで長くなり、肝心のメンバー一覧が見えづらくなります。これを「初期は折りたたみ、必要な人だけ開く」形にすることで、最初に表示される領域でメンバー一覧を確認できるようにします。

**5 件まで制限**: 一度に絞り込めるタグは 5 件まで。これを超えると候補ボタンが押せなくなり、画面に「これ以上選択できません」と注意書きが出ます（システムが暴走しないための上限です）。

## 実行タスク

1. **正本仕様更新**
   - `docs/00-getting-started-manual/specs/01-api-schema.md` に `GET /public/members` の `topTags` response 仕様を追記
   - `docs/00-getting-started-manual/specs/09-ui-ux.md` に `/members` FilterBar の mobile / tag picker 仕様を追記
   - `docs/00-getting-started-manual/specs/12-search-tags.md` の「新規 tag 候補選択 UI は後続タスク」記述を実装後に置換
   - `.claude/skills/aiworkflow-requirements/` の関連 ledger / indexes（resource-map / quick-reference / task-workflow-active / artifact inventory）を更新
   - `pnpm indexes:rebuild` 実行
2. **implementation-guide.md 作成**
   - `outputs/phase-12/implementation-guide.md` を Part 1 中学生レベル + 技術者向け実装手順で作成
   - strict 7 output を全て物理生成する
3. **Phase 12 compliance check**
   ```bash
   pnpm verify:phase12-compliance
   ```

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] 正本 spec に topTags 仕様反映
- [ ] indexes drift なし
- [ ] `pnpm verify:phase12-compliance` exit 0
- [ ] strict 7 output が全て存在し、Phase 12 compliance check の canonical 9 headings が揃う

## タスク100%実行確認【必須】

- [ ] 中学生レベル説明が含まれている
- [ ] aiworkflow-requirements indexes 再生成済み

## 次Phase

Phase 13 へ。
