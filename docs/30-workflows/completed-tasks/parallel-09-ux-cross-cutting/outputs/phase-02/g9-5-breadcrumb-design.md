# G9-5 Breadcrumb Design

`Breadcrumb` は `items: ReadonlyArray<{ label: string; href?: string }>` を受け、`nav[aria-label="breadcrumb"] > ol > li` で描画する。最終項目は `aria-current="page"`、separator は `aria-hidden="true"` とする。

Acceptance: AC-5 spec_created.

