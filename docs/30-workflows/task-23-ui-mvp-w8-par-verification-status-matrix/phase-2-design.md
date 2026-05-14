# Phase 2: 設計

## 目的

22 タスク × 4 条件 = 88 セルの matrix を生成する手順を、確定論的に再現可能な形で設計する。

---

## 1. matrix の構造

### 1.1 行（22 行）

| 行 ID | spec パス |
|-------|-----------|
| task-01 | `01-scope/task-01-w1-solo-scope-gate-all-screens.md` |
| task-02 | `02-runtime/task-02-w2-par-wrangler-env-injection.md` |
| task-03 | `02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |
| task-04 | `02-runtime/task-04-w3-par-window-guard-and-logger.md` |
| task-05 | `02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md` |
| task-06 | `03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md` |
| task-07 | `03-spec-source/task-07-w2-par-prototype-mapping-table.md` |
| task-08 | `03-spec-source/task-08-w2-par-design-tokens-doc.md` |
| task-09 | `04-design-system/task-09-w3-par-tailwind-v4-setup.md` |
| task-10 | `04-design-system/task-10-w4-par-ui-primitives.md` |
| task-11 | `05-screens-public/task-11-w5-par-public-top-and-member-list.md` |
| task-12 | `05-screens-public/task-12-w5-par-member-detail-register-legal.md` |
| task-13 | `06-screens-member/task-13-w5-par-login-rebuild.md` |
| task-14 | `06-screens-member/task-14-w5-par-my-profile-and-requests.md` |
| task-15 | `07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md` |
| task-16 | `07-screens-admin/task-16-w6-par-admin-tags-meetings-requests.md` |
| task-17 | `07-screens-admin/task-17-w6-par-admin-schema-conflicts-audit.md` |
| task-18 | `08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md` |
| task-19 | `03-spec-source/task-19-w2-par-primitives-full-spec.md` |
| task-20 | `03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md` |
| task-21 | `03-spec-source/task-21-w2-par-screen-blueprints-admin.md` |
| task-22 | `03-spec-source/task-22-w2-par-shell-and-icons-and-fixtures.md` |

### 1.2 列（4 列 + 行 ID + 備考）

| 列 | 内容 |
|----|------|
| Task | 行 ID（`task-NN`） |
| 主題 | task spec の「Task ID」または「目的」を 1 行で抽出 |
| C1: 矛盾なし | PASS / WARN / FAIL / N/A |
| C2: 漏れなし | PASS / WARN / FAIL / N/A |
| C3: 整合性あり | PASS / WARN / FAIL / N/A |
| C4: 依存関係整合 | PASS / WARN / FAIL / N/A |
| 備考 | WARN / FAIL の理由 1 行集約 / PASS のみは空欄可 |

---

## 2. セル評価アルゴリズム（決定論）

### 2.1 各条件の判定ロジック

```text
C1（矛盾なし）:
  1. task spec 内の「不変条件」「DoD」を抽出
  2. 関連 spec（依存タスク・並列タスク）の不変条件と論理矛盾なしを確認
  3. 矛盾あり → FAIL（理由: <矛盾箇所>）
  4. 部分的乖離（ドキュメント表記揺れ等）→ WARN（理由: <乖離内容>）
  5. その他 → PASS

C2（漏れなし）:
  1. spec の「変更対象ファイル」リストを抽出
  2. 各ファイルが repository 内に存在するか / 主要関数・export が実装されているか確認
  3. 全て揃う → PASS
  4. 一部のみ未実装（軽微）→ WARN
  5. 主要成果物欠落 → FAIL

C3（整合性あり）:
  1. spec のシグネチャ（function 名・型名・testid 名・route path 等）を抽出
  2. 実装ファイルで grep し identifier が一致するか確認
  3. 完全一致 → PASS
  4. 軽微な命名揺れ → WARN
  5. drift により呼び出し不能 → FAIL

