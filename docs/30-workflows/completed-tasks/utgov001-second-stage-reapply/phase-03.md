# Phase 3: 設計レビュー（30種思考法 / GO/NO-GO）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク状態 | spec_created（GitHub Issue #202 は CLOSED でも仕様書 GO/NO-GO ゲート対象） |
| タスク分類 | implementation / governance / NON_VISUAL（design review） |

## 目的

Phase 2 の後追い再 PUT 設計（UT-GOV-004 抽出ルール / 期待 contexts / payload 再生成 / GET 保全 / `gh api` 呼び出し / rollback 経路 / admin block 回避 / workflow vs job 判別 / drift 検査）に対し、4 つの代替案（A 採用：UT-GOV-004 完了を待ってから dev / main 独立 PUT / B：`contexts=[]` 放置 / C：UT-GOV-001 を再オープンして同 PR 内で contexts を埋める / D：dev / main 同時 PUT）を比較し、4 条件（価値性 / 実現性 / 整合性 / 運用性）+ 観点（不変条件維持 / dev/main 独立性 / admin block 回避 / contexts=[] 残留検出 / workflow vs job 判別 / drift 検出 / Secret hygiene / PR 自動実行禁止）に対する PASS / MINOR / MAJOR 判定を確定する。30 種思考法レビューで MAJOR が 0 件であることを着手可否ゲートで確認し、Phase 4 移行の GO/NO-GO 判定基準を明示する。

## 本 Phase でトレースする AC

- AC-11（30 種思考法レビューで PASS / MINOR / MAJOR が付与され、MAJOR が 0 件で着手可否ゲートを通る）
- AC-12（4 条件最終判定 PASS と根拠の記述）
- AC-13（Phase 13 はユーザー承認なしに実 PUT・push・PR 作成を行わない原則の確認）

## 実行タスク

1. 代替案を 4 つ列挙する（A: UT-GOV-004 完了後の dev / main 独立 PUT / B: `contexts=[]` 放置 / C: UT-GOV-001 再オープン同 PR 内 / D: dev / main 同時 PUT）（完了条件: 4 案が比較表に並ぶ）。
2. 各代替案に対し 4 条件 + 観点（11 観点）で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用案 = 案 A）を current facts 整合・MAJOR ゼロから確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. 30 種思考法でレビュー結果を記述する（完了条件: Phase 3 の代表 8 種と Phase 10 の補完 22 種を合わせ、システム系 / 戦略・価値系 / 問題解決系の 3 系統で findings と判定）。
5. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載）。
6. 着手可否ゲート（GO / NO-GO）を定義する（完了条件: GO / NO-GO の判定基準が Phase 4 移行の前提として明示）。
7. リスクレジスタを作成する（完了条件: 5 種以上のリスクと検出 / 対応策がマトリクスで記述）。
8. 残課題（open question）を Phase 4 以降に明示的に渡す（完了条件: open question が 0 件 or 受け皿 Phase が指定）。
9. 運用ルール（PR 自動実行禁止 / Secret hygiene / drift 別タスク起票）を明文化する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-01.md | 真の論点・4 条件・Ownership 宣言 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-02.md | レビュー対象設計（contexts-source.json / expected-contexts-{dev,main}.json / payload-design.md） |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | 正本語彙・AC-1〜AC-14・苦戦箇所 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目 payload / rollback payload / 運用境界 |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance / Secret hygiene） | solo 運用ポリシー・drift 検証基準 |
| 参考 | .claude/skills/automation-30/references/patterns.md | 30 種思考法カタログ |

## 代替案比較

### 案 A: UT-GOV-004 完了を待ってから dev / main 独立 PUT（Phase 2 推奨 base case）

- 概要: UT-GOV-004 成果物を唯一の入力源とし、`branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` を再生成。dev / main 直列で独立 PUT。失敗時は UT-GOV-001 rollback payload を再利用。
- 利点: 責務境界（context 名 Owner = UT-GOV-004 / payload contexts 値 Owner = 本タスク）が明確。dev / main 乖離リスクが構造的に排除。admin block 時の即時 rollback 経路あり。MAJOR ゼロ・MINOR ゼロ。
- 欠点: UT-GOV-004 完了を待つ時間順序制約が発生。

