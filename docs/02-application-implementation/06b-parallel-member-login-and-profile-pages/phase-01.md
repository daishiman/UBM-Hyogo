# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 前 Phase | なし（最初） |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`/login`, `/profile` の責務、AuthGateState 5 状態、profile 表示要素、`/no-access` 不採用を spec から確定する。「真の論点」と「4 条件 PASS」をログに残す。

## 実行タスク

1. 真の論点抽出
2. spec 突き合わせ（02 / 06 / 13 / 05 / 07 / 09 / 16）
3. ペルソナと UX 期待値
4. 4 条件 PASS

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | `/no-access` 不採用 |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | AuthGateState 5 状態 |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | `/login`, `/profile` 構造 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | profile 編集禁止 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 |
| 参考 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |

## 実行手順

### ステップ 1: 真の論点（top-3）

| # | 論点 | 暫定回答 | 根拠 |
| --- | --- | --- | --- |
| 1 | `/login` の状態管理を URL に置くか sessionStorage に置くか | URL query `?state=sent&email=...` を正本にし、復元可能 | 不変条件 #8 |
| 2 | `/profile` から本文編集 UI を出さない方針はどう実装するか | profile は read-only。`editResponseUrl` を Google Form 編集ボタンとしてのみ提供 | 不変条件 #4, 07-edit-delete |
| 3 | `unregistered` / `rules_declined` / `deleted` を `/login` 内でどう演出するか | 同一画面の Banner + CTA 切替（route 分割しない） | 02-auth, #9 |

### ステップ 2: spec 突き合わせ

| 項目 | spec 出典 | 採用 |
| --- | --- | --- |
| `/login` 5 状態 | 06-member-auth | input / sent / unregistered / rules_declined / deleted |
| ログイン許可条件 | 06-member-auth | responseEmail 一致 + rulesConsent=consented + isDeleted=false |
| 公開条件 | 06-member-auth | publicConsent=consented + publishState=public + isDeleted=false（`/login` 判定には不要） |
| profile 表示要素 | 05-pages, 06-member-auth | 公開状態サマリ / Google Form 再回答導線 / editResponseUrl / 参加履歴 |
| 本人更新 | 07-edit-delete | Google Form 再回答（アプリ内直接編集なし） |
| `/no-access` | 02-auth | 不採用、`/login` で吸収 |

### ステップ 3: ペルソナと UX 期待値

| ペルソナ | UX 期待値 |
| --- | --- |
| 既存会員 | Magic Link or Google OAuth で 1 クリック login → /profile で状態確認 |
| 規約未同意会員 | `/login` で `rules_declined` Banner、再回答 CTA |
| 退会済 | `/login` で `deleted` Banner、管理者連絡 CTA |
| 未登録者 | `/login` で `unregistered` Banner、`/register` CTA |

### ステップ 4: 4 条件 PASS

| 条件 | 確認 |
| --- | --- |
| spec 正本一致 | 06 / 02 / 05 / 07 を読了 |
| 不変条件 #4 / #9 を侵さない | profile read-only / `/no-access` 不採用 |
| ペルソナ別 UX 4 種を網羅 | 上記表 |
| 4 状態（input 含む 5 状態）の AC が定義可能 | AC-1〜AC-12 へ展開 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | URL contract と data fetching 設計の入力 |
| Phase 4 | AC-1〜AC-12 を test 行列に展開 |
| Phase 7 | AC マトリクスの根拠 |

## 多角的チェック観点

- 不変条件 #2: rulesConsent / publicConsent を取り違えない
- 不変条件 #4: profile に編集 UI を一切置かない
- 不変条件 #5: 全データ取得は 04b API 経由
- 不変条件 #6: `window.UBM` `localStorage` 不採用
- 不変条件 #7: SessionUser の memberId のみ参照（responseId は別物）
- 不変条件 #9: `/no-access` 不採用

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点抽出 | 1 | pending | top-3 |
| 2 | spec 突き合わせ | 1 | pending | 6 spec |
| 3 | ペルソナ / UX | 1 | pending | 4 ペルソナ |
| 4 | 4 条件 PASS | 1 | pending | gate |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 真の論点 + spec 突き合わせ + ペルソナ + 4 条件 |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] top-3 論点記録
- [ ] spec 突き合わせ表完成
- [ ] ペルソナ 4 件
- [ ] 4 条件 PASS が記載

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-01/main.md 配置
- 不変条件 #2, #4, #5, #6, #7, #9 への対応が明示
- 次 Phase へ AC 候補を渡す

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AuthGateState 5 状態、profile 表示要素、`/no-access` 不採用
- ブロック条件: 4 条件 PASS が成立しないなら進まない
