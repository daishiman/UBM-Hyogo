# Phase 09: 受入テスト（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 09 / 13（受入テスト = DoD 11 項目チェック） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 08 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

task-21 source §8 DoD（Definition of Done）11 項目を順次照合し、全項目 PASS で受入完了とする。

---

## 1. 目的

09g 本体が task-21 source §8 DoD 11 項目を全て満たすことを確認する。

---

## 2. DoD 11 項目チェック

source §8 から転記:

| # | DoD | 検証方法 | 結果 |
|---|-----|---------|------|
| D-01 | `09g-screen-blueprints-admin.md` 新規作成・700〜1200 行 | `wc -l` / Phase 07 T-16 | — |
| D-02 | §1 AdminSidebar 共通セクション（重複なし） | Phase 07 T-06 | — |
| D-03 | §2〜§9 で admin 8 routes blueprint が揃う（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit） | 目視 / Phase 07 T-05 | — |
| D-04 | §2〜§9 各画面で X.1〜X.8 が揃う | Phase 07 T-07 | — |
| D-05 | 未掲載 4 画面（meetings / requests / identity-conflicts / audit）が phase-3 §3 §5.3〜§5.7 派生ルールに従って正本転記 | Phase 07 T-09 | — |
| D-06 | bulk-action / queue resolve / schema alias apply で confirm Modal の `role="dialog"` + `aria-modal="true"` + focus trap + Esc close が §X.6 に記述 | Phase 07 T-10..T-13 | — |
| D-07 | schema alias apply の二段確認（dryRun diff → aliases apply confirm）が §6.3 状態遷移に明示 | 目視 §6.3 mermaid + §6.7 操作手順 | — |
| D-08 | 視覚値（HEX / oklch / px / `bg-[#...]`）が 0 件 | Phase 07 T-01..T-04 | — |
| D-09 | current admin API contract と §X.4 が一致 | Phase 07 T-14 | — |
| D-10 | §99 不採用に TweaksPanel / theme switcher / data-theme の 3 件 | 目視 §99 | — |
| D-11 | markdown lint で error 0 / 09c / 09b / 09d / 09a への link が全画面で記述 | Phase 07 T-17 / T-15 | — |

---

## 3. 受入手順

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md

# D-01
LN=$(wc -l < "$F" | tr -d ' ')
echo "D-01 line count: $LN (expected 700..1200)"

# D-02
echo "D-02 sidebar single: $(grep -c '^## 1\. AdminSidebar' "$F")"

# D-03
echo "D-03 sections (expected 10):"
grep -E '^## [0-9]+\. ' "$F"

# D-04
echo "D-04 subsections per § (expected 8 each for §2..§9):"
for s in 2 3 4 5 6 7 8 9; do
  c=$(grep -cE "^### ${s}\.[0-9]+" "$F")
  echo "  §${s}: ${c}"
done

# D-05
echo "D-05 derived markers: $(grep -c '> 派生元: phase-3' "$F") (expected 4)"

# D-06
echo "D-06 confirm Modal a11y:"
echo "  role=dialog: $(grep -c 'role="dialog"' "$F")"
echo "  aria-modal: $(grep -c 'aria-modal="true"' "$F")"
echo "  focus trap: $(grep -c 'focus trap' "$F")"
echo "  Esc close:  $(grep -c 'Esc close' "$F")"

# D-07
echo "D-07 schema 二段確認 §6.3 / §6.7:"
sed -n '/^## 6\. /,/^## 7\. /p' "$F" | grep -E '(二段|diff_shown|confirming_apply)'

# D-08
echo "D-08 visual values (expected 0):"
grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F" || echo "  none detected"

# D-09 → Phase 07 T-14 結果引用
# D-10
echo "D-10 §99 不採用 3 件:"
sed -n '/^## 99\./,/^$/p' "$F" | grep -E 'TweaksPanel|theme switcher|data-theme'

# D-11
echo "D-11 link 09abcd: $(grep -E '09[abcd]\b' "$F" | wc -l)"
mise exec -- pnpm lint:md "$F"
```

---

## 4. 受入結果記録

`outputs/phase-09/acceptance-test.md` に以下を記録:

| ID | 結果 | エビデンス |
|----|------|-----------|
| D-01〜D-11 | PASS / FAIL | 上記コマンド出力抜粋 |

---

## 5. NO-GO 条件

以下のいずれかが FAIL した場合、Phase 10 へ進めず Phase 05 にループバック:

- [ ] D-01〜D-11 のいずれか FAIL
- [ ] Phase 07 / 08 で計上した警告が未解消

---

## 6. 完了条件（Phase 10 へ進む gate）

- [ ] D-01〜D-11 全て PASS
- [ ] `outputs/phase-09/acceptance-test.md` 配置済

---

## 7. プロトタイプ参照表

本 Phase は DoD 検証のため prototype 直接参照は D-09 API trace 経由のみ（current admin API contract）。

---

## 8. リスク / 注意

| リスク | 緩和 |
|-------|------|
| DoD 文言が source からドリフト | source §8 を逐語転記 |
| Phase 07 結果未取込で D-XX を独立判定する重複作業 | T-XX 結果ログ参照に留める |

---

## 9. 次 Phase への引き渡し

Phase 10（ドキュメント更新）は本 Phase 受入完了を前提に、specs/INDEX 等の link 更新を行う。

## 実行タスク

- D-01〜D-11 を順次検証し結果を記録する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| task-21 source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md` | §8 DoD |
| Phase 07 | `phase-07.md` | T-XX 結果 |
| Phase 08 | `phase-08.md` | link integrity |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 受入結果 | `outputs/phase-09/acceptance-test.md` | D-01〜D-11 結果 |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-09.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] D-01〜D-11 全 PASS。

## 目的

- task-21 source §8 DoD 11 項目を全て満たすことを確認し、09g 本体を受入完了する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。本 Phase の DoD 11 項目検証が受入証跡。
