# Phase 07: 自動テスト（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。本 Phase の「自動テスト」は spec markdown に対する grep / 行 diff チェックスクリプトを指す。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 07 / 13（自動テスト = grep 検証） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 06 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

09g に対する機械検証 5 種（視覚値検出 / セクション数 / mermaid block 数 / API trace check / link 完備）を実行し、結果ログを `outputs/phase-07/automated-checks.log` に保存する。

---

## 1. 目的

Phase 06 の目視レビュー結果を機械的に補強し、視覚値混入・セクション数不整合・API drift を grep / diff で検出する。

---

## 2. 検証スクリプト

### 2.1 視覚値検出（必須 0 件）

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md

echo "[T-01] HEX detection"
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && echo "FAIL: HEX detected" || echo "PASS"

echo "[T-02] oklch( detection"
grep -nE 'oklch\(' "$F" && echo "FAIL: oklch detected" || echo "PASS"

echo "[T-03] px literal detection"
grep -nE '\b[0-9]+px\b' "$F" && echo "FAIL: px detected" || echo "PASS"

echo "[T-04] bg-[ arbitrary color detection"
grep -nE '\bbg-\[' "$F" && echo "FAIL: bg-[ detected" || echo "PASS"
```

### 2.2 セクション数検証

```bash
echo "[T-05] section count"
S=$(grep -cE '^## [0-9]+\. ' "$F")
[ "$S" -eq 10 ] && echo "PASS ($S)" || echo "FAIL (expected 10, got $S)"

echo "[T-06] AdminSidebar single occurrence"
A=$(grep -c '^## 1\. AdminSidebar' "$F")
[ "$A" -eq 1 ] && echo "PASS" || echo "FAIL (expected 1, got $A)"

echo "[T-07] subsection count"
SUB=$(grep -E '^### [0-9]+\.[0-9]+' "$F" | wc -l | tr -d ' ')
[ "$SUB" -ge 64 ] && echo "PASS ($SUB)" || echo "FAIL (expected ≥64, got $SUB)"
```

### 2.3 mermaid block 数

```bash
echo "[T-08] mermaid block count"
M=$(grep -c '^```mermaid$' "$F")
[ "$M" -ge 8 ] && echo "PASS ($M)" || echo "FAIL (expected ≥8, got $M)"
```

### 2.4 派生 § マーカー検証

```bash
echo "[T-09] derived section marker"
D=$(grep -c '> 派生元: phase-3' "$F")
[ "$D" -eq 4 ] && echo "PASS" || echo "FAIL (expected 4, got $D)"
```

### 2.5 confirm Modal a11y 検証

```bash
echo "[T-10] role=dialog count"
RD=$(grep -c 'role="dialog"' "$F")
[ "$RD" -ge 4 ] && echo "PASS ($RD)" || echo "FAIL (expected ≥4)"

echo "[T-11] aria-modal=true count"
AM=$(grep -c 'aria-modal="true"' "$F")
[ "$AM" -ge 4 ] && echo "PASS ($AM)" || echo "FAIL"

echo "[T-12] focus trap mention"
FT=$(grep -c 'focus trap' "$F")
[ "$FT" -ge 4 ] && echo "PASS" || echo "FAIL"

echo "[T-13] Esc close mention"
EC=$(grep -c 'Esc close' "$F")
[ "$EC" -ge 4 ] && echo "PASS" || echo "FAIL"
```

### 2.6 API trace check（current admin API contract と一致）

```bash
echo "[T-14] API endpoint trace"
P3=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md

# current admin API contract から採用 endpoint を抽出
grep -oE '(GET|POST|PATCH|DELETE) /admin/[a-z/:-]+' "$P3" | sort -u > /tmp/p3-admin-api.txt

# 09g から admin endpoint を抽出
grep -oE '(GET|POST|PATCH|DELETE) /admin/[a-z/:-]+' "$F" | sort -u > /tmp/09g-admin-api.txt

