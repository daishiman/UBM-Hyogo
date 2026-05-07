# Phase 10: 完了条件 / DoD（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 10 / 13（最終レビュー / DoD） |
| 推定工数 | 0.03 人日 |
| 依存 Phase | Phase 01..09 |
| タスク種別 | `docs-only` / `NON_VISUAL` |

---

## 0. 自己完結コンテキスト

task-01 §8 の DoD（Definition of Done）8 項目を Phase 別 AC と紐付け、最終レビューで全 PASS することを保証する。

---

## 1. 目的

task-01 §8 DoD 全 8 項目 + AC-1〜AC-5 + G-01〜G-05 を統合した最終 DoD チェックリストを確定し、Phase 11 evidence でその実証を行う準備を整える。

---

## 2. DoD（task-01 §8 を Phase AC に紐付け）

| # | DoD 項目 | task-01 §2.1 G-ID | phase-01 AC | 検証 Phase |
|---|---------|-------------------|------------|-----------|
| 1 | CLAUDE.md にセクション追記済（19 routes / 3 不変条件 / 正本順位） | G-01 | AC-1, AC-2 | Phase 11 grep |
| 2 | specs/00-overview.md 末尾に「画面一覧（19 routes）と API mapping」節追記 | G-02 | AC-1, AC-2 | Phase 11 grep |
| 3 | SCOPE.md 新規作成（§1〜§5） | G-03 | AC-1, AC-2 | Phase 11 `test -f` |
| 4 | SCOPE.md §1 19 行 ↔ phase-1 §2.2 19 行一致 | G-04 | AC-2 | Phase 11 行数検算 |
| 5 | SCOPE.md §2 endpoint ↔ phase-3 §2 / §7 矛盾なし | G-04 | AC-3 | Phase 11 mapping diff |
| 6 | mapping 表に欠落 route なし（19=6+2+8+3） | G-04 | AC-2 | Phase 11 層別検算 |
| 7 | 後続 task-02..22 から `../SCOPE.md` で参照可能 | G-04 | AC-3 | Phase 11 リンク到達 |
| 8 | `pnpm lint` PASS | G-05 | AC-1 | Phase 11 lint |
| 9 | `git diff --stat` の変更範囲が正本 docs / task package / approved archive のみ（apps/packages コード変更ゼロ） | G-04 | AC-4 | Phase 11 diff stat |

---

## 3. 最終 DoD チェックリスト（Phase 11 で実証）

### 3.1 ファイル存在 / 種別

- [ ] `CLAUDE.md` edit
- [ ] `docs/00-getting-started-manual/specs/00-overview.md` edit
- [ ] `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` new
- [ ] `git diff --name-status main...HEAD` が正本 docs / task package / approved archive のみ

### 3.2 anchor / 文言一致

- [ ] CLAUDE.md に `## UI prototype alignment / MVP recovery（進行中ワークフロー）` が存在
- [ ] specs/00-overview.md に `## 画面一覧（19 routes）と API mapping` が存在
- [ ] SCOPE.md に `## 1. 全画面実装スコープ（19 routes）` `## 2. API 接続マッピング要約` `## 3. 不変条件` `## 4. 正本順位` `## 5. 後続タスク導線` が存在

### 3.3 数値検算

- [ ] SCOPE.md §1 で `公開` 6 行 / `会員` 2 行 / `管理` 8 行 / `共通` 3 行（合計 19）
- [ ] CLAUDE.md スコープ表で同じ合計 19

### 3.4 整合性

- [ ] SCOPE.md §1 の 19 routes と phase-1 §2.2 の 19 routes が完全一致
- [ ] SCOPE.md §2 の endpoint と phase-3 §2 / §7 が矛盾なし
- [ ] CLAUDE.md / specs / SCOPE.md の 19 routes 列挙が三者一致

### 3.5 prototype 参照整合

- [ ] SCOPE.md §3 #3 で OKLch token 正本（`styles.css` L1-70）言及
- [ ] SCOPE.md §3 #5 で 13 primitive（`primitives.jsx` L1-272）言及

### 3.6 lint / build

- [ ] `mise exec -- pnpm lint` exit 0
- [ ] markdown table syntax（列数 / 区切り）整合

### 3.7 後続参照可能性

- [ ] `01-scope/` から `../SCOPE.md` 解決
- [ ] 後続 task-02 仕様書ドラフト時に正本リンク張れる

---

## 4. NO-GO 条件（Phase 11 へ進めない / W2 起動不可）

- [ ] §3.1〜§3.7 のいずれかが未達
- [ ] R-01 / R-02 / R-05 / R-10（重点監視リスク）の発現
- [ ] coverage AC 適用外の理由が phase-07 / phase-09 と一致しない

---

## 5. プロトタイプ参照表（最終確認）

| 確認 | prototype | 期待 |
|------|----------|------|
| OKLch 正本 | `styles.css` L1-70 | SCOPE.md §3 #3 が本 path を参照 |
| 13 primitive 正本 | `primitives.jsx` L1-272 | SCOPE.md §3 #5 が本 path を参照 |
| 19 routes mock 出典 | `pages-{public,member,admin}.jsx` | SCOPE.md §1 の「プロトタイプ掲載」列が出典と一致 |

---

## 6. 完了条件（Phase 11 へ進む gate）

- [ ] §2 DoD ↔ G-ID ↔ AC マッピング完了
- [ ] §3 最終 DoD チェックリスト全項目が定義
- [ ] §4 NO-GO 条件が明示
- [ ] §5 prototype 参照整合が最終確認可能な形

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-10.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
