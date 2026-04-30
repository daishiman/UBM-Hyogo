# Phase 5: 実装（docs-only 読み替え＝文書実体化 runbook）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（U-UT01-07） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（docs-only: 文書実体化 runbook） |
| 作成日 | 2026-04-30 |
| 前 Phase | 4（文書検証戦略） |
| 次 Phase | 6（失敗系拡充） |
| 状態 | spec_created |
| タスク分類 | docs-only-design-reconciliation（runbook 縮約） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #261 |

## 目的

本タスクはコード / DDL を生成しない。従来 Phase 5 の「実装」は **Phase 2 設計成果物の文書実体化（outputs/phase-02/*.md として配置済みであることの確認）** に読み替える。Phase 4 で確定した V-1〜V-7 が全て PASS する状態に文書を到達させ、aiworkflow-requirements `database-schema.md` の sync 系記述更新差分を Phase 12 の Step 1-A に引き渡す runbook を整備する。**実編集（DDL 追加 / migration 改変 / コード変更 / `database-schema.md` 直接編集）は本 Phase で行わない**。

## 実行タスク

1. Phase 2 成果物 4 点が `outputs/phase-02/` に実体化されていることを確認する（完了条件: 4 ファイルが存在し V-1〜V-7 で参照可能）。
2. V-7 の grep 結果から `database-schema.md` の sync 系記述更新差分（drift list）を抽出し、`outputs/phase-05/aiworkflow-requirements-update-proposal.md` に提案ベースで記述する（完了条件: drift 件数と更新前後の文字列対が列挙、ただし実編集は行わない）。
3. Phase 12 Step 1-A 引き渡し runbook を整備する（完了条件: Step 番号・対象ファイル・編集者・実行タイミングが明記）。
4. 「物理 DDL / コード変更を行わない」ことを不変条件として明示する（完了条件: 禁止リストが本ドキュメントに明記）。
5. canUseTool 適用範囲を明記する（完了条件: 自動許可 / 人手承認の境界が明確）。
6. UT-04 / UT-09 受け側が参照する canonical name / mapping / migration 戦略の最終位置を index.md からも辿れることを確認する（完了条件: cross-link が成立）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | 命名決定の正本 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | 1:N マッピング |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | 4 案比較 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | U-8 / U-9 直交性 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-04.md | V-1〜V-7 入力 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 検出対象（Read のみ） |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（Read のみ・改変権限なし） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理側利用フロー（Read のみ） |
| 必須 | CLAUDE.md | scripts/cf.sh 経由実行ルール（本 Phase では DB 操作なし） |

## 文書実体化チェック（Phase 2 成果物 4 点）

| # | 必須ファイル | 役割 | V-i との対応 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-02/naming-canonical.md` | 命名 canonical 採択（A/B/C）と理由 | V-1 / V-6 |
| 2 | `outputs/phase-02/column-mapping-matrix.md` | 論理 13 カラム × 物理 1:N | V-2 / V-3 |
| 3 | `outputs/phase-02/backward-compatibility-strategy.md` | no-op / view / rename / 新テーブル+移行 の 4×4 評価 | V-4 |
| 4 | `outputs/phase-02/handoff-to-ut04-ut09.md` | U-8 / U-9 / U-10 / UT-04 / UT-09 直交境界 | V-5 |

> 4 ファイルすべてが存在し、Phase 4 検証コマンドが引数として参照できる状態を本 Phase の到達点とする。

## 物理 DDL / コード変更ゼロの不変条件【重要】

本 Phase で **絶対に行わないこと**:

- `apps/api/migrations/*.sql` の追加 / 改変 / 削除
- `apps/api/src/jobs/sync-sheets-to-d1.ts` の編集
- `apps/api/src/**` 配下のコード変更全般
- `apps/web/**` 配下の編集
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の **直接編集**（更新提案のみ作成し、実編集は Phase 12 Step 1-A）
- D1 への wrangler / scripts/cf.sh 経由のあらゆる書込操作

## aiworkflow-requirements 更新提案 runbook

### Step 1-A への引き渡し（実編集は Phase 12）

```
1. V-7 の grep を実行:
     grep -n "sync_log\|sync_job_logs\|sync_locks" \
       .claude/skills/aiworkflow-requirements/references/database-schema.md

2. 出力された行番号 / 文字列を抽出し、以下のテーブル形式で
   outputs/phase-05/aiworkflow-requirements-update-proposal.md に記録:

   | 行番号 | 現状記述（before） | 提案記述（after） | 理由 |
   | --- | --- | --- | --- |
   | LNNN | sync_log（単独） | sync_job_logs / sync_locks（canonical 名） | 物理側 canonical に整合 |

3. drift が 0 件の場合は「不要」を明記し本 Phase で完結。

4. drift が 1 件以上の場合は以下を Phase 12 引き渡し contract に記入:
   - 編集対象ファイル: .claude/skills/aiworkflow-requirements/references/database-schema.md
   - 編集者: Phase 12 Step 1-A 担当
   - 実行タイミング: aiworkflow-requirements skill の indexes 再生成と同時
   - 実編集後コマンド: mise exec -- pnpm indexes:rebuild
```

> **注意**: 上記 runbook の実編集（Edit / Write）は **本 Phase では実行しない**。提案ファイルの作成のみ。

## canUseTool 適用範囲

| 操作 | 自動許可 / 人手承認 |
| --- | --- |
| `outputs/phase-05/*.md` の Write / Edit（提案ファイル作成） | 自動許可 |
| Phase 2 成果物の存在確認（Read） | 自動許可 |
| `database-schema.md` の Read | 自動許可 |
| `database-schema.md` の Edit / Write | **禁止**（Phase 12 Step 1-A で人手承認のうえ実行） |
| `apps/api/migrations/*.sql` の Edit / Write | **禁止** |
| `apps/api/src/**` の Edit / Write | **禁止** |
| wrangler / scripts/cf.sh 経由の D1 操作 | **禁止**（本タスクスコープ外） |

## index.md cross-link 確認

| index.md セクション | 参照先 |
| --- | --- |
| 「決定事項」 | `outputs/phase-02/naming-canonical.md` |
| 「マッピング」 | `outputs/phase-02/column-mapping-matrix.md` |
| 「後方互換」 | `outputs/phase-02/backward-compatibility-strategy.md` |
| 「直交性」 | `outputs/phase-02/handoff-to-ut04-ut09.md` |
| 「下流引き継ぎ」 | UT-04 / UT-09 への canonical name 申し送り |

## 実行手順

1. Phase 2 成果物 4 点の存在を `ls` で確認する。
2. V-7 grep を実行し drift 件数を抽出する（書込操作なし）。
3. drift list を `outputs/phase-05/aiworkflow-requirements-update-proposal.md` に転記する（提案のみ）。
4. Phase 12 Step 1-A 引き渡し runbook を本ドキュメントに固定する。
5. 物理 DDL / コード変更ゼロの不変条件を明記する。
6. canUseTool 範囲を表で固定する。
7. index.md cross-link を確認し dead link が無いことを目視。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | V-1〜V-7 が PASS する文書状態を本 Phase で到達 |
| Phase 6 | 失敗系（誤新規 CREATE / rename 後追い 等）に対するガード文の挿入位置を本 Phase の文書配置に依存 |
| Phase 7 | AC × V trace の確定入力 |
| Phase 12 | Step 1-A で `database-schema.md` を実編集（本 Phase では提案のみ） |
| UT-04 | canonical name / migration 戦略を本 Phase 確定文書から参照 |
| UT-09 | canonical ledger / lock テーブル名を本 Phase 確定文書から参照 |

## 多角的チェック観点（AI が判断）

- 価値性: Phase 2 成果物 4 点が下流タスクに迷い無く参照される構造になっているか。
- 実現性: 本 Phase が DB / コード操作を一切行わずに完結するか。
- 整合性: drift list が `database-schema.md` の Read 結果と diff ゼロか。
- 運用性: Phase 12 Step 1-A 引き渡し runbook が実編集者にとって曖昧さなく書かれているか。
- 認可境界: 禁止操作リストが網羅的で、Claude Code が誤って物理 DDL を触らない構造か。
- セキュリティ: API token / OAuth / D1 binding 値が本ドキュメントに残っていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | Phase 2 成果物 4 点の存在確認 | spec_created |
| 2 | drift list 抽出と提案ファイル作成 | spec_created |
| 3 | Phase 12 Step 1-A 引き渡し runbook | spec_created |
| 4 | 物理 DDL / コード変更ゼロの不変条件明記 | spec_created |
| 5 | canUseTool 範囲確定 | spec_created |
| 6 | index.md cross-link 確認 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 文書実体化チェック・drift 提案 runbook・禁止操作リスト・canUseTool 範囲 |
| ドキュメント | outputs/phase-05/aiworkflow-requirements-update-proposal.md | drift 提案テーブル（Phase 12 Step 1-A 入力。drift 0 件なら「不要」明記） |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] Phase 2 成果物 4 点が `outputs/phase-02/` に存在することを確認
- [ ] V-7 grep 結果から drift list を抽出済み（または drift 0 件を明記）
- [ ] Phase 12 Step 1-A 引き渡し runbook が Step 番号・対象・編集者・タイミング付きで記述
- [ ] 物理 DDL / コード変更ゼロの不変条件（禁止操作 7 種以上）が明記
- [ ] canUseTool 範囲表で自動許可 / 禁止 / 人手承認が明確
- [ ] index.md cross-link が dead link 無し
- [ ] 本 Phase 中で実 DDL / コード / `database-schema.md` 編集が 0 件

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物 2 件が `outputs/phase-05/` に配置済み（main.md / aiworkflow-requirements-update-proposal.md）
- 物理 DDL / コード変更が 0 件であることを禁止操作リストで担保
- wrangler 直叩き / D1 書込操作が本ドキュメント内に 0 件
- Phase 4 V-1〜V-7 の合格状態が達成可能な文書配置になっている

## 次 Phase への引き渡し

- 次 Phase: 6（失敗系拡充）
- 引き継ぎ事項:
  - 文書実体化済み 4 ファイルを Phase 6 失敗系の検査対象として使用
  - drift list（あれば）を Phase 12 Step 1-A の編集 backlog に繰り入れ
  - 禁止操作リストを Phase 6 失敗系の (a)〜(e) で「やってはいけないこと」として再掲
- ブロック条件:
  - Phase 2 成果物 4 点のいずれかが未配置
  - 本 Phase 中に物理 DDL / コード / `database-schema.md` の実編集が混入
  - Phase 12 Step 1-A 引き渡し runbook が曖昧（編集者・タイミング不明）
