# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | completed |

## 目的

モノレポとランタイム基盤 における Phase 10 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-10/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 10 | completed | upstream を読む |
| 2 | 成果物更新 | 10 | completed | outputs/phase-10/main.md |
| 3 | 4条件確認 | 10 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 主成果物が作成済み
- [ ] 正本仕様参照が残っている
- [ ] downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## AC 全項目 PASS 判定表
| AC | 判定 | 根拠 |
| --- | --- | --- |
| AC-1 | SPEC-PASS | `outputs/phase-02/runtime-topology.md` で apps/web / apps/api 境界を固定し、Phase 7 matrix と Phase 9 QA で再照合する |
| AC-2 | SPEC-PASS_WITH_SYNC | `outputs/phase-02/version-policy.md` を唯一の version ledger にする。Node 24.x / pnpm 10.x / Next.js 16.x / React 19.2.x / TypeScript 6.x は Phase 12 Step 2 で正本仕様へ同期する |
| AC-3 | SPEC-PASS | `outputs/phase-08/dependency-boundary-rules.md` で apps/web / apps/api / packages/shared / packages/integrations の dependency rule を一意化する |
| AC-4 | SPEC-PASS_WITH_SYNC | phase-02 設定値表 + phase-03 代替案で `@opennextjs/cloudflare` 採用理由と `@cloudflare/next-on-pages` 不採用理由を記録し、Phase 12 Step 2 で architecture / technology 正本へ同期する |
| AC-5 | SPEC-PASS | `outputs/phase-05/foundation-bootstrap-runbook.md` で local / staging / production の entry point を説明する |

判定語の意味:

- `SPEC-PASS`: 仕様・実装の受入条件を満たす。
- `SPEC-PASS_WITH_SYNC`: 仕様上の採用方針は妥当。ただし正本仕様との差分同期が Phase 12 完了条件。

## blocker 一覧
| ID | blocker | 解消条件 |
| --- | --- | --- |
| B-01 | 正本仕様と version / runtime 方針の差分が残る | Phase 12 Step 2 で `architecture-overview-core.md` / `technology-core.md` / `technology-frontend.md` を同期する |
| B-02 | 下流 task が参照できない output がある | `artifacts.json` と各 phase の outputs を同一 artifact 名へ補正する |
| B-03 | Phase 12 必須6成果物が artifact に登録されていない | Phase 12 outputs に6成果物を列挙する |

## Phase 11 進行 GO/NO-GO
- GO: blockers なし、または Phase 12 で解消可能。
- NO-GO: source-of-truth / branch / secret placement の重大矛盾が残る。

## 依存Phase成果物参照

- 参照対象: Phase 1 / Phase 2 / Phase 5
