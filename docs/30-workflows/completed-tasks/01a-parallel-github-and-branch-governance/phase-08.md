# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-23 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |
| タスク種別 | docs-only |

## 目的

Phase 5 で適用した GitHub 設定（branch protection / environments / PR template / CODEOWNERS）の重複・冗長を特定し、設定値の single source of truth を確立する。docs-only タスクのため、GitHub UI 設定の実操作は行わず、設計書・runbook 間の整合性確認と DRY 化レポートの作成が主な作業。

## 実行タスク

### ステップ 1: 上流成果物と正本仕様の読み込み

- `doc/01a-parallel-github-and-branch-governance/phase-07.md` の AC マトリクスを読む
- `outputs/phase-02/github-governance-map.md`（正本設計）を読む
- `outputs/phase-05/repository-settings-runbook.md`（適用 runbook）を読む
- `outputs/phase-05/pull-request-template.md`（PR テンプレ案）を読む
- `.claude/skills/task-specification-creator/SKILL.md` の 4 条件テキストを確認する

### ステップ 2: 設定値の重複チェック

以下の観点で `github-governance-map.md` と `repository-settings-runbook.md` の記述を突き合わせる。

#### 2-1: Branch Protection 設定値の分散チェック

| チェック項目 | 正本（phase-02） | runbook（phase-05） | 判定 |
| --- | --- | --- | --- |
| main reviewer 数 | 2 名 | runbook 記載値 | 一致確認 |
| dev reviewer 数 | 1 名 | runbook 記載値 | 一致確認 |
| main force push | OFF | runbook 記載値 | 一致確認 |
| dev force push | OFF | runbook 記載値 | 一致確認 |
| main status checks | `ci`, `Validate Build` | runbook 記載値 | 一致確認 |
| dev status checks | `ci`, `Validate Build` | runbook 記載値 | 一致確認 |
| main up-to-date | ON | runbook 記載値 | 一致確認 |

#### 2-2: GitHub Environments 設定値の分散チェック

| チェック項目 | 正本（phase-02） | runbook（phase-05） | 判定 |
| --- | --- | --- | --- |
| production branch 制限 | `main` のみ | runbook 記載値 | 一致確認 |
| staging branch 制限 | `dev` のみ | runbook 記載値 | 一致確認 |
| production reviewer | 2 名 | runbook 記載値 | 一致確認 |
| staging reviewer | 0 名（自動） | runbook 記載値 | 一致確認 |

#### 2-3: PR template の 4 条件テキスト整合チェック

| チェック項目 | SKILL.md 定義 | pull-request-template.md 記載 | 判定 |
| --- | --- | --- | --- |
| 価値性の文言 | 誰のどのコストを下げるか | テンプレート記載値 | 一致確認 |
| 実現性の文言 | 初回スコープで成立する | テンプレート記載値 | 一致確認 |
| 整合性の文言 | branch/env/runtime/data/secret が矛盾しない | テンプレート記載値 | 一致確認 |
| 運用性の文言 | rollback・handoff が破綻しない | テンプレート記載値 | 一致確認 |

#### 2-4: CODEOWNERS と reviewer 要件の矛盾チェック

| チェック項目 | CODEOWNERS 定義 | branch protection reviewer 要件 | 判定 |
| --- | --- | --- | --- |
| main reviewer | `@daishiman` | 2 名以上 | 矛盾チェック |
| dev reviewer | `@daishiman` | 1 名以上 | 矛盾チェック |
| `.github/` パス | `@daishiman` | AC-4 task 責務と衝突なし | 矛盾チェック |

### ステップ 3: Single Source of Truth の確立

以下を DRY 化の原則として記録する。

**正本ファイルの優先順位:**

1. `outputs/phase-02/github-governance-map.md` — 設定値の **正本**（最上位）
2. `outputs/phase-05/repository-settings-runbook.md` — 適用手順書（正本から派生）
3. `outputs/phase-05/pull-request-template.md` — PR テンプレート（正本から派生）
4. `phase-*.md` 各仕様書 — 設計根拠の記録（正本を参照）

**設定変更時の更新フロー:**

```
1. github-governance-map.md を更新する（正本）
2. repository-settings-runbook.md を正本に追従して更新する
3. 影響する phase-*.md の設定値表を正本に追従して更新する
4. GitHub UI で実設定を変更する（docs-only 以外の場合）
5. artifacts.json の phase 状態を更新する
```

### ステップ 4: DRY 化レポートの作成

`outputs/phase-08/main.md` に以下の内容を記録する。

- 重複・冗長と判定した箇所の一覧
- 矛盾が確認された箇所とその解消方針
- single source of truth の確定宣言
- 設定変更フロー（ステップ 3 参照）
- Phase 9 への引き継ぎ事項

