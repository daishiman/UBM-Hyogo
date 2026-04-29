---
timestamp: 2026-04-29T05:35:38Z
branch: feat/issue-40-ut-25-cloudflare-secrets-prod-task-spec
author: claude-code
type: lessons-learned
---

# UT-25 Cloudflare Secrets production deploy で苦戦した点

本ファイルは UT-25（Cloudflare Secrets を本番環境へ投入し、canonical 名 `GOOGLE_SERVICE_ACCOUNT_JSON` への統一と legacy alias `GOOGLE_SHEETS_SA_JSON` 互換維持を行うタスク）で遭遇した3つの苦戦点を記録する。

スキル: `aiworkflow-requirements`
タスク仕様: `docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/`
PR/Branch: `feat/issue-40-ut-25-cloudflare-secrets-prod-task-spec`

---

## L-UT25-010: Phase 11 NON_VISUAL evidence 階層が secret deployment に直接当てはまらず、L1/L2 の意味付け再定義が必要だった

### 状況

`task-specification-creator` の Phase 11 evidence 階層は governance / branch protection 系（CI gate, branch protection settings, required_status_checks）を主な題材として L1（最小可観測）/ L2（環境横断照合）/ L3（深掘り）の段階を定義している。
本タスクは Cloudflare Secrets を本番に投入する deployment 系作業のため、governance 系の L1/L2 定義を**そのまま流用すると evidence が空転**するという問題が発生した。

### 困った点

- L1（governance 系では「branch protection の現値 dump」相当）を secret 系にそのまま当てはめると、`secret list` の値そのものを dump する読み替えが必要だが、実値を出力に残せない（実値・JSON 全文・client email 出力禁止）
- L2（governance 系では「`required_status_checks` の context 突合」相当）を secret 系で何にマップするか不明瞭で、初稿では「staging と production の secret list を diff」する案が出たが、staging-first → production の段階適用と `--env` 切替の意味がそこに含まれていなかった
- 結果、Phase 11 evidence の outputs ファイル名が secret deployment ドメインと噛み合わず、レビュー時に「何を見れば deploy 完了の根拠と言えるのか」が一意に決まらなかった

### 対処

- secret 系の L1 を「`bash scripts/cf.sh secret put` 実行直後の `secret list` で **name のみ確認**（値は出さない）」に読み替え、evidence は name list のテキストのみを保存する規約に統一
- secret 系の L2 を「同一 secret name が `--env staging` と `--env production` 両方に存在することの突合」に読み替え、`--env` 切替の意味（staging-first → production 段階適用）を evidence の意味付けに含めた
- Phase 11 章の冒頭に「deployment 系では governance 系の L1/L2 をそのまま使わず、secret name 確認 / `--env` 切替突合に読み替えること」を明記（タスク仕様書側の運用注として記載）

### 再発防止

- deployment 系（Cloudflare Secrets / D1 migrate / Worker deploy）タスクを起こすときは、Phase 11 evidence 階層の **ドメイン読み替え注記をタスク仕様書冒頭に必ず置く**
- evidence ファイル命名は「実値が混入し得ない naming」を原則化（`secret-names-<env>.txt` のように name list である事を明示し、`secret-dump-<env>.txt` 等の値混入を誘発する命名を避ける）
- 将来の skill 改修候補として、`task-specification-creator` の Phase 11 章に deployment / secret 系の L1/L2 読み替え表を追記することを issue 化（本タスク内では skill 本体は触らない）

---

## L-UT25-011: Phase 12 中学生レベル説明で secret 系特有の禁則が skill 側に明文化されておらず、初稿で実値混入リスクがあった

### 状況

Phase 12（中学生レベル概念説明）は task-specification-creator の規約上必須セクションで、専門用語を平易に言い換える。
本タスクは secret 系のため、説明中に「実値の例」「JSON 構造の例」「client email の例」「1Password vault path の例」を引きたくなる誘惑が強い。
しかし skill 側にはこれらの**禁則が明文化されていなかった**ため、初稿で実値・JSON 例・vault path 例の混入リスクが顕在化した。

### 困った点

