# Phase 11: visual evidence（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。本 Phase は NON_VISUAL 判定により screenshot を行わず、docs walkthrough で代替する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 11 / 13（visual evidence = docs walkthrough） |
| 推定工数 | 0.03 人日 |
| 依存 Phase | Phase 10 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| visualEvidence | `NON_VISUAL`（screenshot 不要 / docs walkthrough 代替） |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

### 0.1 NON_VISUAL 判定根拠

- 本タスクの primary deliverable は spec markdown（09g）の新規作成のみ
- apps/web に画面実装を一切行わない
- ブラウザで描画される UI 差分が存在しない
- → screenshot / Storybook / Playwright スナップショット いずれも対象外

### 0.2 代替証跡

screenshot に代わり以下の docs walkthrough を実施:

1. 09g 本体の構造 walkthrough（章立て + 各 § サブセクション）
2. プロトタイプ pages-admin.jsx 行範囲 ↔ 09g § 対応
3. 派生 4 画面（meetings/requests/conflicts/audit）の派生元参照
4. Phase 07 grep ログ抜粋（視覚値 0 件 / セクション 10 / mermaid 8+）
5. Phase 09 DoD 11 項目 PASS 結果

---

## 1. 目的

NON_VISUAL タスクで screenshot 不要であることを明示し、代わりに docs walkthrough を統合証跡として残す。

---

## 2. docs walkthrough 構成

### 2.1 構造 walkthrough

`outputs/phase-11/docs-walkthrough.md` に以下を記載:

| 確認項目 | 結果 |
|---------|------|
| §1〜§9 + §99 = 10 セクション存在 | ✓ |
| §1 AdminSidebar 重複なし（1 箇所） | ✓ |
| §2〜§9 各画面 8 サブセクション X.1〜X.8 | ✓ |
| §99 不採用 3 件（TweaksPanel / theme switcher / data-theme） | ✓ |

### 2.2 prototype 行範囲 ↔ 09g § 対応

| 09g § | prototype 行範囲 | 確認 |
|-------|-----------------|------|
| §2 dashboard | L4-L161 | ✓ |
| §3 members | L162-L368 | ✓ |
| §4 tags | L369-L507 | ✓ |
| §6 schema | L508-L657 | ✓ |

### 2.3 派生 4 画面の派生元参照

| 09g § | 派生元 | 冒頭注記 |
|-------|--------|---------|
| §5 meetings | phase-3 §3 §5.4 | `> 派生元: phase-3 §3 §5.4` |
| §7 requests | phase-3 §3 §5.3 | `> 派生元: phase-3 §3 §5.3` |
| §8 conflicts | phase-3 §3 §5.6 | `> 派生元: phase-3 §3 §5.6` |
| §9 audit | phase-3 §3 §5.7 | `> 派生元: phase-3 §3 §5.7` |

### 2.4 Phase 07 grep ログ抜粋

```
[T-01] HEX detection: PASS
[T-02] oklch( detection: PASS
[T-03] px literal: PASS
[T-04] bg-[ arbitrary: PASS
[T-05] section count: PASS (10)
[T-06] AdminSidebar single: PASS (1)
[T-08] mermaid count: PASS (≥8)
[T-09] derived markers: PASS (4)
[T-14] API trace: PASS
[T-16] line count: PASS (xxx)
[T-17] markdown lint: PASS
```

### 2.5 Phase 09 DoD 結果

| DoD | 結果 |
|-----|------|
| D-01〜D-11 | 全 PASS（Phase 09 acceptance-test.md 参照） |

---

## 3. evidence テンプレ分岐

phase-template-phase11.md の `## NON_VISUAL 分岐` に従い、以下を出力:

| 必須要素 | 本タスクでの記述 |
|---------|----------------|
| visualEvidence flag | `NON_VISUAL` |
| 判定根拠 | spec markdown のみで apps/web 画面実装ゼロ |
| 代替証跡 | docs walkthrough（本 §2 の 5 観点） |
| 例外申請 | 不要（NON_VISUAL は規定の代替経路） |

---

## 4. 完了条件（Phase 12 へ進む gate）

- [ ] `outputs/phase-11/docs-walkthrough.md` に §2.1〜§2.5 の 5 観点全て記載
- [ ] visualEvidence = `NON_VISUAL` がメタ情報に明記
- [ ] 判定根拠（コード変更ゼロ / spec のみ）が記載
- [ ] Phase 07 / 09 結果ログから抜粋転記済

---

## 5. プロトタイプ参照表

`phase-03.md` §8 と同一（重複記載省略）。

---

## 6. NON_VISUAL の妥当性再判定

| 判定基準 | 本タスク該当 |
|---------|-------------|
| apps/web 画面実装を含むか | NO |
| primitives.jsx に新 primitive 追加か | NO |
| styles.css / tokens.css 編集か | NO |
| Storybook story 追加か | NO |
| → NON_VISUAL 妥当 | ✓ |

---

## 7. リスク / 注意

| リスク | 緩和 |
|-------|------|
| NON_VISUAL 判定漏れで screenshot 強制 | メタ情報 + 本 §1.1 + §6 で三重明記 |
| 代替証跡が薄い | §2 の 5 観点を必須化 |

---

## 8. 完了記録

`outputs/phase-11/docs-walkthrough.md`:

```markdown
# Phase 11 docs walkthrough（task-21）

visualEvidence: NON_VISUAL
判定根拠: spec markdown 新規作成のみ・apps/web 変更ゼロ

## §2.1 構造
（表）

## §2.2 prototype 行範囲対応
（表）

## §2.3 派生 4 画面
（表）

## §2.4 Phase 07 grep ログ
（抜粋）

## §2.5 Phase 09 DoD
（参照）
```

---

## 9. 次 Phase への引き渡し

Phase 12（完了処理）は本 Phase の docs walkthrough を Phase 12 implementation-guide.md / system-spec-update-summary.md 等で再利用する。

## 実行タスク

- docs walkthrough を作成し NON_VISUAL 代替証跡として記録する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| Phase 07 結果 | `outputs/phase-07/automated-checks.log` | T-XX ログ |
| Phase 09 結果 | `outputs/phase-09/acceptance-test.md` | D-XX 結果 |
| 09g 本体 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | walkthrough 対象 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| docs walkthrough | `outputs/phase-11/docs-walkthrough.md` | §2.1〜§2.5 5 観点 |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-11.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] NON_VISUAL 判定が三重明記（メタ情報 + §1.1 + §6）。

## 目的

- NON_VISUAL タスクの代替証跡を docs walkthrough で完結させる。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。本 Phase の docs walkthrough が visual 代替証跡。
