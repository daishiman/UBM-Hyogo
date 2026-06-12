# Phase 2: Design（設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-01-requirements.md |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |

## 設計方針サマリ

version bump は機械的だが、メジャー跨ぎゆえ「**bump → RED で fail を観測 → 破壊的変更カテゴリへ分類 → 期待値/設定を修正 → GREEN**」のサイクルで進める。修正は原則「テストの期待値・モック設定・config 設定」に閉じ、**プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は変更しない**。

## ライブラリ選定（バージョン固定）

| パッケージ | 現行 | 目標 | 整合要件（実測） |
| --- | --- | --- | --- |
| `vitest` | root `^2.0.0` / apps `^2.1.9` | `^3.2.6` | engines.node `^18 \|\| ^20 \|\| >=22`（Node 24.15.0 適合）。vite を内部依存で `^5 \|\| ^6 \|\| ^7-0` 保持 |
| `@vitest/coverage-v8` | root `^2.1.9` | `^3.2.6` | peerDependencies `vitest: 3.2.6`（**完全一致必須**） |
| `jsdom` | `^25.0.0` | 変更なし | vitest 3.2.6 の peer は `jsdom: '*'`（任意）。25 系で可 |
| `@vitejs/plugin-react` | `^4.0.0` | 変更なし | vite 5/6/7 と互換。bump 不要 |

> **複合確認チェック（FB-CRONVL-001 相当 / ライブラリ選定の実測確認）**: `pnpm why vitest` と `pnpm why @vitest/coverage-v8` を bump 後に実行し、解決された実バージョンが 3.2.6 で一致していることを確認する。vite の解決バージョンが 5/6/7 のいずれかであることも確認する（範囲外なら peer 警告が出る）。

## 破壊的変更 → 影響分類マップ

| カテゴリ | v3 での変更 | 当 repo への想定影響 | 修正の所在 |
| --- | --- | --- | --- |
| C1: エラー比較厳格化 | `toEqual`/`toThrowError` が `name`/`message`/`cause`/prototype まで比較 | `expect(...).toThrow(Error)` で実際は `TypeError` を投げるテストが fail し得る | テスト期待値（`*.spec.ts`） |
| C2: `vi.spyOn` 再利用 + `mockReset` 挙動 | 既存モック済みメソッドへの `vi.spyOn` が新規モックを作らず再利用 / `mockReset` が元実装へ復帰 | spy のリセット前提テストが崩れ得る | テストの mock 設定 |
| C3: fakeTimers 既定変更 | 既定で `nextTick`/`queueMicrotask` を除く全 timer を fake 化 | `nextTick`/`queueMicrotask` 依存テストが想定外挙動。`--pool=forks` で `nextTick` モック不可 | テストの `vi.useFakeTimers({ toFake })` |
| C4: `deps.inline` 非推奨 | `deps.inline` は警告（v3 でも動作） | 現行 config に **記述なし** → 影響なし（警告ゼロを確認） | config（修正不要見込み） |
| C5: `workspace` 非推奨（v3.2） | `workspace` → `projects` 改名推奨 | 現行 config に `workspace` 記述 **なし** → 影響なし | config（修正不要見込み） |
| C6: coverage `ignoreEmptyLines` | 既定 true（v2.0 から）で空行を除外 | 閾値ゲートの数値が微変動し得る | 閾値（実測に合わせ調整） |
| C7: `@vitest/*` バージョン不一致警告 | 不一致時に警告 | coverage-v8 を揃え忘れると警告 | package.json（FR-2 で対応済み） |
| C8: test/describe 第3引数オブジェクト非推奨 | `test('n', fn, {retry})` が警告（v4 で throw） | 該当記法があれば警告 | テスト（grep で検出・任意修正） |

> C1〜C3 が実 fail を生む主因。C4/C5 は current 設定では未使用のため「警告ゼロ確認」が作業実体。C6 は閾値ゲートの再確認。

## SubAgent lane 設計（実装プロンプト 03.実装.md 向けの推奨並列構成）

実装は「bump（直列の起点）→ RED 観測 → shard 別 fail 修正（並列可能）→ 統合 GREEN（直列の締め）」とする。

| Lane | 担当 | 並列性 |
| --- | --- | --- |
| Lane 0（直列・起点） | package.json 3ファイル bump + `pnpm install` + lockfile 確認 + `pnpm why` 整合確認 | 直列（全 lane の前提） |
| Lane A（並列） | api shard（unit + d1）の RED 採取 → fail 分類 → 修正 | C1/C2/C3 中心。D1 は `vitest.d1.config.ts` |
| Lane B（並列） | web shard（apps/web 348 spec）の RED 採取 → 修正 | C1/C2 + react alias 健全性 |
| Lane C（並列） | og / packages / scripts / infra shard の RED 採取 → 修正 | 小規模。C1 中心 |
| Lane D（直列・締め） | config deprecation 警告ゼロ確認 + coverage 閾値再確認 + 全 shard 統合 GREEN | validation lane |

> 並列は最大 3（Lane A/B/C）に抑え、validation（Lane D）は直列で締める（skill ベストプラクティス準拠）。

## 修正判断の境界（責務所有権）

| 事象 | 修正してよい | 修正してはいけない |
| --- | --- | --- |
| テストの期待エラー型が `Error` → `TypeError` | テスト期待値 | プロダクトの throw 種別 |
| spy リセット前提崩れ | テストの `beforeEach`/`mockReset`/`mockRestore` 設定 | プロダクトの関数実装 |
| fakeTimers で `nextTick` 依存 | テストの `toFake` 明示 | プロダクトの非同期実装 |
| coverage 閾値の不可避ずれ | 閾値の最小調整（下げ幅は実測差分のみ） | カバレッジ対象の include/exclude を恣意的に縮小 |
| config の非推奨 API | config の該当行のみ | alias / optimizeDeps / pool 設計 |

## 検証パス設計

```
bump → pnpm install → pnpm typecheck → pnpm lint
     → shard 別 vitest run（RED 観測 / 修正 / GREEN）
     → 全 shard coverage 実行
     → deprecation 警告 grep（warn ゼロ）
     → CI 相当の coverage-guard 確認
```

## リスクと対応

| リスク | 兆候 | 対応 |
| --- | --- | --- |
| 想定外の大規模 fail（数百件） | RED で広範な fail | Phase 3 でユーザーへエスカレーション（CONST_007 例外判定） |
| D1 port exhaustion 再発 | api-d1 shard が hang/EADDRINUSE | `singleFork: true` 維持を確認。issue-747/617 runbook 参照 |
| esbuild arch mismatch（worktree） | vitest 起動前に停止 | `pnpm install --force` + `pnpm verify:vitest-runtime`（CLAUDE.md） |
| coverage-v8 と vitest の不一致 | バージョン警告 | 両方 3.2.6 に固定（NFR-1） |

## 完了条件

- [ ] ライブラリ選定とバージョン整合要件が固定されている
- [ ] 破壊的変更 → 影響分類マップ（C1〜C8）が記載されている
- [ ] SubAgent lane（0/A/B/C/D）と並列性が設計されている
- [ ] 修正判断の境界（責務所有権）が明示されている
- [ ] 検証パスとリスク対応が記載されている
