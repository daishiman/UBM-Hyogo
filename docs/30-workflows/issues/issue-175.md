# [#175] [skill-ledger A-3-7] skill loader doctor script 提供

## メタ情報

```yaml
issue_number: 175
title: [skill-ledger A-3-7] skill loader doctor script 提供
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/175
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

skill SKILL.md の行数 / リンク健全性 / 未参照 references / canonical-mirror diff を機械的に検知する `scripts/skill-loader-doctor.js` を新設する。

## 仕様書

`docs/30-workflows/unassigned-task/task-skill-loader-doctor-001.md`

## 検出元

skill-ledger A-3 Phase 12 (U-7) — 親 `skill-ledger-a3-progressive-disclosure`

## 主要 AC

- 全 skill 走査（行数 ≤ 200 / リンク到達性 / 未参照 references / canonical-mirror diff）
- `pnpm skills:doctor` コマンドで一発実行
- lefthook pre-commit に組込み（CI 化は後続検討）
- U-5 Anchor 違反時に終了コード 1

## 苦戦箇所対応

#1 リンク参照切れ / #5 mirror 同期漏れ の再発防止。U-1〜U-4 完了後に着手推奨。
