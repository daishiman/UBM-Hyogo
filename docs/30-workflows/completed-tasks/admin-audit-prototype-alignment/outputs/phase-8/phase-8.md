# Phase 8: リファクタ

> workflow: admin-audit-prototype-alignment

## 方針

- 新規 primitive は追加しない。
- `AuditLogPanel` 内の link-as-button は `buttonVariants` で閉じる。
- API 404 修復は根因が H2 の場合のみ route mount を最小移動する。H1/H3/H5 は user-gated runtime operation として扱う。

