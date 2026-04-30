# Phase 8: DRY 化（payload / runbook / 検証ロジックの重複排除）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化（payload / runbook / 検証ロジックの重複排除） |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証 / drift 検証 / 期待 contexts 一致確認) |
| 状態 | spec_created |
| タスク分類 | implementation / governance / NON_VISUAL（仕様書 DRY） |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #202 (CLOSED — ユーザー指示によりクローズドのままタスク仕様書化) |

## 目的

本タスクは GitHub branch protection の REST API 操作のみを対象とする implementation / NON_VISUAL タスクであり、Phase 8 のスコープは「コード DRY」ではなく **payload / runbook / 検証ロジックの重複排除（仕様書・正本ベース）** に再定義する。具体的には、UT-GOV-001（1 段階目）と本タスク（2 段階目）に跨がる以下 5 軸の重複を棚卸しし、(a) 1 段階目で確定済みのため本タスクで再定義しない対象、(b) 本タスクが contexts 値・GET 応答・runbook 二段差分のみを Owner として扱う対象、(c) dev / main 別管理を維持すべき対象、を分類する。Phase 9 の drift 検証 / 期待 contexts 一致確認の前に、payload 二重定義 / runbook 内 `gh api` 呼び出しの再記述 / `jq` 比較式の散逸 を 0 件化する。

> 本 Phase は **コード書換も rollback payload 再生成も含まない**。重複排除の対象は本タスクの仕様書群（phase-01〜phase-13.md）と outputs（payload / runbook / drift-check）のみ。実 PUT / 実 rollback は Phase 13 でユーザー承認後に実施。

## 本 Phase でトレースする AC

- AC-4（payload の `required_status_checks.contexts` 再生成設計、暫定 `contexts=[]` 残留無し / 1 段階目 payload との差分は contexts のみ）
- AC-8（rollback payload の UT-GOV-001 再利用と上書き禁止）
- AC-9（typo context 防止のための workflow 名禁止 / 実 job/check-run 名採用の原則の再記述ゼロ化）

## 重複排除観点

### 観点 1: payload 構造（contexts 以外）の UT-GOV-001 からの一意流用

