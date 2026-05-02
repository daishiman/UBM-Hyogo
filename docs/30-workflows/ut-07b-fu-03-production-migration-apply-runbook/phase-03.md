# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 3 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. Phase 2 設計に対し代替案（自動化 / 手動口頭運用 / runbook + 承認ゲート）を比較する。
2. automation-30 の 3 系統思考法（システム系 / 戦略系 / 問題解決系）でエレガンス検証を行う。
3. 観点別レビュー（矛盾・漏れ・整合性・依存関係・安全性・監査可能性）を実施する。
4. 4 条件評価を再実施し、Phase 4 進行可否を PASS / MINOR / MAJOR で判定する。

## 目的

production migration apply を「runbook + 承認ゲート + evidence 保存」の Option C 形式で固定する設計が、自動化（Option A）・口頭手動運用（Option B）に対して優位であることを示し、ゲート判定を行う。

## 参照資料

- Phase 1 / Phase 2 成果物
- `index.md` / `artifacts.json`
- 上流: UT-07B-schema-alias-hardening、U-FIX-CF-ACCT-01
- `scripts/cf.sh`
- Cloudflare D1 migrations リファレンス

## 代替案比較

### Option A（不採用）: 完全自動化（CI で `migrations apply` を main マージ時に直接呼ぶ）

| 項目 | 内容 |
| --- | --- |
| 変更量 | `.github/workflows/` に production apply ステップを追加。`CLOUDFLARE_API_TOKEN` を production environment で利用 |
| 実行速度 | 最速（マージ即適用） |
| 承認ゲート | 弱（PR review / CI gate で代替するが、ユーザー明示承認の境界が消える） |
| 安全性 | 低（DDL 失敗・UNIQUE 衝突・データ重複時に人間判断が介在しない） |
| rollback 容易性 | 低（自動 apply 後の rollback は別 migration を緊急作成する必要） |
| 監査可能性 | 中（CI ログのみ。runbook 構造の証跡が残らない） |
| 不採用理由 | MVP 段階で production D1 への DDL は不可逆性が高く、ユーザー明示承認境界（G5）の消失は許容できない。AC-2 / AC-9 と矛盾 |

### Option B（不採用）: 完全口頭運用（runbook なしで都度判断）

| 項目 | 内容 |
| --- | --- |
| 変更量 | ゼロ（手順書を作らず、必要時に都度コマンドを発行） |
| 実行速度 | 中 |
| 承認ゲート | 文書化されない（暗黙の承認） |
| 安全性 | 低（preflight / post-check / failure handling の手順が属人化） |
| 監査可能性 | 極低（evidence 保存項目が定まらず、後追い検証が困難） |
| 不採用理由 | priority HIGH の seed spec の意図に反する。AC-1 / AC-7 / AC-8 を満たせない |

### Option C（採用）: runbook + 6 段階承認ゲート + evidence 保存

| 項目 | 内容 |
| --- | --- |
| 変更量 | runbook 文書 1 本（`outputs/phase-05/main.md`）+ evidence テンプレート |
| 実行速度 | 中（runbook 実走に手作業が残る） |
| 承認ゲート | 強（G1〜G6 で commit/PR/CI/merge/ユーザー承認/実走を分離） |
| 安全性 | 高（preflight / apply / post-check / failure handling の 5 セクションで停止判断を明文化） |
| rollback 容易性 | 中（rollback SQL は即興発行せず、UT-07B Phase 5 rollback-runbook を参照） |
| 監査可能性 | 高（commit SHA / migration hash / 出力 / 時刻 / 承認者 / 対象 DB を evidence に保存） |
| 採用理由 | AC-1〜AC-12 を満たし、ユーザー承認境界・運用安全性・監査可能性のバランスが MVP に最適 |

### Option D（不採用・将来課題）: GitHub Environment protection rule + manual approval workflow

| 項目 | 内容 |
| --- | --- |
| 変更量 | GitHub Environment の `required reviewers` を有効化し、production apply workflow を gated job 化 |
| 実装コスト | 中（workflow 設計と Environment 設定） |
| 利点 | ユーザー承認を GitHub UI 上で固定でき、evidence が GitHub Actions 側に自動保存される |
| 不採用理由 | solo dev 運用ポリシー上 `required_pull_request_reviews=null` を維持しており、Environment reviewer も同様に簡素化したい。Option C 完了後の将来オプションとして ADR で記録候補 |

## automation-30 思考法 3 系統適用

### システム系（System Thinking）

