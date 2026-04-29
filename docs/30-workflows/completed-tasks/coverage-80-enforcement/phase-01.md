# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制(全 package 一律) (coverage-80-enforcement) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1（quality / coverage governance） |
| 実行種別 | serial（PR① → PR② → PR③） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | quality_governance |
| 機能名 | coverage-80-enforcement |

## Schema / 共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | `vitest.config.ts` coverage thresholds / `scripts/coverage-guard.sh` / `.github/workflows/ci.yml` coverage-gate / `lefthook.yml` pre-push / `.claude/skills/task-specification-creator/references/coverage-standards.md` |
| 本タスクが ownership を持つか | yes。coverage gate と coverage 標準化の ownership は本 workflow が持つ |
| 他 wave への影響 | 全 implementation task は PR③ hard gate 化後に 80% coverage を満たす必要がある。UT-GOV-001 / UT-GOV-004 は branch protection contexts 登録で連携 |
| 競合リスク | CI workflow / lefthook / coverage standards は他 governance task と競合し得るため、PR①/PR③ の段階導入で編集順を固定 |
| migration 番号 / exports 改名の予約 | D1 migration / package exports 変更なし。coverage job 名は `coverage-gate` で予約 |

## 目的

UBM-Hyogo monorepo の全 package（`apps/web` / `apps/api` / `packages/shared` / `packages/integrations` / `packages/integrations/google`）でテストカバレッジ 80%（lines / branches / functions / statements 全て）を構造的に強制する仕組みを、CI required gate と lefthook pre-push の二重防御で導入する。`scripts/coverage-guard.sh` を新設し、threshold 未達時に不足ファイル top10 と「追加すべきテスト雛形パス」を stderr に出力することで、ローカルでの auto-loop 開発（実行→警告→テスト追加→再実行）を成立させる。本 Phase は要件確定に閉じ、実 merge / branch protection 適用は Phase 13 ユーザー承認後の別オペレーションで実施する。

## 真の論点 (true issue)

「カバレッジ 80% を達成するか否か」ではなく、**「(a) 仕組み導入 PR 自体が hard gate に落ちる鶏卵問題、(b) monorepo 単一 vitest config での package 別集計の困難、(c) Edge runtime / OpenNext で実行不可の領域を coverage.exclude に正しく載せる範囲、(d) soft → hard 切替の運用忘却、(e) 既存 codecov.yml と本仕様の二重正本 drift」**の 5 リスクを同時に塞ぐ仕様設計が本質。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（参照） | aiworkflow-requirements `quality-requirements-advanced.md` | 既存 80%/65% 閾値定義 | Phase 12 で「全 package 一律 80%」へ更新する差分仕様 |
| 上流（参照） | task-specification-creator `coverage-standards.md` | Phase 6/7 検証テンプレ | Phase 5 で `scripts/coverage-guard.sh` 参照を追記する設計 |
| 並列 | int-test-skill | 統合テストの coverage 寄与 | 80% 計上ルールの整合 |
| 関連 | UT-GOV-001 / UT-GOV-004 | branch protection apply / required_status_checks contexts 同期 | hard gate 化時の coverage job 名を contexts に登録する手順 |
| 下流 | 全実装タスク | hard gate 化以降のすべての PR | 80% 担保が前提化される |

## 価値とコスト

- 価値: 「カバレッジ目標が定義だけ存在し強制されない」状態を解消し、80% 未満の merge を構造的に block。Edge runtime や OpenNext bundle の隠れたバグ流入を縮小し、回帰テスト不在による migration / API 契約破壊事故を防ぐ。
- コスト: vitest config 数十行 + `coverage-guard.sh` 約 100 行 + CI workflow 数十行 + lefthook 数行 + 各 package script 統一。実装コスト小。最大コストは PR② のテスト追加（baseline 計測値次第で数十〜数百テスト追加）。
- 機会コスト: Codecov 単独依存と比べ、ローカルでも閾値検証できる利点。jest / mocha への移行コストとも独立。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 80% 未満 merge を CI + ローカル二重で block。バグ流入を構造的に削減 |
| 実現性 | PASS | vitest v8 provider / lefthook / GitHub Actions すべて既存技術範囲。3 段階 PR で鶏卵問題を回避 |
| 整合性 | PASS | 不変条件 #5 を侵害しない。CLAUDE.md branch 戦略と整合（CI gate 強化のみ） |
| 運用性 | PASS | `coverage-guard.sh` の stderr 出力で「追加すべきテスト」が即可視化、ローカル auto-loop が成立 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| script ファイル | `scripts/` | `coverage-guard.sh`（kebab-case + .sh） |
| CI workflow | `.github/workflows/` | 既存 `ci.yml` に `coverage-gate` job として追加 |
| lefthook hook | `lefthook.yml` | `pre-push.commands.coverage-guard` |
| package script | 各 `package.json` | `test`, `test:coverage`（統一名） |
| 出力 artifact | `coverage/` | `coverage-summary.json` / `lcov.info`（vitest デフォルト） |
| commit メッセージ | Phase 13 まで commit しない | `chore(quality): introduce coverage 80% gate (PR1 of 3)` 等 |

