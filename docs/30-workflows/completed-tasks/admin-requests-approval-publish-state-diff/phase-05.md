# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 4（テスト作成・Red 設計） |
| 下流 | Phase 6（テスト拡充） |
| 状態 | completed |

## 目的

Phase 4 で設計した TC-XX を Green にする、`/admin/requests` 承認導線の「変更前 → 変更後」公開状態 diff 表示を実装する手順を確定する。具体的には (1) `RequestQueueDetail.tsx` に純粋関数 `formatPublishStateLabel` / `buildPublishStateDiff` を追加し、dl 内に diff 行（`data-diff-side` span + `aria-hidden` 矢印）を新設、(2) `visibility_request`（公開状態遷移）/ `delete_request`（在籍→退会）の意味軸分岐、(3) `RequestQueuePanel.tsx` の `destructiveMessage`（143-148 行）を具体遷移文言へ、(4) `RequestConfirmDialog.tsx`（92 行）の表示条件を `destructiveMessage` 単独へ緩和、(5) `globals.css` に `[data-diff-side]` / `[data-diff-kind]` 強調クラスを追加する。**API / D1 / Google Form / `packages/shared` 型は一切変更しない（AC-7）。新規 primitive 追加ゼロ（AC-6）。HEX 直書きゼロ（AC-5）。使ってよいデータは `publishState` / `isDeleted` / `desiredState` の 3 値のみ。** 本 Phase の手順は後続実装者がそのまま着手できる粒度で `outputs/phase-05/runbook.md` に記述する（コードは実装しない・spec_created）。

## 実行タスク

1. **実装方針概要の確定（CONST_005 集約）**: `outputs/phase-05/main.md` に CONST_005 の 6 項目（①変更対象ファイル一覧 / ②主要関数・型シグネチャ / ③入力・出力・副作用 / ④テスト方針 / ⑤ローカル実行・検証コマンド / ⑥DoD）を集約する。
2. **runbook 作成**: `outputs/phase-05/runbook.md` に「変更対象ファイル一覧テーブル（パス + 新規/編集/削除）」「各ファイル Before/After 責務」「`formatPublishStateLabel` / `buildPublishStateDiff` の TypeScript シグネチャ + 実装スケルトン」「diff 行 DOM スケルトン」「`globals.css` 追加クラス（全色 token・HEX ゼロ）」「`destructiveMessage` 文言生成スケルトン」「`RequestConfirmDialog` 92 行表示条件緩和の差分」「挙動不変温存の確認手順」「ローカル検証コマンド」を書く。
3. **3 値限定の保証手順化**: diff 入力が `memberSummary.publishState` / `memberSummary.isDeleted` / `requestedPayload.desiredState` の 3 値のみであることを runbook に明記し、projection 拡張禁止を保証する。
4. **挙動不変温存の確認手順**: 既存の `会員`（`公開状態: {publishState}`）/ 承認・却下フロー / ルート `/admin/requests` / API パスが不変であることの確認手順を runbook に書く。
5. **検証コマンドの確定**: typecheck / lint / focused vitest（3 spec 限定）/ HEX grep gate / `git diff --name-only -- apps/api packages/shared`（空確認）を runbook に書く。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-02/diff-design.md | DOM / 純粋関数 / CSS の詳細設計（実装者向け） |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/phase-02.md | シグネチャ・DOM・CSS・ダイアログ文言生成の確定設計 |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-03/main.md | 案 A 決定（92 行緩和 / 申請内容 dd 統合） |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-04/test-plan.md | Green 化対象 TC-XX / 追加 spec パス |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | AC-1〜AC-10 / §5 token 要点 / §9 検証コマンド |

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止・projection 不拡張） |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 既存 primitive 再利用（新規 primitive 非追加） |
| 実装パターン | `.claude/skills/aiworkflow-requirements/references/architecture-implementation-patterns-core.md` | client component 内純粋関数 / 副作用なし helper の配置 |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/web/src/styles/tokens.css | `--ubm-color-*` 実在トークン名の確認（accent-ink / text-secondary / text-muted / warn） |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | HEX 禁止ルール |
| 参照 | apps/api/src/routes/admin/requests.ts | projection / `PUBLISH_STATES`（参照のみ・変更しない） |

