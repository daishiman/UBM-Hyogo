# 未完了タスク ワークフロー統合ガイド

> 親ファイル: [unassigned-task-guidelines.md](unassigned-task-guidelines.md)
> 読み込み条件: Phase 10/11 レビュー連携・タスク完了フロー・横断的機能パターンを確認するとき。

---

## Phase 10 レビュー結果との連携

### レビュー判定別の対応

| 判定     | 対応                                         |
| -------- | -------------------------------------------- |
| PASS     | 次Phaseへ進行                                |
| MINOR    | 軽微な指摘 → 未完了タスクとして記録して進行  |
| MAJOR    | 重大な問題 → 影響範囲に応じたPhaseへ戻る     |
| CRITICAL | 致命的な問題 → Phase 1へ戻りユーザーと再確認 |

### MINOR判定時のフロー

```
レビューでMINOR判定
    ↓
指摘事項を分析
    ↓
未完了タスク指示書を作成
    ↓
docs/30-workflows/unassigned-task/ に配置
    ↓
Phase 11へ進行
```

---

## Phase 11 手動テスト結果との連携

### 発見された課題の分類

| 分類         | 対応                         |
| ------------ | ---------------------------- |
| 現スコープ内 | Phase 5へ戻り修正            |
| スコープ外   | 未完了タスクとして記録       |
| 重大な不具合 | 即時修正（エスカレーション） |

---

## タスク完了時のワークフロー

unassigned-taskディレクトリに配置されたタスクが完了した場合、以下の手順でファイルを更新・移動する。

### 完了時フロー

```
タスク実行完了（Phase 12または13）
    ↓
ステータス更新（ファイル内メタ情報）
    ↓
ファイル移動（unassigned-task → completed-tasks）
    ↓
task-workflow.md の参照パスを completed-tasks 側に更新
    ↓
完了日追記
    ↓
[log-usage]（スキル使用ログ記録）
```

### ステータス更新手順

| #   | 手順           | 変更内容                                                             |
| --- | -------------- | -------------------------------------------------------------------- |
| 1   | ステータス更新 | メタ情報テーブルの「ステータス: 未実施」を「ステータス: 完了」に変更 |
| 2   | 完了日追記     | メタ情報テーブルに「完了日: YYYY-MM-DD」行を追加                     |
| 3   | ファイル移動   | `unassigned-task/` → `completed-tasks/`                              |
| 4   | 参照先更新     | `task-workflow.md` の該当行を `completed-tasks/` パスへ更新          |

### コマンド例

```bash
# 1. ステータスを完了に更新（ファイル編集）
# 例: task-slide-directory-settings.md

# 2. 完了日を追記
# | 完了日       | 2026-01-14 |

# 3. ファイル移動
mv docs/30-workflows/unassigned-task/task-{{task-name}}.md \
   docs/30-workflows/completed-tasks/task-{{task-name}}.md
```

### 配置先ディレクトリ

| ディレクトリ                         | 内容                 |
| ------------------------------------ | -------------------- |
| `docs/30-workflows/unassigned-task/` | 未実施タスクの配置先 |
| `docs/30-workflows/completed-tasks/` | 完了タスクの配置先   |

> **⚠️ 配置先の注意（P3 再発防止 / TASK-9B-I 教訓）**
>
> 未タスク指示書は必ず `docs/30-workflows/unassigned-task/` に配置すること。
> 親タスクの `docs/30-workflows/{feature-name}/tasks/` ディレクトリに配置してはいけない。
> TASK-9B-I では親タスクの `tasks/` ディレクトリと混同し、誤った場所に配置するミスが発生した。
> 配置後は `ls docs/30-workflows/unassigned-task/` で物理ファイルの存在を検証すること。

### チェックリスト

| #   | 確認項目                                             | 完了 |
| --- | ---------------------------------------------------- | ---- |
| 1   | タスクファイルのステータスが「完了」に更新されている | ☐    |
| 2   | 完了日が記載されている                               | ☐    |
| 3   | ファイルが`completed-tasks/`に移動されている         | ☐    |
| 4   | `task-workflow.md` の参照先パスが `completed-tasks/` に更新されている | ☐    |
| 5   | 該当スキルのLOGS.mdに使用ログが記録されている        | ☐    |

---

## 横断的機能の未タスク検出パターン

リトライ機構やエラーハンドリング等の横断的機能を実装した場合、以下のパターンで関連する未タスクが発生しやすい。Phase 12での検出漏れを防ぐため、該当する場合はチェックする。

### リトライ機構実装時の検出パターン

| チェック項目 | 未タスク候補 | 優先度目安 |
| --- | --- | --- |
| リトライ設定をUIから変更可能にする必要があるか？ | 設定画面UI | 低 |
| リトライ履歴をDB/ログに永続化する必要があるか？ | 履歴永続化 | 低 |
| サーキットブレーカーパターンが必要か？ | CB実装 | 中 |
| Renderer側にリトライ状態を表示する必要があるか？ | Hookイベント対応 | 中 |

### エラーハンドリング実装時の検出パターン

| チェック項目 | 未タスク候補 | 優先度目安 |
| --- | --- | --- |
| エラーメッセージの国際化が必要か？ | i18n対応 | 低 |
| エラー統計・レポーティングが必要か？ | エラーレポート機能 | 低 |
| 構造化ログへの出力が必要か？ | ログ構造化 | 中 |

### UI コンポーネント実装時の検出パターン

| チェック項目 | 未タスク候補 | 優先度目安 |
| --- | --- | --- |
| ダークモード対応が必要か？ | テーマ対応 | 低 |
| アクセシビリティ（WCAG）準拠が必要か？ | a11y改善 | 中 |
| レスポンシブ対応が必要か？ | レスポンシブ | 低 |

