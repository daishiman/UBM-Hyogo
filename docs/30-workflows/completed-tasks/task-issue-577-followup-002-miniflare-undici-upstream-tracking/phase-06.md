# Phase 6: 異常系検証

## 異常系シナリオ

### 異常系 1: A/B で flaky 化

**症状**: 3 回中 2 回 PASS、1 回 EADDRNOTAVAIL や timeout
**対応**: 該当 N は **即不採用**。次候補に進まず一つ前を採用。flaky は採用しない（CONST: 不確実値の採用禁止）。
**evidence**: `ab-{N}-run-{R}.log` に fail 内容残し、`ab-summary.md` に「flaky 検知のため不採用」記録。

### 異常系 2: Miniflare メジャー更新で別 breaking 発生

**症状**: A/B 実行時に従来 PASS していたテストが fail
**対応**: package.json 編集を行わず、Miniflare 旧版に rollback。triage 表に「meta upgrade breaking」記録。本 followup-002 のスコープを超えるため、別 followup として記録のみ（CONST_007 例外: 別 issue は今回サイクルで解決不能と判定された場合のみ容認）。
**rollback**: `git checkout HEAD -- apps/api/package.json` / `pnpm install`

### 異常系 3: macOS local と Linux CI の挙動差

**症状**: macOS local で A/B green、Linux CI で EADDRNOTAVAIL 再発（または逆）
**対応**: triage 表 evidence の最後に「macOS-local-only」「Linux-CI-only」明記。CI 側でも追加 A/B 必須。両環境で green 確認できるまで採用しない。
**evidence**: macOS 用 `ab-{N}-run-{R}.log` と CI 用 `ab-ci-{N}-run-{R}.log` を分離保存。

### 異常系 4: `gh api` rate limit

**症状**: `API rate limit exceeded`
**対応**: `GH_TOKEN` 認証経由で再実行。それでも超過時は 1 時間待機。release 取得をスキップしない。

### 異常系 5: secret 値の log 混入

**症状**: evidence ファイルに `ghp_xxx` 等が混入
**対応**: 該当ファイル即削除 → token rotate → secret hygiene grep 再実施。

## rollback runbook

A/B 採用後に CI で regression を検知した場合:

```bash
# 1. apps/api/package.json を戻す
git revert <commit-hash>  # または手動で --maxWorkers=1 --minWorkers=1 に戻す
# 2. CI 再実行で 133/133 PASS / 0 EADDRNOTAVAIL を確認
# 3. triage 表に「採用後 regression 検知 → 軸B 復帰」記録
```

## 異常系 evidence の保存

```
outputs/phase-11/evidence/anomaly/
├── flaky-{N}.md
├── ci-vs-local-diff.md
└── rollback-record.md
```

## 次フェーズへの引き継ぎ事項

Phase 7 で AC × verify × evidence × 不変条件 trace のマトリクスを構築する。
