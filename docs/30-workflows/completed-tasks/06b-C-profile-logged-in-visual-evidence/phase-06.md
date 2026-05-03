# Phase 6: 異常系検証 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 6 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

evidence 取得・read-only assertion で発生し得る異常系（401 / 403 / Magic Link 失敗 / staging down / storageState 期限切れ / DOM count 違反）を列挙し、各ケースの期待挙動・FAIL 判定基準・復旧手順を確定する。

## 実行タスク

1. 想定異常ケースを列挙する。
2. 各ケースの期待挙動と spec / capture script の振る舞いを定義する。
3. invariant 違反検出時（read-only 違反 = 編集 form が見つかる）のフェイル方針を定義する。
4. 復旧 runbook を確定する。

## 参照資料

- Phase 5 outputs/main.md
- `docs/00-getting-started-manual/specs/06-member-auth.md`（session 期限）

## 異常系マトリクス

| ID | ケース | 検出箇所 | 期待挙動 | exit / status |
| --- | --- | --- | --- | --- |
| E-01 | storageState 不在 | capture script 先頭 guard | exit 4、メッセージ「storageState not found」 | exit 4 |
| E-02 | storageState 期限切れ | spec 内、`/profile` が `/login` に redirect | spec が FAIL（assertion: `expect(page.url()).toContain('/profile')`） | exit 2 |
| E-03 | staging down (5xx) | Playwright `page.goto` 失敗 | spec timeout → FAIL | exit 3 |
| E-04 | baseURL に "staging" を含まない | capture script guard | exit 1、production 誤実行を防止 | exit 1 |
| E-05 | DOM count 違反（form > 0） | spec assertion | spec が FAIL し、DOM dump JSON を attach（invariant #4 違反） | exit 2 |
| E-06 | `/profile?edit=true` で form が現れる | spec assertion (M-10) | spec が FAIL、不変条件違反として ESCALATE | exit 2 |
| E-07 | logout 後 `/profile` が 200 で見える | spec assertion (M-16) | spec が FAIL、session boundary 違反として ESCALATE | exit 2 |
| E-08 | Magic Link 取得失敗（manual 経路） | 人手 | M-14 evidence は不取得、代わりに失敗ログを `outputs/phase-11/notes.md` に記載 | manual |
| E-09 | redaction 漏れ（screenshot に email） | 人手 review | screenshot を破棄し再取得 | manual |
| E-10 | Playwright flaky（断続的失敗） | retry | `retries: 1` を staging project のみで許可、3 回連続失敗で FAIL | exit 2 |

## invariant 違反検出時の方針

E-05 / E-06 / E-07 は **アプリ本体のリグレッション**を意味する。本タスクの責務外だが検出責任は持つ。

- 即座に Phase 11 を中断
- DOM dump JSON を `outputs/phase-11/dom/INVARIANT-VIOLATION-{date}.json` に保存
- `outputs/phase-12/unassigned-task-detection.md` に新規タスク提案を追記
- 本タスクの DoD（M-09/M-10）は満たさず、PR には FAIL evidence 込みで「issue 検出済」として記録（user approval を得てから）

## 復旧 runbook

| ID | 復旧手順 |
| --- | --- |
| E-01 | Phase 5 ステップ 4 の手順で storageState を再取得 |
| E-02 | 同上（再ログイン） |
| E-03 | staging deployment ログ確認 → 復旧後再実行。本タスク責務外なら待機 |
| E-04 | コマンド引数を見直す（typo） |
| E-05〜E-07 | 上記 invariant 違反方針に従う |
| E-08 | Magic Link 設定（Resend / staging SMTP）を確認 |
| E-09 | redaction 関数 `maskPII` の対象 selector を見直し |
| E-10 | `--retries=1` で 1 度だけ再試行 |

## サブタスク管理

- [ ] 異常系マトリクス E-01..E-10 確定
- [ ] invariant 違反方針確定
- [ ] 復旧 runbook 確定
- [ ] outputs/phase-06/main.md に異常系設計を記載

## 成果物

| 成果物 | パス |
| --- | --- |
| 異常系設計 | `outputs/phase-06/main.md` |

## 完了条件

- [ ] E-01..E-10 全件に exit/status と復旧手順が記載されている
- [ ] invariant 違反検出時のエスカレーション経路が明示されている

## タスク100%実行確認

- [ ] 異常系で「黙って PASS にする」経路がないこと
- [ ] retry を無条件で多用していないこと

## 次 Phase への引き渡し

Phase 7 へ、AC マトリクスに異常系列を含める準備として E-01..E-10 を引き渡す。
