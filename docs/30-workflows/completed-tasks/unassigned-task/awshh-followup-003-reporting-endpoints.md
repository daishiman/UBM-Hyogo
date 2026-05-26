# Reporting-Endpoints / Report-To による CSP 違反収集集約 - タスク指示書

## メタ情報

```yaml
issue_number: 868
```


## メタ情報

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| タスクID     | awshh-followup-003-reporting-endpoints                        |
| タスク名     | Reporting-Endpoints / Report-To による CSP 違反収集集約       |
| 分類         | 観測性                                                        |
| 対象機能     | CSP 違反レポートの集約観測基盤                                |
| 優先度       | 中                                                            |
| 見積もり規模 | 中規模                                                        |
| ステータス   | consumed                                                      |
| 発見元       | apps-web-security-headers-hardening Phase 12                  |
| 発見日       | 2026-05-23                                                    |

---

## Consumed Trace

| 項目 | 値 |
| --- | --- |
| status | CONSUMED |
| consumed_at | 2026-05-24 |
| canonical_workflow | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/` |
| resolution | 既存 `NEXT_PUBLIC_SENTRY_DSN` から Sentry CSP security endpoint を導出し、`Reporting-Endpoints` / CSP `report-to` / `report-uri` を `apps/web` に実装する canonical workflow へ昇格 |
| issue | #868（CLOSED 維持、再オープンしない） |

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

今回 cycle (apps-web-security-headers-hardening) で `apps/web/src/lib/security-headers.ts` に `Content-Security-Policy-Report-Only` ヘッダを導入したが、`report-uri` / `report-to` ディレクティブを設定していないため、ブラウザ側で発生した CSP 違反イベントがどこにも送信されず観測できない状態である。U-AWSHH-001 で予定している enforce モード切替（`Content-Security-Policy` への昇格）は、違反レポートで誤検知の有無・許可漏れ origin を把握してからでなければ会員機能を破壊するリスクが高い。

### 1.2 問題点・課題

- Report-Only モードであるにも関わらず違反レポートを集約していない（観測不能）
- enforce 切替の判断根拠（誤検知件数 / 許可漏れ origin 一覧）が取得できない
- `Reporting-Endpoints` ヘッダと CSP `report-to` ディレクティブの仕様は決まっているが、受信側の正本 endpoint が未定
- 受信側を `apps/api` 内製にするか SaaS (Sentry / Datadog) にするかでプライバシー・コスト・運用負荷のトレードオフが大きい

### 1.3 放置した場合の影響

- U-AWSHH-001 (CSP enforce 切替) が安全に実行できない
- 違反が発生していても気づけないため、攻撃の早期検知ができない
- enforce 切替後に会員機能が壊れた場合の原因切り分けが困難
- セキュリティヘッダ hardening の価値の半分（観測）が未実現のまま固定化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`Reporting-Endpoints` ヘッダと CSP `report-to` ディレクティブを設定し、CSP 違反レポートを集約可能な観測基盤を立ち上げる。受信側 endpoint / retention / privacy 方針は観測性設計 wave で合意した結果を本タスクで実装に落とし込む。

### 2.2 最終ゴール

- `security-headers.ts` が `Reporting-Endpoints` ヘッダを出力している
- CSP に `report-to` ディレクティブが付与されている
- 違反レポートが合意済み endpoint に到達し、ダッシュボードまたはストレージで参照できる
- retention / privacy / コスト方針がドキュメント化されている
- U-AWSHH-001 enforce 切替の判断材料（誤検知件数・許可漏れ origin）が抽出できる

### 2.3 スコープ

#### 含むもの

- `apps/web/src/lib/security-headers.ts` への `Reporting-Endpoints` / `report-to` 追加
- CSP ディレクティブへの `report-to` 紐付け
- 観測性設計 wave の合意内容に従った endpoint URL 設定
- プライバシーレビュー（送信 payload の個人情報含有確認）
- retention / 容量上限の運用文書化

#### 含まないもの

- 受信側 endpoint の実装本体（外部 SaaS 採用なら設定のみ。内製採用時は別タスクで `apps/api` に新設）
- CSP enforce 切替（U-AWSHH-001 の責務）
- D1 schema の変更（内製受信を選択した場合のみ別タスクで検討）
- Google Form 仕様変更

### 2.4 成果物

- `security-headers.ts` の差分（Reporting-Endpoints / report-to 追加）
- 受信側 endpoint 設定証跡（SaaS ダッシュボード or 内製設定）
- プライバシーレビュー結果メモ
- retention / 容量方針ドキュメント

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 観測性設計 wave で受信 endpoint 方針（内製 / SaaS）が合意されている
- 合意済み endpoint の URL / 認証方式が払い出されている
- プライバシーレビュー担当が確保されている

### 3.2 依存タスク

- 観測性設計 wave の endpoint 方針合意（必須前提）
- apps-web-security-headers-hardening 本体マージ済み
- U-AWSHH-001 (enforce 切替) は本タスク完了を前提とする

### 3.3 必要な知識

- `Reporting-Endpoints` ヘッダ仕様（W3C Reporting API Level 1）
- CSP `report-to` ディレクティブとレガシー `report-uri` の差分
- Cloudflare Workers から外部 endpoint への POST 経路（または `apps/api` 経由）
- 個人情報（IP / Referer / Source URL）の含有判断基準

### 3.4 推奨アプローチ

外部 SaaS (Sentry / Datadog) を採用する場合は受信側実装が不要で最小コストになる。内製を選ぶ場合は `apps/api` に新規 endpoint を追加し D1 に保存する必要があり別タスク化する。本タスクではヘッダ設定とディレクティブ紐付けに集中し、受信側実装は scope 外として明示する。

---

## 4. 実行手順

### Phase構成

1. 受信 endpoint 方針の最終確認
2. ヘッダ・ディレクティブ実装
3. プライバシーレビュー
4. 観測動作検証と運用文書化

### Phase 1: 受信 endpoint 方針の最終確認

#### 目的

観測性設計 wave で合意済みの endpoint URL / 認証方式 / retention を本タスク開始時点で固定する。

#### 手順

1. 観測性設計 wave の合意ドキュメントを参照
2. endpoint URL / グループ名 / max_age を確定
3. 認証ヘッダ要否を確認

#### 成果物

endpoint 設定値メモ

#### 完了条件

`Reporting-Endpoints` ヘッダに書く値がすべて確定している

### Phase 2: ヘッダ・ディレクティブ実装

#### 目的

`security-headers.ts` で `Reporting-Endpoints` ヘッダと CSP `report-to` ディレクティブを出力する。

#### 手順

1. `Reporting-Endpoints` ヘッダの組み立て関数を追加
2. CSP 文字列に `report-to <group>` を append
3. レガシー互換のため `report-uri` も併記するか判断
4. 単体テストでヘッダ出力を assert

#### 成果物

`security-headers.ts` 差分とテスト

#### 完了条件

response ヘッダに `Reporting-Endpoints` と `Content-Security-Policy-Report-Only` の `report-to` が両方含まれる

### Phase 3: プライバシーレビュー

#### 目的

CSP violation report payload に含まれる個人情報の取り扱い方針を確定する。

#### 手順

1. 違反レポート payload schema を確認（document-uri / referrer / source-file / blocked-uri 等）
2. 個人情報該当項目をマーキング
3. retention 期限と削除責任者を決定
4. プライバシーポリシー (`/privacy`) への追記要否を判断

#### 成果物

プライバシーレビュー結果メモ

#### 完了条件

payload 取り扱い方針が文書化されている

### Phase 4: 観測動作検証と運用文書化

#### 目的

実環境でレポートが endpoint に到達することを確認し、運用 runbook を整備する。

#### 手順

1. staging で意図的な CSP 違反を発生させレポート到達を確認
2. ダッシュボード or ストレージで件数・内訳が見えることを確認
3. retention / 容量上限 / アラート閾値を runbook に記載
4. U-AWSHH-001 着手前のチェックリスト項目化

#### 成果物

到達確認ログ・運用 runbook

#### 完了条件

staging で違反レポートが endpoint に届き、可視化されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `Reporting-Endpoints` ヘッダが出力されている
- [ ] CSP に `report-to` ディレクティブが含まれている
- [ ] staging で違反レポートが endpoint に到達する
- [ ] retention / privacy 方針が文書化されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `security-headers.ts` 単体テスト緑

### ドキュメント要件

- [ ] 運用 runbook に retention / アラート閾値が記載
- [ ] プライバシー方針への追記（必要な場合）
- [ ] U-AWSHH-001 着手前提条件が更新されている

---

## 6. 検証方法

### テストケース

- response ヘッダに `Reporting-Endpoints` が含まれる
- CSP の `report-to` グループ名と `Reporting-Endpoints` のグループ名が一致する
- 違反発生時にブラウザが endpoint に POST する
- payload に意図しない個人情報が含まれない

### 検証手順

```bash
curl -sI https://<staging-url>/ | grep -i "reporting-endpoints\|content-security-policy"
# staging で意図的に inline script を埋め込み、Network タブでレポート送信を確認
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web test -- security-headers
```

---

## 7. リスクと対策

| リスク                                                        | 影響度 | 発生確率 | 対策                                                                 |
| ------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| 受信 endpoint 方針が決まらず本タスク着手不能                  | 高     | 中       | 観測性設計 wave での合意を前提条件として明示                         |
| violation payload に個人情報が混入                            | 中     | 中       | プライバシーレビュー Phase を必須化し payload schema を事前確認      |
| レポート流量が想定超過で endpoint が逼迫                      | 中     | 低       | retention / アラート閾値を runbook 化し、初期は report-only で観測   |
| ブラウザ実装差で report-to が動作しない                       | 低     | 中       | レガシー互換の `report-uri` を併記するか方針判断                     |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md`
- `apps/web/src/lib/security-headers.ts`

