# Phase 7: 統合テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 種別 | 統合テスト |
| 入力 | Phase 5 / 6 PASS |
| 出力 | component spec 統合実行ログ |

## 目的

本タスクは API endpoint 側変更を伴わない（panel 内 throw クラスのみ）ため、E2E / API contract test の新規実行は不要。既存 component spec を**統合実行**（focused ではなく `apps/web` 全 spec）し、他 admin 機能への波及がないことを確認する。

## 実行手順

```bash
# apps/web 配下の全 spec を一括実行（focused とは別の信頼度層）
mise exec -- pnpm -F "@ubm-hyogo/web" test 2>&1 \
  | tee outputs/phase-11/evidence/test-integration.log
```

## 期待結果

- 既存 spec が full PASS（admin / public / hook いずれの spec も回帰なし）
- skipped / todo の新規追加なし

## 含まないテスト

- Playwright E2E: 本タスクは UI 観測差分なし（NON_VISUAL）のため対象外
- API contract test: API endpoint 変更なしのため対象外
- D1 migration test: D1 schema 変更なしのため対象外

## 失敗時の対応

| 症状 | 対応 |
| --- | --- |
| 関係ない spec で fail | git blame で要因 commit を特定。本 spec の変更と無関係なら別 issue に切り出し |
| admin 系の spec で fail | Phase 5 に戻り focused 再実行で再現確認 |

## 完了条件


- [x] Phase 7 の完了条件を満たす証跡が保存されている。
- 統合実行が full PASS
- ログが `outputs/phase-11/evidence/test-integration.log` に保存されている

## 参照資料

- source spec §テスト方針
- Phase 5 出力

## 実行タスク

- Phase 7 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