> **参考**: TASK-SKILL-RETRY-001（SkillExecutorリトライ機構）では、リトライ機構実装パターンの4項目全てが未タスクとして検出された。

### コンポーネントテスト実装時の検出パターン

| チェック項目                                     | 未タスク候補             | 優先度目安 |
| ------------------------------------------------ | ------------------------ | ---------- |
| テストケース名の命名規則が統一されているか？     | 命名規則統一             | 低         |
| 未使用importが残存していないか？                 | import整理               | 低         |
| E2Eテストとの統合が必要か？                      | E2E統合                  | 中         |
| Visual Regressionテストの導入が必要か？          | VRT導入                  | 低         |

> **参考**: TASK-8B（コンポーネントテスト280テスト）では、Phase 10 MINOR指摘2件（M-01: テスト名命名規則、M-02: 未使用import）が未タスクとして検出された。候補6件中、「機能に影響なし」のもの含め**MINOR判定は全てタスク化**がルール。カバレッジ達成度・実行時間・費用対効果の3軸で不要候補をフィルタリング。

---

## 参照リソース

- テンプレート: `assets/unassigned-task-template.md`
- エージェント: `agents/generate-unassigned-task.md`

---

## `spec_created` → 実装派生タスク化パターン（2026-04-27 追加）

設計タスク（`spec_created`）が完了した時点で、実装に必要な後続タスクを未タスクとして formalize するパターンが定型化している。Phase 12 の `unassigned-task-detection.md` 作成時に以下の 2 系統を必ず確認する。

### パターン A: 設計タスクから実装派生 N 件

設計仕様書を完成させた直後、その実装に必要な離散タスク群を独立 UT として切り出す。

| 例 | 起点（設計） | 派生（実装） |
| --- | --- | --- |
| UT-13 Cloudflare KV セッションキャッシュ | `spec_created` | UT-30〜UT-34（Namespace 登録 / binding / helper / 使用量監視 / secret leak guard） |
| UT-12 Cloudflare R2 ストレージ | `spec_created` | bucket prod/staging 作成 / binding / presigned URL / CORS など別 UT 化 |

### パターン B: 設計タスクから実装ゲート 1 件

設計と実装の間に「実装前ゲート」を 1 つの未タスクとして残し、依存・苦戦箇所・PII リスク等の事前確認を formalize する。

| 例 | 起点（設計） | ゲート（実装前確認） |
| --- | --- | --- |
| UT-08 監視/アラート設計 | `spec_created` | UT-08-IMPL（実装前ゲート 5 項目 + 苦戦箇所 7 件） |

### 形式化の手順

1. 設計仕様書 Phase 12 で「実装に必要な離散単位」を抽出
2. 単位ごとに `docs/30-workflows/unassigned-task/UT-XX-<semantic-name>.md` を新規作成
3. `unassigned-task-detection.md` に派生 UT 一覧を表形式で記録（current / baseline 分離）
4. `task-workflow.md` に派生 UT を `next-wave` 候補として登録
5. 設計タスク本体のステータスを `spec_created` のまま維持（実装派生は別 UT が処理）

### `unassigned-task-detection.md` での記載ルール

- 派生 UT が 0 件の場合: 「全実装は本タスク内に内包、派生不要」と明記
- 派生 UT が複数ある場合: 「current（本 wave 由来）/ baseline（既存 backlog）」を分離
- Phase 10 MINOR からの formalize は、対応する MINOR ID を派生 UT 内で逆参照する

---

## 追加ルール: verification-report / MINOR formalization（2026-03-13）

### 未タスク化の起点

- `outputs/verification-report.md` の `MINOR` / remaining issues
- Phase 11 のスクリーンショット検証・手動試験で発見した discoverability / 情報設計課題
- system spec 更新時に「本体完了と切り分けた方が責務が明確」と判断できる follow-up 項目

### formalize 判断基準

- 本体完了判定は維持できるが、放置すると再発・理解コスト増につながる
- 複数の軽微事項を 1 つの品質テーマへ統合した方が実装責務が明確になる
- `task-workflow.md` と Phase 12 成果物の両方に同一 ID を残したい

### 記述ルール

- `3.5 実装課題と解決策` に、なぜ残件化したかと再発防止の観点を 2〜4 項目で残す
- `## 8. 参照情報` に `verification-report.md` や `manual-test-result.md` など発見元を入れる
- `verify-unassigned-links.js` と `audit-unassigned-tasks.js --diff-from HEAD` の結果を Phase 12 成果物側にも記録する

## 設計タスク全体が実装化する場合の処理

設計タスクの成果物全体が次 Wave で実装される場合（例: UT-08 monitoring-alert-design → UT-08-IMPL）:

1. **元タスク**: `state: spec_created` で確定、設計のみで完結
2. **派生 IMPL タスク**: `docs/30-workflows/unassigned-task/UT-XX-IMPL-<name>-implementation.md` として独立起票
3. **メタ情報**: 上流設計パス・元タスク ID・実装前ゲート・受入条件・参照資料を必須記載
4. **Wave 境界**: IMPL タスクは元タスクの完了 Wave + 1 以降を推奨 Wave とする
5. **逆参照**: 元タスクの `参照資料` から IMPL タスクへ一方向リンクを残す

`unassigned-task-detection.md` の検出パターン例にも本パターン（全タスク実装化）を追加する。Phase 12 での具体手順は [phase-template-phase12.md](phase-template-phase12.md) §設計タスク特有を参照。
