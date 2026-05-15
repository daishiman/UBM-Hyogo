# G9-2 EmptyState Design

`EmptyState` は既存 children-only 呼び出しを維持し、`icon?` / `title?` / `description?` / `action?` を optional に追加する。`icon` は装飾用途として `aria-hidden="true"` で包む。既存 caller の破壊変更は禁止する。

Acceptance: AC-2 spec_created.

