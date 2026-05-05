# Phase 5 成果物: 文書実体化 runbook（docs-only 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 / Issue #261 |
| Phase | 5（実装 → docs-only 読み替え: 文書実体化 runbook） |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |

## 目的

Phase 2 設計成果物（4 ファイル）が `outputs/phase-02/` に実体化されていることを確認し、aiworkflow-requirements `database-schema.md` の sync 系記述に対する更新差分を抽出して **提案ベースで** 記録する。実編集（DDL / コード / `database-schema.md` の Edit）は本 Phase で行わず、Phase 12 Step 1-A に引き渡す。

## 文書実体化チェック

| # | 必須ファイル | 役割 | V-i 対応 | 配置確認 |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-02/naming-canonical.md` | 命名 canonical 採択 | V-1 / V-6 | Phase 2 完了時に存在することが本 Phase 開始の前提 |
| 2 | `outputs/phase-02/column-mapping-matrix.md` | 論理 13 × 物理 1:N | V-2 / V-3 | 同上 |
| 3 | `outputs/phase-02/backward-compatibility-strategy.md` | 4 案比較 | V-4 | 同上 |
| 4 | `outputs/phase-02/handoff-to-ut04-ut09.md` | 直交境界 | V-5 | 同上 |

> 4 ファイルすべてが存在し、Phase 4 の V-1〜V-7 grep / Read コマンドが正しく対象を特定できる状態を本 Phase の到達点とする。

## 物理 DDL / コード変更ゼロ — 禁止操作リスト

本 Phase で **絶対に行ってはならない操作**:

1. `apps/api/migrations/*.sql` の追加 / 改変 / 削除
2. `apps/api/src/jobs/sync-sheets-to-d1.ts` の編集
3. `apps/api/src/**` 全般のコード変更
4. `apps/web/**` 配下の編集
5. `.claude/skills/aiworkflow-requirements/references/database-schema.md` の **直接編集**（提案のみ）
6. wrangler / `scripts/cf.sh` 経由での D1 書込操作（read-only `whoami` / `list` も本 Phase では実行不要）
7. enum 値 / retry 値 / offset 値の決定（U-8 / U-9 直交）

## aiworkflow-requirements 更新提案 runbook

### Step 1-A 引き渡し（実編集は Phase 12）

```
1. drift 検出コマンド実行（read-only）
   grep -n "sync_log\|sync_job_logs\|sync_locks" \
     .claude/skills/aiworkflow-requirements/references/database-schema.md

2. 出力結果を outputs/phase-05/aiworkflow-requirements-update-proposal.md に
   下記テーブル形式で転記:

   | 行番号 | 現状記述（before） | 提案記述（after） | 理由 |
   | LNNN  | sync_log（単独）  | sync_job_logs / sync_locks（canonical 名） | 物理 canonical 整合 |

3. drift 0 件なら「更新不要」を明記し本 Phase で完結

4. drift 1 件以上なら以下を Phase 12 Step 1-A 引き渡し contract へ
   - 編集対象: .claude/skills/aiworkflow-requirements/references/database-schema.md
   - 編集者:   Phase 12 Step 1-A 担当
   - タイミング: aiworkflow-requirements skill の indexes 再生成と同時
   - 後処理:   mise exec -- pnpm indexes:rebuild
```

> **本 Phase では Edit / Write を database-schema.md に対して行わない。提案ファイルのみ作成する。**

## canUseTool 適用範囲

| 操作対象 | 自動許可 | 人手承認 | 禁止 |
| --- | :-: | :-: | :-: |
| `outputs/phase-05/*.md` の Write / Edit | ○ | | |
| Phase 2 成果物の Read | ○ | | |
| `database-schema.md` の Read | ○ | | |
| `database-schema.md` の Edit / Write | | （Phase 12 で承認） | ○（本 Phase では禁止） |
| `apps/api/migrations/*.sql` の Edit / Write | | | ○ |
| `apps/api/src/**` の Edit / Write | | | ○ |
| wrangler / cf.sh 経由 D1 操作 | | | ○ |

## index.md cross-link 整合確認

| index.md 項目 | 参照先パス |
| --- | --- |
| 命名 canonical | `outputs/phase-02/naming-canonical.md` |
| マッピング | `outputs/phase-02/column-mapping-matrix.md` |
| 後方互換 | `outputs/phase-02/backward-compatibility-strategy.md` |
| 直交性 | `outputs/phase-02/handoff-to-ut04-ut09.md` |
| 検証戦略 | `outputs/phase-04/test-strategy.md` |
| 失敗系 | `outputs/phase-06/main.md` |
| AC matrix | `outputs/phase-07/ac-matrix.md` |
| drift 提案 | `outputs/phase-05/aiworkflow-requirements-update-proposal.md` |

dead link が無いことを目視確認する。

## Phase 12 Step 1-A 引き渡し contract

| 項目 | 値 |
| --- | --- |
| 編集対象ファイル | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 編集内容 | drift list（`outputs/phase-05/aiworkflow-requirements-update-proposal.md`）に記録された before → after を適用 |
| 編集者 | Phase 12 Step 1-A 担当 |
| 実行タイミング | aiworkflow-requirements skill indexes 再生成と同一トランザクション |
| 後処理コマンド | `mise exec -- pnpm indexes:rebuild`、続けて `verify-indexes-up-to-date` gate 通過確認 |
| 検証 | drift 0 件であることを再 grep で確認 |

## 関連

- `phase-05.md`（本成果物の親仕様）
- `outputs/phase-05/aiworkflow-requirements-update-proposal.md`（drift list / 更新提案）
- `outputs/phase-04/test-strategy.md`（V-1〜V-7）
- Phase 12 Step 1-A（実編集の実施先）
