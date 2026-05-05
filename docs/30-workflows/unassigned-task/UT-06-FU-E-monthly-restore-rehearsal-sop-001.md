# UT-06-FU-E-MONTHLY-RESTORE-REHEARSAL-SOP-001: monthly D1 backup restore rehearsal SOP

> 発生元: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-06-FU-E-MONTHLY-RESTORE-REHEARSAL-SOP-001 |
| タスク名 | monthly D1 backup restore rehearsal SOP |
| 分類 | follow-up / operations-sop |
| 対象機能 | D1 backup restore rehearsal（月次机上演習） |
| 優先度 | High |
| 見積もり規模 | 中規模 |
| ステータス | open |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-E |
| 発見元 | Phase 12 / unassigned-task-detection.md |
| 発見日 | 2026-05-01 |
| 作成日 | 2026-05-01 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-E Phase 9〜10 で D1 → R2 long-term backup（daily 30 日 + monthly 12 ヶ月世代管理 / gzip / SSE / 復元 SLO < 15 分）の取得・保管設計と復元 runbook 章立てが固定された。Phase 11 §S-11 では「取得 export → 別 D1 dev DB に restore → 行数 / schema 整合」を月次机上演習相当の smoke として定義済みであり、実運用の継続裏取り経路は「月次机上演習」に委譲されている。

### 1.2 問題点・課題

バックアップが取得されているだけでは、実障害発生時に復元できることを保証できない。現状は以下が未固定で運用が形骸化するリスクが高い:

- 月次 rehearsal の頻度・実施タイミング（毎月第 1 営業日相当）の SOP markdown が未起票
- RTO 15 分未満の合格基準を実 rehearsal で測定する手順（start/end timestamp と各 step duration の必須項目）が未明文化
- `restore-rehearsal-result.md` の append-only 記録形式（R2 object id / restore target / row count smoke / RTO / 判定）が未テンプレ化
- 失敗時に UT-08 alert / GitHub issue を起票する閾値・トリガ仕様が未定義

### 1.3 放置した場合の影響

- 月次演習が暗黙運用となり、復元 SLO < 15 分が実測されないまま drift し、実障害時に会員サービス停止が長期化（RTO < 15 分の SLO 違反）
- 復元失敗時の escalation 経路が不明瞭で、UT-08 監視と連動せず障害検知が遅延
- secret 値や OAuth トークン値が rehearsal log に混入する事故リスク（redaction ルール未明文化）
- UT-06 Phase 6 の rollback-rehearsal（migration rollback 演習）と混同され、ファイル名 drift / 並列管理が崩壊

---

## 2. 何を達成するか（What）

### 2.1 目的

D1 backup restore の月次机上演習を「100 人中 100 人が同じ手順で実行し、RTO 15 分未満を実測し、結果を append-only に蓄積し、失敗時は UT-08 alert / issue へ自動連結する」運用 SOP として固定する。

### 2.2 最終ゴール

- `runbooks/restore-rehearsal-sop.md` を読めば誰でも月次 rehearsal を再現可能
- `restore-rehearsal-result.md` テンプレに沿って毎月 1 行追記するだけで evidence が蓄積される
- 失敗時は明示トリガで UT-08 alert / GitHub issue が起票され、escalation が機械的に走る
- production D1 への destructive restore は構造的に不可能（restore-target 隔離 D1 のみ）

### 2.3 スコープ

#### 含むもの

- 月次 rehearsal SOP markdown（`docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/runbooks/restore-rehearsal-sop.md`）の章立て・手順・redaction ルール
- RTO 15 分未満合格基準（start/end timestamp / 各 step duration / smoke 判定）
- `restore-rehearsal-result.md` の append-only 記録形式（R2 object id / restore target / row count smoke / RTO 実測 / 判定 PASS|FAIL）
- 失敗時 UT-08 alert / GitHub issue 化のトリガ仕様（FAIL 判定 / RTO ≥ 15 分 / 連続 2 回 drift）
- `bash scripts/cf.sh d1` 経由の操作徹底（AC-7 整合）

#### 含まないもの

- production D1 への destructive restore
- R2 bucket / lifecycle / KMS 鍵の新規作成（UT-12 / Phase 9 の責務）
- 実 secret 値・OAuth トークンの記録
- UT-06 Phase 6 rollback-rehearsal（migration rollback）の改修（並列管理であり拡張ではない）
- 実演習の実走（Phase 13 ユーザー承認後の別オペレーションに委譲）

