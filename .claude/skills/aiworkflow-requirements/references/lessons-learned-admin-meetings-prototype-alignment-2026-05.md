# Lessons Learned: admin-meetings-prototype-alignment

## L-AMTG-001: `spec_created` と implementation complete を混同しない

Implementation workflow でも、コード差分がない仕様 package の完了状態は `spec_created` で閉じる。Phase 4/5 が「本サイクルで実装完了」と読める表現を含む場合は、実装 pending / runtime pending / PR user-gated の境界へ補正する。

## L-AMTG-002: 実装前でも Phase 12 strict 7 は必須

Phase 12 strict 7 は close-out の物理成果物であり、apps/web 実装の有無とは独立して必要。`phase-12.md` だけでは compliance gate が判断できない。

## L-AMTG-003: VISUAL_ON_EXECUTION は screenshot plan と pending metadata を分離する

スクリーンショット予定だけを本文に書くのではなく、`screenshot-plan.json` と `phase11-capture-metadata.json` に pending 状態を記録する。これにより false green を避ける。

## L-AMTG-004: 親 primitive reuse で API/DB churn を避ける

Prototype alignment は見た目の刷新でも、既存 API endpoint / D1 schema を変更しないことが価値になる。Task A/B は `_shared` primitives と既存 mutation/fetch helper を再利用し、過剰な共有 Drawer primitive 化を避ける。