### 案 B: UT-GOV-001 を `contexts=[]` のまま放置

- 概要: 本タスクを実施せず、`contexts=[]` 暫定 fallback を最終状態として運用継続。
- 利点: 短期的なオペレーションコストゼロ。
- 欠点: 必須 status checks 強制が事実上機能しない governance（CI gate / 線形履歴 / 会話解決必須化 / force-push 禁止 / 削除禁止 のうち 1 軸が機能不全）。価値性 MAJOR・整合性 MAJOR・運用性 MAJOR。CLAUDE.md「solo 運用ポリシー」記載の品質保証軸が崩壊。

### 案 C: UT-GOV-001 を再オープンして同 PR 内で contexts を埋める

- 概要: UT-GOV-001 を再オープンし、同一 PR スコープで contexts を埋めた payload に書き換える。本タスクを独立タスク化しない。
- 利点: PR 数が 1 本で完結。
- 欠点: UT-GOV-001 の責務境界（初回適用）が破壊される。Ownership 宣言（payload contexts 以外 = UT-GOV-001 / contexts 値 = 本タスク）の二重正本化。完了済タスクの再オープンは履歴追跡性を毀損。整合性 MAJOR・運用性 MINOR。

### 案 D: dev / main 同時 PUT（1 PUT で済ませる試み）

- 概要: dev / main を並列実行して PUT を 1 ステップで完了。
- 利点: 実行時間が短い。
- 欠点: 1 PUT 成功 / 1 PUT 失敗時に dev / main が乖離した状態の検出が遅れ、admin block 連鎖リスクが顕在化。failure isolation が弱い。整合性 MINOR・運用性 MAJOR。GitHub REST API は branch 別 endpoint のため「真の同時 PUT」も不可能で、設計上の利点も限定的。

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (放置) | 案 C (UT-GOV-001 再オープン) | 案 D (同時 PUT) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | MAJOR | MINOR | PASS |
| 実現性 | PASS | PASS | MINOR | MINOR |
| 整合性（不変条件維持） | PASS | PASS | MINOR | PASS |
| 整合性（current facts / Ownership） | PASS | MAJOR | MAJOR | PASS |
| dev/main 独立性 | PASS | N/A | MINOR | MAJOR |
| admin block 回避 | PASS | N/A | MINOR | MAJOR |
| contexts=[] 残留検出 | PASS | MAJOR | PASS | PASS |
| workflow vs job 判別 | PASS | N/A | PASS | PASS |
| drift 検出 | PASS | MINOR | MINOR | PASS |
| Secret hygiene | PASS | PASS | PASS | PASS |
| PR 自動実行禁止 | PASS | N/A | MINOR（同 PR 強制） | PASS |
| 運用性 | PASS | MAJOR | MINOR | MAJOR |

### 採用結論

- **base case = 案 A**（UT-GOV-004 完了後の dev / main 独立 PUT）。MAJOR ゼロ・MINOR ゼロ。Phase 2 設計と完全整合。
- 案 B は MAJOR 3（価値性 / current facts / 運用性）+ MAJOR 1（contexts=[] 残留）= MAJOR 4 のため不採用。本タスクの存在自体が案 B 排除のための構造的対策。
- 案 C は MAJOR 1（current facts / Ownership）+ MINOR 5 のため不採用。完了済タスクの再オープンは禁止。
- 案 D は MAJOR 2（dev/main 独立性 / admin block 回避 / 運用性）のため不採用。dev / main は **直列 PUT** を原則化。

