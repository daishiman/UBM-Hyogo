# Phase 8 成果物: リファクタリング

source: `../../phase-8-refactor.md` 「本タスクではなし」を踏襲。

`fetchProfile` 相当の page.tsx / opengraph-image/route.tsx 重複は **2 callsite のため抽出しない**（spec §6 判断）。3 callsite 以上になった時点で `apps/web/src/lib/seo/` 配下に共通 helper 化する。

no-op phase.
