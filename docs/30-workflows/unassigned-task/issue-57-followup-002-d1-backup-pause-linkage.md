# d1-backup workflow への degrade pause フラグ連動 - タスク指示書

## メタ情報

```yaml
issue_number: 1055
```


## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | issue-57-followup-002-d1-backup-pause-linkage              |
| タスク名     | d1-backup workflow への degrade pause フラグ連動           |
| 分類         | 改善                                                       |
| 対象機能     | D1 backup GitHub Actions workflow / degrade kill-switch    |
| 優先度       | 中                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | Issue #57 (issue-57-kv-r2-guardrail-degrade-design) Phase 12 unassigned-task-detection baseline 行 + 独立検証 |
| 発見日       | 2026-05-31                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #57 で audit cold-storage export(`scripts/audit-log/export-to-r2.ts` /
`.github/workflows/audit-log-cold-storage.yml`)に対し、env フラグ
`AUDIT_COLD_STORAGE_EXPORT_PAUSED`("true"/"false"、既定 false)による degrade kill-switch を
実装した。"true" のとき D1 SELECT / manifest write / R2 PUT を全 short-circuit して
`{status:"paused", objectKey:null, rowCount:0}` を返す。フラグは GitHub repository variable
から workflow env へ渡る。

### 1.2 問題点・課題

- D1 backup を行う別 workflow(`.github/workflows/d1-backup.yml`)は、この pause フラグと
  連動していない。
- audit cold-storage export を pause しても D1 backup は独立スケジュールで動き続ける。
- コスト緊急時に「R2 への書き込みを全部止めたい」状況でも backup 側が止まらず、degrade の
  目的(R2 への全書き込み抑制)を完全には達成できない。
- R2 書き込み経路が複数 workflow に分散しており、degrade スイッチが経路ごとに個別実装に
  なっている。統一的な degrade 制御点が無い。

### 1.3 放置した場合の影響

- コスト緊急時に R2 書き込みを止めたつもりでも D1 backup 経由の PUT が継続し、R2 write/storage
  課金が無料枠を超えるリスクが残る。
- degrade runbook の手順を実行しても「R2 への書き込みを全部止める」という運用意図が成立せず、
  オペレーターの認識と実挙動が乖離する。
- 将来 R2 書き込みを伴う scheduled workflow が増えるたびに、pause 漏れ経路が増殖する。

---

## 2. 何を達成するか（What）

### 2.1 目的

コスト緊急時に R2 書き込みを伴う処理(audit export + D1 backup export)を統一的に degrade
できる運用を設計・実装する。ただし backup 停止はデータ保全リスクを伴うため、別フラグ
(例 `D1_BACKUP_EXPORT_PAUSED`)で明示的に分離し、cost-guardrail-runbook の degrade 手順に
「backup 停止はコンプライアンス影響あり」の警告付きで段階追加する。

### 2.2 最終ゴール

- `D1_BACKUP_EXPORT_PAUSED`("true"/"false"、既定 false)が GitHub repository variable から
  `d1-backup.yml` の workflow env に渡り、"true" のとき D1 backup export(R2 PUT を含む)が
  short-circuit される。
- audit export の pause(`AUDIT_COLD_STORAGE_EXPORT_PAUSED`)とは独立したフラグで制御され、
  コスト guardrail とデータ保全の責務境界が運用上も保たれる。
- cost-guardrail-runbook の degrade 手順に、backup 停止が段階(警告付き)で追加される。

### 2.3 スコープ

#### 含むもの

- D1 backup pause ポリシー設計(コスト guardrail vs データ保全の責務境界整理、
  コンプライアンス影響評価を含む)
- `D1_BACKUP_EXPORT_PAUSED` フラグの実装(`d1-backup.yml` への env 注入 + pause 時の
  short-circuit/skip 経路)
- cost-guardrail-runbook の degrade 手順への段階追加(「backup 停止はコンプライアンス
  影響あり」の警告文付き)
- pause/非 pause の挙動を確認するテスト

#### 含まないもの

