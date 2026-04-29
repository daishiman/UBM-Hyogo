# ut-gov-004-required-status-checks-context-sync - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-GOV-004 |
| タスク名 | branch protection 草案の required_status_checks contexts (8件) を現行 GitHub Actions 実在 job 名と同期する |
| ディレクトリ | docs/30-workflows/ut-gov-004-required-status-checks-context-sync |
| Wave | governance / pre UT-GOV-001 |
| 実行種別 | serial（UT-GOV-001 の前提条件として直列実行） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | governance / docs-only / NON_VISUAL（実コード実装なし、調査+設計+ドキュメント化が中心） |
| 既存タスク組み込み | task-github-governance-branch-protection（outputs/phase-2/design.md §2.b および outputs/phase-12/implementation-guide.md §1, §5(H-1) を参照する） |
| 組み込み先 | UT-GOV-001 が確定 context リストを唯一の入力として apply する |
| GitHub Issue | #147 (CLOSED) |

> 備考: GitHub Issue #147 は既に CLOSED 状態だが、原典タスク仕様 (`docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md`) を入力に Phase 仕様書を新規作成する。Issue が CLOSED でも、本仕様書は UT-GOV-001 を安全に実行するための前提整備という形で独立して有効。

## 目的

branch protection 草案の `required_status_checks.contexts` 8 件（typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate）を、現行 `.github/workflows/` 配下に存在する実在の workflow `name:` / job `name:` と同期させ、かつ「過去 30 日以内に GitHub 上で 1 回以上成功実績がある」ことを検証した確定リストとして UT-GOV-001 に渡す。あわせて lefthook hook 名と CI job 名の対応表を整備し、ローカル PASS と CI PASS のドリフトを防ぐ。

## スコープ

### 含む

- `.github/workflows/*.yml` の workflow `name:` / job `name:` / matrix 展開後の最終 context 名の抽出
- 草案 8 contexts と実在 context 名の名寄せマッピング（`<workflow name> / <job name>` フルパス形式）
- GitHub 上の成功実績確認（`gh api repos/:owner/:repo/commits/:sha/check-runs` 等で過去 30 日以内に 1 回以上 conclusion=success）
- 段階適用案の設計（フェーズ 1: 実績ある context のみ先行投入 / フェーズ 2: 新規 context の後追い投入条件）
- lefthook hook ↔ CI job 対応表の作成（同一 `pnpm` script を双方が呼び出す前提整理）
- `strict: true`（up-to-date 必須）の採否方針決定（dev / main で差分採用も含む）
- 確定 context リストの UT-GOV-001 への引き渡し成果物化

### 含まない

- branch protection の実適用（UT-GOV-001 の責務）
- lefthook 自体の導入・hook 実装（`task-git-hooks-lefthook-and-post-merge` の責務）
- 新規 CI job / workflow の追加実装（UT-GOV-005 / UT-GOV-006 等の責務）
- アプリケーション層（`apps/api` / `apps/web`）の改修
- D1 / Cloudflare Workers の設定変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | なし | 本タスクは UT-GOV-001 の前提として独立着手可能 |
| 下流（強） | UT-GOV-001（branch protection apply） | 本タスクの確定 context リストを唯一の入力として apply する。本タスク未完では UT-GOV-001 着手禁止 |
| 関連 | task-git-hooks-lefthook-and-post-merge | hook 名 ↔ CI job 名の対応表で双方向の整合を取る |
| 関連 | UT-GOV-005（docs-only / non-visual / template / skill sync 系 CI 追加） | 新設 context のリレー先 |
| 関連 | UT-GOV-006（web deploy target canonical sync） | deploy 系 context の整合 |
| 関連 | UT-GOV-007（GitHub Actions action ピン留めポリシー） | workflow 修正時の規約整合 |
| 既存組み込み | task-github-governance-branch-protection | outputs/phase-2/design.md §2.b の草案 8 contexts を本タスクで上書き確定する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典タスク仕様（苦戦箇所・AC 草案の写経元） |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 後続タスクの入力契約確認 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | §2.b required_status_checks 草案 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md | §1 target contexts / §5 H-1 context drift hazard |
| 必須 | .github/workflows/ 配下全ファイル | 実在 workflow / job 名抽出元 |
| 参考 | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | Require status checks before merging |
| 参考 | https://docs.github.com/en/rest/checks/runs | check-runs API（実績確認用） |
| 参考 | https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs | matrix 展開後の context 名生成規則 |

