# unrelated verification-report 削除の独立 PR 化 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-verification-report-cleanup-001 |
| タスク名 | unrelated verification-report 削除の独立 PR 化 |
| 分類 | 削除 / cleanup |
| 対象機能 | UT-09 direction reconciliation (Phase 12) |
| 優先度 | 中（独立 PR） |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 30種思考法レビュー (B-06 blocker) |
| 発見日 | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-09 Phase 12 の 30種思考法レビューにおいて、旧ワークツリーに残る verification-report 関連ファイルが reconciliation PR の差分に混入する恐れが blocker (B-06) として特定された。

これらのファイルは B-01 / B-02 の Sheets 撤回・reconciliation 差分とは無関係であり、同一 PR に含めることで差分が肥大化し、変更意図が不明瞭になる。

### 1.2 問題点・課題

未参照の verification-report 関連ファイルを reconciliation PR に一緒に含めると、以下の問題が生じる。

- PR の diff が肥大化し、レビュー（CI・人的）が困難になる
- Sheets 撤回 / reconciliation 方針変更との差分が混ざり、変更履歴が汚染される
- 運用ルール 2「scope 分離」に違反し、後続タスクが誤った変更単位を参照しやすくなる

### 1.3 放置した場合の影響

- reconciliation PR に unrelated cleanup が混入し、レビュー不可能な大差分になる
- 誰が何のために削除したかが追跡不能になる
- B-01 / B-02 の変更内容と cleanup の変更内容が混同され、後から revert が困難になる

---

## 2. 何を達成するか（What）

### 2.1 目的

旧ワークツリーに残る verification-report 関連の未参照ファイルを、reconciliation PR から分離し、独立した単一目的の PR として削除する。

### 2.2 最終ゴール

| ゴール | 内容 |
| --- | --- |
| scope 分離 | reconciliation PR の diff に verification-report 削除が含まれない |
| cleanup 独立化 | verification-report 関連ファイルの削除が単独コミット・単独 PR で完結する |
| 追跡可能性 | 削除理由が PR 説明・コミットメッセージで明示されている |

### 2.3 スコープ

#### 含むもの

- 旧ワークツリーに残る verification-report 関連の未参照ファイルの特定
- 対象ファイルが B-01 / B-02 / reconciliation 差分と無関係であることの確認
- 削除対象ファイルの一覧作成
- 独立 PR として切り出す作業計画の策定

#### 含まないもの

- B-01 / B-02 の Sheets 撤回・reconciliation 作業
- reconciliation PR 本体への変更
- staging 実機 smoke の実施（UT-26 で扱う）

### 2.4 成果物

