# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | governance（UT-GOV-001 後追い） |
| 実行種別 | implementation（serial。dev / main 独立 PUT を 2 段階目として再適用する後追いタスク） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | implementation / governance / NON_VISUAL（GitHub branch protection の REST API 操作のみ。UI なし） |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #202 (CLOSED — ユーザー指示によりクローズドのままタスク仕様書化) |

## 目的

UT-GOV-001 Phase 13 で `required_status_checks.contexts=[]` の暫定 fallback を採用した場合に、UT-GOV-004 完了成果物から実在 context（job/check-run 名）を抽出し、`branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` を再生成して dev / main 独立 PUT で branch protection を最終状態へ移行する後追い適用タスクの要件を確定する。本 Phase の責務は「**1 段階目 protection の暫定 contexts=[] を構造的に解消するための 2 段階目再 PUT 要件**」を Phase 2 設計が一意に駆動できる形で固定することにあり、コード実装・PR 作成・実 PUT 実行は含まない。

## 真の論点 (true issue)

- 「contexts に何を入れるか」ではなく、「**`contexts=[]` 暫定 fallback が放置されないことを構造的に保証する後追い適用手続きを文書化し、dev / main 独立 PUT・適用前後 GET・rollback 経路・admin block 回避を一貫した 1 つの runbook で駆動可能にする**」ことが本質。
- 副次的論点：
  - **時間順序の固定**: UT-GOV-001（1 段階目）→ UT-GOV-004（context 名の正本確定）→ 本タスク（2 段階目再 PUT）→ 最終状態、という時間順序を仕様で逆転不可にする。
  - **dev / main の独立性**: 1 PUT が成功して 1 PUT が失敗した時に dev / main が乖離しないよう、payload / applied JSON を branch 別ファイルとして必須化する。
  - **admin block 回避**: `enforce_admins=true` 下で contexts を埋めた瞬間、対応 check-run が走っていない PR は admin でも merge 不能になる。実行者が rollback payload に即アクセスできる状態で PUT を行う設計を要件化する。
  - **暫定 contexts=[] の残留検出**: 適用後 GET の `required_status_checks.contexts` が `[]` のままなら本タスクは未完了。AC-4 / AC-6 で構造的に検出する。
  - **workflow 名 vs job 名 / check-run 名の混同**: typo context は永続的な merge block を招く。UT-GOV-004 成果物を唯一の入力源とし、workflow 名禁止・job 名 / check-run 名のみ採用を要件化する。
  - **CLAUDE.md / deployment-branch-strategy.md drift**: GitHub 側 protection を正本としつつ、CLAUDE.md 側の記述が古いまま放置されないよう Phase 9 の drift 検査を要件化する。
  - **PR 自動実行禁止**: Phase 13 はユーザー承認前提の実 PUT 実行ゲート。仕様書作成段階では commit / push / PR 作成・実 PUT を一切行わない。

## Schema / 共有コード Ownership 宣言

後追い再 PUT を構造的に再発防止するため、以下を Phase 1 で固定する。各 Owner が責務境界を超えた書換を行わない原則を Phase 2 以降で踏襲する。

| 対象 | Owner | 配置先 / 形式 | 染み出し禁止先 |
| --- | --- | --- | --- |
| `branch-protection-payload-{dev,main}.json`（contexts 以外の値） | UT-GOV-001（1 段階目） | 1 段階目仕様書の outputs 配下 | 本タスクは contexts のみ書換、他値は不変 |
| `branch-protection-payload-{dev,main}.json`（contexts 値） | 本タスク（2 段階目） | `outputs/phase-13/branch-protection-payload-{dev,main}.json` | 1 段階目側で再書換しない |
| 実在 context の正本（job/check-run 名） | UT-GOV-004 | `required-status-checks-contexts.{dev,main}.json` 等 | 本タスクで context 名を独自に定義しない |
| rollback payload | UT-GOV-001（1 段階目で確立） | 1 段階目仕様書の rollback 経路 | 本タスクは再利用のみ、rollback payload を上書きしない |
| 適用前 / 適用後 GET 応答 | 本タスク | `outputs/phase-13/branch-protection-{current,applied}-{dev,main}.json` | 他タスクで共有保管しない（タスク固有証跡） |
| CLAUDE.md ブランチ戦略 / Governance 節 | CLAUDE.md（運用参照） | リポジトリルート | drift 検出時は別タスクで CLAUDE.md 側を追従更新 |
| aiworkflow-requirements references | 別タスク | `.claude/skills/aiworkflow-requirements/references/ci-cd.md` 等 | 本タスクは反映方針のみ Phase 12 で明文化、実反映は別タスク |

