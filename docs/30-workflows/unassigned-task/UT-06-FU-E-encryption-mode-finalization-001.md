# UT-06-FU-E-ENCRYPTION-MODE-FINALIZATION-001: D1 backup encryption mode finalization

> 発生元: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-06-FU-E-ENCRYPTION-MODE-FINALIZATION-001 |
| タスク名 | D1 backup encryption mode finalization |
| 分類 | follow-up / security-design |
| 対象機能 | R2 D1 backup encryption（SSE-S3 / SSE-C / KMS 採用判定と key rotation SOP）|
| 優先度 | High |
| 見積もり規模 | 中規模 |
| ステータス | open |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-E |
| 発見元 | Phase 12 / `outputs/phase-12/unassigned-task-detection.md` |
| 作成日 | 2026-05-01 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-E（D1 backup 長期保管）の Phase 8 セキュリティ仕様で、機密性レベル L1〜L3 と暗号化方式（SSE-S3 / SSE-C / KMS）の対応関係および base case = L2 / SSE-S3 が固定された。一方で「D1 schema が機微属性を含む方向に変化した場合に L2→L3 へ昇格させる判定基準」「SSE-C / KMS 切替の rotation SOP」「R2 object metadata から方式を evidence として確認する経路」は spec_created の段階にとどまり、Phase 12 SOP からの参照として未確定のまま残っている。

### 1.2 問題点・課題

- D1 export は SQL 平文を含み得るため、SSE-S3（Cloudflare 管理鍵）依存のままでは将来の機微列追加に追従できない。
- L2→L3 昇格 trigger（schema 変更検知 / 取り扱い変更）が文書化されておらず、判断主体と判断時点が曖昧。
- SSE-C / KMS 採用時の鍵管理（escrow / rotation / 復元 drill）が未確定で、key 紛失による復元不能リスクが残る。
- R2 object metadata と暗号化方式の evidence 突合手順が未記述で、Phase 11 S-03 / S-15 の L3 metadata 検証が成立しない。

### 1.3 放置した場合の影響

- 会員 PII を含む export が SSE-S3 のまま長期保管され、機微属性追加時にも昇格されず、漏洩時の blast radius が法的賠償・規約違反水準まで拡大する。
- 鍵 rotation 主体が不在となり、access key / KMS key 漏洩時に即時切替できず、UT-06-FU-E の SLA を維持できない。
- AC-9（暗号化方式記録）の根拠が phase-08 内に閉じ、月次 restore rehearsal SOP に渡されず、運用 drift を検知できなくなる。

---

## 2. 何を達成するか（What）

### 2.1 目的

D1 backup の暗号化方式を「現行 base case（L2 / SSE-S3）」と「昇格時（L3 / SSE-C または KMS）」の 2 系統に分け、(a) 昇格判定基準、(b) key rotation SOP、(c) R2 object metadata 経由の evidence 突合手順を文書として固定する。

### 2.2 最終ゴール

- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` 配下に「暗号化方式決定表 markdown」「key rotation SOP markdown」「R2 metadata evidence sample」を 3 点セットで配置する。
- 月次 restore rehearsal SOP（UT-06-FU-E-MONTHLY-RESTORE-REHEARSAL-SOP-001）と相互参照され、Phase 11 S-03 / S-15 の L3 metadata evidence チェックが SOP として実行可能になる。
- L2→L3 昇格 trigger（schema 変更検知）が grep / SOP の双方で発動可能。

### 2.3 スコープ

#### 含むもの
- L1 / L2 / L3 のデータ分類定義と、それぞれの SSE-S3 / SSE-C / KMS 採用条件
- L2→L3 昇格 trigger（D1 schema 変更検知 / 取り扱い変更）と判定主体
- SSE-C / KMS 採用時の key rotation 手順（生成・配布・escrow・revoke・復元 drill）
- R2 object metadata（`x-amz-meta-encrypted` 等）と方式決定表の evidence 突合手順
- UT-12 R2 storage / UT-06-FU-E phase-08 / phase-11 への参照接続

#### 含まないもの
- 実 KMS key の発行・実 SSE-C key の生成（実値は op:// 参照管理に閉じる）
- production R2 bucket の mutation（実走は Phase 13 ユーザー承認後の別 PR）
- L3 用 SSE-C / KMS の実装コード変更（SOP 文書化に閉じる）
- secret 値そのもののドキュメント記録（`op://` 参照名のみ許可）