### 2.4 成果物

1. `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/runbooks/restore-rehearsal-sop.md`（月次 SOP 本体）
2. `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/runbooks/restore-rehearsal-result.md` テンプレ（append-only 記録様式）
3. UT-08 alert / GitHub issue 化のトリガ仕様（SOP 内章として）
4. AC-4（復元 runbook 机上演習結果）への evidence 紐付け定義

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-06-FU-E Phase 10 §復元 runbook 章立て（§1〜§5 / < 15 分 SLO 内訳合計）が確定済
- UT-06-FU-E Phase 11 §S-11（復元 drill smoke）が仕様固定済
- 隔離 D1 環境（restore-target、production と物理分離された別 DB）が用意可能
- `bash scripts/cf.sh d1` ラッパー（op + esbuild 解決込み）が稼働可能（CLAUDE.md §Cloudflare CLI 系）

### 3.2 依存タスク

- UT-06-FU-E Phase 9（取得・保管設計）
- UT-06-FU-E Phase 10（復元 runbook / rollout R1〜R5）
- UT-06-FU-E Phase 11（S-11 復元 drill smoke）
- UT-08（monitoring base、alert/issue 化の宛先として）

### 3.3 必要な知識

- D1 import コマンド系列（`scripts/cf.sh d1 execute --file=<sql>`）と空 export の扱い
- R2 GET / ListObjects（`scripts/cf.sh r2` 経由）と key prefix 命名規約（daily / monthly）
- gunzip による gzip 解凍と整合検証
- RTO / RPO / SLO の運用概念（< 15 分 SLO の内訳合計）
- 実行ログからの redaction 手順（API token / OAuth token 値の除去）
- UT-06 Phase 6 rollback-rehearsal と本演習の差分（並列管理）

### 3.4 推奨アプローチ

1. Phase 10 §月次机上演習計画と §復元 runbook 章立て（§1〜§5）を 1:1 対応させて SOP 章立てを起こす
2. Phase 11 §S-11 のコマンド系列・期待 stdout・evidence 出力先を SOP 手順節へ転写（drift 防止）
3. RTO 測定は `date +%s` ベースの start/end timestamp を必須項目にし、各 step duration を表で残す
4. result テンプレは append-only（過去行を改変禁止）として明示し、毎月 1 行追記の運用に固定
5. 失敗時 UT-08 alert / issue 化トリガを SOP 末尾に表で固定（FAIL / RTO ≥ 15 分 / 連続 2 回 drift）

---

## 4. 実行手順

### Phase構成

Phase 1: rehearsal SOP markdown 起草 → Phase 2: RTO 15 分未満合格基準の確定 → Phase 3: rehearsal-result 記録形式の固定 → Phase 4: 失敗時 UT-08 alert / issue 化ルールの固定。各 Phase は順次依存。

### Phase 1: rehearsal SOP markdown の起草

#### 目的

`runbooks/restore-rehearsal-sop.md` の章立て・手順・redaction ルールを Phase 10 §復元 runbook §1〜§5 と 1:1 で固定する。

#### 手順

1. Phase 10 §復元 runbook §1〜§5（< 15 分 SLO 内訳合計）を読み込み、SOP 章立てに 1:1 写経する
2. 各章に「目的 / 前提 / コマンド（`bash scripts/cf.sh` 経由）/ 期待 stdout / 失敗時切り分け」を 5 項記述
3. 冒頭に「production D1 への destructive restore は禁止 / restore-target 隔離 D1 のみ使用」を不変条件として固定
4. 末尾に redaction ルール（API token / OAuth token 値の除去 / command transcript の生 token 出力禁止）を明文化

#### 成果物

`docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/runbooks/restore-rehearsal-sop.md`

#### 完了条件

- 章立てが Phase 10 §復元 runbook §1〜§5 と 1:1
- すべての操作が `bash scripts/cf.sh` 経由（wrangler 直接呼び出しなし）
- production D1 destructive restore 禁止が冒頭で明示

### Phase 2: RTO 15 分未満合格基準の確定

#### 目的

復元 SLO < 15 分を実 rehearsal で測定する手順を固定する。

#### 手順