## 4 条件評価の最終確認

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | `contexts=[]` 暫定 fallback の構造的解消により必須 status checks 強制を最終状態へ移行できる。代替案 B 排除を構造化 |
| 実現性 | PASS | `gh api` の GET / PUT 各 2 回 + 検証 GET 2 回で完結。UT-GOV-001 / UT-GOV-004 完了済前提が満たされていればコード書換不要 |
| 整合性 | PASS | 不変条件 6 値（`required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）を本タスクで書換しない。Ownership 宣言と整合 |
| 運用性 | PASS | dev / main 直列 PUT・即時 rollback・admin token のローカル揮発扱い・runbook で `op://...` 参照のみ記述・Phase 13 ユーザー承認前提 |

## 30 種思考法レビュー（automation-30 正規カタログ）

| カテゴリ | 思考法 | findings | 判定 |
| --- | --- | --- | --- |
| 論理分析系 | 批判的思考 | `contexts=[]` 放置案は必須 status checks 強制を満たさない | PASS |
| 論理分析系 | 演繹思考 | UT-GOV-004 正本 contexts を採用するなら payload は contexts のみ差替えに限定される | PASS |
| 論理分析系 | 帰納的思考 | 過去の branch protection drift は path/証跡揺れから発生しており、ledger固定が必要 | PASS |
| 論理分析系 | アブダクション | 最善説明は「Phase 13 user approval 前の spec_created workflow」であり実適用済みではない | PASS |
| 論理分析系 | 垂直思考 | 根本論点は実在 context 採用と不可逆 PUT の承認ゲート分離 | PASS |
| 構造分解系 | 要素分解 | contexts抽出、payload生成、GET保全、PUT、drift検査、rollbackに分解済み | PASS |
| 構造分解系 | MECE | dev/main独立、成功/失敗、docs反映/実反映を分離 | PASS |
| 構造分解系 | 2軸思考 | 仕様作成 vs 実操作、GitHub正本 vs docs追従で境界を固定 | PASS |
| 構造分解系 | プロセス思考 | GET→payload→PUT→GET→diff→rollback判断の順序を固定 | PASS |
| メタ・抽象系 | メタ思考 | 30種レビュー自体を正規カタログへ合わせる必要を確認 | PASS |
| メタ・抽象系 | 抽象化思考 | 本質は「既存保護設定の contexts のみ差替え」 | PASS |
| メタ・抽象系 | ダブル・ループ思考 | 暫定 fallback を許した運用前提を second-stage で補正 | PASS |
| 発想・拡張系 | ブレインストーミング | 放置、UT-GOV-001再オープン、dev/main同時PUTを比較し不採用 | PASS |
| 発想・拡張系 | 水平思考 | PR作成とGitHub PUTを承認ゲートで分離する案を採用 | PASS |
| 発想・拡張系 | 逆説思考 | 詳細化がpath driftを生むため payload path を Phase 13 に統一 | PASS |
| 発想・拡張系 | 類推思考 | UT-GOV-001 rollback rehearsal の知見を再利用 | PASS |
| 発想・拡張系 | if思考 | UT-GOV-004未完了、token不足、admin block時の停止条件を設定 | PASS |
| 発想・拡張系 | 素人思考 | 中学生向け説明で「空の名簿」モデルに単純化 | PASS |
| システム系 | システム思考 | GitHub実値、CLAUDE.md、aiworkflow references、UT-GOV-004の依存を整理 | PASS |
| システム系 | 因果関係分析 | `contexts=[]`→CI強制無効→governance低下の因果を遮断 | PASS |
| システム系 | 因果ループ | GET検証とrollbackの制御ループを設計 | PASS |
| 戦略・価値系 | トレードオン思考 | dev/main直列PUTで速度より安全性を優先 | PASS |
| 戦略・価値系 | プラスサム思考 | 実操作安全性とdocs追従を別タスク化で両立 | PASS |
| 戦略・価値系 | 価値提案思考 | 必須 status checks を実効化し後続UT-GOVの前提を安定化 | PASS |
| 戦略・価値系 | 戦略的思考 | UT-GOV-001→004→本タスク→005以降の順序に整合 | PASS |
| 問題解決系 | why思考 | なぜ必要かを fallback 解消まで深掘り | PASS |
| 問題解決系 | 改善思考 | artifacts/output実体化、path正規化、承認境界明確化を改善点に設定 | PASS |
| 問題解決系 | 仮説思考 | ledgerとoutputsを揃えれば4条件が回復するという仮説を採用 | PASS |
| 問題解決系 | 論点思考 | 真の論点を「承認前に不可逆操作をしないtraceable gate」と定義 | PASS |
| 問題解決系 | KJ法 | 問題群を成果物、カタログ、path、Phase境界、コマンド検証に集約 | PASS |

