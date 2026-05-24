# CSP report-only → enforce 切替 - タスク指示書

## メタ情報

```yaml
issue_number: 869
```


## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | awshh-followup-001-csp-enforce-cutover            |
| タスク名     | CSP report-only → enforce 切替                    |
| 分類         | セキュリティ強化                                  |
| 対象機能     | apps/web Content-Security-Policy 強制適用         |
| 優先度       | 高                                                |
| 見積もり規模 | 小規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | apps-web-security-headers-hardening Phase 12      |
| 発見日       | 2026-05-23                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

apps-web-security-headers-hardening サイクルにて `apps/web/src/lib/security-headers.ts` に CSP（Content-Security-Policy）を `report-only` モードで導入した。production 環境での実トラフィックに対する互換性（Next.js inline script・Google OAuth リダイレクト・サードパーティ asset 等）の影響観測が未実施のため、いきなり enforce 化すると実画面が壊れる可能性がある。そのため、まずは違反レポートのみを収集し、観測期間を経てから enforce へ昇格する 2 段階リリース方針とした。

### 1.2 問題点・課題

- `Content-Security-Policy-Report-Only` ヘッダは違反を観測するのみで、実際の攻撃（XSS / data injection 等）を**ブロックしない**
- CSP 本来の防御効果が発揮されておらず、セキュリティ強化サイクルとしては中途半端な状態
- 観測期間を区切らないまま放置すると、report-only のまま負債として固定化する

### 1.3 放置した場合の影響

- XSS / clickjacking 系攻撃に対する実防御が無い状態が継続する
- セキュリティ監査・脆弱性診断時に CSP not enforced として指摘される
- enforce 化を後回しにすると、新規 inline script 追加時のリスクが累積し、切替コストが膨張する

---

## 2. 何を達成するか（What）

### 2.1 目的

staging / production で report-only モードの違反レポートを観測した上で、`Content-Security-Policy-Report-Only` を `Content-Security-Policy` に切り替えて CSP を強制適用する。

### 2.2 最終ゴール

- `SecurityHeaderConfig.cspMode` が `enforce` に変更されている
- production レスポンスヘッダに `Content-Security-Policy`（report-only 接尾辞無し）が付与される
- Playwright smoke が enforce 後のヘッダ名で検証している
- 違反レポート観測結果が記録され、enforce 化に伴う実画面破壊が無いことが確認されている

### 2.3 スコープ

#### 含むもの

- `apps/web/src/lib/security-headers.ts` の `cspMode` 切替
- `apps/web/middleware.ts` の env 経由設定切替（必要な場合）
- Playwright smoke の header 名検証更新
- staging で先行 enforce、production への段階的展開

#### 含まないもの

- CSP directive（`script-src` / `style-src` 等）の中身の再設計
- report endpoint（`report-uri` / `report-to`）の新規構築
- 他セキュリティヘッダ（HSTS / X-Frame-Options 等）の変更

### 2.4 成果物

- `apps/web/src/lib/security-headers.ts` の差分
- `apps/web/middleware.ts` の差分（必要時）
- Playwright smoke 差分
- 違反レポート観測結果のサマリログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- staging / production で 1〜2 週間程度 report-only モードで違反収集が行われていること
- 違反レポートを集約・閲覧できる経路（Cloudflare Logpush / Sentry / report-uri SaaS のいずれか）が確立していること
- 観測期間中に検知された違反のうち、正当な inline script・style・3rd-party origin が CSP directive へ反映済みであること

### 3.2 依存タスク

- apps-web-security-headers-hardening 本体マージ済み
- 違反レポート観測経路の確立（別タスク）

### 3.3 必要な知識

- Content-Security-Policy spec（report-only vs enforce）
- Next.js App Router の middleware から付与するヘッダの仕様
- Cloudflare Workers レスポンスヘッダ加工フロー
- Google OAuth リダイレクトと CSP `connect-src` / `frame-src` の相互作用

### 3.4 推奨アプローチ

`cspMode` を `enforce` に直接書き換える前に、staging で `enforce` 値を 1 週間程度先行運用し、実画面破壊が無いことを E2E（Playwright）で確認してから production を切り替える。env で切替可能にし、緊急時は report-only へ即時 rollback できる構成を維持する。

---

## 4. 実行手順

### Phase構成

1. 違反レポート棚卸し
2. CSP directive 仕上げ
3. staging enforce 先行切替
4. production enforce 切替

### Phase 1: 違反レポート棚卸し

#### 目的

report-only モード期間中に収集された違反レポートを分類し、enforce 化に支障となる正当な利用を CSP directive に反映する。

#### 手順

1. 観測経路から違反レポートを CSV / JSON でエクスポート
2. `blocked-uri` / `violated-directive` ごとに集計
3. 正当利用は directive へ追加、悪性は無視

#### 成果物

違反レポート棚卸しサマリ

#### 完了条件

正当利用由来の違反が directive 修正により 0 件になっている

### Phase 2: CSP directive 仕上げ

#### 目的

enforce 化後も実画面が壊れない最終 directive セットを確定する。

#### 手順

1. `apps/web/src/lib/security-headers.ts` の directive を最終化
2. 単体テストで directive 文字列が期待通り組み立てられることを検証
3. Next.js inline script の nonce / hash 戦略を確認

#### 成果物

