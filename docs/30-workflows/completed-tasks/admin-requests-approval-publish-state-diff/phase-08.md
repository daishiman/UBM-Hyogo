# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 7（カバレッジ確認） |
| 下流 | Phase 9（品質保証） |
| 状態 | completed |

## 目的

Phase 7 で「AC-1〜AC-10 が未カバーゼロ・既存 3 spec 追従済み」を確認した状態を前提に、**挙動を一切変えずに**コードの重複（duplicate）と命名 drift を削減する方針を確定する。最重要は `buildPublishStateDiff` / `formatPublishStateLabel` の 2 純粋関数を `RequestQueueDetail`（詳細パネル）と `RequestQueuePanel`（ダイアログ文言生成）の**両方から単一実装を共有**できるように helper 配置を確定すること、および既存 `summarizePayload`（`RequestQueueDetail.tsx` 12-20 行）との責務重複を解消することである。本 Phase は仕様書作成（`spec_created`）であり、コード実装・commit・PR は行わない。リファクタ方針と Before/After 構造比較を実装者向け指示形で記述する。

> **不変条件（本 Phase で死守）**: API 変更禁止（`apps/api` / `packages/shared` diff 0）。diff 入力は 3 値（`publishState` / `isDeleted` / `desiredState`）限定。新規 primitive 禁止。HEX 禁止。対象は `apps/web/src/components/admin/{RequestQueueDetail,RequestQueuePanel,RequestConfirmDialog}.tsx` + `apps/web/src/styles/globals.css` のみ。

## 実行タスク

1. **helper 共有配置の確定**: `buildPublishStateDiff` / `formatPublishStateLabel` を `RequestQueueDetail` と `RequestQueuePanel` の双方から参照できる単一実装に集約する配置方針（案 A: `RequestQueueDetail.tsx` から named export / 案 B: `apps/web/src/components/admin/` 配下の小 helper ファイル `requestPublishStateDiff.ts` 新設）を 2 案比較し、後者を推奨として確定する。
2. **`summarizePayload` との重複解消**: 既存 `summarizePayload`（12-20 行）の `desiredState` 抽出ロジック（unknown-narrowing）と `buildPublishStateDiff` 内の同抽出を一本化し、payload narrowing の共通 helper（`extractDesiredState(payload: unknown): string | null`）へ切り出す方針を確定する。
3. **命名一貫性の確定**: diff 関連の識別子（`PublishStateDiff` type / `data-diff-side` / `data-diff-kind` / `admin-state-diff` クラス）の命名規約を 1 表に固定し、コンポーネント間で揺れがないことを保証する。
4. **Before/After 構造比較の作成**: `outputs/phase-08/before-after.md` に `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブルで改修前後の構造を記録する。
5. **挙動不変の確認手段添付**: 各リファクタ行に「Phase 7 の TC 再実行で PASS」「testid / aria-label 維持」「screenshot 差分なし（Phase 11）」のいずれかを確認手段として添える。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md §2 / §4 | helper surface・diff DOM 設計の正本 |
| 必須 | phase-02.md（純粋関数シグネチャ / ダイアログ文言生成） | 共有対象 helper の定義 |
| 必須 | phase-03.md（代替案：ダイアログ diff / 申請内容 dd） | 最終設計の確定事項 |
| 必須 | outputs/phase-07/ac-matrix.md | 挙動不変担保 TC の特定 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | リファクタの挙動不変担保パターン |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 既存 primitive 集約・新規 primitive 禁止（AC-6） |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（AC-7 裏取り） |

### プロジェクト spec

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/web/src/styles/tokens.css | `var(--ubm-color-*)` 参照先（クラス整理時の token 確認） |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog（新規 primitive 非追加の裏取り） |
| 参照 | apps/web/src/components/admin/RequestQueueDetail.tsx | helper export 元・`summarizePayload` 重複元 |
| 参照 | apps/web/src/components/admin/RequestQueuePanel.tsx | `destructiveMessage` 生成箇所（143-148 行）helper 利用側 |

## 実行手順

### ステップ 1: helper 共有配置の確定（推奨 = 小 helper ファイル）

- `outputs/phase-08/main.md` に 2 案を比較表で記録し、**案 B（`apps/web/src/components/admin/requestPublishStateDiff.ts` 新設）を推奨**として確定する。
  - 案 B 採用理由: `RequestQueueDetail` ↔ `RequestQueuePanel` の循環 import を避け、純粋関数を component から切り離してテスト容易性を高める。新規ファイルは helper（component ではない）であり AC-6（新規 primitive ゼロ）に抵触しない。
  - export 内容: `formatPublishStateLabel(state: string): string` / `buildPublishStateDiff(item): PublishStateDiff | null` / `type PublishStateDiff` / `extractDesiredState(payload: unknown): string | null`。
- 案 A（`RequestQueueDetail.tsx` から named export）を採らない理由も併記する（`RequestQueuePanel` → `RequestQueueDetail` の component import が増え依存方向が逆流するため）。

### ステップ 2: `summarizePayload` 重複解消

- `RequestQueueDetail.tsx:12-20` の `summarizePayload` 内 `desiredState` 抽出（`payload && typeof payload === "object" && !Array.isArray(payload)` の narrowing）を `requestPublishStateDiff.ts` の `extractDesiredState` へ一本化する方針を `before-after.md` に記す。
- `summarizePayload` は `visibility_request` では diff 行へ役割統合（phase-03 案 A）されるため、`delete_request` の理由表示等に役割を限定する。重複抽出ロジックを残さない。

### ステップ 3: 命名一貫性の固定

- diff 関連識別子の命名規約表を `outputs/phase-08/main.md` に固定する（下記「命名規約」）。
- `RequestQueueDetail` の DOM 属性（`data-diff-side` / `data-diff-kind`）、`globals.css` のクラス（`.admin-state-diff` / `.admin-state-diff__arrow`）、helper の型名（`PublishStateDiff`）が 3 ファイルで揺れないことを確認手段として grep を添える。

### ステップ 4: Before/After 構造比較

- `outputs/phase-08/before-after.md` に最低 4 行（helper 共有配置 / `summarizePayload` 重複解消 / 命名一貫性 / diff 行 DOM 統合）を含む 5 列テーブルを作成する。

### ステップ 5: 挙動不変の機械確認

```bash
# 挙動不変（diff 構造リファクタ後も既存 3 spec が PASS する方針）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
# 命名一貫性（識別子が 3 ファイルで揺れない）
grep -rn "data-diff-side\|data-diff-kind\|admin-state-diff\|PublishStateDiff" \
  apps/web/src/components/admin/
