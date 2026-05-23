# Phase 2: OKLch token mapping

| 用途 | token / className |
|------|------------------|
| schema diff `added` | `bg-success-soft` (`color-mix(in oklch, var(--ubm-color-ok) 8%, transparent)`) |
| schema diff `removed` | `bg-danger-soft` |
| schema diff `changed` | `bg-warning-soft` |
| audit `.delete/.reject` chip | tone=`danger` |
| audit `.create/.confirm` chip | tone=`success` |
| audit `.update/.resolve` chip | tone=`warning` |
| audit `.view` chip | tone=`neutral` |
| その他 | tone=`info` |

## 規律

- HEX 直書き 0 件 (CI gate `verify-design-tokens` + grep `apps/web/src/components/admin apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}` で確認)
- token に該当が無い場合は task-17 では追加せず未タスク化候補へ

## 検証結果 (2026-05-10)

```bash
$ grep -RnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}
(0 件)
```
