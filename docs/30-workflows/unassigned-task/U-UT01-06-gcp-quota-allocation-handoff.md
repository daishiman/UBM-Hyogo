# U-UT01-06: GCP quota 配分 / Service Account 申し送り（UT-03 へ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-UT01-06 |
| タスク名 | GCP quota 配分 / Service Account 申し送り |
| 親タスク | UT-01（Sheets→D1 同期方式定義） |
| 申し送り先 | UT-03（Sheets API 認証方式設定） |
| 優先度 | MEDIUM |
| 推奨Wave | UT-03 と同 wave（UT-03 への内包を既定とする） |
| 状態 | unassigned |
| 起票元 | UT-01 phase-12 `unassigned-task-detection.md` の MINOR-M-Q-01 |
| 起票日 | 2026-04-29 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | UT-03 に内包する前提（独立化条件は本書「独立化条件」節を参照） |
| 組み込み先 | `docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md` |

## 目的

UT-01 で採択した「Cloudflare Workers Cron Triggers による定期 pull」方式が前提とする
Google Sheets API quota（500 req/100s/project）について、同 GCP project を他用途
（Drive API / Calendar API / 既存 Apps Script 等）と共有する場合の **配分計画** と
**Service Account（SA）JSON の責務分離方針** を、UT-03 の認証方式設定タスク内で確定させる
ための申し送り仕様書を整備する。配分根拠と切替条件を文書として固定し、UT-03 / UT-09 が
quota 競合に起因する 429 / `RESOURCE_EXHAUSTED` で詰まらない状態を作る。

## スコープ

### 含む

- 現行 GCP project の quota 共有状況の棚卸し（Sheets API / Drive API / 他 API の使用主体一覧）
- Sheets→D1 同期に割り当てる **req/100s/project** 上限の数値（既定 cron 6h × batch 100 行を前提）
- Service Account JSON を「同期専用 SA」として分離するか、既存 SA に scope 追加するかの判断基準
- 別 GCP project へ切り替える条件（quota 逼迫 / 監査境界分離 / billing 分離）
- UT-03 認証方式設定への申し送り項目（SA メール / scope / 共有先 Sheet ID 一覧）の雛形
- quota 監視（UT-08 監視・アラート）への連動有無の方針整理

### 含まない

- Sheets API 認証フローの実装（→ UT-03）
- 同期ジョブ本体の実装と quota backoff コード（→ UT-09）
- Cloudflare Secrets への SA JSON 配置作業（→ UT-25 / UT-03）
- D1 物理スキーマ・migration 作成（→ UT-04 / UT-22）
- 本仕様書では SA JSON / API Token の **実値を一切記載しない**（CLAUDE.md セキュリティルール準拠）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-01（本書の起票元） | 採択方式 B（pull / Cron）の quota 前提を引き継ぐ |
| 上流 | `doc/completed-tasks/01c-parallel-google-workspace-bootstrap` | GCP project / SA / OAuth client の作成元 |
| 下流 | UT-03（Sheets API 認証方式設定） | 配分結果と SA 分離方針を UT-03 設計に反映 |
| 下流 | UT-09 / UT-21（同期ジョブ実装） | batch size / cron 間隔を quota 配分に整合させる |
| 連携 | UT-08（監視・アラート設計） | quota 使用率の監視・アラート連動の要否確認 |
| 連携 | UT-25（Cloudflare Secrets / SA JSON deploy） | SA を分離した場合のシークレット配置作業 |

## 着手タイミング

> **既定**: 本書は **UT-03 の Phase 1 / 要件定義時に内包処理** することを既定とする。
> UT-03 着手時に本書のスコープ全項目を UT-03 仕様書へマージし、UT-03 完了をもって本書を close する。

| 条件 | 理由 |
| --- | --- |
| UT-03 着手時 | 認証方式と SA 分離方針は同時に決まる必要があり、分離タスク化するとドリフトが起きる |
| UT-01 完了済み | 採択方式 B の quota 前提が確定している必要がある |
| `01c-parallel-google-workspace-bootstrap` 完了 | 現行 GCP project / SA の発行元が確定している必要がある |

