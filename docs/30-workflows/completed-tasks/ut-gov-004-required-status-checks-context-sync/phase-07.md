# Phase 7: AC マトリクス / カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 (UT-GOV-004) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / カバレッジ確認 |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（traceability / governance） |

## 目的

原典 §2.2 で定義された AC-1〜AC-7（合計 7 件）を、以下 2 軸で完全トレースする。

- **検証手段軸**: `gh api` 実測 / GitHub Actions UI 目視 / 文書 review
- **実装成果物軸 (Phase 5)**: `workflow-job-inventory.md` / `required-contexts-final.md` / `lefthook-ci-mapping.md` / `staged-rollout-plan.md` / `strict-mode-decision.md`

7 行 × 4 列のマトリクスを完成し、空セルゼロを完了条件とする。さらに Phase 6 の failure case を「関連 failure case」列で結線する。

## 実行タスク

1. AC-1〜AC-7 × 4 列（AC 内容 / 検証手段 / 実装成果物 (Phase 5) / 関連 failure case (Phase 6)）の 7 行マトリクスを完成する（完了条件: 空セル無し）。
2. 草案 8 contexts (typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate) が AC-1〜AC-4 の各セルで個別引用される（完了条件: 8 contexts 全てが少なくとも 1 行でフルパス・分類付き引用）。
3. 「カバレッジ」をコード coverage ではなく **AC × 成果物 のトレース被覆率 100%** と定義し、空セル検出ロジックを文書化する（完了条件: 空セルゼロを完了判定とする旨の明記）。
4. UT-GOV-001 への引き渡し方法（確定 context 名リストの再利用契約）を定義する（完了条件: UT-GOV-001 が直接参照する Phase 5 成果物パスが明示）。
5. Phase 9 (品質保証) への引き継ぎ項目を予約する（完了条件: 確定 context リストの sanity 再検証を Phase 9 で実施することを予約）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | AC-1〜AC-7 原典 §2.2 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-04.md | 検証 3 種 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-05.md | 5 成果物 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-06.md | 8 件 failure case |
| 参考 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 確定リストの consumer |

## AC マトリクス (7 行 × 4 列)

| AC# | AC 内容 (原典 §2.2) | 検証手段 (gh api / Actions UI / 文書 review) | 実装成果物 (Phase 5) | 関連 failure case (Phase 6) |
| --- | --- | --- | --- | --- |
| AC-1 | `.github/workflows/` 配下の全 workflow を grep し、実在の workflow `name:` / job `name:` を一覧化した表が成果物に含まれる | 文書 review (`workflow-job-inventory.md` の 5 workflow / 7 job 行を Phase 5 抽出スクリプト dry-run 出力と diff) | `outputs/phase-05/workflow-job-inventory.md` | #2 (matrix 展開ずれ), #3 (同名 job 衝突) |
| AC-2 | 草案 8 contexts (**typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate**) の各々について、対応する実在 context 名 (`<workflow> / <job>` 形式 or matrix 展開時 `<workflow> / <job> (<matrix-value>)`) が確定している | gh api (`commits/.../check-runs` の `name` フィールドと突合) + 文書 review (フルパス記載確認) | `outputs/phase-05/required-contexts-final.md` (8 contexts 全てを phase-1 / phase-2 / 除外 のいずれかに分類) | #3 (同名 job 衝突), #8 (check-run 名と context 名の混同) |
| AC-3 | 各 context が GitHub 上で **過去 30 日以内に少なくとも 1 回成功実績がある** ことが確認済み (`gh api` または Actions UI で検証) | gh api (`actions/runs?status=success&created=>=<30 日前>` + `check-runs.conclusion=success` の AND) / Actions UI 目視 | `outputs/phase-05/required-contexts-final.md` の phase-1 セクション (3 条件 AND を満たすもののみ) | #1 (永続 merge 不能), #7 (rate limit) |
| AC-4 | 未出現 context (整備対象: integration-test / security-scan / docs-link-check / phase-spec-validate 等) は branch protection 草案から除外され、「段階適用案」セクションに後追い投入条件が記載される | 文書 review (phase-2 セクションの後追い投入条件 3 条件記載) | `outputs/phase-05/staged-rollout-plan.md` および `outputs/phase-05/required-contexts-final.md` の phase-2 区分 | #1 (永続 merge 不能), #4 (refactor ドリフト) |
| AC-5 | lefthook hook 名 (pre-commit / pre-push 等) と CI job 名の対応表が `task-git-hooks-lefthook-and-post-merge` 仕様と整合する形で作成される | 文書 review + grep (`rg -n 'pnpm (typecheck\|lint\|test\|build)' lefthook.yml .github/workflows/`) で同名 script ペア確認 | `outputs/phase-05/lefthook-ci-mapping.md` | #6 (lefthook ↔ CI ドリフト) |
| AC-6 | UT-GOV-001 の `required_status_checks.contexts` に投入する確定リストが、本タスクの成果物として参照可能になる | 文書 review (UT-GOV-001 仕様書から `outputs/phase-05/required-contexts-final.md` を直接参照可能なパスで配置) | `outputs/phase-05/required-contexts-final.md` (phase-1 セクションを `<workflow> / <job>` フルパスでコピペ可能な箇条書きで記述) | #1, #3, #4, #8 (UT-GOV-001 適用時の全リスク) |
| AC-7 | `strict: true` (up-to-date 必須) の採否方針が決定され、根拠がドキュメント化される | 文書 review (dev / main 別の採否表 + トレードオフ記録 3 行以上) | `outputs/phase-05/strict-mode-decision.md` (dev=false / main=true 採用案、根拠と将来チーム化時の再評価条件記載) | #5 (strict 起因 merge 摩擦爆発) |

