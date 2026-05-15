# Phase 4: 監査スクリプト設計（targeted test 設計）

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## `verify_existing` モードの読み替え

通常の TDD RED ではなく、「監査スクリプトの期待出力」を test fixture として先に固定する。

## 監査コマンド設計

### INV-1: 既存 API のみ
```bash
for task in $(find docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery -maxdepth 3 -name "task-*.md" | sort); do
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
find apps/web/src/components/ui -maxdepth 1 -type f -printf '%f\n' | sort > outputs/phase-5/primitives-current.txt
comm -13 outputs/phase-5/primitives-allowed.txt outputs/phase-5/primitives-current.txt > outputs/phase-5/primitives-unexpected.txt
```

判定モデル:

- `primitives-allowed.txt` は task-10 の 11 primitive（Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner）に、task-19 の full primitive spec と後続 task-11..17 で明示採用された prototype-derived primitive（Chip / Drawer / Modal / Toast / KVList / LinkPills / Search / Segmented / Switch / Textarea）および `icons.ts` / `index.ts` を加えた allowlist。
- `primitives-unexpected.txt` が 0 行なら `COMPLIANT`。
- 1 行以上なら、その file を `VIOLATION` とし、正本化済み追加かどうかを該当 task spec へ trace する。

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
| INV-3 | primitives リストが allowlist 範囲内 | task-19 full spec / task-11..17 で明示採用された prototype-derived primitive は許容 |
| INV-4 | apps/web に D1 binding 参照ゼロ | なし |
| INV-5 | `publicConsent` / `rulesConsent` のみ hit | なし |
| INV-6 | apps/ packages/ から hit ゼロ | docs/ 配下の言及は許容 |

## 監査スクリプト保存先

`docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/audit-runner.sh`
（Phase 4 は設計、Phase 5 が実体保存先と実行 evidence の正本）

## メタ情報
- Phase: 4 / テスト作成
- State: completed

## 目的
監査 runner の検証観点と判定モデルを固定する。

## 実行タスク
- INV-1..6 の grep / diff gate を定義する。
- raw hit / suppressed hit / actionable violation の判定を分離する。

## 参照資料
- `phase-2.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/04-design-system/task-10-w4-par-ui-primitives.md`

## 成果物
- `phase-4.md`

## 完了条件
- [x] INV-1..6 の監査コマンドが定義されている
- [x] audit-runner 保存先が Phase 5 に統一されている

## 統合テスト連携
Phase 5 の audit-runner 実行結果で本 Phase の判定モデルを検証する。
