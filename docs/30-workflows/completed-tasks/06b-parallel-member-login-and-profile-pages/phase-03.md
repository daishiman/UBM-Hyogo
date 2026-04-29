# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

代替案 3+ を比較し、A 案（URL query 正本 + RSC + middleware redirect）採用の根拠を明示。

## 実行タスク

1. 代替案 5 種比較
2. A 案採用根拠
3. リスク登録
4. ADR 起票

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-02/auth-gate-state-ui.md | 5 状態 |
| 参考 | doc/00-getting-started-manual/specs/02-auth.md | 公式方針 |

## 実行手順

### ステップ 1: 代替案比較

| 案 | 概要 | Pros | Cons | 不変条件適合 |
| --- | --- | --- | --- | --- |
| A | URL query 正本 + RSC で gate-state 描画 + middleware で `/profile` redirect | reload 復元、SEO 安全、SSR 完結 | URL に email を載せた場合 leak（length）→ form submit 後は state のみ残す | #8, #9 OK |
| B | client state 正本（useState）+ React Context | 柔軟 | reload で state 消失、`/no-access` 化リスク | #8 違反 |
| C | localStorage に gate-state 保存 | UX continuous | 不変条件 #8 違反、leak リスク | #6, #8 違反 |
| D | route 分割（`/login`, `/login/sent`, `/login/unregistered`...） | URL で意味を持つ | route 増、`/no-access` に近い | #9 リスク |
| E | session/cookie に gate-state 保存 | reload 復元 | cookie inflate、SSR 複雑 | #8 リスク |

採用: A 案 / 不採用: B (#8), C (#6 #8), D (#9), E (#8)

### ステップ 2: A 案採用根拠

| 観点 | 根拠 |
| --- | --- |
| 不変条件 #8 | URL が正本、localStorage / sessionStorage 不採用 |
| 不変条件 #9 | `/no-access` 不存在、`/login` で 5 状態を吸収 |
| RSC 適合 | searchParams を Server で zod parse → component に渡せる |
| SEO | `/login` 自体は noindex 想定だが、SSR 完結で問題なし |
| 復元性 | reload で state 復元 |

### ステップ 3: リスク登録

| リスク | 影響 | 対策 | 残リスク |
| --- | --- | --- | --- |
| URL に email を載せた場合 leak | プライバシー | submit 直後に history.replaceState で email を削除（`?state=sent` のみ残す） | low |
| Magic Link の再送 spam | コスト | cooldown 60s + 送信回数 server 側 limit（05b） | low |
| Google OAuth ボタンの popup blocker | UX | primary CTA としてフルページ redirect 利用 | low |
| `/profile` で session 切れ | UX | error boundary で `/login` redirect | low |
| editResponseUrl が null | UX | button disabled + tooltip 「Google Form 再回答 URL を取得中」 | low |

### ステップ 4: ADR

| ADR | 内容 |
| --- | --- |
| ADR-06b-001 | `/login` の状態は URL query 正本 |
| ADR-06b-002 | `/profile` は read-only、編集 UI 一切なし（不変条件 #4） |
| ADR-06b-003 | `/no-access` ルート不採用（不変条件 #9） |
| ADR-06b-004 | session middleware は `/profile/:path*` のみ |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | A 案前提で test 行列 |
| Phase 8 | C 案 (localStorage) 不採用を DRY 化で再確認 |

## 多角的チェック観点

- 不変条件 #4: `/profile` から編集 form を削除する設計が ADR に
- 不変条件 #5: 全 fetch は apps/api 経由
- 不変条件 #6: localStorage / window.UBM 否定
- 不変条件 #8: A 案で URL query 正本
- 不変条件 #9: `/no-access` 否定が ADR に

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案比較 | 3 | pending | 5 案 |
| 2 | A 案根拠 | 3 | pending | 5 観点 |
| 3 | リスク登録 | 3 | pending | 5 件 |
| 4 | ADR 起票 | 3 | pending | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 比較表 + 採用根拠 + ADR + リスク |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 代替案 3+ 比較完了
- [ ] A 案採用と根拠
- [ ] ADR 4 件
- [ ] リスク 5 件と対策

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-03/main.md 配置
- 不変条件 #4, #5, #6, #8, #9 への対応が明示
- 次 Phase へ A 案前提を渡す

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: A 案 + ADR 4 件 + リスク 5 件
- ブロック条件: A 案以外を採用するなら設計やり直し