## 実行タスク

1. 親タスク（既存正本 `quality-requirements-advanced.md`）の現状値（desktop 80% / shared 65%）を写経し、UBM 文脈での「全 package 一律 80%」へ再定義する設計を確定する（完了条件: index.md の AC-1 / AC-10 と一致）。
2. タスク種別を `implementation` / `visualEvidence: NON_VISUAL` / `scope: quality_governance` で固定（完了条件: artifacts.json.metadata と一致）。
3. 鶏卵問題を回避する 3 段階 PR 戦略（PR① soft / PR② テスト追加 / PR③ hard）を Phase 5 / 13 で重複明記する設計を予約（完了条件: Phase 2 / 3 / 5 / 13 仕様にも同記述が含まれる）。
4. 苦戦想定 1〜7 をすべて Phase 2 リスク表 / Phase 6 異常系検証に紐付ける（完了条件: 7 件すべてに対応 Phase が指定）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. スコープが「タスク仕様書整備に閉じ、実 merge / branch protection 適用は Phase 13 ユーザー承認後の別オペレーション」であることを明記（完了条件: §スコープに明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | 既存 coverage 正本（更新対象） |
| 必須 | .claude/skills/task-specification-creator/references/coverage-standards.md | Phase 6/7 テンプレ |
| 必須 | .claude/skills/task-specification-creator/references/patterns-testing.md | カバレッジ免除判定 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 完了ゲート |
| 必須 | vitest.config.ts | coverage 設定追加対象 |
| 必須 | .github/workflows/ci.yml | coverage-gate job 追加対象 |
| 必須 | lefthook.yml | pre-push hook 追加対象 |
| 必須 | CLAUDE.md | branch 戦略 / solo 運用ポリシー |
| 参考 | https://vitest.dev/guide/coverage | Vitest v8 provider 仕様 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase outputs 骨格（Phase 1〜13 の main.md と Phase 11 / Phase 12 補助成果物）作成
- 全 package 一律 80% 閾値の正本固定設計
- `scripts/coverage-guard.sh` の I/O / exit code / 出力フォーマット仕様
- vitest coverage 設定（v8 provider / threshold / reporter / exclude）の正規構成
- CI `coverage-gate` job 追加仕様（soft → hard 2 段階切替）
- lefthook pre-push 統合仕様
- baseline 計測タスク（T0）の手順仕様
- aiworkflow-requirements 正本同期設計（Phase 12）

### 含まない

- 実テストコードの追加実装（PR② / T5 として別タスク化）
- 実 CI 設定の merge / branch protection apply 実 PUT（Phase 13 ユーザー承認後）
- E2E / Playwright 等の追加フレームワーク導入
- Codecov SaaS 課金プラン判断
- 自動 commit / push / PR 発行

## 実行手順

### ステップ 1: 既存正本の写経と差分確定

- `quality-requirements-advanced.md` L125-144 の既存表（desktop 80% / shared 65%）を本タスクで全 package 一律 80% へ再定義。差分は Phase 12 system-spec-update-summary に集約。

### ステップ 2: 真の論点（5 リスク同時封じ）の固定

- 鶏卵問題 / monorepo 集計 / Edge runtime exclude / soft→hard 忘却 / codecov.yml 二重正本 を Phase 1 §真の論点に明記。

### ステップ 3: 4 条件評価のロック

- 4 条件すべて PASS。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `implementation` / `NON_VISUAL` / `quality_governance` を Phase 1 で固定。

### ステップ 5: 苦戦想定 1〜7 の対応 Phase 割り当て