diff /tmp/p3-admin-api.txt /tmp/09g-admin-api.txt && echo "PASS" || echo "FAIL: API drift detected"
```

### 2.7 link 完備（09a / 09b / 09c / 09d）

```bash
echo "[T-15] cross-spec link count"
L=$(grep -E '09[abcd]\b' "$F" | wc -l | tr -d ' ')
[ "$L" -ge 32 ] && echo "PASS ($L)" || echo "FAIL (expected ≥32)"
```

### 2.8 行数

```bash
echo "[T-16] line count"
LN=$(wc -l < "$F" | tr -d ' ')
[ "$LN" -ge 700 ] && [ "$LN" -le 1200 ] && echo "PASS ($LN)" || echo "FAIL (expected 700..1200, got $LN)"
```

### 2.9 markdown lint

```bash
echo "[T-17] markdown lint"
mise exec -- pnpm lint:md "$F" || echo "FAIL: markdown lint error"
```

---

## 3. 実行コマンド

```bash
# まとめて実行
bash scripts/verify-09g-screen-blueprints-admin.sh 2>&1 | tee outputs/phase-07/automated-checks.log
```

> 上記スクリプトは本 Phase で生成した検証ハーネス。line count / section count / Sidebar 集約 / mermaid / 派生 marker / 視覚値 literal / stale endpoint を FAIL fast で検出する。task-22 で 09 系 spec 全体の verify gate に統合される。

---

## 4. 期待結果

| ID | 期待 |
|----|------|
| T-01〜T-04 | 全て PASS（視覚値 0 件） |
| T-05 | PASS（10 セクション） |
| T-06 | PASS（Sidebar 1 個） |
| T-07 | PASS（subsection ≥64） |
| T-08 | PASS（mermaid ≥8） |
| T-09 | PASS（派生 4 マーカー） |
| T-10〜T-13 | PASS（confirm Modal a11y 4 要素） |
| T-14 | PASS（API trace 完全一致） |
| T-15 | PASS（link ≥32） |
| T-16 | PASS（700〜1200 行） |
| T-17 | PASS（markdown lint error 0） |

---

## 5. NO-GO 条件

以下のいずれかが FAIL した場合、Phase 08 へ進めず Phase 05 にループバック:

- [ ] T-01〜T-04（視覚値検出）のいずれか FAIL
- [ ] T-05 / T-06（セクション数）FAIL
- [ ] T-08（mermaid 数）FAIL
- [ ] T-09（派生マーカー）FAIL
- [ ] T-14（API trace）FAIL
- [ ] T-16（行数）FAIL
- [ ] T-17（markdown lint）FAIL

---

## 6. 完了条件（Phase 08 へ進む gate）

- [ ] T-01〜T-17 全て PASS
- [ ] `outputs/phase-07/automated-checks.log` 配置済
- [ ] NO-GO 条件全て NO

---

## 7. プロトタイプ参照表

本 Phase は spec の機械検証のため、prototype の直接参照は T-14 API trace check で current admin API contract を参照するのみ。

---

## 8. リスク / 注意

| リスク | 緩和 |
|-------|------|
| grep 正規表現が誤検出 | T-XX 個別実行で確認 |
| markdown lint 設定差異 | `mise exec -- pnpm lint:md` で固定 |
| API trace で endpoint 抽出ミス | 正規表現を `(GET\|POST\|PATCH\|DELETE) /admin/...` に固定 |

---

## 9. 次 Phase への引き渡し

Phase 08（統合テスト）は本 Phase の T-14 API trace に加え、09a / 09b / 09c / 09d との link 整合性を確認する。

## 実行タスク

- T-01〜T-17 を順次実行し結果を `outputs/phase-07/automated-checks.log` に保存する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| Phase 06 | `phase-06.md` | レビュー観点（grep 機械化元） |
| 09g 本体 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | 検証対象 |
| current admin API contract | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API trace 比較元 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 検証ログ | `outputs/phase-07/automated-checks.log` | T-01〜T-17 結果 |
| 検証ハーネス | `scripts/verify-09g-screen-blueprints-admin.sh` | §2 全 17 チェック |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-07.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] T-01〜T-17 全 PASS。

## 目的

- 09g に対する機械検証で視覚値 0 / セクション 10 / mermaid 8+ / API trace 完全一致を保証する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。本 Phase の grep スクリプトと Phase 08 link integrity を統合証跡とする。