- `branch-protection-payload-{dev,main}.json` のうち、`required_status_checks.strict` / `enforce_admins` / `required_pull_request_reviews` / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes` / `allow_deletions` / `restrictions` / `block_creations` / `required_signatures` の各値は **UT-GOV-001 1 段階目 payload に Owner があり、本タスクで重複定義してはならない**。
- 本タスクの仕様書および outputs では、これらの値を「1 段階目 payload と同一であること」を `jq 'del(.required_status_checks.contexts)' | diff` で検証する設計のみを保持し、値そのものを再列挙しない。
- 重複定義は Phase 1 Ownership 宣言（`payload contexts 以外` Owner = UT-GOV-001）違反となる。

### 観点 2: dev / main 別 payload を 1 ファイルにまとめない（branch 別管理を維持）

- payload は `branch-protection-payload-dev.json` / `branch-protection-payload-main.json` の **2 ファイルで管理**し、`branch-protection-payload.json` のような統合 1 ファイル化は行わない。
- 1 ファイル化した場合、1 PUT 失敗時にどの branch の payload が適用済みか不明瞭になり、dev / main 独立 PUT 原則（Phase 1 / index.md 正本語彙）に違反する。
- 同様に `expected-contexts-{dev,main}.json` / `branch-protection-current-{dev,main}.json` / `branch-protection-applied-{dev,main}.json` も branch 別ファイルを維持する。

### 観点 3: rollback payload の UT-GOV-001 からの再利用（本タスクで rollback payload を新規定義しない）

- rollback payload は **UT-GOV-001 で確立済みのものを再利用**し、本タスクの outputs 配下に rollback payload JSON を新規生成・上書きしない。
- 本タスクの runbook（`apply-runbook-second-stage.md`）では rollback PUT のコマンド例を `--input <UT-GOV-001 rollback payload の path>` として参照のみとし、payload 内容を本タスク仕様書内に貼り付けない。
- これにより rollback payload の二重正本化を防ぐ（Phase 1 Ownership 宣言 / Phase 3 運用ルール 5 と整合）。

### 観点 4: runbook 内のコマンド例の DRY 化（`gh api` 呼び出しを Phase 5 / Phase 13 で重複させない）

- `gh api` 呼び出しコマンド（GET / PUT / 適用後 GET）の正本は **Phase 5 ランブック（`apply-runbook-second-stage.md`）** に閉じる。
- Phase 13（PR 作成 / 実 PUT 実行ゲート）の本文では、Phase 5 ランブックへのリンクと「ユーザー承認後に Phase 5 §X を実行」の参照のみを記述し、コマンド全文を再記述しない。
- 同様に Phase 11（手動 smoke / 検証）の `manual-verification-log.md` でも、Phase 5 のコマンド例を `参考: phase-05.md §<セクション>` で参照する。コマンドのコピペ重複を 0 件化する。
- 再記述が必要な状況は Phase 5 の更新コストを 3 倍化させ、command drift（同じ意図のコマンドが微妙に違う表記で散る現象）を生むため禁止する。

### 観点 5: 期待 contexts と適用後 contexts の検証ロジックの DRY 化（`jq` の比較式を 1 箇所に固定）

- 期待 contexts と適用後 GET の `required_status_checks.contexts` の集合一致確認に使う `jq` 比較式（`jq '.required_status_checks.contexts | sort'` ＋ `diff <(jq '. | sort' expected.json) <(jq '.required_status_checks.contexts | sort' applied.json)` のような形式）は **Phase 9（品質保証）に正本を置く**。
- Phase 5 ランブック / Phase 11 手動検証 / Phase 13 適用後検証では Phase 9 の比較式を参照のみとし、比較式そのものを再定義しない。
- 比較式の散逸は「順序込み完全一致 vs 集合一致」の取り違えを誘発し、AC-6（順序不問・集合一致）違反を招くリスクが高い。

## 重複候補の棚卸し

| # | 重複候補 | 現出現箇所（仕様書ドラフト想定） | Owner / 採用方針 | 処理方針 |
| --- | --- | --- | --- | --- |
| 1 | `enforce_admins.enabled=true` / `allow_force_pushes.enabled=false` 等 6 不変条件値 | Phase 2 設計 / Phase 5 runbook / Phase 9 drift-check / Phase 13 適用前後 GET 比較 | UT-GOV-001（1 段階目 payload Owner） | 本タスクは「値の再列挙」ではなく「1 段階目 payload と一致の検証手段」のみ保持 |
| 2 | dev / main 別 payload ファイル名 | Phase 2 / Phase 5 / Phase 13 | 本タスク（contexts 値 Owner） | branch 別 2 ファイルを Phase 5 で 1 度定義し、他 Phase は参照 |
| 3 | rollback payload の中身 | Phase 5 runbook / Phase 13 失敗時手順 | UT-GOV-001 で確立済 | path 参照のみ。payload 中身を貼らない |
| 4 | `gh api -X PUT --input <payload>` 呼び出し全文 | Phase 5 / Phase 11 / Phase 13 | Phase 5 が正本 | Phase 11 / 13 は Phase 5 §参照で代替 |
| 5 | `gh api repos/{owner}/{repo}/branches/{branch}/protection` GET 全文 | Phase 5 / Phase 9 / Phase 11 / Phase 13 | Phase 5 が正本 | 他 Phase は §参照 |
| 6 | `jq '.required_status_checks.contexts \| sort'` 比較式 | Phase 5 / Phase 9 / Phase 11 / Phase 13 | Phase 9 が正本 | 他 Phase は §参照 |
| 7 | `jq 'del(.required_status_checks.contexts)' \| diff` 検証式（payload 二段差分） | Phase 2 設計 / Phase 9 drift-check / Phase 13 適用前後 GET | Phase 9 が正本 | Phase 2 / 13 は §参照 |
| 8 | drift 検査対象 6 値（`required_pull_request_reviews=null` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes=false` / `allow_deletions=false`） | Phase 2 / Phase 9 drift-check / Phase 11 / Phase 13 | Phase 9 が正本（drift-check.md） | 他 Phase は §参照 |
| 9 | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須）参照 | Phase 5 / Phase 11 / Phase 13 / index.md Secrets 一覧 | index.md Secrets 一覧が正本 | 他 Phase は §参照のみ。token 値は記述しない（Secret hygiene） |
| 10 | dev / main 直列 PUT 原則（同時 PUT 禁止） | Phase 2 / Phase 3 運用ルール 4 / Phase 5 / Phase 13 | Phase 3 運用ルール 4 が正本 | 他 Phase は §参照 |

## 削除対象 / 保持対象（5 軸 1:1 対応）

