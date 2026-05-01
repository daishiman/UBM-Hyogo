# Phase 8 成果物: NON_VISUAL 代替検証 / production read-only smoke plan

> 本ドキュメントは Phase 8（リファクタリング / E2E 代替検証）の close-out 成果物。`phase-08.md` を SSOT とし、本ファイルは要約と運用 runbook 統合版である。実打ちは受け側実装タスク `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` が script 実装後に実施する。本 Phase は spec のみ。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 |
| Phase | 8 / 13 (リファクタリング / E2E 代替検証) |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |
| 状態 | spec_created |

## 2. NON_VISUAL である根拠

inventory script は UI を持たず、Cloudflare API への read-only HTTP GET の結果を CLI 標準出力 / JSON ファイル / Markdown ファイルに出力するワンショット運用 script である。Playwright 等のブラウザ E2E は適用不能であり、代替として **production read-only API smoke** を 1 回手動実行し、その出力を Phase 11 evidence として記録する。

| 観点 | 内容 |
| --- | --- |
| UI 不在 | 出力は CLI / JSON / Markdown のみ。DOM 描画なし |
| 操作主体 | 運用者が CLI から 1 回実行するワンショット script |
| 視覚的副作用 | Cloudflare ダッシュボード DOM への変更なし（read-only API のみ） |
| Playwright 適用可否 | 不適用。ブラウザコンテキストを必要とする AC が存在しない |

## 3. production read-only smoke runbook（4 ステップ）

実打ちは受け側実装タスクが script 実装後に行う。本 Phase では順序と期待結果のみを確定する。

### ステップ 1: 認証確認

```bash
bash scripts/cf.sh whoami
```

期待: 認証済み account / API token scope が出力される。token 値そのものは出力されない（whoami は account 情報のみ）。

### ステップ 2: script 実行（実装後に確定する placeholder）

```bash
# 受け側実装タスクが確定する placeholder（コマンド名は本 Phase では未確定）
# bash scripts/cf.sh <route-inventory-subcommand> \
#     --config apps/web/wrangler.toml \
#     --env production \
#     --output outputs/phase-11/inventory.json
```

固定事項（本 Phase で確定）:

- `bash scripts/cf.sh` ラッパー経由であること（`wrangler` 直接実行は禁止）
- `--env production` を指定すること
- 出力先は `outputs/phase-11/` 配下であること

### ステップ 3: 出力ファイル検証

| 検証項目 | コマンド例 | 期待結果 |
| --- | --- | --- |
| 出力 JSON の存在 | `test -f outputs/phase-11/inventory.json` | 存在 |
| 出力 Markdown の存在 | `test -f outputs/phase-11/inventory.md` | 存在 |
| `ubm-hyogo-web-production` の出現 | `grep -c 'ubm-hyogo-web-production' outputs/phase-11/inventory.json` | >= 1 |
| `mismatches` セクションの記載 | `grep -E 'mismatches' outputs/phase-11/inventory.json` | 想定どおり（空配列なら split-brain なし） |

### ステップ 4: secret 漏洩 grep（必須）

Phase 7 §「secret-leak 検出テスト」で確定した正規表現を出力ファイルに対して実行する。

```bash
# Bearer prefix
grep -E 'Bearer\s+[A-Za-z0-9._-]+' outputs/phase-11/inventory.json outputs/phase-11/inventory.md
# 期待: 0 件

# CLOUDFLARE_API_TOKEN 直書き
grep -E 'CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+' outputs/phase-11/inventory.json outputs/phase-11/inventory.md
# 期待: 0 件

# OAuth token プレフィックス
grep -E 'ya29\.|ghp_|gho_' outputs/phase-11/inventory.json outputs/phase-11/inventory.md
# 期待: 0 件
```

> いずれかが 1 件でも検出された場合は **出力ファイルを即削除** し、受け側実装タスクへ差し戻す。

## 4. production mutation 非実行境界（再掲）

本タスクは Phase 1 / 3 と整合し、以下を **本 Phase 内で一切実行しない**。

