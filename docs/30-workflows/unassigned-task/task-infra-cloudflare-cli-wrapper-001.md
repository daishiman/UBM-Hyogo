# Cloudflare CLI wrapper (`scripts/cf.sh`) 正式化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-infra-cloudflare-cli-wrapper-001                                         |
| タスク名     | Cloudflare CLI wrapper formalization (`scripts/cf.sh`)                        |
| 分類         | インフラ / リファクタリング                                                   |
| 対象機能     | Cloudflare CLI 実行ラッパーと運用ルール                                       |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | UT-06 (production deploy execution)                                           |
| 発見元       | UT-06 Phase 12 unassigned-task-detection (UNASSIGNED-G)                       |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06 本番デプロイ実行中に以下のブロッカーが発生した:

1. ローカル `wrangler` が `.env` 経由で API token を受け取る経路が未整備
2. グローバル `esbuild` (`~/Library/pnpm/esbuild`) と wrangler 同梱 `esbuild` のバージョン不整合で deploy が失敗
3. `wrangler login` でローカル OAuth トークンを保持する従来運用が「実値を残さない」ユーザー必須要件に違反する

これを回避するため、本ワークツリーで `scripts/cf.sh` を新設し、CLAUDE.md の運用ルール（実値禁止 / 1Password 動的注入 / `wrangler` 直叩き禁止）と Claude Code memory (`feedback_cloudflare_cli_wrapper.md`) を追加した。これらは UT-06 の AC スコープ外のため、独立タスクとして正式化する。

### 1.2 問題点・課題

- `scripts/cf.sh` が UT-06 のサイドエフェクトとして存在しており、独立した spec / テストが無い
- CLAUDE.md「シークレット管理」セクションに追記された運用ルールが未レビュー
- esbuild バージョン不整合の再発が見込まれる（環境依存）
- UT-04 (CI/CD secrets) との整合確認が未実施

### 1.3 放置した場合の影響

- 別開発者が `wrangler` を直接実行し、ローカル OAuth トークン経由の認証を再導入する事故
- AI コンテキストへの実値混入リスクの再発
- esbuild 不整合で再度 deploy がブロックされる

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare CLI 実行を `scripts/cf.sh` ラッパー一本に集約し、運用ルールを正本化する。

### 2.2 最終ゴール（想定 AC）

1. `scripts/cf.sh` が `op run --env-file=.env` + `ESBUILD_BINARY_PATH` + `mise exec --` を一括ラップする
2. `bash scripts/cf.sh whoami` / `d1 list` / `deploy` / `rollback` の代表ケースが PASS する
3. CLAUDE.md に運用ルール（実値禁止 / wrangler 直叩き禁止 / `wrangler login` 禁止）が記載される
4. UT-04 既存資産（CI/CD secrets sync）との整合が確認される
5. Claude Code memory (`feedback_cloudflare_cli_wrapper.md`) と CLAUDE.md が同期する

### 2.3 スコープ

#### 含むもの

- `scripts/cf.sh` の API（subcommand 一覧）と挙動の文書化
- CLAUDE.md「シークレット管理」セクションの正式レビューと反映
- esbuild バージョン不整合の検知と自動解決ロジックの仕様化
- UT-04 secrets sync workflow との衝突有無の確認

#### 含まないもの

- CI/CD ランナー側での同等ラッパー導入（別タスク化判断）
- 1Password Vault 構造の変更

### 2.4 成果物

- `scripts/cf.sh` 仕様メモ
- CLAUDE.md 差分
- 動作確認ログ（whoami / d1 list / deploy --dry-run）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 1Password CLI (`op`) がインストール済み
- mise で Node 24 / pnpm 10 が解決される

### 3.2 依存タスク

- UT-04 (CI/CD secrets and environment sync)

### 3.3 推奨アプローチ

ローカル運用ラッパーの正式化に集中。CI/CD 側ラッパーは別タスク。

---

## 4. 影響範囲

- `scripts/cf.sh` (新規 / 既存)
- `CLAUDE.md`「シークレット管理」セクション
- `~/.claude/projects/.../memory/feedback_cloudflare_cli_wrapper.md`
- 全 Cloudflare 操作タスク（UT-06 以降の deploy / rollback / D1 migration）

---

## 5. 推奨タスクタイプ

infrastructure / refactor

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-G
- 関連ファイル: `scripts/cf.sh`, `CLAUDE.md`, `feedback_cloudflare_cli_wrapper.md`
- 関連タスク: UT-04 (CI/CD secrets sync), UT-06 (production deploy execution)

---

## 7. 備考

UT-06 実行中に必要に駆られて先行導入したが、AC スコープ外のため正式化は本タスクで実施する。
