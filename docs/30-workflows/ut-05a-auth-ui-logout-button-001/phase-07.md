[実装区分: 実装仕様書]

# Phase 7: AC マトリクス — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 7 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

各 AC が evidence path / 検証 Layer / 異常系ハンドリングと 1 対 1 対応していることを
マトリクスで確定する。

## 実行タスク

1. AC-1〜AC-5 を検証 URL と evidence path に割り当てる。
2. `/profile` と `/admin` の AC-1 を URL 単位で判定する。
3. UI evidence と session evidence を分ける。
4. redaction checklist を AC-3 / AC-4 の gate にする。

## 参照資料

- docs/30-workflows/ut-05a-auth-ui-logout-button-001/phase-04.md
- docs/30-workflows/ut-05a-auth-ui-logout-button-001/phase-06.md

## 統合テスト連携

- Unit test は AC-2 の API 呼出契約を検証する。
- Manual / Playwright smoke は `/profile` と `/admin` の実 redirect / cookie / session を検証する。

## AC マトリクス

| AC | 内容 | 検証 Layer | 主 evidence path | 異常系参照 |
| --- | --- | --- | --- | --- |
| AC-1 | ログイン済 `/profile` / `/admin` で sign-out ボタンが視認できる | Layer 2 / Layer 3 / Layer 4 | `outputs/phase-11/screenshots/before-signout-profile.png`, `outputs/phase-11/screenshots/before-signout-admin.png`, Playwright report | UI 系 |
| AC-2 | クリックで `signOut({ redirectTo: "/login" })` が呼ばれ `/login` に遷移する | Layer 1 / Layer 3 | Vitest 出力, Playwright trace | sign-out API 呼出系 |
| AC-3 | 遷移後 `/api/auth/session` が `{}` 相当を返す | Layer 3 / Layer 4 | `outputs/phase-11/session-after.json` | Cookie/Session 系 |
| AC-4 | session cookie が削除/無効化される | Layer 3 / Layer 4 | `outputs/phase-11/cookies-after.json`（redacted） | Cookie/Session 系 |
| AC-5 | `/profile` / `/admin` 再アクセスで `/login` redirect | Layer 3 / Layer 4 | Playwright trace, `outputs/phase-11/screenshots/after-signout.png` | Cookie/Session 系 |

## 完了判定ルール

- 全 AC が PASS の場合のみ Phase 11 を completed にする
- いずれかが FAIL の場合は M-08 を blocked のまま据え置き、原因を Phase 6 異常系に紐づけて記録
- M-08 の評価結果は 05a-followup workflow へフィードバックされる

## redaction チェックリスト

- [ ] screenshot に実名 / メール / 電話番号が映っていない
- [ ] cookie JSON の token 値が `***REDACTED***` で置換されている
- [ ] session JSON が `{}` であることを除き個人情報を含まない

## 多角的チェック観点

- 「ボタンが描画される」だけで AC PASS にしない（cookie 削除まで含む）
- evidence path の存在だけでなく内容妥当性を確認対象にする
- AC-3 / AC-4 / AC-5 は論理 AND の関係で評価する

## サブタスク管理

- [ ] AC-1〜AC-5 と evidence path の対応を確定
- [ ] redaction checklist を確定
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- AC マトリクスが 1 対 1 で完成
- redaction checklist が定義されている
- evidence path 不在が AC FAIL に直結する判定式

## タスク100%実行確認

- [ ] partial completed 時のフォローパスが記述されている
- [ ] AC ↔ evidence path に欠落がない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと判定ロジックを渡す。
