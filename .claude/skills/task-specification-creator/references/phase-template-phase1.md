# Phase Template Phase1

> 親ファイル: [phase-templates.md](phase-templates.md)

## 対象

Phase 1: 要件定義。

## テンプレート

```markdown
# Phase 1: 要件定義

## メタ情報

| 項目             | 値                                         |
| ---------------- | ------------------------------------------ |
| Phase            | 1                                          |
| 機能名           | {{FEATURE_NAME}}                           |
| 作成日           | {{CREATED_DATE}}                           |
| タスク種別       | {{TASK_TYPE}}（feature/refactor/fix/docs-only） |
| visualEvidence   | {{VISUAL_EVIDENCE}}（true/false）          |
| scope            | {{SCOPE}}（実装範囲 or 「テンプレート作成のみ」） |

> **必須項目**: 上記 6 行は省略不可。`docs-only` の場合は `scope` に handoff 先 task spec のパスを併記する（出典: T-6 / Issue #161）。

## 目的

タスクの目的、スコープ、受け入れ基準を明文化する。

## 実行タスク

- 要件抽出: ユーザー要求から機能要件・非機能要件を抽出
- 受け入れ基準作成: 各要件に対して検証可能な受け入れ基準を定義
- FR/NFR分類: 機能要件と非機能要件を分類し優先度を設定

## 参照資料

| 資料名       | パス                        | 説明             |
| ------------ | --------------------------- | ---------------- |
| システム要件 | `docs/00-requirements/*.md` | 既存システム要件 |
| ユーザー要求 | （会話履歴参照）            | 元のユーザー要求 |

## 実行手順

### 0. P50チェック: 既実装状態の調査（必須）

Phase 1 開始時に、対象ファイルの現在の実装状態を確認する。

```bash
# 対象ファイルの最近のコミット履歴
git log --oneline -20 -- <対象ファイルパス>

# 対象関数/機能が既に実装されているか確認
grep -n "<対象関数名>" <対象ファイルパス>
```

#### Props/型前提条件の確認（P65対策）

- 対象コンポーネントの Props 型定義を確認し、設計で前提とする Props が実在するか検証する
- 対象の型定義（SkillExecutionStatus 等）の現在の値セットを確認し、設計で前提とする値が実在するか検証する
- 存在しない場合は「新規追加」として Phase 2 で変更先ファイルパスを明記する（P32 準拠）

## 統合テスト連携【必須】

統合テストの再実行とゲート判定:

| 判定項目                 | 基準 | 結果       |
| ------------------------ | ---- | ---------- |
| ユニットテストLine       | 80%+ | {{RESULT}} |
| ユニットテストBranch     | 60%+ | {{RESULT}} |
| ユニットテストFunction   | 80%+ | {{RESULT}} |
| 結合テストAPI            | 100% | {{RESULT}} |
| 結合テストシナリオ正常系 | 100% | {{RESULT}} |
| 結合テストシナリオ異常系 | 80%+ | {{RESULT}} |

## 成果物

| 成果物             | パス                                  | 説明               |
| ------------------ | ------------------------------------- | ------------------ |
| 要件定義書         | `outputs/phase-1/requirements.md`     | 機能要件・非機能要件 |

## 完了条件

- [ ] 機能要件が全て抽出されている
- [ ] 受け入れ基準が検証可能な形で定義されている
- [ ] FR/NFR分類と優先度が設定されている
- [ ] **本Phase内の全タスクを100%実行完了**

## 次のPhase

Phase 2: 設計
```

## 1.X Schema / 共有コード Ownership 宣言（並列 wave 必須）

並列 wave（同一フェーズで複数タスクが同時進行する構成）では、共有 schema（D1 テーブル列追加 / Zod schema / packages/shared exports など）や `_shared/` 配下の共通コードに対する **ownership を Phase 1 で必ず宣言** する。宣言しないまま進めると、04b で発生した「`admin_member_notes.note_type` 列追加が 02c 範囲のはずだったが 04b で実施せざるを得なかった」のような wave 越境が発生し、artifacts.json の整合と PR 単位の責務分離が崩れる。

Phase 1 outputs（`requirements.md` または `artifacts.json`）に以下のチェックリストを必ず含める:

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | 例: `admin_member_notes.note_type` 列追加 / `packages/shared/zod/viewmodel` exports |
| 本タスクが ownership を持つか | yes / no（no の場合は ownership wave を明示） |
| 他 wave への影響 | consumer wave の列挙（例: 04b は consumer / 07a は producer） |
| 競合リスク | 同 schema を編集する並列 wave が他にあるか / 解決策（順序付け or 部分分割） |
| migration 番号 / exports 改名の予約 | 重複防止のための番号予約・命名予約 |

宣言が `no`（owner ではない）にも関わらず編集を実施した場合は、`unassigned-task-detection.md` でフォローアップタスクとして起票し、正式 owner wave へ補強差分の取り込みを依頼する。

参考実例: 04b では `admin_member_notes.note_type` を additive migration として 04b 内で実施し、Phase 12 で「02c 範囲の補強」として明示記録した（`04b-parallel-member-self-service-api-endpoints/outputs/phase-12/unassigned-task-detection.md`）。

## 1.X 外部 SaaS 無料枠仕様調査（リスク前置き）

監視・分析・認証等の SaaS 連携がある場合、Phase 1 ヒアリングで以下 3 点を必ず確保する:

1. **保存期間 / API quota / monthly cap**: 公式ドキュメントの最新値を Phase 1 outputs に記録（例: WAE 保存期間 31 日、UptimeRobot 5 分間隔）
2. **upgrade path と段階化**: 無料 → 有料移行の閾値・コスト・移行手順
3. **無料枠消費推定**: 月次推定値と SLA との照合

不確定な値は `outputs/phase-01/requirements.md` に「Wave N 実装直前に再確認」と注記し、IMPL タスクの `実装前ゲート` に転記する。SaaS 仕様の改定により設計時前提が陳腐化するリスクを抑える。

参考実例: UT-08 monitoring-alert-design では Phase 10 MINOR-02 として「Wave 2 着手直前に WAE 無料枠を公式情報で再確認」を明示化。

## 関連ガイド

- [phase-template-core.md](phase-template-core.md) — Phase 1-3 共通骨格

## Phase 1 必須入力: artifacts.json.metadata.visualEvidence

Phase 1 の DoD として以下を必須化する。未設定の場合、Phase 11 縮約テンプレ / VISUAL UI task テンプレの
発火判定が不可能になり、Phase 1 を差し戻す。

| メタフィールド | 必須値 | 確定タイミング |
| --- | --- | --- |
| `metadata.taskType` | `docs-only` / `implementation` / `skill-improvement` 等 | Phase 1 完了時 |
| `metadata.visualEvidence` | `VISUAL` / `NON_VISUAL` | Phase 1 完了時（Phase 5 で再判定） |
| `metadata.scope` | タスクの責務領域 | Phase 1 完了時 |
| `metadata.workflow_state` | `spec_created` / `in_progress` / `completed` | Phase 1 完了時（Phase 12 close-out で更新可否判定） |

判定コマンド:

```bash
jq -e '.metadata | (.taskType and .visualEvidence and .scope and .workflow_state)' \
  docs/30-workflows/<task>/artifacts.json \
  || echo "Phase 1 メタ未確定: 差戻し"
```

詳細な発火マトリクスは SKILL.md §「タスクタイプ判定フロー（docs-only / NON_VISUAL）」を参照。
