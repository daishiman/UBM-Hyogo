# UT-25-DEFER-01: Cloudflare Workers Secret bulk export（災害復旧用 backup）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DEFER-01 |
| タスク名 | Cloudflare Workers Secret bulk export（災害復旧用 backup） |
| 優先度 | LOW |
| 推奨Wave | DR 計画策定フェーズ |
| 状態 | unassigned (deferred) |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | なし（UT-25 はシークレット初回配置、本タスクは DR 用 backup 経路の整備） |
| 組み込み先 | - |
| 検出元 | UT-25 Phase 12 `docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/unassigned-task-detection.md` deferred セクション |

## 目的

Cloudflare Workers Secret は配置後に値を読み取れないというセキュリティ仕様により、Cloudflare 側からの bulk export は原理的に不可能である。一方で、唯一の正本である 1Password vault が破損・喪失した場合、本番 Workers の secret 値（`GOOGLE_SERVICE_ACCOUNT_JSON` 等）を復元する手段が一切なくなる。本タスクは 1Password Connect API 経由で全 secret を別保管先（暗号化 backup）にエクスポートする経路を整備し、DR 演習で実復旧手順を検証することを目的とする。

## スコープ

### 含む

- 1Password Connect API で対象 vault の全 secret item を読み出すスクリプトの実装
- エクスポートデータを GPG / age 等で対称・公開鍵暗号化する処理
- 暗号化 backup の保管先（例: Cloudflare R2 別アカウント、外部ストレージ、オフラインメディア）の選定方針
- 暗号化鍵（key escrow）の保管経路と分割保管ルールの文書化
- 年次 DR 演習 runbook の作成（backup から 1Password vault を復元 → Cloudflare Secret を再配置 → 疎通確認）
- backup を実行する CLI / スケジュール経路（手動 or Cloudflare Workers Cron）の選定
- 暗号化 backup ファイルへのアクセス監査ログ運用

### 含まない

- Cloudflare Workers Secret 値そのものの読み取り（API 仕様上不可能）
- 1Password vault 自体の高可用性化（1Password ベンダーの責務）
- 本番運用 secret の rotation 自動化（UT-25-DERIV-01 のスコープ）
- secret 監査ログの整備（UT-25-DERIV-03 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25（Cloudflare Secrets 本番配置） | 本番 secret が 1Password に保存・参照運用されている前提が必要 |
| 上流 | UT-25-DERIV-01（SA key 定期ローテーション SOP） | rotation 運用と backup タイミングの整合が必要 |
| 上流 | DR 計画策定（未起票） | DR 全体方針が未確定だと backup 要件・RPO/RTO が定まらない |
| 下流 | DR 演習運用（年次） | 本タスク完了後に演習を回すことで実効性が担保される |

## 着手タイミング

> **着手前提**: DR 計画が策定され、RPO（許容データ消失時間）/ RTO（復旧目標時間）が定義済みであること。1Password vault が単一障害点であることが組織的に認識されていること。

| 条件 | 理由 |
| --- | --- |
| DR 計画策定開始 | backup の RPO/RTO・保管先要件が DR 計画から逆算される |
| 1Password 利用が長期運用フェーズに入った | vault 破損リスクが現実的になり対策の費用対効果が出る |
| Cloudflare Workers 本番運用が定常化 | 本番 secret が複数本に増え、手動復元コストが許容外になる |

## 苦戦箇所・知見

**1. backup の正本は 1Password 側にしか存在しない（二重化の必要性）**
Cloudflare Workers Secret は `secret put` 後に値の読み取りができない（`bash scripts/cf.sh secret list` で名前のみ確認可能）。したがって「Cloudflare 側から secret を吸い上げて backup する」経路は構造的に存在しない。backup の正本は 1Password vault に閉じる。1Password vault が単一障害点になるため、Connect API 経由の export を別ストレージに二重化する必要がある。export 先は 1Password と同一ベンダー（1Password Business のもう 1 vault）にしてはならず、独立したストレージ（例: 別クラウド・オフラインメディア）に置く。

