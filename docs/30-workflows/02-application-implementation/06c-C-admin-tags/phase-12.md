# Phase 12: ドキュメント更新 — 06c-C-admin-tags

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-C-admin-tags |
| phase | 12 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、runbook、lessons learned の同期を定義する。

## 実行タスク

1. 参照資料と該当 specs を確認する。完了条件: admin tags の正本境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/web/app/admin/(routes)/
- apps/api/src/routes/admin/
- packages/shared/src/admin/tags.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-C-admin-tags/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c admin pages 本体, 07b admin schema / tag ops 本体, 06b-followup-002 session resolver
- 下流: 08b admin tags E2E, 09a admin staging smoke

## 多角的チェック観点

- #5 apps/web D1 direct access forbidden
- #11 admin 編集境界
- #13 audit log
- #15 Auth session boundary
- 未実装/未実測を PASS と扱わない。
- 公開 tag 検索面と admin tag 編集面の責務を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md

## 中学生レベル概念説明

このタスクで扱う「admin タグ管理」は、図書館の本にシールを貼って整理する仕事に似ている。タグはシール、メンバーは本、別名は同じシールに付く別の呼び方（たとえば「料理」と「クッキング」は同じシール）にあたる。管理者だけがシールを増やしたり貼り替えたりできて、他の人は触れない。

### 日常の例え話

- **タグ作成**: 図書館の司書さんが新しいジャンルのシールを作る。中身が同じシールが既にあるなら作り直さない（重複 422）。
- **別名（alias）**: 同じシールを「料理」と呼ぶ人と「クッキング」と呼ぶ人がいるので、両方の呼び方を 1 枚のシールに紐づけておく。検索のときどちらでヒットしても同じ棚にたどり着ける。
- **メンバー割当**: 本にシールを貼る作業。同じ本に同じシールを 2 回貼っても結果は変わらない（冪等）。
- **audit log**: 司書さんが「いつ・誰が・どの本に・どのシールを貼った/はがした」をノートに書き残す。あとで誰かが「勝手に貼られた」と言い出したときの証拠になる。
- **admin boundary**: シールの棚に入れるのは司書さんだけ。一般来館者が入ろうとしたら鍵が閉まっている（403）。

この比喩で `/admin/tags` の責務は「シール製造 + 貼付作業 + 作業ノート」の 3 つに分かれることがわかる。本仕様書はその 3 つが UI / API / D1 のどこに乗るかを確定させる。

## 完了条件

- 管理者は `/admin/tags` でタグ一覧・作成・編集・削除・別名追加・メンバー割当ができる
- 非管理者は 403 を受け、admin route に到達できない
- タグ名 / 別名は重複登録できず、422 を返す
- メンバー割当は memberId に対して冪等で、再割当は 200 を返す
- すべての admin タグ操作は audit log に記録される
- D1 への直接アクセスは `apps/api` に閉じ、`apps/web` は cookie forwarding のまま成立する

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、AC、blocker、evidence path、approval gate を渡す。