- 削除対象ファイル一覧
- 独立 PR 用コミット（単一目的: verification-report cleanup のみ）
- reconciliation PR の diff に本タスク変更が混在しないことの確認記録

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-ut09-direction-reconciliation-001` を読み、B-06 blocker の文脈を把握する
- `git status` / `git diff` で現在の差分を確認し、verification-report 関連ファイルを特定する
- B-01 / B-02 と対象ファイルが重複しないことを確認する

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-ut09-direction-reconciliation-001 | B-06 blocker の発生元・scope 分離方針の起点 |
| 並列（非依存） | B-01 / B-02 | Sheets 撤回・reconciliation 本体。本タスクと差分が重複しないこと |
| 下流 | reconciliation PR | 本タスク完了後に reconciliation PR の diff がクリーンになる |

### 3.3 必要な知識

- git の scope 分離原則（1 PR = 1 目的）
- task-specification-creator Phase 12 運用ルール 2「scope 分離」
- 旧ワークツリー / 現ワークツリーのファイル構成差異

### 3.4 推奨アプローチ

1. `rg -rn "verification.report" docs/ .claude/` 等で参照箇所を全件抽出し、未参照ファイルを特定する。
2. B-01 / B-02 の変更対象ファイルリストと突き合わせ、重複がないことを確認する。
3. 独立ブランチを切り、削除コミットを 1 件だけ作成する。
4. PR 説明に「reconciliation PR とは無関係の cleanup 専用 PR」であることを明示する。

---

## 4. 実行手順

### Phase 1: 削除対象の特定

1. `git status` / `git diff --name-only` で verification-report 関連ファイルを洗い出す。
2. `rg -rn "verification.report" docs/ .claude/` でファイルへの参照を確認し、未参照であることを検証する。
3. B-01 / B-02 の変更対象ファイルとの重複がないことを確認し、独立性を担保する。

### Phase 2: 独立ブランチ作成

1. `feat/cleanup-verification-report` 等の専用ブランチを切る。
2. 削除対象ファイルのみを `git rm` する。
3. コミットメッセージに「chore: remove unrelated verification-report files (B-06 cleanup)」等の単一目的を明示する。

### Phase 3: PR 作成・検証

1. reconciliation PR の diff に本タスクの変更が含まれないことを確認する。
2. PR 説明に「Sheets 撤回 / reconciliation とは無関係の cleanup 専用 PR」と明示する。
3. PR scope に reconciliation 差分が混在しないことを最終確認する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 旧ワークツリー由来の verification-report 関連未参照ファイルが削除されている
- [ ] 削除対象ファイルが B-01 / B-02 の変更対象と重複していない
- [ ] reconciliation PR の diff に verification-report 削除が含まれていない

### 品質要件

- [ ] 独立ブランチ・独立コミットで cleanup が完結している
- [ ] コミットメッセージに削除理由が明示されている
- [ ] PR scope に Sheets 撤回や reconciliation の差分が混ざっていない

### ドキュメント要件

- [ ] 削除対象ファイル一覧が本タスク指示書またはコミット説明に記録されている
- [ ] B-06 blocker が本タスクで解消されたことが reconciliation タスク側に反映されている
- [ ] unassigned-task-detection に本タスクが記録されている

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| scope scan | reconciliation PR diff の内容 | verification-report 関連ファイルの変更が含まれない |
| reference scan | `rg -rn "verification.report" docs/ .claude/` | 削除後に参照箇所が残っていない |
| overlap scan | B-01 / B-02 変更対象との突き合わせ | 重複ファイルがない |
| commit scope | 独立 PR のコミット一覧 | cleanup 専用コミットのみ、reconciliation 差分が混在しない |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| B-01 / B-02 と削除対象が重複し conflict が発生する | 中 | 低 | Phase 1 で変更対象ファイルリストを突き合わせ、重複を事前に排除する |
| cleanup を後回しにして reconciliation PR に混入する | 中 | 高 | 本タスクを先行して独立 PR 化し、reconciliation PR 作成前にマージする |
| 削除したファイルが実は参照されており機能が壊れる | 高 | 低 | `rg` で参照箇所を全件確認してから削除する |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | B-06 blocker 発生元・scope 分離方針 |
| 参照 | `docs/30-workflows/ut09-direction-reconciliation/` | Phase 12 成果物ディレクトリ |
| 参照 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 運用ルール 2「scope 分離」 |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | reconciliation PR に unrelated cleanup を混ぜると差分が肥大化しレビュー困難。運用ルール 2「scope 分離」を守るため独立 PR 化が必須 |
| 原因 | Phase 12 review で verification-report 関連の未参照ファイルが旧ワークツリーに残存していることが判明。B-06 blocker として認識されるまで独立タスク化されていなかった |
| 対応 | reconciliation PR から分離し、専用ブランチ・専用 PR として処理する方針を明文化した |
| 再発防止 | PR 作成前に `git diff --name-only` で unrelated ファイルが混在しないか確認し、cleanup は常に独立 PR として分離する |

### 作業ログ

- 2026-04-29: UT-09 Phase 12 B-06 blocker として特定。task-verification-report-cleanup-001 として独立タスク化。

### 補足事項

- 本タスクは cleanup 専用であり、Sheets 撤回・reconciliation 本体（B-01 / B-02）とは独立して進める。
- reconciliation PR のマージ前に本タスクの独立 PR をマージすることで B-06 blocker を解消する。
