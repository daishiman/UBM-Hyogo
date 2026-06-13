# Phase 2: Design（設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-01-requirements.md |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |

## 設計方針サマリ

v2→v3 で確立した「**bump → RED で fail を観測 → 破壊的変更カテゴリへ分類 → 期待値/設定を修正 → GREEN**」サイクルを踏襲する。ただし v4 は v3 と異なり、**bump 前に確定している設定破壊**（pool API 削除 / CLI フラグ削除 / plugin-react peer 不整合）があるため、これらは RED 観測を待たず Lane 0 で bump と同一 wave に修正する。修正は原則「テストの期待値・モック設定・snapshot・config 設定・package.json scripts」に閉じ、**プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は変更しない**。

## ライブラリ選定（バージョン固定）

| パッケージ | 現行 | 目標 | 整合要件（registry 実測） |
| --- | --- | --- | --- |
| `vitest` | `^3.2.6`（root L94 / apps/api L31 / apps/og L22） | `^4.1.8` | engines.node `^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0`（Node 24.15.0 適合）。vite を **direct dependency** で `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` 保持 |
| `@vitest/coverage-v8` | `^3.2.6`（root L86） | `^4.1.8` | peerDependencies `vitest: 4.1.8`（**exact pin。完全一致必須**） |
| `@vitejs/plugin-react` | `^4.0.0`（root L85） | **`^5.2.0`** | 4.x の vite peer は `^4.2 \|\| ^5 \|\| ^6 \|\| ^7`（**Vite 8 非対応**）。5.2.0 は `^4.2 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8` で全範囲対応。6.x は vite `^8.0.0` 専用のため不採用（解決幅が狭い） |
| `jsdom` | `^25.0.0` | 変更なし | vitest 4 の peer は `jsdom: '*'`（optional）。25 系で可 |
| `@testing-library/react` / `jest-dom` | `^16.0.0` / `^6.0.0` | 変更なし | vitest 非依存（react-dom peer）。v4 跨ぎの peer 要求なし |

> **複合確認チェック（FB-CRONVL-001 相当 / ライブラリ選定の実測確認）**: bump 後に `pnpm why vitest` / `pnpm why @vitest/coverage-v8` / `pnpm why vite` / `pnpm why @vitejs/plugin-react` を実行し、(1) vitest と coverage-v8 の解決バージョン完全一致、(2) vite の解決メジャー（6/7/8 のどれか）、(3) plugin-react の peer 警告ゼロ、を確認する。vite が 8.x に解決された場合に plugin-react ^5.2 が peer を満たすことが本設計の要点。

## 破壊的変更 → 影響分類マップ（C1-C8 v4 版）

> 親 workflow の C1-C8（v3 版）の後継表。v4 の出典: https://vitest.dev/guide/migration / https://github.com/vitest-dev/vitest/releases/tag/v4.0.0