1. start timestamp（R2 GET 開始）と end timestamp（restore-target row count smoke 完了）を必須項目にする
2. 各 step duration（GET / gunzip / D1 execute --file / row count smoke）の表を SOP に挿入
3. 合格基準: 「end - start < 900 秒」かつ「row count smoke が source export の行数と一致」
4. 不合格時は連続 2 回で drift 判定 → Phase 4 の escalation トリガへ連結

#### 成果物

SOP 内「§合格基準」章

#### 完了条件

- start/end timestamp 取得手順が `date +%s` ベースで記述
- 各 step duration の表テンプレが SOP に存在
- < 900 秒 / row count 一致の 2 条件 AND が明示

### Phase 3: rehearsal-result 記録形式の固定

#### 目的

`restore-rehearsal-result.md` の append-only 記録形式を固定する。

#### 手順

1. 1 行 = 1 回の rehearsal とする markdown 表テンプレを定義
2. 必須カラム: 実施日 / R2 object id（key, daily|monthly prefix, last-modified）/ restore target（隔離 D1 名）/ row count smoke（source vs restored）/ RTO 実測秒 / 判定（PASS|FAIL）/ 担当 / 備考
3. append-only ルール（過去行改変禁止 / 訂正は新行追記）を冒頭に明記
4. UT-06 Phase 6 rollback-rehearsal-result.md とは別ファイル（並列管理）であることを参照節で明示

#### 成果物

`docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/runbooks/restore-rehearsal-result.md` テンプレ

#### 完了条件

- 必須カラム 8 項がすべて存在
- append-only ルール明記
- UT-06 Phase 6 との並列管理が参照節で明示

### Phase 4: 失敗時 UT-08 alert / issue 化ルール

#### 目的

FAIL 判定時に UT-08 alert / GitHub issue が機械的に起票されるトリガ仕様を固定する。

#### 手順

1. トリガ条件を表で固定: (a) 判定 FAIL / (b) RTO ≥ 15 分 / (c) 連続 2 回 drift
2. 各トリガに対する宛先を定義: UT-08 alert チャネル + GitHub issue（label: `incident/restore-drill`）
3. issue body テンプレを SOP に同梱（R2 object id / restore target / RTO 実測 / 失敗 step / redaction 済 stdout 抜粋）
4. SOP 末尾に escalation フロー図（テキスト）を配置

#### 成果物

SOP 内「§失敗時 escalation」章 + issue body テンプレ

#### 完了条件

- 3 トリガ条件が表で明示
- issue body テンプレに redaction ルール適用済
- escalation フローが SOP 末尾で完結

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `runbooks/restore-rehearsal-sop.md` が Phase 10 §復元 runbook §1〜§5 と 1:1
- [ ] RTO 15 分未満の合格基準（start/end timestamp / step duration 表 / < 900 秒 AND row count 一致）が明示
- [ ] `restore-rehearsal-result.md` テンプレに append-only ルールと 8 必須カラムが存在
- [ ] 失敗時 UT-08 alert / GitHub issue 化の 3 トリガが表で固定

### 品質要件

- [ ] すべての CLI 操作が `bash scripts/cf.sh` 経由（AC-7 整合 / wrangler 直接呼び出しなし）
- [ ] production D1 destructive restore 禁止が冒頭で固定
- [ ] redaction ルール（API token / OAuth token 値除去）が明文化
- [ ] secret 実値・command transcript 生 token がドキュメント内に存在しない

### ドキュメント要件

- [ ] UT-06 Phase 6 rollback-rehearsal との並列管理が参照節で明示
- [ ] AC-4（復元 runbook 机上演習結果）と evidence の紐付けが明示
- [ ] Phase 10 / Phase 11 §S-11 への双方向リンクが存在

---

## 6. 検証方法

### テストケース

1. SOP に従った dry-run（隔離 D1 / 旧 export 1 件）で start/end timestamp が記録されること
2. row count smoke が source export と一致すること
3. RTO 実測が < 900 秒であること
4. result テンプレへ 1 行 append された後、過去行が改変されていないこと（git diff で確認）
5. 故意 FAIL（破損 export 投入）で UT-08 alert / GitHub issue 起票トリガが発火する手順が SOP から再現可能であること

### 検証手順

月次 rehearsal log（`restore-rehearsal-result.md`）に以下が残ることを確認する:

