# issue-55-followup-001 miniflare D1 full-suite ephemeral port 枯渇 (EADDRNOTAVAIL) の解消

## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | issue-55-followup-001-miniflare-d1-ephemeral-port-exhaustion |
| タスク名     | miniflare D1 full suite 実行時の ephemeral port 枯渇 (EADDRNOTAVAIL) の構造的解消 |
| 分類         | テスト基盤 / CI 安定化 |
| 対象機能     | `apps/api` D1 統合テスト全体 (`vitest.d1.config.ts`) |
| 優先度       | 中 |
| 見積もり規模 | 中規模 |
| ステータス   | 未実施 |
| 発見元       | issue-55 Phase 11 manual-test (`docs/30-workflows/issue-55-notification-channel-and-optout/outputs/phase-11/phase-11-manual-test.md`) |
| 発見日       | 2026-05-22 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-55 (通知 channel 抽象化 + opt-out) の Phase 11 で D1 full suite (`pnpm -F @ubm-hyogo/api test -- --config vitest.d1.config.ts --maxWorkers=1`) を実行したところ、109 件の test 失敗が発生した。失敗の全件は `EADDRNOTAVAIL` で、miniflare が立てる ephemeral port を OS が解放しきれず socket bind が連続失敗するものであった。
failing file を個別に再実行すると pass するため Issue #55 由来の regression ではないが、CI で D1 full suite が実用に堪えない状態であることが明確化した。

### 1.2 問題点・課題

- `vitest.d1.config.ts` で `--maxWorkers=1` を指定しても、suite 単位ごとに miniflare 起動 → ephemeral port 取得 → TCP socket close → TIME_WAIT で堆積、というサイクルで port が枯渇する。
- 結果として、変更を加えたタスクごとに「個別 file は pass・full suite は赤」という乖離が常態化し、Phase 9 (品質保証) / Phase 11 (manual test) で正確な D1 regression シグナルを取れない。
- 既存の関連 unassigned-task は contract / integration test setup の整備 (`02b-followup-003`, `task-04a-followup-001`) や test grouping (`task-issue-577-followup-003`) であり、port 枯渇そのものを構造的に解消する task は未起票である。

### 1.3 放置した場合の影響

- D1 関連 regression が full suite では検出できず、個別 file run の習慣化により実行漏れの温床になる。
- Phase 11 evidence で毎回「EADDRNOTAVAIL は本 issue 由来ではない」と但し書きを付ける運用負債が継続する。
- CI へ D1 full suite を載せると flakiness で main / dev の merge gate が信頼できなくなる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`vitest.d1.config.ts` full suite を 1 コマンドで安定 green にし、Phase 9 / Phase 11 の D1 regression シグナルを正確に取得できる状態を恒久化する。

### 2.2 最終ゴール

- `mise exec -- pnpm -F @ubm-hyogo/api test -- --config vitest.d1.config.ts` を 1 コマンドで実行して green になる
- 連続 3 回実行しても `EADDRNOTAVAIL` 起因の failure が 0 件
- Phase 11 manual-test テンプレに「D1 full suite green を必須」と書ける状態

### 2.3 スコープ

- 含む:
  - miniflare instance の lifecycle 制御（suite 横断で reuse / fixture 内 teardown 明示）
  - vitest `pool` / `isolate` 設定の見直し（`pool: 'forks'` + `singleFork: true` などの選定）
  - ephemeral port 範囲 / `SO_REUSEADDR` / 明示的 port 採番の検討
  - 代替案として in-process D1 (`better-sqlite3`) fixture への切り替え検討と判断記録
- 含まない:
  - 既存テストの assertion ロジック変更
  - production D1 への影響
  - LINE / Slack adapter 追加 (Issue #55 known limit)

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Node 24.15.0 / pnpm 10.33.2 / miniflare 4.x / vitest 系の現行 version で再現すること
- macOS (Darwin 25.3.0) と Linux CI の双方で再現確認を取ること

### 3.2 推奨アプローチ

1. **再現スクリプト確立**: `pnpm -F @ubm-hyogo/api test -- --config vitest.d1.config.ts` を 3 連実行し、failure 数と `EADDRNOTAVAIL` 出現箇所を記録する
2. **lifecycle 設計**: vitest pool を `forks` + `singleFork: true` に固定し、miniflare instance を suite 横断で reuse する fixture を `apps/api/src/__tests__/_setup/` に集約する
3. **ephemeral port 制御**: 必要に応じて `MINIFLARE_PORT_RANGE` 等の env で port を絞り、`net.SO_REUSEADDR` 相当の hint を渡す
4. **代替検討**: miniflare の TCP listener を完全に避ける in-process D1 driver (`better-sqlite3` 直叩き) への切り替えコスト比較を skill-feedback-report に記録する
5. **CI 反映**: green を確認後、`.github/workflows/` の D1 suite step を「個別 file run の集合」から「config 単位の 1 コマンド」に統合する

---

## 4. 完了条件チェックリスト

- [ ] `pnpm -F @ubm-hyogo/api test -- --config vitest.d1.config.ts` 1 コマンドで green
- [ ] 連続 3 回実行で `EADDRNOTAVAIL` 0 件
- [ ] macOS / Linux CI の双方で安定確認
- [ ] vitest pool / miniflare lifecycle の選定理由が `lessons-learned-*.md` に記録されている
- [ ] CI workflow が config 単位の 1 コマンド実行に統合されている

---

## 5. 参照情報

- `docs/30-workflows/issue-55-notification-channel-and-optout/outputs/phase-11/phase-11-manual-test.md`（本タスク発見元）
- `docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md`（関連: integration test setup）
- `docs/30-workflows/unassigned-task/task-04a-followup-001-miniflare-contract-leak-suite.md`（関連: contract leak suite）
- `docs/30-workflows/unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md`（関連: D1 usage grouping）
- `apps/api/vitest.d1.config.ts`
- `apps/api/src/__tests__/_setup/`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
