# ut-cicd-workflow-topology-drift-cleanup - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-CICD-DRIFT |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup |
| ディレクトリ | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup |
| Wave | 1 |
| 実行種別 | parallel（独立着手可能、他タスクの完了待ちなし） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only / specification-cleanup（CI/CD 正本仕様の drift 整理。実装変更が必要な差分は派生タスク化） |
| visualEvidence | NON_VISUAL |
| priority | HIGH |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #58 (CLOSED) |

## 目的

`.github/workflows/*.yml` の現行 workflow 実体を棚卸しし、aiworkflow-requirements skill の正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）および 05a 観測性タスク群が前提とする workflow topology との drift を抽出・解消する。本タスクは docs-only / specification-cleanup として正本仕様を current facts に同期させることを主責務とし、コード（workflow yaml そのもの・`apps/web/wrangler.toml` 等）の変更が必要な差分は別途 implementation 派生タスクとして切り出して扱う。これにより、05a の cost guardrail が「存在しない workflow」を監視し続けることや、Pages build budget 前提と OpenNext Workers 方針が混在することによる運用判断の誤りを防止する。

## スコープ

### 含む

- `.github/workflows/` 配下の全 yaml ファイル（`backend-ci.yml` / `ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）の棚卸し
- 各 workflow の Node バージョン / pnpm バージョン / job 構成 / trigger / deploy target の抽出
- `deployment-gha.md` の workflow topology 記述と current facts の差分マトリクス作成
- `deployment-cloudflare.md` の Pages / Workers / OpenNext 方針と `apps/web/wrangler.toml` 実体（特に `pages_build_output_dir` / `main` entry の有無）との照合
- 05a 観測性タスク群（`docs/05a-parallel-observability-and-cost-guardrails/`）の cost guardrail 監視対象が、実在する workflow / deploy target を指しているかの検証
- Pages build budget 監視前提と OpenNext Workers 方針の差分整理（どちらを current contract として正本化するかの判断材料の提示）
- docs-only で閉じられる差分（仕様書側の表記更新のみで解消できるもの）と、workflow 実装変更が必要な差分（yaml 変更・wrangler.toml 変更を伴うもの）の分類
- 派生タスク（implementation）の起票指示と `unassigned-task/` への登録方針の明記

### 含まない

- workflow yaml そのものの実装変更（派生タスク `UT-CICD-DRIFT-IMPL-*` で別途扱う）
- `apps/web/wrangler.toml` の deploy target 切替実装（派生タスクで扱う）
- 新規 workflow の追加（cost guardrail 用 alerting workflow 等は別タスク）
- Cloudflare Pages → Workers 移行の actual cutover 作業
- 05a 観測性タスク群そのものの再設計（本タスクは drift 整理のみ）
- branch protection / CODEOWNERS の方針変更（UT-GOV-001 / UT-GOV-003 で別途扱う）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 05a observability and cost guardrails | 監視対象 workflow を決定済みである前提が drift の起源 |
| 上流 | aiworkflow-requirements skill (`deployment-gha.md` / `deployment-cloudflare.md`) | 正本仕様の現状記述が drift 比較の基準になる |
| 並列 | UT-GOV-001（branch protection） | required_status_checks に登録される workflow 名と整合させる |
| 並列 | UT-GOV-003（CODEOWNERS governance） | `.github/workflows/**` の owner 宣言と整合させる |
| 下流 | UT-CICD-DRIFT-IMPL-*（派生 implementation タスク群） | 本タスクで抽出された差分のうち実装変更が必要なものを引き受ける |
| 下流 | UT-26（staging-deploy-smoke） | 修正後の workflow 名で smoke を回す前提 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/backend-ci.yml | apps/api の CI 実体 |
| 必須 | .github/workflows/ci.yml | monorepo 全体の CI 実体 |
| 必須 | .github/workflows/validate-build.yml | build 検証 workflow 実体 |
| 必須 | .github/workflows/verify-indexes.yml | skill indexes drift 検出 workflow 実体 |
| 必須 | .github/workflows/web-cd.yml | apps/web の CD 実体 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GHA 正本仕様（drift 比較の基準） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare deploy target 正本仕様 |
| 必須 | apps/web/wrangler.toml | deploy target 実体（pages_build_output_dir / main entry） |
| 必須 | apps/api/wrangler.toml | apps/api deploy target 実体 |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md | 05a の監視対象一覧 |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/unassigned-task-detection.md | 本タスクの起票元 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md | 原典 unassigned-task スペック |
| 参考 | https://developers.cloudflare.com/workers/static-assets/ | OpenNext on Workers 方針確認 |
| 参考 | https://developers.cloudflare.com/pages/configuration/build-configuration/ | Pages build budget 確認 |

## 受入条件 (AC)

- AC-1: `.github/workflows/` 配下の全 yaml が棚卸しされ、Node / pnpm / job / trigger / deploy target が表に固定されている
- AC-2: `deployment-gha.md` 記述と current facts の差分マトリクスが作成され、各差分が「docs-only」「impl 必要」のいずれかに分類されている
- AC-3: `deployment-cloudflare.md` の Pages / Workers / OpenNext 方針と `apps/web/wrangler.toml` 実体の照合結果が表に記載されている
- AC-4: 05a の cost guardrail 監視対象がすべて実在する workflow を指していることを確認、または存在しない workflow への参照が「impl 必要」差分として明示されている
- AC-5: Pages build budget 監視前提と OpenNext Workers 方針のどちらを current contract とするかの判断材料（メリデメ・整合性）が Phase 2 で整理されている
- AC-6: docs-only 差分は本タスク内で正本仕様の更新案として記述されている（実体ファイルの編集は Phase 12 で実施）
- AC-7: impl 必要差分はすべて `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の起票方針として Phase 2 で列挙されている
- AC-8: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である
- AC-9: 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）に違反する workflow 構成が存在しないことを確認している
- AC-10: 検証コマンド（`rg -n "node-version|pnpm|web-cd|ci.yml|validate-build|wrangler|pages_build_output_dir" .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails`）の出力に基づく差分根拠が記録されている
- AC-11: GitHub Issue #58 が CLOSED 状態のまま、本タスク仕様書が成果物として参照可能になっている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（差分マトリクス設計） | phase-02.md | spec_created | outputs/phase-02/drift-matrix-design.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック（仕様更新手順） | phase-05.md | spec_created | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md / outputs/phase-09/deploy-contract-integrity.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | spec_created | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md + 6 補助ファイル |
| 13 | PR作成 | phase-13.md | spec_created | outputs/phase-13/local-check-result.md / change-summary.md / pr-info.md / pr-creation-result.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・真の論点・依存境界） |
| 設計 | outputs/phase-02/drift-matrix-design.md | workflow drift 差分マトリクス・分類方針 |
| 設計 | outputs/phase-02/canonical-spec-update-plan.md | 正本仕様（deployment-gha.md / deployment-cloudflare.md）の更新方針 |
| レビュー | outputs/phase-03/main.md | 代替案 3 件以上 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | 仕様整合の検証戦略（rg / yamllint / link check） |
| 実装 | outputs/phase-05/implementation-runbook.md | 仕様書更新手順（docs-only 差分の適用順） |
| 異常系 | outputs/phase-06/failure-cases.md | 差分見落とし / 派生タスク漏れ等のシナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 成果物 のトレース |
| QA | outputs/phase-09/main.md | 監査ログ・最終整合性確認 |
| QA | outputs/phase-09/deploy-contract-integrity.md | Pages vs Workers の判断材料・drift 表 |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定 |
| 証跡 | outputs/phase-11/main.md | docs-only smoke 実行サマリー・既知制限 |
| 証跡 | outputs/phase-11/manual-smoke-log.md | rg 出力 / yamllint 結果ログ |
| 証跡 | outputs/phase-11/link-checklist.md | 参照ドキュメントのリンク死活確認 |
| ガイド | outputs/phase-12/main.md | Phase 12 本体サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け） + Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 派生 implementation タスク列挙（impl 必要差分） |
| ガイド | outputs/phase-12/skill-feedback-report.md | aiworkflow-requirements skill へのフィードバック |
| メタ | artifacts.json | 機械可読サマリー |
| メタ | outputs/artifacts.json | 生成物 ledger（root artifacts.json と同期） |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub Actions | CI / CD workflow 実行基盤 | 無料枠（public repo は無制限） |
| Cloudflare Workers | apps/api / apps/web ランタイム | 無料枠 |
| Cloudflare Pages | （旧）apps/web デプロイ先候補 | 無料枠（builds quota あり） |
| @opennextjs/cloudflare | Next.js → Workers アダプタ | OSS |
| ripgrep (`rg`) | 差分検出 | OSS |
| yamllint / actionlint | workflow yaml 構文検証 | OSS |

## Secrets 一覧（このタスクで導入・参照）

本タスクは docs-only であり新規 Secret は導入しない。既存 Secret の参照状況は差分マトリクスで確認するのみ。

| Secret 名 | 用途 | 参照のみ |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | wrangler deploy 用 | 参照のみ |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account 識別 | 参照のみ |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | workflow から `apps/web` 経由の D1 アクセスを誘発する deploy 構成が存在しないことを確認 |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | CI/CD が GAS prototype を deploy 対象に含めていないことを確認 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-11 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- docs-only 差分は本タスク内で解消、impl 必要差分はすべて派生タスクとして起票指示が記述されている
- Phase 12 の same-wave sync ルール（LOGS.md / SKILL.md / topic-map）が破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦想定 / 知見

**1. docs-only と impl 必要の境界判断**
仕様書の表記揺れにすぎないものと、workflow yaml の構造変更が必要なものの境界が曖昧になりがち。Phase 2 で「正本仕様の表記が誤っている = docs-only」「workflow 実体が要件を満たしていない = impl 必要」の判別フローを固定する。

**2. Pages vs Workers 方針の混在**
`apps/web/wrangler.toml` に `pages_build_output_dir` 表記と OpenNext Workers main entry が混在する可能性がある。本タスクではどちらを current contract とするかの判断材料を提示するに留め、actual cutover は派生タスクで実施する。

**3. 05a 監視対象の整合**
05a が監視対象として記載した workflow 名が `web-cd.yml` 等の旧名であった場合、現実体（`ci.yml` / `validate-build.yml` 等）にマッピングし直す必要がある。マッピング表を Phase 2 で作成。

**4. CLOSED Issue への仕様書紐付け**
GitHub Issue #58 は CLOSED だが、ユーザー指示によりクローズドのまま仕様書を作成する。`gh issue` での再オープンは行わず、仕様書側に Issue 番号のみ記録する。

**5. required_status_checks との整合**
UT-GOV-001 で branch protection に登録される workflow 名と、本タスクで整理した workflow 名が乖離するとマージブロックの誤作動が起きる。Phase 2 で並列タスク UT-GOV-001 との interface を確認する。

## 関連リンク

- 上位 README: ../README.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/58 (CLOSED)
- 原典 unassigned-task: ../ut-cicd-workflow-topology-drift-001.md
- 起票元: ../../05a-parallel-observability-and-cost-guardrails/outputs/phase-12/unassigned-task-detection.md
