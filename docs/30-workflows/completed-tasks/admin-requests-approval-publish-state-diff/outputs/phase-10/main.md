# Phase 10 出力: 最終レビュー（4 条件 + AC 最終確認）

> 状態: `completed`（仕様書作成のみ。判定 Phase であり実装・commit・PR は行わない）。下記は充足「見込み」の判定であり、実装完了・test PASS 済みを主張するものではない。

## 1. 4 条件 最終判定

| 条件 | 判定 | 根拠（Phase 1-9 確定事項） |
| --- | --- | --- |
| 価値性 | ◯ | 承認時の before→after 可視化で誤承認リスク・確認コストを低減。Issue #1188 の課題（何から何へ変わるか不明）に直結 |
| 実現性 | ◯ | 既存 API response の 3 値 + 既存トークン + `data-diff-side` 属性で 1 サイクル完了可能。helper 集約（Phase 8）により diff 文言を詳細パネル / ダイアログで単一実装共有。新 endpoint / primitive / token 不要 |
| 整合性 | ◯ | 責務は `apps/web/src/components/admin/` に閉じ `apps/api` / `packages/shared` diff 0（AC-7）。invariant #5 / ui-prototype #1/#2/#3 を遵守 |
| 運用性 | ◯ | focused vitest（note_type 別 diff・helper unit）+ `verify-design-tokens`（HEX 0）で回帰保護。VISUAL は staging capture（user-gated）で確認 |

## 2. AC-1〜AC-10 最終確認表

| AC | 内容 | 確認手段 | blocker 判定 | Phase 11 screenshot マップ |
| --- | --- | --- | --- | --- |
| AC-1 | visibility の `公開 → 非公開` 強調 1 箇所 | focused vitest（V01 public→hidden / V02 hidden→public の diff DOM）+ staging VISUAL | diff 行が出ない / 2 箇所分離なら blocker（→Phase 5） | `requests-detail-visibility-diff` |
| AC-2 | delete は「在籍 → 退会（論理削除）」で混同なし | focused vitest（D01 の `data-diff-kind="delete"`）+ staging VISUAL | 公開状態 diff 文言が delete に出るなら blocker | `requests-detail-delete-diff` |
| AC-3 | 英語生値非露出（日本語ラベル変換） | focused vitest（`desiredState: hidden` 生英語が出ない）+ `formatPublishStateLabel` unit | 生英語露出なら blocker | （AC-1 と同 screenshot で確認） |
| AC-4 | OKLch トークン正本整合 | token-audit（tokens.css / 09b 照合）・既存トークンのみ | 新規トークン未同期なら blocker（→Phase 9） | — |
| AC-5 | HEX 0 件 / `verify-design-tokens` PASS | grep HEX + `pnpm verify:tokens` | HEX 検出なら blocker（→Phase 5/8） | — |
| AC-6 | 新規 primitive 0 件 | `git status` `components/ui/`（新規は helper のみ） | `components/ui/` 新規追加なら blocker | — |
| AC-7 | apps/api / packages/shared diff 0 | `git diff --name-only -- apps/api packages/shared` | 非空なら blocker（→Phase 5・スコープ是正） | — |
| AC-8 | ダイアログ文言（visibility=具体 / delete=既存退会） | focused vitest（`destructiveMessage` 文言）+ staging VISUAL | 汎用文言のままなら blocker | `requests-confirm-dialog-visibility` |
| AC-9 | a11y（矢印 aria-hidden / dl 構造 / 既存 aria 不変） | focused vitest + grep `aria-hidden` / `aria-label="申請詳細"` | 矢印が読み上げられる / aria 喪失なら blocker | （AC-1 screenshot + a11y 構造検証） |
| AC-10 | 既存 3 spec green / ルート・API パス・セレクタ不変 | focused vitest（3 spec）+ grep セレクタ | 既存 spec FAIL / セレクタ変更なら blocker（→Phase 5/6） | — |

## 3. MINOR / 残課題

- 本タスクは設計レビュー（Phase 3）で MINOR を登録していない（4 条件全◯・代替案は案 A 採用で決着済）。未解決 MINOR は 0 件。
- スコープ外項目（`inferDesiredPublishState` 変更 / projection 拡張 / 他画面波及）は本質的に別責務であり残課題として扱わない（CONST_007 の先送りではない）。

## 4. 最終判定

- 4 条件すべて◯、AC-1〜AC-10 すべてに確認手段が割り当て済み（未割当 0 件）、未解決 MINOR 0 件。
- 充足見込みは GO（詳細は `go-no-go.md`）。ただし全 AC の実証は実装サイクル + staging VISUAL capture（user-gated）で確定する。