## 実行手順

### ステップ 1: 実装方針概要（main.md）= CONST_005 集約

`outputs/phase-05/main.md` に以下 6 項目を集約する。

1. **変更対象ファイル一覧**（パス + 新規/編集/削除）

   | パス | 区分 | 変更内容 |
   | --- | --- | --- |
   | `apps/web/src/components/admin/RequestQueueDetail.tsx` | 編集 | `formatPublishStateLabel` / `buildPublishStateDiff` 追加（export）。dl 内に diff 行（`data-diff-side` span + `aria-hidden` 矢印）新設。visibility 時は申請内容 dd を diff 行へ統合 |
   | `apps/web/src/components/admin/RequestQueuePanel.tsx` | 編集 | `destructiveMessage`（143-148 行）を `buildPublishStateDiff` ベースの具体遷移文言生成へ |
   | `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 編集 | 92-94 行の表示条件を `isDestructive && destructiveMessage` → `destructiveMessage`（中身があれば表示）へ緩和。`isDestructive` は警告トーン制御に限定 |
   | `apps/web/src/styles/globals.css` | 編集 | `.admin-state-diff` / `[data-diff-side]` / `[data-diff-kind]` 強調クラス追加（既存トークンのみ） |
   | `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | 編集 | diff 行 assertion 追加 |
   | `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | 編集 | `destructiveMessage` 具体化 assertion 追加 |
   | `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | 編集 | 92 行緩和の追従 assertion 追加 |

   > 新規ファイル追加・削除は原則なし。helper を別ファイル化する場合のみ `apps/web/src/components/admin/` 配下に小 helper（例 `publishStateDiff.ts`）を新規追加してよい（配置は runbook で確定）。新規 `*.spec.tsx` を切る場合は `*.test.tsx` 禁止（不変条件 #8）。

2. **主要関数・型のシグネチャ**（phase-02 / _shared-context §4 を正とする）

   ```typescript
   /** publishState 生値 → 日本語ラベル。未知値は fail-soft で「不明」。throw しない。 */
   function formatPublishStateLabel(state: string): string;
   //   "public" -> "公開" / "member_only" -> "会員限定" / "hidden" -> "非公開" / それ以外 -> "不明"

   type PublishStateDiff =
     | { kind: "visibility"; before: string; after: string }   // 日本語ラベル
     | { kind: "delete"; before: string; after: string };      // "在籍" -> "退会（論理削除）"

   /** note_type で意味軸分岐した diff を構築。対象外 / item=null は null。throw しない。 */
   function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null;
   ```

3. **入力・出力・副作用**: 入力は `RequestQueueItem`（既存 type・`memberSummary.publishState`/`isDeleted`/`requestedPayload.desiredState` の 3 値のみ参照）。出力は日本語ラベル文字列 / `PublishStateDiff | null`。**副作用なし**（純粋関数・fetch / state / DOM 変更なし）。`desiredState` の抽出は既存 `summarizePayload`（12-20 行）の unknown-narrowing パターンを再利用。

4. **テスト方針**: Phase 4 の TC-XX を Green 化。既存 3 spec 追従 + diff 行 / `destructiveMessage` / a11y の新規 assertion を追加。新規 spec は `*.spec.tsx`（`*.test.tsx` 禁止）。

