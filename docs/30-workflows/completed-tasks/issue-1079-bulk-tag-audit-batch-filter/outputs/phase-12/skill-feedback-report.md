# Skill feedback report — issue-1079-bulk-tag-audit-batch-filter

> workflow_state=`implemented_local_evidence_captured`。改善点が無くても出力する。
> 観点: (1) テンプレート改善、(2) ワークフロー改善、(3) ドキュメント改善。
> automation-30 改善で実コード実装まで完了したため、候補記録に加えて今回確定した lesson を明記する。

## 0. 今回確定した skill 準拠改善

| ID | 観点 | 確定内容 |
| --- | --- | --- |
| F-1 | implementation workflow の spec-only close-out 禁止 | `taskType=implementation` かつ変更対象コード・AC が明確な workflow を `spec_created / code diff 0` で閉じるのは不整合。今回のように同一サイクルで実コード・tests・正本同期まで昇格する。 |
| F-2 | runtime visual と local implementation の分離 | UI 実装は local code/tests で `implemented_local_evidence_captured` にできる。authenticated screenshot は Gate-C `runtime_visual_pending` として user-gated に分離し、local implementation を未実施扱いに戻さない。 |
| F-3 | aiworkflow same-wave sync | 新規 API query surface（`batchId`）を追加した時点で `api-endpoints.md` / workflow active / indexes / artifact inventory まで同一 wave で同期する。 |
| F-4 | SQL/JSON search lesson の task-spec 昇格 | T-1/T-2/T-3 は実装で妥当性確認済みの再発防止 rule と判定し、`task-specification-creator` の `references/patterns-testing-and-implementation.md` / `SKILL.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` へ同一サイクルで反映済み。 |

## 1. テンプレート改善

| ID | 観点 | 内容 | 昇格候補先 |
| --- | --- | --- | --- |
| T-1 | SQL helper の複数 placeholder 参照 | repository の `add()` helper は単一 `?` を 1 つの `?N` に置換する前提で設計されている。本タスクの batchId 検索は after/before 両列を **同一 batchId 値で OR 検索**するため、`add()` をそのまま使うと値が 2 binding に分かれ `?N` 番号がずれる。`bindings.push` を 1 回だけ行い同一 `?N` を 2 箇所で参照するパターンが必要。`json_extract` の OR 検索のように 1 値多参照は監査・JSON 検索系で再発しやすい。 | **昇格済み**: `task-specification-creator/references/patterns-testing-and-implementation.md` |
| T-2 | json_extract の full scan 方針の定型化 | JSON 列に index が無い検索（`json_extract`）は full scan になる。AC として「制限または index 方針の明記」を要求された場合、(a) keyset cursor + LIMIT / (b) 検索キーの sparse 性 / (c) plain 列併用誘導 / (d) schema 化の別タスク化、の 4 点定型で AC を充足できる。 | **昇格済み**: `task-specification-creator/references/patterns-testing-and-implementation.md` |
| T-3 | JSON validity guard | `json_extract` は壊れた JSON 文字列に対して D1/SQLite `malformed JSON` を投げる。audit log は既存 row に parseError 対象が混在し得るため、JSON path 検索は `json_valid(column) AND json_extract(...) = ?N` で guard する。 | **昇格済み**: `task-specification-creator/references/patterns-testing-and-implementation.md` |

## 2. ワークフロー改善

| ID | 観点 | 内容 |
| --- | --- | --- |
| W-1 | server-renderable 維持と "use client" の局所化 | 既存 `AuditLogPanel` は server-renderable（"use client" なし）。copy 機能は client interaction が必要だが、`BatchIdCopyButton` を別 component に切り出し "use client" を局所化することで panel の server-renderable を保つ。**「client 機能は最小 component に切り出して局所化する」という判断基準は再利用価値が高い**（SSR 境界の不用意な拡大を防ぐ）。 |
| W-2 | read 側 followup の独立スコープ化 | 親（#1036）が write 側で batchId を埋め込み、followup（#1079）が read 側で検索・表示する分割は、write/read の責務境界が明確で重複が出にくい。followup タスクのスコープ設計の good pattern。 |

## 3. ドキュメント改善

| ID | 観点 | 内容 |
| --- | --- | --- |
| D-1 | batchId 埋め込み位置の非対称性の明記 | assign は `after_json.batchId`、unassign は `before_json.batchId` という**非対称な埋め込み位置**が検索漏れの原因になりやすい。両列 OR 検索と抽出 helper の探索順（after → before）をドキュメントで明示することで、実装者が片側だけ検索する事故を防げる。 |
| D-2 | package 名の正本固定 | issue 記載の `@repo/api` は誤りで、実 package 名は `@ubm-hyogo/api` / `@ubm-hyogo/web`。Phase 1 命名規則分析で「issue 記載と実 package 名が乖離する場合は実コードを正本とする」と明記したのは良い予防。 |

## 4. サマリ

| 区分 | 件数 |
| --- | --- |
| テンプレート改善候補 | 3（T-1 SQL 複数 placeholder / T-2 full scan 4 点定型 / T-3 JSON validity guard） |
| ワークフロー改善候補 | 2（W-1 "use client" 局所化 / W-2 read/write 責務分割） |
| ドキュメント改善候補 | 2（D-1 埋め込み非対称 / D-2 package 名正本） |

- 最も再利用価値が高い **T-1（json_extract の 1 値多 placeholder で add() helper が使えない落とし穴）**、**T-2（full scan 方針の定型化）**、**T-3（json_valid guard）** は、実装サイクルで妥当性確認済みのため task-specification-creator へ昇格済み。
- 追加の未タスク化は不要。今回の改善は同一サイクルで実スキルファイルへ反映した。
