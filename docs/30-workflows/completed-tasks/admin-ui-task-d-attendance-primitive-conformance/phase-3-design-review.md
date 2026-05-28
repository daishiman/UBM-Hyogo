---
実装区分: 実装仕様書
Phase: 3
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-2-design.md](./phase-2-design.md)
次: [phase-4-test-plan.md](./phase-4-test-plan.md)
---

# Phase 3: 設計レビュー

## 3.1 確認項目と判定

| 項目 | 判定 | 補足 |
|------|------|------|
| `_dashboard/KpiCard.value: number` 制約と「率を % 文字列で渡す」既存 UX の齟齬 | OK | Phase 2.2 の `hint="%"` + `Math.round(rate*1000)/10` で吸収 |
| `AdminTable` は client component (`"use client"`)、attendance は async server component | OK | `AttendanceDashboardSections.client.tsx` を新設し、columns / render / accessor 関数は client island 内で定義する |
| `AttendanceRateBar` 新規不作成 | OK | 親 workflow primitive inventory 方針（新規 primitive 最小化）と整合 |
| `actions={<a href=self>}` の SSR refresh | OK | force-dynamic と合わせ未接続 UI を残さない |

## 3.2 受け入れ基準への整合

- AC-D1..D9 はいずれも Phase 2 設計内で達成可能。
- AC-D6（API 変更ゼロ）は `apps/api/src/routes/admin/dashboard.ts` を一切編集しないことで保証。
- AC-D8（a11y 保存）は page root `aria-label="出席分析"`、`AdminPageHeader` の h1、overview `role="group"`、AdminTable `caption` で保証する。

## 3.3 リスクと緩和

| リスク | 緩和 |
|--------|------|
| AdminTable 採用で既存 sort / empty / loading の挙動が変わる | T-D-03 / T-D-04 で fixture-based 検証 |
| `AdminPageHeader` が Task C で未提供のままだと build 失敗 | Task C の Definition of Done 完了を前提条件として明示（index.md） |
| rate cell の token 違反 | Phase 7 で design-token gate を走らせる。inline progress bar は作らない |

## 3.4 30種思考法 compact evidence

| カテゴリ | 適用した思考法 | 結論 |
|----------|----------------|------|
| 論理分析系 | 批判的 / 演繹 / 帰納 / アブダクション / 垂直 | `AdminTable` client 境界を見落とすと build 不能になるため client island を必須化 |
| 構造分解系 | 要素分解 / MECE / 2軸 / プロセス | fetch owner（server）と table interaction owner（client）を分け、API 変更なしで AC-D1..D9 を網羅 |
| メタ・抽象系 | メタ / 抽象化 / ダブルループ | primitive 化を「新 primitive 追加」ではなく、既存 primitive 採用率を上げる作業に再定義 |
| 発想・拡張系 | ブレスト / 水平 / 逆説 / 類推 / if / 素人 | 期間 filter や rate 専用 primitive は作らず、self-link refresh と text rate cell に集約 |
| システム系 | システム / 因果関係 / 因果ループ | endpoint 追加を避けることで API / D1 / proxy / visual baseline の波及を止める |
| 戦略・価値系 | トレードオン / プラスサム / 価値提案 / 戦略 | 見た目統一、保守性、実装コストを同時に改善し、Task E の visual baseline に接続 |
| 問題解決系 | why / 改善 / 仮説 / 論点 / KJ法 | 根本原因は単一画面だけ旧 JSX が残ったこと。解は page-local client island + 既存 primitive 再利用 |

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 3 |
| 判定 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

設計を 30 種思考法と 4 条件で検証する。

## 実行タスク

- client boundary、API 不変、primitive 方針をレビューする。
- 30 種思考法を compact evidence として記録する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| automation-30 | `.claude/skills/automation-30/SKILL.md` | 30 種思考法 |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| Phase 3 spec | `phase-3-design-review.md` | 設計レビュー |

## 完了条件

- [ ] 4 条件がすべて PASS できる設計になっている。
