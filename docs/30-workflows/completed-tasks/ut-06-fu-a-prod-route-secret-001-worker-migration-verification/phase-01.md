# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | 2-plus |
| 実行種別 | serial（親 UT-06 production deploy の直前ブロッカー） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | docs-only / infrastructure-verification（runbook / checklist / 設定スナップショット markdown のみ） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #246 |

## 目的

UT-06-FU-A（OpenNext Workers 移行）で `apps/web/wrangler.toml` を Pages → Workers 形式へ変更し、`[env.production].name = "ubm-hyogo-web-production"` で Worker 名を分離した結果生まれた **「route / custom domain / secrets / observability の Worker スコープ split brain リスク」** を、production deploy 承認直前に確実に潰すための **Worker 名差分検証チェックリスト** を仕様レベルで定義する。

実装作業ではなく、`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下 runbook に追記する **手順書の要件** を Phase 2 が一意に書き起こせるよう、AC・スコープ・制約・リスク・依存境界を本 Phase で固定する。

## 真の論点 (true issue)

- 「Worker をデプロイすること」ではなく、「**旧 Worker（rename 前 entity）と新 Worker `ubm-hyogo-web-production` のどちらに route / secret / observability が紐付いているかを deploy 承認の前に snapshot として可視化し、差分を非破壊な順序で再注入できる手順を runbook に固定すること**」が本タスクの本質である。
- 副次的論点として、`wrangler` 直接実行禁止（CLAUDE.md ルール）の下で、すべての検証コマンドが `bash scripts/cf.sh` ラッパー経由で完結することを保証し、ローカル OAuth トークンや `.env` 実値が漏洩する経路を排除する。
- 本タスクは production deploy 自体を **実行しない**。旧 Worker の物理削除や DNS 切替も実行しない（rollback 余地確保 / 別タスク責務）。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は runbook / checklist / 設定スナップショット markdown のみ。UI スクリーンショット対象なし |
| 成果物の物理形態 | テキスト（Markdown） | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下追記と本タスク `outputs/phase-XX/*.md` |
| 検証方法 | runbook walk-through（Phase 11）/ doc レビュー / `bash scripts/cf.sh` 実行ログ（key 名のみ・値含めない）の貼付 | Phase 11 で手動 smoke 相当を実施 |

artifacts.json の `metadata.visualEvidence` を `NON_VISUAL` で確定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) | `apps/web/wrangler.toml` の Pages → Workers 移行完了 / `[env.production].name = "ubm-hyogo-web-production"` 確定 | route / secret / observability 検証チェックリスト（追記版 runbook） |
| 上流 | UT-06-FU-A Phase 12 unassigned-task-detection (UNASSIGNED-FU-A-002) | 検出ログ（本タスクの発生根拠） | spec 化されたタスク（本ドキュメント） |
| 上流 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `bash scripts/cf.sh` ラッパー一本化方針 | 全検証コマンドの ラッパー経由統一 |
| 上流 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare デプロイ規約 | 整合性確認の参照点 |
| 並列 | UT-06-FU-A-OPEN-NEXT-CONFIG-REGRESSION-TESTS | `wrangler.toml` の drift 検出方針 | secret / route 検証の前提となる設定 drift 0 |
| 下流 | UT-06 production deploy execution | 本タスクで承認された Worker 検証チェックリストの runbook | deploy 承認の前提（Worker 名一致 / secret 完全性 / observability target 一致） |
| 下流 | UT-16 (DNS / custom domain 切替) | 本タスクは DNS 切替を含まない境界 | route 移譲判断の入力 |

## 要件

### 4 領域 × 確認・差分・再注入の AC マトリクス

| # | 領域 | 確認項目 | 差分検出方法 | 再注入 / 是正手順 |
| --- | --- | --- | --- | --- |
| R1 | Worker 名 inventory | 旧 Worker 名 / 新 Worker `ubm-hyogo-web-production` の存在確認 | `bash scripts/cf.sh` で Workers 一覧取得 + `apps/web/wrangler.toml` の `[env.production].name` 突合 | 旧 Worker 残置時は処遇判断（残置 / 無効化 / route 移譲）を runbook に記録。物理削除は本タスクで実施しない |
| R2 | route / custom domain | 該当 route が新 Worker を指すか | Cloudflare ダッシュボード Routes 画面 + API（`bash scripts/cf.sh` 経由スクリプト化） | 旧 Worker を指す route は deploy 前に新 Worker へ付け替える計画を runbook に明記（実行は別承認） |
| R3 | secrets | 想定 secret 一覧（1Password / `.dev.vars` 想定リスト）と Worker 側 secret list の差分 | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production`（key 名のみ取得・値含めない） | `bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production` で再注入。値は op 参照経由で渡しログに残さない |
| R4 | observability | Tail / Logpush / Workers Analytics の target Worker 名が `ubm-hyogo-web-production` か | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` 実行可否 + ダッシュボードで Logpush / Analytics の dataset binding 確認 | 旧 Worker 名指定が残っていれば設定書き換え手順を runbook に明記。deploy 直後に新 Worker のログが流れることを確認 |

## 実行タスク

1. 4 領域（Worker inventory / route / secret / observability）の受入基準を固定する。
2. docs-only / NON_VISUAL の境界を確定する。
3. 本タスクで実行しない production deploy / DNS 切替 / secret 値取得 / Worker 削除を明示する。
4. Phase 2 以降へ引き渡す AC-1〜AC-5 と依存境界を記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 原典 | `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md` | scope / AC / risk |
| 正本 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | OpenNext Workers deployment contract |
| 運用 | `CLAUDE.md` | Cloudflare CLI wrapper rule |

## 成果物 / 実行手順

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-01/main.md` | 要件 baseline / AC coverage / 4 条件 check |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 4 領域 AC matrix を設計入力にする |
| Phase 11 | NON_VISUAL evidence の範囲を引き渡す |
| Phase 12 | docs-only / spec_created close-out 根拠にする |

### 想定 AC（正本 §2.2 を 5 件展開）

- **AC-1**: production deploy 前チェックリスト（route / custom domain / secrets / observability の 4 領域）が `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下 runbook に追記され、レビュー可能な状態になる。
- **AC-2**: `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` 出力スナップショット（key 名のみ）が取得され、想定 secret 一覧との差分が **0** であることが runbook 添付の表で確認できる。
- **AC-3**: route / custom domain が新 Worker (`ubm-hyogo-web-production`) を指していることがダッシュボード or API 経由で確認され、Worker 名スナップショット（旧名残存ゼロ）が runbook に貼付される。
- **AC-4**: production deploy 直後に `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` が新 Worker を tail でき、1 リクエスト分のログを取得できる手順が runbook に記載される（**deploy 自体は本タスク実行外**）。
- **AC-5**: 旧 Worker の処遇（残置 / 無効化 / 削除 / route 移譲）の判断が runbook に明記され、rollback 余地確保の観点から「新 Worker 安定確認まで旧 Worker は削除しない」原則が文書化される。

## スコープ（正本 §2.3）

### 含むもの

- production deploy 承認前の Worker 名 / route / secret / observability 突合チェックリストの作成（runbook 追記）
- `bash scripts/cf.sh secret list|put` を用いた production secret の snapshot と再注入手順整備（**手順整備のみ。secret 値の新規発行は対象外**）
- `bash scripts/cf.sh tail` / Workers Analytics による deploy 直後の観測手順整備
- 旧 Worker（rename 前 entity）の処遇（残置 / 削除 / route 移譲）の判断記録テンプレ整備

### 含まないもの

- **ユーザー承認なしの production deploy 実行**
- **DNS 切替（custom domain 新規追加 / レコード変更）の実施**（DNS 切替自体は UT-16）
- staging 環境の同等確認（staging は別タスクで担保済み）
- secret の値そのものの新規発行（既存値の再注入のみ対象）
- 旧 Worker の物理削除実行（rollback 余地確保のため runbook 上の判断記録に留める）

## 制約

| # | 制約 | 出典 | 順守方法 |
| --- | --- | --- | --- |
| C-1 | `wrangler` 直接実行禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | 全検証コマンドを `bash scripts/cf.sh` 経由に統一する。runbook 内サンプルコマンドも全て ラッパー記法 |
| C-2 | `.env` 実値・OAuth トークンを出力に残さない | CLAUDE.md「禁止事項」 | secret list の出力は **key 名のみ抽出**して runbook に貼付。値・トークンは Read / cat / grep しない |
| C-3 | `wrangler login` のローカル OAuth 保持禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `op run --env-file=.env` 経由の API Token 注入のみを使用 |
| C-4 | production deploy 実行は本タスク対象外 | 正本 §2.3 / §10 備考 | runbook には「deploy はユーザー承認後に別オペレーションで実行」と明記。コマンド例も `# bash scripts/cf.sh deploy ...` のコメントアウト形式で示す |
| C-5 | 旧 Worker の物理削除は本タスクで実行しない | 正本 §4 リスク表 | 「新 Worker 安定確認まで旧 Worker は残置」原則を runbook に記録 |
| C-6 | コード実装を行わない（docs-only） | 本タスク taskType | 成果物は markdown のみ。`apps/web` / `apps/api` への変更は禁止 |

## リスクと対策（正本 §4 を踏襲・展開）

| リスク | 対策 |
| --- | --- |
| production route が旧 Worker を指したまま deploy される | deploy 前チェックリストで route の対象 Worker 名を確認。新 Worker 不在の route は deploy 前に新 Worker へ付け替える計画を runbook に明記 |
| secrets が新 Worker に未注入で 5xx が発生 | `bash scripts/cf.sh secret list --env production` で想定一覧と突合し、不足分を `secret put` で再注入する手順を runbook 化 |
| tail / observability が旧 Worker を観測しており障害検知が漏れる | deploy 直後に `bash scripts/cf.sh tail --env production` で新 Worker (`ubm-hyogo-web-production`) のログが流れることを確認する手順を runbook に追加 |
| 旧 Worker を早期削除して rollback 不能になる | 新 Worker 安定確認まで旧 Worker は残置。削除判断は本タスク runbook に記録（実行は別承認） |
| `wrangler` 直接実行で `.env` 実値が漏洩 / Node バージョン不整合 | CLAUDE.md ルールに従い `bash scripts/cf.sh` ラッパー一本化。直接 `wrangler login` も禁止 |
| 想定 secret 一覧（1Password 側）が古く、差分検出が無意味化 | 想定一覧の出典（1Password Vault / Item path）を runbook に明記し、メンテナンス責務を文書化 |
| 検証コマンドの出力に secret 実値が紛れる | secret list は key 名のみ、tail はログ本文を貼付しない（ハッシュ化 or 1 行サマリのみ）と運用ルール化 |

## 完了条件チェックリスト

- [ ] artifacts.json の `metadata.visualEvidence` が `NON_VISUAL` で確定している
- [ ] artifacts.json の `metadata.taskType` が `docs-only`、`docsOnly: true` で確定している
- [ ] 真の論点が「deploy ではなく Worker 名 split brain の差分可視化と非破壊再注入」に再定義されている
- [ ] 依存境界表に上流 4 / 並列 1 / 下流 2 がすべて前提と出力付きで記述されている
- [ ] 4 領域（R1〜R4）× 確認・差分・再注入のマトリクスが完成している
- [ ] AC-1〜AC-5 が index.md / 正本 §2.2 と整合している
- [ ] スコープ（含む / 含まない）が正本 §2.3 と一致している
- [ ] 制約（C-1〜C-6）に CLAUDE.md `Cloudflare 系 CLI 実行ルール` が反映されている
- [ ] リスク表に正本 §4 の 5 リスクが含まれている
- [ ] 不変条件 #5（D1 直接アクセスは apps/api に閉じる）に違反する設計を要求していない

## 多角的チェック観点

- 不変条件 #5: 本タスクは `apps/web` Worker の inventory / route / secret / observability のみ扱い、D1 アクセスを `apps/web` に開くことを要求しない。
- CLAUDE.md ルール: 全コマンドが `bash scripts/cf.sh` 経由になっているか。`wrangler` の直接利用が runbook サンプルに混入していないか。
- AI 学習混入防止: secret 実値・OAuth トークンを runbook / 仕様書 / 出力ログに転記しない原則が反映されているか。
- rollback 余地: 旧 Worker の早期削除を要求していないか。
- スコープ境界: production deploy 実行 / DNS 切替 / staging 同等確認を **含まない** 旨が明示されているか。

## 次 Phase への引き継ぎ事項

- 真の論点 = Worker 名 split brain の差分可視化 + 非破壊再注入手順の固定化
- 4 領域 R1〜R4 のマトリクスを Phase 2 設計の入力とする
- runbook 追記先 = `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下（具体パスは Phase 2 で確定）
- 全検証コマンドは `bash scripts/cf.sh` ラッパー経由で記述する
- production deploy 実行 / DNS 切替 / 旧 Worker 物理削除は **設計対象外**（境界として明記）
- ブロック条件:
  - taskType が `docs-only` 以外で誤記載
  - visualEvidence が NON_VISUAL 以外で誤確定
  - AC-1〜AC-5 が正本 §2.2 と乖離
  - `wrangler` 直接実行が runbook サンプルに混入する設計
