# skill フィードバックレポート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 12 |
| 対象 skill | `task-specification-creator` / `aiworkflow-requirements` |
| 改善提案件数 | 2 件 |

## 1. task-specification-creator skill — dry-run 仕様 → IMPL 仕様の差分記述ガイダンス

### 観察された課題

本タスク（UT-GOV-002-IMPL）は上流 dry-run 仕様（UT-GOV-002）が docs-only として完成済みの状態で、実 workflow 編集 + VISUAL evidence 取得を担う **IMPL 派生タスク**として設計された。
この「dry-run docs-only から IMPL VISUAL への昇格」パターンは以下の点で skill ガイダンスが薄い：

1. **Phase 12 implementation-guide.md における「Part 2 で何を dry-run 仕様の機械コピーにすべきでないか」**
   - 現状 `.claude/skills/task-specification-creator/references/phase-12-spec.md` は単独タスクの IMPL 観点で書かれており、「上流 dry-run 仕様が既にある場合の差分記述」については明示的なガイダンスがない。
   - 本タスクでは `phase-12.md` 仕様内で「dry-run 仕様の機械コピーではなく IMPL 特性（実 workflow 編集 + 実走 + スクリーンショット）を反映」と明示しており、これを skill 側のテンプレに昇格すべき。

2. **Phase 11 manual-smoke-log.md における spec_created 時点の「PENDING テンプレ」記法**
   - VISUAL タスクで spec_created 時点に実走未実施のとき、表をどう埋めるかのガイダンスが薄い。
   - 本タスクでは「全行 PENDING + 末尾に実走時の埋め方」という形式を採用したが、skill 側にこのテンプレが固定化されていない。

### 改善提案

`.claude/skills/task-specification-creator/references/phase-12-spec.md` に以下のセクションを追加することを提案：

- **「上流が dry-run / docs-only の場合の Phase 12 差分記述ルール」**
  - 上流仕様の存在を `system-spec-update-summary.md` Step 1-C「関連タスク更新候補」で必ず参照
  - `implementation-guide.md` Part 2 は dry-run runbook を実機向けに具体化（コピーではなく実走可能な形に詳細化）
  - `documentation-changelog.md` で実 workflow ファイルと dry-run 仕様の両方を列挙

- **「VISUAL タスクの spec_created 時点における Phase 11 出力テンプレ」**
  - `manual-smoke-log.md` の表は全行 `PENDING（Phase 13 ユーザー承認後）` で埋める
  - `screenshots/README.md` には命名規約 / 撮影位置 / マスク要件 / 「未取得（Phase 13 で承認後取得）」を明記
  - 画像ファイル本体は spec_created 時点では作成しない

## 2. aiworkflow-requirements skill — Step 2 判定の Governance 系 N/A 理由文化

### 観察された課題（軽微）

Governance / Branch Protection 系タスク（本タスク）では Step 2 判定が **大半 `N/A`** になる。これは skill 設計上正しい挙動だが、`N/A` 判定の理由文の網羅性が個人技に依存している。

### 改善提案（任意）

`.claude/skills/aiworkflow-requirements/SKILL.md` に「Governance / CI / branch protection 系タスクの Step 2 判定における再判定トリガ条件チェックリスト」を追加し、以下の 5 項目を必ず確認するよう明文化することを提案：

1. OIDC 化（`id-token: write`）
2. `workflow_run` 採用
3. D1 / KV メタデータ参照
4. Secret 追加
5. RBAC / GitHub team 連携

本タスク `system-spec-update-summary.md` Step 2 でこの 5 項目チェックリストを実装したので、skill 側に逆フィードバックする形を想定。

## サマリ

| skill | 改善提案 | 重要度 |
| --- | --- | --- |
| task-specification-creator | dry-run → IMPL 差分記述ルール / VISUAL spec_created テンプレ | 中 |
| aiworkflow-requirements | Governance 系 Step 2 判定の 5 項目トリガチェックリスト明文化 | 低 |

## 完了条件

- [x] 改善点なしでも出力（実際は 2 件提案あり）
- [x] dry-run → IMPL 差分記述に関するセクションを 1 つ含む
