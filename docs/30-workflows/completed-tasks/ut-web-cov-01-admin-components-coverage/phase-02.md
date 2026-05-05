[実装区分: 実装仕様書]

# Phase 2: 設計 — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 2 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

Phase 1 で確定した 7 component に対し、test 設計（モック境界・テストケース構成・ヘルパ抽出方針）を実装可能粒度で定義する。

## 変更対象ファイル一覧

| パス | 変更種別 |
| --- | --- |
| `apps/web/src/components/admin/__tests__/MembersClient.test.tsx` | 編集（既存 4 ケースに 1 件追加） |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx` | 編集（+2 ケース） |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 編集（+4 ケース） |
| `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` | 編集（+6 ケース） |
| `apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx` | 編集（+3 ケース） |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | 編集（+3 ケース） |
| `apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx` | 編集（任意 +1 ケース） |

本体 component（`*.tsx`）は変更しない。

## 主要構造・シグネチャ

### 共通モック境界

```ts
// next/navigation
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// admin API helper
vi.mock("../../../lib/admin/api", () => ({
  postMemberNote: vi.fn(),
  restoreMember: vi.fn(),
}));

// fetch
beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
```

### Component 別設計

#### MembersClient
- 追加: `filter='hidden' で aria-pressed=true`、`filter undefined で 'visible' button が aria-pressed=true`
- 既存ケースで happy/empty/mutation/authz 充足済み
- 入力: `members[]`, `currentFilter`、出力: DOM aria 属性、副作用: `router.push`

#### TagQueuePanel
- 追加 it: `rejected mutation 後 toast=却下完了 と refresh 呼出`、`status=rejected 行で approve/reject 両 button disabled`

#### SchemaDiffPanel
- 追加 it:
  1. `stableKey 既存値あり、suggested 配列なし → input defaultValue が既存値`
  2. `空白のみ stableKey で submit 押下 → fetch 呼出されない`
  3. `active=null で onSubmit 早期 return`
  4. `onSelect 呼出 → 直前 toast がクリアされる`

#### MemberDrawer
- 追加 it:
  1. `postMemberNote reject → error message 表示`
  2. `restoreMember reject → error message 表示`
  3. `削除 cancel → 削除 fetch 未呼出`
  4. `fetch throw → catch して error 表示`
  5. `メモ空白 submit → onPostNote 早期 return`
  6. `editResponseUrl あり → anchor target=_blank, rel="noopener noreferrer"`

#### MeetingPanel
- 追加 it:
  1. `attended state の member 再 add → addAttendance 2回目未呼出`
  2. `複数 sessionId で pickedMember/attended 独立`
  3. `createMeeting busy 中 submit disabled`

#### AuditLogPanel
- 追加 it:
  1. `isPiiKey が kebab-case と snake_case 混在を検出`
  2. `PHONE_PATTERN 8 文字未満は素通し`
  3. `配列要素オブジェクト内の PII フィールドが mask`

#### AdminSidebar
- 追加任意 it: `管理メニュー nav が aria-label 付きで存在する` / `7 件のリンクをラベルと href の組で全件レンダーする`

## 入出力・副作用

- 入力: props（fixtures）、mock fetch response
- 出力: DOM (roles/text/aria)
- 副作用: `pushMock`, `refreshMock`, mock 化 API 関数の call assertion

## ヘルパ抽出方針

- 共通 fixture factory・renderWithRouter 等は YAGNI で追加しない
- 既存 describe 構成を維持し、it のみ追加

## テスト方針

- AAA パターン明示
- snapshot 不使用、`expect(screen.getByRole(...))` / `toHaveBeenCalledWith` で明示 assertion

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 完了条件 (DoD)

- 7 component の test ファイルに追加 it 名が決定
- mock 境界・fixture 形が確定
- Phase 5 着手可能な粒度

## サブタスク管理

- [x] mock 境界決定
- [x] component 別追加 it 設計
- [ ] outputs/phase-02/main.md 作成

## 次 Phase への引き渡し

Phase 3 へ、追加 it 一覧と未カバー branch 候補を渡してセルフレビューを依頼する。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-target-files.txt`

## 成果物/実行手順

- 成果物: `outputs/phase-02/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
