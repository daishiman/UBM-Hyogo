# Phase 12 compliance の判定ルール統一 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-task-spec-creator-phase12-compliance-rules-001 |
| タスク名 | Phase 12 compliance の判定ルール統一（pending と PASS の混同防止） |
| 分類 | skill 改善 |
| 対象機能 | task-specification-creator skill / Phase 12 compliance check |
| 優先度 | 低（skill 改善） |
| 種別 | 運用ルール / skill 更新 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 direction reconciliation Phase 12 30種思考法レビュー（skill-feedback-report.md TSC-1〜TSC-4） |
| 発見日 | 2026-04-29 |
| 関連 blocker | B-09 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-09 direction reconciliation の Phase 12 成果物レビューにおいて、`phase12-task-spec-compliance-check.md` の compliance check 欄に `pending` と記載すべき項目が `PASS` と誤記される事例が発生した。

具体的には、staging smoke テストが未実施（validator 未実行）の状態、別タスクとして起票される前の unassigned-task、および stale references の撤回待ち項目が、審査基準を満たしていないにもかかわらず `PASS` として記録された。

また、docs-only / direction-reconciliation タスクの close-out 時に `implemented` フィールドへの入力を強要するテンプレートが適用され、reconciliation 系タスクの実態に不適合な記述が生まれた。

### 1.2 問題点・課題

| 問題 | 詳細 |
| --- | --- |
| PASS / PENDING 混同 | validator 未実行・未起票 unassigned-task を PASS と記録してしまう |
| `implemented` 強要 | docs-only / reconciliation タスクのテンプレートが `implemented` フィールドを要求し、該当しない値を書かせる |
| 実装ガイド読み替え不可 | Phase 12「実装ガイド」のタイトルが docs-only 時に「reconciliation 手順ガイド」に変えられないため、形式的なドキュメントになる |
| 三値未整備 | compliance check の状態値が PASS / FAIL の二値しか定義されておらず、「未実行だが後続タスクで扱う」を表す `NOT_APPLICABLE` がない |

### 1.3 放置した場合の影響

- staging smoke `pending` が `PASS` のまま残り、Phase 12 最終判定が実態と乖離する
- docs-only タスクで `implemented` 欄に無意味な値が記録され続け、skill の信頼性が下がる
- UT-09 以降の reconciliation 系タスクでも同じ誤記が再発する
- 未起票 unassigned-task が PASS 扱いになることで、後続フォローアップが抜け落ちる

---

## 2. 何を達成するか（What）

### 2.1 目的

Phase 12 compliance check における判定ルールを skill 全体で統一し、「記述レベル PASS」と「実測 PASS」の混同を構造的に防ぐ。

### 2.2 最終ゴール

以下 4 点の運用ルールを `.claude/skills/task-specification-creator/SKILL.md` および関連 `references/phase-12-*.md` へ明文化する。

| # | 改善内容 | 期待効果 |
| --- | --- | --- |
| 1 | docs-only / direction-reconciliation の `spec_created` close-out テンプレ化（`implemented` 強要を緩和） | reconciliation タスクで不適切な `implemented` 入力が発生しない |
| 2 | Phase 12「実装ガイド」を docs-only 時に「reconciliation 手順ガイド」へ読み替え可能とする | タイトルが実態と乖離したドキュメントが作られない |
| 3 | compliance check に staging smoke 表記の `pending / PASS / FAIL` 統一を組み込む | staging smoke 未実施を PASS と誤記しない |
| 4 | compliance check の `PASS / PENDING / NOT_APPLICABLE` 三値導入 | validator 未実行や別タスク起票前項目を PASS としない |

### 2.3 スコープ

#### 含むもの

- `.claude/skills/task-specification-creator/SKILL.md` の状態分離セクション更新
- `references/phase-12-spec.md` の compliance check 判定ルール追記
- `references/phase-12-pitfalls.md` への UBM-014（pending/PASS 混同）追記
- `references/phase-12-tasks-guide.md` の Task 6 判定ルール更新（三値導入）
- docs-only / reconciliation タスク向け `spec_created` close-out テンプレートの明文化

#### 含まないもの

