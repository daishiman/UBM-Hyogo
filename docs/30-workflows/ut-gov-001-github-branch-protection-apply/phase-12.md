# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化（dev / main 実適用） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成 / ユーザー承認後 PUT 実行) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_governance |
| user_approval_required | false（Phase 13 の実 PUT 承認とは独立） |

> **300 行上限超過の根拠**: 本 Phase は Phase 12 必須 5 タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）を全件出力し、それぞれが Phase 11 4 階層代替 evidence と Phase 2 §4.1 adapter / §9 rollback 経路と直列追跡される。責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 の成果物（仕様書 / NON_VISUAL 代替 evidence / 4 ステップ手動 smoke の仕様レベル固定 / spec walkthrough）を、本タスクの限界（実 PUT は Phase 13 ユーザー承認後）に整合する形でドキュメント化する。具体的には、必須 5 成果物を出力し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで完了」する境界を明示する。

依存成果物は Phase 2 設計（adapter / 4 ステップ / rollback 3 経路）、Phase 3 レビュー（NO-GO ゲート）、Phase 11 NON_VISUAL walkthrough（保証できない範囲）とする。

## 実行タスク（Phase 12 必須 5 タスク・全件必須）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C / Step 2 判定）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（0 件でも出力必須・current/baseline 分離）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）** — `outputs/phase-12/skill-feedback-report.md`

## docs-only / spec_created モード適用

