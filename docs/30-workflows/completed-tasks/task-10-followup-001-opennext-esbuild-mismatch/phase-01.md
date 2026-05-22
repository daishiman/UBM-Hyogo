# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 1 |
| 状態 | spec_created |
| taskType | implementation |
| subtype | build-toolchain-fix |
| visualEvidence | NON_VISUAL |

## 目的

esbuild host/binary mismatch の構造的原因を確定し、`build:cloudflare` を恢復するための要件を固める。

## 入力

- `package.json`（top-level、devDependencies に `vite`/`vitest`/`tsx`/`wrangler` を含む）
- `apps/web/package.json`（`@opennextjs/cloudflare` を含む、`build:cloudflare` script の起点）
- `node_modules/@opennextjs/aws/package.json`（host esbuild 0.25.4 を抱える）
- `node_modules/@esbuild/darwin-arm64/package.json`（v0.21.5、vite 5.4.21 経由）
- `scripts/cf.sh`（`ESBUILD_BINARY_PATH` を wrangler / tsx 用に解決済み）
- `pnpm-workspace.yaml`（`allowBuilds.esbuild = true`）

## P50 チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | Phase 5 で実装 |
| upstream にマージ済み | No | 未マージ |
| 前提タスク完了 | Yes（OpenNext Workers 移行・webpack 切替済み） | 追加依存解消なし |
| Issue #609 の既存解決 PR | No（2026-05-11 に同一エラー再現済み） | 本タスクで解消 |

`implementation_mode = "new"`。

## 真の論点

> `@opennextjs/aws` 内部の esbuild host 0.25.4 が、binary を nested `@opennextjs/aws/node_modules/@esbuild/darwin-arm64`（0.25.4）ではなく top-level `node_modules/@esbuild/darwin-arm64`（0.21.5、vite 経由）から解決してしまう。esbuild は host / binary バージョン strict match を要求するため runtime で fail。

### 根本原因の構造

1. workspace 全体で esbuild が複数バージョン共存している
   - vite 5.4.21 が `esbuild@0.21.5` をピンしている（top-level に hoisted）
   - tsx 4.21.0 / wrangler 4.85.0 が `esbuild@0.27.3` を要求
   - `@opennextjs/aws` が `esbuild@0.25.4` を内部依存
2. pnpm の symlink + hoisting で、`@esbuild/<platform>` の解決順序が host 側の期待と一致しない
3. `@opennextjs/aws` の install.js / lib/main.js は `require.resolve("@esbuild/...")` で binary を探すが、Node の module resolution が top-level の hoisted `@esbuild/darwin-arm64@0.21.5` に到達する

### 解決方向の比較

| アプローチ | 効果 | リスク |
| --- | --- | --- |
| (A) `pnpm.overrides` で esbuild を 0.25.4 に単一化 | 全 esbuild 利用箇所が 0.25.4 で揃う | wrangler 4.85.0 / vitest が 0.25.4 と非互換の可能性 |
| (B) `scripts/cf.sh` の `ESBUILD_BINARY_PATH` を `@opennextjs/aws` 経路に切り替え | host とローカル binary を強制マッチ | `build:cloudflare` 実行時のみ有効、CI の `npx`/`pnpm exec` 直接実行ではバイパスされる |
| (C) `pnpm.overrides` で esbuild を `>=0.25.4 <0.26` に絞る + `scripts/cf.sh` フォールバック追加 | 主要ライブラリ互換性を温存しつつ、host 一致を保険で確保 | overrides の影響範囲を Phase 2 で検証する必要 |

**採用方針**: (C) を第一候補とする。Phase 2 で互換性を検証し、(A) 単独で済むなら overrides のみ、ダメなら (C) 採用。

## 入出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | host esbuild バージョン要求 (`@opennextjs/aws`)、各 dev 依存の esbuild range |
| 出力 | overrides を含む `package.json` 差分、`pnpm-lock.yaml` 再生成、`build:cloudflare` PASS ログ |
| 副作用 | `pnpm install` で全 esbuild が単一バージョンに再 install される。vite / vitest / wrangler / tsx が同一 esbuild を共有する |

## 受入条件マッピング

| AC | 確認方法 |
| --- | --- |
| AC-1 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` の exit 0 |
| AC-2 | `pnpm why esbuild` と platform binary scan で、OpenNext host と binary の mismatch pair が 0 件 |
| AC-3 | `mise exec -- pnpm typecheck` / `pnpm lint` の green 維持 |
| AC-5 | `git diff pnpm-lock.yaml` の差分レビュー |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | `build:cloudflare` 回復で task-10 以降の visual evidence・deploy 全般が解凍 |
| 実現性 | PASS | overrides 1 行 + cf.sh フォールバック追記の限定範囲 |
| 整合性 | PASS | `scripts/cf.sh` 経路維持、CLAUDE.md 不変条件と一致 |
| 運用性 | PASS | 再現手順を `scripts/cf.sh` ヘッダに追記して将来再発時の手当を短縮 |

## 完了条件

- [ ] mismatch の host / binary それぞれのパスとバージョンが特定されている（2026-05-11 取得済み: host=0.25.4 @ `@opennextjs/aws`、binary=0.21.5 @ top-level `@esbuild/darwin-arm64`）
- [ ] vite/vitest/wrangler/tsx/@opennextjs/aws の各 esbuild range が一覧化されている
- [ ] 解決方針 (A)/(B)/(C) の比較表が記載されている
- [ ] 採用方針が一つに収束している

## 成果物

- `outputs/phase-01/main.md`

## 実行タスク

- 既存 `node_modules` のスキャンと `pnpm why esbuild` の出力取得（read-only）
- 各依存パッケージの esbuild range を `node_modules/<pkg>/package.json` から抽出
- 採用方針の決定

## 参照資料

- `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/index.md`
- `package.json`
- `apps/web/package.json`
- `scripts/cf.sh`
- `.claude/skills/task-specification-creator/SKILL.md`

## 統合テスト連携

NON_VISUAL build toolchain タスクのため、統合テストは `build:cloudflare` PASS ログ + `pnpm why esbuild` / platform binary scan 出力 + `typecheck`/`lint` green で代替する。runtime smoke は task-10-followup-002 の責務。
