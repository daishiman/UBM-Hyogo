# Phase 13: PR 作成準備

## 状態
本セッションでは commit / push / PR 作成は禁止指示のため**未実行**。
PR 本文ソースは `outputs/phase-12/implementation-guide.md` を使用すること。

## 想定 PR
- title: `feat(api): UT-02A-FU-DIAG-001 — static manifest hardening + diagnostics`
- base: `dev` または `main`（運用ポリシーに準拠）
- body: `outputs/phase-12/implementation-guide.md` を流し込み

## 事前チェック（PR 作成時に実施）
- [ ] `git status --porcelain` 空
- [ ] `git diff main...HEAD --name-only` で apps/ packages/ scripts/ docs/ .github/ の変更が含まれること
- [ ] CI: `verify-static-manifest` gate が GREEN
- [ ] 32/32 tests GREEN
