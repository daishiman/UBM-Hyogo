# Phase 11: 手動テスト検証

## メタ情報

| 項目             | 値                                                              |
| ---------------- | --------------------------------------------------------------- |
| Phase            | 11 / 13（手動テスト）                                           |
| 依存             | Phase 10                                                        |
| visualEvidence   | VISUAL_ON_EXECUTION（UI CTA変更。browser evidence は user-gated） |
| 成果物           | outputs/phase-11/phase-11.md, main.md, manual-smoke-log.md, link-checklist.md, screenshots/public-header-authenticated-component.png |

## 目的

`visualEvidence = VISUAL_ON_EXECUTION` のため、local component evidence と browser evidence boundary を分離する。
代替証跡として focused unit test 結果と local component screenshot を present にし、browser/session smoke は user-gated pending として記録する。

## 実行タスク

- [x] Semantic / A11y 証跡を unit test 結果に紐付ける
- [x] browser smoke（user-gated）の確認手順を `manual-smoke-log.md` に列挙する
- [x] 関連 link を `link-checklist.md` に列挙する

## 統合テスト連携

`(public)` route group 配下（`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`）と
`/profile`（MemberHeader 経由）が Phase 11 の browser smoke 対象範囲。本タスクの focused vitest
（PublicHeader 5 + SessionAwarePublicHeader 2 + layout 3）は統合観点では「公開層ヘッダ ↔ session」の境界回帰を guard する。

`/profile` 自体の手動テストは `ui-prototype-alignment-mvp-recovery` の Phase 11 と連携し、
動線確認（公開層→マイページ）のみ本タスクで補完する。

## 評価層

| 評価層       | 証跡                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| Semantic     | `PublicHeader.spec.tsx`（5 tests green）で nav 構造 / `aria-current` / CTA 状態を検証                          |
| Session      | `SessionAwarePublicHeader.spec.tsx`（2 tests green）で session mapping と pathname island を検証               |
| A11y         | `(public)/layout.spec.tsx` の axe critical 違反 0（`tasks/b3yf29ay0.output`）                                  |
| UX / runtime | staging deploy 後の手動 browser 確認（user-gated）。`manual-smoke-log.md` を参照                              |

## browser smoke（pending / user-gated）

詳細手順は `manual-smoke-log.md` を参照。

## screenshots / browser evidence

Local component screenshot:

- `outputs/phase-11/screenshots/public-header-authenticated-component.png`

Browser/session runtime screenshots are pending user gate. This Phase 11 does not mark authenticated runtime visual evidence as PASS.

## 参照資料

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/screenshots/public-header-authenticated-component.png`
- `tasks/b3yf29ay0.output`（`(public)/layout.spec.tsx` PASS 証跡）
- `tasks/bsvwc4252.output`（typecheck PASS 証跡）

## 成果物

- `outputs/phase-11/phase-11.md`（本書）
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/screenshots/public-header-authenticated-component.png`

## 完了条件

- [x] Semantic / A11y 証跡が unit test に紐付いている
- [x] browser smoke 手順を文書化（実施は user-gated）
- [x] VISUAL_ON_EXECUTION の local evidence / browser evidence 境界を明示