| カテゴリ | v4 での変更 | 当 repo への実影響（調査済み） | 修正の所在 |
| --- | --- | --- | --- |
| **C1: pool API 全面改修** | tinypool 削除。`poolOptions` 削除、`singleThread`/`singleFork` → top-level `maxWorkers: 1`、`minWorkers` 削除（CLI `--minWorkers` も）。`isolate: false` は D1 mock の状態汚染を避けるため採用しない | **確定直撃**: `vitest.d1.config.ts:80-84` の `poolOptions.forks.singleFork: true` / `apps/api/package.json` `test:coverage:unit` の `--minWorkers=1` | config（`vitest.d1.config.ts`）+ `apps/api/package.json` scripts |
| **C2: coverage AST remapping 一本化** | `v8-to-istanbul` 廃止 → AST 解析ベースのみ。**数値変動を公式明記**。`coverage.all` / `ignoreEmptyLines` / `extensions` / `experimentalAstAwareRemapping` 削除。include 定義時は covered+uncovered 両対象、`exclude` は include マッチ後適用、exclude は文字列のみ | 数値変動 → `coverage-guard.sh` / `coverage-threshold-lint` の閾値判定に波及し得る。config は `coverage.include`/`exclude` 明示済みで削除オプション未使用 → config 修正不要見込み、**閾値の実測再確認が作業実体** | 閾値（実測に合わせ最小調整）+ Phase 7 実測記録 |
| **C3: mock/spy 挙動変更** | `getMockName()` 既定 `'spy'`→`'vi.fn()'`、`vi.restoreAllMocks` が手動 `vi.spyOn` の restore のみに（状態 reset 廃止）、`mock.invocationCallOrder` 1 始まり、`vi.fn`/`vi.spyOn` の mockImplementation にアロー関数を渡すとコンストラクタ呼出で `not a constructor` | spy リセット前提・呼出順序前提のテストが fail し得る（RED で採取） | テストの mock 設定（`*.spec.ts(x)`） |
| **C4: snapshot 挙動変更** | `[MockFunction spy]` → `[MockFunction]`、**CI 上で obsolete snapshot があると fail**、custom elements に shadow root 出力 | mock 名を含む snapshot が機械的差分化。obsolete 残骸が CI fail 源 | snapshot 更新（`--update` + diff 目視）+ 残骸清掃 |
| **C5: plugin-react × vite peer 整合** | vitest 4 が vite ^6/^7/^8 を解決。plugin-react ^4 は vite 8 非対応 | **確定直撃**: root L85 `@vitejs/plugin-react: ^4.0.0` | root `package.json`（`^5.2.0` へ） |
| **C6: `test.exclude` デフォルト簡素化** | 既定が `node_modules` と `.git` のみに | 両 config とも exclude を自前で全列挙済み（`**/dist/**` 等含む）→ **実影響なし**。前提変更として記録のみ | なし（記録のみ） |
| **C7: `@vitest/*` バージョン整合** | coverage-v8 の peer が **exact pin** に | 揃え忘れは install 時点で peer エラー/警告 | package.json（FR-1/FR-2 で同時更新） |
| **C8: 削除/改名オプション残党** | `workspace`/`defineWorkspace`/`vitest.workspace.*` 削除（→`projects`）、`poolMatchGlobs`/`environmentMatchGlobs` 削除、`deps.external/inline/fallbackCJS` 削除、`deps.optimizer.web`→`client`、`basic` reporter 削除、`test()` 第3引数オブジェクト廃止（v4 で throw）、型 `UserConfig`→`ViteUserConfig` | 現行 config / テストに**いずれも未使用**（調査済み。`vitest.d1.config.ts` は型 import なし・cast のみ）→ grep で未使用の最終確認が作業実体 | grep 検証（修正不要見込み） |

> C1/C5/C7 は bump と同一 wave で確定修正（Lane 0）。C2〜C4 が RED 観測対象の主因。C6/C8 は「未使用確認」が作業実体。
>
> **v4.1 追加の deprecation（fail はしない）**: 複数 `vitest/*` エントリポイント、spy アサーション `toBe*` 系 → `toHaveBeen*` 推奨、`vi.mock`/`vi.hoisted` のモジュールトップレベル外宣言で警告。警告採取時に件数を記録し、機械的に置換可能なもののみ Phase 8 で対応する。

## SubAgent lane 設計（実装プロンプト 03.実装.md 向けの推奨並列構成）

実装は「bump + 確定設定修正（直列の起点）→ RED 観測 → shard 別 fail 修正（並列可能）→ 統合 GREEN（直列の締め）」とする。

| Lane | 担当 | 並列性 |
| --- | --- | --- |
| Lane 0（直列・起点） | package.json 3ファイル bump（vitest/coverage-v8/plugin-react）+ `test:coverage:unit` の `--minWorkers=1` 削除 + `vitest.d1.config.ts` pool API 書換 + `pnpm install` + `pnpm why` 4点整合確認 | 直列（全 lane の前提。C1/C5/C7 をここで確定消化） |
| Lane A（並列） | api shard（unit + d1）の RED 採取 → fail 分類 → 修正 | C2/C3 中心。D1 直列化の完走確認（port exhaustion 非再発）を含む |
| Lane B（並列） | web shard（apps/web 385 spec）の RED 採取 → 修正 | C3/C4 中心 + react alias / plugin-react 5.2 健全性 |
| Lane C（並列） | og / packages / scripts / infra shard の RED 採取 → 修正 | 小規模。C3/C4 中心 |
| Lane D（直列・締め） | deprecation 警告ゼロ確認（C8 grep 含む）+ coverage 閾値再確認（C2）+ obsolete snapshot 0 件確認（C4）+ 全 shard 統合 GREEN | validation lane |

