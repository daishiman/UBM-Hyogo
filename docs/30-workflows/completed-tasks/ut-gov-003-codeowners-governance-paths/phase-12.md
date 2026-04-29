# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003-codeowners-governance-paths) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（必須 5 タスク全部） |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke test / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |
| GitHub Issue | #146 |
| user_approval_required | false |

> **300 行上限の例外条項適用**:
> 本 Phase は NON_VISUAL governance タスクで、Phase 11 代替証跡（main / manual-smoke-log / link-checklist）と Phase 12 必須 5 outputs を直列追跡し、かつ「ownership 文書化」と「将来の `require_code_owner_reviews` 移行手順」の両方を Part 2 で扱うため、責務分離不可能性を根拠に上限を許容超過する。

## 目的

Phase 1〜11 の成果物（仕様書 / NON_VISUAL 代替 evidence / CODEOWNERS API 検証）を、本タスクの実態（`.github/CODEOWNERS` は本差分に含め、PR 作成と suggested reviewer 観察はユーザー承認後）に整合する形でドキュメント化する。Phase 12 は **5 タスク全必須**で、CODEOWNERS という governance タスクの特性（最終マッチ勝ち / `doc/` `docs/` 表記揺れ / solo 運用での非必須化方針 / 将来 `require_code_owner_reviews` 有効化への移行手順）を、中学生レベル概念説明と技術者レベル運用手順の両方で記録する。

## 実行タスク（5 タスク全必須・省略不可）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C / Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（current/baseline 分離・最低 baseline 2 件・0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（task-specification-creator / aiworkflow-requirements / docs 整備の 3 観点・改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

## モードフラグ適用

