# Phase 8: テスト実装 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 8 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。なお検証スクリプト（bash）は本仕様書配下では「補助 verifier」として扱い、アプリケーションコードには該当しない。

## 目的

Phase 7 の検証ルールを `scripts/verify-09a-prototype-line-ranges.sh` として実装し、CI 互換に整備する。

## 実行タスク

1. `scripts/verify-09a-prototype-line-ranges.sh` を新規作成する。完了条件: 4 軸の検証が 1 スクリプトで実行される。
2. スクリプトは `set -euo pipefail` で記述し、各検証で fail 時に非 0 終了する。
3. 検証出力を `outputs/phase-08/main.md` に検証ログとして残す形に整える。

## 検証スクリプト構造（草案）

```bash
#!/usr/bin/env bash
set -euo pipefail

F=docs/00-getting-started-manual/specs/09a-prototype-map.md
PROTO=docs/00-getting-started-manual/claude-design-prototype

# 7.1 markdown 構造
[ "$(grep -cE "^\| \`(/|\(public\)|\(admin\)|app/).*` \|" "$F")" -eq 19 ] || { echo "FAIL: routes != 19"; exit 1; }
[ "$(grep -cE "^\| .* \| .*\.jsx \| L[0-9]" "$F")" -ge 25 ] || { echo "FAIL: line-range table < 25"; exit 1; }
[ "$(grep -cE "^### 5\\.[1-8]" "$F")" -eq 8 ] || { echo "FAIL: derivation rules != 8"; exit 1; }

# 7.4 不採用
[ "$(grep -c "不採用" "$F")" -ge 4 ] || { echo "FAIL: 不採用 < 4"; exit 1; }

# 7.2 行範囲整合（sample）
sed -n '4p' "$PROTO/pages-public.jsx" | grep -q "LandingPage" || { echo "FAIL: LandingPage L4 mismatch"; exit 1; }

echo "OK: 09a-prototype-map.md verifier passed"
```

## 参照資料

- Phase 7 の 4 軸検証ルール
- task-07 §6, §7

## 依存 Phase 成果物参照

- Phase 5 / 6 / 7 outputs
- `docs/00-getting-started-manual/specs/09a-prototype-map.md`

## 多角的チェック観点

- スクリプトは read-only（prototype / spec を変更しない）
- 失敗時の exit code を CI が捕捉可能
- bash + grep + sed のみで動作（追加依存なし）

## サブタスク管理

- [ ] `scripts/verify-09a-prototype-line-ranges.sh` 新規作成
- [ ] 4 軸検証を全実装
- [ ] 実行 → 全 PASS を確認
- [ ] 実行ログを outputs/phase-08/main.md に記録

## 成果物

- outputs/phase-08/main.md
- scripts/verify-09a-prototype-line-ranges.sh

## 完了条件

- [ ] スクリプト exit 0 で全検証 PASS
- [ ] §3 routes 19 exactly / §6 25+ / 派生ルール 8 / 不採用 4+ が機械検証される

## 次 Phase への引き渡し

Phase 9 へ、検証 PASS した `09a-prototype-map.md` と検証スクリプトを統合検証入力として渡す。
