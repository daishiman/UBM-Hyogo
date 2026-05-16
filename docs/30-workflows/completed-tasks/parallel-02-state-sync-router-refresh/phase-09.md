# Phase 9: 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 受入確認 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | completed |

## 目的

index.md AC-1〜AC-8 を実装完了時点で全て充足することを確認する。

## 9-1. AC チェックリスト

| AC | 内容 | 検証方法 | 期待 |
| --- | --- | --- | --- |
| AC-1 | VisibilityRequestDialog success branch で refresh → onSubmitted → onClose 順に呼ばれる | `git diff` で順序確認 / TC-RR-01 で called 順序確認 | completed (unit PASS) |
| AC-2 | DeleteRequestDialog success branch で同様の順序 | TC-RR-03 | completed (unit PASS) |
| AC-3 | failure 時に refresh が呼ばれない | TC-RR-02 / TC-RR-04 | completed (unit PASS) |
| AC-4 | VisibilityRequestDialog spec に router.refresh 検証ケース追加（green） | `pnpm --filter @ubm-hyogo/web test -- RequestActionPanel.component.spec.tsx` | completed (unit PASS) |
| AC-5 | DeleteRequestDialog spec に同様（green） | 同上 | completed (unit PASS) |
| AC-6 | 既存テスト non-regression | 同上 | completed (focused PASS) |
| AC-7 | Playwright e2e screenshot 取得 | `outputs/phase-11/screenshots/` 確認 | completed (5 screenshots) |
| AC-8 | typecheck / lint / web test PASS | 3 コマンド実行 | completed (typecheck/lint/focused web test PASS) |

## 9-2. 受入操作シナリオ（手動確認）

1. ローカル `pnpm --filter @ubm-hyogo/web dev` 起動
2. `manju.manju.03.28@gmail.com` でログイン → `/profile` 遷移
3. 「公開を停止する」ボタン押下 → dialog open
4. 理由を空欄のまま「申請を送信」押下
5. dialog が閉じ、`RequestPendingBanner`（visibility_request type）が即時表示される
6. ページリロードせず、banner が sticky で表示され続けることを目視
7. 退会申請も同様に検証（test アカウント影響注意）

## 9-3. 異常系シナリオ

1. 既に pending がある状態で再度申請 → 409 → dialog 内 alert 表示 / banner 状態は維持（refresh されない）
2. ネットワーク切断状態で申請 → catch branch → retry CTA 表示 / banner 状態維持

## 実行タスク

- [ ] AC-1〜AC-8 のチェック結果を記録する
- [ ] 受入操作シナリオを実行（実装完了後）
- [ ] 異常系シナリオを実行
- [ ] `outputs/phase-09/acceptance.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/acceptance.md | AC チェック結果 + 操作シナリオ結果 |

## 完了条件

- [x] AC-1〜AC-8 completed、AC-7 screenshot evidence を追記
- [ ] 受入操作シナリオが実施されている
- [ ] 異常系 2 件が確認されている

## 次 Phase

- 次: 10 (リファクタ)
- 引き継ぎ事項: AC 達成状況 / 異常系結果
