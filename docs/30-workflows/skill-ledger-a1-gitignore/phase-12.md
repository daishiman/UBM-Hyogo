# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 前 Phase | 11 (手動テスト / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| user_approval_required | false |

> **300 行上限超過の根拠（テンプレ §「phase-12.md の 300 行上限と設計タスクの例外条項」適用）**:
> 本 Phase は NON_VISUAL タスクで、Phase 11 代替証跡（main / manual-smoke-log / link-checklist）と Phase 12 outputs を直列追跡する必要があるため、責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 の成果物（仕様書 / NON_VISUAL 代替 evidence / spec walkthrough）を、本タスクの限界（docs-only スコープ・実 gitignore 適用は Phase 5 以降の別 PR）に整合する形でドキュメント化する。具体的には、必須 5 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）を出力し、本ワークフローが「タスク仕様書作成までで完了」する境界を明示する。

依存成果物は Phase 2 の base case 設計、Phase 6 の fail path、Phase 7 の coverage map、Phase 8 の DRY 化方針、Phase 9 の品質保証、Phase 10 の最終判定、Phase 11 の NON_VISUAL walkthrough とする。

## 実行タスク

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C / Step 2 = N/A）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須・current/baseline 分離）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

## docs-only モードフラグ適用

| 項目 | 適用内容 |
| --- | --- |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-a1-gitignore` 等の docs validator のみ実行（実コード関連の typecheck / lint は対象外） |
| implementation-guide Part 2 | 仕様サマリ + glob spec + git rm --cached コマンド形 + hook guard コード例（**`1Password secret URI` シークレット注入は本タスク無関係なので含めない**） |
| Step 1-B 実装状況 | `spec_created`（実コード変更なし、仕様書のみ） |

## 実行手順

### ステップ 1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に **2 パート構成必須**。

**Part 1（中学生レベル / 日常の例え話）**:

- 「`.gitignore` は『写さなくていい紙』のリスト」: 学校の連絡袋の中に「先生にも家にも見せる手紙」と「自分のメモ書き」が混ざっていたら、メモ書きはノートに毎日新しく書き直すから先生に提出する必要はない。git にとっての `.gitignore` がこの「提出しなくていい紙のリスト」。
- 「自動生成 ledger は『計算結果のメモ』」: 算数の問題を解くときの計算用紙は答えだけ提出すればよくて、計算用紙そのものは要らない。`indexes/keywords.json` や `LOGS.rendered.md` は計算用紙にあたる「派生物」で、必要なときに `pnpm indexes:rebuild` で再計算できるから保管しない。
- 「履歴は先に別ノートに書き写してから捨てる」: A-2 タスクが先に `LOGS.md` を `_legacy.md` に転記してくれてから、本タスクで「使わなくなった元ノート」を gitignore する。順番を間違えると履歴が事故で消える。
- 「自動配り係（hook）が新しい計算用紙を勝手に提出袋に入れない」: post-commit hook という「自動配り係」が「派生物だけ作って、提出袋（git index）には入れない」境界を守ることで、untrack 後も再 add される循環を防ぐ。

**Part 2（開発者向け技術詳細）**:

| セクション | 内容 |
| --- | --- |
| target glob spec | `.gitignore` への追記対象パターン（`/.claude/skills/*/indexes/keywords.json` / `/.claude/skills/*/indexes/index-meta.json` / `/.claude/skills/*/indexes/*.cache.json` / `/.claude/skills/*/LOGS.rendered.md`）を git glob 文法で記述 |
| `git rm --cached` 実行 | `git ls-files .claude/skills | rg '(indexes/keywords\.json|indexes/index-meta\.json|indexes/.*\.cache\.json|LOGS\.rendered\.md)$' | xargs -I{} git rm --cached {}` の dry-run / 本実行手順 |
| hook guard コード例 | lefthook.yml に追加する post-commit / post-merge guard の擬似コード。`[ -e "$canonical" ] && exit 0`（存在 → スキップ）の冪等パターンを記述 |
| 4 worktree 並列再生成 smoke | Phase 11 manual-smoke-log.md と同コマンド系列を再掲（実走は Phase 5 以降） |
| ロールバック手順 | `git add -f <path>` で再 track / `revert(skill): re-track A-1 ledger files` 1〜2 コミット粒度 |

> **Part 2 で扱わない事項**: `1Password secret URIVault/Item/Field` 形式の 1Password シークレット注入は本タスクと無関係。Cloudflare API token / OAuth は触らない。

### ステップ 2: システム仕様更新サマリー（Step 1-A/B/C / Step 2 = N/A）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述。

**Step 1-A: 完了タスク記録 + 関連 doc リンク**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | skill-ledger-a1-gitignore Phase 1〜13 の spec_created 行追記 |
| `.claude/skills/task-specification-creator/LOGS.md` | NON_VISUAL Phase 11 代替 evidence プレイブック適用例として記録 |
| 関連 doc リンク | `completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md` への参照リンク |

**Step 1-B: 実装状況テーブル更新**

- 統合 README（`docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/`）の関連タスクテーブルで A-1 行を `spec_created`（仕様書整備済 / 実装は別 PR）に更新。

**Step 1-C: 関連タスクテーブル更新**

- A-2（fragment）/ A-3（progressive disclosure）/ B-1（gitattributes）/ T-6（hooks）の各 unassigned-task ファイルから本ワークフローへの双方向リンクを追加。

**Step 2: aiworkflow-requirements 仕様更新 = N/A**

> 本タスクは git 管理境界（`.gitignore` / git index）の変更であり、ドメイン仕様（API schema / D1 schema / IPC 契約 / UI 仕様）に影響しない。
> したがって `.claude/skills/aiworkflow-requirements/references/` への正本登録は **N/A**。
> 「N/A 理由」を明示することが必須（省略不可）。

### ステップ 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録（**Step 1-A / 1-B / 1-C / Step 2 全て個別記録、該当なしも明記**）。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-28 | 新規 | docs/30-workflows/skill-ledger-a1-gitignore/ | Phase 1〜13 仕様書 + index + artifacts.json + outputs/phase-{01,02,03,11,12,13}/ |
| 2026-04-28 | 同期（Step 1-A） | docs/30-workflows/LOGS.md | A-1 spec_created 行追加 |
| 2026-04-28 | 同期（Step 1-A） | .claude/skills/task-specification-creator/LOGS.md | NON_VISUAL 代替 evidence 適用例ログ |
| 2026-04-28 | N/A（Step 1-B） | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/README.md | ファイルが存在しないため更新対象外 |
| 2026-04-28 | 新規（Step 1-C） | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | T-6 hook 実装タスクを未タスクとして作成 |
| 2026-04-28 | N/A（Step 2） | .claude/skills/aiworkflow-requirements/references/ | git 管理境界変更でドメイン仕様非影響、Step 2 不要 |

### ステップ 4: 未タスク検出レポート（0 件でも出力必須・current/baseline 分離）

`outputs/phase-12/unassigned-task-detection.md` に **current/baseline 分離形式** で記述。

- **baseline（既知の派生タスク群）**: A-2（fragment 化）/ A-3（progressive disclosure）/ B-1（gitattributes）。これらは本ワークフロー外で既に独立タスクとして起票済みのため、**本タスクの未タスク検出ではカウントしない**。T-6（hooks 本体実装）はファイル未存在だったため、本 Phase 12 review で新規未タスク化する。
- **current（本タスク Phase 1〜11 で発見した派生課題）**: 0 件想定だが、Phase 11 walkthrough で「保証できない範囲」として上がった事項があれば formalize する。

| 区分 | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| baseline | A-2 / A-3 / B-1 | 既存タスク | （本タスクで発見していない既存タスクのため記録不要） | 既起票済 |
| current | T-6 hook 実装タスク | 新規未タスク | `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md` を作成 | unassigned-task |
| current | （Phase 11 で 0 件 / または個別記録） | — | — | — |

> **0 件の場合も「該当なし」セクションを必須**。「設計タスクパターン（型→実装 / 契約→テスト / UI仕様→コンポーネント / 仕様書間差異）4 種を確認した、本タスクは git 管理境界変更のため該当しない」を明記。

### ステップ 5: スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）

`outputs/phase-12/skill-feedback-report.md` に 3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）でテーブル必須。

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | docs-only / NON_VISUAL / spec_created の 3 ラベル組合せ Phase 11 が `phase-template-phase11.md` で明確に分岐できた | （改善点なし） |
| ワークフロー改善 | 上流 runbook（task-conflict-prevention-skill-state-redesign Phase 5）から本ワークフローへ「実装ターゲット」を継承する形が機能した | 上流 runbook → 派生実装タスクへの双方向リンクテンプレ化を検討 |
| ドキュメント改善 | A-2 完了必須前提を 3 箇所重複明記する規約が `phase-template-core.md` に定型化されていない | 「順序事故防止のための 3 重明記」を `patterns-success-implementation.md` に追加候補 |

> **改善点なしの場合もテーブル必須**。「観察事項なし」の文言で行を埋める。

## 統合テスト連携

docs-only のためアプリ統合テストは対象外。Phase 11 の NON_VISUAL 代替 evidence と Phase 12 の 6 成果物を docs validator の入力として扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 / Part 2 構成 |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C と Step 2=N/A |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点テーブル |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Step 1-A/B/C / Step 2 詳細手順 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/main.md | NON_VISUAL 代替 evidence 引き継ぎ |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/index.md | 受入条件 AC-1〜AC-11 の参照 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-12.md | 構造リファレンス（NON_VISUAL Phase 12 例） |

## 完了条件

- [ ] 必須 5 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生レベル例え話 3 つ以上）+ Part 2（開発者技術詳細）構成
- [ ] system-spec-update-summary に Step 1-A/1-B/1-C + Step 2 = N/A（理由明記）が記述
- [ ] documentation-changelog に Step 1-A/1-B/1-C/Step 2 が個別記録（該当なしも明記）
- [ ] unassigned-task-detection が current/baseline 分離形式で記述（0 件でも出力）
- [ ] skill-feedback-report が 3 観点（テンプレ / ワークフロー / ドキュメント）テーブル必須
- [ ] `1Password secret URI` シークレット注入が implementation-guide に**含まれていない**ことを grep で確認
- [ ] 計画系 wording（`仕様策定のみ` / `実行予定` / `保留として記録`）が Phase 12 outputs に**残っていない**

## 検証コマンド

```bash
# 必須 5 ファイル確認
ls docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/

