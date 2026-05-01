# task-ut02a-canonical-metadata-diagnostics-hardening-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | unassigned |
| Priority | Medium |
| Source | ut-02a-section-field-canonical-schema-resolution |
| Type | implementation-hardening |
| Created | 2026-05-01 |

## なぜこのタスクが必要か（Why）

UT-02A では `MetadataResolver` と static manifest baseline により、section / field kind / label の旧 fallback を削除した。一方で、03a alias queue 完成前は manifest が暫定正本であり、manifest stale detection、再生成手順、03a 接続後の廃止条件を運用できる形にする必要がある。

## 何を達成するか（What）

- `apps/api/src/repository/_shared/generated/static-manifest.json` の生成元、生成時刻、再生成コマンド、廃止条件を機械検証できる形にする。
- `buildSectionsWithDiagnostics()` の unknown stable key 件数を Phase 11 / CI evidence に出せるようにする。
- 03a alias queue adapter 接続時の contract test を追加する。
- static manifest を 03a / D1 canonical source へ移行する条件を明文化し、満たしたら廃止する。

## どのように実行するか（How）

1. manifest 生成スクリプト、または手順を `scripts/` / workflow-local runbook のどちらに置くか決める。
2. manifest に source spec version と generatedAt を持たせる。
3. `buildSectionsWithDiagnostics()` の diagnostics を smoke evidence に出すテストまたはログを追加する。
4. 03a alias queue adapter の dryRun success / failure contract test を追加する。
5. aiworkflow-requirements と UT-02A Phase 12 guide を更新する。

## 完了条件チェックリスト

- [ ] manifest 再生成手順が決定論的に実行できる。
- [ ] stale manifest を検出できる。
- [ ] unknown stable key diagnostics が repository chain の evidence に残る。
- [ ] 03a adapter contract test がある。
- [ ] 03a 完成後の static manifest retirement 条件が正本仕様に反映されている。

## 検証方法

```bash
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose
mise exec -- pnpm typecheck
```

## リスクと対策

| リスク | 対策 |
| --- | --- |
| manifest が正本仕様から drift する | generatedAt / source spec version / regeneration command を evidence 化する |
| unknown stable key を UI 安全隔離だけで見逃す | diagnostics を Phase 11 evidence と CI に出す |
| 03a 接続後も static manifest が残り続ける | retirement 条件を task completion gate にする |

## 参照情報

- `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/`
- `apps/api/src/repository/_shared/metadata.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `apps/api/src/repository/_shared/generated/static-manifest.json`

## 苦戦箇所【記入必須】

旧 fallback を消すだけなら小さいが、static manifest は暫定正本である。短期の安全性と長期の正本移行を混ぜると責務が曖昧になるため、diagnostics と retirement を独立タスクに分離する。

## スコープ（含む/含まない）

含む: manifest stale detection、diagnostics evidence、03a adapter contract test、retirement 条件。

含まない: 03a 本体実装、D1 migration apply、本番データ修正。
