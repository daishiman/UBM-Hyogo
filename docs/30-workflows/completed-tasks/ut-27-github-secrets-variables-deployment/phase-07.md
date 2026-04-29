# Phase 7: AC マトリクス（受入条件 × Phase 1-13 マッピング）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（AC-1〜15 を Phase 1-13 / T1〜T11 / 成果物 にマッピング） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending（仕様化のみ完了） |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

index.md §受入条件 / phase-01.md で確定した AC-1〜15 を、Phase 1〜13 のどこで・どの T（Phase 4 / 6 由来）/ どの成果物で・どう満たすかを **マトリクスとして固定する**。本 Phase は AC の追跡可能性確保のみで、実走を伴わない。AC × Phase × T × 成果物の 4 軸対応関係が空欄なく埋まっていることが Phase 9 / 10 GO 条件の入力。

## 実行タスク

- タスク1: AC-1〜15 を一覧化し、対応 Phase / 成果物 / T を 1:N でマッピングする。
- タスク2: 親仕様 §AC（一覧）と index.md 設計追加 AC を出典付きで分離して写経する。
- タスク3: Phase 7 で「空セルなし」「未消化 AC なし」を確認する。
- タスク4: AC-12（上流 3 件 3 重明記）/ AC-15（artifacts.json 完全一致）の構造的被覆を引用付きで確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | 親仕様 AC 起源 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md §受入条件 | AC-1〜15 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-01.md | AC × Phase 1 入力 / 上流 3 件 3 重明記 1/3 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-02.md | AC × Phase 2 入力 / 上流 3 件 3 重明記 2/3 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-03.md | AC × Phase 3 入力 / 上流 3 件 3 重明記 3/3 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-04.md | T1〜T5（happy path） |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-06.md | T6〜T11（fail path） |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/artifacts.json | Phase 1-13 状態 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-07.md | フォーマット参照 |

## 実行手順

1. index.md §受入条件 の AC-1〜15 を写経する。
2. AC × Phase の対応マトリクスを 1:N で表にする（空セル無し）。
3. AC × T（T1〜T11）の対応マトリクスで全 AC を最低 1 件の T で被覆（構造的 AC は構造引用で代替）。
4. AC × 成果物 の対応マトリクスで全 AC を最低 1 件の成果物に紐付ける。
5. AC-12（上流 3 件 3 重明記）/ AC-15（artifacts.json 完全一致）を構造引用で被覆確認する。
6. 未消化 AC が無いことを Phase 9 / 10 ゲート入力として確認する。

## 統合テスト連携

Phase 9（品質保証）/ Phase 10（最終レビュー）の GO/NO-GO 判定で、本 Phase の AC マトリクスを再利用する。AC ↔ Phase ↔ T ↔ 成果物 の 4 軸対応関係が空欄なく埋まっていることが Phase 10 通過条件。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC-1〜15 × Phase 1〜13 × T1〜T11 × 成果物 マッピング |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## AC 一覧（出典付き / index.md §受入条件 写経）

