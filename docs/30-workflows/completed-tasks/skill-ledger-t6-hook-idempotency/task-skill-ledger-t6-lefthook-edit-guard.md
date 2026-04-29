# task-skill-ledger-t6-lefthook-edit-guard — `lefthook.yml` 直編集禁止の grep / pre-commit ガード

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-t6-lefthook-edit-guard |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-6) |
| 種別 | infra / governance / NON_VISUAL |
| 優先度 | LOW |
| 状態 | unassigned |
| GitHub Issue | 未起票（本タスクで起票予定） |

## 背景

CLAUDE.md は `.git/hooks/*` の手書きを禁止し `lefthook.yml` を hook 正本としているが、`lefthook.yml` 自体への偶発的な直編集を機械的に検知する仕組みは存在しない。governance 強化のため、grep ベースまたは pre-commit ベースのガードを追加することが望ましい。任意項目だが、hook 周りの incident 再発時に第一線で効く防壁となる。

## スコープ

### 含む

- `.git/hooks/*` への手書き検出 grep スクリプト（`scripts/lint/check-hook-edits.sh` 想定）
- `lefthook.yml` への直接編集を `pre-commit` 段階で警告 / 拒否する設定
- CLAUDE.md hook 方針セクションへのリンク
- 拒否された場合の代替経路ドキュメント（lefthook の正規更新フロー）

### 含まない

- lefthook 自体の置換
- `pnpm install` の `prepare` 経路（既に `lefthook install` を呼んでいるため）
- T-6 hook 冪等化本体

## 受入条件

- AC-1: `.git/hooks/` 配下に lefthook 以外の手書きが追加されたら CI で fail する。
- AC-2: `lefthook.yml` への変更時にレビュー必須化されるか、明示の確認プロンプトが出る。
- AC-3: 拒否時のメッセージから CLAUDE.md hook 方針へ辿れる。
- AC-4: false positive を最小化する（`lefthook install` 自動配置はガード対象外）。

## 苦戦箇所（記入予定枠）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 実装着手時に記入 |
| 原因 | 実装着手時に記入 |
| 対応 | 実装着手時に記入 |
| 再発防止 | 実装着手時に記入 |

## 参照

- `CLAUDE.md` (hook 方針セクション)
- `doc/00-getting-started-manual/lefthook-operations.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md`
