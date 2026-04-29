# UT-09 Sheets 系 Secret 削除 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-sheets-secrets-withdrawal-001 |
| タスク名 | Sheets 系 Cloudflare Secret 削除（dev / production 双方） |
| 分類 | 撤回（secret hygiene） |
| 対象機能 | Cloudflare Secret 管理 |
| 優先度 | 中（次 wave 内） |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 direction reconciliation レビュー |
| 発見日 | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-09 direction reconciliation（B-01）により、Sheets API 実装（`apps/api/src/jobs/sync-sheets-to-d1.ts` 系）は撤回対象となった。実装を撤回しても、Cloudflare Workers に登録済みの Secret（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）は自動では削除されない。

dev 環境・production 環境それぞれに残置された Sheets 系 Secret は、撤回後の Workers バインディングから参照されなくなるが、管理台帳上は存在し続けるため secret hygiene 上の負債となる。

### 1.2 問題点・課題

- 撤回後の Workers に不要 credential が紐付いたまま残置されるため、credential 管理・ローテーション・監査の対象が不必要に広がる
- staging / production の Secret 一覧に Sheets credential が残ると、将来の担当者が「有効な credential か否か」を判断できなくなる
- impl 撤回タスク（B-01）と secret 削除タスクを同一 wave 内で完結させなければ、credential 残置のまま忘却されるリスクが高い

### 1.3 放置した場合の影響

- Google Sheets サービスアカウント JSON が Cloudflare 側に残り、漏洩時の被害範囲が拡大する
- Secret 一覧の見通しが悪化し、future の Secret rotation 計画が困難になる
- `SHEETS_SPREADSHEET_ID` が残置されることで、誰かが Sheets 系実装を誤って復活させた際に意図せず有効になるリスクがある

---

## 2. 何を達成するか（What）

### 2.1 目的

Sheets API 実装撤回（B-01）・runtime kill-switch（B-10）完了後に、dev / production 双方の Cloudflare Workers から `GOOGLE_SHEETS_SA_JSON` と `SHEETS_SPREADSHEET_ID` を削除し、secret hygiene を回復する。

### 2.2 最終ゴール

以下の 4 Secret が両環境から消えていること。

| Secret 名 | 環境 |
| --- | --- |
| `GOOGLE_SHEETS_SA_JSON` | dev |
| `GOOGLE_SHEETS_SA_JSON` | production |
| `SHEETS_SPREADSHEET_ID` | dev |
| `SHEETS_SPREADSHEET_ID` | production |

### 2.3 スコープ

#### 含むもの

- `bash scripts/cf.sh secret delete` による対象 Secret の削除（dev / production 各 2 件、計 4 件）
- `bash scripts/cf.sh secret list` による削除確認
- 削除結果の作業ログ記録

#### 含まないもの

- commit、push、PR 作成
- Google Cloud 側のサービスアカウントキー無効化（別タスクで対応）
- staging 実機 smoke の実施（UT-26 で扱う）
- impl コード撤回（B-01 で扱う）
- runtime kill-switch 設定（B-10 で扱う）

### 2.4 成果物

- Cloudflare Workers（dev / production）から Sheets 系 Secret が削除された状態
- 削除確認コマンド出力の作業ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- B-01（impl 撤回）が完了済みであること
- B-10（runtime kill-switch）が完了済みであること
- `bash scripts/cf.sh whoami` で Cloudflare 認証が確認できること
- `1Password CLI（op）` が使用可能であること（`scripts/cf.sh` が内部で使用）

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（ブロッカー） | B-01（task-ut09-direction-reconciliation-001 系 impl 撤回） | 実装を残したまま Secret だけ削除するとランタイムエラーになるため |
| 上流（ブロッカー） | B-10（runtime kill-switch） | kill-switch が有効になった後に Secret を削除する順序が安全 |
| 下流 | UT-26 staging-deploy-smoke | 削除後の実機 smoke で Workers 動作を確認 |

### 3.3 必要な知識

- `scripts/cf.sh` ラッパーの使い方（`wrangler` 直叩き禁止、`op` 経由で credential 注入）
- Cloudflare Workers Secret の仕様（値は削除後も `secret list` に名前だけ残るわけではなく完全消去される）
- `--env` フラグで dev / production を切り替える方法

### 3.4 推奨アプローチ

production より先に dev で削除し、`secret list` で名前が消えていることを確認してから production に進む。値は `secret list` の出力に含まれないため、削除確認コマンドは安全に実行・ログ保存できる。

---

## 4. 実行手順

### Phase 1: 前提確認

```bash
# Cloudflare 認証確認
bash scripts/cf.sh whoami

# 削除前の Secret 一覧確認（dev）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env dev

# 削除前の Secret 一覧確認（production）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

出力に `GOOGLE_SHEETS_SA_JSON` と `SHEETS_SPREADSHEET_ID` が含まれていることを確認する。

### Phase 2: dev 環境の Secret 削除

```bash
# GOOGLE_SHEETS_SA_JSON を dev から削除
bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env dev

