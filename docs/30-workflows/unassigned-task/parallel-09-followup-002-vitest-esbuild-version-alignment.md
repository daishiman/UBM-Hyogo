# Vitest esbuild host/binary version alignment - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | parallel-09-followup-002-vitest-esbuild-version-alignment                             |
| タスク名     | Vitest esbuild host/binary version alignment                                          |
| 分類         | 改善                                                                                  |
| 対象機能     | apps/web focused Vitest spec (parallel-09 で追加) の実行環境復旧                      |
| 優先度       | 中                                                                                    |
| 見積もり規模 | 小規模                                                                                |
| ステータス   | pending                                                                               |
| 発見元       | parallel-09 Phase 12 implementation-guide.md（検証結果セクション）                    |
| 発見日       | 2026-05-15                                                                            |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/parallel-09-ux-cross-cutting/`
- Issue: 未起票（本指示書をベースに follow-up issue 化想定）
- 状態: `pending` / Phase 0 未着手
- 親側 AC への影響: parallel-09 Phase 12 の検証結果で focused Vitest 実行が blocked と記録されているため、本タスク完了で「focused spec が exit 0」evidence を取得し直す必要がある。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-09 (UX cross-cutting) で `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` と `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` を新規追加した。Phase 12 implementation-guide.md の検証結果セクションには次の通り記録されている。

> Focused Vitest: startup blocked by local esbuild host/binary mismatch (`0.27.3` vs `0.25.4`) before test execution

すなわち、Vitest が依存する esbuild の **JS host 側が期待する binary version (`0.27.3`)** と **ローカル `node_modules` に展開されている binary (`0.25.4`)** が一致せず、テストが 1 件も実行されないまま起動時 fail している。

### 1.2 問題点・課題

- focused Vitest spec が start 時点で abort し、parallel-09 で追加した primitives / hook の単体 evidence が取得できない
- pnpm workspace の hoisting と CLAUDE.md 記載の `scripts/cf.sh` が設定する `ESBUILD_BINARY_PATH`（global esbuild 解決用）が干渉している可能性がある
- 単純な `pnpm install` では再現的に解消しないため、手順を runbook 化しないと並列タスク側で再発する
- CI / lefthook 側に esbuild version 整合性チェックが無く、host/binary drift を事前検出できない

### 1.3 放置した場合の影響

- parallel-09 で追加した primitives / `useAdminMutation` の regression が単体テストで検知できない
- 他の並列タスク（parallel-08 / parallel-10 等）が `pnpm vitest` を実行した時に同じ起動失敗を踏む
- visual harness / Playwright のみで品質を担保することになり、ロジック層の boundary が薄くなる

---

## 2. 何を達成するか（What）

### 2.1 目的

esbuild の host (npm package) と binary のバージョン整合性を取り戻し、parallel-09 で追加した focused Vitest spec が **exit 0** で完走できる状態にする。さらに drift 再発を防ぐ前段検査を入れる。

### 2.2 最終ゴール

- focused Vitest spec 2 本がローカル / CI で exit 0
- esbuild host/binary version が `pnpm-lock.yaml` の固定値と一致
- drift を検出する CI / lefthook gate が存在する

### 2.3 スコープ

#### 含むもの

- esbuild host/binary version の現状調査と整合化（`pnpm-lock.yaml` 正本化）
- `pnpm rebuild esbuild` / `pnpm dedupe` / `node_modules` クリーン再構築の runbook 化
- `scripts/cf.sh` が設定する `ESBUILD_BINARY_PATH` と Vitest 実行経路との干渉確認
- esbuild version 整合性チェックスクリプトの追加（CI gate or lefthook pre-push）

#### 含まないもの

- Vitest / Vite / esbuild 自体の **major version upgrade**
- 新規 spec の追加（parallel-09 既存 spec を回すことが本タスクのゴール）
- Playwright / visual harness の調整

### 2.4 成果物

- esbuild 整合化手順の runbook（docs/30-workflows 配下の implementation-guide）
- 整合性チェックスクリプト（例: `scripts/verify-esbuild-version.mjs`）
- CI workflow or lefthook hook 追加差分
- 復旧後の focused Vitest exit 0 evidence (log)

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 host/binary version mismatch の検出ポイント

- 症状: Vitest 起動直後に `Expected esbuild version "0.27.3" but got "0.25.4"` 系のメッセージで abort
- host (JS) 側: `apps/web/node_modules/.pnpm/esbuild@<host>/node_modules/esbuild/lib/main.js` が要求するバージョン
- binary 側: `apps/web/node_modules/.pnpm/@esbuild+darwin-arm64@<bin>/node_modules/@esbuild/darwin-arm64/bin/esbuild` の `--version` 出力
- 両者が `pnpm-lock.yaml` の固定値と乖離しているケースを `node` ワンライナーで突合する必要がある

### 3.2 `ESBUILD_BINARY_PATH` との干渉

- CLAUDE.md 記載の `scripts/cf.sh` は wrangler/esbuild 不整合解消のために `ESBUILD_BINARY_PATH` を global esbuild に向ける
- 同じシェルから `pnpm vitest` を起動すると、Vitest 側の esbuild がこの env を読み取り **意図しない binary を掴む** ことがある
- 対策: Vitest 実行用シェルではこの env を unset するか、`pnpm --filter` 経由で env を継承しない経路を runbook で明示する

### 3.3 `pnpm install --force` で解消しない場合の復旧手順

順に escalation する:

1. `pnpm install --force`
2. `pnpm rebuild esbuild`
3. `pnpm dedupe`
4. `apps/web/node_modules` 削除 → `pnpm install`
5. ルート + `apps/*/node_modules` 全削除 → `pnpm store prune` → `pnpm install`

どの段階で解消したかを runbook に記録し、次回以降の最短経路を確立する。

### 3.4 CI と local の差異

- CI は clean checkout のため binary mismatch が起きづらいが、`actions/cache` で `node_modules` を跨ぐと local と同じ症状が起きる
- 整合性チェックは CI / lefthook の両方に置き、片側だけで pass する状態を作らない

---

## 4. 受入条件 (AC)

- AC-1: `pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` が exit 0
- AC-2: `pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` が exit 0
- AC-3: esbuild host (`require('esbuild/package.json').version`) と binary (`esbuild --version`) と `pnpm-lock.yaml` 固定値の 3 者が一致する
- AC-4: esbuild version 整合性チェックを CI workflow か lefthook pre-push のいずれかに gate として追加し、drift 時に fail する
- AC-5: `scripts/cf.sh` の `ESBUILD_BINARY_PATH` と Vitest 実行の干渉有無を runbook に明記し、Vitest 実行時の推奨シェル状態（unset / 分離）を定めている
- AC-6: 復旧 runbook が `docs/30-workflows/` 配下に存在し、escalation 手順 1〜5 をカバー

---

## 5. 参照資料

- `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-12/implementation-guide.md`（検証結果セクション。focused Vitest blocked の原典）
- `apps/web/package.json`（vitest / esbuild dependency 定義）
- `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx`（復旧対象 spec）
- `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx`（復旧対象 spec）
- `CLAUDE.md`（`scripts/cf.sh` の `ESBUILD_BINARY_PATH` 設計、Node 24 / pnpm 10 固定方針）
- `pnpm-lock.yaml`（esbuild host/binary version の正本）
- 既存 follow-up: `abf4e7a1 fix(wrangler-esbuild): align wrangler/esbuild versions to resolve import source error` (#736) — wrangler 側の類似事例
