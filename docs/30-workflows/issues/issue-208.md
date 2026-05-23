# [#208] [TASK-CODEOWNERS-VALIDATOR-CI-001] CODEOWNERS validator CI gate 導入

## メタ情報

```yaml
issue_number: 208
title: [TASK-CODEOWNERS-VALIDATOR-CI-001] CODEOWNERS validator CI gate 導入
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/208
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`.github/CODEOWNERS` の構文・owner 存在・パス整合を CI で継続検証する gate を新設する。UT-GOV-003 (Issue #146) の Phase 12 unassigned-task-detection.md C-1 として検出された派生タスク。

## 仕様書

`docs/30-workflows/unassigned-task/task-codeowners-validator-ci-001.md`

## スコープ

- `.github/workflows/verify-codeowners.yml` 新設（`on: pull_request`）
- `gh api repos/{owner}/{repo}/codeowners/errors` で `{"errors": []}` を期待
- workflow context 名を UT-GOV-004 へ申し送る形で固定
- `secrets.GITHUB_TOKEN` のみで動作

## 受入条件

- AC-1: PR 作成時に workflow が自動実行
- AC-2: 構文エラー / 未知 owner で job が failure
- AC-3: 正常時 log に期待 JSON が記録される
- AC-4: workflow context 名が UT-GOV-004 と整合
- AC-5: 追加 secret 不要

## 関連

- 親: UT-GOV-003 (#146)
- 連携: UT-GOV-004 (required status checks context sync)
