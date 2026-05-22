# Phase 08: 統合テスト（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。本 Phase の「統合テスト」は 09 系 spec 群（09a / 09b / 09c / 09d / 09g）の link 整合性確認を指す。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 08 / 13（統合テスト = link integrity） |
| 推定工数 | 0.03 人日 |
| 依存 Phase | Phase 07 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

09g は 09a（mapping）/ 09b（token）/ 09c（primitives）/ 09d（icons）と相互参照する。本 Phase で各画面 §X.8 の link が実在 anchor を指しているかを確認する。

---

## 1. 目的

09g 各画面 §X.8 の link 整合性を検証し、後続 task-15/16/17 が cross-spec で迷子にならないようにする。

---

## 2. 検証対象 link

| link 種別 | 参照先 | 期待 |
|----------|--------|------|
| primitive | `docs/00-getting-started-manual/specs/09c-primitives.md` §X | §X が実在 |
| icon | `docs/00-getting-started-manual/specs/09d-icons.md` §X | §X が実在 |
| token | `docs/00-getting-started-manual/specs/09b-design-tokens.md` §X | §X が実在 |
| mapping | `docs/00-getting-started-manual/specs/09a-mapping.md` §X | §X が実在（task-07 で生成）|

---

## 3. 統合テスト手順

### 3.1 link 抽出

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md

# 09a/09b/09c/09d への参照を抽出
grep -oE '09[abcd][a-z-]*\.md(#[a-z0-9-]+)?' "$F" | sort -u > /tmp/09g-links.txt
grep -oE '09[abcd] §[0-9]+(\.[0-9]+)?' "$F" | sort -u > /tmp/09g-section-links.txt
```

### 3.2 link 先実在確認

```bash
SPEC_DIR=docs/00-getting-started-manual/specs

# 各 spec の存在確認
for f in 09a-mapping.md 09b-design-tokens.md 09c-primitives.md 09d-icons.md; do
  if [ -f "$SPEC_DIR/$f" ]; then
    echo "PASS: $f exists"
  else
    echo "WARN: $f not yet created (task-XX 未完了の可能性)"
  fi
done
```

> task-21 は task-07 / 08 / 19 / 22 と並列実行可のため、09a / 09b / 09c / 09d が未生成の段階で着手する場合は WARN 扱いし、本 Phase の最終 PASS は task-22（W7 統合）で再検証する。

### 3.3 §X anchor 整合性

09a / 09b / 09c / 09d の §X 番号が 09g 各画面の §X 番号と一致しているか目視確認:

| 09g § | 期待 anchor |
|-------|------------|
| §1 Sidebar | 09c §9 / 09d Sidebar / 09b color-panel |
| §2 dashboard | 09c §10 dashboard / 09d dashboard / 09b kpi |
| §3 members | 09c §11 members table / 09d users / 09b table |
| §4 tags | 09c §12 queue / 09d tag / 09b queue |
| §5 meetings | 09c §13 calendar / 09d calendar / 09b form |
| §6 schema | 09c §14 diff / 09d diff / 09b diff |
| §7 requests | 09c §12 queue（共用）/ 09d inbox / 09b queue |
| §8 conflicts | 09c §15 compare / 09d merge / 09b compare |
| §9 audit | 09c §16 timeline / 09d clock / 09b timeline |

> 上記マッピングは想定値であり、09c / 09d の実 § 番号は task-19 / 22 で確定する。

---

## 4. 並列実行時の整合性チェック

task-21 と並列実行される task-07 / 08 / 19 / 22 の進捗状況により、link 先 spec の存在状況が異なる:

| 並列 task 状態 | 09g link 検証結果 | 対応 |
|---------------|-------------------|------|
| 全て未着手 | link 先 spec 不在 | link 名のみ記述・実在確認は task-22 で再検証 |
| 一部完了 | link 先 spec 部分存在 | 存在分のみ link 解決確認 / 不在分は WARN |
| 全完了 | 全 link 解決 | PASS（最終形） |

本 Phase では「link 名が 09a/09b/09c/09d である」「§X anchor 番号が想定マッピングと一致」までを検証し、ファイル実在は task-22 W7 統合で最終確認する。

---

## 5. 統合テスト記録

`outputs/phase-08/integration-test.md` に以下を記録:

| 項目 | 結果 |
|------|------|
| §X.8 link 数 | 32+（4 種 × 8 画面） |
| 09a 参照数 | 8（各画面 1） |
| 09b 参照数 | 8+ |
| 09c 参照数 | 8+ |
| 09d 参照数 | 8+ |
| §1.4 token / icon / primitive 参照 | 3 種揃う |
| 並列 task 進捗 | task-07 / 08 / 19 / 22 状態 |

---

## 6. 完了条件（Phase 09 へ進む gate）

- [ ] §X.8 link 数 ≥ 32
- [ ] 各画面 §X.8 で 09a / 09b / 09c / 09d 4 種が揃う
- [ ] §X anchor 番号が §3 想定マッピングと整合
- [ ] 並列 task 進捗が記録されている
- [ ] `outputs/phase-08/integration-test.md` 配置済

---

## 7. プロトタイプ参照表

本 Phase は spec 間 link 検証のため prototype 直接参照なし。

---

## 8. リスク / 注意

| リスク | 緩和 |
|-------|------|
| 並列 task の link 先 § 番号 drift | task-22 W7 統合で最終整合 |
| 09a が task-07 完了後でないと anchor 確定しない | 本 Phase で WARN 許容、task-22 で再検証 |

---

## 9. 次 Phase への引き渡し

Phase 09（受入テスト）は task-21 source §8 DoD 11 項目チェックを実行する。本 Phase の link 整合性記録を入力とする。

## 実行タスク

- §X.8 link 抽出 / 実在確認 / anchor 整合性確認を実行し記録する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| Phase 07 | `phase-07.md` | T-15 link 数検証 |
| 09a〜09d spec | `docs/00-getting-started-manual/specs/09{a,b,c,d}-*.md` | link 先 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 統合テスト記録 | `outputs/phase-08/integration-test.md` | link 整合性結果 |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-08.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] §X.8 link 完備が確認されている。

## 目的

- 09g と 09a/09b/09c/09d の link 整合性を確認し、cross-spec の迷子を防ぐ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。本 Phase の link integrity check が統合証跡。
