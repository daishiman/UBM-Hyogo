# Phase 3: 設計レビュー — 代替案比較と base case 確定

> 入力: Phase 2 成果物 3 ファイル
> 出力先: outputs/phase-03/main.md

## 1. 代替案比較

base case を含め 5 案を比較する。各案について 4条件（価値性 / 実現性 / 整合性 / 運用性）で PASS / MINOR / MAJOR を判定する。

### 案 A (base case): 既出 3 contexts のみ投入 + 除外 4 件は UT-GOV-005 リレー

- 投入: `ci`, `Validate Build`, `verify-indexes-up-to-date`
- strict: dev=false / main=true

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-GOV-001 の永続停止リスクを最小化、即時適用可能 |
| 実現性 | PASS | 全 3 件に成功実績あり、`gh api` で機械検証済み |
| 整合性 | PASS | governance 層に閉じ、不変条件 #1〜#7 に影響なし |
| 運用性 | PASS | 段階適用 + 名前変更運用ルールで継続的にドリフトを防止 |

→ **PASS / MAJOR ゼロ**

### 案 B: 8 件すべてを一括投入（草案そのまま）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | MINOR | 全 8 件揃えば理想だが現状未達 |
| 実現性 | **MAJOR** | 5 件が実在せず、投入即 merge 永続停止 |
| 整合性 | MINOR | 草案との一致は取れるが運用に破綻 |
| 運用性 | **MAJOR** | admin override が必要、solo 運用で復旧困難 |

→ **REJECT**（MAJOR あり）

### 案 C: 全 contexts を空にし strict も無効化

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | **MAJOR** | branch protection の status check 機能を全放棄 |
| 実現性 | PASS | 設定は最小 |
| 整合性 | MINOR | governance 設計の意図に反する |
| 運用性 | MINOR | 後で追加する手間が残る |

→ **REJECT**（価値性 MAJOR）

### 案 D: 契約テスト先行（除外 4 件を mock workflow で先に通す）

UT-GOV-005 を待たず本タスク内で `unit-test` 等の no-op workflow を新設し実績を作る。

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | MINOR | 8 件揃うが、実体のない workflow は将来の名前変更で再事故リスク |
| 実現性 | MINOR | スコープ外の実装が混入（本タスクは新設しない方針） |
| 整合性 | **MAJOR** | スコープ違反 (index.md 「含まない」: 新規 CI / workflow の追加実装) |
| 運用性 | MINOR | 後で実体差し替え時に名前変更運用が必要 |

→ **REJECT**（整合性 MAJOR / スコープ違反）

### 案 E: dev も strict=true に統一

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 一貫性は高い |
| 実現性 | PASS | 設定変更のみ |
| 整合性 | PASS | governance 一貫性 |
| 運用性 | MINOR | dev で merge 摩擦が増加、実験的 merge を阻害 |

→ **MINOR / 採用しない**（dev の俊敏性を優先）

## 2. base case 確定

**採用案: 案 A**（既出 3 contexts 投入 / dev=false / main=true）

理由:
- 4 条件すべて PASS、MAJOR ゼロ
- AC-1〜AC-10 すべてを Phase 2 成果物のみで充足
- フェーズ 2 投入条件で 8 件達成への経路が確保されている

## 3. 残課題（Phase 4 以降への引き渡し）

| # | 課題 | 引き渡し先 |
| --- | --- | --- |
| 1 | `gh api check-runs` の dry-run テスト手順 | Phase 4 (test-strategy.md) |
| 2 | 草案 8 × 経路 3 のマトリクステスト | Phase 4 |
| 3 | 確定 contexts の機械可読化 (YAML) | Phase 8 (confirmed-contexts.yml) |
| 4 | strict 採否最終正本 | Phase 9 (strict-decision.md) |

## 4. AC 充足チェック

| AC | 充足 | 根拠 |
| --- | --- | --- |
| AC-1 | ✅ | Phase 2 §1 |
| AC-2 | ✅ | Phase 2 §2 |
| AC-3 | ✅ | Phase 2 §5 |
| AC-4 | ✅ | staged-rollout-plan.md フェーズ 2 |
| AC-5 | ✅ | lefthook-ci-correspondence.md §1 |
| AC-6 | ✅ | Phase 2 §3 / Phase 8 confirmed-contexts.yml で参照可能 |
| AC-7 | ✅ | lefthook-ci-correspondence.md §3 |
| AC-8 | ✅ | Phase 2 §1 / §2 のフルパス記載 |
| AC-9 | ✅ | staged-rollout-plan.md 名前変更事故対応 §経路 A/B |
| AC-10 | ✅ | 本 Phase 4 条件すべて PASS、MAJOR ゼロ |

## 5. ゲート判定

**GO** — 後続 Phase 4 (テスト戦略) に進む。
