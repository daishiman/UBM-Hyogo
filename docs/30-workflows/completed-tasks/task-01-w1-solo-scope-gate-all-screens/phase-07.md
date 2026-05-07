# Phase 07: テスト計画（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 07 / 13（テスト計画） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 06 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| coverage AC 適用 | **適用外**（pure-docs タスクで実装テストが発生しないため。CLAUDE.md / specs / SCOPE.md の docs 編集のみ・コード差分 0 件） |

---

## 0. 自己完結コンテキスト

task-01 はコード変更ゼロのため自動テスト（vitest / Playwright）は存在しない。代わりに **markdown lint / grep 一致 / mapping 整合 / リンク到達性** の 4 軸で検証する。本 Phase はその検証コマンドとチェックリストを確定する。

---

## 1. 目的

Phase 06 で適用した 3 ファイル差分が、AC-1〜AC-5 / G-01〜G-05 を満たすことを **決定論的に検証**できるコマンドセットを定義する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- 検証コマンド一覧（lint / grep / 行数 / リンク）が確定
- 各コマンドの期待結果が明示
- mapping 整合（SCOPE.md ↔ phase-1 / phase-3）の検証手順が確定
- coverage AC 適用外の理由が明記

### 2.2 非ゴール

- 自動テストコード（存在しない）
- Playwright smoke（task-18 責務）

---

## 3. 検証カテゴリ

| カテゴリ | 対象 | コマンド | 期待結果 |
|---------|------|---------|---------|
| ファイル存在 | 3 ファイル | `test -f ...` | 全 PASS |
| markdown lint | 全 docs | `mise exec -- pnpm lint` | exit 0 |
| anchor grep | CLAUDE.md | `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` | 1 件以上 |
| anchor grep | specs | `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` | 1 件以上 |
| 行数検算 | SCOPE.md §1 | `grep -cE "^\| (公開\|会員\|管理\|共通) \|" SCOPE.md` | **19** 期待 |
| 層別検算 | SCOPE.md §1 | `grep -c "^| 公開 \|" SCOPE.md`（4 layer 個別） | 6 / 2 / 8 / 3 |
| 変更範囲 | git diff | `git diff --name-status main...HEAD` | 正本 docs / task package / approved archive のみ |
| リンク到達 | SCOPE.md / specs | `ls` 各リンク先 | 全 OK |
| mapping 整合 | SCOPE.md §2 ↔ phase-3 §2 | 目視 + diff | 矛盾なし |

---

## 4. 検証コマンド集

```bash
# 1. ファイル存在
test -f CLAUDE.md \
  && test -f docs/00-getting-started-manual/specs/00-overview.md \
  && test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md \
  && echo "OK: all target files exist"

# 2. anchor grep
grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md
grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md

# 3. SCOPE.md 行数検算（合計 19 / 層別 6+2+8+3）
SCOPE=docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
echo "total: $(grep -cE '^\| (公開|会員|管理|共通) \|' $SCOPE)"   # 19
echo "公開: $(grep -c '^| 公開 |' $SCOPE)"   # 6
echo "会員: $(grep -c '^| 会員 |' $SCOPE)"   # 2
echo "管理: $(grep -c '^| 管理 |' $SCOPE)"   # 8
echo "共通: $(grep -c '^| 共通 |' $SCOPE)"   # 3

# 4. リンク到達性
ls $SCOPE \
  && ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md \
  && ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md \
  && ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md \
  && ls docs/00-getting-started-manual/specs/00-overview.md

# 5. markdown lint
mise exec -- pnpm lint

# 6. 変更範囲（正本 docs / task package / approved archive のみ）
git diff --name-status main...HEAD

# 7. mapping 整合: SCOPE.md §2 endpoint と phase-3 §2 endpoint の主要キー一致
grep -E "GET|POST|PATCH" $SCOPE | sort -u > /tmp/scope-endpoints.txt
grep -E "GET|POST|PATCH" docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | sort -u > /tmp/phase3-endpoints.txt
diff /tmp/scope-endpoints.txt /tmp/phase3-endpoints.txt   # 期待: 部分集合関係（SCOPE.md は要約）
```

---

## 5. チェックリスト（Phase 11 evidence で再実行）

- [ ] §3 ファイル存在 PASS
- [ ] §3 anchor grep 各 1 件以上
- [ ] §3 行数検算 19 / 6+2+8+3 一致
- [ ] §3 markdown lint exit 0
- [ ] §3 変更範囲が正本 docs / task package / approved archive に限定
- [ ] §3 リンク到達 全 OK
- [ ] mapping 整合: 矛盾なし

---

## 6. プロトタイプ参照表

| 検証対象 | prototype ファイル | 用途 |
|---------|------------------|------|
| SCOPE.md §3 #3 OKLch 言及 | `styles.css` L1-70 | grep `oklch` がリンク先に存在することを確認 |
| SCOPE.md §3 #5 13 primitive 言及 | `primitives.jsx` L1-272 | grep `Chip\|Avatar\|Button\|Switch\|Field\|Drawer\|Modal\|Toast` 存在確認 |

---

## 7. coverage AC 適用外の理由（明記）

CLAUDE.md / phase-template-core.md `## 共通ルール` 6 項に従い、本タスクは以下理由により coverage AC を適用外とする:

- **pure-docs タスク**: `apps/`, `packages/` への code diff が 0 件
- **vitest 対象なし**: 触る 3 ファイルは全て `.md`
- **`scripts/coverage-guard.sh` 実行不要**: code coverage 対象パッケージへの touch なし

> 本 phase および phase-09 / phase-11 で同じ理由を再記載する（coverage AC 適用外の重複明記）。

---

## 8. リスク

| リスク | 緩和 |
|-------|------|
| markdown lint タスクが workspace 未定義 | `mise exec -- pnpm lint` のサブセットでも代替可 |
| 行数検算で全角 `|` と半角 `|` の混在 | grep pattern で半角固定 |
| mapping 整合 grep が false positive | 目視レビューを Phase 11 で必須化 |

---

## 9. 完了条件（Phase 08 へ進む gate）

- [ ] §3 検証カテゴリ 9 項目が確定
- [ ] §4 検証コマンド集が実行可能
- [ ] §5 チェックリストが Phase 11 evidence で再実行できる粒度
- [ ] coverage AC 適用外の理由が記載

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-07.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