- R2 object id（key, prefix=daily|monthly, last-modified）
- restore target（隔離 D1 名）
- row count smoke（source vs restored、一致 / 不一致）
- RTO 実測秒
- 判定（PASS | FAIL）

FAIL 行が存在する場合、対応する UT-08 alert / GitHub issue リンクが備考列に貼られていること。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| rehearsal が実 production D1 を破壊 | 高 | 低 | restore-target 隔離 D1 のみ使用 / SOP 冒頭で destructive restore 禁止を不変条件化 / `scripts/cf.sh` 経由徹底 |
| 15 分 SLO が測定されない | 中 | 中 | start/end timestamp と各 step duration を必須カラム化 / < 900 秒 AND row count 一致を合格基準に固定 |
| secret 値が rehearsal log に混入 | 高 | 中 | command transcript は redaction 済みのみ保存 / SOP 末尾に redaction ルール明文化 / issue body テンプレで再強制 |
| UT-06 Phase 6 rollback-rehearsal と混同 | 低 | 中 | 参照節で並列管理を明示 / ファイル名を `restore-rehearsal-*` で統一し `rollback-rehearsal-*` と語彙分離 |
| 失敗時 escalation が機能しない | 中 | 中 | UT-08 alert / GitHub issue 化トリガ 3 条件を表で固定 / issue body テンプレを SOP 同梱 |
| 月次運用が形骸化（実施されない） | 中 | 高 | 毎月第 1 営業日固定 / append-only result の月次 1 行追記を機械的義務化 / 連続 2 回 drift で escalation |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-10.md` §復元 runbook 章立て / §月次机上演習計画
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-11.md` §S-11（復元 drill smoke）
- `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md`（並列管理対象 / 拡張ではない）
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`（発生元）
- `.claude/skills/aiworkflow-requirements/references/database-operations.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（復元 SLO / RTO の正本確認用）

### 参考資料

- `CLAUDE.md` §Cloudflare 系 CLI 実行ルール（`bash scripts/cf.sh` 経由徹底）
- `scripts/cf.sh`（op + esbuild 解決込みラッパー）
- AC-4（復元 runbook 机上演習結果）/ AC-7（`scripts/cf.sh` 経由徹底）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 月次 restore rehearsal の頻度・RTO・記録形式・失敗時 escalation が同時に未固定で、SOP 化の起点が定まらない |
| 原因 | UT-06 Phase 6 rollback-rehearsal（migration rollback）と本演習（D1 全データ復元）の責務差分が暗黙化しており、「拡張」と誤認すると result ファイルが drift する。Phase 10 §月次机上演習計画 / Phase 11 §S-11 / AC-4 の 3 ソースを束ねないと記録形式が決まらない |
| 対応 | (1) 並列管理であることを参照節で明示しファイル名を `restore-rehearsal-*` で語彙分離 / (2) Phase 10 §復元 runbook §1〜§5 と SOP 章立てを 1:1 化 / (3) Phase 11 §S-11 のコマンド系列・期待 stdout を SOP 手順節へ写経して drift を構造的に防止 / (4) result を append-only に固定し過去行改変禁止 |
| 再発防止 | 同種の SOP 起票時は (a) 並列 vs 拡張の判定を冒頭で言語化、(b) 上流 phase との 1:1 マッピング表を必ず置く、(c) `bash scripts/cf.sh` 経由 / redaction / destructive 禁止の 3 不変条件をテンプレ冒頭の固定ブロックとして再利用する |

source evidence: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`, `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-10.md`, `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-11.md`

### レビュー指摘の原文（該当する場合）

```
（該当なし: Phase 12 unassigned-task-detection からの正規検出）
```

### 補足事項

- 本タスクは docs-only であり実コード変更を含まない（実演習走行は Phase 13 ユーザー承認後の別オペレーション）。
- 不変条件: production D1 への destructive restore 禁止 / restore-target 隔離 D1 のみ / `bash scripts/cf.sh` 経由徹底（AC-7）/ secret 実値・生 token の記録禁止（redaction 済みのみ）。
- UT-06 Phase 6 rollback-rehearsal-result.md は「migration rollback 演習」、本タスクの restore-rehearsal-result.md は「D1 全データ復元演習」であり、目的・手順が異なるため別ファイルで並列管理する。
