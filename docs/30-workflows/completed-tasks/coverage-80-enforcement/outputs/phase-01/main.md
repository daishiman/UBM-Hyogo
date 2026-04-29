# Phase 1 主成果物 — 要件定義

本ファイルは `phase-01.md` の要件定義サマリ。詳細は `../../phase-01.md` 参照。

## 背景

- 既存正本 `aiworkflow-requirements/quality-requirements-advanced.md` で coverage 閾値（desktop 80% / shared 65%）は定義済みだが、CI gate が未実装で強制されていない。
- 既存 CI（`ci.yml`）は typecheck + lint のみ、テスト実行・coverage 検証なし。
- 既存 lefthook は main/dev ブランチ保護のみ。
- 既存 vitest config に coverage 設定（provider / threshold / reporter）が一切ない。

## 課題

- 80% 未満のテスト不足 PR が merge され続ける構造的リスク。
- 開発者がローカルで coverage 計測する手段が標準化されていない（push 後に Codecov で初めて気付く）。
- monorepo の package 別管理が未整備で、`apps/web` / `packages/shared` 等のテスト不足が可視化されない。

## 期待される状態（要件）

1. 全 package（`apps/web` / `apps/api` / `packages/shared` / `packages/integrations` / `packages/integrations/google`）で **lines / branches / functions / statements 全部 80% 以上**。
2. CI で `coverage-gate` job が **required_status_checks** に登録され、80% 未満の PR は merge 不能。
3. ローカルで `pnpm coverage:guard` 実行時、未達なら不足ファイル top10 + テスト雛形パスが stderr に出力される。
4. lefthook pre-push に統合され、push 時に 80% 未満なら push 不能（緊急時のみ `LEFTHOOK=0` で skip 可だが CI で同等 block）。
5. baseline 計測タスク（T0）が Phase 11 で実行され、既存テスト不足が package×metric 単位で可視化される。
6. 3 段階 PR 戦略で、仕組み導入 PR 自体が hard gate に落ちる鶏卵問題を回避。

## 受入条件サマリ（AC-1 〜 AC-14）

詳細は `../../index.md` §受入条件 を参照。本 Phase で確定した中核 AC:

- AC-1: 全 package 一律 80%（4 metrics 全部）
- AC-2: `scripts/coverage-guard.sh` 仕様確定
- AC-3: 不足 top10 + テスト雛形 stderr 出力
- AC-5: CI 2 段階切替（soft / hard）
- AC-6: lefthook pre-push 統合
- AC-7: T0 baseline 計測手順

## 4 条件評価

価値性 / 実現性 / 整合性 / 運用性 すべて **PASS**。

## 苦戦想定

1. 鶏卵問題（仕組み導入 PR が落ちる）→ 3 段階 PR
2. monorepo 集計困難 → coverage-guard.sh
3. Edge runtime exclude → vitest.config.coverage.exclude
4. OS 依存 → POSIX + jq 1.6+
5. soft→hard 切替忘却 → unassigned-task
6. codecov.yml 二重正本 → Phase 12 同期
7. pre-push 遅延 → `--changed` flag

## 次 Phase

Phase 2 設計へ。
