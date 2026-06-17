# vite-5-to-7-major-upgrade — Workflow Entry

> Issue [#1201](https://github.com/daishiman/UBM-Hyogo/issues/1201)（`[vitest-2-to-3-major-upgrade-followup-002] Vite メジャーアップグレード`）を、**現在のコードに最適化**したうえで「コード実装を確実に実行するための Phase 1-13 実装仕様書」へ落とし込んだワークフロー。Issue は **CLOSED のまま**仕様書化する。

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `vite-5-to-7-major-upgrade` |
| 由来 | Issue #1201（親: `vitest-2-to-3-major-upgrade` の followup-002） |
| Issue state | **CLOSED**（本タスクで再 open しない） |
| workflow_state | `implemented_local_evidence_captured`（Vite 7 依存追加・lockfile 再生成・local evidence 採取済み。commit / PR はユーザー承認後） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（ビルド/テストツールチェーンの依存更新。UI/UX 変更なし） |
| implementation_mode | `new`（Vite 直接依存追加を本サイクルで実施） |
| 親 workflow | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/` |
| 兄弟参照 workflow | `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/`（vitest/esbuild runtime 復旧 runbook） |
| 元 unassigned-task spec | `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade.md` |
| 優先度 | low（Vitest 系が安定している前提の保守タスク） |
| 見積もり規模 | 小〜中（依存追加は小。メジャー跨ぎ検証が不確実性の主因だが事前調査でリスク低下） |
| PR base | `dev` |
| SSOT | [`_shared-context.md`](_shared-context.md) |

## 実装区分

**`[実装区分: 実装仕様書]`** — CONST_004 デフォルト適用。

判定根拠: root `package.json` への `vite` devDependency 追加 + `pnpm-lock.yaml` 再生成という**コード（依存定義）変更**を必須とし、「Vite を次メジャーへ更新し全 vitest shard と apps/web ビルドが green を維持する」という**動作保証**が目的。ドキュメントのみでは達成不可能。よって実装仕様書として作成し、CONST_005 必須項目をすべて含める。

## Issue #1201 調査サマリ（現在のコードに最適化）

| 観点 | 結論 |
| --- | --- |
| 既に解決済みか | **本サイクルで解決**。`pnpm why vite` で **`vite@7.3.5`** 単一解決を確認。root `package.json` に `"vite": "^7.0.0"` を追加し、`pnpm-lock.yaml` を再生成した |
| Vite の直接依存 | **実装前は無し**（全 `package.json` に `"vite"` 直接 devDependency なし）。本サイクルで root `package.json` に `"vite": "^7.0.0"` を新規追加済み |
| 最適化①: 影響範囲 | **Vite はテストツールチェーン専用**。`apps/web` 本番ビルドは `next build --webpack`（Next.js/OpenNext）で Vite 非依存。Issue が最大リスクとした「OpenNext × Vite 非互換で apps/web ビルド破壊」は構造的にほぼ無効（sanity 確認に留め blocker ではない） |
| 最適化②: 目標バージョン | **Vite 7 直行**。`@vitejs/plugin-react@4.7.0`（peer `^4.2.0\|\|^5\|\|^6\|\|^7`）と `vitest@3.2.6`（dep `^5\|\|^6\|\|^7.0.0-0`）が**両方すでに Vite 7 サポート**。plugin-react を上げる必要なし。vitest 3.2.6 の上限は v8 未満 → Vite 7 が最適到達点 |
| 最適化③: 機構 | Issue 本文の「specifier をメジャー更新」は直接依存が無いため不可。**root `package.json` に `"vite": "^7.0.0"` を新規追加**して 5.4.21→7.x へ引き上げる（dependabot 追跡可・可視・意図に忠実）。代替の `pnpm.overrides.vite` は peer 検証を弱めるため非採用 |
| 必要性の最終判定 | **必要**（ただし当初想定より低リスク・小スコープ）。Vite 5 系の EOL 域でのセキュリティ patch 取りこぼし回避・dependabot ノイズ低減・将来 Vitest 4 化との衝突回避という実益あり |

> 詳細な ground truth は [`_shared-context.md`](_shared-context.md) §2-3 を参照。

## アーキテクチャ決定（移行方針）

| 苦戦箇所 | 決定 | 根拠 |
| --- | --- | --- |
| Vite を上げる機構 | root `package.json` に `"vite": "^7.0.0"` を**直接 devDependency 追加** | 直接依存にしないと推移最低版 5.4.21 のまま。直接化で可視・dependabot 追跡可 |
| 目標メジャー | **7.x**（6 を経由せず直行） | plugin-react 4.7.0 / vitest 3.2.6 が共に v7 サポート済み。vitest 3.2.6 上限が v8 未満 |
| `@vitejs/plugin-react` の扱い | **更新しない**（4.7.0 維持） | peer で既に `^7.0.0` を宣言。Vite 7 と互換 |
| `vitest.config.ts` の alias/optimizeDeps | **等価維持**（破壊しない） | react subpath 解決のための既存設計。v6/v7 で API 安定 |
| esbuild override | `0.27.3` を維持 | vite 7 と非整合なら Phase 3 でエスカレーション |
| apps/web ビルド | sanity 確認のみ（blocker ではない） | Vite 非依存（`next build --webpack`）のため影響構造的に無し |
| Node engine | 対応不要 | Vite 7 要件（Node 20.19+/22.12+）を現環境 24.15.0 が充足 |

## 13 Phase 成果物一覧

| Phase | 区分 | 成果物 |
| --- | --- | --- |
| 1 | 要件定義 | [`phase-01-requirements.md`](phase-01-requirements.md) |
| 2 | 設計 | [`phase-02-design.md`](phase-02-design.md) |
| 3 | 設計レビュー | [`phase-03-design-review.md`](phase-03-design-review.md) |
| 4 | テスト作成 | [`phase-04-test-creation.md`](phase-04-test-creation.md) |
| 5 | 実装 | [`phase-05-implementation.md`](phase-05-implementation.md) |
| 6 | テスト拡充 | [`phase-06-test-expansion.md`](phase-06-test-expansion.md) |
| 7 | カバレッジ確認 | [`phase-07-coverage-check.md`](phase-07-coverage-check.md) |
| 8 | リファクタリング | [`phase-08-refactoring.md`](phase-08-refactoring.md) |
| 9 | 品質保証 | [`phase-09-quality-assurance.md`](phase-09-quality-assurance.md) |
| 10 | 最終レビュー | [`phase-10-final-review.md`](phase-10-final-review.md) |
| 11 | 手動テスト | [`phase-11-manual-test.md`](phase-11-manual-test.md) |
| 12 | ドキュメント更新 | [`phase-12-documentation.md`](phase-12-documentation.md) |
| 13 | PR作成 | [`phase-13-pr-creation.md`](phase-13-pr-creation.md) |

## スコープ（CONST_007: 1サイクル完了原則）

本実行サイクル内で Vite 7 への依存追加・lockfile 再生成・local evidence 採取まで完了した。先送りは行わない。詳細は [`_shared-context.md`](_shared-context.md) §7。

### 含むもの

- root `package.json` への `vite ^7.0.0` 直接 devDependency 追加 + `pnpm-lock.yaml` 再生成。
- `pnpm why vite` による単一 7.x 解決確認。
- Vite 6/7 deprecation 警告採取と config 最小修正（必要時のみ）。
- 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の green 維持・破壊的変更で fail したテストの修正。
- `apps/web` OpenNext ビルドの sanity 確認 + typecheck / lint / deprecation grep の締め。

### 含まないもの

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| Vitest 4.x への更新 | 別 followup（#1200 / followup-001）。v4 は本タスクと独立 | 別 Issue #1200 |
| `@vitejs/plugin-react` のメジャーアップ | 4.7.0 が既に Vite 7 を peer サポート | 不要 |
| Vite 8 への更新 | vitest 3.2.6 は v8 未サポート（上限 `^7.0.0-0`） | 将来（Vitest 4 化と連動） |
| アプリ実装ロジック / D1 schema / Google Form 仕様変更 | toolchain 依存更新に限定 | 該当機能タスク |
| Next.js 本体メジャー / Turbopack を deploy bundle へ混入 | `next build --webpack` 正本維持 | 対象外 |
| commit / push / PR 作成 | 本プロンプト責務外 | ユーザー明示承認後 |

> **未タスク分離の有無**: 現時点で 1 サイクル完了を破綻させる外部依存・合意未済は存在しない。RED 実行で想定外の大規模 fail が判明した場合に限り Phase 3 でユーザーへエスカレーションする（CONST_007 例外条件）。

## 不変条件

1. test file は `*.spec.{ts,tsx}` 固定（CLAUDE.md 不変条件8）。新規テスト追加なし。
2. `vitest.config.ts` の `resolve.alias`（react subpath）/ `optimizeDeps` / `dedupe` / `plugins:[react()]` を破壊しない。
3. `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を破壊しない（issue-617 port exhaustion 回避）。
4. `pnpm.overrides.esbuild = "0.27.3"` を維持する。
5. D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件5）。D1 schema 変更なし。
6. Node `24.15.0` / pnpm `10.33.2` を `mise exec --` 経由で固定実行。
7. テストの green 基準を緩めない（skip 増加禁止）。
8. coverage 閾値は既存水準を下げない。
9. `apps/web` 本番ビルドは `next build --webpack` 正本維持。

## 参照リンク

- Issue #1201: https://github.com/daishiman/UBM-Hyogo/issues/1201
- 親 workflow: `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`
- 元 unassigned-task: `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade.md`
- Vite migration guide（v6 / v7）: https://vite.dev/guide/migration.html
- issue-747 runbook: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`
- CLAUDE.md（Vitest/esbuild runtime トラブル時 / `next build --webpack` 正本 / 不変条件群）
