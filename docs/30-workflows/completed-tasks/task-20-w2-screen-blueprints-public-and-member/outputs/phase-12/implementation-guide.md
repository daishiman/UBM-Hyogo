# Implementation Guide

## Part 1: 中学生レベル

これは家を建てる前の設計図にあたる作業。大工さんが現場で迷わないように、どの部屋に何を置くか、どの扉から入るか、どの道具を使うかを先に紙へまとめる。ここでは public/member 画面を作る人が、09e / 09f を見れば画面の文字、動き、つなぐ先を迷わず確認できる状態にする。

## Part 2: 技術者向け

| 項目 | 内容 |
| --- | --- |
| TypeScript 型 | 後続 task-11..14 が 09e / 09f §props/state から page props と view model を定義 |
| API | `GET /public/*`, `POST /auth/*`, `GET/PATCH/POST /me/*` の既存 endpoint のみ |
| 使用例 | 09e / 09f の fenced JSX prototype 転記ブロック |
| エラー処理 | loading / empty / error / login gate states / profile request pending |
| 設定値 | token 値は 09b owner、primitive は 09c owner、icon は 09d owner |

## Downstream

| task | 消費する仕様 |
| --- | --- |
| task-11 | 09e §1 / §2 |
| task-12 | 09e §3 / §4 |
| task-13 | 09f §1 |
| task-14 | 09f §2 |
| task-06 | 09e / 09f を 09-ui-ux index へ接続 |
