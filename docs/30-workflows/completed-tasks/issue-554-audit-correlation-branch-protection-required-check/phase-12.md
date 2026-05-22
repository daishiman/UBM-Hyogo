# Phase 12: implementation-guide / 概念説明 / unassigned 検出 / skill feedback / compliance

## 目的

実施結果を 1 ファイルに集約し、後続実行者・将来の自分・skill にフィードバックする。

## 12.1 中学生レベル概念説明（task-specification-creator skill 規約）

> **「ブランチ保護の必須チェック登録」って何をしているの？**
>
> GitHub には「このブランチに新しいコードを入れる前に、必ずこのテストを通してね」というルールを設定する仕組みがあります。これを **branch protection の required status check** と言います。
>
> 私たちは前回（Issue #516）、`audit-correlation-verify` という自動チェックを追加しました。これは「監査ログがちゃんと記録されているか」を確認する CI です。
>
> ただ、CI を追加しただけでは「PR で動くだけ」で、必須ではありません。誰かが `.github/workflows/audit-correlation-verify.yml` を間違えて消したり無効化しても、PR は通ってしまいます。
>
> 本タスクでは、この CI を **「必須」** に格上げします。具体的には GitHub の API（`gh api -X PUT`）に「`audit-correlation-verify / verify` が緑にならないと merge させないでね」と設定するだけです。コード自体は変えません。
>
> 設定は GitHub 側に保存されるので、PR 履歴には残りません。だから代わりに、設定する前と後の状態を JSON で保存（`outputs/phase-11/`）して、「ちゃんと変わったよ」「他の設定は壊してないよ」という証拠（evidence）を残します。

## 12.2 implementation-guide.md（必須・成果物）

`outputs/phase-12/implementation-guide.md` に以下のセクションを必ず含める:

1. **概要** — 実施した変更の 3 行サマリー
2. **変更ファイル一覧** — Phase 7-9 で編集したファイルパスと変更行数
3. **GitHub 設定変更** — dev / main それぞれの read-only before evidence、Phase 13 PUT 予約、after evidence 取得手順、不変条件 grep 結果
4. **evidence 参照** — `outputs/phase-11/*.json` / `diff-summary.md` への相対リンク
5. **DoD 完了状況** — `index.md` の DoD チェックリストを転記し、完了状態を更新
6. **後続タスク / 残課題** — 12.3 / 12.4 を含む

## 12.3 unassigned-task 検出

本タスク完了時点で派生する可能性がある後続タスク候補:

| 候補 | 起票条件 |
| --- | --- |
| 「protection drift CI gate」 | `audit-correlation-verify / verify` 以外の context が手動編集された場合の自動検知 workflow が無いことを発見した場合のみ |
| 「branch protection backup snapshot CI」 | before/after JSON を CI 上で恒久 archive する automation が無いことを発見した場合のみ |

**いずれも条件 hit 時のみ unassigned-task 化。本タスク内では起票しない。** ただし Phase 11 before snapshots で検出済みの branch protection invariant drift は Phase 13 user gate の明示判断対象であり、黙ってバックログ送りにしない。

## 12.4 skill feedback

task-specification-creator / aiworkflow-requirements への feedback:

- `references/branch-protection.md` を「不変条件 + 直近追加 contexts のみ」を SSOT 範囲とし、context 全列挙はしない方針が妥当だったか、後続タスクで検証する
- governance 系タスクは `visualEvidence: NON_VISUAL` で JSON スナップショット evidence を正規化する pattern が再利用できる

## 12.5 compliance チェック

- [ ] 実装区分（実装仕様書）が index.md 冒頭に明記されている
- [ ] CONST_005（変更対象ファイル / シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD）が全 phase に分散して網羅されている
- [ ] CONST_007（今回サイクル内完了原則）に従い、外部 Issue 切り出しが行われていない
- [ ] PR base が `dev` であること（CLAUDE.md「PR 作成の完全自律フロー」整合）

## DoD（Phase 12）

- [ ] `outputs/phase-12/implementation-guide.md` が §12.2 の 6 セクションを満たす
- [ ] §12.1 の概念説明が `outputs/phase-12/phase-12.md` に転記されている
- [ ] §12.5 の compliance チェックが全項目 done
