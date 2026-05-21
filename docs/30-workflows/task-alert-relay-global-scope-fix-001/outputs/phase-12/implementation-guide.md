# Phase 12: Implementation Guide

## Part 1: 中学生レベル

Cloudflare Workers では、アプリが読み込まれる瞬間に乱数を作ってはいけません。
今回の修正では、起動時に ID を作るのをやめ、ログを出す必要が出た最初の
1 回だけ ID を作るようにしました。同じ Workers isolate の中では、その ID を
使い回します。

## Part 2: 技術者向け

`alert-relay.ts` の module top-level `const isolateId = crypto.randomUUID()`
を `let cachedIsolateId: string | undefined` と module-private
`getIsolateId()` に置換した。`emitKvOperationError()` は
`isolateId: getIsolateId()` を出力する。

この設計により、module import 時の Workers validation error 10021 を避けつつ、
既存の log payload contract (`isolateId` は UUID 文字列で同一 isolate 内 stable)
を維持する。