> 並列は最大 3（Lane A/B/C）に抑え、validation（Lane D）は直列で締める（skill ベストプラクティス準拠）。

## 修正判断の境界（責務所有権）

| 事象 | 修正してよい | 修正してはいけない |
| --- | --- | --- |
| `poolOptions` 削除による d1 config 無効化 | `vitest.d1.config.ts` の pool 表現を `maxWorkers: 1` へ書換（`isolate: false` は不採用） | 直列化自体の撤去（issue-617 回帰） |
| spy リセット/呼出順序前提崩れ（C3） | テストの `beforeEach`/`mockReset`/`mockRestore`/期待値 | プロダクトの関数実装 |
| snapshot 機械的差分（C4） | snapshot 更新（diff 目視で意図的変更のみ受入）+ obsolete 清掃 | snapshot が示す実挙動変化の握り潰し（実挙動変化はエスカレーション） |
| coverage 閾値の不可避ずれ（C2） | 閾値の最小調整（下げ幅は実測差分のみ・証跡必須） | カバレッジ対象の include/exclude を恣意的に縮小 |
| config の非推奨 API | config の該当行のみ | alias / optimizeDeps / 直列化設計 |
| `isolate: false` 化で顕在化するテスト間モジュール状態共有 | 実測 fallback として `isolate: false` を採用せず、`maxWorkers: 1` のみで port exhaustion 非再発を確認する | プロダクト側のモジュール構造変更 |

## 検証パス設計

```
bump + 確定設定修正（C1/C5/C7） → pnpm install → pnpm why ×4 整合
     → pnpm typecheck → pnpm lint
     → shard 別 vitest run（RED 観測 / C2-C4 分類 / 修正 / GREEN）
     → 全 shard coverage 実行（C2 数値実測）
     → deprecation 警告 grep + C8 未使用 grep（warn ゼロ or 分類記録）
     → obsolete snapshot 0 件確認
     → CI 相当の coverage-guard 確認 + bash scripts/verify-pr-ready.sh
```

## リスクと対応

| リスク | 兆候 | 対応 |
| --- | --- | --- |
| 想定外の大規模 fail（数百件） | RED で広範な fail | Phase 3 のエスカレーション条件発火（CONST_007 例外判定） |
| `isolate: false` でテスト間状態リークが顕在化 | d1 shard で順序依存 fail | `isolate` を外し `maxWorkers: 1` のみで直列性を確保できるか実測（port exhaustion 非再発を必ず確認）。本 workflow の採用方針はこの fallback |
| coverage 数値が下振れし閾値ゲート赤化 | coverage-guard fail | Phase 7 で shard 別実測 diff を記録し、最小調整のみ。大幅低下（>2pt 級）は計測仕様変化として diff 根拠を添えてユーザー報告 |
| vite 8 解決による plugin-react/エコシステム不整合 | install 警告 / web shard 起動不能 | plugin-react ^5.2 で peer 整合済み。なお解消しない場合のみ `pnpm.overrides` で vite 7 へ pin（最終手段・証跡必須） |
| esbuild arch mismatch（worktree） | vitest 起動前に停止 | `pnpm install --force` + `pnpm verify:vitest-runtime`（CLAUDE.md / issue-747 runbook） |
| D1 port exhaustion 再発 | api-d1 shard が hang/EADDRINUSE | `maxWorkers: 1` 維持を確認。issue-747/617 runbook 参照 |

## 完了条件

- [ ] ライブラリ選定とバージョン整合要件（exact pin / plugin-react ^5.2.0）が固定されている
- [ ] 破壊的変更 → 影響分類マップ（C1〜C8 v4 版）が記載されている
- [ ] 確定修正（C1/C5/C7 = Lane 0）と RED 観測対象（C2〜C4）が分離されている
- [ ] SubAgent lane（0/A/B/C/D）と並列性が設計されている
- [ ] 修正判断の境界（責務所有権）が明示されている
- [ ] 検証パスとリスク対応が記載されている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-01-requirements.md`, Vitest 4 migration guide, npm registry snapshot
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-02-design.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