| 項目 | 適用内容 |
| --- | --- |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-001-github-branch-protection-apply` 等の docs validator のみ実行（実コード関連の typecheck / lint は対象外） |
| implementation-guide Part 2 | branch protection 概念 / GitHub REST API schema / adapter 擬似コード / 4 ステップ手順 / rollback 3 経路（**`1Password secret URI` シークレット注入は本タスク無関係なので含めない**） |
| Step 1-B 実装状況 | `spec_created`（実 PUT は Phase 13 ユーザー承認後の別オペレーション） |
| Step 2 判定 | aiworkflow-requirements 仕様の **deployment-branch-strategy / CLAUDE.md ブランチ戦略 / governance 章** への反映を Step 1-A/1-B/1-C と分離して精査し、branch protection 実適用予定値の衝突がある場合は REQUIRED 判定 |

## 実行手順

### ステップ 1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に **2 パート構成必須**。

**Part 1（中学生レベル / 日常の例え話）**:

- 「branch protection は『大事なノートに勝手に書き込めないようにする鍵』」: クラスの連絡帳に誰でも勝手に書けたら、嘘の連絡が混じって大事故になる。GitHub の `main` ブランチにも同じ仕組みが要る。それが branch protection。
- 「`required_status_checks` は『体育館に入る前の上履きチェック』」: 体育の授業で上履きを履かずに体育館に入ると床が傷む。CI（自動テスト）を通っていない PR を main に入れると本番が壊れる。`required_status_checks` は「上履きチェック係」。
- 「`enforce_admins=true` は『先生でも例外なく上履きチェック』」: 普通は先生（admin）はスルーできる。`enforce_admins=true` にすると先生も上履きチェックを通らないと体育館に入れない。安全だが、先生が緊急で入れないと困るので「鍵を一時的に外す抜け道（DELETE / `enforce_admins=false`）」を事前に決めておく。
- 「snapshot は『今どんな鍵の設定か写真を撮ったもの』、payload は『新しい鍵の設定書』」: 今の状態（snapshot）と、これから設定する状態（payload）は **形が違う**。snapshot をそのまま「設定書」として渡すと GitHub が「形が違う」と弾く（422）。だから「形を整える係（adapter）」を間に置く。
- 「dev と main は別々の鍵」: dev（試し打ち）と main（本番）は別ブランチなので、鍵も別々にかける。1 つの鍵で両方やろうとすると、片方の設定ミスで両方詰む。

**Part 1 専門用語セルフチェック**:

| 用語 | 日常語への言い換え |
| --- | --- |
| branch protection | 大事なノートに勝手に書き込めないようにする鍵 |
| required_status_checks | 体育館に入る前の上履きチェック |
| enforce_admins | 先生でも例外なく上履きチェック |
| snapshot / payload | 写真 / 設定書 |
| adapter | 形を整える係 |
| dry-run | 鍵をかける前に「こう変わるよ」を見せるリハーサル |
| rollback | 鍵を元に戻す |

**Part 2（開発者向け技術詳細）**:

| セクション | 内容 |
| --- | --- |
| GitHub REST API schema | `PUT /repos/{owner}/{repo}/branches/{branch}/protection` の field 一覧（Phase 2 §4.1 マッピング表 11 field を再掲）。GET 形と PUT 形の field 名差異（`enforce_admins.enabled` → bool / `restrictions.users[].login` → 配列 / `required_pull_request_reviews=null` 等） |
| adapter 擬似コード | jq による GET → PUT 変換（Phase 2 §4.2 を再掲）。snapshot 入力 → payload 出力、snapshot 入力 → rollback 出力の 2 経路 |
| 4 ステップ手動 smoke | dry-run / apply / GET 検証 / CLAUDE.md grep の `gh api` コマンド系列（Phase 11 manual-smoke-log.md と同一） |
| rollback 3 経路 | (1) 通常 rollback（rollback payload を PUT）/ (2) 緊急 rollback（`enforce_admins` サブリソース DELETE もしくは `enforce_admins=false` 最小 patch PUT）/ (3) 再適用 |
| dev / main 別ファイル戦略 | `{branch}` サフィックス分離 / bulk 化禁止 / 独立 PUT × 2 |
| `lock_branch=false` 固定理由 | freeze runbook 未整備の状態で `lock_branch=true` にすると incident 時詰む（§8.3） |
| UT-GOV-004 完了前提 | `required_status_checks.contexts` には UT-GOV-004 で実在 job 名同期済みのもののみ。未完了時は contexts=[] で 2 段階適用 |
| ロールバック payload 事前生成 | `enforce_admins=false` 最小 patch を Phase 13 で snapshot から adapter 通過後に事前生成 |

> **Part 2 で扱わない事項**: `1Password secret URI` 形式の 1Password シークレット注入は本タスクと無関係。`scripts/cf.sh`（Cloudflare CLI ラッパー）も本タスクでは使わない（GitHub Token は既存 `gh auth login` 流用）。

### ステップ 2: システム仕様更新サマリー（Step 1-A/B/C / Step 2 判定）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + LOGS.md×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-GOV-001 Phase 1〜13 の `spec_created` 行追記（Phase 1〜3 = completed / Phase 4〜13 = pending） |
| `.claude/skills/task-specification-creator/LOGS.md` | NON_VISUAL Phase 11 代替 evidence プレイブック適用例（governance / branch protection apply）として記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `deployment-branch-strategy.md` の UT-GOV-001 反映見出しを index 再生成で同期（Step 1-A の topic-map 同期義務） |
| `CLAUDE.md` ブランチ戦略章 | 「solo 運用ポリシー（`required_pull_request_reviews=null`）」が GitHub 実値と drift しないことを grep 検証する旨の注記を追加（**追記のみ・既存記述は変更しない**） |
| 関連 doc リンク | 親タスク `task-github-governance-branch-protection` と本ワークフローの双方向リンク追加 |

**Step 1-B: 実装状況テーブル更新**

- `docs/30-workflows/LOGS.md` の governance 関連テーブルで `ut-gov-001` 行を `spec_created`（仕様書整備済 / 実 PUT は Phase 13 ユーザー承認後）に更新。
- 親タスク `completed-tasks/task-github-governance-branch-protection/` の派生タスクテーブルで UT-GOV-001 を `spec_created` に更新。

**Step 1-C: 関連タスクテーブル更新**

- UT-GOV-002（PR target safety gate dry-run）/ UT-GOV-003（CODEOWNERS）/ UT-GOV-004（contexts 同期）/ UT-GOV-005〜007 の各 `completed-tasks/UT-GOV-NNN-*.md` から本ワークフローへの双方向リンクを追加。
- UT-GOV-004 完了前提が UT-GOV-001 の上流である旨を 4 箇所目（Phase 1 / 2 / 3 / Phase 11 STEP 0 に続き、本サマリでも再掲）。

**Step 1-A/1-B/1-C の判定込み**: 3 サブステップすべて **REQUIRED**（spec_created でも N/A 不可）。

**Step 2: aiworkflow-requirements 仕様更新 = REQUIRED**

> 本タスクは GitHub branch protection の実適用予定値を扱い、既存正本の草案値（dev=1名 / main=2名レビュー）と solo 運用値（`required_pull_request_reviews=null`）が衝突する。
> apps/web / apps/api / D1 / IPC 契約 / UI 仕様は変更しないが、運用正本である `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` には UT-GOV-001 の適用予定値を追記する必要がある。

### ステップ 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録（**Step 1-A / 1-B / 1-C / Step 2 全て個別記録**）。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/ | Phase 11/12/13 仕様書 + outputs/phase-{11,12,13}/ |
| 2026-04-28 | 同期（Step 1-A） | docs/30-workflows/LOGS.md | UT-GOV-001 spec_created 行追加 |
| 2026-04-28 | 同期（Step 1-A） | .claude/skills/task-specification-creator/LOGS.md | NON_VISUAL 代替 evidence 適用例（governance）ログ |
| 2026-04-28 | 同期（Step 1-A） | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | `deployment-branch-strategy.md` の UT-GOV-001 反映見出しを index 再生成で同期 |
| 2026-04-28 | 追記（Step 1-A） | CLAUDE.md | ブランチ戦略章に grep 検証注記追加（governance 参照経路明示） |
| 2026-04-28 | 同期（Step 1-B） | docs/30-workflows/LOGS.md | governance テーブル UT-GOV-001 行 spec_created |
| 2026-04-28 | 同期（Step 1-C） | docs/30-workflows/completed-tasks/UT-GOV-002〜007 関連ファイル | UT-GOV-001 への双方向リンク追加 |
| 2026-04-28 | 同期（Step 2） | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | UT-GOV-001 の branch protection 実適用予定値を追記 |

### ステップ 4: 未タスク検出レポート（0 件でも出力必須・current/baseline 分離）

`outputs/phase-12/unassigned-task-detection.md` に **current / baseline 分離形式** で記述。

- **baseline（既知の派生タスク群）**: UT-GOV-002（PR target safety gate）/ UT-GOV-003（CODEOWNERS）/ UT-GOV-004（contexts 同期）/ UT-GOV-005〜007（その他 governance）。これらは独立タスクとして既起票済のため、**本タスクの未タスク検出ではカウントしない**。
- **current（本タスク Phase 1〜11 で発見した派生課題）**: Phase 11 で挙がった「保証できない範囲」（GitHub eventual consistency / `enforce_admins` 詰み再現実験 / UT-GOV-004 未完了下の 2 段階適用挙動 / `gh api` rate limit）を current 候補として精査し、formalize 要否を判定する。

| 区分 | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| baseline | UT-GOV-002 / 003 / 004 / 005 / 006 / 007 | 既存タスク | （本タスクで発見していない既存タスクのため記録不要） | 既起票済 |
| current | GitHub eventual consistency 対応 | runbook 注記 | `apply-runbook.md` に retry / sleep 規約追加（Phase 13 で実施） | Phase 13 内処理 / 未タスク化不要 |
| current | `enforce_admins=true` 詰み再現テスト | 実走必須 | Phase 13 `rollback-rehearsal-log.md` で実走確認 | Phase 13 内処理 / 未タスク化不要 |
| current | UT-GOV-004 未完了下の 2 段階適用 | UT-GOV-004 完了後の併走確認 | UT-GOV-004 完了タイミングで併走確認タスクを起票 | unassigned-task として formalize 候補（または UT-GOV-004 内に吸収） |
| current | `gh api` rate limit / network race | runbook 注記 | `apply-runbook.md` の rate limit 待機規約 | Phase 13 内処理 |

> **0 件の場合も「該当なし」セクション必須**（本タスクは current=1 件 formalize 候補 + 3 件 Phase 13 内処理のため非該当）。「設計タスクパターン（型→実装 / 契約→テスト / UI仕様→コンポーネント / 仕様書間差異）4 種を確認した」を明記。

### ステップ 5: スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）

`outputs/phase-12/skill-feedback-report.md` に 3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）でテーブル必須。

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | NON_VISUAL implementation（governance 適用）で「実 PUT は Phase 13 承認後」を Phase 11 で固定する流れが phase-template-phase11.md docs-only 代替 evidence で表現できた | Phase 13 user_approval_required=true と Phase 11 NOT EXECUTED を双方向に紐付けるテンプレ注釈を追加する余地 |
| ワークフロー改善 | snapshot（GET 形）/ payload（PUT 形）/ rollback / applied の 4 ファイルを `{branch}` サフィックスで分離する戦略が、bulk 化禁止規約と整合した | adapter（GET → PUT 変換）の jq 擬似コードを workflow-generation patterns に再利用テンプレ化する候補 |
| ドキュメント改善 | UT-GOV-004 完了前提を Phase 1 / 2 / 3 / 11 / 12 で 5 重明記する規約が `phase-template-core.md` に定型化されていない | 「順序事故防止のための N 重明記」を `patterns-success-implementation.md` に追加候補（skill-ledger-a1 の 3 重明記とも整合） |

> **改善点なしでも 3 観点テーブル必須**。空テーブル禁止。観察事項なしの行は「観察事項なし」の文言で埋める。

## 統合テスト連携

NON_VISUAL implementation のため app 統合テストは対象外。Phase 11 の NON_VISUAL 代替 evidence と Phase 12 の 5 成果物を docs validator の入力として扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| index | outputs/phase-12/main.md | Phase 12 統合 index（5 成果物へのリンクと完了判定） |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C と Step 2=REQUIRED（理由明記） |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴（Step 1-A/B/C/Step 2 個別記録） |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離（0 件でも出力） |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点テーブル（改善点なしでも出力） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須 5 タスク詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | Phase 12 落とし穴 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Step 1-A/B/C / Step 2 詳細手順 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/main.md | NON_VISUAL 代替 evidence 引き継ぎ |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | adapter / 4 ステップ / rollback 3 経路の正本 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md | AC-1〜AC-14 の参照 |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-12.md | 構造リファレンス（NON_VISUAL Phase 12 例） |

## 完了条件

- [ ] 必須 5 ファイル + main.md（計 6 ファイル）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生レベル例え話 4 つ以上）+ Part 2（技術者向け技術詳細）構成
- [ ] system-spec-update-summary に Step 1-A/1-B/1-C + Step 2 = REQUIRED（理由明記）が記述
- [ ] documentation-changelog に Step 1-A/1-B/1-C/Step 2 が個別記録
- [ ] unassigned-task-detection が current / baseline 分離形式で記述（0 件でも出力）
- [ ] skill-feedback-report が 3 観点（テンプレ / ワークフロー / ドキュメント）テーブル必須
- [ ] `1Password secret URI` シークレット注入が implementation-guide に**含まれていない**ことを grep で確認
- [ ] 計画系 wording（`仕様策定のみ` / `実行予定` / `保留として記録`）が Phase 12 outputs に**残っていない**
- [ ] CLAUDE.md ブランチ戦略章への注記追加が Step 1-A の範囲で処理されている
- [ ] UT-GOV-004 完了前提が本 Phase 12 でも再掲されている（5 重明記の 5 箇所目）

## 検証コマンド

```bash
# 必須 5+1 ファイル確認
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/