### 2.4 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 暗号化方式決定表 | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/encryption-mode-decision.md` | L1〜L3 × SSE-S3 / SSE-C / KMS の採用条件と昇格 trigger |
| key rotation SOP | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/key-rotation-sop.md` | 生成・配布・escrow・revoke・復元 drill 手順 |
| R2 metadata evidence sample | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/r2-metadata-evidence-sample.md` | `bash scripts/cf.sh r2 object get --metadata-only` 出力テンプレ |

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-12 R2 storage setup が完了し、private bucket と SSE-S3 default が有効。
- UT-06-FU-E Phase 8（セキュリティ・コンプライアンス）/ Phase 11（手動 smoke）が `spec_created` で固定済み。
- `scripts/cf.sh` が稼働し、`bash scripts/cf.sh r2 object get --metadata-only` が dev で疎通済み。
- 1Password vault `UBM-Hyogo` が owner / SRE スコープに限定済み。

### 3.2 依存タスク

| 種別 | タスク | 関係 |
| --- | --- | --- |
| 上流 | UT-12 R2 storage setup | bucket / SSE 既定値の前提 |
| 上流 | UT-06-FU-E Phase 8 | 機密性 L1〜L3 / 脅威 S2・S3 / 緩和策表の根拠 |
| 上流 | UT-06-FU-E Phase 11 | S-03 / S-15 の L3 metadata evidence 仕様 |
| 並走 | UT-06-FU-E-MONTHLY-RESTORE-REHEARSAL-SOP-001 | 月次 SOP から本タスク SOP を呼び出す |

### 3.3 必要な知識

- Cloudflare R2 の SSE 仕様（SSE-S3 / SSE-C 互換層）/ private bucket / signed URL 短期発行
- KMS（envelope encryption / DEK・KEK 分離）の概念と key rotation ベストプラクティス
- Cloudflare Secrets / GitHub Secrets / 1Password Environments の責任分界
- L2 / L3 データ分類（PII / 機微情報）の判定軸
- CLAUDE.md §シークレット管理 / §不変条件 #5 / §Cloudflare 系 CLI 実行ルール（`scripts/cf.sh` 経由必須・`wrangler` 直接禁止）

### 3.4 推奨アプローチ

1. Phase 8 の L1〜L3 表を起点に「昇格 trigger」を schema diff ベースで決定可能な形に分解する。
2. SSE-S3（base）と SSE-C / KMS（昇格時）を並列に並べた決定表を 2 軸（機密性 × 採用方式）で固定する。
3. key rotation SOP は「平時（定期）」「緊急（漏洩疑い）」「key 紛失時」の 3 シナリオで分岐させる。
4. evidence は実 secret 値を含めず、`op://` 参照名のみ + R2 metadata 出力テンプレで残す。

---

## 4. 実行手順

### Phase構成

Phase 1（データ分類確定）→ Phase 2（暗号化方式決定表）→ Phase 3（key rotation SOP）→ Phase 4（R2 metadata evidence）の 4 Phase 構成。各 Phase は前 Phase の成果物を入力に取る。

### Phase 1: データ分類確定

#### 目的
D1 schema を走査し、L1 / L2 / L3 への配分と「L2→L3 昇格 trigger」を文書化する。

#### 手順
1. 現行 D1 schema（`apps/api/db/schema/*.ts` 等）から列レベルで PII / 機微属性を洗い出す。
2. Phase 8 §機密性レベル判定表を参照し、現行は L2 ベースであることを再確認する。
3. 「将来 L3 化が必要となる schema 変更」の例（健康情報・本人証明書スキャン・支払関連）を列挙する。
4. 昇格 trigger を「schema diff に新規列が現れた際の SRE レビュー」として固定する。

#### 成果物
`outputs/encryption-mode-decision.md` の §データ分類セクション

#### 完了条件
- L1 / L2 / L3 の対象データが具体的列名 or 抽象カテゴリで列挙されている
- L2→L3 昇格 trigger が schema 変更ベースで判定可能
- 判定主体（SRE）と判定時点（schema PR レビュー時）が明示

### Phase 2: 暗号化方式決定表

#### 目的
L1〜L3 × SSE-S3 / SSE-C / KMS の採用条件を 1 枚の表で固定する。

#### 手順
1. base case（L2 / SSE-S3）を 1 行目に配置し、Phase 8 と整合する記述に統一。
2. L3 昇格時の 1st choice（SSE-C）/ 2nd choice（KMS）の選択基準を運用コスト軸で記述。
3. 各方式の rotation 頻度（L2: 6 ヶ月 / L3: 3 ヶ月）を Phase 8 §機密性レベル判定表と整合させる。
4. R2 object metadata に何が記録されるか（`x-amz-meta-encrypted` / SSE flag）を方式別に列記。

