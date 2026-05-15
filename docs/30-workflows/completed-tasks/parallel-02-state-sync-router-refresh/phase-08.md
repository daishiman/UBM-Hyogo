# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (受入確認) |
| 状態 | completed |

## 目的

本タスクの完了に合わせて、親 workflow と原典 spec の整合性を保つドキュメント更新範囲を確定する。

## 8-1. 更新対象

| # | パス | 更新内容 |
| --- | --- | --- |
| 1 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md | 「Phase 1-13 仕様書を `docs/30-workflows/parallel-02-state-sync-router-refresh/` に作成」のクロスリンクを spec.md 末尾に追記 |
| 2 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md または進捗 index | parallel-02-state-sync の status を `implemented_local_visual_evidence_captured / Phase 13 blocked_pending_user_approval` として同期 |
| 3 | docs/30-workflows/parallel-02-state-sync-router-refresh/index.md | 本タスクの index（既に作成済） |
| 4 | docs/30-workflows/parallel-02-state-sync-router-refresh/artifacts.json | root state 管理 |

## 8-2. 更新しないもの

| 対象 | 理由 |
| --- | --- |
| `docs/00-getting-started-manual/specs/*.md` | 本タスクは system spec の挙動を変えない（既存 API 不変・OKLch 無関係・D1 不変） |
| `docs/00-getting-started-manual/claude-design-prototype/` | プロトタイプ primitives / tokens に影響なし |
| `apps/web/wrangler.toml` | 設定変更なし |
| `.claude/skills/aiworkflow-requirements/references/` | system 仕様の変更がないため skill 同期不要（Phase 12 で再確認） |
| CLAUDE.md | プロジェクト不変条件に影響なし |

## 8-3. 更新作業の優先度

| 優先 | 対象 | タイミング |
| --- | --- | --- |
| 高 | parallel-02-state-sync-router-refresh/ 配下（本 spec 群） | Phase 0（spec 作成時）= 完了済 |
| 中 | ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md のクロスリンク | Phase 13 PR 時 |
| 中 | ui-prototype-alignment-mvp-recovery 配下の進捗 index | 実装完了 PR マージ後 |

## 実行タスク

- [ ] 更新対象 4 件を表化する
- [ ] 更新しないもの 5 件を明記する
- [ ] 更新タイミングを優先度別に整理する
- [ ] `outputs/phase-08/docs-updates.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/docs-updates.md | docs 更新範囲と除外範囲 |

## 完了条件

- [ ] 更新対象 / 除外範囲が表化されている
- [ ] 優先度別の実施タイミングが記録されている

## 次 Phase

- 次: 9 (受入確認)
- 引き継ぎ事項: docs 更新範囲 4 件 / 除外 5 件