5. **ローカル実行・検証コマンド**（`_shared-context.md` §9 を転記）

   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   # focused vitest（repo ルート基準・3 spec 限定）
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
     apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
     apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
   # design token gate（HEX 直書き検出）
   grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
     apps/web/src/components/admin/RequestQueueDetail.tsx \
     apps/web/src/components/admin/RequestConfirmDialog.tsx \
     apps/web/src/components/admin/RequestQueuePanel.tsx && echo "FAIL" || echo "PASS"
   # apps/api 非変更確認
   git diff --name-only -- apps/api packages/shared   # 空であること
   ```

6. **DoD**: ビルド成功（`mise exec -- pnpm typecheck` exit 0）/ lint exit 0 / focused vitest 3 spec 全 PASS（diff 行・`destructiveMessage`・a11y の新 assertion 含む）/ HEX grep gate = PASS / `git diff --name-only -- apps/api packages/shared` が空 / `verify-design-tokens` CI gate PASS / V01・V02・D01 の 3 ケースで想定 diff（公開→非公開 / 非公開→公開 / 在籍→退会）が表示されることを手動確認（Phase 11）。

### ステップ 2: runbook（runbook.md）

変更対象ファイルテーブル → 各ファイル Before/After 責務 → 純粋関数スケルトン（import 含む・既存 type のみ）→ diff 行 DOM スケルトン → `globals.css` 追加クラス（全 `var(--ubm-color-*)`）→ `destructiveMessage` 文言生成スケルトン → `RequestConfirmDialog` 92 行緩和の差分 → 挙動不変温存の確認手順 → 検証コマンド の順で書く。

### ステップ 3: 後続実装者の着手保証

runbook 単体で「どのファイルをどう変えるか」が自明であること（import 込みスケルトン / 既存 type のみ使用 / 新規 `packages/shared` 型ゼロ / projection 不参照の 3 値限定）を確認する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 実装方針概要 + CONST_005 6 項目集約 |
| ドキュメント | outputs/phase-05/runbook.md | 後続実装者向け実装手順書（ファイル一覧 / スケルトン / CSS / 文言生成 / 92 行緩和 / 検証） |
| メタ | artifacts.json | Phase 5 を completed に同期 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-XX を Green 化する実装単位を runbook の各ファイルにマップ |
| Phase 6 | fail path（未知 publishState / 空 payload / desiredState 欠落）/ 回帰 guard（verify-design-tokens）の前提を提供 |
| Phase 7 | 変更ブロック（`formatPublishStateLabel` / `buildPublishStateDiff`）のカバレッジ対象を提供 |
| Phase 9 | typecheck / lint / focused vitest / HEX grep を実行 |
| Phase 11 | VISUAL の screenshot（V01/V02/D01 の 3 diff レイアウト）取得 |

## 完了条件

- [ ] `outputs/phase-05/main.md` に CONST_005 の 6 項目（①変更対象ファイル一覧 / ②シグネチャ / ③入力・出力・副作用 / ④テスト方針 / ⑤検証コマンド / ⑥DoD）が集約されている。
- [ ] `outputs/phase-05/runbook.md` に「変更対象ファイル一覧テーブル」（パス + 新規/編集/削除）が記載されている。
- [ ] 各ファイルの Before/After 責務 + 変更方針が記載されている。
- [ ] `formatPublishStateLabel(state: string): string` / `buildPublishStateDiff(item): PublishStateDiff | null` の TypeScript シグネチャと実装スケルトン（import 含む・既存 type のみ・throw しない fail-soft）が記載されている。
- [ ] diff 行 DOM スケルトン（`data-diff-side` span + `aria-hidden` 矢印 + `data-diff-kind`）が記載されている。
- [ ] `globals.css` の追加クラスが全て `var(--ubm-color-*)` で記述され、HEX 直書きゼロである（AC-5）。
- [ ] `destructiveMessage` の具体遷移文言生成スケルトンと `RequestConfirmDialog` 92 行表示条件緩和の差分が記載されている（AC-8）。
- [ ] 3 値限定（`publishState`/`isDeleted`/`desiredState`）と projection 不拡張が runbook で保証されている（AC-7）。
- [ ] 挙動不変温存（会員サマリ現在値 / 承認・却下フロー / ルート / API パス）の確認手順が記載されている。
- [ ] ローカル検証コマンド（typecheck / lint / focused vitest / HEX grep / `git diff -- apps/api packages/shared`）が記載されている。
- [ ] Phase 4 の全 TC-XX が runbook のどのファイル変更で Green になるか対応づけられている。
- [ ] artifacts.json の Phase 5 ステータスが completed に整合している。
