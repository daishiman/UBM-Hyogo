[実装区分: 実装仕様書]

# Phase 9: セキュリティ・品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | セキュリティ・品質ゲート |
| 作成日 | 2026-05-03 |
| 前 Phase | 8 (パフォーマンス・運用) |
| 次 Phase | 10 (リリース準備) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #393 (CLOSED) |

## 目的

14 ファイル・148 件の stableKey literal 置換 PR を merge しても安全であることを、
secret hygiene / 不変条件影響評価 / 4 種品質ゲート の 3 軸で担保する。
本タスクは「lint 基盤導入」ではなく **既存 literal の正本 supply module 経由参照への置換実装** がスコープであり、
親 03a workflow が既に整備した `lint-stablekey-literal.mjs --strict` を本 PR で 0 violation 化することが達成条件。

## 1. Secret hygiene gate

stableKey 値（例: `member_email_001`）は内部 schema 識別子であり PII / token ではないが、置換実装の差分が evidence 経由で漏洩しないよう以下を強制する。

| 観点 | ルール | 検査方法 | 合格基準 |
| --- | --- | --- | --- |
| evidence ログに secret 混入 | OAuth token / Cookie / Authorization header が混入しない | `grep -iE '(token\|cookie\|authorization\|bearer\|set-cookie)' outputs/phase-11/evidence/*.txt` | **0 hit** |
| 置換 diff に絶対パス含めず | evidence の path は repo 相対 | `grep -E '^/Users/' outputs/phase-11/evidence/*.txt` | **0 hit** |
| email / 電話番号の漏洩 | 実 PII が evidence に含まれない | `grep -iE '@(gmail\|yahoo\|outlook)\.' outputs/phase-11/evidence/*.txt` | **0 hit** |
| stableKey 値そのものはどう扱うか | 内部識別子のため evidence に出てよい | — | （対象外） |

## 2. 不変条件 #1〜#11 影響評価

CLAUDE.md「重要な不変条件」全 11 件を本タスク（既存 literal 置換）の観点でレビューする。主軸は **#1 / #2 / #4**。

| # | 不変条件 | 本タスクの影響 | 合否 |
| --- | --- | --- | --- |
| 1 | 実フォームの schema をコードに固定しすぎない | **主軸**: 14 ファイルの literal を正本 supply module 経由参照へ集約。schema 散在を解消 | 強化 |
| 2 | consent キーは `publicConsent` / `rulesConsent` に統一 | **主軸**: family G (`packages/shared/src/utils/consent.ts`) の置換で正本経由が強制される | 強化 |
| 3 | `responseEmail` は system field | system field は schema field 対象外。allow-list 設計上区別されるため影響なし | 中立 |
| 4 | Google Form schema 外は admin-managed data として分離 | **主軸**: admin-managed key（family C: admin routes）も正本経由で参照することで境界が静的に保護される | 強化 |
| 5 | D1 直接アクセスは `apps/api` に閉じる | family B (repository) の置換は apps/api 内に閉じるため境界違反なし | 中立 |
| 6 | GAS prototype は本番昇格させない | GAS prototype は今回の 14 ファイル対象外 | 中立 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | 影響なし | 中立 |
| 8〜11 | 該当箇所参照 | 影響なし | 中立 |

## 3. 4 種品質ゲート（本 PR の必須通過要件）

| ゲート | コマンド | 合格基準 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | エラー 0 |
| lint (ESLint) | `mise exec -- pnpm lint` | エラー 0、追加 suppression 0 件 |
| lint (stableKey strict) | `mise exec -- node scripts/lint-stablekey-literal.mjs --strict` | violation **0**（before: 148） |
| unit / focused test | `mise exec -- pnpm vitest run --changed` | 全 PASS（family ごと） |
| install 整合性 | `mise exec -- pnpm install --force` | lockfile drift 0 |

## 4. 「赤がちゃんと赤になる」確認（intentional violation）

Phase 11 evidence 取得時に以下を 1 サイクル実施し、strict lint が想定通り fail することを確認する。

1. family A 該当ファイルから 1 行を named import 経由 → 文字列リテラル直書きに **意図的に巻き戻し**
2. `mise exec -- node scripts/lint-stablekey-literal.mjs --strict` を実行し、violation = 1 を確認
3. 出力を `outputs/phase-11/evidence/lint-strict-intentional-fail.txt` に保存（任意 evidence）
4. 巻き戻しコードを `git checkout -- <file>` で破棄して clean に戻す

## 5. bypass 経路の閉塞

| bypass 経路 | 検査方法 | 合格基準 |
| --- | --- | --- |
| `// eslint-disable-next-line` でリテラルを残す | `git diff main...HEAD \| grep eslint-disable` | 追加 0 件 |
| テンプレートリテラル（`` `field_${name}` ``）で動的合成 | `git diff main...HEAD -- 'apps/**' 'packages/**' \| grep -E '\\$\\{'` | レビュー確認、bypass 意図 0 |
| 配列 join（`['mem', 'email'].join('_')`）で literal 合成回避 | `git grep -nE "join\\(['\\\"]\\_['\\\"]\\)" apps packages` | レビューで意図確認 |
| import re-export を経由した間接参照 | 正本以外からの re-export がないこと | `git grep -nE "export.*from.*field" packages apps` で正本のみ確認 |

## 6. CODEOWNERS / governance 整合

正本 supply module は CODEOWNERS の対象に含まれるべき。

| パス | owner（CODEOWNERS） | 備考 |
| --- | --- | --- |
| `packages/shared/src/zod/field.ts` | `* @daishiman` (global fallback) | solo dev のため明示 owner 指定不要 |
| `packages/integrations/google/src/forms/mapper.ts` | `* @daishiman` | 同上 |
| `apps/api/**` | `apps/api/** @daishiman` | 既存 |
| `apps/web/**` | `apps/web/** @daishiman` | 既存 |

## 実行タスク

- [ ] secret hygiene 4 観点を `outputs/phase-09/main.md` に記録
- [ ] 不変条件 11 件レビュー結果表を確定（主軸 #1 / #2 / #4 強化を明示）
- [ ] 4 種品質ゲート + install 整合性のコマンドを runbook 化
- [ ] L4 intentional violation 手順を Phase 11 へ引き継ぎ
- [ ] bypass 経路 4 件の閉塞を確認

## 完了条件

- [ ] secret hygiene 4 観点合格設計済み
- [ ] 不変条件 11 件評価記録、主軸 3 件で「強化」判定
- [ ] 4 種品質ゲート + install 整合性のコマンド固定
- [ ] L4 intentional violation 手順を Phase 11 引継ぎ
- [ ] bypass 経路 4 件の閉塞ルール明示

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] `outputs/phase-09/main.md` 作成済み
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (リリース準備)
- 引き継ぎ: 4 ゲート結果サマリ / L4 evidence 取得計画 / bypass 監査ポリシー

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-08/main.md` | performance / operations 方針 |
| 必須 | `phase-11.md` | NON_VISUAL evidence 取得先 |
| 必須 | `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-09/main.md` | 親 workflow の品質ゲート設計 |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-09/main.md` | security / quality gate サマリ |

## 統合テスト連携

Phase 11 は本 Phase の secret hygiene、4 ゲート、L4 intentional violation 手順を evidence plan として実行する。