## 受入条件 (AC)

> AC-1〜AC-7 は原典 §2.2 の受入条件。AC-8〜AC-10 は本仕様書で追加した governance 安全条件（同名 job、context 名変更、4条件最終判定）。

- AC-1: `.github/workflows/` 配下の全 workflow を走査し、実在の workflow `name:` / job `name:` / matrix 展開後の最終 context 名を一覧化した表が成果物に含まれる
- AC-2: 草案 8 contexts それぞれについて、対応する実在 context 名（`<workflow name> / <job name>` 形式、matrix の場合は `<workflow> / <job> (<matrix-value>)`）が確定している、または「実在しないため除外」と明記されている
- AC-3: 確定 context が GitHub 上で過去 30 日以内に少なくとも 1 回 `conclusion=success` の check-run として記録されていることを `gh api` 等で確認した証跡がある
- AC-4: 未出現 context は branch protection 投入対象から除外され、後追い投入条件（CI 1 回成功確認後など）が「段階適用案」セクションに記載されている
- AC-5: lefthook hook 名（pre-commit / pre-push 等）と CI job 名の対応表が `task-git-hooks-lefthook-and-post-merge` と整合する形で作成されている
- AC-6: UT-GOV-001 の `required_status_checks.contexts` に投入する確定リストが、本タスクの成果物として参照可能なファイルパスで明記されている
- AC-7: `strict: true`（up-to-date 必須）の採否方針が dev / main 別に決定され、根拠（merge 摩擦 vs 壊れリスク）がドキュメント化されている
- AC-8: 同名 job が複数 workflow に存在する場合のフルパス記載規約（`<workflow> / <job>`）が遵守されている
- AC-9: context 名変更を伴う refactor の運用ルール（branch protection 更新と同一 PR、または新旧並列 → 旧外し）が文書化されている
- AC-10: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS であり、MAJOR ゼロ

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/context-name-mapping.md, staged-rollout-plan.md, lefthook-ci-correspondence.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-05/implementation-runbook.md, workflow-job-inventory.md, required-contexts-final.md, lefthook-ci-mapping.md, staged-rollout-plan.md, strict-mode-decision.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス / カバレッジ確認 | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 / リファクタリング | phase-08.md | spec_created | outputs/phase-08/main.md, confirmed-contexts.yml, lefthook-ci-mapping.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md, strict-decision.md |
| 10 | 最終レビュー / GO-NO-GO | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | spec_created | outputs/phase-11/main.md, manual-smoke-log.md, link-checklist.md |
| 12 | ドキュメント更新（close-out） | phase-12.md | spec_created | outputs/phase-12/implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md |
| 13 | PR 作成 | phase-13.md | spec_created | outputs/phase-13/main.md |