### 参考資料

- W3C Reporting API Level 1
- MDN: Content-Security-Policy / report-to / report-uri

---

## 9. 備考

### 苦戦箇所【記入必須】

> apps-web-security-headers-hardening 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | CSP を Report-Only で導入したが違反レポートが集約できず、enforce 切替 (U-AWSHH-001) の判断材料が揃わない                                                                                              |
| 原因     | CSP report 受信 endpoint を `apps/api` に内製するか、Sentry/Datadog 等の外部 SaaS に出すかで retention・privacy・コスト・運用負荷のトレードオフが大きく、今 cycle のセキュリティヘッダ hardening スコープでは決定できなかった |
| 対応     | 受信 endpoint が決まらないと `report-to` ディレクティブを書けないため、CSP 違反収集は別 wave に分離し本タスクとして登録                                                                              |
| 再発防止 | 観測性設計 wave で受信 endpoint 方針を合意することを U-AWSHH-001 の前提条件に明示し、本タスク完了なしに enforce 切替を行わないチェック項目を runbook に追記                                            |

### レビュー指摘の原文（該当する場合）

```
apps-web-security-headers-hardening Phase 12 unassigned-task-detection.md にて、Reporting-Endpoints / report-to による CSP 違反収集集約を U-AWSHH-001 (enforce 切替) の前提タスクとして識別
```

### 補足事項

本タスクは U-AWSHH-001 (CSP enforce 切替) の必須前提となる。受信側実装の選択（内製 / SaaS）によって追加タスクの有無と規模が変わるため、観測性設計 wave での合意を最初の入口とすること。Report-Only のままでも違反レポート集約があれば本番品質の判断材料として十分機能するため、enforce 切替を急がず本タスクを先に完遂する方針を推奨する。