| 項目 | 適用内容 |
| --- | --- |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-003-codeowners-governance-paths` の docs validator のみ実行（実 CODEOWNERS 適用は後続 PR スコープ） |
| implementation-guide Part 2 | CODEOWNERS 構文 + 5 governance path glob + `gh api .../codeowners/errors` 検証 + `doc/` → `docs/` 棚卸し手順 + 将来 `require_code_owner_reviews` 有効化移行手順（**1Password シークレット注入は本タスク無関係なので含めない**） |
| Step 1-B 実装状況 | `spec_created`（実 CODEOWNERS 編集なし、仕様書のみ） |

## 実行手順

### ステップ 1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に **2 パート構成必須**。

**Part 1（中学生レベル / 日常の例え話）**で扱う 4 概念:

- 「CODEOWNERS は『この棚は誰の担当』を貼った名札」: 図書館の棚に「歴史コーナー: 山田先生」「理科コーナー: 鈴木先生」と名札が貼ってある状態。誰でも本を借りられるが「困ったらこの先生に聞く」が明確になる。
- 「最後にマッチした行が勝つ」: 名札を上から順にめくって、**最後に当てはまった名札だけ**が有効になる仕組み。だから一番下に「全部の棚: 図書館長」と書くと、それより上にある「歴史コーナー: 山田先生」が**消されてしまう**。逆に「全部の棚: 図書館長」を一番**上**に書いて、その下に「歴史コーナー: 山田先生」と書けば、歴史だけ山田先生・それ以外は館長になる。
- 「`doc/` と `docs/` の表記揺れ」: 同じ「ドキュメント置き場」のつもりで `doc/` と `docs/` の 2 種類の名前が混在していると、「doc/ 担当: 山田先生」と書いた名札は `docs/` の棚には貼られない（別の棚扱い）。先に表記を片方に統一しておかないと、名札が空振りする。
- 「solo 運用なのになぜ整備するか」: 図書館員が今は 1 人だけでも、将来手伝いが来た時や監査の時に「どの棚は誰の責任か」が紙に書いてあると説明しやすい。**今すぐ「先生のサインがないと本を貸さない」ルール（必須レビュー化）にはしない**けど、名札だけは先に貼っておく。

**Part 2（開発者向け技術詳細）**:

| セクション | 内容 |
| --- | --- |
| CODEOWNERS 文法 | path spec / owner spec の grammar 概要、`#` コメント、空行扱い、最終マッチ勝ちの正式記述 |
| 5 governance path glob | `docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**` を CODEOWNERS の glob 文法で記述。冒頭 `* @daishiman` global fallback 1 行のみ |
| ファイル順序設計 | global fallback を**冒頭**に置くこと、governance path はその**後段**に置くこと、最終マッチ勝ち事故防止のため後段に汎用 glob を追加しないこと |
| `doc/` → `docs/` 棚卸し | `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` で全文棚卸し → CLAUDE.md / 正本仕様 / docs/ 内 markdown を `docs/` へ統一 → 残置は「外部リンク等の不可避ケース」に限定し明示記録 |
| `gh api .../codeowners/errors` 検証 | コマンド形と期待 JSON `{"errors": []}`、L4 fixture（存在しない user `@nonexistent-bot-handle-xyz`）で red 確認手順 |
| test PR による suggested reviewer 観察 | Phase 11 manual-smoke-log.md と同コマンド系列（5 path × 1 ファイル touch → draft PR → `gh pr view --json reviewRequests` → close --delete-branch） |
| CI 連携可能性 | 将来 `codeowners-validator` action（[mszostok/codeowners-validator](https://github.com/mszostok/codeowners-validator) 等）を `.github/workflows/` に追加し、CODEOWNERS 構文 / owner 解決を CI で gate する案。本タスク段階では unassigned-task として記録するに留める |
| 将来 `require_code_owner_reviews` 有効化への移行手順 | (1) team handle 採用 / 組織側で write 権限事前付与、(2) `gh api .../codeowners/errors` で `errors: []` 確認、(3) UT-GOV-001 branch protection の `required_pull_request_reviews.require_code_owner_reviews=true` フラグ ON、(4) 過渡期 1 PR で smoke 観察、(5) ロールバック手順（フラグ OFF / 1 コマンドで戻せる） |
| ロールバック手順 | `.github/CODEOWNERS` を直前 commit に `git revert` で戻す（1 ファイルのみのため衝突リスク低） |

> **Part 2 で扱わない事項**: 1Password シークレット URI / Cloudflare API token / OAuth は本タスク無関係。`scripts/cf.sh` も触らない。

### ステップ 2: システム仕様更新サマリー（Step 1-A/B/C + Step 2）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述。

**Step 1-A: aiworkflow-requirements 関連 reference 更新有無**

- `.claude/skills/aiworkflow-requirements/references/` 配下に governance / branch-protection / CODEOWNERS に関する section が既に存在するかを `rg -l "CODEOWNERS|code owner"` で確認。
- 該当なしの場合は「governance section 追記」を本タスク内では行わず、UT-GOV-005（docs-only nonvisual template skill sync）へ申し送る判定が妥当。判定結果を本ファイルに明記。
- 該当ありの場合は CODEOWNERS の 5 governance path 一覧と「solo 運用では `require_code_owner_reviews` 非有効化」方針を 1 段落で追記する diff 草案を提示。

**Step 1-B: CLAUDE.md の owner 表との関係明示**

- `CLAUDE.md` 主要ディレクトリ表（`docs/00-getting-started-manual/` と `docs/30-workflows/` 等）と CODEOWNERS の 5 governance path の対応関係を明示する。
- `doc/` 表記の置換差分一覧（CLAUDE.md / 正本仕様等）を `documentation-changelog.md` への入力として整理。CLAUDE.md 内に既存の `doc/` 表記が残っていれば本 sprint で `docs/` に統一、外部リンク等の不可避残置は明示記録。
- CLAUDE.md の「ブランチ戦略」「solo 運用ポリシー」節と CODEOWNERS の関係（必須レビュアー化しない / ownership 文書としてのみ機能）を 1 段落で追記する diff 草案を提示。

**Step 1-C: README 等への CODEOWNERS 言及追加**

- リポジトリ root に `README.md` があれば「Governance / Code owners」節に 1 段落追加（5 governance path / `require_code_owner_reviews` 非有効化方針 / 将来移行手順への参照）。
- 無ければ追加対象外として N/A 記録し、UT-GOV-005 へ申し送る。

**Step 2: aiworkflow-requirements 仕様更新（条件付き）**

- 本タスクは GitHub governance（リポジトリ管理境界）の変更であり、UBM-Hyogo Web アプリのドメイン仕様（API schema / D1 schema / IPC 契約 / UI 仕様）には影響しない。
- したがって `.claude/skills/aiworkflow-requirements/references/` への正本登録は **N/A**（理由明示必須）。Step 1-A で governance section が既に存在する場合のみ、その section に CODEOWNERS 5 path を追記する形で「Step 2 部分適用」とする可能性あり。

### ステップ 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に **Step 1-A / 1-B / 1-C / Step 2 全て個別記録、該当なしも N/A 区分で明記**。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-{11,12,13}.md | Phase 11/12/13 仕様書 |
| 2026-04-29 | 新規 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-{11,12,13}/ | Phase 11/12/13 outputs（11=3 / 12=6 / 13=1 ファイル） |
| 2026-04-29 | Step 1-A | .claude/skills/aiworkflow-requirements/references/ | 既存 governance section 有無を確認の上、追記要否を判定（判定結果は system-spec-update-summary.md に記録） |
| 2026-04-29 | Step 1-B | CLAUDE.md | `doc/` → `docs/` 表記統一 + solo 運用 / CODEOWNERS の関係明示（diff 草案） |
| 2026-04-29 | Step 1-C | README.md | 「Governance / Code owners」節追加（無ければ N/A） |
| 2026-04-29 | Step 2 | .claude/skills/aiworkflow-requirements/references/ | governance 影響なしのため N/A（理由: GitHub governance はドメイン仕様非影響） |

### ステップ 4: 未タスク検出レポート（baseline 最低 2 件・current 必須）

`outputs/phase-12/unassigned-task-detection.md` に **current/baseline 分離形式** で記述。**0 件でも出力必須**。

- **baseline（既知の派生タスク群）**: 最低 2 件。UT-GOV-001 / UT-GOV-002 / UT-GOV-004 / UT-GOV-005 から該当するものを抽出。
- **current（本タスク Phase 1〜11 で発見した派生課題）**:
  - C-1: CI で `codeowners-validator` action 導入の検討（`.github/workflows/verify-codeowners.yml` 新規 / on: pull_request で `gh api .../codeowners/errors` を gate）
  - C-2: UT-GOV-004（required status checks context sync）と CODEOWNERS-validator workflow の context 名整合
  - C-3: 関連 UT-GOV-001/002/004/005 タスク仕様書との双方向リンク補完（Phase 11 link-checklist.md の N/A 9 件）

### ステップ 5: スキルフィードバックレポート（3 観点・改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` に 3 観点必須:

| 観点 | 内容 |
| --- | --- |
| task-specification-creator skill | NON_VISUAL governance タスクで Phase 11 が「実 PR を作らずに smoke コマンド系列を仕様レベル固定する」用途に分岐できたかの評価。改善提案があれば記載、なければ「観察事項なし」 |
| aiworkflow-requirements skill | governance / branch-protection / CODEOWNERS の reference が `references/` 配下にあるべきか、UT-GOV-005 で扱うべきかの判断材料。改善提案 or 観察事項なし |
| docs 整備（CLAUDE.md / README / docs/） | `doc/` / `docs/` 表記揺れを未然に防ぐ lint（`rg` ベースの pre-commit / CI gate）導入の可否。改善提案 or 観察事項なし |

## 統合テスト連携

実 CODEOWNERS 適用は後続 PR スコープのためアプリ統合テストは対象外。Phase 11 の NON_VISUAL 代替 evidence と Phase 12 の 5 成果物を docs validator の入力として扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1（4 概念）/ Part 2（運用 + 移行手順） |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C + Step 2 |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴（N/A も明記） |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点（task-spec-creator / aiworkflow-requirements / docs） |
| Phase 12 統合 | outputs/phase-12/main.md | Phase 12 実行サマリー |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Step 1-A/B/C / Step 2 詳細 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/main.md | NON_VISUAL 代替 evidence 引き継ぎ |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-12.md | Phase 12 構造リファレンス |
| 参考 | GitHub Docs "About code owners" | CODEOWNERS 文法・最終マッチ勝ち |
| 参考 | mszostok/codeowners-validator | CI 連携候補 |

## 完了条件

- [ ] 必須 6 ファイル（main.md + 5 outputs）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生レベル 4 概念: 名札 / 最終マッチ勝ち / `doc/`-`docs/` 表記揺れ / solo 運用で整備する理由）+ Part 2（運用 + 将来移行手順）構成
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2 が個別記述（N/A 理由明記）
- [ ] documentation-changelog に Step 1-A / 1-B / 1-C / Step 2 が個別記録（該当なしも明記）
- [ ] unassigned-task-detection が current / baseline 分離形式（baseline 最低 2 件 / current 最低 1 件 / 0 件区分も出力必須）
- [ ] skill-feedback-report が 3 観点（task-spec-creator / aiworkflow-requirements / docs）テーブル必須
- [ ] 1Password シークレット URI が implementation-guide に**含まれていない**ことを grep で確認
- [ ] 計画系 wording（`仕様策定のみ` / `実行予定` / `保留として記録`）が Phase 12 outputs に**残っていない**

## 検証コマンド

```bash
# 必須 6 ファイル確認
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/

# 計画系 wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/ \
  || echo "計画系 wording なし"

# 1Password URI 混入チェック
rg -n "op://|1Password secret URI" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/implementation-guide.md \
  || echo "1Password URI 混入なし"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/implementation-guide.md
```

## 苦戦防止メモ

1. **必須 5 outputs を省略しない**: governance タスクは「規模が小さい」感覚で skill-feedback-report / unassigned-task-detection を省略しがちだが、本タスク仕様では 0 件でも出力必須。
2. **1Password URI / Cloudflare token を Part 2 に書かない**: 本タスクは `.github/CODEOWNERS` と `doc/` → `docs/` 表記統一のみ。シークレット注入は無関係。
3. **Step 2 = N/A の理由を必ず明記**: 「GitHub governance はドメイン仕様非影響」と 1 行で明示。
4. **baseline の 0 件化禁止**: 関連 UT-GOV-001/002/004/005 から最低 2 件を baseline に列挙。
5. **改善点なしでも skill-feedback-report 3 観点テーブル必須**: 「観察事項なし」の文言で行を埋める。空テーブル禁止。
6. **計画系 wording 禁止**: `仕様策定のみ` / `実行予定` / `保留として記録` は Phase 12 完了前にすべて実更新ログ or unassigned-task に昇格。
7. **`doc/` `docs/` 表記揺れ自体を Phase 12 outputs で起こさない**: 本仕様書内では `docs/` に統一。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / user 明示承認必須)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - 必須 5 成果物の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の current 区分 → PR body の「related work」節
- ブロック条件:
  - 必須 5 ファイルのいずれかが欠落
  - 計画系 wording が残存
  - implementation-guide に 1Password URI が混入
  - skill-feedback-report が 3 観点テーブル未充足
