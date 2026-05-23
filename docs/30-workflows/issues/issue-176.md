# [#176] [skill-ledger A-3-8] 旧 skill アンカーリンク audit / redirect 計画

## メタ情報

```yaml
issue_number: 176
title: [skill-ledger A-3-8] 旧 skill アンカーリンク audit / redirect 計画
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/176
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

A-3 で skill 内部アンカーが references/ 配下に移動した影響で、外部 docs から旧アンカーへの深いリンクが切れている可能性。全 docs を grep して旧 → 新マッピング表を作成する。

## 仕様書

`docs/30-workflows/unassigned-task/task-doc-link-audit-skill-anchors-001.md`

## 検出元

skill-ledger A-3 Phase 12 (U-8) — 親 `skill-ledger-a3-progressive-disclosure`

## 主要 AC

- `rg` で `.claude/skills/*/SKILL.md` 内部アンカー言及を `doc/` `docs/` `.agents/` から全件抽出
- 旧 → 新 references パスマッピング表を生成
- 切れリンクは修正コミット計画に含める
- redirect 案内ノートの要否を判断
- U-1〜U-4 完了後に再走査

## 苦戦箇所対応

#1 リンク参照切れ。検証中心のため小規模だが、修正件数次第で別タスク化判断。