> 30 種思考法すべてで PASS。旧レビューで使っていた英語の別体系は補助観点へ降格し、automation-30 の正規カタログを正本とする。

## PASS / MINOR / MAJOR の判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 設計が要件を満たし、不変条件・Ownership・current facts に違反しない |
| MINOR | 設計が要件を満たすが、運用上の追加配慮または別タスクで解消可能な懸念がある |
| MAJOR | 設計が不変条件 / Ownership / current facts に違反、または事故リスクが構造的に残存する |

## 着手可否ゲート（GO / NO-GO）

| 判定 | 条件 |
| --- | --- |
| GO（Phase 4 移行可） | 30 種思考法すべて PASS / MAJOR ゼロ / 4 条件すべて PASS / Phase 2 成果物 4 ファイルの設計完成 / Ownership 宣言 7 対象固定 / AC-11 / AC-12 / AC-13 が明文化 |
| NO-GO（Phase 4 移行不可） | 30 種思考法のいずれかで MAJOR 検出 / 4 条件のいずれかが MAJOR / Phase 2 設計成果物の不足 / UT-GOV-001 Phase 13 完了未確認 / UT-GOV-004 完了未確認 |

> 本 Phase の現時点判定: **GO**（MAJOR ゼロ・4 条件全 PASS）。

## リスクレジスタ

| # | リスク | 検出手段 | 対応策 | 担当 Phase |
| --- | --- | --- | --- | --- |
| R-1 | typo context（workflow 名混入 / 廃止 check-run 名）による永続的 merge block | 適用後 GET と `expected-contexts-{branch}.json` の集合一致確認 | UT-GOV-001 rollback payload を即時再 PUT。`expected-contexts-{branch}.json` 再生成は別タスク起票 | Phase 2 / 5 / 13 |
| R-2 | dev / main 片側 PUT 失敗による状態乖離 | dev / main 別 applied JSON の生成有無を確認 | 失敗側 branch のみ rollback。成功側は維持 | Phase 5 / 13 |
| R-3 | `enforce_admins=true` 下での admin 自身の merge block | PUT 直前 open PR の check-run 進行状況確認 | rollback payload を即時 PUT。実行者は rollback コマンドをコピペ準備 | Phase 5 / 13 |
| R-4 | 暫定 `contexts=[]` の残留（本タスク未実施） | applied JSON の `contexts` が空配列でないか jq 検査 | 本タスクの存在自体が対策。AC-4 / AC-6 で構造化 | Phase 9 / 13 |
| R-5 | CLAUDE.md / deployment-branch-strategy.md drift の放置 | drift 検査 6 値の一致確認 | 検出時は別タスクで CLAUDE.md / deployment-branch-strategy.md を追従更新 | Phase 9 |
| R-6 | admin token の漏洩（runbook / 出力 / ログ） | runbook 内に token 値が記述されていないか grep | `op://...` 参照のみを記述。token はローカル揮発で扱う | Phase 5 / 12 |
| R-7 | UT-GOV-004 成果物の不整合（重複 context / workflow 名混入） | `contexts-source.json` 抽出時に jq `unique` / 拡張子検査 | UT-GOV-004 側の修正を別タスク起票 | Phase 2 |
| R-8 | PR 自動実行による未承認 PUT | runbook を Phase 13 ユーザー承認ゲート前提に固定 | 仕様書段階で commit / push / PR 作成・実 PUT を一切行わない | Phase 13 |

## 残課題（open question）