- production D1 は会員データ正本という high-stakes な境界資源。runbook は CI/CD と D1 の間に置く **人間判断レイヤ** であり、自動化と口頭運用の中間項として「介入の不可逆性を吸収する fail-safe レイヤ」を提供する。
- 6 段階承認ゲートは「直列冗長性（series redundancy）」の典型で、各ゲートが直前の状態を観測してから次に進むことで誤適用の確率を下げる。
- 5 セクション構造（preflight / apply / post-check / evidence / failure handling）は「観測 → 介入 → 検証 → 記録 → 例外処理」の OODA 派生ループで、MVP 後の他 migration（0009, 0010 …）にも雛形として再利用できる。

### 戦略系（Strategic Thinking）

- 短期戦略（Option C）と長期戦略（Option D = GitHub Environment protection 化）を ADR で関係付け、現在の最適解と将来の理想形を両立する。
- 「runbook を書く工数」と「自動化を作る工数」のトレードオフでは、MVP 段階で migration 件数が少ない（年数件）うちは runbook が実コスト最小。migration が高頻度化したら Option A/D を再評価する。
- evidence 保存先を `outputs/phase-11/` に固定することで、本タスクが将来の同種タスクの雛形として機能する戦略的レバレッジを得る。

### 問題解決系（Problem Solving）

- 「DDL の不可逆性」制約に対し、preflight の `migrations list` + `PRAGMA table_info` の二重観測で二重適用 / ALTER TABLE 失敗を事前検知する staged-gate を採用。
- 「Token / Account ID 値の evidence 混入」リスクに対し、`set -x` 禁止 + `rg` による grep verification を Phase 6 / Phase 11 で必須化することで吸収。
- 「対象 DB 取り違え」リスクに対し、preflight で対象 DB 名を明示読み上げ + `--env production` 必須化 + `d1 list` 結果との突合で多重防御。

## レビュー観点

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | PASS | 誤適用 / 二重適用 / DB 取り違え時のブラスト半径を限定し、ユーザー承認境界を文書化する価値は HIGH priority に値する |
| 実現性 | PASS | runbook 文書 1 本と evidence テンプレートで完結。新規ツール / Secret は不要 |
| 整合性 | PASS | CLAUDE.md の Cloudflare CLI 実行ルール（`scripts/cf.sh` 経由のみ・直 `wrangler` 禁止）と一致 |
| 運用性 | PASS | 6 段階ゲートと 5 セクション構造により、運用者が手順を逸脱しにくい |
| 責務境界 | PASS | UT-07B（SQL 実装）/ U-FIX-CF-ACCT-01（Token 最小化）/ 本タスク（runbook 化）が排他で重複なし |
| 安全性 | PASS | failure handling で「追加 SQL を即興発行しない」「rollback は別承認」を明文化 |
| 監査可能性 | PASS | commit SHA / migration hash / 時刻 / 承認者 / 対象 DB を evidence に保存 |
| テスタビリティ | PASS | preflight / post-check が read-only コマンドで構成され、staging 模擬実行（Phase 11 dry-run）で検証可能 |
| 機密情報保護 | PASS | Token 値 / Account ID 値の記録禁止、grep verification 必須化 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Option C と Phase 1 要件・AC-1〜AC-12 の対応に矛盾なし。代替案 A/B との排他関係も明確 |
| 漏れなし | PASS | preflight / apply / post-check / evidence / failure handling と 6 段階ゲートが AC を全件カバー |
| 整合性 | PASS | `scripts/cf.sh` 運用ルール、`apps/api/wrangler.toml` の `[env.production]` binding、Cloudflare D1 migrations 仕様、不変条件 #5 と整合 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済み。下流（runbook 実走タスク）は本仕様確定後に直列実行 |

## 指摘事項

| Severity | 内容 | 対応 |
| --- | --- | --- |
| MINOR | Option D（GitHub Environment protection 化）が ADR で言及されるだけで具体タスク化されない | Phase 12 `unassigned-task-detection.md` で起票候補として記録 |
| MINOR | runbook 雛形の他 migration（0009, 0010 …）への再利用方針が暗黙 | Phase 8 DRY 化 / Phase 12 implementation-guide で雛形参照ルールを明文化 |
| MAJOR | なし | - |
| BLOCKING | なし | - |

## ゲート判定

**PASS**: Phase 4（テスト戦略 / 検証戦略）へ進行可。MINOR 指摘 2 件は Phase 8 / Phase 12 で吸収する。blocking 事項なし。

## 完了条件

- [ ] 代替案が 3 件以上比較されている（Option A / B / C / D）
- [ ] 不採用理由が明記されている
- [ ] automation-30 の 3 系統が適用されている
- [ ] レビュー観点が 9 項目以上で評価されている
- [ ] 4 条件評価が再評価され PASS で記録されている
- [ ] ゲート判定が PASS / MINOR / MAJOR で記録されている
- [ ] blocking 事項の有無が明記されている

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

設計レビューでは統合テストを実行しない。レビュー対象は runbook の矛盾、漏れ、整合性、依存関係整合に限定する。