- audit cold-storage export 側の pause(Issue #57 で実装済み)
- 新規 R2 binding の追加
- D1 backup の保存先・スケジュール・retention 方針そのものの変更

### 2.4 成果物

- D1 backup pause ポリシー設計メモ(責務境界 + コンプライアンス影響評価)
- `.github/workflows/d1-backup.yml` の env 注入 + pause skip 差分
- pause 時に R2 PUT が発生しないことを担保する short-circuit 実装差分
- cost-guardrail-runbook degrade 手順への段階追加差分
- テスト差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #57 の audit cold-storage export pause kill-switch がマージ済み
  (`AUDIT_COLD_STORAGE_EXPORT_PAUSED` が稼働している)
- UT-06-FU-E(D1 Backup Long-Term Storage)系の D1 backup workflow が稼働している

### 3.2 依存タスク

- Issue #57(audit cold-storage export degrade 設計・実装)
- UT-06-FU-E 系(D1 Backup Long-Term Storage)

### 3.3 必要な知識

- `audit-log-cold-storage.yml` における pause フラグ注入の参考実装
  (repository variable → workflow env → short-circuit の流れ)
- D1 backup の責務(信頼性 / コンプライアンス = データ保全)と、audit export の責務
  (コスト guardrail = cold storage の使い過ぎ抑制)の違い
- GitHub Actions の repository variable / workflow env の渡し方

### 3.4 推奨アプローチ

audit export の pause が参照する `AUDIT_COLD_STORAGE_EXPORT_PAUSED` を D1 backup に流用しない。
これは責務が異なる(コスト guardrail vs データ保全)ため、同一フラグで両方止めると、コスト
抑制のために backup(=データ保全)まで止まり、可用性 / コンプライアンスを損なうリスクがある。

代わりに backup 専用フラグ `D1_BACKUP_EXPORT_PAUSED` を新設し、`audit-log-cold-storage.yml` の
pause 注入を参考実装として `d1-backup.yml` に同型の env 注入 + short-circuit を組む。runbook
には「audit export 停止(=コストのみ影響)」と「backup 停止(=コンプライアンス影響あり)」を
段階分けし、後者には明示の警告を付す。

---

## 4. 実行手順

### Phase構成

1. D1 backup pause ポリシー設計(コンプライアンス影響評価含む)
2. `D1_BACKUP_EXPORT_PAUSED` フラグ実装
3. runbook degrade 手順への段階追加(警告付き)
4. テスト

### Phase 1: D1 backup pause ポリシー設計(コンプライアンス影響評価含む)

#### 目的

audit export(コスト guardrail)と D1 backup(データ保全)の責務境界を明文化し、backup を
独立フラグで分離する根拠と、backup 停止時のコンプライアンス影響を評価する。

#### 完了条件

責務境界(コスト guardrail vs データ保全)とコンプライアンス影響評価が設計メモに記述され、
「同一フラグ連動ではなく `D1_BACKUP_EXPORT_PAUSED` で分離」する判断が確定している。

### Phase 2: `D1_BACKUP_EXPORT_PAUSED` フラグ実装

#### 目的

`d1-backup.yml` に `D1_BACKUP_EXPORT_PAUSED`(既定 false)を repository variable から env として
注入し、"true" のとき D1 backup export(R2 PUT を含む)を short-circuit/skip する。

#### 完了条件

フラグ "true" 時に R2 PUT が発生せず、"false"(既定)時は従来どおり backup が実行される。
`audit-log-cold-storage.yml` の pause 注入と同型の経路になっている。

### Phase 3: runbook degrade 手順への段階追加(警告付き)

#### 目的

cost-guardrail-runbook の degrade 手順(§4-2 相当)に backup 停止を段階として追加し、
「backup 停止はコンプライアンス影響あり」の警告を明記する。

#### 完了条件

runbook に audit export 停止(コストのみ)→ backup 停止(コンプライアンス影響あり・警告付き)の
段階が追加され、両フラグの設定箇所(repository variable)が手順として記載されている。

### Phase 4: テスト

#### 目的

pause "true" 時に R2 PUT が走らず "false" 時に従来挙動になることを担保し、audit フラグと
backup フラグが互いに干渉しないことを確認する。

#### 完了条件

`D1_BACKUP_EXPORT_PAUSED=true` で skip、`=false` で実行、両フラグ独立、を確認するテストが緑。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `D1_BACKUP_EXPORT_PAUSED="true"` で D1 backup export(R2 PUT 含む)が短絡される
- [ ] `D1_BACKUP_EXPORT_PAUSED`(既定 false / 未設定)では従来どおり backup が実行される
- [ ] audit フラグ(`AUDIT_COLD_STORAGE_EXPORT_PAUSED`)と backup フラグが互いに独立して動く

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] 関連テストが緑
- [ ] pause "true" 時に R2 への書き込みが 0 件であることを確認

