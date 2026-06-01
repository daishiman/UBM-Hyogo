# Phase 8: リファクタリング

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **workflow_state: implemented_local_evidence_captured**

## 1. 本タスクのリファクタ範囲（前提）

本タスクは新規 integration spec **1 ファイル**（`apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts`）の追加のみ。
production コード（`auth.ts` / `getAuthView.ts` / `resolveAuthView.ts` / `types.ts`）の変更はゼロ（`buildAuthConfig` は既に export 済）。
したがって重複（duplication）・navigation drift の発生面は最小であり、リファクタ対象はテストコード内部の構成（stub factories / cloudflare mock の配置方針）に限定される。

## 2. リファクタリング判断テーブル

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| production コード | `buildAuthConfig` export 済・`resolveAuthView`/`getAuthView` export 済 | 変更なし | テスト追加のみ。production surface を増やさない（Phase 2 §1 再利用優先と整合） |
| stub provider factories（`GoogleProvider`/`CredentialsProvider`） | 共通 helper への切り出し候補 | spec 内 inline に留める | `auth.spec.ts` が同じ stub factories を局所 inline で持つ既存パターンに倣う。共通化すると 2 spec 間に隠れた結合が生まれ、片方の契約変更が他方へ波及するため過度な共通化を避ける |
| `@opennextjs/cloudflare` mock | shared test helper（mock factory）への切り出し候補 | spec 先頭 `vi.mock` の inline 配置に留める | mock 対象は「Cloudflare context 取得境界」のみで spec ごとに必要範囲が異なる。`auth.spec.ts` の inline mock 慣習に追従し、helper 経由の間接化を避ける（テスト可読性・自己完結性優先） |
| token fixture（`{ memberId, isAdmin, email, name }`） | factory 関数化候補 | TC ごとに inline literal | 5 ケース（TC-AVSC-01〜05）と少数で、fixture の差分が契約の本質。inline の方が「どの入力がどの AuthView を生むか」が読み手に明示される |
| 契約連鎖の重複（`callback → resolveAuthView`） | TC ごとに連鎖を書き下す | 局所 helper（spec 内 private 関数）で 1 箇所に集約 | 同一 spec 内・同一ファイルに閉じた局所抽出は navigation drift を生まない。spec を跨がない範囲の DRY は許容（共通化の弊害なし） |

## 3. リファクタリングしない判断（と根拠）

- **共通 test helper モジュール（`__tests__/helpers/*.ts` 等）は新設しない。** 本サイクルで helper を作ると、対象 spec が 1 ファイルしかなく再利用先が存在しないため、過剰抽象（YAGNI 違反）になる。`auth.spec.ts` の既存スタイル（spec 内 inline helper）に合わせ、共通化は将来 2 つ目以降の integration spec が登場した時点で再検討する。
- **production コード refactor は無し。** `auth.ts` の session callback / `resolveAuthView` の分岐ロジックは現契約を pin する対象であり、テスト追加の都合でリファクタしない（契約 source を動かすと drift 検知の基準点が揺らぐ）。

## 4. navigation / 重複 観点の確認

| 観点 | 結果 |
| --- | --- |
| 同一ロジックの重複追加 | なし（新規 surface ゼロ・既存 export 再利用のみ） |
| import path の navigation drift | なし（`@/lib/auth` / `../resolveAuthView` / `../getAuthView` / `../types` は既存 export パスを踏襲） |
| テスト命名の一貫性 | `<camelCaseSubject>.integration.spec.ts` は `auth-view/__tests__` 配下の既存 `getAuthView.spec.ts` / `resolveAuthView.spec.ts` と整合（Phase 1 §3 命名規則） |

## 完了条件（Phase 8）

- [x] リファクタ対象を `対象/Before/After/理由` テーブルで記録
- [x] stub factories / cloudflare mock を spec 内 inline に留める判断と根拠を記載
- [x] production コード refactor が無いことを明記
- [x] navigation drift / 重複が最小であることを確認
