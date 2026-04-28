# Phase 6 — テスト拡充サマリ

## Status

completed

## サマリ

Phase 4 で定義した happy-path 中心のテストマトリクスに、失敗パス・回帰ガード・補助コマンドを追加する。implementation タスクのため、本 Phase の成果物は「実装タスクが書くべき追加テストケースの仕様」に限る。

## 追加テスト系統

| 系統 | 目的 |
| --- | --- |
| F1: bypass | `--no-verify` での hook スキップが意図通り動くか |
| F2: 環境欠落 | lefthook バイナリ不在 / `pnpm install` 未実行 |
| F3: 設定 override | `lefthook-local.yml` での開発者個別 override |
| F4: 回帰ガード | post-merge での `indexes/*` 変更が **絶対に発生しない** ことの恒久確認 |

## 失敗パス詳細

`outputs/phase-6/failure-cases.md` を参照。

## 補助コマンド（実装タスクで `package.json` に追加）

| コマンド | 役割 |
| --- | --- |
| `pnpm hooks:doctor` | `lefthook validate` + `.git/hooks/*` の lefthook 由来チェックを束ねる |
| `pnpm indexes:rebuild` | post-merge から分離した明示再生成（Phase 5 で追加済み） |
| `pnpm hooks:reinstall-all-worktrees` | Phase 5 Step 6 をワンコマンド化（任意） |

## 回帰ガード（CI 連携）

GitHub Actions に次の job を追加することを推奨（本タスクでは派生未タスクとして起票、Phase 12 で扱う）。

```yaml
# .github/workflows/verify-hooks.yml（派生タスクで実装）
- name: lefthook validate
  run: pnpm exec lefthook validate
- name: post-merge no side-effect
  run: |
    git merge --no-ff --no-edit origin/main || true
    test -z "$(git status --porcelain | grep -F 'indexes/')"
```

## 完了条件チェック

- [x] F1〜F4 の系統を定義
- [x] failure-cases.md を作成
- [x] 補助コマンド一覧を整理
- [x] CI 連携の回帰ガード方針を提示
