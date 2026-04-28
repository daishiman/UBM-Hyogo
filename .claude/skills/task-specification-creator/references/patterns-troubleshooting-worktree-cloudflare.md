# パターン集: トラブルシューティング (worktree × Next.js 16 / Cloudflare wrangler 4.x)

> 親ファイル: [patterns-troubleshooting.md](patterns-troubleshooting.md)
> 分割理由: 親ファイルが 500 行制約に到達したため、UT-06 派生 (2026-04-27) で抽出された worktree / Next.js 16 / wrangler 4.x 系の知見を本ファイルへ責務分離。
> 読み込み条件: Cloudflare デプロイ・worktree でのビルド失敗・wrangler / esbuild エラーを切り分けたい時。

---

## 1. worktree × Next.js 16 (Turbopack) の root 誤検出

- **状況**: 複数 worktree を併走させた状態で `apps/web` を含むタスクを `pnpm build` / `pnpm dev` した時
- **症状**:
  - 親リポや別 worktree の `packages/shared/src/zod/*` が型チェック対象として collected され、当該 worktree の変更とは無関係な型エラーで build が落ちる
  - Turbopack のログに `Inferred project root: <親リポの絶対パス>` が出る
  - `outputFileTracingRoot` が未設定のため Next.js が monorepo root を上方向に探索し、worktree 境界を越える
- **原因**:
  - Next.js 16 の Turbopack は `package.json` / `pnpm-lock.yaml` を起点に root を自動推定する
  - worktree は同一 lockfile を共有しているため、親リポ側を root と誤判定するケースがある
- **対処**:
  - `apps/web/next.config.ts` で **両方** を明示する:
    ```ts
    import path from "node:path";
    const projectRoot = path.resolve(__dirname, "../..");
    export default {
      outputFileTracingRoot: projectRoot,
      turbopack: { root: projectRoot },
      // ...
    };
    ```
  - `projectRoot` は worktree 直下の絶対パス（`__dirname` 起点の相対解決）にすること。ハードコード禁止
- **緊急回避と Phase 12 ペアリング**:
  - 期限内に直せず `typescript.ignoreBuildErrors = true` を投入する場合、**Phase 12 で別 tsc gate（`pnpm typecheck` 単体）を必ずペアリング** する
  - 同 PR 内で「解除予定 Phase / タスク ID」を `documentation-changelog.md` に明記
  - 解除されないまま main へ merge されることを防ぐため、`unassigned-task-detection.md` に UNASSIGNED-G として登録
- **発見日**: 2026-04-27
- **関連タスク**: UT-06 派生 (apps/web build hardening)

---

## 2. Cloudflare wrangler 4.x strict mode (`[env.production]` 必須)

- **状況**: wrangler 4.x で `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` を実行した時
- **症状**:
  ```
  No environment found in configuration with name 'production'
  ```
- **原因**:
  - wrangler 4.x は `--env` 指定時、トップレベル設定だけでは不足し、`[env.<name>]` セクションを **明示** する必要がある
  - 3.x までは top-level 設定が production にも暗黙適用されていた
- **対処**:
  - `wrangler.toml` に `[env.production]` セクションを追加し、トップレベルで定義した値（`d1_databases` / `vars` / `routes` 等）を明示的に二重定義する
  - 二重定義の根拠と意図はファイル冒頭コメントに記載し、誤って top-level 側だけ更新するドリフトを防ぐ
  - 同様に staging を持つ場合は `[env.staging]` も明示する
- **検証**:
  ```bash
  bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run
  ```
- **発見日**: 2026-04-27
- **関連タスク**: UT-06 派生 (wrangler 4.x migration)

---

## 3. esbuild Host/Binary version mismatch (グローバル esbuild との競合)

- **状況**: `wrangler deploy` 実行時、または `pnpm` 経由のビルド時
- **症状**:
  ```
  Error: Host version "X.Y.Z" does not match binary version "A.B.C"
  ```
- **原因**:
  - グローバルにインストールされた `esbuild` バイナリ（Homebrew / npm -g 等）が `PATH` 上で優先される
  - wrangler 同梱の esbuild と Host 側 JS API のバージョンが乖離して mismatch
- **対処**:
  - `ESBUILD_BINARY_PATH` を **wrangler 同梱の esbuild バイナリ** に固定する
  - 手動実行は禁止し、`scripts/cf.sh` 経由に強制集約する（ラッパーが自動で `ESBUILD_BINARY_PATH` を解決）
  - 例:
    ```bash
    # NG: 直接呼び出し
    pnpm wrangler deploy

    # OK: ラッパー経由（ESBUILD_BINARY_PATH 自動注入）
    bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
    ```
- **回帰防止**:
  - CI でも `scripts/cf.sh` を経由させ、ローカル / CI で同一の解決経路を担保
  - グローバル esbuild は外せない場合でも、`PATH` を上書きするのではなく `ESBUILD_BINARY_PATH` 明示で対処
- **発見日**: 2026-04-27
- **関連タスク**: UT-06 派生 (cf.sh ラッパー導入)

---

## 関連参照

- `CLAUDE.md` 「Cloudflare 系 CLI 実行ルール」
- `scripts/cf.sh` (op run + ESBUILD_BINARY_PATH + mise exec の三段ラッパー)
- `apps/web/next.config.ts` (`outputFileTracingRoot` / `turbopack.root` 実装例)
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml` (`[env.production]` 二重定義例)
- `unassigned-task-detection.md` UNASSIGNED-G エントリ
- 親ファイル: [patterns-troubleshooting.md](patterns-troubleshooting.md)
- 関連: [unassigned-task-detection-guide.md](unassigned-task-detection-guide.md) 「正本フォーマット」節
