# apps/web Next.js 16 / Turbopack worktree root 誤検出の恒久対応 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-impl-web-next-config-worktree-root-001                                   |
| タスク名     | apps/web `next.config.ts` worktree root explicit fix                          |
| 分類         | 実装 / 恒久対応                                                               |
| 対象機能     | apps/web ビルド (Next.js 16 / Turbopack on `@opennextjs/cloudflare`)          |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | UT-06 (production deploy execution)                                           |
| 発見元       | UT-06 Phase 12（worktree 並列開発で Turbopack root 誤検出が発生）              |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06 本番デプロイ実行中、`apps/web/next.config.ts` を worktree (`.worktrees/task-...`) 環境でビルドした際、Next.js 16 / Turbopack が monorepo root を誤検出（複数 lockfile 候補を検知 → 上位 root を選択）し、トレースとビルド出力が破損した。これを回避するため次の項目を `next.config.ts` に追加した:

- `outputFileTracingRoot` を worktree 内 monorepo root に固定
- `turbopack.root` を同様に固定
- 一時的に `typescript.ignoreBuildErrors: true` を有効化（本番リリースをアンブロックするため）

これらは UT-06 を通すための応急対応であり、特に `ignoreBuildErrors` は恒久的に維持できない。

### 1.2 問題点・課題

- `ignoreBuildErrors: true` のままでは型エラーが本番に混入する
- `outputFileTracingRoot` / `turbopack.root` の値が worktree path に固定されているとメインリポでビルドした際に矛盾する可能性
- 並列 worktree 開発時の Turbopack root 誤検出は UBM プロジェクト全体で再発する

### 1.3 放置した場合の影響

- 型エラーが silent に本番デプロイされる
- 別 worktree でビルドを試みた開発者が同じ問題に遭遇

---

## 2. 何を達成するか（What）

### 2.1 目的

worktree / メインリポのどちらでビルドしても安全な `next.config.ts` を確立し、`ignoreBuildErrors` を撤去する。

### 2.2 想定 AC

1. `apps/web/next.config.ts` の `outputFileTracingRoot` / `turbopack.root` がパス解決ロジック（`path.resolve(__dirname, "../..")` 等）で worktree / main 両対応
2. `typescript.ignoreBuildErrors` が削除され、型エラーゼロでビルド成功
3. worktree 配下と main の両方で `pnpm --filter @ubm-hyogo/web build:cloudflare` が成功
4. `.open-next/` 出力が壊れない（実トレースが正しい root を起点にする）
5. 並列 worktree でビルドした際、Turbopack root 誤検出が発生しないことを README / docs に明記

### 2.3 スコープ

#### 含むもの

- `apps/web/next.config.ts` のクリーンアップ
- 型エラーの解消（必要なら型定義追加）
- worktree 並列ビルドの動作確認手順を docs 化

#### 含まないもの

- Next.js / Turbopack のバージョンアップ
- `@opennextjs/cloudflare` 設定そのものの変更（UNASSIGNED-A 側）

---

## 3. 影響範囲

- `apps/web/next.config.ts`
- `apps/web` ビルドパイプライン
- worktree 並列開発フロー全体

---

## 4. 推奨タスクタイプ

implementation

---

## 5. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md`（worktree root 誤検出の派生）
- 関連ファイル: `apps/web/next.config.ts`
- 関連タスク: UNASSIGNED-A (`task-impl-opennext-workers-migration-001`)
- Next.js 16 docs: `outputFileTracingRoot`, Turbopack `root` option

---

## 6. 備考

UT-06 では `ignoreBuildErrors: true` で応急的にデプロイを通したため、本タスクで根本解消する。`ignoreBuildErrors` を温存したままリリースを継続すると技術的負債が累積するため、優先度は中で扱う。
