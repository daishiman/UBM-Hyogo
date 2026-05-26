# [#883] [serial-06 followup-002] adapter dev-mode unknown kind 観測 helper

## メタ情報

```yaml
issue_number: 883
title: [serial-06 followup-002] adapter dev-mode unknown kind 観測 helper
state: OPEN
priority: 低
scale: 小規模
category: followup
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/883
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`toMemberDetailProps` adapter は unknown kind を silent skip で処理する設計（production console 非汚染）。Phase 9 §3 で「dev では console.warn を出す方針も検討可」と保留。schema 変化の早期発見機会を逸している。

## 仕様書

`docs/30-workflows/completed-tasks/serial-06-followup-002-adapter-dev-warn-unknown-kind.md`

## 発見元

- serial-06 Phase 9 §3「unknown field 出現時 fallback」の deferred 判断

## アプローチ

adapter pure 性維持のため、optional `onUnknownKind` callback 注入方式。page.tsx で `process.env.NODE_ENV !== production` 時のみ callback を渡す。

## 完了条件

- adapter シグネチャ後方互換拡張
- spec 9 ケース全 green
- production bundle に dev warn 文字列が残らない（DCE 確認）
