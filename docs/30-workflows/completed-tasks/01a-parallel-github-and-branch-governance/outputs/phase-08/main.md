# Phase 8: 設定 DRY 化レポート

## 実施日

2026-04-23

## 目的

Phase 5 で作成した設計書・runbook 間の重複・冗長を特定し、設定値の single source of truth を確立する。

## 2-1: Branch Protection 設定値の分散チェック

| チェック項目 | 正本（phase-02/github-governance-map.md） | runbook（phase-05/repository-settings-runbook.md） | 判定 |
| --- | --- | --- | --- |
| main reviewer 数 | 2 名 | 2 名 | **一致** |
| dev reviewer 数 | 1 名 | 1 名 | **一致** |
| main force push | OFF | OFF | **一致** |
| dev force push | OFF | OFF | **一致** |
| main status checks | `ci`, `Validate Build` | `ci`, `Validate Build` | **一致** |
| dev status checks | `ci`, `Validate Build` | `ci`, `Validate Build` | **一致** |
| main up-to-date | ON | ON | **一致** |

**矛盾: なし**

## 2-2: GitHub Environments 設定値の分散チェック

| チェック項目 | 正本（phase-02/github-governance-map.md） | runbook（phase-05/repository-settings-runbook.md） | 判定 |
| --- | --- | --- | --- |
| production branch 制限 | `main` のみ | `main` のみ | **一致** |
| staging branch 制限 | `dev` のみ | `dev` のみ | **一致** |
| production reviewer | 2 名 | 2 名 | **一致** |
| staging reviewer | 0 名（自動） | 0 名（自動） | **一致** |

**矛盾: なし**

## 2-3: PR template の 4条件テキスト整合チェック

| チェック項目 | SKILL.md 定義 | pull-request-template.md 記載 | 判定 |
| --- | --- | --- | --- |
| 価値性の文言 | 誰のどのコストを下げるか | 「誰のどのコストを下げるか・どの課題を解決するかが定義されている」 | **一致（拡張あり）** |
| 実現性の文言 | 初回スコープで成立する | 「初回スコープ（無料枠・既存技術スタック）で成立する」 | **一致（具体化あり）** |
| 整合性の文言 | branch/env/runtime/data/secret が矛盾しない | 「branch / env / runtime / data / secret の設定が正本仕様と矛盾しない」 | **一致** |
| 運用性の文言 | rollback・handoff が破綻しない | 「rollback・handoff・same-wave sync が破綻しない」 | **一致（拡張あり）** |

**矛盾: なし。拡張部分は SKILL.md の定義を補足するものであり、整合している。**

## 2-4: CODEOWNERS と reviewer 要件の矛盾チェック

| チェック項目 | CODEOWNERS 定義 | branch protection reviewer 要件 | 判定 |
| --- | --- | --- | --- |
| main reviewer | `@daishiman`（グローバルフォールバック） | 2 名以上 | 要注意（1名プロジェクトで2名要件） |
| dev reviewer | `@daishiman` | 1 名以上 | **一致** |
| `.github/` パス | `@daishiman` | AC-4 task 責務と衝突なし | **一致** |

**注意事項:** main の branch protection で 2名のレビュアーを要件としているが、CODEOWNERS に定義されているのは `@daishiman` のみ（1名プロジェクト）。実運用では同一人物が2回 approve することはできないため、緊急時は admin bypass または reviewer を追加することで対応する（`implementation-guide.md` に手順を記載）。

## Single Source of Truth の確立

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

## DRY 化結果サマリー

| 対象 | Before（DRY 化前） | After（DRY 化後） |
| --- | --- | --- |
| 設定値の置き場 | governance-map / runbook / phase 仕様書に分散 | `github-governance-map.md` を正本として一元化 |
| 変更フロー | 変更時にどのファイルを先に更新すべきか不明確 | 正本 → runbook → phase 仕様書 の順序を明文化 |
| 4条件テキスト | SKILL.md の定義と PR テンプレートで表現が乖離するリスク | SKILL.md 定義に一致していることを確認・記録 |

## 重複・冗長箇所の特定

| 箇所 | 内容 | 対処 |
| --- | --- | --- |
| reviewer 数（main: 2, dev: 1）の記述 | governance-map と runbook の両方に記載 | governance-map を正本とし、runbook は参照リンクで代替可（現状維持で許容） |
| CODEOWNERS 内容 | governance-map・codeowners.md・.github/CODEOWNERS の3箇所に記載 | .github/CODEOWNERS が実ファイル（正本）、他は参照 |

## 削除対象

なし（現時点では過剰な重複は許容範囲内）

## 4条件評価

| 条件 | 評価観点 | 判定 |
| --- | --- | --- |
| 価値性 | 設定値の重複・矛盾を排除し、将来の設定変更コストを削減できるか | PASS |
| 実現性 | docs-only スコープで完結するか | PASS |
| 整合性 | 4 要素すべてに single source of truth が確立されているか | PASS |
| 運用性 | 設定変更時の更新フローが明確か | PASS |

## Phase 9 への handoff

- `github-governance-map.md` が設定値の正本であることを Phase 9 に引き継ぐ
- 全ての重複チェックで矛盾なし（main reviewer の CODEOWNERS 件は運用上の注意事項として記録）
- **blockers**: なし
