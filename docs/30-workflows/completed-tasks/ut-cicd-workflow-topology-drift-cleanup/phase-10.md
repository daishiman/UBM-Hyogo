# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（final review gate） |

## 目的

Phase 1〜9 で蓄積した要件・設計（差分マトリクス）・テスト戦略・実装ランブック・異常系・AC マトリクス・DRY 化（SSOT 集約）・QA の各成果物を横断レビューし、AC-1〜AC-11 すべての達成状態と 4条件最終判定（PASS/MINOR/MAJOR）を確定する。**spec_created 段階の本タスクでは「未実装だが仕様確定」状態を許容**し、Phase 11 / 12 / 13 へ進む前の着手前提（blocker）と派生タスク一覧を確定する。MINOR は必ず未タスク化（`docs/30-workflows/unassigned-task/` への formalize）方針を取る。

## 実行タスク

1. AC-1〜AC-11 の達成状態を spec_created 視点で評価する（完了条件: 11 件すべてに「未実装だが仕様確定」「条件付き PASS」「仕様未確定」のいずれかが付与されている）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を確定する（完了条件: PASS/MINOR/MAJOR が一意に決定）。
3. blocker 一覧（着手前提）を作成する（完了条件: 並列タスク UT-GOV-001 / UT-GOV-003 整合確認 + 派生タスク起票準備が含まれる）。
4. 派生タスク一覧を確定する（完了条件: HIGH/MEDIUM/LOW × Wave 配置案が `outputs/phase-10/go-no-go.md` に列挙されている）。
5. MINOR 判定が出た場合の未タスク化方針を確定する（完了条件: `docs/30-workflows/unassigned-task/` への formalize ルートが記述）。
6. GO/NO-GO 判定を確定する（完了条件: `outputs/phase-10/go-no-go.md` に GO 判定が記述されている）。
7. open question を Phase 11 / 12 / 13 へ送り出す（完了条件: 残課題の受け皿 Phase が指定されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-07.md | AC × 検証 × 実装トレース |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-08.md | DRY 化 / SSOT 集約結果 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-09.md | QA 結果（無料枠 / secret hygiene / deploy contract / 派生優先度） |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-03.md | base case 最終判定 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/index.md | AC-1〜AC-11 / 不変条件 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | unassigned task formalize ルート |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-10.md | 最終レビュー参照事例 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、「仕様が Phase 1〜9 で具体的に確定し、Phase 5 ランブックで実行可能粒度に分解されているか」で判定する。本タスクは docs-only であり、impl 必要差分は派生タスクへ正しく委譲されているかも評価軸に含む。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `.github/workflows/` 全 yaml の棚卸し（Node / pnpm / job / trigger / deploy target） | 未実装だが仕様確定 | Phase 2 棚卸しテンプレート、Phase 5 ランブック | PASS |
| AC-2 | `deployment-gha.md` 差分マトリクスと docs-only / impl 分類 | 未実装だが仕様確定 | Phase 2 drift-matrix-design.md、Phase 8 SSOT 表 | PASS |
| AC-3 | `deployment-cloudflare.md` × `apps/web/wrangler.toml` 照合 | 未実装だが仕様確定 | Phase 9 deploy-contract-integrity.md | PASS |
| AC-4 | 05a cost guardrail 監視対象が実在 workflow を指していることの確認 | 未実装だが仕様確定 | Phase 2 マッピング表、派生 `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | PASS（条件付き：派生タスク起票で完了） |
| AC-5 | Pages build budget vs OpenNext Workers の判断材料整理 | 未実装だが仕様確定 | Phase 2 / Phase 9 deploy-contract-integrity.md | PASS |
| AC-6 | docs-only 差分が本タスク内で正本仕様の更新案として記述 | 未実装だが仕様確定 | Phase 2 canonical-spec-update-plan.md、Phase 12 で実体反映 | PASS |
| AC-7 | impl 必要差分が `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` 起票方針として列挙 | 未実装だが仕様確定 | Phase 9 派生タスク優先度付け、Phase 12 unassigned-task-detection.md | PASS |
| AC-8 | 4条件（価値性 / 実現性 / 整合性 / 運用性）最終判定 PASS | 本 Phase で確定 | 下記 4条件最終評価 | PASS |
| AC-9 | 不変条件 #5（D1 access apps/api 内閉鎖）違反の workflow なし | 未実装だが仕様確定 | Phase 2 invariants 確認、Phase 9 deploy contract | PASS |
| AC-10 | 検証コマンド（`rg -n ...`）の出力に基づく差分根拠が記録されている | spec のみ（実 rg は Phase 11 手動 smoke で取得） | Phase 11 manual-smoke-log.md へ引き渡し | PASS（条件付き） |
| AC-11 | GitHub Issue #58 が CLOSED のまま、本仕様書が成果物として参照可能 | 確定済み | index.md / artifacts.json | PASS |

> AC-4 / AC-10 の「条件付き PASS」: 派生タスク起票（Phase 12）と手動 smoke による rg 出力取得（Phase 11）が必要。本 Phase では blocker ではなく Phase 11 / 12 への送り事項として扱う。

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 05a cost guardrail が実在しない workflow を監視し続けるリスクを除去、Pages vs Workers の運用判断混在による誤デプロイを防止。Phase 1 真の論点と整合。 |
| 実現性 | PASS | docs-only に閉じ、impl 必要差分は派生タスクに委譲。Phase 9 で全サービス無料枠影響 0、secret hygiene 新規導入 0、line budget / link 整合 PASS を確認。 |
| 整合性 | PASS | 不変条件 #5（D1 access apps/api 内閉鎖）/ #6（GAS prototype 非昇格）に違反する workflow 構成が無いことを Phase 2 / 9 で確認。Phase 8 で SSOT を `deployment-gha.md` / `deployment-cloudflare.md` に集約済み。 |
| 運用性 | PASS | SSOT 集約により Node / pnpm / workflow 名の一括更新が可能、派生タスクの優先度・Wave 配置が確定し着手順序が一意。CLOSED Issue #58 の追跡も index.md に固定。 |

**最終判定: GO（PASS）**

## blocker 一覧（着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 並列 UT-GOV-001（branch protection） との workflow 名整合 | 並列タスク | required_status_checks に登録される workflow 名と SSOT 化された名前が一致 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で確認 |
| B-02 | 並列 UT-GOV-003（CODEOWNERS governance）との `.github/workflows/**` owner 整合 | 並列タスク | CODEOWNERS の対象パスと SSOT 化された workflow ファイル群が整合 | `.github/CODEOWNERS` 目視 + `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` |
| B-03 | 上流 05a observability and cost guardrails の監視対象一覧が確定済み | 上流タスク | `observability-matrix.md` の workflow 名が現実体に同期可能な状態 | 05a の outputs を確認 |
| B-04 | aiworkflow-requirements skill (`deployment-gha.md` / `deployment-cloudflare.md`) を Phase 12 で更新する権限・レビュー方針が確定 | 内部前提 | Phase 12 documentation 更新時に skill reference 編集を含めるかをユーザー判断 | Phase 12 spec |
| B-05 | 派生タスク `UT-CICD-DRIFT-IMPL-*` の unassigned-task/ への起票準備が整っていること | 内部前提 | 各派生タスク名・優先度・Wave 配置・依存が Phase 9 で確定済み | Phase 9 派生優先度付け表 |
| B-06 | Pages vs Workers の current contract 判断は本タスクで行わないという合意 | スコープ前提 | 派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` で判断する旨が Phase 3 / 9 / 10 で一貫している | 各 phase 仕様書 |

> B-01 / B-02 が未確定の場合、Phase 12 documentation 更新で workflow 名 SSOT を確定しても下流（branch protection / CODEOWNERS）と乖離するため、Phase 11 / 12 進行時に並列タスクの状態を再確認する。

## 派生タスク一覧（確定）

| 派生タスク ID | 内容 | 優先度 | Wave | 依存 |
| --- | --- | --- | --- | --- |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | apps/web の Pages vs OpenNext Workers current contract を確定し、wrangler.toml / `deployment-cloudflare.md` を整合 | HIGH | Wave 2 | UT-CICD-DRIFT |
| `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | 05a observability-matrix.md の監視対象 workflow 名を SSOT に同期 | HIGH | Wave 2 | UT-CICD-DRIFT |
| `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` | `actions/checkout` + `mise install` + `pnpm install` を composite action 化 | MEDIUM | Wave 3 | 上 2 件 |
| `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` | typecheck / lint / build を reusable workflow 化 | MEDIUM | Wave 3 | 上 |
| `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION` | wrangler.toml の Cron 表記を `deployment-cloudflare.md` SSOT に揃える | LOW | Wave 4 | UT-09 |
| `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` | `verify-indexes.yml` の trigger 条件最適化 | LOW | Wave 4 | - |

> 起票実体は Phase 12 `unassigned-task-detection.md` で `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md` を作成する。

## MINOR 判定の未タスク化方針

- 本タスク Phase 10 では **MINOR 判定なし**（4条件すべて PASS）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する（本タスク内で抱え込まない）。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し、原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 例: 「Pages → Workers 移行の actual cutover」は MINOR ではなく派生タスク `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` として既に確定済み（重複しない）。

## open question の Phase 振り分け（Phase 3 から継承）

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | drift マトリクスの差分件数が多すぎる場合の派生タスク粒度（1 task = 1 diff か、関連 diff グルーピングか） | Phase 5 で確定済み | 解消 |
| 2 | Pages vs Workers の最終判断 | 派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | unassigned-task 化（Phase 12 で起票） |
| 3 | 05a observability-matrix.md の更新が必要となった場合の起票要否 | 派生 `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | unassigned-task 化（Phase 12 で起票） |
| 4 | skill reference (`deployment-gha.md` / `deployment-cloudflare.md`) の編集を本 PR に含めるか | Phase 12 / Phase 13 | ユーザー判断事項として明示 |

## Phase 11 進行 GO / NO-GO 基準

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-11 すべて PASS（AC-4 / AC-10 の条件付き PASS は OK）
- [ ] 4条件最終判定が PASS
- [ ] blocker B-01〜B-06 が記述され、解消条件が明記されている
- [ ] 派生タスク一覧（HIGH 2 / MEDIUM 2 / LOW 2）が確定
- [ ] MAJOR が一つもない
- [ ] open question すべてに受け皿 Phase / 派生タスクが指定済み

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある（条件付き PASS は除く）
- blocker の解消条件が未記述
- MINOR を未タスク化せず本タスク内に抱え込む
- 派生タスク優先度・Wave 配置が確定していない

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に、spec_created 視点で 11 件評価。

### ステップ 2: 4条件最終判定
- Phase 3 の base case 判定を継承し、Phase 9 QA 結果で再確認。

### ステップ 3: blocker 一覧作成
- 並列タスク 2 件 + 上流 1 件 + 内部前提 2 件 + スコープ前提 1 件 = 6 件。

### ステップ 4: 派生タスク一覧確定
- Phase 9 優先度付けを Phase 10 の最終一覧として固定。

### ステップ 5: MINOR 未タスク化方針の明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述。

### ステップ 6: GO/NO-GO 確定
- `outputs/phase-10/go-no-go.md` に判定を記述。

### ステップ 7: open question を次 Phase へ送出
- 4 件すべてに受け皿を指定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test（rg / yamllint / link check）実施 |
| Phase 12 | unassigned-task 候補（派生 7 件）を formalize / `unassigned-task-detection.md` に列挙 |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| UT-GOV-001 | required_status_checks 名と SSOT 化された workflow 名の整合確認 |
| UT-GOV-003 | `.github/workflows/**` owner 宣言と SSOT 整合確認 |

## 多角的チェック観点

- 価値性: 05a 監視対象の同期と Pages vs Workers 判断委譲が Phase 1 真の論点と一致。
- 実現性: docs-only スコープで GO 判定可能、Phase 9 で無料枠影響 0 / secret hygiene PASS / link 整合 PASS。
- 整合性: 不変条件 #5 / #6 すべて satisfied、Phase 8 で SSOT 統一。
- 運用性: 派生タスク優先度 + Wave が確定、CLOSED Issue 追跡も index.md に固定。
- 認可境界: 新規 Secret 導入 0、既存参照のみ。
- 無料枠: 全サービスで +0。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 達成状態評価 | 10 | spec_created | 11 件 |
| 2 | 4条件最終判定 | 10 | spec_created | PASS |
| 3 | blocker 一覧作成 | 10 | spec_created | 6 件 |
| 4 | 派生タスク一覧確定 | 10 | spec_created | HIGH 2 / MED 2 / LOW 2 |
| 5 | MINOR 未タスク化方針確定 | 10 | spec_created | ルール明文化 |
| 6 | GO/NO-GO 判定 | 10 | spec_created | GO |
| 7 | open question 送出 | 10 | spec_created | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・4条件・blocker・派生タスク一覧 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-11 全件に達成状態が付与されている
- [ ] 4条件最終判定が PASS
- [ ] blocker 一覧に 6 件以上が記述されている
- [ ] 派生タスク一覧（HIGH 2 / MEDIUM 2 / LOW 2）が確定
- [ ] MINOR 未タスク化方針が明文化されている
- [ ] GO/NO-GO 判定が GO で確定
- [ ] open question 4 件すべてに受け皿 Phase / 派生タスクが指定
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4条件 × blocker × 派生タスク × MINOR × GO/NO-GO × open question の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - blocker 6 件（Phase 11 / 12 着手前に再確認必須）
  - 派生タスク一覧 6 件（Phase 12 で `unassigned-task-detection.md` に formalize）
  - AC-4 / AC-10 を Phase 11 手動 smoke で最終確認する旨
  - open question #2 / #3 を Phase 12 で派生タスク化、#4 は Phase 13 でユーザー判断
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC で PASS でないもの（条件付き PASS は除く）が残る
  - blocker の解消条件が未記述
  - 派生タスク一覧が確定していない
