# Phase 11 canonical evidence path schema

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |

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

### 単体検証

```bash
test -f docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/phase11-evidence-canonical-paths.json
jq '.runtimeObservation // empty' docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/phase11-evidence-canonical-paths.json
```

期待: typecheck / lint / test / build / grep-gate / runtime observation の canonical path が JSON で予約されている。

### 統合検証

```bash
rg -n "phase11-evidence-canonical-paths|runtime observation|grep-gate" \
  .claude/skills/task-specification-creator/references/phase-template-phase11.md \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/phase12-task-spec-compliance-check.md
```

期待: template と compliance check の path 名が一致する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| stale helper artifact | compliance check が schema 参照で実体確認 |
| evidence path drift | schema を先に固定し、実ログは schema に従って配置する |

## 8. スコープ

### 含む

- `phase11-evidence-canonical-paths.json` schema。
- Phase 11 templates への schema 参照。
- compliance check での実体存在検証。

### 含まない

- individual runtime evidence の取得。
- gate metadata schema（followup-04）。
- production switch 実行。

## 9. 苦戦箇所【記入必須】

- 対象: Phase 11 runtime evidence path。
- 症状: log path が文書ごとに揺れると Phase 12 が PASS 判定に使う証跡を見失う。
- 対策: canonical path schema を作り、compliance check が schema と実体の両方を検証する。

## 10. 参照情報

- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/main.md`

## 11. 備考

individual runtime evidence の取得は含めない。
