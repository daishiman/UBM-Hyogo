# Phase 9: セキュリティ・品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | セキュリティ・品質ゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (DRY 化 / 統合) |
| 次 Phase | 10 (リリース準備) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ESLint custom rule（stableKey 文字列リテラル直書き禁止）を CI gate として merge しても安全であることを確認する。
secret hygiene / 不変条件影響評価 / 4 種品質ゲートの 3 軸で「赤がちゃんと赤になり、緑がちゃんと緑になる」状態を担保する。

## 1. Secret hygiene gate

stableKey 値そのものは内部 schema 識別子であり PII / token ではないが、本タスクの lint rule のテストフィクスチャには **本物の stableKey を埋め込まない**ことを徹底する。

| 観点 | ルール | 検査方法 | 合格基準 |
| --- | --- | --- | --- |
| テストフィクスチャ命名 | `__fixtures__/stablekey-literal/violation-sample.ts` 等で dummy 値を使う | grep で実 stableKey 値が含まれていないことを確認 | 0 hit |
| dummy 値命名規約 | `dummy_field_a` / `dummy_field_b` のように `dummy_` prefix を強制 | rule のテストコード review | 全 dummy 値が `dummy_` prefix |
| token / cookie 混入禁止 | evidence 取得ログに OAuth token / Cookie / Authorization が混入しない | `grep -iE '(token\|cookie\|authorization\|bearer\|set-cookie)' outputs/phase-11/evidence/*.txt` | 0 hit |
| allow-list path 漏洩防止 | allow-list snapshot に絶対パスを書かず repo 相対 path のみとする | `outputs/phase-11/evidence/allow-list-snapshot.json` レビュー | 全エントリが `packages/` / `apps/` 相対 |

dummy 値命名の意図: 将来 lint rule の判定ロジックが「allow-list 外で stableKey 風文字列を検出する」方向で強化された場合、dummy 値が誤検知されないよう sentinel prefix を維持しておく。

## 2. 不変条件 #1〜#11 影響評価

CLAUDE.md「重要な不変条件」全 11 件を本 lint rule 導入の観点でレビューする。主軸は #1（schema 固定しすぎない）と #6（GAS prototype を本番昇格させない）。

| # | 不変条件 | 本タスクの影響 | 合否 |
| --- | --- | --- | --- |
| 1 | 実フォームの schema をコードに固定しすぎない | **主軸**: stableKey 直書き禁止により、リテラルが正本以外で散在しないことを CI で保証 | 強化 |
| 2 | consent キーは `publicConsent` / `rulesConsent` に統一 | consent key も stableKey と同様の文字列識別子のため、allow-list で同等扱い検討 | 影響あり（要 Phase 10 で reviewer に明示） |
| 3 | `responseEmail` は system field | system field は schema field と異なるため、lint rule 対象から除外する allow-list メモを追加 | 中立 |
| 4 | Google Form schema 外は admin-managed data として分離 | 直接の影響なし | 中立 |
| 5 | D1 直接アクセスは `apps/api` に閉じる | 直接の影響なし | 中立 |
| 6 | GAS prototype は本番昇格させない | **主軸**: GAS prototype 内で literal が散見されても allow-list 外として扱い、誤って `apps/` `packages/` に流入したら CI 落ち | 強化 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | 直接の影響なし | 中立 |
| 8〜11 | （該当箇所参照） | 直接の影響なし | 中立 |

## 3. 4 種品質ゲート

| ゲート | コマンド | 合格基準 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | エラー 0 |
| lint | `mise exec -- pnpm lint` | エラー 0、本 rule で suppression / `eslint-disable` 0 件 |
| unit test | `mise exec -- pnpm test` | rule 単体テスト含め全 PASS |
| build | `mise exec -- pnpm build` | apps/web / apps/api / packages/* すべて成功 |
| install 整合性 | `mise exec -- pnpm install --force` | lockfile drift 0 |

## 4. 「赤がちゃんと赤になる」確認（intentional violation）

L4 evidence として、以下の確認を Phase 11 で実施する設計をここで固定しておく:

1. allow-list 外モジュール（例: `apps/web/src/components/sample.tsx`）に dummy stableKey literal を 1 行追加
2. `pnpm lint` を実行し、本 rule が error を返すことを確認
3. その出力を `outputs/phase-11/evidence/lint-violation-fail.txt` に保存
4. 違反コードを git stash / revert して clean に戻す

## 5. テスト方針（rule 単体テスト / RuleTester）

ESLint 公式の `RuleTester` を使い、本 rule の判定を valid / invalid 双方で固める。fixture には dummy 値のみ使用する。

| ケース | 入力 | 期待 |
| --- | --- | --- |
| valid-1 | allow-list 内（`packages/shared/src/zod/field.ts`）で stableKey literal | エラー 0 |
| valid-2 | テストファイル（`__tests__/**`）で stableKey literal | エラー 0（override 適用） |
| valid-3 | fixture（`__fixtures__/**`）で dummy literal | エラー 0 |
| invalid-1 | `apps/web/src/components/sample.tsx` で stableKey literal | エラー 1（rule message 一致） |
| invalid-2 | `apps/api/src/routes/foo.ts` で stableKey literal | エラー 1 |
| invalid-3 | `packages/integrations/other/foo.ts` で stableKey literal | エラー 1 |

RuleTester unit test の件数（valid 3 + invalid 3 以上）を `manual-smoke-log.md` に主証跡として転記する。

## 6. allow-list の運用ルール

- allow-list は `eslint.config.*` の rule オプションとして配置（外部 JSON 化しない）
- 追加には PR レビュー必須（solo 開発でも `outputs/phase-12/system-spec-update-summary.md` に追加履歴を残す）
- 削除は段階 ③ 適用後のみ可（warning モード期間中の削除は段階 ① / ② のリセットを引き起こす）

## 実行タスク

- [ ] dummy 値命名規約を `outputs/phase-09/main.md` に明記
- [ ] 不変条件 11 件レビュー結果表を `outputs/phase-09/main.md` に固定
- [ ] 4 種品質ゲートのコマンドと合格基準を runbook 化
- [ ] L4 intentional violation の手順を Phase 11 へ引き継ぐ

## 完了条件

- [ ] secret hygiene 4 観点すべて合格設計済み
- [ ] 不変条件影響評価 11 件すべて記録
- [ ] 品質ゲート 4 種 + install 整合性のコマンド固定済み
- [ ] L4 intentional violation 手順を Phase 11 引継ぎ事項として記録

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] `outputs/phase-09/main.md` 作成済み
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (リリース準備)
- 引き継ぎ: 4 ゲート結果サマリ、L4 evidence 取得計画

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-08/main.md | performance / operations 方針 |
| 必須 | phase-11.md | NON_VISUAL evidence 取得先 |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-09/main.md` | security / quality gate サマリ |

## 統合テスト連携

Phase 11 は本 Phase の secret hygiene、quality gate、intentional violation 手順を evidence plan として実行する。