| # | open question | 受け皿 |
| --- | --- | --- |
| Q-1 | UT-GOV-004 成果物の正確な location 候補のうちどれが採用されるか | Phase 2 確定。Phase 13 実取得時に再確認 |
| Q-2 | 適用後 CLAUDE.md / deployment-branch-strategy.md drift 検出時の追従更新タスクの起票形式 | Phase 12（unassigned-task-detection） |
| Q-3 | aiworkflow-requirements references（`ci-cd.md` 等）への反映方針 | Phase 12 で明文化、実反映は別タスク |

> open question 残存数 = 3。すべて受け皿 Phase が指定済。

## 運用ルール（明文化）

1. **PR 自動実行禁止**: 仕様書作成段階および本タスクの Phase 12 までは commit / push / PR 作成・実 PUT を一切行わない。Phase 13 はユーザー承認前提の実 PUT 実行ゲート（AC-13）。
2. **Secret hygiene**: admin token はローカル揮発扱い。runbook / 出力 / ログには `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須）の参照のみを記述する。CLAUDE.md「禁止事項」と整合。
3. **drift 別タスク起票**: GitHub 側 protection を正本とし、CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の追従更新は本タスクに含めず別タスクで起票する。
4. **dev / main 直列 PUT**: 同時実行禁止。1 PUT 完了後に次へ。
5. **rollback payload は再利用のみ**: UT-GOV-001 で確立済の rollback payload を再利用し、本タスクで上書き・再生成しない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 30種レビュー結果とMAJOR 0条件をテスト戦略へ渡す |
| Phase 10 | automation-30 正規カタログで再走査する |
| Phase 13 | GO条件として user approval 前に再確認する |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レビュー | outputs/phase-03/main.md | 代替案比較・30 種思考法・PASS/MINOR/MAJOR 判定・GO/NO-GO ゲート・リスクレジスタ |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] 代替案 4 案（A / B / C / D）が比較表に並び、12 観点で空セルゼロ
- [ ] base case が案 A で確定し、選定理由が代替案比較から導出されている
- [ ] 30 種思考法すべて PASS、MAJOR ゼロが確認されている（AC-11）
- [ ] 4 条件最終判定 PASS が記述されている（AC-12）
- [ ] PASS / MINOR / MAJOR の判定基準が定義されている
- [ ] 着手可否ゲート（GO / NO-GO）が判定基準とともに明示されている
- [ ] リスクレジスタに 5 種以上のリスクと検出 / 対応策が記述されている
- [ ] open question が 0 件 or 受け皿 Phase が指定されている
- [ ] 運用ルール（PR 自動実行禁止 / Secret hygiene / drift 別タスク起票 / dev/main 直列 PUT / rollback payload 再利用）が明文化されている（AC-13）

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 全成果物が `outputs/phase-03/` 配下に配置設計済み
- 本 Phase でトレースする AC（AC-11 / AC-12 / AC-13）が完了条件にすべて含まれている
- 30 種思考法レビューでシステム系 / 戦略・価値系 / 問題解決系 + Phase 10 補完 22 種すべてに findings と判定が付与
- リスクレジスタに 8 件のリスクが登録済
- 着手可否ゲート判定: **GO**
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - base case = 案 A（UT-GOV-004 完了後の dev / main 独立 PUT）
  - 30 種思考法すべて PASS / MAJOR ゼロ
  - 4 条件最終判定 PASS（4 件すべて）
  - リスクレジスタ 8 件（typo / 片側失敗 / admin block / contexts=[] 残留 / drift / Secret 漏洩 / UT-GOV-004 不整合 / PR 自動実行）
  - 運用ルール 5 件（PR 自動実行禁止 / Secret hygiene / drift 別タスク起票 / dev/main 直列 PUT / rollback payload 再利用）
  - 着手可否ゲート: GO
- ブロック条件:
  - 30 種思考法のいずれかで MAJOR 検出
  - 4 条件のいずれかが MAJOR
  - Phase 2 設計成果物の不足
  - UT-GOV-001 Phase 13 完了未確認 / UT-GOV-004 完了未確認