# API 非変更（リファクタが表現層に閉じる）
git diff --name-only -- apps/api packages/shared   # 空であること
```

## 命名規約（本 Phase で固定・3 ファイル共通）

| 種別 | 識別子 | 定義位置 | 利用側 |
| --- | --- | --- | --- |
| 型 | `PublishStateDiff` | `requestPublishStateDiff.ts` | `RequestQueueDetail` / `RequestQueuePanel` |
| 純粋関数 | `formatPublishStateLabel` | `requestPublishStateDiff.ts` | `RequestQueueDetail` / `RequestQueuePanel` |
| 純粋関数 | `buildPublishStateDiff` | `requestPublishStateDiff.ts` | `RequestQueueDetail` / `RequestQueuePanel` |
| 純粋関数 | `extractDesiredState` | `requestPublishStateDiff.ts` | `buildPublishStateDiff`（内部）/ `summarizePayload` 跡地 |
| DOM 属性 | `data-diff-side="before\|after"` | `RequestQueueDetail.tsx` | CSS セレクタ / spec セレクタ |
| DOM 属性 | `data-diff-kind="visibility\|delete"` | `RequestQueueDetail.tsx` | CSS セレクタ / spec セレクタ |
| CSS クラス | `.admin-state-diff` / `.admin-state-diff__arrow` | `globals.css` | `RequestQueueDetail.tsx` |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | リファクタ前の TC 全 PASS を不変基準として参照 |
| Phase 9 | helper 集約後の `globals.css` `.admin-state-diff` ブロックを token-audit（HEX ゼロ）の対象にする |
| Phase 11 | screenshot 差分なし（挙動不変）を VISUAL で確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタ方針（helper 共有配置 / `summarizePayload` 重複解消 / 命名一貫性）+ 命名規約表 |
| ドキュメント | outputs/phase-08/before-after.md | 対象/Before/After/理由/挙動不変確認 の 5 列テーブル |
| メタ | artifacts.json | Phase 8 を completed に同期 |

## 完了条件

- [ ] `outputs/phase-08/main.md` に helper 共有配置（案 B 推奨）と `summarizePayload` 重複解消の方針が書かれている
- [ ] `outputs/phase-08/before-after.md` が `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブル形式である
- [ ] テーブルに最低 4 行（helper 共有配置 / `summarizePayload` 重複解消 / 命名一貫性 / diff 行 DOM 統合）が含まれる
- [ ] 各行に「挙動不変であること」の確認方法が添えられている
- [ ] 命名規約表が固定され、`PublishStateDiff` / `data-diff-side` / `data-diff-kind` / `admin-state-diff` が 3 ファイルで揺れない方針が記されている
- [ ] リファクタ後も Phase 7 の既存 3 spec が全 PASS する方針が記されている
- [ ] 新規 primitive 追加ゼロ・HEX 非増加・`apps/api` / `packages/shared` diff ゼロ（AC-5 / AC-6 / AC-7）がリファクタで維持される方針が記されている
- [ ] artifacts.json の Phase 8 ステータスが completed に整合している
