# Phase 11 canonical evidence path schema

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` |

## 1. なぜこのタスクが必要か（Why）

runtime evidence path が文書ごとに揺れると、実装サイクルで取得した log が Phase 12 の判定条件に結び付かない。

## 2. 何を達成するか（What）

`phase11-evidence-canonical-paths.json` の schema と validator を導入する。

## 3. どのように実行するか（How）

typecheck、lint、test、build、grep-gate、runtime observation の path を JSON で予約する。

## 4. 実行手順

1. evidence path schema を作る。
2. Phase 11 templates へ schema 参照を追加する。
3. compliance check で実体存在を検証する。

## 5. 完了条件チェックリスト

- [ ] schema が存在する。
- [ ] validator が exit 0。
- [ ] Issue #549 の Phase 11 path と一致する。

## 6. 検証方法

schema fixture と `rg` による path 存在確認を実行する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| stale helper artifact | compliance check が schema 参照で実体確認 |

## 8. 参照情報

- `docs/30-workflows/issue-549-cf-audit-ml-production-switch/outputs/phase-11/main.md`

## 9. 備考

individual runtime evidence の取得は含めない。