| 操作 | 状態 |
| --- | --- |
| `bash scripts/cf.sh deploy` | 非実行 |
| route の付け替え（dashboard / API） | 非実行 |
| custom domain の付け替え | 非実行 |
| `bash scripts/cf.sh secret put` | 非実行 |
| 旧 Worker の削除 / 無効化 | 非実行 |
| DNS record の編集 | 非実行 |

read-only API hit のみが本 Phase で許容される操作である。

## 5. NO-GO 3 軸との対応

| NO-GO 軸 | 本 Phase での担保 |
| --- | --- |
| mutation endpoint 誤呼び出し | runbook ステップ 2 placeholder に `--env production` 指定だが mutation コマンドは含まない。Phase 11 で `mutation-endpoint-grep.md` により再検証 |
| secret 漏洩 | runbook ステップ 4 で 3 種類の grep を必須化。0 件期待 |
| wrangler 直接実行 | runbook 全ステップが `bash scripts/cf.sh` 経由。`wrangler` 文字列は本 spec 内 0 件 |

## 6. AC との対応

| AC | 本 Phase での担保 |
| --- | --- |
| AC-1（read-only API のみ使用） | runbook ステップ 2 で `--env production` の read-only smoke のみ実行 |
| AC-2（出力 JSON / Markdown 形式） | ステップ 3 で `inventory.json` / `inventory.md` 両方の存在確認 |
| AC-3（secret 不在） | ステップ 4 で 3 正規表現 0 件 |
| AC-4（`bash scripts/cf.sh` 経由） | 全ステップが `bash scripts/cf.sh` 経由 |
| AC-5（production mutation 非実行） | §4 の 6 操作非実行表 |

## 7. Phase 11 evidence への転記経路

| 出力ファイル | Phase 11 evidence path |
| --- | --- |
| `outputs/phase-11/inventory.json` | そのまま evidence として保存 |
| `outputs/phase-11/inventory.md` | そのまま evidence として保存 |
| secret 漏洩 grep の結果 | `outputs/phase-11/secret-leak-grep.md` に転記 |
| mutation endpoint grep の結果 | `outputs/phase-11/mutation-endpoint-grep.md` に転記 |

## 8. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | mock fixture で確立した出力形状を、本 Phase 実打ちで実値突合 |
| Phase 9 | 同 runbook を staging Worker（`ubm-hyogo-web-staging` 等）にも適用し、staging fixture を別 evidence として取得 |
| Phase 10 | smoke 実行計画（secret 0 件 / `ubm-hyogo-web-production` 出現 >= 1 の期待条件）を Design GO/NO-GO 根拠に使用 |
| Phase 11 | 本 Phase で取得予定の JSON / Markdown を `outputs/phase-11/` 配下 evidence として保存 |
| 受け側実装タスク | runbook をそのまま実装後の手動検証手順として handoff |

## 9. 完了条件チェック

- [x] Playwright E2E 不適用の根拠を §2 に記述
- [x] 4 ステップ runbook を §3 に順序付きで定義（whoami → 実行 → 出力検証 → secret grep）
- [x] `wrangler` 直接実行が本ファイル内 0 件（`bash scripts/cf.sh` 経由のみ）
- [x] secret 漏洩 grep を Phase 7 と同じ 3 種類正規表現で再掲
- [x] 出力ファイルを `outputs/phase-11/` 配下へ転記する経路を §7 に明示
- [x] production mutation 非実行を §4 で 6 操作の表化
- [x] NO-GO 3 軸 / AC-1〜AC-5 への対応を §5・§6 に明示

## 10. 次 Phase への引き渡し

- 次 Phase: 9（ステージング検証 / multi-env / staging fixture）
- 引き継ぎ事項:
  - 4 ステップ runbook → Phase 9 で staging Worker に `--env staging` 引数差し替えのみで適用
  - 出力 JSON / Markdown 形式 → Phase 9 multi-env config table の比較基準
  - secret 漏洩 grep → Phase 9 でも staging 出力に対して同パターン適用
  - production mutation 非実行境界 → Phase 9 / 11 で同一文言再掲
- ブロック条件:
  - runbook に `wrangler` 直叩きが残存
  - secret grep 正規表現が Phase 7 と乖離
  - production mutation 非実行が Phase 1 / 3 と矛盾