| 軸 | 削除対象（重複定義として撤回するべき記述） | 保持対象（base case 整合） | 理由 |
| --- | --- | --- | --- |
| payload 構造 | contexts 以外の値の本タスク内再列挙 | 1 段階目 payload との `jq 'del(.required_status_checks.contexts)' \| diff` 検証式 | UT-GOV-001 Ownership 維持 |
| dev / main 統合 | `branch-protection-payload.json` 単一ファイル化 | dev / main 別 2 ファイル | 独立 PUT 原則維持 |
| rollback payload | 本タスク内での rollback payload JSON 中身貼付 | UT-GOV-001 rollback payload への path 参照 | 二重正本化防止 |
| runbook コマンド | Phase 13 / Phase 11 でのコマンド全文再掲 | Phase 5 ランブックの正本＋他 Phase からの §参照 | command drift 防止 |
| 検証ロジック | 各 Phase で異なる `jq` 比較式 | Phase 9 の `jq '. \| sort'` 集合比較式に統一 | AC-6 集合一致原則維持 |

> 「削除対象」は **本タスクの仕様書ドラフトから DRY 化として除去すべき記述** を意味し、外部仕様書（UT-GOV-001 / UT-GOV-004）の編集は対象外。

## 共通化パターン

- 命名:
  - payload / current / applied / expected の各 JSON は `<種別>-{dev,main}.json` のハイフン区切り + branch 名 suffix を全 Phase で統一。
  - Phase outputs path は `outputs/phase-XX/<種別>.md` または `outputs/phase-XX/<種別>-{dev,main}.json`。
- 4 条件は「価値性 / 実現性 / 整合性 / 運用性」順序固定（Phase 1 / 3 / 10 共通）。
- 採用結論は **案 A（UT-GOV-004 完了後の dev / main 独立 PUT）** で表記統一（Phase 3 採用）。
- AC ID は `AC-1`〜`AC-14` のハイフン区切りで全 Phase 統一（index.md 正本）。
- 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式に統一。token 値は記述しない。
- drift 検査対象は 6 値固定（Phase 2 設計 / Phase 9 drift-check / index.md AC-7 と完全一致）。
- dev / main の記述順は常に「dev → main」固定。

## navigation drift / 表記揺れチェック

| 項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| AC 番号 | index.md と phase-01.md / phase-07.md AC マトリクスの AC-1〜AC-14 の文言一致 | 完全一致 |
| Phase 番号 / 名称 | index.md の Phase 一覧 と各 phase-XX.md のメタ情報 | 完全一致 |
| 採用結論表記 | Phase 3 採用結論（案 A）が Phase 4〜13 で混在しないか | 「案 A（UT-GOV-004 完了後の dev / main 独立 PUT）」で初出固定 |
| dev / main 並び順 | 全 Phase で「dev → main」順固定 | 統一 |
| 不変条件 6 値 | Phase 2 / Phase 9 / Phase 11 / Phase 13 で同一文言 | 統一 |
| Secret 名（op 参照含む） | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN` 形式統一 | 統一 |
| artifacts.json `phases[*].outputs` × 実 path | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` の file 列と実ファイル | ls 照合 | 完全一致 |
| phase-XX.md 内 `phase-YY.md` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 原典 unassigned-task 参照 | `../unassigned-task/task-utgov001-second-stage-reapply.md` | 実在 |
| UT-GOV-001 仕様書参照 | `../completed-tasks/UT-GOV-001-github-branch-protection-apply.md` | 実在 |

## 実行タスク

