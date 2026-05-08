# Phase 10: ドキュメント更新（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 10 / 13（ドキュメント更新） |
| 推定工数 | 0.03 人日 |
| 依存 Phase | Phase 09 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

09g 新規作成に伴い、specs INDEX / 上位 SCOPE.md / CLAUDE.md 等の link が必要な箇所を最小限更新する。本タスクは「09g 自体が正本登録の primary deliverable」なので、二重登録は不要。INDEX 系の link 追加のみ行う。

---

## 1. 目的

09g 完成を上位 docs INDEX / SCOPE 系から正しく辿れる状態にする。

---

## 2. 更新対象（最小限）

| # | path | 更新内容 | 必須性 |
|---|------|---------|--------|
| U-01 | `docs/00-getting-started-manual/specs/INDEX.md` または `00-overview.md` の specs 一覧表 | `09g-screen-blueprints-admin.md` を 1 行追加（既存 09a..09d / 09e..09f の並びに整合） | 任意（INDEX 不在なら N/A） |
| U-02 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` の admin 層 mapping 行 | task-21 完了マーカー追記（任意） | 任意 |
| U-03 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` の W2 行 | task-21 完了状態反映（任意） | 任意 |

> task-21 source §3 の primary deliverable は 09g 本体のみ。INDEX 更新は付随作業であり、INDEX が存在しない場合は本 Phase 自体が N/A。

---

## 3. 更新手順

### 3.1 INDEX 存在確認

```bash
test -f docs/00-getting-started-manual/specs/INDEX.md \
  && echo "INDEX exists, proceed U-01" \
  || echo "INDEX absent, U-01 = N/A"
```

### 3.2 INDEX 更新（存在する場合）

既存 09 系の行に整合する形で 1 行追加:

```markdown
- [09g. Screen Blueprints — Admin](./09g-screen-blueprints-admin.md)
```

### 3.3 SCOPE.md / EXECUTION-ORDER.md 更新（任意）

task-21 完了状態を表に反映する場合のみ。状態は ` [x] task-21 完了` 等の最小マーカー。

---

## 4. 更新しないもの

| 対象 | 理由 |
|------|------|
| CLAUDE.md | 09g 新規追加は CLAUDE.md の不変条件・ワークフロー記述に影響しない |
| `docs/00-getting-started-manual/specs/00-overview.md` | task-01 で確定した「画面一覧（19 routes）」表に 09g link を追加するのみ（任意） |
| 上位 phase-1/2/3 outputs | task-01 で確定済（変更禁止） |

---

## 5. 完了条件（Phase 11 へ進む gate）

- [ ] U-01 が INDEX 存在の有無で判定済（存在 → 1 行追加 / 不在 → N/A 記録）
- [ ] U-02 / U-03 は任意（実施した場合のみ記録）
- [ ] 本タスクの primary deliverable（09g 本体）が完成している（Phase 09 PASS）

---

## 6. プロトタイプ参照表

本 Phase は INDEX link 更新のため prototype 直接参照なし。

---

## 7. リスク / 注意

| リスク | 緩和 |
|-------|------|
| INDEX に既存 09 系記載がない場合に新規追加すべきか判断ぶれ | 「既存記載があれば追加 / なければ N/A」ルールで一意化 |
| 任意更新（U-02/U-03）を必須と誤解 | 本 Phase §2 で「任意」明記 |

---

## 8. 完了記録

`outputs/phase-10/docs-update.md` に以下を記録:

| ID | 結果 | 詳細 |
|----|------|------|
| U-01 | DONE / N/A | INDEX 状態 |
| U-02 | DONE / SKIP | SCOPE.md 状態 |
| U-03 | DONE / SKIP | EXECUTION-ORDER.md 状態 |

---

## 9. 次 Phase への引き渡し

Phase 11（visual evidence）は NON_VISUAL のため screenshot 不要。docs walkthrough（09g 本体読了 + INDEX 確認）で代替する。

## 実行タスク

- INDEX 存在確認 → 任意更新を行い記録する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 09g 本体 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | 完成済 |
| INDEX | `docs/00-getting-started-manual/specs/INDEX.md`（存在時） | link 追加先 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| ドキュメント更新記録 | `outputs/phase-10/docs-update.md` | U-01〜U-03 |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-10.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] U-01 判定が記録されている。

## 目的

- 09g を上位 INDEX から辿れる状態にし、後続 task-15/16/17 の参照経路を確保する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。本 Phase の INDEX link 整合が統合証跡。
