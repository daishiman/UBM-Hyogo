# Phase 01 outputs: 要件定義

## サマリ

`/login`（5 状態）と `/profile`（read-only）の責務を spec から確定する。AuthGateState 5 状態を URL query を正本に管理し、`/no-access` を不採用（不変条件 #9）、`/profile` は編集 UI を一切配置しない（不変条件 #4）方針を要件として固定する。本フェーズで AC-1〜AC-12 へ展開可能な前提を整え、Phase 2 設計の入力にする。

## 真の論点 top-3

| # | 論点 | 暫定回答 | 根拠 |
| --- | --- | --- | --- |
| 1 | `/login` の状態管理を URL に置くか sessionStorage に置くか | URL query `?state=sent&email=...` を正本にし、復元可能にする | 不変条件 #8 |
| 2 | `/profile` から本文編集 UI を出さない方針はどう実装するか | profile は read-only。`editResponseUrl` を Google Form 編集ボタンとしてのみ提供 | 不変条件 #4 / specs 07-edit-delete |
| 3 | `unregistered` / `rules_declined` / `deleted` を `/login` 内でどう演出するか | 同一画面の Banner + CTA 切替で吸収（route 分割しない） | specs 02-auth, 不変条件 #9 |

## spec 突き合わせ

| 項目 | spec 出典 | 採用 |
| --- | --- | --- |
| `/login` 5 状態 | 06-member-auth | input / sent / unregistered / rules_declined / deleted |
| ログイン許可条件 | 06-member-auth | responseEmail 一致 + rulesConsent=consented + isDeleted=false |
| 公開条件 | 06-member-auth | publicConsent=consented + publishState=public + isDeleted=false（`/login` 判定には不要） |
| profile 表示要素 | 05-pages, 06-member-auth | 公開状態サマリ / Google Form 再回答導線 / editResponseUrl / 参加履歴 |
| 本人更新 | 07-edit-delete | Google Form 再回答（アプリ内直接編集なし） |
| `/no-access` | 02-auth | 不採用、`/login` で吸収 |

## ペルソナと UX 期待値

| ペルソナ | UX 期待値 |
| --- | --- |
| 既存会員 | Magic Link または Google OAuth で 1 クリック login → `/profile` で公開状態を確認 |
| 規約未同意会員 | `/login` で `rules_declined` Banner、Google Form 再回答 CTA |
| 退会済 | `/login` で `deleted` Banner、管理者連絡 CTA、ログイン form 非表示 |
| 未登録者 | `/login` で `unregistered` Banner、`/register` CTA |

## 4 条件 PASS

| 条件 | 確認 |
| --- | --- |
| spec 正本一致 | 06 / 02 / 05 / 07 を読了 |
| 不変条件 #4 / #9 を侵さない | profile read-only / `/no-access` 不採用 |
| ペルソナ別 UX 4 種を網羅 | 上記表で網羅 |
| 4 状態（input 含む 5 状態）の AC が定義可能 | AC-1〜AC-12 へ展開可能 |

## 不変条件チェック

- #2: rulesConsent / publicConsent を取り違えない
- #4: profile に編集 UI を一切置かない
- #5: 全データ取得は 04b API 経由
- #6: `window.UBM` / `localStorage` 不採用
- #7: SessionUser の memberId のみ参照（responseId は別物）
- #9: `/no-access` 不採用

## 次 Phase 引き継ぎ

- AuthGateState 5 状態
- profile 表示要素 4 ブロック
- `/no-access` 不採用
- AC 候補 12 件
