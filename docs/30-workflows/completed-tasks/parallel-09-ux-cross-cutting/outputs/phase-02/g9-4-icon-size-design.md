# G9-4 Icon Size Design

`IconSize = "sm" | "md" | "lg" | "xl"` を 12 / 16 / 20 / 24px に対応させる。`ariaLabel` 未指定時は装飾 icon として `aria-hidden="true"`、指定時は `role="img"` を付与する。既存 icon glyph 実装とは責務分離する。

Acceptance: AC-4 spec_created.

