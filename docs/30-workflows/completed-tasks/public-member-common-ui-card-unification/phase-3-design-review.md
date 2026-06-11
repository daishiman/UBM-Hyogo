---
spec_classification: implementation_spec
state: spec_created
phase: 3
phase_name: 設計レビュー
task_id: public-member-common-ui-card-unification
---

# Phase 3: 設計レビュー

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 判定対象 | Phase 4（テスト作成）へ進めるか |

---


## 目的

Phase 2 設計を4条件・因果ループ・命名衝突で検証し、Phase 4（テスト作成）へ進めるか判定する。

## 4条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|------|------|------|
| **価値性** | ✅ | 8画面のカード/ボタン/背景/タイポを単一の正本層へ集約し、今後の横断改善コスト（デザイン刷新・トークン調整・a11y）を「6プリミティブの変更」に圧縮する。誰の（開発者）どのコスト（横断UI改修）をどれだけ下げるか明確 |
| **実現性** | ✅ | 新層は presentational stateless で既存 Card/Button/KVList を合成するのみ。API/D1/Form 非接触。1サイクルで実装可能な厚み |
| **整合性** | ✅ | 状態所有権を新層に移さない（client は既存が所有）。機械可読 ID を保全（I-7）。トークン正本・inline style 禁止と矛盾なし |
| **運用性** | ✅ | 既存 CI gate（verify:tokens / verify:no-inline-style / lint / typecheck）でそのまま検証可能。新 gate 不要 |

---

## 因果ループ

- **強化ループ（正）**: 正本層が確立 → 各画面が層を経由 → 改善が層に集約 → 改善の波及効果が増大 → さらに層へ寄せる動機が強まる。
- **バランスループ（負の抑制）**: 新層の抽象が過剰だと画面固有要件を表現できず逸脱（直書き）が再発 → `as` / slot（actions/media/footer）/ `className` 透過で escape hatch を用意し、抽象と柔軟性を均衡させる。

---

## リスクと対策

| リスク | 影響 | 対策 | 反映 Phase |
|--------|------|------|-----------|
| 移行で既存 `data-testid`/`aria-label` を壊し既存 spec が RED | 高 | Phase 4 で全画面 spec の selector を棚卸し→移行で透過 props 引き継ぎ（I-7） | 4,5 |
| SectionCard/ContentCard の使い分けが曖昧 | 中 | 「見出し付き情報グループ=SectionCard / 情報1かたまり=ContentCard」をマッピング表で1:1固定 | 1,5 |
| Card.tsx と SectionCard の責務重複 | 中 | Card=原子（className のみ）、SectionCard=組み立て正本（padding/tone 強制）と層を分離。Card を破棄しない | 2,8 |
| globals.css 追記で既存 feature クラスと衝突 | 中 | 新規 `.ui-*` 名前空間に閉じ、既存クラス削減は Phase 8 で段階的に | 5,8 |
| Server/Client 境界の取り違え | 中 | 新層は全て stateless（`"use client"` 不要）。client は既存を内包 | 2,5 |
| ButtonLink と Button の見た目差異 | 低 | className/data 属性を完全一致させ snapshot で同一視覚を担保 | 4,6 |

---

## 命名衝突検査（[FB-04 / FB-02]）

| 新規名 | 同一パッケージ内の既存名 | 衝突 | 対応 |
|--------|------------------------|------|------|
| `PageShell` | `components/shell/SidebarShell` | なし（別責務・別ディレクトリ） | OK。ただし import 時は `ui/layout` 経路で明示 |
| `PageHeader` | （admin の page-head 等は class） | なし | OK |
| `SectionCard` / `ContentCard` | `Card`（ui/） | なし（合成関係） | OK |
| `Prose` | `LegalProse`（components/legal/） | なし（LegalProse は Prose へ縮退） | OK |
| `ButtonLink` | `Button`（ui/） | なし | OK（同体系・別要素） |

---

## 判定

**✅ PASS — Phase 4（テスト作成）へ進む。**

ブロッカーなし。MINOR 指摘（Phase 8 で globals.css の重複クラス削減、Prose への LegalProse 縮退の段階適用）は Phase 8/12 で追跡。

---

## 実行タスク

1. 4条件評価・因果ループ・リスク表を確定し、Phase 4 のテスト設計に риск対策を引き継ぐ。
2. 命名衝突検査の結果（衝突なし）を確定する。
3. PASS 判定を記録し Phase 4 を解禁する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| Phase 1 | `phase-1-requirements.md` | AC・カード化マッピング |
| Phase 2 | `phase-2-design.md` | props 設計・移行戦略 |
| skill | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` | レビューゲート基準 |

---


## 成果物

- `phase-3-design-review.md`（4条件評価 / リスク表 / 命名衝突検査 / PASS 判定）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] 4条件が全て ✅ で、ブロッカー 0 件。
- [ ] Phase 4 進行が承認される。