1. 重複候補棚卸し表（10 件以上）を作成する（完了条件: payload 構造 / branch 別管理 / rollback / runbook / 検証ロジックの 5 観点で各 2 件以上）。
2. 削除対象 / 保持対象の 5 軸 1:1 マッピング表を作成する（完了条件: 5 軸すべてが 1:1 対応）。
3. 共通化パターン（命名 / 4 条件順序 / 採用結論 / AC ID / op 参照 / drift 6 値 / dev/main 並び順）を 7 項目以上固定する。
4. navigation drift / 表記揺れチェック表を作成する（完了条件: 11 項目すべてに想定結果）。
5. Phase 5 / Phase 9 を「正本」、Phase 2 / Phase 11 / Phase 13 を「参照側」とする DRY 化方針を outputs/phase-08/main.md にまとめる。
6. 重複排除によって本タスクの仕様書群が現状抱えている重複行数の概算を記述する（完了条件: 観点別の重複削減見込み）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | 用語・AC 番号の正本 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目 payload / rollback payload Owner |
| 必須 | UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json` 等） | 実在 context 正本 |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance / Secret hygiene） | 不変条件 6 値の正本参照 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み比較式 / drift 検査 6 値を `outputs/phase-09/drift-check.md` の正本として固定 |
| Phase 10 | navigation drift 0 を GO/NO-GO 根拠 |
| Phase 11 | runbook コマンドへの §参照のみで manual-verification-log を構成（重複再記述ゼロ） |
| Phase 12 | unassigned-task-detection / documentation-changelog に DRY 化結果を反映 |
| Phase 13 | Phase 5 ランブックへの §参照で実 PUT ゲートを構成、コマンド再記述ゼロ |

## 多角的チェック観点

- 価値性: payload / runbook / 検証ロジックの DRY 化により判断面の安定化と command drift 防止が達成されるか。
- 実現性: implementation / NON_VISUAL 範囲で grep + 表化のみで完結するか。
- 整合性: 不変条件 6 値（`required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）が削除 / 保持マッピングで維持されているか。
- 運用性: rollback payload を本タスクで上書きしない原則が DRY 化で構造的に維持されているか。
- Ownership 境界: payload 構造（contexts 以外）が UT-GOV-001 Owner に閉じているか。
- dev / main 独立性: branch 別 2 ファイル管理が DRY 化で崩れていないか。
- Secret hygiene: token 値が runbook / 出力 / ログに残らない原則が DRY 化で再強調されているか。
- typo context 防止: workflow 名禁止 / job 名 / check-run 名のみ採用の原則が Phase 2 / 5 / 11 で同一文言になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複候補棚卸し（10 件以上） | 8 | spec_created | 5 観点で各 2 件以上 |
| 2 | 削除対象 / 保持対象 5 軸 1:1 マッピング | 8 | spec_created | 表化 |
| 3 | 共通化パターン 7 項目固定 | 8 | spec_created | 命名 / 順序 / 結論 / AC / op 参照 / drift / dev/main |
| 4 | navigation drift 11 項目チェック | 8 | spec_created | drift 0 |
| 5 | 正本 Phase（5 / 9）と参照側 Phase（2 / 11 / 13）の役割固定 | 8 | spec_created | command drift 防止 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 4 ブロック統合 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 重複候補棚卸し / 削除 - 保持マッピング / 共通化パターン / navigation drift チェック |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 重複候補が 10 件以上棚卸しされている
- [ ] 削除対象 / 保持対象が 5 軸（payload 構造 / branch 別管理 / rollback / runbook / 検証ロジック）で 1:1 対応している
- [ ] 共通化パターンが 7 項目以上固定されている
- [ ] navigation drift が 0
- [ ] Phase 5 が runbook 正本、Phase 9 が検証ロジック正本として位置付けが明示
- [ ] rollback payload を本タスク内で再定義しない原則が記述（AC-8）
- [ ] dev / main 別 2 ファイル管理が共通化パターンで保持
- [ ] outputs/phase-08/main.md が作成済み

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 `outputs/phase-08/main.md` が `outputs/phase-08/` 配下に配置予定
- 重複候補 10 件以上、削除 / 保持 5 軸、共通化パターン 7 項目以上
- navigation drift 0
- 本 Phase でトレースする AC（AC-4 / AC-8 / AC-9）が完了条件に含まれる
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証 / drift 検証 / 期待 contexts 一致確認)
- 引き継ぎ事項:
  - DRY 化済み正本表記（Phase 5 = runbook 正本 / Phase 9 = 検証ロジック正本）
  - 削除対象 / 保持対象 5 軸 1:1 マッピング
  - 共通化パターン 7 項目（命名 / 順序 / 採用結論 / AC ID / op 参照 / drift 6 値 / dev/main 並び順）
  - navigation drift 0 状態
  - rollback payload 本タスク内再定義禁止原則（AC-8）
  - branch 別 2 ファイル管理原則（dev / main 独立 PUT）
- ブロック条件:
  - 重複候補が 10 件未満
  - 5 軸 1:1 マッピングに欠落
  - 共通化パターンが 7 項目未満
  - navigation drift 残存
  - rollback payload を本タスク内で再定義する記述が混入
  - dev / main 統合 1 ファイル化が混入
