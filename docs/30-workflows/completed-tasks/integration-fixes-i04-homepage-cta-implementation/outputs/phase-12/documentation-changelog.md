# Documentation changelog

| Step | 対象 | 変更内容 |
|------|------|---------|
| 1-A | workflow root | `index.md` / root `artifacts.json` / `outputs/artifacts.json` を implementation 実態に合わせて completed 化 |
| 1-A | Phase 11 | `outputs/phase-11/screenshots/` に desktop / mobile / full-page PNG を追加 |
| 1-B | parent spec status | `parallel-i04-homepage-cta/spec.md` を `completed` + canonical workflow pointer へ更新 |
| 1-B | parent artifacts | `integration-fixes/artifacts.json` の i04 を `completed` + canonical workflow pointer へ更新 |
| 1-B | parent index | i04 検出結果と残タスク追跡を completed locally へ更新 |
| 1-C | unassigned-task status | `integration-fixes-i04-homepage-cta.md` を `resolved` へ更新 |
| 2 | apps/web responder URL | `/register` / `/login` の responder URL 直書きを `FORM_RESPONDER_URL` 参照へ集約 |
| 2 | Playwright smoke | public top smoke に CTA 表示と link 属性検証を追加 |

## global skill sync

今回の skill feedback は `outputs/phase-12/skill-feedback-report.md` に記録した。既存 `task-specification-creator` は closed issue canonical workflow recovery / Phase 12 dirty implementation gate を既に持つため、スキル本体の追加編集は不要と判断した。
