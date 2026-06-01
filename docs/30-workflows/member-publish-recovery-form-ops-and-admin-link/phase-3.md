# Phase 3: フェーズ設計・タスク俯瞰（設計書）

> 設計書作成エージェント Phase 3 成果物。後続タスク仕様書がコード実装可能な粒度になるよう、
> 対象モジュールと想定変更ファイル群を俯瞰する（create-workflow.md「対象モジュール俯瞰を含める」要件）。

## 1. 想定変更ファイル俯瞰（タスク別）

### Task A: 公開状態 backfill 管理 UI
| ファイル | 種別 | 役割 |
|---------|------|------|
| `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | 新規 | dry-run/apply パネル（`useAdminMutation` 経由） |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 編集 | パネルをマウント |
| `apps/web/src/features/admin/diagnostics/types.ts` | 編集 | `BackfillResult` zod schema 追加 |
| `apps/api/src/routes/admin/sync-backfill-publish-state.ts` | 参照のみ（変更なし想定） | 既存 endpoint |
| `*.spec.tsx` | 新規 | パネル component test |

### Task B: 手動フォーム再取込 UI
| ファイル | 種別 | 役割 |
|---------|------|------|
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 新規 | 手動 sync 実行パネル |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 編集 | パネルをマウント（A と同一ファイル・別領域） |
| `apps/api/src/routes/admin/sync.ts` | 参照のみ | 既存 `POST /admin/sync/responses` |
| `*.spec.tsx` | 新規 | パネル component test |

### Task C: 反映タイミング可視化 + SLA doc
| ファイル | 種別 | 役割 |
|---------|------|------|
| `apps/web/src/components/public/ReflectionTimingNote.tsx` | 新規 | 「最終同期/反映目安」表示 primitive |
| `apps/web/app/(public)/members/page.tsx` | 編集 | note をマウント |
| `apps/web/app/(member?)/profile/...` | 編集 | 本人の最終反映時刻 + 公開状態表示 |
| `docs/00-getting-started-manual/specs/03-data-fetching.md` | 編集 | 反映フロー時系列 + SLA 追記 |
| `apps/api`（条件付き） | 編集 | snapshot に `lastSyncAt` 不在時のみ最小拡張 |
| `*.spec.tsx` | 新規 | note component test |

### Task D: 管理画面→Form 回答一覧リンク
| ファイル | 種別 | 役割 |
|---------|------|------|
| `apps/web/src/lib/constants/form.ts` | 編集 | `FORM_RESPONSES_EDIT_URL` 定数追加 |
| `apps/web/src/components/shell/shell-config.ts` | 編集 | `ShellNavItem.external?` + Form 項目（or admin footer リンク） |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | external 時に `<a target=_blank>` 描画 |
| `apps/web/src/components/shell/icons.tsx` | 編集 | `form`/外部リンク icon path 追加 |
| `*.spec.tsx` | 新規 | nav 外部リンク test |

## 2. 各タスクのフェーズ進行（Phase 1-13 マッピング）

各タスク仕様書（tasks/A-D）は単一ファイルで以下を内包する（CONST_005 + Phase 1-13 要点を圧縮）:

| Phase | 内容 | タスク仕様書での章 |
|-------|------|------------------|
| 1 要件 | AC（index.md / phase-1.md から継承） | 「目的 / AC」 |
| 2 設計 | 変更ファイル・シグネチャ・入出力 | 「設計 / 変更ファイル / シグネチャ」 |
| 3 設計レビュー | 不変条件適合・代替案 | 「設計判断」 |
| 4 テスト作成 | 追加 spec とケース | 「テスト方針」 |
| 5 実装 | 差分方針（diff の意図） | 「実装手順」 |
| 6-9 テスト拡張/カバレッジ/リファクタ/QA | コマンド | 「検証コマンド」 |
| 10 最終レビュー | DoD | 「DoD」 |
| 11 手動テスト | Phase 11 evidence 方針（VISUAL） | 「Phase 11 evidence」 |
| 12-13 文書/PR | 親 workflow strict 7 + Phase 13 で集約 | 親 outputs/ |

## 3. 検証ゲート（implemented-local close-out）

- `pnpm --filter @ubm-hyogo/web typecheck`
- focused Vitest（sync schema / reflection timing / sidebar external link）
- `git status` / `git diff --stat` による apps/web + docs 実変更確認
- Phase 12 strict 7 と aiworkflow-requirements same-wave sync
