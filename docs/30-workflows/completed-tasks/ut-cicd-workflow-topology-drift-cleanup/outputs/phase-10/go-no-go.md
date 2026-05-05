# Phase 10 成果物: 最終レビュー（GO/NO-GO 判定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 10 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup（final review gate） |

## 最終判定: **GO（PASS）**

spec_created 段階で、AC-1〜AC-11 が全件達成見込み（条件付き PASS 含む）、4条件すべて PASS、blocker 6 件記述済み、派生タスク 7 件確定、MAJOR ゼロ、MINOR ゼロ。Phase 11 / 12 / 13 へ進行可能。

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、「仕様が Phase 1〜9 で具体的に確定し、Phase 5 ランブックで実行可能粒度に分解されているか」で判定。docs-only タスクであり、impl 必要差分は派生タスクへ正しく委譲されているかも評価軸に含む。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `.github/workflows/` 全 yaml 棚卸し（Node / pnpm / job / trigger / deploy target） | 未実装だが仕様確定 | Phase 2 棚卸しテンプレ・Phase 5 ランブック | PASS |
| AC-2 | `deployment-gha.md` 差分マトリクスと docs-only / impl 分類 | 未実装だが仕様確定 | Phase 2 drift-matrix-design.md・Phase 8 SSOT 表 | PASS |
| AC-3 | `deployment-cloudflare.md` × `apps/web/wrangler.toml` 照合 | 未実装だが仕様確定 | Phase 9 deploy-contract-integrity.md | PASS |
| AC-4 | 05a cost guardrail 監視対象が実在 workflow を指していることの確認 | 未実装だが仕様確定 | Phase 2 マッピング表・派生 `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | PASS（条件付き：派生起票で完了） |
| AC-5 | Pages build budget vs OpenNext Workers の判断材料整理 | 未実装だが仕様確定 | Phase 2 / Phase 9 deploy-contract-integrity.md | PASS |
| AC-6 | docs-only 差分が本タスク内で正本仕様の更新案として記述 | 未実装だが仕様確定 | Phase 2 canonical-spec-update-plan.md・Phase 12 で実体反映 | PASS |
| AC-7 | impl 必要差分が `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` 起票方針として列挙 | 未実装だが仕様確定 | Phase 9 派生タスク優先度・Phase 12 unassigned-task-detection.md | PASS |
| AC-8 | 4条件最終判定 PASS | 本 Phase で確定 | 下記 4条件最終評価 | PASS |
| AC-9 | 不変条件 #5 違反の workflow 構成なし | 未実装だが仕様確定 | Phase 2 invariants 確認・Phase 9 deploy contract | PASS |
| AC-10 | 検証コマンド（`rg -n ...`）の出力に基づく差分根拠記録 | spec のみ（実 rg は Phase 11 手動 smoke で取得） | Phase 11 manual-smoke-log.md へ引き渡し | PASS（条件付き） |
| AC-11 | GitHub Issue #58 が CLOSED のまま、本仕様書が成果物として参照可能 | 確定済み | index.md / artifacts.json | PASS |

> AC-4 / AC-10 の「条件付き PASS」: 派生タスク起票（Phase 12）と手動 smoke による rg 出力取得（Phase 11）が必要。本 Phase では blocker ではなく Phase 11 / 12 への送り事項として扱う。

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 05a cost guardrail が実在しない workflow を監視するリスクを除去、Pages vs Workers 運用判断の混在による誤デプロイを防止。Phase 1 真の論点と整合。 |
| 実現性 | PASS | docs-only に閉じ、impl 必要差分は派生タスクに委譲。Phase 9 で全サービス無料枠影響 0、secret hygiene 新規導入 0、line budget / link 整合 PASS を確認。 |
| 整合性 | PASS | 不変条件 #5（D1 access apps/api 内閉鎖）/ #6（GAS prototype 非昇格）違反の workflow 構成なし（Phase 2 / 9 で確認）。Phase 8 で SSOT を `deployment-gha.md` / `deployment-cloudflare.md` に集約。 |
| 運用性 | PASS | SSOT 集約により Node / pnpm / workflow 名の一括更新が可能、派生タスクの優先度・Wave 配置確定で着手順序が一意。CLOSED Issue #58 追跡も index.md に固定。 |

**最終判定: GO（PASS）**

## blocker 一覧（着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 並列 UT-GOV-001（branch protection）との workflow 名整合 | 並列タスク | required_status_checks に登録される workflow 名と SSOT 化された名前が一致 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` |
| B-02 | 並列 UT-GOV-003（CODEOWNERS governance）との `.github/workflows/**` owner 整合 | 並列タスク | CODEOWNERS の対象パスと SSOT 化された workflow ファイル群の整合 | `.github/CODEOWNERS` 目視 + `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` |
| B-03 | 上流 05a observability and cost guardrails の監視対象一覧が確定済み | 上流タスク | `observability-matrix.md` の workflow 名が現実体に同期可能な状態 | 05a outputs を確認 |
| B-04 | aiworkflow-requirements skill (`deployment-gha.md` / `deployment-cloudflare.md`) を Phase 12 で更新する権限・レビュー方針が確定 | 内部前提 | Phase 12 documentation 更新時に skill reference 編集を含めるかをユーザー判断 | Phase 12 spec |
| B-05 | 派生タスク `UT-CICD-DRIFT-IMPL-*` の unassigned-task/ 起票準備が整っている | 内部前提 | 各派生タスク名・優先度・Wave 配置・依存が Phase 9 で確定 | Phase 9 派生優先度付け表 |
| B-06 | Pages vs Workers の current contract 判断は本タスクで行わないという合意 | スコープ前提 | 派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` で判断する旨が Phase 3 / 9 / 10 で一貫 | 各 phase 仕様書 |

> B-01 / B-02 が未確定の場合、Phase 12 documentation 更新で workflow 名 SSOT を確定しても下流（branch protection / CODEOWNERS）と乖離するため、Phase 11 / 12 進行時に並列タスクの状態を再確認する。

## 派生タスク一覧（確定）

| 派生タスク ID | 内容 | 優先度 | Wave | 依存 |
| --- | --- | --- | --- | --- |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | apps/web の Pages vs OpenNext Workers current contract を確定し wrangler.toml / `deployment-cloudflare.md` 整合 | HIGH | Wave 2 | UT-CICD-DRIFT |
| `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | 05a observability-matrix.md の監視対象 workflow 名を SSOT に同期 | HIGH | Wave 2 | UT-CICD-DRIFT |
| `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` | `actions/checkout` + `mise install` + `pnpm install` を composite action 化 | MEDIUM | Wave 3 | 上 2 件 |
| `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` | typecheck / lint / build を reusable workflow 化 | MEDIUM | Wave 3 | 上 |
| `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE` | `actionlint` / `yamllint` 未導入による workflow 構文検査 N/A を CI gate 化 | MEDIUM | Wave 3 | UT-CICD-DRIFT |
| `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION` | wrangler.toml の Cron 表記を `deployment-cloudflare.md` SSOT に揃える | LOW | Wave 4 | UT-09 |
| `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` | `verify-indexes.yml` の trigger 条件最適化 | LOW | Wave 4 | - |

