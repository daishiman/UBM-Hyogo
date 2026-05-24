# [#229] [skill-ledger T-6 U-5] pnpm indexes:rebuild の非ゼロ exit 保証

## メタ情報

```yaml
issue_number: 229
title: [skill-ledger T-6 U-5] pnpm indexes:rebuild の非ゼロ exit 保証
state: OPEN
priority: 中
scale: 小規模
category: リファクタリング
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/229
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`pnpm indexes:rebuild` 部分失敗時の中断挙動が skill ごとの script 実装差で揃っていない可能性。`set -euo pipefail` 相当の保証を script 層で固定する。

## 仕様書

- docs/30-workflows/unassigned-task/task-skill-ledger-t6-indexes-rebuild-fail-fast.md

## 起点

- docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-5)

## 受入条件

- AC-1: 部分失敗時に必ず非ゼロ exit
- AC-2: 部分書き込みのファイルが残らない
- AC-3: 失敗ログから「どの skill / どの index」かを一意特定
- AC-4: T-6 hook が前提にできる decisive な exit code
