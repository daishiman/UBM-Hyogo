# Phase 12 — スキルフィードバック

## 良かった点

- Phase 仕様 (phase-01〜13.md) が「真の論点 → 4 条件 → AC → モジュール」の階層で整理されており、実装の落とし穴を事前にカバーできた
- WAL 非前提の競合対策 (retry / queue / batch / lock) が UT-02 の意思決定を継承する形で記述され、設計判断の再発明を避けられた
- runbook (Phase 5) が Step 0〜5 で完結しており、Secret 登録 → migration → 実装 → smoke → deploy の流れを迷わず辿れた

## 改善余地

- outputs/ 初期テンプレが phase-XX.md 仕様書のコピーで配布されており、ヒューマンエラーで「仕様書のまま提出」してしまう懸念がある (本実装では明示的に書き換えた)
- googleapis SDK を使わない方針 (Workers bundle 都合) を仕様内で明示しておくと、依存導入で迷う時間を削減できる
- Sheets API の pagination が `nextPageToken` 非対応である点をスキル references でも強調しておくと良い

## 次タスクへの提案

- UT-10 で `withRetry` を共通パッケージに昇格させ、4xx の任意 retry も formalize
- UT-21 と統合した admin Bearer middleware を `apps/api/src/middlewares/` に抽出
