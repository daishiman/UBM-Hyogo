# Phase 04 outputs: テスト戦略

## サマリ

AC-1〜AC-12 を test ID 21 件（unit 3 / contract 4 / e2e 10 / static 4）に展開し、fixture 4 種を定義。contract test は 08a、E2E は 08b に handoff する。

## layer 振り分け

| layer | 件数 | 実行 Phase |
| --- | --- | --- |
| unit | U-01〜U-03（3 件） | 9 |
| contract | C-01〜C-04（4 件） | 9 / 8a |
| e2e | E-01〜E-10（10 件） | 8b |
| static | S-01〜S-04（4 件） | 9 |

## fixture

| 種類 | path | 用途 |
| --- | --- | --- |
| MeView | tests/fixtures/me/registered.json | 通常会員 |
| MemberProfile | tests/fixtures/me/profile.json | 11 stableKey |
| Magic Link 送信成功 | tests/fixtures/auth/magic-link-sent.json | C-01 |
| AuthGateState 5 種 | tests/fixtures/auth/gate-state/*.json | E-01〜E-06 |

## 8a / 8b への入力

| 出力先 | 内容 |
| --- | --- |
| 8a | C-01〜C-04 を契約 test として実装 |
| 8b | E-01〜E-10 を Playwright で 09-ui-ux 準拠 desktop / mobile |

## 不変条件チェック

- #4: S-04 で profile に編集 form 不在を確認
- #5: C-03, C-04 で apps/web → apps/api のみの fetch
- #6: S-02 で localStorage 不在
- #7: C-03, C-04 の session.memberId のみ参照
- #8: U-01, U-02 で URL query 正本確認
- #9: S-03 で `/no-access` 不在

詳細は `test-matrix.md` を参照。