# 計画系 wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/ \
  || echo "計画系 wording なし"

# 1Password secret URI 混入チェック（本タスク無関係のため 0 件期待）
rg -n "1Password secret URI" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md \
  || echo "1Password secret URI 混入なし"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md

# Step 1-A/B/C と Step 2 REQUIRED 確認
rg -n "Step 1-[ABC]|Step 2.*REQUIRED" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/system-spec-update-summary.md
```

## 苦戦防止メモ

1. **`1Password secret URI` を Part 2 に書かない**: 本タスクは GitHub branch protection の編集のみで、Cloudflare / op シークレット注入は無関係。混入すると validator が docs-only スコープ違反として検出する。
2. **Step 2 = REQUIRED の理由を必ず明記**: branch protection 実適用予定値が既存草案値と衝突する場合は、aiworkflow-requirements の運用正本へ反映する。
3. **UT-GOV-002〜007 を current 未タスクにカウントしない**: 既に独立タスクとして起票済のため baseline 区分に分離する。
4. **改善点なしでも skill-feedback-report 3 観点テーブル必須**: 「観察事項なし」の文言で行を埋める。空テーブル禁止。
5. **計画系 wording 禁止**: `仕様策定のみ` / `実行予定` / `保留として記録` は Phase 12 完了前にすべて実更新ログへ昇格。
6. **CLAUDE.md 追記は Step 1-A 範囲・既存記述変更しない**: ブランチ戦略章に grep 検証注記を **追記** するのみ。既存の solo 運用ポリシー文言は変更しない。
7. **UT-GOV-004 完了前提の N 重明記**: Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記。漏れると順序事故が発生する。
8. **300 行超過の根拠を冒頭に明記**（本ファイルでは記載済）。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / **user_approval_required: true**)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - 必須 5 成果物の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の current（formalize 候補 1 件 + Phase 13 内処理 3 件）→ PR body の「related work」節
  - implementation-guide Part 2 の 4 ステップ手順 → Phase 13 `apply-runbook.md` の正本
  - rollback 3 経路 → Phase 13 `rollback-rehearsal-log.md` の正本
- ブロック条件:
  - 必須 5 ファイルのいずれかが欠落
  - 計画系 wording が残存
  - implementation-guide に `1Password secret URI` が混入
  - skill-feedback-report が 3 観点テーブル未充足
  - UT-GOV-004 完了前提の 5 重明記が崩れている