#### 成果物
`outputs/encryption-mode-decision.md` の §方式決定表セクション

#### 完了条件
- 3 方式 × 3 レベルの 9 セルが埋まっている（Not Applicable も明示）
- rotation 頻度が Phase 8 と整合
- 方式別 metadata key 名が記述されている

### Phase 3: key rotation SOP

#### 目的
SSE-C / KMS 採用時の key rotation を「平時 / 緊急 / 紛失時」の 3 シナリオで SOP 化する。

#### 手順
1. 「平時 rotation」: 6 ヶ月 / 3 ヶ月の定期 rotation 手順を `bash scripts/cf.sh secret put` 経由で記述。
2. 「緊急 rotation」: access key 漏洩疑い時の即時 revoke + 新規発行 + bucket 再暗号化の手順。
3. 「key 紛失時」: SSE-C key escrow（1Password vault `UBM-Hyogo` / owner + SRE 限定）からの復旧と、復旧不能時の影響範囲（該当世代のみ復元不能）の宣言。
4. 各シナリオに「復元 drill」を組み込み、rotation 後に必ず別 dev D1 への restore smoke を 1 回実行する。

#### 成果物
`outputs/key-rotation-sop.md`

#### 完了条件
- 3 シナリオすべてに「手順 / 主体 / 所要時間 / 復元 drill」がある
- 全コマンド例が `bash scripts/cf.sh ...` 経由で記述（`wrangler` 直接実行ゼロ）
- secret 値・実 key id が一切記録されていない（op 参照名のみ）

### Phase 4: R2 metadata evidence

#### 目的
R2 object metadata と暗号化方式決定表の evidence 突合手順を Phase 11 S-03 / S-15 の L3 evidence と接続する。

#### 手順
1. `bash scripts/cf.sh r2 object get <bucket>/daily/<date>.sql.gz --metadata-only` の出力テンプレを記述。
2. 出力に含まれる SSE flag / `x-amz-meta-encrypted` / Cloudflare 固有 metadata の解釈表を作る。
3. 月次 restore rehearsal SOP から「metadata 突合チェック」として呼び出される接続点を明記。
4. evidence sample に redaction を適用し、bucket 名・object key を `<redacted>` プレースホルダ化する。

#### 成果物
`outputs/r2-metadata-evidence-sample.md`

#### 完了条件
- metadata 出力テンプレが 1 件以上含まれる
- redaction が `<redacted>` プレースホルダで適用済み
- 月次 SOP との接続点が記述されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] L1 / L2 / L3 のデータ分類が現行 D1 schema に対して具体化されている
- [ ] L2→L3 昇格 trigger が schema 変更ベースで判定可能
- [ ] 暗号化方式決定表（3 方式 × 3 レベル）が完成している
- [ ] key rotation SOP が「平時 / 緊急 / 紛失時」3 シナリオで完成
- [ ] R2 metadata evidence sample が `bash scripts/cf.sh` 経由で取得可能なテンプレを提供

### 品質要件

- [ ] 全コマンド例が `bash scripts/cf.sh ...` 経由（CLAUDE.md §Cloudflare 系 CLI 実行ルール準拠）
- [ ] 不変条件 #5（apps/web から D1 直接アクセス禁止）に違反する記述が一切ない
- [ ] 実 secret 値 / 実 key id / 実 bucket access key が一切記録されていない
- [ ] `op://UBM-Hyogo/...` 参照名のみで secret 経路が記述されている
- [ ] Phase 8 §機密性レベル判定表 / Phase 11 S-03・S-15 と矛盾しない

### ドキュメント要件

- [ ] 3 成果物（encryption-mode-decision.md / key-rotation-sop.md / r2-metadata-evidence-sample.md）が `outputs/` 配下に配置
- [ ] 月次 restore rehearsal SOP（UT-06-FU-E-MONTHLY-RESTORE-REHEARSAL-SOP-001）から相互参照されている
- [ ] CLAUDE.md / `.claude/skills/aiworkflow-requirements/references/database-operations.md` / `references/deployment-cloudflare.md` への参照が記載

---

## 6. 検証方法

### テストケース

| # | 観点 | 手順 | 期待結果 |
| --- | --- | --- | --- |
| V1 | metadata evidence 一致 | `bash scripts/cf.sh r2 object get <bucket>/daily/<date>.sql.gz --metadata-only` を dev で実行し、出力テンプレと突合 | metadata key 名と決定表が一致 |
| V2 | redaction 確認 | `grep -RnE '(AKIA|sk_live|op://[^ ]*/value)' outputs/` を実行 | 0 件（実値が混入していない） |
| V3 | UT-12 接続 | UT-12 R2 storage setup の bucket policy ドキュメントから本決定表が参照可能か | 双方向リンク成立 |
| V4 | 不変条件 #5 | `grep -rnE 'D1Database\|c\.env\.DB\|prepare\(\|wrangler d1 export' outputs/` | 0 件 |
| V5 | wrangler 直接禁止 | `grep -rnE '^[^#]*\bwrangler\s+(d1\|r2\|secret\|deploy)' outputs/` | 0 件（`bash scripts/cf.sh` 経由のみ） |