# 計画系 wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/ \
  || echo "計画系 wording なし"

# 1Password secret URI 混入チェック（本タスク無関係のため 0 件期待）
rg -n "1Password secret URI" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/implementation-guide.md \
  || echo "1Password secret URI 混入なし"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/implementation-guide.md
```

## 苦戦防止メモ

1. **`1Password secret URI` を Part 2 に書かない**: 本タスクは `.gitignore` / git index / hook の編集のみで、シークレット注入は無関係。混入すると validator が docs-only スコープ違反として検出する。
2. **Step 2 = N/A の理由を必ず明記**: aiworkflow-requirements 仕様非影響を「git 管理境界変更でドメイン仕様非影響」と 1 行で明示する。
3. **A-2 / A-3 / B-1 / T-6 を current 未タスクにカウントしない**: 既に独立タスクとして起票済のため baseline 区分に分離する。
4. **改善点なしでも skill-feedback-report 3 観点テーブル必須**: 「観察事項なし」の文言で行を埋める。空テーブル禁止。
5. **計画系 wording 禁止**: `仕様策定のみ` / `実行予定` / `保留として記録` は Phase 12 完了前にすべて実更新ログへ昇格。
6. **300 行超過の根拠を冒頭に明記**: NON_VISUAL Phase 11 連動と必須 5 成果物と NON_VISUAL 証跡の責務分離不可能性を 1 段落で記述（本ファイルでは冒頭に記載済）。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / user 承認必須)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - 必須 5 成果物の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の current 0 件 / baseline 既存タスク区分 → PR body の「related work」節
- ブロック条件:
  - 必須 5 ファイルのいずれかが欠落
  - 計画系 wording が残存
  - implementation-guide に `1Password secret URI` が混入
  - skill-feedback-report が 3 観点テーブル未充足
