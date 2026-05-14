# Phase 6: 追加 grep / 回帰 guard

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## 追加 grep パターン

| パターン | 目的 |
|---------|------|
| `bg-\[oklch` | OKLch 任意値も検出（tokens.css 経由が望ましい） |
| `process\.env\.` (apps/web 配下) | env 直参照禁止の補助確認 |
| `127\.0\.0\.1:8888` | ローカル限定エンドポイント焼き込み禁止 |
| `new\s+Hono\(\)` (apps/web) | apps/web から API インスタンス化禁止 |

## 回帰 guard

- `INVARIANT-AUDIT.md` の matrix セル数 = 132 であることを `awk` で行・列数チェック
- VIOLATION セルに file:line が必ず付随することを正規表現で検証

## 補助コマンド

```bash
awk -F'|' 'NR>2 && NF>1 {count++} END {print "rows="count}' INVARIANT-AUDIT.md
grep -cE "^\| task-[0-9]{2} \|" INVARIANT-AUDIT.md  # 期待: 22
```

## メタ情報
- Phase: 6 / テスト拡充
- State: completed

## 目的
監査出力の行数、列数、違反数を追加 gate で確認する。

## 実行タスク
- matrix 行数を確認する。
- violations 出力を確認する。

## 参照資料
- `outputs/phase-5/matrix.tsv`
- `outputs/phase-5/violations.md`

## 成果物
- `phase-6.md`

## 完了条件
- [x] matrix が 22 task を含む
- [x] violations が記録されている

## 統合テスト連携
Phase 5 の生成物を追加 grep / row count gate で確認する。