### 独立化条件（UT-03 から切り出して別タスク化する条件）

以下のいずれかに該当する場合に限り、本書を UT-03 から独立した別タスクとして起票する:

1. UT-03 着手時点で **他用途（Drive API watch / Apps Script 既存スクリプト等）が同 project の Sheets quota を 30% 以上消費**しており、配分交渉が UT-03 の認証実装と並列にスケジュール不能な場合
2. **別 GCP project への切替**を実施判断した場合（billing / 監査境界分離が要件化された場合）。project 切替は UT-03 の認証手順を増やすため独立タスクとして扱う
3. UT-08（監視・アラート設計）と連動した **quota 使用率ダッシュボード / アラートしきい値** を独立に設計する必要が生じた場合

独立化する場合は本書を `docs/30-workflows/unassigned-task/` に残し、UT-03 から「上流依存」として参照する形に変更する。

## 苦戦箇所【記入必須】

**1. quota の正確な共有状況が見えにくい**
GCP の `Quotas & System Limits` ページは API ごとに独立して表示され、「同一 project で複数 API が同じ
500 req/100s/project に競合する」状況が直感的に分からない。Sheets API は読み取り `read requests` と
書き込み `write requests` で別 quota（300 req/min/user / 60 req/min/user 等）も存在し、
**どの quota が同期ジョブの律速になるか** を誤認しやすい。配分計画では「per-project 500/100s」と
「per-user 300/min」の両方を記載し、どちらに先に当たるかを明示する必要がある。

**2. 「SA を分離するか scope を増やすか」の判断軸が抜けやすい**
既存 SA に Sheets scope を追加するだけなら手数が小さい一方、**監査ログでの操作主体識別**・
**漏洩時の rotation 影響範囲**・**最小権限原則** の観点では同期専用 SA を分離すべき。
UT-03 で「とりあえず既存 SA に scope を追加」と決めると、後から rotation 時に他用途まで道連れになる。
本書で判断基準（rotation 単位 / 監査単位 / 最小権限）を先に文書化することで、UT-03 が迷わない状態を作る。

**3. 別 project 切替の判断が後ろ倒しになりやすい**
quota が逼迫してから別 project へ切り替えると、Sheets の **共有設定（SA メールへの閲覧者付与）を全 Sheet に対して再実施**する必要があり、運用負荷が大きい。切替判断は「quota 使用率 70% を 2 週連続で超過」「監査境界分離が要件化された時点」など、**事前の trigger 条件** を本書で先に固定する必要がある。

**4. 実値（SA JSON / API Token）を本書に転記してしまう事故**
配分検討時に SA メールアドレスや project ID を「便宜的に」貼り付けたくなるが、CLAUDE.md
セキュリティルールにより **実値はファイルに残さない**。本書では op 参照（`op://Vault/Item/Field` 形式）
または「Cloudflare Secrets / 1Password 上のキー名」までを記載対象とする。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 同 project 内の他 API（Drive watch 等）が quota を消費し、Sheets 同期が `RESOURCE_EXHAUSTED` で詰まる | 同期失敗の連鎖、復旧負荷 | 配分表で per-API quota の上限と同期側の設計上限（cron 6h × batch 100 で 1 day あたり読取 4 req 程度）を併記し、余裕率を 70% 以下に維持。逼迫時は UT-09 の backoff（1s/2s/4s/8s/16s/32s）に委譲しつつ、別 project 切替を判断 |
| SA JSON の漏洩で他用途まで道連れ rotation | サービス停止時間増 | 同期専用 SA に分離する判断基準（rotation 単位 / 監査単位）を本書で固定し、UT-03 でその通り発行する |
| 別 project 切替時の Sheet 共有設定漏れで 403 多発 | 復旧長時間化 | 切替条件を事前明示し、切替手順 runbook を UT-03 / UT-25 で先取りで作成する |
| 本書および周辺ドキュメントへの SA メール・JSON 値の混入（AI 学習・git 漏洩） | 機密漏洩 | 本書では op 参照 / Secrets キー名までに留め、`Read` / `cat` / `grep` で `.env` を読まない CLAUDE.md ルールを再掲する |
| UT-03 と UT-09 で quota 前提が齟齬を起こす（cron 間隔 / batch size の独自判断） | 設計ドリフト | 本書の「配分表」と UT-01 phase-02 sync-method-comparison の「確定パラメータ」を UT-03 / UT-09 双方が参照する義務を依存関係に明記 |

