# Phase 9: 品質保証ゲート

## ゲート判定

| ゲート | 期待 | 確認方法 |
|--------|------|---------|
| line budget | spec ファイル各 80-400 行目安 | `wc -l outputs/phase-*/*.md` |
| link 整合性 | 内部 link がすべて解決する | `grep -rE '\]\([^)]+\)' outputs/ runbooks/` で参照先存在確認 |
| mirror parity | `.claude` / `.agents` の mirror なし（本タスクはスキル更新を含まない） | N/A |
| 命名一貫性 | shell / TS / yaml / runbook のすべてが kebab-case | 目視 + `find` |
| secret 漏洩 | bearer 値 / API token 値が文書に含まれない | `grep -rE '(eyJ[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|cfp_[A-Za-z0-9]{20,})' outputs/ runbooks/` で 0 件 |
| 不変条件遵守 | CLAUDE.md の 8 項目（D1 binding / wrangler 経由禁止等） | Phase 2 / Phase 5 の表で確認 |
| user_gated 明記 | secret 投入 / workflow rerun / commit / push / PR がすべて user-gated に列挙 | `artifacts.json` の `user_gated` array |

## ファイル削除確認（FB-UI-02-1 準拠）

- `scripts/smoke/provision-staging-secrets.sh` の削除は `git mv` ベース。残存 import / 参照が 0 件であることを `grep -rn "provision-staging-secrets" .` で確認する手順を Phase 5 に明記済み

## NON_VISUAL 環境ブロッカー分離（WEEKGRD-01 準拠）

| カテゴリ | 内容 |
|---------|------|
| source-level PASS | spec ファイル全件 lint clean、link 解決 OK |
| 環境ブロッカー | 本タスクは spec 生成のみのため runtime 環境依存なし。実装時の esbuild / wrangler / KV binding 整合は実装タスクで確認 |

## 完了条件

- 全ゲートに判定方法が定義されている
- 環境ブロッカー / source-level の分離が記録されている

## 成果物

- `outputs/phase-09/quality-gate.md`（本ファイル）

## 次 Phase 入力

- Phase 10: 最終レビュー
