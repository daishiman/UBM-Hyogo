# Phase 01 Requirements

`VisibilityRequestDialog` と `DeleteRequestDialog` の mutation success path で `router.refresh()` を最初に呼び、続けて `onSubmitted(res.accepted)`、最後に `onClose()` を呼ぶ。

`RequestActionPanel` は refresh を発火しない。親は dialog の提出完了通知を受け取るだけにし、API / D1 / props のシグネチャは変更しない。
