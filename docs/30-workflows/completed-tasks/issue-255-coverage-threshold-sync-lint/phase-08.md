# Phase 8: エラーパターン / fail-fast / rollback

## 8.1 エラー分類

| ID | パターン | exit | 動作 |
| --- | --- | --- | --- |
| E-1 | 全 source 一致 | 0 | stdout OK 行 |
| E-2 | aiworkflow-requirements と coverage-guard.sh の値不一致 | 1 | stderr DRIFT テーブル + mismatch 行 |
| E-3 | aiworkflow-requirements と codecov.yml の値不一致（codecov.yml 存在時のみ） | 1 | stderr DRIFT テーブル |
| E-4 | aiworkflow-requirements coverage 表行 anchor が見つからない | 2 | stderr `SSOT parse failed` |
| E-5 | aiworkflow-requirements 行内 12 セルの内部不一致 | 2 | stderr `SSOT internal mismatch` |
| E-6 | coverage-guard.sh の `THRESHOLD=` 行が無い | 2 | stderr `executor parse failed` |
| E-7 | codecov.yml が parse 不能（target: 行 0 件 / 内部不一致） | 2 | stderr `codecov.yml parse failed`（drift と区別） |
| E-8 | 引数不正 | 2 | stderr `unknown arg: ...` |
| E-9 | ファイル read 失敗（権限 / 不在） | 2 | Node 由来 ENOENT を catch して `errorKind=parse` / `message` に詰めて exit 2 |

## 8.2 fail-fast 順序

1. 引数 parse（E-8）
2. aiworkflow-requirements read & parse（E-4 / E-5 / E-9）
3. coverage-guard.sh read & parse（E-6 / E-9）
4. codecov.yml の存在判定 → 存在時 read & parse（E-7 / E-9）
5. 値比較（E-1 / E-2 / E-3）

順序は決定論的。SSOT parse は最優先で実行し、drift と parse 不能を必ず区別する。

## 8.3 rollback 戦略

| 局面 | rollback 起点 |
| --- | --- |
| lint が偽陽性で merge 後に dev fail | `feat/issue-255-coverage-threshold-sync-lint` を revert PR で削除 |
| script 自体が壊れて `coverage-threshold-lint` job が他 PR を block | `.github/workflows/coverage-threshold-lint.yml` を一時的に disable PR で `if: false` 化（or 削除） |
| 正本 / 実行設定の片方を急遽変更する必要 | `pnpm lint:coverage-threshold` をローカル実行で drift を確認しつつ、両方を同 PR で揃える |

production runtime / Cloudflare deploy は本タスクに無関係（rollback target version IDs は不要）。

## 8.4 想定 false positive と回避

| 事例 | 回避策 |
| --- | --- |
| 表組みの whitespace 揺れ（`\| 80 \|` vs `\|80\|`） | 正規表現で `\s*` を許容 |
| 行末改行（`\r\n` vs `\n`） | 全 source を `\n` split 前に正規化（`.replace(/\r\n/g, "\n")`） |
| `quality-requirements-advanced.md` 内に同名 row が複数 | 「coverage 表」以外の文脈は 4 列数値の anchor を満たさないため fall-through。最初の hit を採用 |
| `THRESHOLD=80 # comment` | 正規表現は `^THRESHOLD=([0-9]+(?:\.[0-9]+)?)` で number 部のみ抽出 |
| `target: 80.00%` | float 許容、`80 === 80.00`（`Number()` 経由）になるよう number 比較 |
| `codecov.yml` の `threshold: 1%` | Codecov の許容誤差であり coverage gate 閾値ではないため無視し、`target:` のみ比較対象にする |

## 8.5 CI 上の hand-off

| 状態 | レビュアーが取るべき動作 |
| --- | --- |
| exit 1（drift） | stderr 差分テーブルを読み、SSOT 値に合わせて他 source を揃える PR を出す |
| exit 2（SSOT parse failed） | `quality-requirements-advanced.md` の coverage 表が壊れていないか確認、必要なら正本側を修正する |
| exit 2（executor parse failed） | `scripts/coverage-guard.sh` の `THRESHOLD=` 行が消えていないか確認 |
| exit 2（codecov.yml parse failed） | codecov.yml を一時削除して 2-source モードに戻すか、`target:` 行を修正する |

## 8.6 runbook reference

`docs/30-workflows/issue-255-coverage-threshold-sync-lint/index.md` の Runbook セクションに正本/実行設定の対応表と運用手順（書き換え順序）を記載済み。