C4（依存関係整合）:
  1. spec の「依存 (前)」表を抽出
  2. 各上流タスクが本 matrix の他行で PASS（または WARN）であることを確認
  3. 上流タスクなし → N/A
  4. 上流すべて PASS → PASS
  5. 上流に WARN が含まれる → WARN
  6. 上流に FAIL が含まれる → FAIL
```

### 2.2 評価で参照する証跡

| 証跡種別 | パス例 |
|----------|--------|
| spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/NN-*/task-NN-*.md` |
| outputs | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/...`（存在すれば） |
| 実装 | `apps/web/src/**`, `apps/api/src/**`, `scripts/**`, `.github/workflows/**` |
| CI gate | `.github/workflows/verify-design-tokens.yml`, `playwright-smoke.yml` |

---

## 3. matrix 出力フォーマット（GFM）

```markdown
# VERIFICATION-STATUS — ui-prototype-alignment-mvp-recovery

| 評価日付 | 評価者 | 参照 branch | 参照 commit |
|----------|--------|-------------|-------------|
| 2026-05-14 | task-23 (solo) | HEAD | <SHA> |

## 凡例

- PASS: 4 条件を充足
- WARN: 軽微な乖離（理由付き）
- FAIL: 重大な乖離（理由付き）
- N/A: 構造的に該当しない

## Matrix（22 × 4 = 88 セル）

| Task | 主題 | C1: 矛盾なし | C2: 漏れなし | C3: 整合性あり | C4: 依存関係整合 | 備考 |
|------|------|--------------|--------------|----------------|------------------|------|
| task-01 | ... | PASS | PASS | PASS | N/A | upstream なし |
| ...
| task-22 | ... | PASS | WARN | PASS | PASS | C2: fixtures 一部後続 |

## サマリー

- PASS: NN セル / WARN: NN セル / FAIL: NN セル / N/A: NN セル
- 合計: 88 セル（埋まり率 100%）
```

---

## 4. 依存関係マップ（C4 判定の根拠）

| Task | 直接依存 |
|------|----------|
| task-01 | なし |
| task-02 | task-01 |
| task-03 | task-01 |
| task-04 | task-01 |
| task-05 | task-02, task-04 |
| task-06 | task-01 |
| task-07 | task-06 |
| task-08 | task-06 |
| task-09 | task-08 |
| task-10 | task-09, task-19 |
| task-11 | task-10, task-20 |
| task-12 | task-10, task-20 |
| task-13 | task-10, task-20 |
| task-14 | task-10, task-20 |
| task-15 | task-10, task-21 |
| task-16 | task-10, task-21 |
| task-17 | task-10, task-21 |
| task-18 | task-02〜task-17 すべて |
| task-19 | task-06 |
| task-20 | task-06, task-07 |
| task-21 | task-06, task-07 |
| task-22 | task-06, task-07 |

> task-01 のみ upstream なしのため C4 = N/A

---

## 5. ステップ間 state 引き渡し

| Phase | 出力 state | 受け取る Phase |
|-------|------------|----------------|
| Phase 1 | 22 タスクリスト | Phase 2 |
| Phase 2 | 評価ルール + 依存マップ | Phase 4, Phase 5 |
| Phase 4 | チェック項目（88 セル充足 / GFM 構文） | Phase 6, Phase 9 |
| Phase 5 | matrix draft | Phase 6, Phase 8 |
| Phase 11 | NON_VISUAL 宣言 | Phase 12 |

---

## 6. リスクと対応

| リスク | 対応 |
|--------|------|
| 22 セル × 4 = 88 セルの埋め忘れ | Phase 4 で行 × 列の cross-check スクリプト概念を定義 |
| GFM table の列ズレ | Phase 9 で markdown lint 概念チェック |
| 評価者の主観混入 | Phase 2 の判定ロジックで定量基準を明文化 |
| 並列タスク（task-24〜26）との競合 | 参照ファイルが重ならない（task-23 は read-only 評価のみ）|

---

## 7. 成果物

- `outputs/phase-2/design.md`