# SHEETS_SPREADSHEET_ID を dev から削除
bash scripts/cf.sh secret delete SHEETS_SPREADSHEET_ID --config apps/api/wrangler.toml --env dev
```

### Phase 3: dev 環境の削除確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env dev
```

`GOOGLE_SHEETS_SA_JSON` と `SHEETS_SPREADSHEET_ID` が一覧に含まれていないことを確認する。

### Phase 4: production 環境の Secret 削除

```bash
# GOOGLE_SHEETS_SA_JSON を production から削除
bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env production

# SHEETS_SPREADSHEET_ID を production から削除
bash scripts/cf.sh secret delete SHEETS_SPREADSHEET_ID --config apps/api/wrangler.toml --env production
```

### Phase 5: production 環境の削除確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

`GOOGLE_SHEETS_SA_JSON` と `SHEETS_SPREADSHEET_ID` が一覧に含まれていないことを確認する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `GOOGLE_SHEETS_SA_JSON` が dev 環境の `secret list` に存在しない
- [ ] `SHEETS_SPREADSHEET_ID` が dev 環境の `secret list` に存在しない
- [ ] `GOOGLE_SHEETS_SA_JSON` が production 環境の `secret list` に存在しない
- [ ] `SHEETS_SPREADSHEET_ID` が production 環境の `secret list` に存在しない

### 品質要件

- [ ] `wrangler` を直叩きせず `bash scripts/cf.sh` 経由のみで操作した
- [ ] Secret の値（JSON 中身 / ID 値）をログ・ドキュメント・コンソールに転記していない
- [ ] `secret list` コマンドの出力（名前のみ）を作業ログに記録した
- [ ] production 削除前に dev での削除確認を完了した

### ドキュメント要件

- [ ] 作業ログ（削除日時・実行者・確認コマンド出力）を本タスク指示書の「作業ログ」欄に追記した
- [ ] B-01 / B-10 の完了を前提確認として記録した

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| dev secret list | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env dev` | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が一覧に含まれない |
| production secret list | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が一覧に含まれない |
| Workers 動作確認 | 削除後に `/admin/sync/schema` や `/admin/sync/responses` が正常応答する（B-01 撤回後なので Sheets 系ルートは存在しない） | 404 または非 Sheets 系ルートが正常動作する |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| B-01 未完了のまま Secret を削除すると Workers 起動時に binding エラーになる | 高 | 中 | Phase 1 で B-01 / B-10 完了を確認してから着手する |
| `wrangler` 直叩きで `CLOUDFLARE_API_TOKEN` が平文でプロセス引数に露出する | 高 | 低（ルール周知済み） | `scripts/cf.sh` 経由を AC に明記し、直叩きを AC 違反として扱う |
| production 削除後に「やはり Sheets 実装を使う」となると再登録が必要になる | 中 | 低 | B-01 の方針確定を前提とするため、再登録が必要な場合は B-01 レベルで方針変更を行う |
| `secret delete` がサイレントに失敗し削除されていないケースがある | 中 | 低 | Phase 3 / Phase 5 の `secret list` 確認で検出する |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `scripts/cf.sh` | Cloudflare CLI ラッパー（`wrangler` 直叩き禁止） |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | direction reconciliation 全体方針 |
| 参照 | `apps/api/wrangler.toml` | `--config` パスと `--env` 定義の確認 |
| 参照 | `CLAUDE.md` | Cloudflare CLI ルール・シークレット管理ルール |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | Secret hygiene を impl 撤回と切り離すと、staging / production に Sheets credential が残置されたまま忘却される。`wrangler` 直叩き禁止のため `scripts/cf.sh` 経由を AC 化しなければ、慣性でコマンドを直打ちしてしまう |
| 原因 | impl 撤回（B-01）と Secret 削除（B-07）を同一タスクに含めると scope が広がりすぎるため分離されたが、分離した結果「B-01 が終わったら終わり」と誤認して B-07 が後回しになるリスクがある |
| 対応 | B-07 を独立タスク化し、B-01 / B-10 の完了を明示的な前提条件として AC に組み込んだ。また `scripts/cf.sh` 経由のコマンドを実行手順に明示することで直叩きを防止する |
| 再発防止 | impl 撤回タスクを作成する際は、対応する Secret 削除タスクを同一 wave の後続として必ずセットで登録する |

### 作業ログ

- 2026-04-29: タスク指示書作成。B-01 / B-10 完了待ちの状態で登録。

### 補足事項

- `secret list` コマンドの出力には Secret 名のみが含まれ、値は含まれないため、削除確認コマンドの出力をログに記録しても secret hygiene 上問題ない。
- Google Cloud 側のサービスアカウントキー無効化は本タスクのスコープ外。Cloudflare 側の削除完了後に別タスクで対応すること。
