[実装区分: 実装仕様書]

# Phase 3: 設計レビュー — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 3 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

Phase 2 設計（追加 it 一覧と mock 境界）に対して未カバー branch / リスク / 過不足をセルフレビューし、Phase 5 実装前の手戻りを最小化する。

## 変更対象ファイル一覧

なし（レビュー記録のみ）。Phase 2 設計が更新される場合は phase-02.md を編集する。

## レビュー観点別チェック

### 1. 未カバー branch の追加洗い出し

| component | 残懸念 branch | 対応 |
| --- | --- | --- |
| SchemaDiffPanel | `applyMutation` 失敗 toast、resolved 表示分岐 | Phase 2 の +4 で網羅。OK |
| MemberDrawer | hidden state 切替後の hide button、edit response url 欠落時の no-anchor | hidden 切替は既存ケースに含まれる。`editResponseUrl` 欠落時は no-anchor を 1 件確認 → Phase 2 の anchor ケースで反対分岐確認 (assert `queryByRole('link', { name: /Form 回答編集/ })` is null) を Phase 5 で追加する |
| MeetingPanel | createMeeting reject 時の error 表示 | 既存ケースで網羅。busy disabled は Phase 2 の +3 で追加 |
| AuditLogPanel | mask 対象が null/undefined フィールド、深さ制限 | 深さ制限は実装にないため対象外。null は素通し（既存ケース） |
| TagQueuePanel | search filter 切替（pending/approved/rejected の URL 更新） | 既存 happy で網羅 |
| MembersClient | filter 未指定時の default 表示 | Phase 2 の追加で対応 |
| AdminSidebar | 全リンクで非 active 状態 | 既存ケース網羅 |

### 2. mock 境界の妥当性

- `next/navigation` の `useRouter` mock は describe 単位で reset（`vi.clearAllMocks`）すること → Phase 5 で `afterEach` 統一を確認
- `vi.mock("../../../lib/admin/api", ...)` は path alias を使わず相対パス固定 → 既存規約に整合
- `fetch` stub は `vi.stubGlobal` + `vi.unstubAllGlobals` のペアを徹底

### 3. snapshot 不使用方針の確認

- Phase 2 で snapshot 使用なしを確定済み
- 既存テストにも snapshot は存在しない（git grep で確認 → Phase 5 着手時に再確認）

### 4. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| coverage 計測上、`use client` directive 行が分母に入り 85% 未達 | v8 provider は directive を行カバレッジから除外しない。各 component 残未到達行が 1〜2 行残った場合 Phase 11 で再評価 |
| MemberDrawer で hidden 切替 → 多数 fetch mock 必要 | per-it で `vi.mocked(fetch).mockResolvedValueOnce(...)` を使い分ける |
| MeetingPanel の複数 sessionId ケースが既存 fixture と衝突 | 新規 describe block を追加し fixture 隔離 |
| AuditLogPanel の正規表現テストが over-fitting | 公開仕様（kebab/snake/camel 検出と PHONE_PATTERN 8 文字以上）に基づく assertion のみ |

### 5. 入出力・副作用の再確認

- すべて DOM assertion + mock call assertion で完結
- D1 直叩きなし（mock 越境のみ） → 不変条件 #6 違反なし
- admin boundary は `lib/admin/api` mock で隔離 → 不変条件 #5 違反なし

## テスト方針

- レビュー結果を Phase 5 runbook に反映
- 追加: MemberDrawer に「`editResponseUrl` 欠落時 anchor 不在」確認 1 件 → 合計 +7

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose
```

## 完了条件 (DoD)

- 上記 5 観点それぞれで対応方針 or 対象外判断が記録される
- Phase 2 への追加修正（MemberDrawer +1）が反映候補として確定
- リスクログが Phase 11 検証に引き継がれる

## サブタスク管理

- [x] 未カバー branch レビュー
- [x] mock 境界レビュー
- [x] リスク列挙
- [ ] outputs/phase-03/main.md 作成

## 次 Phase への引き渡し

Phase 4 へ、テスト戦略（vitest config 確認・coverage 実行コマンド・shared mock パターン）の確定を依頼する。

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

- 成果物: `outputs/phase-03/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
