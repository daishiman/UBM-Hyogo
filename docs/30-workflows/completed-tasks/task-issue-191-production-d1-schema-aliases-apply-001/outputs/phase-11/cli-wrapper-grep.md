# CLI Wrapper Grep (EV-11-4)

実行日時: 2026-05-02

## 検査内容

`wrangler d1 migrations apply` の actual invocation が `scripts/`, `apps/`, `packages/` に含まれていないことを確認する。

## 実行結果

```
$ rg -n "wrangler d1 migrations apply" scripts/ apps/ packages/
(no matches)
```
→ ✅ 実行系コードに 0 件

`docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/` 内 hit はすべて以下のいずれかで、actual invocation ではない:
- 検査コマンドそのものを記述する static-check 仕様（`phase-04.md`, `phase-09.md`, `phase-11.md`, `outputs/phase-11/static-checks.md`）
- 本ファイル（cli-wrapper-grep.md）

## 判定

- AC-5（`bash scripts/cf.sh` 経由のみ）✅ PASS
- 異常系 E-1 への接続: 認証失敗時は `scripts/cf.sh whoami` で検知し apply 経路を停止する