> 備考: 本仕様書は Phase 1〜13 の全仕様を作成済み。Phase 13 の commit / push / PR 作成は user の明示承認後のみ実行する。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・真の論点・依存境界・AC ロック） |
| 設計 | outputs/phase-02/context-name-mapping.md | 草案 8 contexts ↔ 実在 context 名のマッピング |
| 設計 | outputs/phase-02/staged-rollout-plan.md | 段階適用案（フェーズ 1 既出 only / フェーズ 2 新規投入条件） |
| 設計 | outputs/phase-02/lefthook-ci-correspondence.md | lefthook hook ↔ CI job 対応表・`strict` 採否決定 |
| レビュー | outputs/phase-03/main.md | 代替案 4 案以上 + PASS/MINOR/MAJOR 判定・base case 確定 |
| テスト戦略 | outputs/phase-04/test-strategy.md | 8 × 3 マトリクス・gh api テンプレ・dry-run 期待出力 |
| 実装ランブック | outputs/phase-05/implementation-runbook.md | 実装手順と5成果物テンプレへの導線 |
| 確定入力 | outputs/phase-08/confirmed-contexts.yml | UT-GOV-001 が直接消費する唯一の機械可読 context 入力 |
| QA | outputs/phase-09/main.md / outputs/phase-09/strict-decision.md | governance QA と strict 採否 |
| 最終判定 | outputs/phase-10/go-no-go.md | GO/NO-GO 判定 |
| 手動確認 | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md | NON_VISUAL evidence |
| close-out | outputs/phase-12/*.md | Phase 12 必須 6 成果物 |
| PR準備 | outputs/phase-13/main.md | 承認ゲート / local-check / change-summary / PR テンプレ |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-01.md / phase-02.md / phase-03.md | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub Actions | 実在 workflow / job 名の供給元 | 無料枠（public repo は無制限） |
| GitHub REST API（`gh api`） | check-runs 実績確認 | 無料 |
| lefthook | ローカル hook（CI job との対応表対象） | OSS / 無料 |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| - | branch protection 永続停止リスクの回避（本タスク固有の運用不変条件） | 投入前に必ず check-run 実績確認・同名フルパス記載・refactor 時の同一 PR 原則を運用ルール化する |

> 注: 本タスクは GitHub governance 層に閉じており、CLAUDE.md §「重要な不変条件」#1〜#7（フォーム schema・consent キー・admin-managed data 分離・apps/api 直接アクセス境界・GAS prototype・Form 再回答経路）には影響を与えない。よってアプリ層の不変条件は touched に列挙しない。

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-10 が Phase 1〜13 で定義済み（Phase 1 で AC ロック、Phase 7/10 は原典 AC-1〜AC-7 を詳細トレース、AC-8〜AC-10 は Phase 8〜12 の governance 安全条件として検証、Phase 13 で承認ゲート）
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS、MAJOR ゼロ
- 確定 context リストが UT-GOV-001 から参照可能なパスで明示されている

## 苦戦箇所・知見（原典より）

**1. 存在しない context 名による merge 完全停止**
草案 8 contexts のうち実在しない名前を投入すると、その branch への全 PR が `Expected — Waiting for status to be reported` で永遠に止まり、admin override か protection 修正でしか解除できない。投入前の check-run 実績確認が必須。

**2. context 名生成規則の混乱**
workflow `name:` と job `name:` のどちらが context 名になるかは GitHub 内部規則に依存。一般則は `<workflow name> / <job name>`、matrix 時は `<workflow> / <job> (<matrix-values>)`。`name:` 省略時は YAML キー名が使われるため、後付け `name:` 追加で過去実績が無効化される。

**3. 同名 job が複数 workflow に存在するケース**
`lint` という job 名が `ci.yml` と `pr-check.yml` 両方にあれば context は別物（`ci / lint` と `pr-check / lint`）。確定リストは必ずフルパスで記載する。

**4. `strict: true` のトレードオフ**
有効化すると base 最新取り込み必須となり merge 摩擦が増える。dev は `false`、main は `true` のような段階適用も検討対象。

**5. lefthook と CI のドリフト**
別実装になるとローカル PASS → CI FAIL の摩擦が常態化。同一 `pnpm` script（`pnpm typecheck` / `pnpm lint` 等）を双方から呼ぶ規約で対応。

**6. 段階適用時の名前変更事故**
フェーズ 1 投入後の workflow refactor で名前が変わると即座に merge 不能。context 名変更を伴う refactor は branch protection 設定更新と同一 PR で行うこと、または事前に新旧両方を contexts に並べ旧側で 1 回 PASS してから旧を外す運用を文書化する。

## 関連リンク

- 上位 README: ../README.md
- 原典タスク仕様: ../completed-tasks/UT-GOV-004-required-status-checks-context-sync.md
- 後続タスク仕様: ../completed-tasks/UT-GOV-001-github-branch-protection-apply.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/147 (CLOSED)
