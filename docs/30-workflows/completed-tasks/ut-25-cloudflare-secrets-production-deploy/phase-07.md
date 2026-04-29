# Phase 7: AC マトリクス（受入条件 × Phase 1-13 マッピング）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（AC-1〜11 を Phase 1-13 / T1〜T11 / 成果物にマッピング） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending（仕様化のみ完了） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

`index.md` §受入条件 に列挙された AC-1〜AC-11 を、Phase 1〜13 のどこで・どの T（Phase 4 / 6 由来）/ どの成果物で・どう満たすかを **マトリクスとして固定する**。本 Phase は AC の追跡可能性確保のみで、実走を伴わない。Phase 13 で評価される成果物（`outputs/phase-13/secret-list-evidence-{staging,production}.txt` / `deploy-runbook.md` / `rollback-runbook.md`）との 1:1 対応を明示する。

## 実行タスク

- タスク1: AC-1〜11 を一覧化し、対応 Phase / 成果物 / T を 1:N でマッピングする。
- タスク2: AC × Phase / AC × T / AC × 成果物 の 3 軸対応表を空セルゼロで作成する。
- タスク3: 未消化 AC が無いことを Phase 8〜10 ゲート入力として確認する。
- タスク4: Phase 13 成果物との 1:1 対応を別表で固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/index.md §受入条件 | AC-1〜11 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-04.md | T1〜T5（happy path） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-06.md | T6〜T11（fail path） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-02/main.md | 投入経路 / state ownership |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-03/main.md | MINOR 追跡 / NO-GO / blocked |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-07.md | フォーマット参照 |

## 実行手順

1. index.md §受入条件 から AC-1〜11 を写経する。
2. AC × Phase × T × 成果物 を 1:N で表にする（空セル無し）。
3. Phase 13 成果物との 1:1 対応を別表で固定する。
4. 未消化 AC が無いことを Phase 8〜10 ゲート入力として確認する。

## 統合テスト連携

Phase 8（DRY 化）/ Phase 9（品質保証）/ Phase 10（最終レビュー）の GO/NO-GO 判定で、本 Phase の AC マトリクスを再利用する。AC ↔ T ↔ 成果物の 3 軸対応関係が空欄なく埋まっていることが Phase 10 通過条件。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC-1〜11 × Phase 1〜13 × T1〜T11 × 成果物 マッピング / Phase 13 成果物 1:1 対応表 |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## AC 一覧（出典付き）

`index.md` §受入条件 より AC-1〜AC-11（全 11 件）。

| ID | 内容 |
| --- | --- |
| AC-1 | `bash scripts/cf.sh` ラッパー経由でのみ wrangler を呼び出す（直接呼び出し禁止） |
| AC-2 | secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` が staging / production 両環境に投入される手順が定義（staging-first 順序固定） |
| AC-3 | SA JSON 内 `private_key` 改行を壊さない投入経路（`cat sa.json \| wrangler secret put` または stdin 注入）が仕様化 |
| AC-4 | シェル履歴汚染防止（`HISTFILE=/dev/null` / `set +o history` / 1Password 経由直接 stdin 注入）が手順に組み込まれている |
| AC-5 | 投入後 `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で `GOOGLE_SERVICE_ACCOUNT_JSON` の存在が staging / production それぞれで確認される |
| AC-6 | ローカル開発用 `apps/api/.dev.vars` の設定手順と `.gitignore` 除外確認が定義 |
| AC-7 | rollback 経路（`wrangler secret delete` + 旧 key 再投入）が runbook に明記 |
| AC-8 | 配置完了後、UT-03 runbook（または該当 docs）への配置完了記録の反映ルートが定義 |
| AC-9 | 本ワークフローはタスク仕様書整備に閉じ、実 secret 投入は Phase 13 ユーザー承認後の別オペレーション |
| AC-10 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 で全 PASS 確定 |
| AC-11 | Phase 1〜13 の状態が `artifacts.json` の `phases[]` と完全一致（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`） |

## 完了条件

- [ ] AC-1〜11 が `outputs/phase-07/main.md` に写経されている
- [ ] AC × Phase の対応マトリクスが空セル 0
- [ ] AC × T（T1〜T11）の対応マトリクスで AC-1〜AC-8 が最低 1 件の T で被覆（AC-9 / AC-10 / AC-11 は構造的被覆）
- [ ] AC × 成果物 の対応マトリクスで全 AC が最低 1 件の成果物に紐付く
- [ ] Phase 13 成果物（evidence / deploy-runbook / rollback-runbook）との 1:1 対応表が完成

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-07/main.md
rg -c "^\| AC-(1[0-1]|[1-9]) " docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-07/main.md
# => 11 以上（AC-1〜11 の行が全件存在）
```

