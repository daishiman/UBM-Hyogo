# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 |
| 次 Phase | 7 |
| 状態 | spec_created |

## 目的

fresh GET evidence 不在、GitHub実値と期待値の乖離、index再生成失敗、mirror drift、Issue状態誤操作を異常系として扱う。

## 実行タスク

1. placeholder evidence の検出結果を記録する。
2. contexts差分の扱いを定義する。
3. mirror drift の扱いを定義する。
4. Issue #303 操作禁止の確認を行う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | phase-05.md | 実行手順 |
| Issue | #303 | closed維持 |

## 実行手順

| 異常 | 検出 | 対応 |
| --- | --- | --- |
| applied JSON が placeholder | `.status == "blocked_until_user_approval"` | Phase 5をBLOCKED、fresh GET取得へ戻す |
| contexts が期待3件と違う | expected vs applied diff | GitHub実値を current facts として記録し、差分を未タスク化検討 |
| `verify-indexes-up-to-date` が無い | contexts集合比較 | 期待値に寄せず、現状差分として記録 |
| index生成失敗 | generate-index exit non-zero | 失敗ログを Phase 9/12 に記録し、修正して再実行 |
| mirror drift | `diff -qr` non-zero | mirror同期方針を確認し、必要差分だけ同期 |
| Issue reopen/close実行 | `gh issue` 操作ログ | 実行禁止。必要ならコメント案だけ作成 |

## 統合テスト連携

Phase 9で異常系が0件または未タスク化済みであることを確認する。

## 多角的チェック観点

- 期待値との差分を失敗ではなく current facts として扱う場合、理由を残す。
- GitHub stateを変えるコマンドはこのタスクの範囲外。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 異常系表作成 | pending |
| 2 | 差分対応方針作成 | pending |
| 3 | issue操作禁止確認 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 異常系と対応 |

## 完了条件

- [ ] placeholder / contexts差分 / mirror drift / issue誤操作の対応がある
- [ ] Phase 5への戻り条件が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-06/failure-cases.md` を作成
- [ ] `artifacts.json` の Phase 6 状態を更新

## 次Phase

Phase 7: ACマトリクス