**2. 暗号化 backup の鍵管理（key escrow 問題）**
backup を暗号化する鍵自体が失われると backup 全体が無価値になる。一方で鍵を 1Password に置くと「1Password が壊れたときのための backup」の前提が崩れる（鶏と卵）。対策として以下のいずれかを選ぶ:
- Shamir Secret Sharing（SSS）で鍵を n-of-m 分割し、複数管理者の物理メディアに分散保管
- ハードウェアセキュリティキー（YubiKey 等）に鍵を保管し、複数本を地理的に分散保管
- age recipient を複数登録し、いずれか 1 つの秘密鍵で復号可能にする
本タスクのスコープでは方針選定と運用ルールの文書化までを行い、実鍵の保管メディア選定はオペレーション運用側で実施する。

**3. DR 演習の必要性（年 1 回など）**
backup 経路を整備しても、実際に復旧できるかは演習しなければ判明しない。「backup ファイルが破損していた」「鍵が分割保管者の退職で失われていた」「復旧 runbook が古くて Cloudflare CLI フラグが変わっていた」等の事故は演習でしか発見できない。年 1 回の DR 演習を runbook 化し、演習結果（成功・失敗・所要時間）を記録する経路を整える。演習では本番 vault には影響を与えないため、別環境（DR 検証用 vault）でのリハーサルを基本とする。

**4. 1Password Connect API のレート制限・スコープ**
1Password Connect Server は API トークン単位でアクセス可能 vault が限定される。backup 用に専用トークンを発行し、`read_only` 権限で対象 vault のみにスコープを絞る。レート制限に達した場合の再試行・差分エクスポート（前回 backup 以降に変更があった item のみ取得）を検討する。

**5. 実 secret 値転記禁止**
backup プロセスのログ・エラーメッセージ・運用記録に実 secret 値を残してはならない。export スクリプトは平文を一切ファイルに書き出さず、stdin → 暗号化 → ストレージの pipeline で完結させる。エラー時のスタックトレースに値が混入しないよう、Connect API レスポンスの値フィールドはマスクして扱う。

## 実行概要

1. DR 計画から RPO/RTO・保管先要件を取得し backup 仕様を確定する
2. 1Password Connect Server に backup 専用 read-only API トークンを発行する
3. 対象 vault の全 secret item を取得 → 暗号化 → 別保管先に保存するスクリプトを実装する（平文を一切ファイルに残さない pipeline）
4. 暗号化鍵の管理方針（SSS / ハードウェアキー / age multi-recipient）を選定し運用ルールを文書化する
5. 暗号化 backup ファイルの保管先（独立ストレージ）を選定し、アクセス監査ログ経路を整える
6. backup の実行スケジュール（手動 / Cron）を選定し runbook 化する
7. DR 演習用 runbook を作成する（backup → 復号 → 1Password 復元 → Cloudflare Secret 再配置 → 疎通確認）
8. 初回 DR 演習を別環境で実施し、復旧所要時間と成功可否を記録する
9. 年 1 回の DR 演習スケジュールを運用カレンダーに登録する

## 完了条件

- [ ] 1Password Connect API 経由の暗号化 backup スクリプトが整備されている
- [ ] 暗号化鍵の保管経路（key escrow）と分割保管ルールが文書化されている
- [ ] 暗号化 backup の独立保管先（1Password と別ベンダー）が確保されている
- [ ] DR 演習 runbook（backup → 復号 → 1Password 復元 → Cloudflare Secret 再配置 → 疎通確認）が作成済み
- [ ] 初回 DR 演習が別環境で実施され、結果（成功可否・所要時間）が記録されている
- [ ] 年 1 回の DR 演習スケジュールが運用カレンダーに登録済み
- [ ] backup プロセスのログ・記録に実 secret 値が一切残らないことが確認済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | UT-25 本体（本 deferred タスクの上流） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/unassigned-task-detection.md | 本タスクの検出元 |
| 参考 | https://developer.1password.com/docs/connect/ | 1Password Connect API リファレンス |
| 参考 | https://developers.cloudflare.com/workers/configuration/secrets/ | Cloudflare Workers Secret 仕様（読み取り不可の根拠） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 管理方針 |
| 参考 | https://github.com/FiloSottile/age | age 暗号化ツール（recipient 多重化の参考） |
| 参考 | https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing | Shamir Secret Sharing（鍵分割保管の参考） |