directive 確定版と単体テスト

#### 完了条件

`Content-Security-Policy` 文字列が staging で実画面破壊を発生させない

### Phase 3: staging enforce 先行切替

#### 目的

staging 環境のみ enforce 化し、実画面が壊れないことを Playwright smoke で確認する。

#### 手順

1. `SecurityHeaderConfig.cspMode` を `enforce`（staging のみ env 経由）に切替
2. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
3. Playwright smoke を staging 向けに実行し、主要画面（公開 / 会員 / 管理 / Google OAuth）の通過を確認

#### 成果物

staging deploy ログと smoke 結果

#### 完了条件

staging で 1 週間 enforce 運用しても新規違反 0 件

### Phase 4: production enforce 切替

#### 目的

production を enforce へ昇格させる。

#### 手順

1. `cspMode` を全環境 `enforce` に統一（または production env 経由切替）
2. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`
3. production 向け smoke 実行
4. レスポンスヘッダを `curl -I` 等で確認し `Content-Security-Policy`（report-only 接尾辞無し）が返ることを検証

#### 成果物

production deploy ログとヘッダ検証ログ

#### 完了条件

production レスポンスに enforce CSP が返り、実画面破壊・OAuth リダイレクト失敗が発生していない

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `SecurityHeaderConfig.cspMode` が `enforce` に変更されている
- [ ] production レスポンスに `Content-Security-Policy` ヘッダが付与される
- [ ] `Content-Security-Policy-Report-Only` ヘッダが production で送出されていない
- [ ] Google OAuth リダイレクトが正常動作する
- [ ] Playwright smoke が enforce 後のヘッダ名で検証している

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm --filter @repo/web test` 成功
- [ ] Playwright smoke 緑（staging / production）

### ドキュメント要件

- [ ] 違反レポート棚卸しサマリが残っている
- [ ] CSP directive 最終仕様が `apps/web/src/lib/security-headers.ts` の JSDoc または spec に記載されている
- [ ] rollback 手順（enforce → report-only への即時切戻し）が runbook 化されている

---

## 6. 検証方法

### テストケース

- production レスポンスヘッダに `Content-Security-Policy` が含まれる
- production レスポンスヘッダに `Content-Security-Policy-Report-Only` が含まれない
- 公開 / 会員 / 管理 / OAuth 主要 19 routes が CSP enforce 下で実画面破壊なく動作する
- 違反レポート観測経路で新規違反が 0 件である

### 検証手順

```bash
# ヘッダ確認
curl -I https://<production-domain>/ | grep -i "content-security-policy"

# 単体テスト
mise exec -- pnpm --filter @repo/web test src/lib/security-headers.spec.ts

# E2E
mise exec -- pnpm --filter @repo/web exec playwright test --grep "csp|security-headers"

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7. リスクと対策

| リスク                                                        | 影響度 | 発生確率 | 対策                                                                 |
| ------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| Next.js inline script が CSP で block されて実画面破壊        | 高     | 中       | nonce / hash 戦略を Phase 2 で確定、staging で先行検証                |
| Google OAuth リダイレクトが `connect-src` / `frame-src` 制限で失敗 | 高     | 中       | OAuth 関連 origin を directive に明示追加、Phase 3 staging で確認     |
| 観測期間中に見逃した正当利用が enforce 化後に発覚             | 中     | 中       | env 経由切替で即時 report-only に rollback できる構成を維持           |
| Playwright smoke のヘッダ検証更新漏れ                         | 低     | 中       | Phase 4 で smoke の assertion を grep して二重確認                    |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/implementation-guide.md`
- `apps/web/src/lib/security-headers.ts`
- `apps/web/middleware.ts`

### 参考資料

- MDN: Content-Security-Policy
- MDN: Content-Security-Policy-Report-Only
- Next.js docs: Content Security Policy

---

## 9. 備考

### 苦戦箇所【記入必須】

> apps-web-security-headers-hardening 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | CSP を enforce モードで投入すると、Next.js が生成する inline script や Google OAuth リダイレクトが block され、実画面が壊れる懸念があった                                          |
| 原因     | production トラフィックに対する違反観測（report-only による観測ログ）が今 cycle 時点で存在せず、どの directive 緩和が必要かを事前に網羅できなかった                                |
| 対応     | 今 cycle では observability が無いため enforce 化を保留し、`Content-Security-Policy-Report-Only` で先行投入して違反収集だけ開始する方針を選択。enforce 切替は本タスクとして分離した |
| 再発防止 | セキュリティヘッダ強制系の変更は「report-only で観測 → 1〜2 週間後に enforce」の 2 段階リリースを既定運用とし、unassigned-task で必ず enforce 切替タスクを発行するルールにする   |

### レビュー指摘の原文（該当する場合）

```
apps-web-security-headers-hardening Phase 12 unassigned-task-detection.md にて
CSP report-only → enforce 切替を後続タスクとして識別。observability 経路確立後に enforce 化を実施する方針。
```

### 補足事項

本タスクは apps-web-security-headers-hardening 本体マージ後、staging / production で違反レポートを 1〜2 週間観測してから着手するのが最小コストとなる。env 経由で `cspMode` を切替可能にしておけば、enforce 化後に実画面破壊が発覚しても即時 report-only へ rollback できるため、リスクを抑えながら強制適用へ昇格できる。
