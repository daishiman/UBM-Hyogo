# Phase 8 出力: リファクタリング方針

> 状態: `completed`（仕様書作成のみ。コード実装・commit・PR は後続サイクル / user-gated）。

## 1. 方針サマリ

挙動を一切変えず、diff 表示で導入する 2 純粋関数（`buildPublishStateDiff` / `formatPublishStateLabel`）を `RequestQueueDetail`（詳細パネル diff 行）と `RequestQueuePanel`（`destructiveMessage` 文言生成）の双方から**単一実装で共有**できる helper 配置にし、既存 `summarizePayload`（`RequestQueueDetail.tsx:12-20`）に潜む `desiredState` 抽出の重複を解消する。識別子の命名を 1 表に固定し、3 ファイル（+ globals.css）で揺れをなくす。

リファクタは表現層に閉じ、`apps/api` / `packages/shared` の diff は 0、新規 primitive は 0、HEX は 0 を維持する。

## 2. helper 共有配置（案比較・案 B 推奨）

| 案 | 配置 | 採否 | 理由 |
| --- | --- | --- | --- |
| 案 A | `RequestQueueDetail.tsx` から `formatPublishStateLabel` / `buildPublishStateDiff` を named export し `RequestQueuePanel` が import | 不採用 | `RequestQueuePanel` → `RequestQueueDetail`（component）への import が増え、依存方向が逆流（パネルが詳細を内包する関係なのに詳細へ依存）。component 同士の結合が密になる |
| 案 B（推奨） | `apps/web/src/components/admin/requestPublishStateDiff.ts` を新設し純粋関数を集約。両 component が helper を import | **推奨** | 純粋関数を component から切り離し依存方向を一方向化（両 component → helper）。テスト容易性が上がる。helper は component ではないため AC-6（新規 primitive ゼロ）に抵触しない |

### 案 B が export する surface

| export | シグネチャ | 役割 |
| --- | --- | --- |
| `formatPublishStateLabel` | `(state: string) => string` | `public/member_only/hidden/unknown` → `公開/会員限定/非公開/不明`。未知値は fail-soft で「不明」（throw しない） |
| `buildPublishStateDiff` | `(item: RequestQueueItem) => PublishStateDiff \| null` | note_type 分岐で diff を構築。対象外 note_type / item=null は `null` |
| `extractDesiredState` | `(payload: unknown) => string \| null` | payload の unknown-narrowing で `desiredState` を string 抽出。非対象は `null` |
| `PublishStateDiff`（type） | `{ kind: "visibility"; before: string; after: string } \| { kind: "delete"; before: string; after: string }` | diff の判別共用体 |

> `RequestQueueItem` 型は既存（`RequestQueuePanel.tsx:20-34` で定義）。helper はこの型を import 参照するのみで型を新規定義しない（3 値限定の不変条件を helper レベルで担保）。

## 3. `summarizePayload` 重複解消

| 項目 | 現状 | リファクタ後 |
| --- | --- | --- |
| `desiredState` 抽出 | `summarizePayload`（`RequestQueueDetail.tsx:12-20`）内に unknown-narrowing がインライン | `extractDesiredState`（helper）へ一本化。`buildPublishStateDiff` と `summarizePayload` 跡地が同一実装を共有 |
| `visibility_request` の申請内容表示 | `desiredState: hidden` の生英語を dd にテキスト表示 | diff 行（`公開 → 非公開`）へ役割統合し、生英語表示を除去（phase-03 案 A・AC-3 整合） |
| `delete_request` の申請内容表示 | `summarizePayload` で payload（空）を表示 | 理由表示等に役割限定。重複抽出ロジックは残さない |

## 4. 命名規約（固定・3 ファイル + globals.css 共通）

| 種別 | 識別子 | 定義位置 | 利用側 |
| --- | --- | --- | --- |
| 型 | `PublishStateDiff` | `requestPublishStateDiff.ts` | `RequestQueueDetail` / `RequestQueuePanel` |
| 純粋関数 | `formatPublishStateLabel` | `requestPublishStateDiff.ts` | `RequestQueueDetail` / `RequestQueuePanel` |
| 純粋関数 | `buildPublishStateDiff` | `requestPublishStateDiff.ts` | `RequestQueueDetail` / `RequestQueuePanel` |
| 純粋関数 | `extractDesiredState` | `requestPublishStateDiff.ts` | `buildPublishStateDiff` / `summarizePayload` 跡地 |
| DOM 属性 | `data-diff-side="before\|after"` | `RequestQueueDetail.tsx` | CSS / spec セレクタ |
| DOM 属性 | `data-diff-kind="visibility\|delete"` | `RequestQueueDetail.tsx` | CSS / spec セレクタ |
| CSS クラス | `.admin-state-diff` / `.admin-state-diff__arrow` | `globals.css` | `RequestQueueDetail.tsx` |

## 5. navigation / 命名 drift の削減方針

- diff 文言（詳細パネルの `公開 → 非公開` と、ダイアログ `destructiveMessage` の `公開状態を「公開」から「非公開」へ変更します`）が `formatPublishStateLabel` の単一写像を共有することで、ラベル文言が 2 箇所で食い違う drift を構造的に排除する。
- `delete_request` のレコード状態文言（`在籍 → 退会（論理削除）`）も helper の `buildPublishStateDiff` が単一の源になるよう集約する。

## 6. 挙動不変の機械確認方針

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
grep -rn "data-diff-side\|data-diff-kind\|admin-state-diff\|PublishStateDiff" apps/web/src/components/admin/
git diff --name-only -- apps/api packages/shared   # 空であること
```

- PASS 条件: 既存 3 spec が全 PASS（リファクタで FAIL が出れば挙動が変わった証拠 → Phase 5 へ差し戻し）。grep で識別子が 3 ファイルに一貫。`git diff` が空。