- commit、push、PR 作成
- UT-09 Phase 12 成果物自体の修正（別タスク `task-ut09-direction-reconciliation-001` の責務）
- 既存 completed タスクの遡及修正

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `.claude/skills/task-specification-creator/SKILL.md` を通読する
- `references/phase-12-spec.md` / `references/phase-12-tasks-guide.md` / `references/phase-12-pitfalls.md` を読む
- UT-09 Phase 12 の `skill-feedback-report.md`（TSC-1〜TSC-4）を読む

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-ut09-direction-reconciliation-001 | 本タスクの発見元。reconciliation 方針の決定後に skill 側を更新する |
| 下流 | UT-09 Phase 12 成果物再判定（別 close-out タスク） | skill 更新後に UT-09 の PENDING 区分が正しく分離されていることを確認する |

### 3.3 必要な知識

- task-specification-creator skill の Phase 12 仕様（5〜6 タスク構成）
- docs-only / NON_VISUAL 判定フロー（`references/task-type-decision.md`）
- `spec_created` / `completed` / `PENDING` / `NOT_APPLICABLE` の状態モデル
- Phase 12 `phase12-task-spec-compliance-check.md` の root evidence 役割

### 3.4 推奨アプローチ

既存の `phase-12-pitfalls.md` の追記パターン（UBM-NNN 番号体系）に従い、新しいフィードバック ID（UBM-014 以降）として追加する。SKILL.md 本体の状態分離テーブルを更新し、三値定義は `references/phase-12-tasks-guide.md` の Task 6 セクションに集約する。

---

## 4. 実行手順

### Phase 1: 現状把握

1. `references/phase-12-spec.md` の「状態分離（spec_created vs completed）」セクションを読む
2. `references/phase-12-tasks-guide.md` の Task 6「判定ルール（PASS 断言の防止）」セクションを読む
3. `references/phase-12-pitfalls.md` の最終 UBM 番号を確認し、次番号（UBM-014 予定）を採番する
4. UT-09 Phase 12 の `skill-feedback-report.md` を読み、TSC-1〜TSC-4 の改善内容を把握する

### Phase 2: SKILL.md 更新

1. SKILL.md の「状態分離（spec_created vs completed）」テーブルに `PENDING` / `NOT_APPLICABLE` を追加する
2. docs-only / direction-reconciliation の `spec_created` close-out 向けに `implemented` 強要緩和の注記を追加する
3. 変更履歴テーブルに新エントリを追記する（バージョン命名規則に従う）

### Phase 3: references/phase-12-spec.md 更新

1. Task 6 判定ルールに三値（`PASS / PENDING / NOT_APPLICABLE`）の定義を追記する
2. staging smoke の `pending` 状態を `PASS` と記録しない旨を明文化する
3. `spec_created` close-out ルールの「docs-only / reconciliation 向け `implemented` 緩和」条件を追記する

### Phase 4: references/phase-12-tasks-guide.md 更新

1. Task 6「判定ルール（PASS 断言の防止）」セクションに三値テーブルを追加する
2. 「docs-only 時の実装ガイド → reconciliation 手順ガイド 読み替え可」をタスク 1 セクションに追記する

### Phase 5: references/phase-12-pitfalls.md 更新

1. UBM-014 として「staging smoke `pending` を `PASS` と誤記する事例」を追記する
2. UBM-015 として「docs-only / reconciliation タスクで `implemented` 強要による不適切記録」を追記する
3. 防止方法（三値確認・テンプレート読み替え手順）を対応行に記載する

### Phase 6: 検証

1. `node .claude/skills/skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator` でスキル構文を確認する
2. `rg -n "PENDING\|NOT_APPLICABLE" .claude/skills/task-specification-creator/references/phase-12-*.md` で三値が追記されていることを確認する
3. `rg -n "implemented" .claude/skills/task-specification-creator/SKILL.md` で緩和注記が反映されていることを確認する

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] SKILL.md の状態分離テーブルに `PENDING` / `NOT_APPLICABLE` が定義されている
- [ ] `implemented` フィールド強要が docs-only / reconciliation タスクに適用されない旨が明記されている
- [ ] Phase 12「実装ガイド」を docs-only 時に「reconciliation 手順ガイド」と読み替え可と明記されている
- [ ] staging smoke の `pending` 状態を `PASS` と記録しない運用ルールが明文化されている