> Ownership が衝突した時点で別タスクを起票する運用とする。本タスクの責務は contexts 値の再生成と再 PUT 適用に閉じる。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | UT-GOV-001 Phase 13 完了 | 1 段階目 protection が dev / main で適用済み（`contexts=[]` または UT-GOV-004 同期前 contexts を含む） | 1 段階目 payload / rollback payload を読み取り専用で参照 |
| 上流（必須） | UT-GOV-004 完了 | 実在 context の正本（job/check-run 名）が `required-status-checks-contexts.{dev,main}.json` 等で確定 | 期待 contexts の唯一の入力源として採用 |
| 上流（参照） | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8.2 | 後追い再 PUT の運用境界の記載元 | 本タスクの境界条件として固定 |
| 並列 | UT-GOV-002（PR target safety gate dry-run） | dry-run 検証対象 | 後追い適用後の挙動検証で参照 |
| 並列 | UT-GOV-003（CODEOWNERS governance paths） | CODEOWNERS 構文 | branch protection と CODEOWNERS の組み合わせ確認 |
| 下流 | UT-GOV-005〜007 | 「contexts 強制が機能している protected dev / main」 | 本タスク完了が後続 governance の前提 |
| 下流 | aiworkflow-requirements references | branch protection 最終状態 | Phase 12 で反映方針を明文化、実反映は別タスクへ引き渡し |

## 価値とコスト

- 価値: `contexts=[]` 暫定 fallback の構造的解消により、必須 status checks が事実上機能していない governance を最終状態へ昇格できる。dev / main 独立 PUT・rollback payload 再利用・admin block 回避を 1 本の runbook に集約することで、実行時の判断ブレと部分適用事故を排除する。
- コスト: REST API 操作 4 回（dev/main × GET/PUT）+ 検証 GET 2 回 + drift 検査が中心。コード書換は伴わない。仕様書作成は中規模文書作業。
- 機会コスト: 本タスクを実施しない場合、`contexts=[]` のまま忘却され、CI gate / 線形履歴 / 会話解決必須化 / force-push 禁止 / 削除禁止 で品質保証する solo 運用ポリシーが 1 軸（必須 status checks）で機能不全のまま放置される。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | `contexts=[]` 暫定 fallback の構造的解消により必須 status checks 強制を最終状態へ移行できる。dev / main 乖離・admin block・typo merge block を構造的に防ぐ |
| 実現性 | PASS | GitHub REST API（`gh api`）の GET / PUT 各 2 回で完結。UT-GOV-001 / UT-GOV-004 完了済み前提が満たされていればコード書換不要 |
| 整合性 | PASS | solo 運用ポリシー（`required_pull_request_reviews=null`）/ `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution` を不変として維持。GitHub 側 protection を正本とする CLAUDE.md 原則と整合 |
| 運用性 | PASS | `gh api` のみで完結し、`scripts/cf.sh` 経由の Cloudflare 操作を伴わない。admin token はローカル揮発で扱い、ファイル / ログに残さない（CLAUDE.md「禁止事項」と整合）。Phase 13 はユーザー承認なしに実 PUT を行わない原則を維持 |

## 既存契約・命名規則の確認

