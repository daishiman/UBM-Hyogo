# Phase 6: 追加 grep / 回帰 guard

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
