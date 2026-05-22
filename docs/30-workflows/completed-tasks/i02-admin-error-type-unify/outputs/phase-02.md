# Phase 2: 依存・順序設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 目的 | ファイル間 / parallel タスク間の依存と実行順を固定する |
| 入力 | Phase 1 の AC-1..AC-7 と spec-extraction-map |
| 出力 | 実行順序図、p-08/p-10 との関係表、Validation Matrix |

## 目的

本タスクが parallel-08（admin form 系）/ parallel-10（auth redirect 系）と並走する前提で、
**編集対象ファイルの衝突がないこと**と、**完了タイミングの依存関係がないこと** を明文化する。
また、内部の throw → instanceof → test 更新の実行順を Phase 4-7 へ橋渡しする。

## 実行タスク

1. parallel-i02 spec の「並列性」セクション（L158-161）を再確認し、編集対象ファイル衝突を表に固定
2. p-10 redirect logic が catch する class（`AuthRequiredError`）と本タスクの throw 型を突合
3. ファイル間依存（errors.ts / login-redirect.ts → useAdminMutation.ts → useAdminMutation.spec.ts / index.ts）の DAG を確定
4. Validation Matrix（V-1..V-5）を Phase 5+ 用に固定

## 参照資料

- spec.md L158-161（並列性）
- spec.md L132-139（ローカル実行・検証コマンド）
- `apps/web/src/lib/fetch/authed.ts`（依存元、不変）

## 実行手順

1. parallel タスク表（i01..i05）と本タスクの編集対象ファイルを突合
2. p-10 の catch 対象 class 名を spec L104 から特定（`AuthRequiredError`）
3. 内部依存 DAG を Phase 4-7 の実行順として固定
4. Validation Matrix を表として記述

## 統合テスト連携

`AdminMutationHttpError` 廃止後も p-10 redirect logic の動作確認は本タスク DoD 外（spec.md L156）。
ただし integration regression を捕捉する目的で、p-10 完了後に「admin mutation の 401 が redirect を
trigger する int test を 1 件追加」する追補が想定される（spec.md L130）。本仕様書の DoD には
含まない。

## 多角的チェック観点

- 並列衝突: i01/i03/i04/i05 と本タスクの編集対象が重複しないか
- 完了依存: p-10 が未完了でも本タスクは独立完了可能か（spec L161 で独立宣言済）
- 後方互換: `hooks/index.ts` からの export 削除が外部呼び出しを壊さないか（grep ゼロ件で担保）

## サブタスク管理

| ID | 内容 | 状態 |
| --- | --- | --- |
| 2-1 | parallel タスク間の編集ファイル衝突表作成 | done |
| 2-2 | 内部 DAG 確定 | done |
| 2-3 | Validation Matrix 確定 | done |

## 成果物

### parallel タスク間依存

| 関連タスク | 編集対象重複 | 完了依存 | 備考 |
| --- | --- | --- | --- |
| parallel-i01 | なし | なし | 独立 |
| parallel-i03 | なし | なし | 独立 |
| parallel-i04 | なし | なし | 独立 |
| parallel-i05 | なし | なし | 独立 |
| parallel-08（admin form） | なし | なし | `useAdminMutation` 利用側だが API 不変のため独立 |
| parallel-10（auth redirect） | なし | なし | catch 対象 class と `/login?redirect=...` helper を共有し、本タスクで optional redirect DI まで接続する |

### 内部実行順 DAG（Phase 4-7 を駆動）

```
[読取] authed.ts （依存元・不変）
   │
   ▼
[編集 1] useAdminMutation.ts
   ├─ import 追加: AuthRequiredError, FetchAuthedError
   ├─ throw 置換 (401 → AuthRequiredError, それ以外 → FetchAuthedError)
   ├─ instanceof 置換
   └─ AdminMutationHttpError class 定義削除
       │
       ▼
[編集 2] __tests__/useAdminMutation.spec.ts
   ├─ import 切替
   └─ assertion class 切替
       │
       ▼
[編集 3] hooks/index.ts
   └─ AdminMutationHttpError export 削除
       │
       ▼
[検証] typecheck → lint → focused test (useAdminMutation, authed)
```

### Validation Matrix

| ID | コマンド | 期待 exit | 期待出力 / 補足 |
| --- | --- | --- | --- |
| V-1 | `mise exec -- pnpm typecheck` | 0 | type error 0 件（新型での narrowing 成立） |
| V-2 | `mise exec -- pnpm lint` | 0 | lint error 0 件（unused import なし） |
| V-3 | `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` | 0 | 401 / 403 / 5xx の assertion が新 class で PASS |
| V-4 | `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed` | 0 | 既存通過（regression none） |
| V-5 | `rg "AdminMutationHttpError" apps/web/src` | 1 | hit 0 件（完全削除採用） |

## 完了条件

- 並列衝突表が i01..i05 と p-08/p-10 を網羅
- 内部 DAG が Phase 4-7 のサブタスクを駆動可能な粒度
- Validation Matrix が DoD 全項目に対応

## タスク100%実行確認【必須】

- [x] 並列タスク衝突を全件確認
- [x] 内部 DAG を Phase 4-7 駆動可能な形で固定
- [x] V-1..V-5 を DoD と対応付け

## 次Phase

Phase 3: 詳細設計。error class 統合の API 設計、type migration の影響範囲俯瞰、
変更対象ファイル・関数シグネチャ・型定義のマップを記述する。