> 起票実体は Phase 12 `unassigned-task-detection.md` で `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md` を作成する。

## MINOR 判定の未タスク化方針

- 本タスク Phase 10 では **MINOR 判定なし**（4条件すべて PASS）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する（本タスク内で抱え込まない）。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 例: 「Pages → Workers 移行の actual cutover」は MINOR ではなく派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` として既に確定済み（重複しない）。

## open question の Phase 振り分け（Phase 3 から継承）

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | drift マトリクスの差分件数が多すぎる場合の派生タスク粒度（1 task = 1 diff か関連 diff グルーピングか） | Phase 5 で確定済み | 解消 |
| 2 | Pages vs Workers の最終判断 | 派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | unassigned-task 化（Phase 12 で起票） |
| 3 | 05a observability-matrix.md の更新が必要となった場合の起票要否 | 派生 `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | unassigned-task 化（Phase 12 で起票） |
| 4 | skill reference (`deployment-gha.md` / `deployment-cloudflare.md`) の編集を本 PR に含めるか | Phase 12 / Phase 13 | ユーザー判断事項として明示 |

## Phase 11 進行 GO / NO-GO 基準

### GO 条件（すべて満たすこと）

- [x] AC-1〜AC-11 すべて PASS（AC-4 / AC-10 の条件付き PASS は OK）
- [x] 4条件最終判定が PASS
- [x] blocker B-01〜B-06 が記述され解消条件明記
- [x] 派生タスク一覧（HIGH 2 / MEDIUM 3 / LOW 2）確定
- [x] MAJOR が一つもない
- [x] open question すべてに受け皿 Phase / 派生タスク指定済み

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR 残存 → 該当なし
- AC のうち PASS でないもの（条件付き PASS は除く） → 該当なし
- blocker の解消条件が未記述 → 該当なし
- MINOR を未タスク化せず本タスク内に抱え込む → 該当なし
- 派生タスク優先度・Wave 配置が確定していない → 該当なし

すべての NO-GO 条件に該当しないため **GO 確定**。

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test（rg / yamllint / link check）実施 |
| Phase 12 | unassigned-task 候補（派生 7 件）を formalize / `unassigned-task-detection.md` 列挙 |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| UT-GOV-001 | required_status_checks 名と SSOT 化 workflow 名の整合確認 |
| UT-GOV-003 | `.github/workflows/**` owner 宣言と SSOT 整合確認 |

## 多角的チェック観点

- 価値性: 05a 監視対象の同期と Pages vs Workers 判断委譲が Phase 1 真の論点と一致
- 実現性: docs-only スコープで GO 可能、Phase 9 で無料枠 0 / secret hygiene PASS / link 整合 PASS
- 整合性: 不変条件 #5 / #6 satisfied、Phase 8 で SSOT 統一
- 運用性: 派生タスク優先度 + Wave 確定、CLOSED Issue 追跡も index.md に固定
- 認可境界: 新規 Secret 0、既存参照のみ
- 無料枠: 全サービス +0

## 完了条件チェック

- [x] AC-1〜AC-11 全件に達成状態付与
- [x] 4条件最終判定 PASS
- [x] blocker 一覧 6 件記述
- [x] 派生タスク一覧（HIGH 2 / MEDIUM 3 / LOW 2）確定
- [x] MINOR 未タスク化方針明文化
- [x] GO/NO-GO 判定 = GO
- [x] open question 4 件すべて受け皿指定
- [x] 本ドキュメント作成済み

## 次 Phase への引き渡し

- GO 判定（spec_created 段階）
- blocker 6 件（Phase 11 / 12 着手前に再確認必須）
- 派生タスク一覧 7 件（Phase 12 で `unassigned-task-detection.md` に formalize）
- AC-4 / AC-10 を Phase 11 手動 smoke で最終確認する旨
- open question #2 / #3 を Phase 12 で派生タスク化、#4 は Phase 13 でユーザー判断
- ブロック条件: 4条件 MAJOR / AC PASS でない / blocker 解消条件未記述 / 派生タスク未確定
