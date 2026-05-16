# Implementation Guide

## Part 1: 中学生レベルの説明

D1 migration は、データベースの形を少しずつ変えるための手順書です。新しい列や表を追加するとき、手順書だけを置いてテストしないと、本番で動かしたときに壊れることがあります。

このタスクは、新しい migration を追加する人が必ず確認するガイドを作ります。最低限、migration を前向きに適用できること、既存の契約テストが通ること、変更した機能に近い repository または use-case test を 1 件以上追加することを明文化します。

CI comment は、migration を含む Pull Request に「このガイドを読んでください」と自動で知らせる仕組みです。テスト結果を置き換えるものではなく、レビュー観点を毎回思い出せるようにするための補助です。

## Part 2: Technical Summary

This cycle adds a canonical runbook at `docs/30-workflows/runbooks/d1-migration-test-guideline.md`, links it from `apps/api/migrations/README.md`, and adds a non-blocking runbook-link comment step to `.github/workflows/d1-migration-verify.yml` for PRs touching `apps/api/migrations/**`.

The bats test `scripts/d1/__tests__/migration-guideline-presence.bats` verifies the runbook file and its three required headings. The workflow is `implemented_local_runtime_pending`: local evidence is captured, while the PR comment URL is still Phase 13 user-gated runtime evidence.