### ドキュメント要件

- [ ] cost-guardrail-runbook の degrade 手順に backup 停止が段階追加されている
- [ ] backup 停止段階に「コンプライアンス影響あり」の警告が明記されている
- [ ] 責務境界(コスト guardrail vs データ保全)を説明する設計メモが残されている

---

## 6. 検証方法

### テストケース

- `D1_BACKUP_EXPORT_PAUSED="true"` → backup export が skip / short-circuit され R2 PUT が 0 件
- `D1_BACKUP_EXPORT_PAUSED="false"`(既定) → 従来どおり backup が実行される
- audit フラグのみ "true" / backup フラグ "false" → audit のみ停止、backup は継続
- 両フラグ "true" → 双方停止(R2 書き込み 0 件)

### 検証手順

```bash
mise exec -- pnpm typecheck
# repository variable に D1_BACKUP_EXPORT_PAUSED=true を設定し
# d1-backup workflow を手動 dispatch して skip ログ / R2 PUT 0 件を確認
# false に戻して従来どおり backup が走ることを確認
```

---

## 7. リスクと対策

| リスク                                                          | 影響度 | 発生確率 | 対策                                                                                          |
| --------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------- |
| backup 停止をコスト抑制目的で常用しデータ保全を損なう           | 高     | 中       | 別フラグで分離 + runbook に「コンプライアンス影響あり」警告を明記し、解除を運用前提とする      |
| audit フラグと backup フラグを取り違えて誤停止する              | 中     | 中       | フラグ名を責務が判別できる名前(`D1_BACKUP_EXPORT_PAUSED`)にし、runbook に設定箇所を明示        |
| pause 解除忘れで backup が長期間止まり保全ギャップが生じる      | 高     | 中       | runbook に解除手順と確認をセットで記載、observability で backup 実行有無を監視                 |
| 既定値未設定で意図せず skip 扱いになる                          | 中     | 低       | 既定 false(未設定時も false 扱い)を実装と runbook で固定                                       |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`(degrade 手順 §4-2 相当)
- `.github/workflows/audit-log-cold-storage.yml`(pause フラグ注入の参考実装)
- `.github/workflows/d1-backup.yml`(対象)
- `scripts/audit-log/export-to-r2.ts`(audit export 側 pause short-circuit の参考)
- Issue #57(issue-57-kv-r2-guardrail-degrade-design)implementation-guide

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 症状     | Issue #57 で audit export の pause kill-switch を実装したが、R2 書き込みを行う処理は audit export 以外に D1 backup もあり、片方だけ止めても「R2 への全書き込みを止める」目的を完全には達成できなかった |
| 原因     | R2 書き込み経路が複数 workflow に分散しており、degrade スイッチが経路ごとに個別実装になっている。統一的な degrade 制御点が無い               |
| 対応     | Issue #57 では責務境界(コスト guardrail vs データ保全)を優先し audit export のみ pause 化。D1 backup は信頼性側の責務として連動を別タスク(本タスク)に分離した |
| 再発防止 | R2 書き込みを伴う scheduled workflow を新設する際は、最初から degrade pause フラグ(経路別)と runbook 手順をセットで用意する規約を設ける       |

### 補足事項

本タスクは「同一フラグで両方を連動」ではなく「backup-aware な独立フラグ
(`D1_BACKUP_EXPORT_PAUSED`)による分離」を選ぶ点が要。コスト guardrail(冷蔵庫 = cold storage の
使い過ぎ抑制)と、D1 backup(データ保全 = 信頼性 / コンプライアンス)は責務が異なるため、安易な
同一フラグ連動はコスト抑制のために backup まで止め、可用性 / コンプライアンスを損なう。

degrade の運用性を高めるには、R2 書き込みを伴う scheduled workflow に対し「経路別 pause フラグ
+ runbook 段階手順」をセットで整える規約が有効で、コスト緊急時の統一的 degrade 制御点として
ROI が高い。backup 停止段階には必ず「コンプライアンス影響あり」の警告と解除前提を併記する。
