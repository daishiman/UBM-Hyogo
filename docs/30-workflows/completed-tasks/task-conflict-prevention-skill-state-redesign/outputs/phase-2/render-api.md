# Phase 2 設計成果物: Render Script API (FR-3 / NFR-2)

A-2 で生成された fragment を時系列で読みたい開発者向けの集約 view を提供する CLI 仕様。
**読み取り専用・副作用なし**。実装は別タスク。

## 1. コマンド

```
pnpm skill:logs:render [--skill <skill-name>] [--since <ISO8601>] [--branch <name>] [--type <log|event|trace>] [--out <path>]
```

## 2. 入力

- 入力ディレクトリ: `.claude/skills/<skill>/LOGS/`（fragment 群）
- `--skill` 省略時は `.claude/skills/*/LOGS/` を全走査

## 3. 出力

| モード | 出力先 | git tracking |
| --- | --- | --- |
| 既定 | stdout（時系列降順マージ済み Markdown） | なし |
| `--out <path>` | 指定 path に書き出し | `.gitignore` 対象 path のみ許可（さもなくば exit 2） |

出力形式:

```markdown
<!-- skill: aiworkflow-requirements / fragments: 142 / range: 2026-01-01..2026-04-28 -->

## 2026-04-28T10:15:14Z [feat/wt-3] claude / log
本文…

---

## 2026-04-28T10:14:02Z [feat/wt-1] hook / event
本文…
```

各 fragment 本文は `---` 区切りで連結。front matter は H2 ヘッダに変換。

## 4. オプション仕様

| オプション | 値 | 効果 |
| --- | --- | --- |
| `--skill` | skill 名 | 単一 skill の LOGS のみ対象 |
| `--since` | ISO 8601 | `timestamp >= since` のみ |
| `--branch` | branch glob | front matter の `branch` フィールドで絞り込み |
| `--type` | `log` / `event` / `trace` | `type` で絞り込み |
| `--out` | file path | stdout 代わりにファイル出力（gitignore 必須） |

## 5. 動作（O(N) 保証）

1. `LOGS/*.md` を `readdir` で列挙（O(N)）
2. 各 fragment の先頭から front matter を読み込み（fragment 平均サイズに比例で実質 O(N)）
3. `timestamp` で降順 sort（O(N log N)、ただし N < 10⁴ では支配的でない）
4. `--since` / `--branch` / `--type` で stream filter
5. stdout / `--out` に逐次書き出し

## 6. 副作用

- 既定モード: ディスクへの書き込みなし（`git status` 差分 0）
- `--out` モード: 指定 path のみに書き込み。対象が `.gitignore` でなければ拒否
- ロック・ネットワークアクセスなし

## 7. 終了コード規約

| code | 意味 |
| --- | --- |
| 0 | 正常終了（fragment 0 件でも 0） |
| 1 | front matter parse 失敗（fail-fast、対象 path を stderr に出力） |
| 2 | `--out` が gitignore 対象外 |
| 3 | 入力ディレクトリ不存在（`--skill` 指定時のみ） |
| 64 | usage error（不正オプション） |

## 8. 例

```bash
# aiworkflow-requirements skill の直近 7 日のログを stdout へ
pnpm skill:logs:render --skill aiworkflow-requirements --since 2026-04-21T00:00:00Z

# 全 skill 横断で hook 起源イベントのみ
pnpm skill:logs:render --type event --branch 'feat/*'

# 集約 view をローカル可視化用ファイルに書き出し（gitignore 済み path）
pnpm skill:logs:render --skill task-specification-creator --out .claude/skills/task-specification-creator/LOGS.rendered.md
```

## 9. FR-3 / NFR-2 充足根拠

- 既定モード stdout で副作用 0
- `--out` を gitignore 強制し正本 ledger を破壊しない
- ファイル列挙＋front matter 読み込みは N に比例。sort のみ N log N で実質 O(N)
- 1k fragment / 10k fragment で性能線形性を Phase 4 テストで検証
