# Phase 3: 設計レビュー（実装仕様書化版）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 3 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| 実装区分 | [実装仕様書] |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. Phase 2 設計に対し代替案 4 件を比較する。
2. automation-30 の 3 系統思考法（システム / 戦略 / 問題解決）を適用する。
3. 観点別レビュー（価値性 / 実現性 / 整合性 / 運用性 / 責務境界 / 安全性 / 監査可能性 / テスタビリティ / 機密情報保護 / 拡張性）を実施する。
4. 4 条件評価を再実施し、PASS / MINOR / MAJOR を判定する。

## 目的

実装区分を「実装仕様書」に格上げした構成（runbook + bash scripts F1〜F4 + cf.sh 拡張 F5 + CI gate F6 + bats F7）が、代替案に対して優位であることを示し、Phase 4 進行可否を判定する。

## 代替案比較

### Option A（不採用）: シェルスクリプトを書かず runbook 自然文のみ

| 項目 | 内容 |
| --- | --- |
| 変更量 | runbook 1 本のみ |
| 利点 | 実装コスト最小 |
| 欠点 | 手順逸脱検知不能、CI gate で構造検証不能、redaction 強制不能 |
| 不採用理由 | AC-12（redaction 強制）/ AC-15（CI gate）/ AC-16（bats）を満たせない |

### Option B（不採用）: Node CLI（TypeScript + commander）

| 項目 | 内容 |
| --- | --- |
| 変更量 | TS CLI + 依存追加（commander, vitest） |
| 利点 | 型安全、テストランナー統一（vitest） |
| 欠点 | `cf.sh` の op + esbuild + mise 多段ラップとの噛み合いが悪化、起動オーバーヘッド、シェルワンライナー優位の場面でも node 経由になる |
| 不採用理由 | `cf.sh` 経由のシンプル合成を維持する方針と整合しない。bash で十分 |

### Option C（採用）: bash scripts + bats + CI gate

| 項目 | 内容 |
| --- | --- |
| 変更量 | F1〜F4（bash）+ F5（cf.sh 拡張）+ F6（CI yml）+ F7（bats）+ F9（package.json） |
| 利点 | `cf.sh` の既存 op + esbuild ラップとの整合、起動コスト最小、CI gate で staging DRY_RUN 強制、bats で exit code 回帰検証 |
| 欠点 | bash 固有のテスト容易性は TS より劣るが bats で吸収可能 |
| 採用理由 | AC-1〜AC-20 を全件カバー、CLAUDE.md の Cloudflare CLI 実行ルールと整合 |

### Option D（不採用）: 既存 `scripts/cf.sh` 内に全機能を inline 拡張

| 項目 | 内容 |
| --- | --- |
| 変更量 | `cf.sh` のみを大幅に拡張 |
| 利点 | ファイル数最小 |
| 欠点 | `cf.sh` の責務（wrangler ラッパ）を逸脱、テスト困難、preflight/postcheck/evidence の単体テストが書きにくい |
| 不採用理由 | SRP 違反、F7 bats テストの粒度確保が困難 |

## automation-30 思考法 3 系統適用

### システム系

- F1〜F4 は単一責務に分解された Unix 哲学的なパイプ。各 stage が exit code で次 stage に状態を渡し、orchestrator F4 が集約する構造は composable。
- CI gate（F6）は本番適用前のフィードバックループを短縮する観測装置。staging の DRY_RUN 失敗で PR を block することで、本番 G6 到達前に runbook 構造の破綻を検知できる。
- evidence の `.evidence/d1/<ts>/` は immutable な観測記録で、後続のインシデント調査における正本となる。

### 戦略系

- 短期: bash + bats で MVP 実装。長期: migration 件数増加時に Node CLI への移行を ADR で再評価。
- staging への DRY_RUN を CI gate で常時強制することで、production apply の判断がいつでも「runbook 構造は最新 commit で staging 上 PASS 済み」を前提にできる。
- evidence スキーマを meta.json + 3 ログに固定することで、将来の migration（0009, 0010 …）でも同形式を再利用可能。

### 問題解決系

- 「機密値混入」リスクに対し、F3 で正規表現 grep を強制し exit 80 + ディレクトリ削除でフェイルクローズ。
- 「DB 取り違え」に対し、`--env` バリデーション + DB 名正規表現 + `d1 list` 突合の三重防御。
- 「DDL 不可逆性」に対し、F1 preflight で未適用判定 + F2 postcheck で 5 オブジェクト存在検証 + 失敗時 evidence 保存だけは試みる fail-safe。

## レビュー観点

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | PASS | runbook 文書のみより検証可能性が高く、CI gate で staging 構造破綻を検知可能 |
| 実現性 | PASS | bash + bats + GitHub Actions で標準的、新規依存は bats のみ |
| 整合性 | PASS | `cf.sh` 経由のみ・直 wrangler 禁止・staging secret 限定が CLAUDE.md と整合 |
| 運用性 | PASS | F5 `cf.sh d1:apply-prod` で運用者は単一エントリポイントを記憶すればよい |
| 責務境界 | PASS | F1〜F4 は SRP、F5 は薄ラッパ、F6 は CI gate、F7 はテスト |
| 安全性 | PASS | DRY_RUN モード + confirm prompt + 6 段階ゲート + redaction フェイルクローズ |
| 監査可能性 | PASS | `.evidence/d1/<ts>/meta.json` に commit_sha / approver / dry_run を記録 |
| テスタビリティ | PASS | bats + mock wrangler shim で全 exit code を回帰検証 |
| 機密情報保護 | PASS | F3 redaction が必須、CI gate で production secret 不参照 |
| 拡張性 | PASS | 0009 以降の migration でも同 scripts を再利用可能（DB 名と env 引数のみ変更） |

## 4 条件評価（再評価）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | F1〜F9 と AC-1〜AC-20、6 ゲートが排他で対応 |
| 漏れなし | PASS | runbook 5 セクション × scripts × CI gate × bats が AC を全件カバー |
| 整合性 | PASS | `cf.sh` 経由のみ・set -x 禁止・staging 限定 secret が CLAUDE.md と整合 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済み、下流（実走）は仕様確定後 |

## 指摘事項

| Severity | 内容 | 対応 |
| --- | --- | --- |
| MINOR | bats が CI ランナーに未インストールの場合、apt-get install のオーバーヘッドが発生 | F6 で `sudo apt-get install -y bats` を 1 ステップ化（標準 Ubuntu runner で十分） |
| MINOR | Node CLI への将来移行の ADR がまだ起票されていない | Phase 12 `unassigned-task-detection.md` に候補として記録 |
| MAJOR | なし | - |
| BLOCKING | なし | - |

## ゲート判定

**PASS**: Phase 4（テスト戦略）へ進行可。MINOR 指摘 2 件は Phase 6 / Phase 12 で吸収。blocking なし。

## 完了条件

- [ ] 代替案 4 件比較
- [ ] automation-30 3 系統適用
- [ ] レビュー観点 10 項目評価
- [ ] 4 条件評価 PASS
- [ ] ゲート判定記録

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

設計レビューでは統合テスト不要。bats / CI gate 検証は Phase 4 / Phase 9 で扱う。
