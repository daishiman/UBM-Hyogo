# Phase 2: 設計

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## 監査アーキテクチャ

```

## メタ情報
- Phase: 2 / 設計
- State: completed

## 目的
監査 matrix と evidence 生成の設計を固定する。

## 実行タスク
- 22x6 matrix の列とセル分類を設計する。
- Phase 5 evidence の保存先を設計する。

## 参照資料
- `phase-1.md`
- `outputs/phase-5/audit-runner.sh`

## 成果物
- `phase-2.md`

## 完了条件
- [x] matrix 構造が定義されている
- [x] evidence 保存先が定義されている

## 統合テスト連携
Phase 5 の audit-runner が本設計を実装する。
[task spec files] ─┐
                   ├─► [audit-runner.sh] ─► [matrix builder] ─► INVARIANT-AUDIT.md
[apps/web source] ─┤                      │
[apps/api source] ─┤                      └─► grep-evidence.txt
[wrangler.toml]   ─┘
```

責務境界:
- **Collector**: ファイル列挙と grep 実行
- **Classifier**: COMPLIANT / VIOLATION / N/A の判定
- **Reporter**: matrix と evidence の Markdown 出力

## 監査ルール表（INV → 検査ロジック）

| INV | 検査対象 | コマンド / 手順 | COMPLIANT 条件 | VIOLATION 条件 | N/A 条件 |
|-----|----------|---------------|---------------|---------------|---------|
| INV-1 | task spec の "API 追加" / "endpoint 新規" / "D1 schema 変更" 言及 | `grep -niE "新.*endpoint\|新規.*route\|schema (追加\|変更\|migration)" <task-spec>` | 言及なし、または明示的に "既存 endpoint のみ" | 新 endpoint / schema 追加の記述あり | API/D1 非関与タスク（task-01, 06-08, 18 等） |
| INV-2 | apps/web 配下の HEX 直書きと任意値 class | `grep -rnE "bg-\[#\|text-\[#\|border-\[#" apps/web/src` および `grep -rnE "#[0-9a-fA-F]{6}" apps/web/src/**/*.{ts,tsx,css}` | hit ゼロ、もしくは tokens.css のみ | tokens.css 以外で hit | UI 非関与タスク |
| INV-3 | task spec で "新 primitive" / "新規コンポーネント作成" の言及 | `grep -niE "新規.*primitive\|新.*コンポーネント" <task-spec>` および `ls apps/web/src/components/ui/` を task-10 の primitives list と diff | task-10 primitives リスト内 | 未掲載 primitive を勝手に追加 | primitive 非関与タスク |
| INV-4 | apps/web 配下の D1 binding 参照 | `grep -rnE "D1Database\|env\.DB" apps/web/src` および `grep -nE "\[\[d1_databases\]\]" apps/web/wrangler.toml` | hit ゼロ | apps/web から D1 binding 直参照 | apps/api 限定タスク |
| INV-5 | consent キー命名 | `grep -rnE "consent" apps/web/src apps/api/src` でキー名抽出 | `publicConsent` / `rulesConsent` のみ使用 | `consent1` / `agreement` 等の別名使用 | consent 非関与タスク |
| INV-6 | GAS prototype 参照 | `grep -rn "gas-prototype" apps/ packages/ | grep -v docs/` | apps/packages から参照なし | apps/packages 配下から import / 参照 | GAS 非関与タスク |

## SubAgent lane（並列実行設計）

3 並列以下:
1. lane-A: INV-1 / INV-3 / INV-6 （仕様書 grep 系）
2. lane-B: INV-2 / INV-4 （ソースコード grep 系）
3. lane-C: INV-5 （consent キー横断確認）

validation lane（直列）: matrix builder → reporter

## ライブラリ採用

- shell builtins (`grep`, `find`, `awk`) のみ
- 外部依存追加なし

## 出力フォーマット

`INVARIANT-AUDIT.md`:

```markdown
# UI Prototype Alignment / MVP Recovery — Invariant Audit

## Matrix (22 task × 6 invariant)

| Task | INV-1 | INV-2 | INV-3 | INV-4 | INV-5 | INV-6 |
|------|-------|-------|-------|-------|-------|-------|
| task-01 | COMPLIANT | N/A | N/A | COMPLIANT | N/A | COMPLIANT |
| ... |

## Violations

### task-XX × INV-Y
- file: `path/to/file:LINE`
- 引用: `<code line>`
- 理由: ...

## Evidence
（grep 結果は outputs/phase-5/grep-evidence.txt 参照）
```
