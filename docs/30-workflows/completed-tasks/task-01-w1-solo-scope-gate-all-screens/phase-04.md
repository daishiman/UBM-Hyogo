# Phase 04: タスク分解（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 04 / 13（タスク分解） |
| 推定工数 | 0.03 人日 |
| 依存 Phase | Phase 01, 02, 03 |
| 並列性 | 一部並列可（ST-A / ST-B / ST-C は相互依存なし） |
| タスク種別 | `docs-only` / `NON_VISUAL` |

---

## 0. 自己完結コンテキスト

task-01 全体（docs 3 ファイル編集）を、レビュー単位の **subtasks (ST)** に分解する。各 subtask は独立してレビュー可能で、ST-A / ST-B / ST-C は順序不問で並列実行可能。

---

## 1. 目的

task-01 を 5 個の subtask に分解し、各々の入出力・依存・推定工数を固定する。Phase 06（実装計画）は本分解結果を実行ステップ table に展開する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- ST-A〜ST-E の 5 subtask が定義される
- 各 subtask の入出力・依存・並列性が明記される
- DAG 上の実行順序が確定

### 2.2 非ゴール

- 各 subtask 内の差分文面（Phase 06）
- 検証コマンド詳細（Phase 07）

---

## 3. サブタスク一覧

| ID | 名前 | 入力 | 出力 | 依存 | 並列性 | 推定工数 |
|----|------|------|------|------|--------|---------|
| ST-A | SCOPE.md 新規作成 | task-01 §5.3 骨子 / Phase 03 §5 章立て | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | なし | ST-B / ST-C と並列可 | 0.15 人日 |
| ST-B | CLAUDE.md セクション追記 | task-01 §5.1 文面 / Phase 03 §6.1 アンカー | `CLAUDE.md` 差分（追記のみ） | なし | ST-A / ST-C と並列可 | 0.10 人日 |
| ST-C | specs/00-overview.md 末尾追記 | task-01 §5.2 文面 / Phase 03 §6.2 アンカー | `docs/00-getting-started-manual/specs/00-overview.md` 差分 | なし | ST-A / ST-B と並列可 | 0.05 人日 |
| ST-D | 整合確認（mapping / 19 routes / シグネチャ） | ST-A / ST-B / ST-C の出力 | チェック結果ログ（Phase 11 evidence へ） | ST-A / ST-B / ST-C 全完了 | 不可 | 0.05 人日 |
| ST-E | markdown lint + grep 検証 | ST-D の出力 | `pnpm lint` 結果 / grep 結果 | ST-D | 不可 | 0.05 人日 |
| | **合計** | | | | | **0.40 人日** |

> task-01 推定工数 0.5 人日（task-01 メタ情報）に対し、subtask 合計 0.40 人日 + バッファ 0.10 人日 = 0.5 人日で整合。

---

## 4. DAG（実行順序）

```
[ST-A: SCOPE.md new]    ┐
[ST-B: CLAUDE.md edit]  ├──→ [ST-D: 整合確認] ──→ [ST-E: lint+grep]
[ST-C: specs edit]      ┘
```

- ST-A / ST-B / ST-C は前提なし → 並列可（solo dev でも順次実行で OK）
- ST-D は 3 つの先行 subtask 全完了が gate
- ST-E は ST-D 完了が gate

---

## 5. 各サブタスクの責務境界

### ST-A: SCOPE.md 新規作成（責務）

- §1 routes 表（19 行）
- §2 API mapping 要約（13 行程度）
- §3 不変条件 6 項目
- §4 正本順位 4 段階
- §5 後続タスク導線

### ST-B: CLAUDE.md セクション追記（責務）

- 「## UI prototype alignment / MVP recovery（進行中ワークフロー）」セクション 1 つ
- スコープ表 / 不変条件 4 項目 / 正本順位 4 段階
- 既存セクションへの touch 禁止

### ST-C: specs/00-overview.md 末尾追記（責務）

- 「## 画面一覧（19 routes）と API mapping」節
- SCOPE.md / phase-3 §2 / phase-1 §1〜§3 への参照リンク
- 層別 routes 早見 / API 接続不変条件

### ST-D: 整合確認（責務）

- SCOPE.md §1 19 行 ↔ phase-1 §2.2 19 行 一致
- SCOPE.md §2 endpoint ↔ phase-3 §2 / §7 矛盾なし
- CLAUDE.md スコープ表 ↔ SCOPE.md §1 の routes 一致

### ST-E: lint + grep 検証（責務）

- `pnpm lint`
- `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` 1 件以上
- `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` 1 件以上
- `test -f` で 3 ファイル存在確認
- `git diff --stat` 変更ファイルが正本 docs / task package / approved archive に限定されている

---

## 6. プロトタイプ参照表

本 Phase はサブタスク分解そのもので画面実装はないが、各 subtask が触る docs に prototype 参照が含まれるため、関連 token を再掲する。

| subtask | 関連 prototype 参照 |
|---------|--------------------|
| ST-A SCOPE.md §3 #3 | `styles.css` L1-70（OKLch token 正本） |
| ST-A SCOPE.md §3 #5 | `primitives.jsx` L1-272（13 primitive） |
| ST-B CLAUDE.md 不変条件 #2 | `styles.css` L1-70 |
| ST-C specs 19 routes 早見 | `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` |

---

## 7. リスク

| リスク | 緩和 |
|-------|------|
| ST-A / ST-B / ST-C を並列で書いて文言ドリフト | ST-D で grep 一致確認 |
| ST-E lint で fence 閉じ忘れ検出 | Phase 06 で各 fence の対応を二重チェック |

---

## 8. 完了条件（Phase 05 へ進む gate）

- [ ] ST-A〜ST-E が定義済み
- [ ] DAG が確定
- [ ] 各 subtask の責務境界が文書化
- [ ] 推定工数合計が task-01 メタ情報と整合

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-04.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