## 検証方法

NON_VISUAL / docs-only タスクとして以下の3点を成果物で検証する。

1. **配分表レビュー**
   `outputs/phase-N/quota-allocation-table.md`（仮）に下記列で配分表を作成し、UT-03 着手前に
   peer review（本人セルフレビュー + skill walkthrough）でテーブル妥当性を確認する。
   - API 名 / quota 種別（per-project / per-user / per-method）/ 上限値 / 同期側設計上限 / 余裕率 / 想定他用途消費量

2. **link checklist**
   `outputs/phase-N/link-checklist.md` に下記参照リンクの有効性を表で記録する。
   - 本書 → UT-01 phase-02 `sync-method-comparison.md`（採択方式 B の quota 前提）
   - 本書 → UT-03 `UT-03-sheets-api-auth-setup.md`（申し送り先）
   - 本書 → `aiworkflow-requirements/references/deployment-cloudflare.md` / `deployment-secrets-management.md`（参照可能性）

3. **smoke walkthrough**
   `outputs/phase-N/manual-smoke-log.md` に「配分表で示した上限が、UT-01 採択 cron 6h × batch 100 行で
   余裕率 70% 以下に収まること」を計算根拠付きで記録する。screenshot 不要（NON_VISUAL）。

UT-03 へ内包処理する場合は、上記 3 点を UT-03 の Phase 11 outputs に統合する。

## 受入条件（AC）

- [ ] **AC-1**: 同 GCP project の Sheets API quota（per-project 500 req/100s / per-user 300 req/min 読み取り等）の **配分表** が完成しており、Sheets→D1 同期に割り当てる上限値と余裕率（70% 以下）が数値で固定されている
- [ ] **AC-2**: Service Account JSON の **共有原則** が文書化されている（同期専用 SA として分離するか、既存 SA に scope 追加するかの判断基準・rotation 単位・監査単位・最小権限原則の適用結果を含む）
- [ ] **AC-3**: **別 GCP project への切替判断条件** が事前 trigger ベースで明文化されている（quota 使用率 70% を 2 週連続で超過 / 監査境界分離の要件化 / billing 分離の要件化、のいずれか）
- [ ] **AC-4**: UT-03（Sheets API 認証方式設定）への **申し送り項目雛形**（SA メール記載欄 / scope / 共有先 Sheet ID 一覧 / Cloudflare Secrets キー名）が完成しており、UT-03 着手時にコピーして使える形で残っている
- [ ] **AC-5**: 本書および参照 outputs に **SA JSON / API Token / project ID の実値が一切含まれていない** ことが grep で確認済み（op 参照 / Secrets キー名のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` | 親タスク。採択方式 B（pull / Cron）の前提 |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` | 起票元（U-6 / MINOR-M-Q-01） |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md` | 確定パラメータ（cron 6h / batch 100 / retry 3 / backoff）の根拠 |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-03/main.md` | 同期フロー全体像 |
| 必須 | `docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md` | 申し送り先（内包先） |
| 参考 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 関連 reference の入口 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | D1 / Cron Triggers 運用前提 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare Secrets 配置方針 / SA JSON 管理 |
| 参考 | `CLAUDE.md` | シークレット管理ルール（実値の非記載・op 参照） |

## セキュリティ注意（再掲）

- 本書および UT-03 への申し送り雛形に **SA JSON / API Token / OAuth client secret の実値を書かない**
- 値は 1Password に保管し、本書では `op://Vault/Item/Field` 参照名 または Cloudflare Secrets キー名までに留める
- `wrangler` を直接呼ばず、Cloudflare 操作は `bash scripts/cf.sh` ラッパー経由で行う
- `.env` の中身を `cat` / `Read` / `grep` で表示・読み取らない
