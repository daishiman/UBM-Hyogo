# Phase 09: 進捗管理（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 09 / 13（進捗管理 / wave 配置 / gate） |
| 推定工数 | 0.02 人日 |
| 依存 Phase | Phase 01..08 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| coverage AC 適用 | 適用外（Phase 07 §7 と同理由） |

---

## 0. 自己完結コンテキスト

task-01 は workflow 全体の **W1 単独 wave**。本 Phase で wave 配置 / 上下流 gate / 進捗トラッキング項目を確定する。

---

## 1. 目的

task-01 の DAG 上の位置・進捗チェックポイント・wave 移行 gate を固定し、workflow オーケストレーション側（または solo dev）が判断に迷わないようにする。

---

## 2. wave 配置

```
W1 (task-01)  ──┐
                ├──→ W2 (task-02..08)  ──→ W3 (task-09)  ──→ W4 (task-10)
                │
                ├──→ ... ──→ W6 (task-18)
W1 完了 gate
```

- **W1**: task-01 のみ（本タスク）
- **W2**: task-02..08（02-runtime 配下 4 タスク + 03-spec-source 配下 3 タスク）
- **W3**: task-09（design tokens 実装）
- **W4**: task-10（primitives 実装）
- **W5**: task-11..17（screens public / member / admin）
- **W6**: task-18（regression / CI gate）

詳細 DAG: `outputs/phase-2/phase-2.md` §3。

---

## 3. 進捗チェックポイント

| ID | チェックポイント | 完了条件 | 担当 Phase |
|----|----------------|---------|-----------|
| CP-1 | Phase 01..05 完了 | AC-1〜AC-5 / scope / 設計 / subtask / 環境 全確定 | Phase 01-05 |
| CP-2 | ST-A SCOPE.md 作成完了 | `test -f SCOPE.md` PASS | Phase 06 |
| CP-3 | ST-B CLAUDE.md 追記完了 | `grep ui-prototype-alignment-mvp-recovery CLAUDE.md` 1 件以上 | Phase 06 |
| CP-4 | ST-C specs 追記完了 | `grep "19 routes" specs/00-overview.md` 1 件以上 | Phase 06 |
| CP-5 | ST-D 整合確認 PASS | mapping diff 矛盾なし | Phase 07 |
| CP-6 | ST-E lint + grep PASS | `pnpm lint` exit 0 / 行数検算 19 / 6+2+8+3 | Phase 07 / Phase 11 |
| CP-7 | Phase 11 evidence 生成完了 | docs walkthrough log / link checklist 作成 | Phase 11 |
| CP-8 | Phase 12 implementation guide 完了 | Part 1 / Part 2 / system spec update / unassigned task / skill feedback / compliance check | Phase 12 |
| CP-9 | Phase 13 PR 作成完了 | PR URL 取得 + CI green | Phase 13 |

---

## 4. W1 → W2 移行 gate（重複明記）

W2 (task-02..08) を起動するために必須:

- [ ] CP-1〜CP-9 全 PASS
- [ ] PR が dev にマージ済（または solo dev で main 直接 merge 完了）
- [ ] `SCOPE.md` が main / dev 上に存在し、後続 task が `../SCOPE.md` で解決可
- [ ] CLAUDE.md / specs/00-overview.md の追記が main / dev 上に反映

> 上記いずれかが未達の場合、W2 を起動せず task-01 完了を待つ（Phase 08 R-10 緩和策）。

---

## 5. EXECUTION-ORDER.md との整合

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` に W1 → W6 の順序が記載されている前提で、本 Phase はその W1 セルが task-01 単独であることを保証する。

```bash
# EXECUTION-ORDER.md で task-01 が W1 に存在
grep -A 2 "^## W1" docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md
```

---

## 6. プロトタイプ参照表

本 Phase は進捗管理のため画面実装はないが、CP-7 の Phase 11 evidence で SCOPE.md §3 の prototype 参照（OKLch / 13 primitive）が integrity を保つことを再確認する。

| CP | 関連 prototype |
|----|---------------|
| CP-2（SCOPE.md 作成） | `styles.css` L1-70 / `primitives.jsx` L1-272 |
| CP-7（Phase 11 evidence） | 上記参照を link checklist で OK 確認 |

---

## 7. リスク（進捗特化）

| リスク | 緩和 |
|-------|------|
| W1 の subtask 並列で順序破壊 | ST-A / ST-B / ST-C は順不同 OK だが ST-D は 3 つ完了後に順次 |
| W2 を fast-forward して起動 | gate チェックリスト全 PASS を厳守 |
| solo dev で「だいたい OK」で進めて文言ドリフト | Phase 11 evidence で grep 検算を必須化 |

---

## 8. 完了条件（Phase 10 へ進む gate）

- [ ] wave 配置図が確定
- [ ] CP-1〜CP-9 が定義
- [ ] W1 → W2 gate チェックリストが定義
- [ ] EXECUTION-ORDER.md との整合確認手順あり

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-01 scope gate の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化の要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照先 |
| workflow 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1 -> W7 DAG |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-09.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
