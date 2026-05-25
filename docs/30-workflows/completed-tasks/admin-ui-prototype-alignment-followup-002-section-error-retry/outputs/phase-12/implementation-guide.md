# Implementation Guide

## Part 1: 中学生レベル説明

授業中に掲示板の一部だけが読めなくなった時、教室全体を出入りし直すより、その掲示板だけをもう一度見に行ける方が楽です。このタスクは、管理画面の一部が失敗した時に、画面全体を手で更新しなくても、その失敗表示にあるボタンからもう一度読み直せるようにする設計です。

## Part 2: 技術者向け

- `AdminSectionError` は server compatible presentation component のまま optional props を追加する。
- `AdminSectionErrorClient` だけを client boundary とし、`useRouter().refresh()` と `useTransition()` を内包する。
- admin page server components へ `"use client"` を追加しない。
- 実装レビューでは focused Vitest 19 件、`jest-axe` violation 0、root lint、root typecheck、design-token gate、client-boundary grep を確認済み。
