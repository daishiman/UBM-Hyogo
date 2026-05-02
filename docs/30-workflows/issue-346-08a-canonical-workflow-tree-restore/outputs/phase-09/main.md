# Phase 9: セキュリティ / boundary 検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 9 / 13 |
| Phase 名称 | セキュリティ / boundary 検証 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 8 (CI / 品質ゲート) |
| 次 Phase | 10 (ロールアウト / 後続連携) |
| 状態 | completed |

## 目的

本タスクは docs-only / NON_VISUAL であり、コード boundary（`apps/web` ↔ `apps/api`）には触れない。一方で、編集する markdown / json に secret 値が混入するリスク（path 名・evidence ログ）はゼロではないため、secret hygiene grep を gate 化する。boundary lint は本タスク対象外であることの **判定根拠** を明示する。

## secret hygiene check

### スコープ

| 検査対象 | 理由 |
| --- | --- |
| 編集後の aiworkflow-requirements 3 ファイル | 状態欄 / canonical restoration 注記が secret を含まないか |
| 編集後の 09a / 09b / 09c spec | 参照置換の過程で secret が混入しないか |
| 編集後の unassigned-task md | 参照置換の過程で secret が混入しないか |
| `outputs/phase-11/evidence/*.log` | grep / ls / test 出力が secret を含まないか |

### 検出パターン

```bash
grep -iE '(token|cookie|authorization|bearer|set-cookie|secret|api[_-]?key|client[_-]?secret|hmac)' \
  docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/*.log \
  .claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  || echo PASS
```

期待: `PASS`（0 hit）。hit があれば redaction → 再取得。

### 重要な禁止事項

- 編集差分や evidence に Cloudflare API token / OAuth client secret / HMAC key 等の **値** を載せない。
- 1Password 参照 (`op://...`) も markdown に直書きしない（代わりに `scripts/with-env.sh` の利用方針を文書側で示す）。
- `.env` の中身を `cat` / `Read` で表示しない（CLAUDE.md secret 管理ルールに従う）。

## boundary lint 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| `apps/web` から `apps/api/**` への import が新規発生するか | **NO** | 本タスクは `apps/web` / `apps/api` のソースに触れない（docs-only） |
| `scripts/lint-boundaries.mjs` の禁止トークン更新が必要か | **NO** | 編集対象が docs / json のみのため lint scope 外 |
| 不変条件 #5 への影響 | **無し** | D1 アクセス境界は本タスクで動かさない |

→ 本タスクで boundary lint negative test の取得は不要。判定根拠を `outputs/phase-09/main.md` に記載することで AC-7 / 不変条件 #5 のカバレッジを満たす。

## 不変条件再確認

| 不変条件 | 影響有無 | 確認方法 |
| --- | --- | --- |
| #5 D1 直接アクセス禁止 | 影響なし | 編集 file 一覧に `apps/web/**` / `apps/api/**` が含まれないことを git diff で確認 |
| #6 GAS prototype 昇格禁止 | 影響なし | 編集後の 3 ファイルに `gas-prototype` への昇格表現がないことを grep |
| #7 Form 再回答が本人更新の正式経路 | 影響なし | 編集差分に Form 経路への変更がない |

## secret hygiene 失敗時

| 事象 | 対応 |
| --- | --- |
| evidence ログに secret 検出 | log を再生成（取得コマンドの引数を見直し） |
| aiworkflow-requirements 3 ファイルに secret 検出 | 該当行を redaction（編集案の見直し） |
| 09a-c / unassigned に secret 検出 | 置換差分を見直し |

## 完了条件

- secret hygiene grep PASS（0 hit）
- boundary lint 不要の判定根拠が明示
- 不変条件 #5 / #6 / #7 への影響なしを確認
- `outputs/phase-09/main.md` に記録

## 成果物

- `outputs/phase-09/main.md`
