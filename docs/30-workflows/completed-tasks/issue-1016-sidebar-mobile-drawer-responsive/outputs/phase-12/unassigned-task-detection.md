# Unassigned Task Detection — Issue #1016 Task E: Mobile drawer responsive

未タスク検出は 0 件でも出力必須。current（本サイクルで新規に検出した未タスク化候補）と baseline（既存スコープで既に責務分離済の領域）を分離して記録する。

## 結果サマリ

| 区分 | 件数 | 内容 |
|------|------|------|
| current（新規 未タスク化候補） | 0 | なし |
| baseline（既存スコープ内で解消・未タスク化しない） | 3 | M-1（drawer/aside 差分があり helper 抽出不要）/ M-2（既存 token + opacity で解消）/ M-3（`browserMatchMedia()` 追加で解消） |

## ソース別確認

| ソース | 確認結果 |
|--------|---------|
| 元 spec scope 外 | scope 外領域（layout 置換 / visual baseline commit / shell nav contract 定義）は親 workflow で Task C/D/F/A として既に責務分離済。新規未タスク化なし（baseline） |
| Phase 3 / Phase 10 MINOR | Phase 3 で MINOR M-1 / M-2 / M-3 を記録。判定は下表 |
| Phase 11 発見事項 | focused Vitest 4 files / 21 tests PASS。local screenshot 4 枚 present。staging visual は user-gated `pending`。実行由来の新規未タスクなし |
| TODO / FIXME | 本 workflow spec / 実装コード内に未解決 TODO / FIXME なし |
| describe.skip / it.skip | 本タスク追加 spec に skip なし |

## Phase 3 MINOR の判定（current / baseline 分離）

| ID | 指摘 | 判定 | 区分 |
|----|------|------|------|
| M-1 | drawer children と `<aside>` children のツリー重複 | drawer は close button / expanded nav / overlay footer、aside は collapse toggle / responsive width を持ち差分がある。小規模重複のままの方が抽象の条件分岐より低複雑。未タスク化しない | baseline |
| M-2 | `--ubm-color-overlay-scrim` トークン未確認 | 新規 token を増やさず `bg-[var(--ubm-color-text-primary)] opacity-40` を sibling backdrop に限定して解消。未タスク化しない | baseline |
| M-3 | `is-browser.ts` に matchMedia 正規 getter がない | `browserMatchMedia(query)` を本サイクルで追加し、`window.matchMedia` 不在の jsdom/SSR fallback も focused test で確認。未タスク化しない | baseline |

## 関連タスク差分確認（既存 Task A/C/D/F との重複なし）

| 既存 Task | スコープ | 本 Issue #1016（Task E）との重複 |
|-----------|---------|------|
| Task A | shell nav contract / context / state 基盤 | なし（基盤を消費するのみ。`shell-config.ts` は変更しない） |
| Task C / D | public/member/admin layout の `SidebarShellServer` 置換 | なし（layout 非接触） |
| Task F | visual baseline snapshot の commit | なし（本タスクは local static screenshot のみ） |

結論: 既存 Task と重複なし。新規未タスク化候補は 0 件。