### 品質要件

- [ ] UBM-014 / UBM-015 が `phase-12-pitfalls.md` に append-only で追記されている（既存 ID の改番・削除なし）
- [ ] SKILL.md の変更履歴バージョン番号が採番規則に従っている
- [ ] `quick_validate.js` の実行結果にエラーがない

### ドキュメント要件

- [ ] `phase-12-spec.md` / `phase-12-tasks-guide.md` / `phase-12-pitfalls.md` の更新内容が一貫している
- [ ] 三値定義（`PASS / PENDING / NOT_APPLICABLE`）が同一定義で 3 ファイル全体を通して使われている

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| 三値定義確認 | `rg "PENDING\|NOT_APPLICABLE" .claude/skills/task-specification-creator/references/phase-12-*.md` | 3 ファイル全てにヒット |
| 緩和注記確認 | `rg "implemented" .claude/skills/task-specification-creator/SKILL.md` | 緩和条件の注記行が存在する |
| pitfalls 追記確認 | `rg "UBM-014\|UBM-015" .claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | 2 件ヒット |
| skill 構文確認 | `node .claude/skills/skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator` | エラー 0 件 |
| UT-09 再判定 | UT-09 Phase 12 成果物の compliance check を新ルールで再査読 | PENDING 区分が正しく分離されている |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| SKILL.md 変更履歴バージョン重複 | 中 | 低 | 最新エントリのバージョン番号を確認してから採番する |
| UBM 番号の重複追記 | 中 | 低 | 追記前に `rg "UBM-01[0-9]" phase-12-pitfalls.md` で最終 ID を確認する |
| 三値定義のファイル間不整合 | 高 | 中 | Phase 3〜5 完了後に `rg` で 3 ファイル全体の表記を突合する |
| docs-only 読み替えルールが実装系タスクに誤適用される | 高 | 低 | 適用条件（`taskType: docs-only` かつ `reconciliation`）を明示し、通常 implementation には適用しない旨を注記する |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | 改善対象本体 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Task 6 判定ルール・spec_created 運用ルール |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-tasks-guide.md` | Task 1〜6 詳細ガイド |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | UBM 番号体系・追記対象ファイル |
| 参考 | `docs/30-workflows/ut09-direction-reconciliation/outputs/phase-12/skill-feedback-report.md` | TSC-1〜TSC-4 改善要件の発生元 |
| 参考 | `.claude/skills/task-specification-creator/references/task-type-decision.md` | docs-only / NON_VISUAL 判定フロー |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | pending を PASS と誤記する事例が UT-09 Phase 12 で発生。docs-only 時の `implemented` 強要が reconciliation 系タスクに不適合。skill 全体での運用ルール統一が必要と判明 |
| 原因 | Phase 12 compliance check の状態値が PASS / FAIL の二値のみ定義されており、「validator 未実行」「別タスク起票前」「staging 未実施」を表す中間値（PENDING / NOT_APPLICABLE）がテンプレートに存在しなかった。docs-only テンプレートが実装タスク前提の `implemented` フィールドを要求する設計になっていたため、reconciliation 系タスクで不適切な値が記録された |
| 対応 | Phase 12 skill-feedback-report.md（TSC-1〜TSC-4）として記録し、本タスク（B-09）として未タスク化した |
| 再発防止 | 三値（PASS / PENDING / NOT_APPLICABLE）を skill に明文化し、docs-only / reconciliation テンプレートで `implemented` 強要を緩和する。phase-12-pitfalls.md に UBM-014 / UBM-015 として追記する |

### 作業ログ

- 2026-04-29: UT-09 direction reconciliation Phase 12 review の skill-feedback-report.md TSC-1〜TSC-4 から B-09 として抽出。未タスク指示書作成。

### 補足事項

- 本タスクは skill 運用ルールの更新が目的であり、commit / push / PR 作成は含まない。
- skill 更新後、UT-09 reconciliation の Phase 12 成果物を新ルールで再判定し、PENDING 区分が正しく分離されていることを確認することが検証の完了条件となる。
- SKILL.md 500 行制限に注意し、追記量が大きい場合は `references/` ファイルへ詳細を分離する。
