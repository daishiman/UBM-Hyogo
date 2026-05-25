# Phase 5 — Implementation Guide

## 実行コマンド一覧

### T1: Phase 6 spec §3 への note 追加

```bash
# 編集対象を確認
sed -n '110,125p' docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md

# Edit ツールで Phase 4 契約に従い、`### 3.1 fixture 接続戦略` 表（| B: in-process ... |）直下に挿入
```

### T2: Phase 10 spec の文言 backfill

```bash
# 編集対象を確認
sed -n '125,145p' docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-10-local-verification.md

# Edit ツールで line 130, 141 を Phase 4 契約の文言に置換
```

### T3: patterns-lessons-and-pitfalls.md への 2 cross-link entry 追加

```bash
# 末尾を確認
tail -20 .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md

# Edit ツールで Phase 4 契約の 2 cross-link entry を appropriate section に追加
```

### T4: unassigned-task の consumed 化

```bash
# 既存 frontmatter を確認
head -10 docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md

# Edit ツールで Phase 4 契約に従い frontmatter 4 行を追加
```

### T5: artifacts.json / Phase 12 strict 7 生成

Phase 11 / Phase 12 仕様書および `outputs/` 雛形に従い `outputs/artifacts.json` と `outputs/phase-12/` strict 7 を生成。

### T6: drift 検証

```bash
# stale page.route 表現が残っていないか（戦略B採用 sub-workflow 配下）
grep -nR "page\.route" docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/ \
  | grep -v "outputs/phase-11/" \
  | grep -v "outputs/phase-12/implementation-guide.md"

# Phase 6 §3 への note 反映確認
grep -n "Node ランタイム側で実行" docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md

# 全ゲート実行
bash scripts/verify-pr-ready.sh
```

## 実装順序

並列実行可能: T1 / T2 / T3（互いに独立）
逐次実行必須: T4 → T5（生成） → T6（検証）