> 全 7 行 × 4 列に空セル無し。草案 8 contexts は AC-2 / AC-3 / AC-4 で全件引用される。

## 草案 8 contexts × AC トレース（補助表）

| 草案 context | AC-2 分類 (Phase 5 確定) | AC-3 (30 日 success) | AC-4 (除外時の後追い条件) |
| --- | --- | --- | --- |
| typecheck | phase-1: `ci` aggregate job に内包 | gh api 実測予約 | (phase-1 投入のため N/A) |
| lint | phase-1: `ci` aggregate job に内包 | gh api 実測予約 | (phase-1 投入のため N/A) |
| unit-test | exclude（独立 workflow/job なし） | 未存在のため対象外 | UT-GOV-005 で workflow 新設 → 30 日 success 後に投入 |
| integration-test | phase-2 リレー (UT-GOV-005) | 未存在のため対象外 | UT-GOV-005 で workflow 新設 → 30 日 success 後に投入 |
| build | phase-1: `Validate Build` | gh api 実測予約 | (phase-1 投入のため N/A) |
| security-scan | phase-2 リレー (UT-GOV-005) | 未存在のため対象外 | UT-GOV-005 で workflow 新設 → 30 日 success 後に投入 |
| docs-link-check | phase-2 リレー (UT-GOV-005) | 未存在のため対象外 | UT-GOV-005 で workflow 新設 → 30 日 success 後に投入 |
| phase-spec-validate | phase-1: `verify-indexes-up-to-date` へ rename | gh api 実測予約 | Phase validator ではなく index drift gate として投入 |

## 「カバレッジ」定義（本タスク特性）

- 本タスクはコード実装を含まないため、Vitest 等の line / branch coverage は適用外。
- 代わりに **AC トレース被覆率 = (空セルでないセル数) / (AC 数 × 列数) × 100** を採用。
- 完了条件: トレース被覆率 = 100% (7 × 4 = 28 セル全て埋まる)。
- 検出ロジック: `outputs/phase-07/ac-matrix.md` の Markdown 表を機械パースし、空セル (連続パイプ `||`) が無いことを確認:

```bash
# 空セル検出 (擬似)
awk '/^\| AC-/{ if (/\|\s*\|\s*\|/ || /\|\s*\|$/) print "EMPTY: "$0 }' \
  outputs/phase-07/ac-matrix.md
# 出力 0 行で完了
```

## UT-GOV-001 への引き渡し契約

UT-GOV-001 は本タスクの以下 1 点のみを「直接入力」とする:

- **Path**: `docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/required-contexts-final.md`
- **Section**: `## phase-1 投入対象`
- **形式**: `<workflow> / <job>` フルパスの箇条書き

UT-GOV-001 の `gh api -X PUT repos/:owner/:repo/branches/main/protection` payload `required_status_checks.contexts` 配列にそのまま流し込めることが完了条件。

## 実行手順

1. 7 × 4 マトリクスを `outputs/phase-07/ac-matrix.md` に転記
2. 草案 8 contexts × AC 補助表を同ファイルに追記
3. 空セル検出 awk を Phase 9 の sanity step に予約
4. UT-GOV-001 への引き渡しパスを別セクションで明記
5. Phase 9 への引き継ぎ項目を箇条書き

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化で AC マトリクスの行が崩れないことを確認 |
| Phase 9 | トレース被覆率 100% の sanity 自動化 + 確定 context リストの再 `gh api` 検証 |
| Phase 10 | go-no-go の根拠として AC マトリクス空セル無しを参照 |
| Phase 11 | AC-3 (30 日 success) の最新化を staging で再確認 |

## 多角的チェック観点

- 価値性: AC-1〜AC-7 が抜け漏れ無く検証 → 成果物 → failure case にトレースされているか。
- 実現性: phase-1 投入リストが UT-GOV-001 で 1 回の `gh api` 呼び出しに乗るか (contexts 配列長が現実的)。
- 整合性: 草案 8 contexts 全てが AC-2 / AC-3 / AC-4 の補助表に登場するか。
- 運用性: 空セル検出 awk が CI 化可能な形式で記述されているか。
- 認可境界: UT-GOV-001 が必要とする branch protection write 権限と、本タスクの read-only 権限が分離記載されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 7 × 4 | spec_created |
| 2 | 草案 8 contexts × AC 補助表 | spec_created |
| 3 | カバレッジ定義 + 空セル検出 awk | spec_created |
| 4 | UT-GOV-001 引き渡し契約 | spec_created |
| 5 | Phase 9 引き継ぎ予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 成果物 × failure case トレース表 + 8 contexts 補助表 + UT-GOV-001 引き渡し契約 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 7 行 × 4 列に空セル無し
- [ ] 草案 8 contexts 全てが補助表に登場
- [ ] トレース被覆率 100% の検出 awk が記述
- [ ] UT-GOV-001 への引き渡しパス + section + 形式が明記
- [ ] Phase 9 への引き継ぎが箇条書きで予約

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置予約
- AC-1〜AC-7 の 7 行が全て埋まる
- 関連 failure case 列が Phase 6 の case # を 1 つ以上参照（AC-6 は複数参照可）
- 草案 8 contexts (typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate) 全件が補助表に登場

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - トレース被覆率 100% 検出 awk → Phase 9 の sanity step に投入
  - UT-GOV-001 引き渡し契約 → タスク完了 = UT-GOV-001 着手可能の関係を確定
  - 8 contexts 補助表 → Phase 12 unassigned で UT-GOV-005 リレー対象 (integration-test / security-scan / docs-link-check / phase-spec-validate) を確定
- ブロック条件:
  - AC マトリクス空セル残存
  - 草案 8 contexts のいずれかが補助表で未分類のまま
  - UT-GOV-001 引き渡しパスが Phase 5 成果物と乖離
