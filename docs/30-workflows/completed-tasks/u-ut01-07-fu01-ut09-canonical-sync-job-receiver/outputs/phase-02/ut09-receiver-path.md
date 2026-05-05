# Phase 2 成果物: UT-09 実装受け皿 path 確定

## 概要

本ドキュメントは Phase 1 の真の論点「UT-09 root 棚卸し」を満たす目的で、`docs/30-workflows/**` 配下の UT-09 系統候補を全件棚卸し、正本受け皿 path 1 件を採択し、棄却候補と棄却理由を明記する。

## 棚卸し範囲

`docs/30-workflows/**` 配下を find / grep し、UT-09 系統（Sheets→D1 同期ジョブ実装）に該当する全候補を以下に列挙する。

### 候補一覧

| # | path | 区分 | ステータス | 内容概要 |
| --- | --- | --- | --- | --- |
| 1 | `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` | 完了済タスク | completed | UT-09 直系の先行実装タスク。serial 同期実装の初版で完了済（merge 済）。 |
| 2 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | 未割当タスク仕様書 | unassigned | UT-09 後継として endpoint + audit 実装を含むスコープ。canonical 名を初めてコードに反映する受け皿候補。 |
| 3 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | 未割当フォローアップ | unassigned | UT-09 系列の方向性整合用フォローアップ。 |
| 4 | `docs/30-workflows/unassigned-task/task-ut09-legacy-umbrella-restore-001.md` | 未割当フォローアップ | unassigned | UT-09 legacy umbrella 復元用フォローアップ。 |
| 5 | `docs/30-workflows/unassigned-task/task-ut09-references-stale-audit-001.md` | 未割当フォローアップ | unassigned | UT-09 古い参照の棚卸しフォローアップ。 |
| 6 | `docs/30-workflows/unassigned-task/task-ut09-runtime-kill-switch-001.md` | 未割当フォローアップ | unassigned | UT-09 runtime kill switch 検討フォローアップ。 |
| 7 | `docs/30-workflows/unassigned-task/task-ut09-sheets-impl-withdrawal-001.md` | 未割当フォローアップ | unassigned | UT-09 sheets 実装の撤回検討フォローアップ。 |
| 8 | `docs/30-workflows/unassigned-task/task-ut09-sheets-migration-withdrawal-001.md` | 未割当フォローアップ | unassigned | UT-09 sheets migration 撤回検討フォローアップ。 |
| 9 | `docs/30-workflows/unassigned-task/task-ut09-sheets-secrets-withdrawal-001.md` | 未割当フォローアップ | unassigned | UT-09 sheets secrets 撤回検討フォローアップ。 |

## 採択結果

### 確定 path

| 項目 | 値 |
| --- | --- |
| 確定 path | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` |
| 採択方針 | 上記 unassigned 仕様書を正本タスク化し、後続で `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/` を新 root として workflow root 化する設計に展開する |
| unassigned detection から到達可能か | YES（`docs/30-workflows/unassigned-task/` 直下に存在し、自動巡回対象） |

### 採択根拠

1. **U-04（候補#1）は完了済で改変不可**: completed-tasks 配下にあり、再オープンせずに canonical 名の最初のコード反映受け皿として再利用するのは整合性を損なう。
2. **task-ut09-* 群（候補#3〜#9）は副次フォローアップ**: それぞれ direction reconciliation / legacy restore / stale audit / kill switch / withdrawal 検討といった**周辺フォローアップ**であり、メイン実装受け皿（endpoint + audit + canonical 名コード反映）のスコープを持たない。
3. **UT-21（候補#2）が canonical 名コード反映の最初のスコープ**: endpoint + audit 実装を含み、`sync_job_logs` / `sync_locks` の canonical 名を初めてコードに反映するスコープを持つ唯一の候補。AC-1（UT-09 実装受け皿確定）の要件と一致する。

### 棄却候補と棄却理由（表形式）

| path | 棄却理由 |
| --- | --- |
| `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` | 完了済タスク。再オープンせずに canonical 名のコード反映受け皿として転用するのは整合性を損なう。canonical 名の物理側使用は当該完了タスクで既に実装され、本タスクの責務は「未来の UT-09 実装が canonical 名で書かれることを保証する受け皿確定」である。 |
| `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | 方向性整合フォローアップであり、メイン実装受け皿ではない。 |
| `docs/30-workflows/unassigned-task/task-ut09-legacy-umbrella-restore-001.md` | legacy umbrella 復元の検討用であり、新規 endpoint + audit 実装スコープを含まない。 |
| `docs/30-workflows/unassigned-task/task-ut09-references-stale-audit-001.md` | 古い参照棚卸しのフォローアップ。canonical 名コード反映スコープを含まない。 |
| `docs/30-workflows/unassigned-task/task-ut09-runtime-kill-switch-001.md` | runtime kill switch 検討のフォローアップ。endpoint + audit 実装スコープを含まない。 |
| `docs/30-workflows/unassigned-task/task-ut09-sheets-impl-withdrawal-001.md` | 撤回検討フォローアップ。実装受け皿として不適格。 |
| `docs/30-workflows/unassigned-task/task-ut09-sheets-migration-withdrawal-001.md` | migration 撤回検討フォローアップ。実装受け皿として不適格。 |
| `docs/30-workflows/unassigned-task/task-ut09-sheets-secrets-withdrawal-001.md` | secrets 撤回検討フォローアップ。実装受け皿として不適格。 |

## AC-1 への対応

- 確定 path = `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`
- unassigned detection から到達可能（unassigned-task ディレクトリ直下）
- 採択根拠と棄却理由を表形式で本ドキュメントに明記
- → AC-1（UT-09 実装受け皿確定）満足

## 完了条件チェック

- [x] 確定 path 1 件が記載されている
- [x] 棄却候補と棄却理由が表形式で記載されている
- [x] 採択根拠が説明されている
- [x] unassigned detection から到達可能であることを確認
