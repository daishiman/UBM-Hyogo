# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 前 Phase | 11 (実装 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |

## 目的

Phase 12 の 5 必須タスク + Task 6 compliance check を実施し、合計 7 ファイルを実体出力する。本 workflow の `taskType` は `implementation` であり、実装完了 + Phase 11 NON_VISUAL evidence 取得 + Phase 12 7 ファイル parity が揃ったため Phase 1-12 を completed に昇格する。Phase 13 は user approval 待ちのまま維持する。

## Phase 12 必須タスク

### Task 12-1: 実装ガイド作成（Part 1 + Part 2）

- 出力: `outputs/phase-12/implementation-guide.md`
- **Part 1（中学生レベル概念説明）**:
  - 例え話: 「学校の出席簿を自分のページに貼る仕組み」
  - 必須要素チェックリスト 5 項目（日常生活の例え / 専門用語セルフチェック表 5 用語以上 / 学校生活レベル語彙 / 「なぜ」先行 / ドラフト逐語一致）
  - 専門用語表: repository / N+1 / branded type / chunk / DI を中学生語に
- **Part 2（技術者レベル）**:
  - API 型: `AttendanceProvider`, `findByMemberIds` の signature
  - request / response / error / edge case
  - 02a interface 不変ガイド
  - branded type module 配置原則
  - chunk(80) 戦略の根拠

### Task 12-2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）

- 出力: `outputs/phase-12/system-spec-update-summary.md`
- **Step 1-A**: `docs/00-getting-started-manual/specs/01-api-schema.md` に attendance read 経路追記
- **Step 1-B**: `docs/00-getting-started-manual/specs/08-free-database.md` に bind 上限 + chunk 戦略追記
- **Step 1-C**: aiworkflow-requirements skill (`indexes`) の attendance 関連追加
- **Step 1-D**: 02a Phase 12 `unassigned-task-detection.md` の本項目を「解消済み」へ更新
- **Step 2 (条件付き)**: 02b 仕様書からの相互参照リンク追加

### Task 12-3: ドキュメント更新履歴

- 出力: `outputs/phase-12/documentation-changelog.md`
- 変更ファイル一覧 / 理由 / 影響範囲

### Task 12-4: 未タスク検出レポート（0 件でも出力必須）

- 出力: `outputs/phase-12/unassigned-task-detection.md`
- 候補:
  - 出席登録 / 編集 / 削除 (write 系) → 別タスク化
  - attendance 集計ダッシュボード → 別タスク化
  - Hono ctx 経由 DI への移行 → 将来候補（promote no-op / 02a/02b 完了後の repository 層方針確定タスクに promote）
  - レスポンスサイズ pagination → F-11 起票候補
- 各候補に promotion target / no-op reason / evidence path を routing

### Task 12-5: スキルフィードバックレポート（改善点なしでも出力必須）

- 出力: `outputs/phase-12/skill-feedback-report.md`
- task-specification-creator skill / aiworkflow-requirements skill への feedback
- 苦戦箇所 / 原因 / 対応 / 再発防止 + promotion target

### Task 12-6: Phase 12 task spec compliance check

- 出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- root / outputs `artifacts.json` parity 確認
- 7 ファイル実体確認チェックリスト
- root 単独正本宣言（`outputs/artifacts.json` 不在ケースの compliance 文言テンプレ準拠）

## Legacy stub の扱い

- `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` を legacy stub として残置
- legacy stub に `## Canonical Status` 節を追加し、本 workflow root を絶対参照
- aiworkflow-requirements の `legacy-ordinal-family-register.md` mapping に登録

## State 遷移

| 種別 | 値 | 条件 |
| --- | --- | --- |
| `metadata.workflow_state` | `implemented` | 実装完了 + Phase 11 evidence 4 ファイル全取得 + AC-1〜10 充足 |
| 各 `phases[].status` | Phase 12 完了時に `completed` | — |
| 旧単票 | legacy 化 | Canonical Status 節追加 |

## 7 ファイル実体確認チェックリスト

- [ ] outputs/phase-12/main.md
- [ ] outputs/phase-12/implementation-guide.md
- [ ] outputs/phase-12/system-spec-update-summary.md
- [ ] outputs/phase-12/documentation-changelog.md
- [ ] outputs/phase-12/unassigned-task-detection.md
- [ ] outputs/phase-12/skill-feedback-report.md
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件

- [ ] 7 ファイル全て実体存在
- [ ] root / outputs `artifacts.json` の Phase status parity 確認
- [ ] 02a `unassigned-task-detection.md` 該当行が「解消済み」更新
- [ ] 02b 仕様書から相互参照リンク追加
- [ ] aiworkflow-requirements skill / system spec 同 wave 更新
- [ ] legacy stub の Canonical Status 節追加
- [ ] LOGS.md / SKILL changelog 同 wave 更新

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 12 を completed

## 次 Phase

- 次: Phase 13 (PR 作成)
- 引き継ぎ: 7 ファイル + system spec sync 完了状態。Phase 13 は user 承認 gate

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
