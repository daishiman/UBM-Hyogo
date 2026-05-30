# Phase 3: 設計レビュー

## レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| SRP | PASS | pure config / avatar primitive / popover container を 3 ファイルに分離。test も 1:1 |
| role boundary | PASS | role 判定は `SidebarShellServer` 側 SessionUser.isAdmin に閉じ、本コンポーネントは props で受けるだけ |
| a11y | PASS | `<details>` native + `role=button/menu/menuitem` + `aria-haspopup` + `aria-label` を明示 |
| popover scope | PASS | 新規 popover primitive を作らず `<details>` + `usePathname` watch のみ |
| signOut reuse | PASS | 既存 `SignOutButton` を embed、`signOut({ redirectTo:'/login' })` 契約を維持 |
| terminology | PASS | 「管理者 / 会員 / ゲスト」表示と `'admin' \| 'member' \| 'viewer'` コード識別を分離 |
| current code alignment | PASS | Task A の `ShellRole` 型再利用、独自 role enum を作らない |
| visual evidence boundary | PASS | local screenshot は Phase 11 で `present` 化、runtime visual は staging gate 経由で取得 |

## 30種思考法 compact evidence

| Category | Methods | Applied conclusion |
| --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹 / 帰納 / アブダクション / 垂直 | role enum を `viewer/member/admin` に閉じ、表示語彙との 1:N 写像を pure 関数で固定 |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | pure config × render × test の 3 軸 MECE 分離 |
| メタ・抽象系 | メタ / 抽象化 / ダブル・ループ | popover を「open/close state machine」ではなく「native `<details>` + pathname watch」へ抽象化 |
| 発想・拡張系 | ブレスト / 水平 / 逆説 / 類推 / if / 素人 | popover library 導入を逆に却下、`<details>` の素朴さで a11y を担保 |
| システム系 | システム思考 / 因果 / 因果ループ | role 判定は `SidebarShellServer` 側に閉じ、role → action の決定は client pure config に閉じることで SSR cache と整合 |
| 戦略・価値系 | トレードオン / プラスサム / 価値提案 / 戦略 | code 実装範囲を最小化（3 ファイル + 2 spec）し、Task C/D の layout 移行を unblock |
| 問題解決系 | why / 改善 / 仮説 / 論点 / KJ | 既存 `SignOutButton` を embed する方が再 export より import grep noise を抑える |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `<details>` 内の `<Link>` クリックで popover が閉じない | `useEffect(pathname)` の route 変更 hook を唯一の close 書込み点にし、個別 menuitem `onClick` を増やさない |
| `SignOutButton` の variant 追加が他箇所に副作用 | `variant` は default 値 `'default'`、未指定箇所は挙動不変。grep で参照 0 件 drift を確認 |
| viewer 時に user=null だが avatar を表示してしまう | `user === null` の時は avatar に initials='?' を出さず、`<Link href="/login">ログイン</Link>` のみ render する分岐を pure 化 |

## 完了条件

設計レビュー結果が `outputs/phase-12/phase12-task-spec-compliance-check.md` に反映されている。