- 「Service Account JSON とは何か」を中学生レベルで説明する際、JSON の中身（`type`, `client_email`, `private_key`）を例示したくなるが、`private_key` は完全な秘匿対象であり、`client_email` も会社ドメイン特定につながるため出してはいけない
- 1Password 参照（`op://Vault/Item/Field`）の説明で**実 vault 名 / item 名を例として書きたくなる**が、これらは漏洩経路になる（vault 名から 1Password 組織を特定可能）
- skill 側の Phase 12 ガイドには「実値・実パス禁止」が一般原則としてあるものの、secret 系特有の「JSON 全文禁止」「client email 禁止」「vault path 禁止」が個別に明記されていなかったため、初稿レビューで毎回手動チェックが必要だった

### 対処

- Phase 12 の説明では JSON 例を「ダミー placeholder（`{...省略...}` / `<service-account-email>` / `<vault>/<item>/<field>`）」のみで構成する規約を本タスク内で運用ルール化
- `op://...` を説明する際は generic syntax（`op://<Vault>/<Item>/<Field>`）に留め、本プロジェクトの実 vault 名・item 名は記載しない
- レビューチェックリストに「Phase 12 内の JSON / email / vault path / 1Password 識別子はすべて placeholder か」を明示追加

### 再発防止

- skill 改修候補として、`task-specification-creator` Phase 12 ガイドに「secret 系タスクの場合の追加禁則: JSON 全文 / 実 email / 実 vault path / token 値」を恒久ルール化する issue を起票（本タスクでは skill 本体は触らない）
- secret 系タスクの Phase 12 草稿が出た時点で、自動 lint で JSON っぽい block / `@`（email）/ `op://` を含む実 path を検出してレビュー必須化することを将来検討
- ドキュメント上の例示は **常に generic syntax**（`<placeholder>` 形式）に統一する原則を徹底

---

## L-UT25-012: artifacts.json の outputs 配列とユーザー指示の drift（3-way 照合 lint の必要性）

### 状況

タスク仕様書の `artifacts.json` には Phase ごとの outputs 配列が列挙される。
Phase 11 で「production の secret 投入 evidence のみ」をユーザーから明示指定されたにも関わらず、初稿の artifacts.json には `secret-list-evidence-staging.txt` が混入しかけた（staging-first 段階適用の名残で、staging evidence ファイルが outputs として惰性で含まれていた）。

### 困った点

- artifacts.json の outputs 配列は Phase 11 の actual outputs と一致している必要があるが、ユーザー指示（「production の evidence のみで良い」）と仕様書本文と artifacts.json の3点が**人手で同期されていた**ため drift が発生
- staging-first → production の段階適用は実作業手順としては staging も走らせるが、最終的な「タスク完了の証拠」としては production 側の evidence のみで足りる、という区別が initial draft で曖昧だった
- 結果、artifacts.json の outputs 配列に staging evidence が残ったまま PR が出かけたが、自動 lint がないため目視レビューに依存していた

### 対処

- Phase 11 outputs から staging evidence（`secret-list-evidence-staging.txt`）を除外し、`secret-names-production.txt` のみを Phase 11 outputs 配列に残した
- staging 側の作業ログは Phase 11 本文中に「実施手順の一部」として記録しつつ、artifacts.json の outputs（タスク完了根拠）には含めない区別を明示
- **3-way 照合**（ユーザー指示 ↔ 仕様書本文 ↔ artifacts.json outputs）をレビュー手順として規約化

### 再発防止

- skill 改修候補として、artifacts.json の outputs 配列と Phase 本文中で言及される output ファイル名・ユーザー指示で確定した最終 evidence list を 3-way diff する **lint script** を `task-specification-creator` 側に追加する issue を起票
- ユーザー指示で「最終 evidence をどの環境のどのファイルに絞るか」を明示確定したら、その瞬間に artifacts.json を update する手順を Phase 11 完了条件に組み込む
- 段階適用（staging-first → production）系のタスクでは、「実施手順 outputs」と「タスク完了 evidence outputs」を必ず別概念として扱う（前者は本文 / 後者は artifacts.json）
