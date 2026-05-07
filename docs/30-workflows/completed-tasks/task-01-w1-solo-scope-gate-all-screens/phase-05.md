# Phase 05: 環境・前提条件（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 05 / 13（環境・前提条件） |
| 推定工数 | 0.02 人日 |
| 依存 Phase | Phase 01..04 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |

---

## 0. 自己完結コンテキスト

task-01 は docs 3 ファイル編集のみのため、必要な環境は最小（Node 24 / pnpm 10 / mise / git / エディタ）。本 Phase で前提条件・必須ツール・ブランチ条件を確定する。

---

## 1. 目的

実装着手前に必要なツール / バージョン / ブランチ / 権限を固定し、Phase 06 で「動かない」事故を回避する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- 必須ツールバージョンが固定（Node 24.15.0 / pnpm 10.33.2）
- ブランチ条件が固定（`feat/*` ワークツリー）
- 検証コマンド `pnpm lint` の実行可能性確認手順
- 権限要件の明示

### 2.2 非ゴール

- ツールのインストール手順（CLAUDE.md `## 開発環境セットアップ` 参照）
- Cloudflare deploy 手順（task 範囲外）

---

## 3. 必須ツール

| ツール | バージョン | 確認コマンド | 用途 |
|-------|-----------|-------------|------|
| mise | 任意 | `mise --version` | Node / pnpm 切替 |
| Node | 24.15.0（`.mise.toml` 固定） | `mise exec -- node -v` | pnpm / lint 実行 |
| pnpm | 10.33.2（`.mise.toml` 固定） | `mise exec -- pnpm -v` | lint タスク |
| git | 2.40+ | `git --version` | diff 確認 / commit |
| ripgrep (rg) | 任意 | `rg --version` | grep 検証（Phase 11） |
| jq | 任意 | `jq --version` | metadata 検証（Phase 11） |

---

## 4. ブランチ条件

| 項目 | 値 |
|------|-----|
| 作業ブランチ | `feat/ui-prototype-alignment-mvp-recovery-task-01` または同等 `feat/*` |
| ベースブランチ | `dev`（PR 先）→ `main`（最終マージ） |
| ワークツリー | `.worktrees/<task-name>/` 推奨（並列開発分離） |
| branch protection | solo 運用ポリシーに従い `required_pull_request_reviews=null`（CLAUDE.md 参照） |

---

## 5. 権限要件

| リソース | 必要権限 | 取得方法 |
|---------|---------|---------|
| `CLAUDE.md` | write | リポジトリ collaborator |
| `docs/00-getting-started-manual/specs/00-overview.md` | write | 同上 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` | write（new file 作成） | 同上 |
| GitHub PR 作成 | `gh auth status` で認証済 | `gh auth login`（CLAUDE.md 参照） |

> Cloudflare / 1Password / Google Forms API 等の secret アクセス権は本タスクでは不要（コード変更ゼロのため）。

---

## 6. 前提条件チェック（着手前）

```bash
# 1. Node / pnpm バージョン確認
mise exec -- node -v   # v24.15.0 期待
mise exec -- pnpm -v   # 10.33.2 期待

# 2. 作業ブランチ確認
git branch --show-current

# 3. ワークツリー位置確認
pwd  # .worktrees/<task-name>/ 配下を期待

# 4. 触る 3 ファイルの存在確認
test -f CLAUDE.md
test -f docs/00-getting-started-manual/specs/00-overview.md
test ! -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # 未存在を期待（new）

# 5. 触らない範囲の clean 確認（diff 0 件）
git status --porcelain
```

---

## 7. プロトタイプ参照表

本 Phase は環境設定のため画面実装はないが、Phase 06 以降で SCOPE.md に prototype path を書く際の正本パスを再固定する。

| 参照 | path |
|------|------|
| OKLch tokens 正本 | `docs/00-getting-started-manual/claude-design-prototype/styles.css` |
| primitives 正本 | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` |
| 公開層 mock | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` |
| 会員層 mock | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` |
| 管理層 mock | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` |

---

## 8. リスク

| リスク | 緩和 |
|-------|------|
| Node バージョン不一致で `pnpm lint` 失敗 | `mise exec --` 経由必須 |
| ワークツリー外（メインディレクトリ）で起動 | CLAUDE.md `ワークツリー作成` 警告参照 |
| SCOPE.md が既に存在（前回未マージ）| `git status` で確認、`git rm` で正本再作成 |

---

## 9. 完了条件（Phase 06 へ進む gate）

- [ ] Node / pnpm バージョン確認 PASS
- [ ] 作業ブランチが `feat/*` 形式
- [ ] 3 ファイルの存在状況が想定通り（2 edit / 1 new）
- [ ] `git status --porcelain` がクリーン（または無関係 diff のみ）

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-01 scope gate の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化の要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照先 |
| workflow 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1 -> W7 DAG |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-05.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
