# Phase 13: commit / PR

## 状態

`pending_user_approval`。commit、push、PR 作成、CI visual baseline 更新はユーザー明示承認後のみ実行する。

## PR boundary

PR 文面では本 workflow を `spec_created / implementation / VISUAL` として扱う。apps/web 実装が未実行の場合、実装完了や screenshot PASS を主張しない。

## 完了条件

ユーザー承認後、commit / push / PR / remote CI evidence を記録する。
