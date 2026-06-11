# vitest-2-to-3-major-upgrade followup 001 / Vitest 4.x メジャーアップグレード - タスク指示書

## メタ情報

```yaml
issue_number: 1200
status: 未着手
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | vitest-2-to-3-major-upgrade-followup-001-vitest-4-major-upgrade |
| タスク名     | Vitest 4.x メジャーアップグレード |
| 分類         | 改善（依存メジャーアップグレード） |
| 対象機能     | monorepo テストインフラ（`vitest` / `@vitest/coverage-v8`） |
| 優先度       | 低 |
| 見積もり規模 | 中規模 |
| ステータス   | 未着手 |
| GitHub Issue | #1200 |
| 発見元       | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/outputs/phase-12/unassigned-task-detection.md` の baseline 候補 |
| 発見日       | 2026-06-10 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`vitest-2-to-3-major-upgrade` ワークフロー（PR #1177 / dependabot 連動）で Vitest を `^3.2.6` へメジャーアップグレードした。このサイクルの対象は v3.2.6 までであり、Vitest 4.x は別スコープ・別互換ウィンドウとして意図的に除外されている。

### 1.2 問題点・課題

Vitest 4.x は v3 系から再び破壊的変更を持ち込む可能性が高い（過去 v2→v3 で C1-C8 の breaking-change 分類が必要だった）。加えて v4 系は Vite 6+ / Node 20+ といったランタイム要件を引き上げる見込みで、本リポジトリの mise 固定（Node 24.15.0）や `vitest.d1.config.ts` の `pool: forks` / `singleFork: true`（issue-617 port exhaustion 回避）との整合確認が必要になる。

### 1.3 放置した場合の影響

- v3 系の EOL / セキュリティ patch 停止後に強制移行を迫られ、まとめて破壊的変更を被る
- dependabot が v4 PR を上げ続け、CI が継続的に赤くなる / ノイズ化する
- v2→v3 で蓄積した移行知見（version parity・C1-C8 分類・D1 pool 設定維持）が時間経過で風化する

---

## 2. 何を達成するか（What）

### 2.1 目的

Vitest 4.x が stable になった段階で、v2→v3 と同じ「1 サイクル / 1 PR」原則のもと、全 shard green を維持したまま `vitest` / `@vitest/coverage-v8` を v4 系へ更新する。

### 2.2 最終ゴール

- root / `apps/api` / `apps/og` の `vitest` と root の `@vitest/coverage-v8` が同一 v4.x に揃う（peer 一致）
- 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）が green
- coverage 集約が各 package で既存水準（80% 以上）を維持
- typecheck / lint green・deprecation grep 0 件・version parity 一致
- v3→v4 breaking-change の分類記録（C1-C8 相当）と対応差分が残る

### 2.3 スコープ

#### 含むもの

- `package.json` / `apps/api/package.json` / `apps/og/package.json` の vitest 系 specifier を v4.x へ
- `pnpm-lock.yaml` 再生成（`mise exec -- pnpm install`）
- `vitest.config.ts` / `vitest.d1.config.ts` の v4 deprecation / API 変更対応（必要時のみ）
- v4 breaking-change による test / mock / config の最小修正
- Node / Vite ランタイム要件の互換確認（v4 が要求する場合）

#### 含まないもの

- アプリ実装ロジック（`apps/*/src`・`packages/*/src`）の挙動変更（breaking test が真のバグを示す場合を除く）
- D1 schema 変更・Google Form 仕様変更
- coverage 閾値の広範な引き下げ（測定上不可避な delta のみ調整）
- `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` の撤去
- commit / push / PR 作成
- Vite 単体のメジャーアップグレード（followup-002 で別管理）

### 2.4 成果物

- vitest 系 3 package.json + `pnpm-lock.yaml` の更新差分
- v3→v4 breaking-change 分類記録（C1-C8 相当）
- shard / typecheck / lint / deprecation grep / version parity の NON_VISUAL 証跡

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Vitest 4.x が stable リリース済みであること
- v4 が要求する Vite / Node のバージョンが本リポジトリの mise 固定（Node 24.15.0）と両立すること（両立しない場合は followup-002 / mise 更新を先行させる）
- 直前の v3.2.6 状態が dev / main に取り込まれていること

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`
- 参照: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/`
- 関連: followup-002（Vite major upgrade。v4 が Vite メジャーを要求する場合は先行が必要）

### 3.3 必要な知識

- Vitest v3→v4 の migration guide / breaking change 一覧
- monorepo の peer dependency 整合（`vitest` と `@vitest/coverage-v8` の同一バージョン要件）
- `pool: forks` / `singleFork` と Miniflare D1 の port exhaustion 関係（issue-617）
- v2→v3 で確立した C1-C8 breaking-change 分類（`phase-02-design.md`）

### 3.4 推奨アプローチ

v2→v3 の手順を踏襲する。(1) specifier を v4 に上げて lockfile 再生成 → (2) `pnpm why vitest` / `pnpm why @vitest/coverage-v8` で version parity 確認 → (3) shard 単位で RED を収集 → (4) C1-C8 相当に分類 → (5) アップグレードが要求する test / config / coverage delta のみ修正 → (6) typecheck / lint / coverage shard / deprecation grep / `verify-pr-ready.sh` で締める。

