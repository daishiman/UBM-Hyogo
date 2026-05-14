# Phase 4: 監査スクリプト設計（targeted test 設計）

## `verify_existing` モードの読み替え

通常の TDD RED ではなく、「監査スクリプトの期待出力」を test fixture として先に固定する。

## 監査コマンド設計

### INV-1: 既存 API のみ
```bash
for task in $(find docs/30-workflows/ui-prototype-alignment-mvp-recovery -maxdepth 3 -name "task-*.md" | sort); do
  hit=$(grep -niE "新.*endpoint|新規.*route|schema (追加|変更|migration)|新規 D1" "$task" || true)
  echo "::TASK::$task::HIT::$hit"
done
```

### INV-2: OKLch トークン正本化
```bash
grep -rnE "bg-\[#|text-\[#|border-\[#" apps/web/src || echo "NO_MATCH"
grep -rnE "#[0-9a-fA-F]{6}" apps/web/src --include="*.ts" --include="*.tsx" --include="*.css" \
  | grep -v "tokens.css" || echo "NO_MATCH"
```

### INV-3: primitives 範囲
```bash
ls apps/web/src/components/ui/ 2>/dev/null | sort > .tmp/current-primitives.txt
# task-10 spec で定義された primitives リストとの diff
```

### INV-4: D1 直接アクセス禁止
```bash
grep -rnE "D1Database|env\.DB|DB:.*D1" apps/web/src || echo "NO_MATCH"
grep -nE "\[\[d1_databases\]\]" apps/web/wrangler.toml || echo "NO_MATCH"
```

### INV-5: consent キー統一
```bash
grep -rnE "(publicConsent|rulesConsent|consent[A-Z][a-zA-Z]+)" apps/web/src apps/api/src
# 期待: publicConsent / rulesConsent のみ
```

### INV-6: GAS prototype 本番昇格禁止
```bash
grep -rn "gas-prototype" apps/ packages/ 2>/dev/null | grep -v "^docs/" || echo "NO_MATCH"
```

## 期待結果（test fixture）

| INV | 期待 | 許容例外 |
|-----|------|---------|
| INV-1 | spec で "新 endpoint" 言及ゼロ | "既存 endpoint のみ利用" の記述は OK |
| INV-2 | hit ゼロ、または tokens.css のみ | tokens.css の OKLch / HEX 定義は許容 |
| INV-3 | primitives リストが task-10 範囲内 | task-19 で拡張された場合は spec で確認 |
| INV-4 | apps/web に D1 binding 参照ゼロ | なし |
| INV-5 | `publicConsent` / `rulesConsent` のみ hit | なし |
| INV-6 | apps/ packages/ から hit ゼロ | docs/ 配下の言及は許容 |

## 監査スクリプト保存先

`docs/30-workflows/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-4/audit-runner.sh`
（実体は Phase 5 で実行・evidence を保存）