| ID | 内容 | 出典 |
| --- | --- | --- |
| AC-1 | `CLOUDFLARE_API_TOKEN` が必要スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）で配置される手順が仕様化されている | index.md / 親仕様 §苦戦箇所 #5 |
| AC-2 | `CLOUDFLARE_ACCOUNT_ID` の配置先（repository-scoped vs environment-scoped）と配置手順が仕様化されている | index.md / Phase 2 配置決定マトリクス |
| AC-3 | `DISCORD_WEBHOOK_URL` の配置手順が仕様化され、運用判断で未設定の場合の取り扱い（CI が落ちないこと）が明記されている | index.md / 親仕様 §苦戦箇所 #3 |
| AC-4 | `CLOUDFLARE_PAGES_PROJECT` が **Variable**（Secret ではない）として配置される設計理由（CI ログマスクされない / suffix 連結の可視性）が明文化されている | index.md / 親仕様 §「Variable にする理由」 |
| AC-5 | GitHub Environments の `staging` / `production` を作成する手順が `gh api repos/.../environments/...` ベースで仕様化されている | index.md / Phase 2 §`gh` CLI 草案 |
| AC-6 | repository-scoped vs environment-scoped の配置決定マトリクスが Secret / Variable ごとに記述されている | index.md / Phase 2 §配置決定マトリクス |
| AC-7 | `dev` ブランチへの push で `backend-ci.yml` の `deploy-staging` が成功することを確認する手順が定義されている | index.md / Phase 4 T3 |
| AC-8 | `dev` ブランチへの push で `web-cd.yml` の `deploy-staging` が成功することを確認する手順が定義されている | index.md / Phase 4 T3 |
| AC-9 | Discord 通知が成功すること、または `DISCORD_WEBHOOK_URL` 未設定時に CI 全体が落ちないことを確認する手順が定義されている | index.md / Phase 4 T4 / Phase 6 T7 |
| AC-10 | 1Password Environments と GitHub Secrets / Variables の同期手順（手動同期 + 将来の `op` サービスアカウント化方針）が運用ドキュメント追記方針として記述されている | index.md / Phase 2 §1Password 同期手順 |
| AC-11 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 の双方で PASS 確認されている | index.md / phase-01.md / phase-03.md |
| AC-12 | 上流タスク（UT-05 / UT-28 / 01b）完了確認が Phase 1（前提）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記されている | index.md / phase-01.md / phase-02.md / phase-03.md |
| AC-13 | secret / token 値が一切 payload / runbook / ログ / Phase outputs に転記されない方針が明文化されている | index.md / 親仕様 §苦戦箇所 #5 / CLAUDE.md |
| AC-14 | `if: ${{ always() && secrets.X != '' }}` の評価不能問題に対する代替設計（env で受けてシェルで空文字判定）が動作確認項目で扱われている | index.md / 親仕様 §苦戦箇所 #3 / Phase 4 T4 / Phase 6 T7 |
| AC-15 | Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed` / Phase 4〜13 = `pending` | index.md / artifacts.json |

## 完了条件

- [ ] AC-1〜15 が `outputs/phase-07/main.md` に写経されている
- [ ] AC × Phase の対応マトリクスが空セル 0
- [ ] AC × T（T1〜T11）の対応マトリクスで全 AC が最低 1 件の T で被覆（AC-12 / AC-15 は構造引用で代替）
- [ ] AC × 成果物 の対応マトリクスで全 AC が最低 1 件の成果物に紐付く
- [ ] AC-12（3 重明記）の引用箇所が Phase 1 / 2 / 3 から 3 行とも明示される
- [ ] AC-15（artifacts.json 完全一致）が Phase 1〜13 全行で ✓

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-07/main.md
rg -c "^\| AC-(1[0-5]|[1-9]) " docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-07/main.md
# => 15 以上
```

## 苦戦防止メモ

1. **空セルゼロを機械チェック**: 1 セルでも空だと Phase 9 / 10 で再掘り起こしが発生する。Phase 7 完了時に `rg "\| - \|"` 等で「-」セルを再点検し、AC-12 / AC-15 のような構造的 AC については「構造引用で被覆」と明示注記する。
2. **AC-12（3 重明記）の自己検証**: Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §依存タスク順序（重複明記 3/3）の 3 行を引用する。
3. **AC-9 / AC-14 は T4 と T7 で挟む**: happy path（T4 ケース A + B）+ fail path（T7 旧パターン検出）の両側で被覆していることを表で示す。
4. **AC-13 は全 Phase × 全 T で被覆**: secret 値転記禁止は単一 T ではなく全成果物の不変条件。マトリクスでは「全 T で `op://...` 参照のみ」と明示する。
5. **AC-1（最小スコープ）は T8 で具体化**: Phase 6 異常系で過剰 / 不足のシナリオを定義し、Cloudflare ダッシュボード目視と dev push smoke の 2 経路で被覆。
6. **本 Phase は実走しない**: マッピング作業のみ。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC-1〜15 × Phase 1-13 × T1〜T11 × 成果物 の対応マトリクスを Phase 9 / 10 GO/NO-GO 判定の根拠に再利用
  - 未消化 AC が無いことを Phase 8 DRY 化レビューでも再確認
  - AC-7 / AC-8（dev push CD green）/ AC-9（Discord 未設定耐性）/ AC-10（1Password 同期）の 4 件は実走確認が要件 → Phase 11 manual-smoke-log.md / Phase 13 verification-log.md で最終証跡化
- ブロック条件:
  - AC × Phase / AC × T / AC × 成果物 のいずれかで空セル
  - AC-1〜15 のうち被覆漏れ
  - AC-12（3 重明記）の引用箇所が 3 箇所揃わない
  - AC-15（artifacts.json 完全一致）が Phase 1〜13 全行で ✓ になっていない