---

## 4. 実行手順

### Phase 1: version bump + lockfile 再生成

#### 目的

vitest 系 specifier を v4.x に上げ、依存解決を更新する。

#### 手順

1. `package.json` / `apps/api/package.json` / `apps/og/package.json` の `vitest` を `^4.x` に、root の `@vitest/coverage-v8` を同一系へ
2. `mise exec -- pnpm install` で `pnpm-lock.yaml` 再生成
3. `mise exec -- pnpm why vitest` / `mise exec -- pnpm why @vitest/coverage-v8` で同一バージョン解決を確認

#### 完了条件

- vitest と coverage-v8 が同一 v4.x に解決される

### Phase 2: RED 収集と breaking-change 分類

#### 目的

v4 移行で壊れるテスト / config を洗い出し分類する。

#### 手順

1. 各 shard で `vitest run` を実行し失敗を収集
2. 失敗を C1-C8 相当（error 比較厳格化 / spyOn・mockReset 挙動 / fake timers / config deprecation / coverage threshold / version mismatch / test options 等）に分類
3. アプリ実装ロジックを変えずに修正可能な範囲を確定

#### 完了条件

- 全 RED が分類され、対応方針が確定している

### Phase 3: 修正と緑化

#### 目的

分類した breaking-change を最小修正で解消し全 shard を green にする。

#### 手順

1. test / mock / config / coverage delta のみ修正
2. `vitest.d1.config.ts` の pool 設定は維持
3. 全 shard + coverage 集約 + typecheck + lint + deprecation grep + `bash scripts/verify-pr-ready.sh`

#### 完了条件

- 全 shard green・coverage 80% 以上維持・deprecation 0 件

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] vitest / @vitest/coverage-v8 が同一 v4.x に揃っている
- [ ] 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）が green
- [ ] coverage 集約が各 package で 80% 以上を維持

### 品質要件

- [ ] アプリ実装ロジックを変更していない（真バグ修正を除く）
- [ ] `pool: forks` / `singleFork: true` を維持している
- [ ] coverage 閾値を広範に下げていない
- [ ] deprecation grep 0 件・version parity 一致

### ドキュメント要件

- [ ] v3→v4 breaking-change 分類記録が残っている
- [ ] NON_VISUAL 証跡（shard / typecheck / lint / parity / grep）が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm install
mise exec -- pnpm why vitest
mise exec -- pnpm why @vitest/coverage-v8
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm coverage:guard
bash scripts/verify-pr-ready.sh
```

期待: vitest と @vitest/coverage-v8 が同一 v4.x。typecheck / lint exit 0。全 shard green。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| v4 が Vite メジャー / Node バージョンを引き上げ、mise 固定（Node 24.15.0）と衝突する | 高 | 中 | followup-002（Vite major）/ mise 更新を先行させ、ランタイム互換を確保してから着手する |
| `pool: forks` 系 API が v4 で変更され D1 port exhaustion が再発する | 高 | 中 | issue-747 / issue-617 の runbook を参照し、D1 config の等価設定を v4 API で再現する |
| coverage-v8 と vitest の peer 不一致で coverage 集約が壊れる | 中 | 中 | 両 specifier を同時更新し `pnpm why` で parity を必ず確認する |
| breaking-change が広範でテスト修正が肥大化する | 中 | 中 | C1-C8 分類で範囲を可視化し、1 サイクル 1 PR を超える場合は分割を検討する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/phase-02-design.md`（C1-C8 breaking-change 分類）
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`
- `vitest.config.ts` / `vitest.d1.config.ts`

### 参考資料

- Vitest 公式 migration guide（v3 → v4）
- aiworkflow-requirements: テスト green 基準を緩めない / version parity 維持
- CLAUDE.md 不変条件 8（test file は `*.spec.{ts,tsx}` 固定）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | （将来）v4 メジャーで C1-C8 相当の breaking-change が再発し、shard が赤くなる見込み |
| 原因 | メジャーアップグレードは error 比較厳格化・mock lifecycle・config deprecation・coverage 計測（ignoreEmptyLines 等）の変更を伴うため |
| 対応 | v2→v3 で確立した「version bump → RED 収集 → C1-C8 分類 → 最小修正 → 全 shard green」手順を踏襲する |
| 再発防止（future-self への観点） | (1) `vitest` と `@vitest/coverage-v8` は必ず同一バージョンに揃え `pnpm why` で毎回確認する（v2→v3 の最重要不変条件） (2) `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を絶対に外さない（issue-617 port exhaustion 再発防止） (3) v4 が要求する Vite / Node 要件を着手前に確認し、衝突時は followup-002 / mise 更新を先行させる (4) breaking-change は C1-C8 分類表に写経して範囲を可視化し、1 サイクル 1 PR を超えるなら分割する |

### 補足事項

本タスクは Vitest 4.x が stable リリースされた後に着手する将来タスクである。着手前に v4 のランタイム要件（Vite / Node）を確認し、衝突する場合は followup-002（Vite major upgrade）を先行させる。commit / push / PR 作成はスコープ外。