### 検証手順

1. Phase 1〜4 の成果物 3 点を生成後、V1〜V5 を順に実行する。
2. 月次 restore rehearsal SOP から本タスクの key rotation SOP を `[link](...)` で参照していることを確認する。
3. Phase 11 S-03 / S-15 の L3 metadata evidence ステップが本タスクの evidence sample を呼び出していることを確認する。
4. CLAUDE.md §シークレット管理 / §不変条件 #5 / §Cloudflare 系 CLI 実行ルールとの diff レビューを実施する。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 機密性に対して暗号化が弱い（SSE-S3 のまま機微列追加）| 高 | 中 | schema sensitivity review を月次 restore rehearsal と同時に実施し、L2→L3 trigger を SOP で発動 |
| SSE-C key 紛失で復元不能 | 高 | 低 | key escrow（1Password vault owner + SRE）+ 定期 rotation + restore drill を SOP に必須化 |
| secret 値が docs に混入 | 高 | 中 | `op://` 参照名のみ許可し、`grep` gate（V2）を CI 相当に追加 |
| KMS 採用時の運用コスト過大 | 中 | 中 | base case を SSE-S3 に維持、L3 昇格時のみ KMS を選択肢化（決定表 §運用コスト列で明示） |
| metadata 仕様の Cloudflare 側 drift | 中 | 低 | 月次 SOP で metadata 出力テンプレを実測値と突合、drift 検知時は SOP 改訂 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-08.md`（機密性レベル / 脅威 S2・S3 / 緩和策表）
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-11.md`（S-03 / S-15 の L3 metadata evidence 仕様）
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`（本タスクの発生元）
- `docs/30-workflows/unassigned-task/UT-06-FU-E-monthly-restore-rehearsal-sop-001.md`（並走 SOP / 相互参照）
- `.claude/skills/aiworkflow-requirements/references/database-operations.md`（D1 / R2 運用境界）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（Cloudflare デプロイ運用）
- `CLAUDE.md` §シークレット管理 / §重要な不変条件 #5 / §Cloudflare 系 CLI 実行ルール
- `scripts/cf.sh`（Cloudflare CLI ラッパ正本）

### 参考資料

- Cloudflare R2 Data Security: https://developers.cloudflare.com/r2/buckets/data-security/
- Cloudflare R2 Presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare Audit Logs: https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | D1 export は SQL 平文を含む。現 base case は R2 SSE 標準だが、会員情報や将来の高機密列が増えた場合に SSE-C / KMS へ昇格する判定基準が未固定。 |
| 原因 | Phase 8 で機密性レベル表（L1〜L3）と base case L2 / SSE-S3 は固定したが、昇格 trigger と key rotation 主体・頻度・復元 drill 接続が SOP 化されておらず、Phase 12 SOP からの参照ポイントが宙吊りになった。 |
| 対応 | 本タスクで「暗号化方式決定表 / key rotation SOP / R2 metadata evidence」の 3 点セットに分解し、月次 restore rehearsal SOP と Phase 11 S-03・S-15 L3 evidence へ接続する形で固定する。 |
| 再発防止 | 機密性レベル定義と暗号化方式決定の SSOT を 1 ファイル（`encryption-mode-decision.md`）に集約し、schema PR レビュー時に SRE が L2→L3 trigger を必ず判定する運用ルールを SOP に明記する。 |

### レビュー指摘の原文（該当する場合）

```
（Phase 12 unassigned-task-detection.md より）
Encryption mode finalization for SSE-C / KMS — design follow-up — formalized as
docs/30-workflows/unassigned-task/UT-06-FU-E-encryption-mode-finalization-001.md
```

### 補足事項

- 本タスクは docs-only / NON_VISUAL であり、production bucket mutation を含まない。
- 実走（実 key 発行 / R2 metadata 取得）は Phase 13 ユーザー承認後の別 PR で行う。本タスクは決定表 / SOP / evidence テンプレの文書固定までを完了範囲とする。
- AC-9（暗号化方式記録）の月次 trace は本タスク決定表 + 月次 restore rehearsal SOP の 2 点で担保する。