- 1（鶏卵） → Phase 2 §3 段階 PR 戦略
- 2（monorepo 集計） → Phase 2 §coverage-guard.sh 集計仕様 + Phase 6 異常系
- 3（Edge runtime exclude） → Phase 2 §vitest.config.coverage.exclude
- 4（OS 依存） → Phase 2 §POSIX + jq 1.6+ 前提固定
- 5（soft→hard 忘却） → Phase 13 + Phase 12 unassigned-task-detection
- 6（codecov.yml 二重正本） → Phase 12 同期
- 7（pre-push 遅延） → Phase 2 オプション設計（`--changed` 限定モード）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 5 リスク / 3 段階 PR 戦略 / coverage-guard.sh I/O / vitest config / lefthook 統合 |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-14 をテスト戦略のトレース対象に渡す |
| Phase 6 | 苦戦想定 2 / 4 / 7 を異常系検証ケースに展開 |
| Phase 7 | AC matrix の左軸として AC-1〜AC-14 を使用 |
| Phase 11 | baseline 計測手順 / soft→hard 切替リハーサルの実走基準 |
| Phase 13 | PR① / PR② / PR③ の merge 段取り根拠として AC-5 / AC-8 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 を触らない。違反なし
- branch 戦略（CLAUDE.md）: solo 運用ポリシー（`required_pull_request_reviews=null`）と整合
- 鶏卵問題回避: 3 段階 PR 戦略が Phase 5 / 13 に明記されるか
- monorepo 集計: package 別 `coverage-summary.json` 取得方法が明記されるか
- Edge runtime exclude: `apps/web` の OpenNext bundle / `.open-next/` 等が exclude されるか
- soft→hard 切替: PR③ 実行期限が unassigned-task として残るか
- codecov.yml 二重正本: Phase 12 で同期手順が明記されるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 既存正本写経と差分確定 | 1 | completed | quality-requirements-advanced.md と一致 |
| 2 | タスク種別 / scope / visualEvidence 固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | 真の論点 5 リスク同時封じ設計 | 1 | completed | Phase 2 / 3 / 5 / 13 で再記述 |
| 5 | 苦戦想定 1〜7 の対応 Phase 割り当て | 1 | completed | 7 件すべて受け皿あり |
| 6 | スコープ「Phase 13 承認後 merge」固定 | 1 | completed | 含む / 含まない明記 |

## 苦戦想定サマリ

| # | 苦戦想定 | 受け皿 |
| --- | --- | --- |
| 1 | 仕組み導入 PR 自体が hard gate に落ちる鶏卵問題 | Phase 2 §3 段階 PR 戦略 + Phase 5 / 13 重複明記 |
| 2 | monorepo 単一 vitest config で package 別集計困難 | Phase 2 §coverage-guard.sh 集計仕様 + Phase 6 異常系 |
| 3 | Edge runtime / OpenNext で実行不可領域の exclude 範囲 | Phase 2 §coverage.exclude リスト |
| 4 | macOS / Linux で jq / bash 挙動差 | Phase 2 §POSIX + jq 1.6+ 前提固定 |
| 5 | soft → hard 切替の運用忘却 | Phase 13 切替期限 + Phase 12 unassigned-task |
| 6 | 既存 codecov.yml との二重正本 drift | Phase 12 同期 |
| 7 | lefthook pre-push の遅延 | Phase 2 §`--changed` 限定モード |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物 |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「5 リスク同時封じ」に再定義されている
- [x] 4 条件評価が全 PASS で確定
- [x] タスク種別 `implementation` / `NON_VISUAL` / `quality_governance` が固定
- [x] スコープ「実 merge は Phase 13 承認後」が明記
- [x] AC-1〜AC-14 が index.md と完全一致
- [x] 全 package 一律 80% 閾値が要件として明記
- [x] 苦戦想定 1〜7 が全件 受け皿 Phase に割り当て
- [x] 不変条件 #5 を侵害しない範囲で要件が定義

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦想定 1〜7 が全件 受け皿 Phase に対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 5 リスク同時封じ
  - 全 package 一律 80%
  - 3 段階 PR 戦略（PR① soft / PR② テスト追加 / PR③ hard）
  - `scripts/coverage-guard.sh` の I/O 仕様骨子
  - vitest config / CI / lefthook の更新範囲
  - 4 条件評価 全 PASS の根拠
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-14 が index.md と乖離
  - 苦戦想定 1〜7 のいずれかに受け皿 Phase が無い