Phase 2 設計の前に、現状の正本と差分を確認すること。

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| GitHub REST API スキーマ | `PUT /repos/{owner}/{repo}/branches/{branch}/protection` / `GET /repos/{owner}/{repo}/branches/{branch}/protection` | payload は dev / main で別 JSON、`required_status_checks.contexts` のみ差分対象 |
| CLAUDE.md ブランチ戦略 | CLAUDE.md `## ブランチ戦略` 節 | `required_pull_request_reviews=null` / `required_status_checks` / `required_linear_history` / `required_conversation_resolution` / force-push & 削除禁止 |
| deployment-branch-strategy.md | docs/00-getting-started-manual/deployment-branch-strategy.md（または同等の正本） | feature/* → dev → main の昇格ルートと protected branch 設定の整合 |
| UT-GOV-004 成果物形式 | `required-status-checks-contexts.{dev,main}.json` 等 | dev / main 別の実在 context 配列。job/check-run 名のみ。workflow 名禁止 |
| 1 段階目 payload | UT-GOV-001 outputs 配下 | contexts 以外の値（`enforce_admins` / `allow_force_pushes` 等）が本タスクで不変であること |
| Secret hygiene | CLAUDE.md「禁止事項」 | API token を出力 / ログに残さない。runbook では `op://...` 参照のみを記述 |

## 実行タスク

1. 原典 unassigned-task spec（`./origin-unassigned-task.md`）を全文読み、苦戦箇所 3 件（typo context / dev/main 片側更新 / admin block）を Phase 1 へ写経する。
2. index.md の正本語彙・AC-1〜AC-14・Phase 一覧・苦戦箇所 8 件を Phase 1 と差分ゼロで揃える。
3. 真の論点を「`contexts=[]` 暫定 fallback の構造的解消」に再定義し、副次的論点 7 件を整理する。
4. Schema / 共有コード Ownership 宣言を 7 対象（payload contexts 以外 / payload contexts 値 / context 正本 / rollback payload / GET 応答 / CLAUDE.md / aiworkflow-requirements references）で固定する。
5. 依存境界（上流 3 / 並列 2 / 下流 2）を「2 段階目適用の影響」付きで記述する。
6. 4条件評価を全 PASS で固定し、根拠を「`contexts=[]` 構造解消 / REST API のみで完結 / 不変条件維持 / Phase 13 ユーザー承認」で記述する。
7. 既存契約・命名規則チェック 6 観点（REST API スキーマ / CLAUDE.md / deployment-branch-strategy.md / UT-GOV-004 成果物 / 1 段階目 payload / Secret hygiene）を Phase 2 への引き渡しとして固定する。
8. AC-1〜AC-14 のうち本 Phase でトレース対象となる AC を明示する（AC-12 4 条件 / AC-13 PR 自動実行禁止）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | 正本語彙・AC・Phase 一覧・苦戦箇所 |
| 必須 | ./origin-unassigned-task.md | 原典 unassigned-task spec |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目適用の成果物・rollback 経路・運用境界 |
| 必須 | UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json` 等） | 実在 context の正本 |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance / Secret hygiene） | solo 運用ポリシー・drift 検証基準・禁止事項 |
| 必須 | docs/00-getting-started-manual/deployment-branch-strategy.md | deployment branch strategy 正本 |
| 必須 | GitHub REST API: `PUT/GET /repos/{owner}/{repo}/branches/{branch}/protection` | 再 PUT のスキーマ正本 |
| 参考 | .claude/skills/aiworkflow-requirements/references/ci-cd.md | required_status_checks 関連の正本 |

## 実行手順

### ステップ 1: 上流前提の確認

- UT-GOV-001 Phase 13 が完了し、1 段階目 protection が dev / main で適用済みであることを `gh api repos/{owner}/{repo}/branches/{dev,main}/protection` の生存応答で前提化する（実取得は Phase 2 設計後）。
- UT-GOV-004 完了成果物（`required-status-checks-contexts.{dev,main}.json` 等）の location を識別する。
- 1 段階目 payload と rollback payload の location を読み取り専用で識別する。
- 上流不足があれば Phase 2 へ進まず本 Phase の依存表を更新する。

### ステップ 2: 真の論点と境界の確定

- `outputs/phase-01/main.md` 冒頭に「`contexts=[]` 暫定 fallback の構造的解消が本質」「dev / main 独立 PUT」「admin block 回避」「Phase 13 ユーザー承認」を明記する。
- スコープ外（初回適用・rollback rehearsal・UT-GOV-004 自体の同期作業・`required_pull_request_reviews` 有効化・`enforce_admins` 値変更・CODEOWNERS 編集・workflow 編集・PR 自動実行）を再掲する。

### ステップ 3: Schema / 共有コード Ownership 宣言の固定

- 7 対象の Owner を表で固定し、本タスクの書換責務が contexts 値と GET 応答の保全に閉じることを明記する。
- 1 段階目 payload の contexts 以外の値を本タスクで書換しないこと、rollback payload を本タスクで上書きしないことを原則化する。

### ステップ 4: 4 条件評価と AC のロック

- 4 条件すべてが PASS で固定されていることを確認する。
- AC-1〜AC-14 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる。
- 本 Phase でトレースする AC を AC-12（4 条件 PASS）/ AC-13（PR 自動実行禁止）として明示する。

### ステップ 5: 命名規則と Secret hygiene の引き渡し

- aiworkflow-requirements references の現行登録を Phase 2 で再確認するチェックリストを main.md に書き出す。
- 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 固定形式であること、admin scope 必須であることを再掲する。
- runbook では token 値を一切記述せず、`op://...` 参照のみとすることを Phase 5 への引き渡し事項とする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・Ownership 宣言・依存境界・4 条件・命名規則チェックリストを設計入力として渡す |
| Phase 3 | 4 条件評価の根拠を代替案 PASS/MINOR/MAJOR 判定の比較軸に再利用 |
| Phase 4 | AC-1〜AC-14 をテスト戦略のトレース対象に渡す |
| Phase 5 | dev / main 独立 PUT 手順 / rollback 経路 / admin block 回避策の起点 |
| Phase 7 | AC matrix の左軸として AC-1〜AC-14 を使用 |
| Phase 9 | drift 検査（CLAUDE.md / deployment-branch-strategy.md）の起点 |
| Phase 10 | 4 条件最終判定の起点として再評価 |
| Phase 13 | ユーザー承認前提の実 PUT ゲートとして本 Phase の境界条件を継承 |

## 多角的チェック観点（AI が判断）

- 不変条件: `required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution` を本タスクで書換していないか。
- typo context: workflow 名（`build-and-test.yml` 等）を contexts に入れる記述が含まれていないか。job/check-run 名のみ採用が原則化されているか。
- dev / main 独立性: payload / applied JSON が branch 別ファイルとして必須化されているか。1 PUT 失敗時に他方が中途半端に書換わらない設計か。
- admin block 回避: `enforce_admins=true` 下で実行者が rollback 経路に即アクセスできる状態で PUT を行う原則が Phase 5 への引き渡しに含まれているか。
- contexts=[] 残留: 適用後 GET の `required_status_checks.contexts` が `[]` でないことを AC-4 / AC-6 で構造的に検出する仕組みが要件化されているか。
- workflow 名 vs job 名: 判別ルールが Phase 2 設計入力に渡されているか。
- drift 検出: CLAUDE.md / deployment-branch-strategy.md との drift を Phase 9 で検査する原則が引き渡されているか。
- PR 自動実行禁止: 本タスク仕様書作成段階で commit / push / PR 作成 / 実 PUT を行わない原則が記述されているか。
- Secret hygiene: token 値を runbook / 出力 / ログに残さない原則が記述されているか。
- 後続タスク影響: UT-GOV-005〜007 / aiworkflow-requirements references が「2 段階目適用済」を前提にしてよい状態を Phase 12 で明文化する引き渡しがあるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「`contexts=[]` 構造解消」に再定義 | 1 | spec_created | main.md 冒頭に記載 |
| 2 | 依存境界（上流 3 / 並列 2 / 下流 2）の固定 | 1 | spec_created | 2 段階目適用の影響を付与 |
| 3 | 4 条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | Schema / 共有コード Ownership 宣言 7 対象固定 | 1 | spec_created | 責務境界を branch protection の値別に分割 |
| 5 | 既存契約・命名規則チェック 6 観点 | 1 | spec_created | Phase 2 入力 |
| 6 | AC-1〜AC-14 の確定（index.md と完全一致） | 1 | spec_created | 本 Phase トレース対象 = AC-12 / AC-13 |
| 7 | 苦戦箇所 8 件（index.md）を AC / 多角的チェックへマッピング | 1 | spec_created | 再発防止軸 |
| 8 | PR 自動実行禁止原則の明記 | 1 | spec_created | Phase 13 への引き渡し |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4 条件評価・true issue・Ownership 宣言・依存境界） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] 真の論点が「`contexts=[]` 暫定 fallback の構造的解消 / dev / main 独立 PUT / admin block 回避 / Phase 13 ユーザー承認」として定義されている
- [ ] 4 条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 3 / 並列 2 / 下流 2 すべてが 2 段階目適用の影響付きで記述されている
- [ ] Schema / 共有コード Ownership 宣言が 7 対象で固定されている
- [ ] AC-1〜AC-14 が index.md と完全一致している
- [ ] 既存契約・命名規則チェック項目が 6 観点で固定されている
- [ ] 不変条件（`required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）を本タスクで書換しない原則が記述されている
- [ ] PR 自動実行禁止原則（commit / push / PR 作成 / 実 PUT を Phase 13 ユーザー承認まで行わない）が記述されている
- [ ] Secret hygiene 原則（token 値を runbook / 出力 / ログに残さない）が記述されている

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- index.md の苦戦箇所 8 件すべてが AC または多角的チェックに対応
- 異常系（typo context / dev/main 片側更新 / admin block / contexts=[] 残留 / workflow vs job 名混同 / drift 放置 / PR 自動実行 / Secret 漏洩）の論点が要件レベルで提示されている
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = `contexts=[]` 暫定 fallback の構造的解消
  - 4 条件評価（全 PASS）の根拠
  - Schema / 共有コード Ownership 宣言（7 対象）
  - 既存契約・命名規則チェック 6 観点
  - dev / main 独立 PUT 原則・admin block 回避原則・PR 自動実行禁止原則
  - 1Password 参照形式 `op://Employee/ubm-hyogo-env/<FIELD>` の再掲
  - workflow 名禁止・job/check-run 名のみ採用の原則
- ブロック条件:
  - UT-GOV-001 Phase 13 / UT-GOV-004 の完了が確認できない
  - 4 条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-14 が index.md と乖離
  - Ownership 宣言が 7 対象未満