### ステップ 5: 4 条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する
- Phase 9 に渡す blocker と open question を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-02/github-governance-map.md` | 設定値の正本（branch protection / env / PR template / CODEOWNERS） |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md` | GitHub 設定適用 runbook（DRY 化チェック対象） |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-05/pull-request-template.md` | PR テンプレート（4 条件テキスト確認対象） |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | 4 条件の定義テキスト（整合確認の基準） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping（最上位根拠） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート（status checks 名称の確認） |
| 参照 | `doc/01a-parallel-github-and-branch-governance/phase-07.md` | AC マトリクス（DRY 化対象の洗い出し起点） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC マトリクスを DRY 化チェックの起点として使用 |
| Phase 9 | 本 Phase の DRY 化レポートを品質保証チェックリストの入力として使用 |
| Phase 10 | 矛盾解消済みの設定値を gate 判定の根拠として使用 |
| Phase 12 | close-out と spec sync 判断の基礎資料として使用 |

## 多角的チェック観点

- **価値性**: 設定値の重複・矛盾を排除することで、将来の設定変更コスト（確認工数）を削減できるか明確か
- **実現性**: docs-only スコープで完結するか。GitHub UI 操作を伴わず、ドキュメント上の DRY 化で十分か
- **整合性**: branch protection / environment / PR template / CODEOWNERS の 4 要素すべてに single source of truth が確立されているか
- **運用性**: 設定変更が発生した際、どのファイルを先に更新すべきかの手順が明確か。handoff が Phase 9 へ適切に渡されるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流成果物と正本仕様の読み込み | 8 | pending | phase-07 / phase-02 / phase-05 の outputs |
| 2 | Branch protection 設定値の重複チェック | 8 | pending | governance-map ↔ runbook 突き合わせ |
| 3 | Environments 設定値の重複チェック | 8 | pending | governance-map ↔ runbook 突き合わせ |
| 4 | PR template 4 条件テキスト整合チェック | 8 | pending | SKILL.md ↔ pull-request-template.md |
| 5 | CODEOWNERS と reviewer 要件の矛盾チェック | 8 | pending | CODEOWNERS ↔ branch protection reviewer |
| 6 | Single source of truth の確立と記録 | 8 | pending | 正本ファイル優先順位と更新フロー |
| 7 | DRY 化レポートの作成 | 8 | pending | `outputs/phase-08/main.md` |
| 8 | 4 条件と Phase 9 への handoff 確認 | 8 | pending | blocker と open question を記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `doc/01a-parallel-github-and-branch-governance/outputs/phase-08/main.md` | DRY 化レポート（重複チェック結果・single source of truth 宣言・更新フロー） |
| メタ | `doc/01a-parallel-github-and-branch-governance/artifacts.json` | Phase 8 状態を completed に更新 |

## 完了条件

- [ ] `outputs/phase-08/main.md` が作成済み
- [ ] branch protection 設定値の重複チェックが完了し、矛盾なし（または解消済み）
- [ ] environment 設定値の重複チェックが完了し、矛盾なし（または解消済み）
- [ ] PR template の 4 条件テキストが SKILL.md 定義と一致している（または差分が記録済み）
- [ ] CODEOWNERS と reviewer 要件の矛盾チェックが完了
- [ ] `github-governance-map.md` が設定値の正本として確立されている
- [ ] 設定変更時の更新フローが記録されている
- [ ] downstream handoff（Phase 9 への引き継ぎ事項）が明記されている

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（ステップ 1〜5）が completed
- [ ] 全成果物が指定パスに配置済み（`outputs/phase-08/main.md`）
- [ ] 全完了条件にチェック済み
- [ ] 異常系（設定値不一致・runbook と正本の矛盾・secrets 実値の混入）も検証済み
- [ ] 次 Phase（Phase 9）への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase-08 を completed に更新済み

## 次Phase

- 次: 9 (品質保証)
- 引き継ぎ事項:
  - `outputs/phase-08/main.md`（DRY 化レポート）を品質保証チェックリストの入力として渡す
  - 解消されなかった矛盾があれば blocker として明記する
  - `github-governance-map.md` が正本であることを Phase 9 に引き継ぐ
- ブロック条件: `outputs/phase-08/main.md` が未作成なら Phase 9 に進まない

## 4 条件評価テーブル

| 条件 | 評価観点 | 判定基準 | 判定 |
| --- | --- | --- | --- |
| 価値性 | 設定値の重複・矛盾を排除し、将来の設定変更コストを削減できるか | DRY 化レポートに削減効果が明記されている | TBD |
| 実現性 | docs-only スコープで完結し、GitHub UI 操作なしで達成できるか | ドキュメント上の整合性確認のみで完了できる | TBD |
| 整合性 | 4 要素（branch protection / env / PR template / CODEOWNERS）すべてに single source of truth が確立されているか | `github-governance-map.md` を正本として全要素が一致している | TBD |
| 運用性 | 設定変更時の更新フローが明確で、担当者が迷わず実行できるか | 更新フロー手順が `outputs/phase-08/main.md` に記録されている | TBD |

## Before / After 比較

| 対象 | Before（DRY 化前） | After（DRY 化後） | 理由 |
| --- | --- | --- | --- |
| 設定値の置き場 | governance-map / runbook / phase 仕様書に分散 | `github-governance-map.md` を正本として一元化 | single source of truth の確立 |
| 変更フロー | 変更時にどのファイルを先に更新すべきか不明確 | 正本 → runbook → phase 仕様書 の順序を明文化 | 変更漏れ・矛盾の防止 |
| 4 条件テキスト | SKILL.md の定義と PR テンプレートで表現が乖離するリスク | SKILL.md 定義に一致していることを確認・記録 | AC-3 の品質保証 |

## 共通化パターン

- branch / env / reviewer 数の設定値は `github-governance-map.md` のみを参照し、他のファイルは参照リンクで代替する
- 設定変更時は「正本更新 → 派生ドキュメント追従 → 実設定変更」の順を守る
- 4 条件テキストは SKILL.md の定義を正本とし、テンプレートや仕様書はコピーではなく参照で管理する

## 削除対象一覧

- `github-governance-map.md` の内容を重複して `repository-settings-runbook.md` に記述している部分（参照リンクに置き換え）
- 実値前提の secret 記述（プレースホルダーのみとする）
- scope 外サービス（Cloudflare deploy 等）の先行設定記述