## 多角的チェック観点（AIが判断）

- AC × Phase で空セルがないか（`-` のみのセルは構造的被覆と注記する）。
- AC-1（cf.sh ラッパー）が全 Phase の検証コマンドで実際に使われているか。
- AC-9（実投入は Phase 13 後の別オペレーション）が Phase 4〜6 で「実走禁止」として一貫しているか。
- AC-10 / AC-11 が Phase 1 / 3 / artifacts.json で構造的に被覆されており、T で被覆する必要がないことが明示されているか。
- Phase 13 成果物との 1:1 対応で `outputs/phase-13/secret-list-evidence-{staging,production}.txt` が AC-2 / AC-5 と紐付いているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × Phase 表 | 7 | pending | 11 行 |
| 2 | AC × T 表 | 7 | pending | T1〜T11 |
| 3 | AC × 成果物 表 | 7 | pending | 1:N |
| 4 | Phase 13 成果物 1:1 対応 | 7 | pending | evidence / runbook |
| 5 | 未消化 AC チェック | 7 | pending | 空セル 0 |

## 苦戦防止メモ

1. **空セルゼロを機械チェック**: 1 セルでも空だと Phase 8〜10 で再掘り起こしが発生。Phase 7 完了時に `rg "\| - \|"` 等で再点検。
2. **AC-9 / AC-10 / AC-11 は T 群ではなく構造で被覆**: テストでカバーしようとすると無限ループ。Phase 1〜3 ドキュメント / artifacts.json / index.md の存在で被覆する旨を明記。
3. **AC-1 はすべての Phase で間接被覆**: `bash scripts/cf.sh` 呼出が Phase 4〜6 / 11 / 13 すべての検証コマンドに使われていることを示す。
4. **Phase 13 成果物 1:1 対応**: `secret-list-evidence-staging.txt` ↔ AC-5 staging / `secret-list-evidence-production.txt` ↔ AC-5 production / `deploy-runbook.md` ↔ AC-2 / AC-7 / AC-8 / `rollback-runbook.md` ↔ AC-7 を明示。
5. **本 Phase は実走しない**: マッピング作業のみ。

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `outputs/phase-07/main.md` に反映
- AC-1〜11 の 11 行が表に存在
- artifacts.json の `phases[6].status` は `pending`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC-1〜11 × Phase 1-13 × T1〜T11 × 成果物 の対応マトリクスを Phase 8 / 9 / 10 GO/NO-GO 判定の根拠に再利用
  - 未消化 AC が無いことを Phase 8 DRY 化レビューでも再確認
  - Phase 13 成果物との 1:1 対応表は Phase 11 smoke / Phase 12 documentation-changelog で参照
- ブロック条件:
  - AC × Phase / AC × T / AC × 成果物 のいずれかで空セル
  - AC-1〜AC-8 のうち T 被覆漏れ
  - Phase 13 成果物 1:1 対応表で `secret-list-evidence-{staging,production}.txt` / `deploy-runbook.md` / `rollback-runbook.md` のいずれかが AC に紐付かない
