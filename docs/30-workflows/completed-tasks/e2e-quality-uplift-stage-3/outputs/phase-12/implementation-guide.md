# Implementation Guide

## Part 1

Playwright のテスト整備は、学校の持ち物チェック表を整える作業に近い。何を持ってくるか、どの順番で確認するか、忘れ物がある時にどう気づくかを同じ紙にまとめる。

## Part 2

Stage 3 is a docs-only / NON_VISUAL spec package. Its current state is `spec_verified_pending_dependency`: phase files and strict outputs exist, but `.github/workflows/e2e-tests.yml`, `.github/workflows/lighthouse.yml`, `lighthouserc.json`, coverage gate scripts, branch protection snapshots, and registered contexts are not implemented by this Stage 0 review. Do not treat this package as a hard CI gate until those artifacts exist.
