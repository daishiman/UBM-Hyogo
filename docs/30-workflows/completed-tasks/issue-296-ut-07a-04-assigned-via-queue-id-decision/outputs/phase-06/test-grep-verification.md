# Phase 6: テストコード側 grep verification

## (1) test 側に `assigned_via_queue_id` が無いこと（期待: 0 件）

```
$ rg -n "assigned_via_queue_id" --glob '*.spec.ts' apps/ packages/
(出力なし) → OK: 0 hits
```

## (2) `target_type='tag_queue'` の audit assertion（期待: ≥ 1 件）

```
$ rg -n "target_type.*tag_queue|targetType.*tag_queue" --glob '*.spec.ts' apps/
apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts:104      target_type: "tag_queue",
```

→ 1 ヒット。DLQ 経路で queue 追跡 audit が assert されている。

## (3) member_tags fixture / spec の参照箇所

```
$ rg -l "member_tags|memberTags" --glob '*.spec.ts' apps/api/src/
apps/api/src/routes/admin/members.contract.spec.ts
apps/api/src/workflows/tagQueueResolve.contract.spec.ts
apps/api/src/routes/admin/tags-queue.contract.spec.ts
apps/api/src/repository/__tests__/builder.repository.spec.ts
apps/api/src/repository/__tests__/memberTags.repository.spec.ts
```

→ 5 ファイル。いずれも (1) のヒット 0 件と整合し、`assigned_via_queue_id` を期待する fixture / expectation は存在しない。

## (4) 禁止 suffix `.test.ts` の不在

```
$ rg --files apps/api/src/ packages/ | grep '\.test\.ts$'
(出力なし) → OK: no forbidden .test.ts
```

CLAUDE.md 不変条件 #8（`*.spec.{ts,tsx}` のみ）に準拠。

## 結論

テストコード側にもコード変更は不要。ADR 0002 Decision を反映する test fixture / contract spec の
更新は発生しない。
