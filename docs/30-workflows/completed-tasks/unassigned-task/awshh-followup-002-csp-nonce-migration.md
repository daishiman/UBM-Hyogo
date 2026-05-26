# CSP nonce 化（'unsafe-inline' 削除） - タスク指示書

## メタ情報

```yaml
issue_number: 871
```


## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | awshh-followup-002-csp-nonce-migration            |
| タスク名     | CSP nonce 化（'unsafe-inline' 削除）              |
| 分類         | セキュリティ強化                                  |
| 対象機能     | apps/web Content-Security-Policy                  |
| 優先度       | 中                                                |
| 見積もり規模 | 中規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | apps-web-security-headers-hardening Phase 12      |
| 発見日       | 2026-05-23                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

apps-web-security-headers-hardening cycle で導入した CSP は `script-src 'self' 'unsafe-inline'` / `style-src 'self' 'unsafe-inline'` を含む。Next.js が App Router で生成する inline script / inline style との互換性を保つため、初期導入では `'unsafe-inline'` を一時的に許可している状態である。

### 1.2 問題点・課題

- `'unsafe-inline'` を script-src に含む CSP は XSS 防御を著しく弱める（CSP が攻撃者注入 script を実質ブロックできない）
- style-src の `'unsafe-inline'` も injection style 経由の data 抜き取り（CSS exfiltration）耐性を下げる
- 現状の CSP は「設定はしているが防御効果が限定的」な状態であり、CSP 導入の目的を十分に果たせていない

### 1.3 放置した場合の影響

- 万一 XSS 経路が一つでも見つかった場合、CSP が defense-in-depth として機能せず即座にユーザー被害につながる
- セキュリティレビュー / 第三者監査での指摘事項として恒久的に残る
- `'unsafe-inline'` を含む CSP は実質「ない」と同等の評価を受ける業界標準のため、ヘッダ導入工数が評価面で目減りする

---

## 2. 何を達成するか（What）

### 2.1 目的

Next.js の nonce-based CSP に移行し、`script-src` / `style-src` から `'unsafe-inline'` を削除する。inline script / inline style は request 毎に発行される nonce で個別許可する。

### 2.2 最終ゴール

- `apps/web/middleware.ts` が request 毎に nonce を生成し、response header と downstream context 双方に伝播している
- `apps/web/src/lib/security-headers.ts` の `buildCspDirective` が nonce を受け取り `script-src 'self' 'nonce-xxx'` 形式を出力している
- `'unsafe-inline'` が script-src / style-src directive から削除されている
- 全画面（公開 6 / 会員 2 / 管理 8 / 共通 3 = 19 routes）で nonce 配信が機能し、ブラウザコンソールに CSP 違反が発生していない

### 2.3 スコープ

#### 含むもの

- `apps/web/middleware.ts` での nonce 生成と response header 注入
- `apps/web/src/lib/security-headers.ts` の `buildCspDirective` を nonce 対応に変更
- Next.js 16 App Router 配下での nonce 流通（server / client component 境界での context 伝播）
- `@opennextjs/cloudflare` build bundle 経由での nonce 配信検証
- 全 19 routes での smoke 検証

#### 含まないもの

- CSP report-only から enforce への切替（U-AWSHH-001 のスコープ）
- D1 schema 変更 / API endpoint 追加
- Google Form 仕様変更
- nonce 以外の CSP directive 強化（例: `strict-dynamic` 導入）

### 2.4 成果物

- `apps/web/middleware.ts` の差分
- `apps/web/src/lib/security-headers.ts` の差分
- `buildCspDirective` の単体テスト
- 19 routes での CSP 違反ゼロを示す smoke ログ / スクリーンショット

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- U-AWSHH-001（CSP enforce 切替）が完了していること推奨（report-only 状態で nonce 移行を進めると違反検出が二重に走るため）
- apps-web-security-headers-hardening cycle が main に取り込まれていること

### 3.2 依存タスク

- U-AWSHH-001（CSP enforce 切替）
- apps-web-security-headers-hardening マージ済み

### 3.3 必要な知識

- Next.js 16 App Router の middleware 実行モデル
- `@opennextjs/cloudflare` の build / runtime 挙動
- CSP nonce の仕様（RFC 7762 / W3C CSP3）
- Next.js が生成する inline script の種類（hydration data 等）

### 3.4 推奨アプローチ

middleware で `crypto.randomUUID()` または `crypto.getRandomValues()` から base64 nonce を生成し、`x-nonce` カスタム request header に詰めて downstream に渡す。layout / page 側では `headers()` から nonce を取得し、Next.js の `<Script nonce={...}>` および inline style tag に注入する。Cloudflare Workers 環境での `headers()` 動作互換は task-02 wrangler-env-injection の `getEnv()` パターンと同様に検証する。

---

## 4. 実行手順

### Phase構成

1. 現行 CSP と inline 依存の棚卸し
2. nonce 生成・伝播設計
3. middleware / security-headers 実装
4. 19 routes 動作検証

### Phase 1: 現行 CSP と inline 依存の棚卸し

#### 目的

`'unsafe-inline'` がないと壊れる箇所を全列挙する。

#### 手順

1. `rg "dangerouslySetInnerHTML|<style |<script " apps/web/src` で inline 利用箇所を列挙
2. Next.js が自動生成する inline（hydration script 等）の有無を実機ブラウザの DevTools で確認
3. 第三者 script（analytics 等）の有無を確認

#### 成果物

inline 依存箇所一覧

#### 完了条件

inline 利用箇所がすべて把握できている

### Phase 2: nonce 生成・伝播設計

#### 目的

middleware → layout → component の nonce 流通経路を確定する。

#### 手順

1. middleware での nonce 生成方式（base64 16byte 等）を選定
2. response header と request header（downstream 伝播用）の両方に注入する設計を決める
3. layout で `headers().get('x-nonce')` 経由で取得 → `<Script nonce={nonce}>` 形式に渡す経路を設計
4. Cloudflare Workers / OpenNext 環境での `headers()` 同期取得可否を確認

#### 成果物

nonce 流通シーケンス図 / 設計メモ

#### 完了条件

server component / client component 境界での nonce 伝播経路が明確

### Phase 3: middleware / security-headers 実装

#### 目的

nonce 生成と CSP 注入の実装を完了する。

#### 手順

1. `apps/web/middleware.ts` で nonce 生成・request header 注入・response header 注入を実装
2. `apps/web/src/lib/security-headers.ts` の `buildCspDirective` を `(nonce: string) => string` に変更
3. `'unsafe-inline'` を script-src / style-src から削除
4. 単体テストを追加（nonce が directive に含まれること / `'unsafe-inline'` が含まれないこと）

#### 成果物

実装差分と単体テスト

#### 完了条件

`'unsafe-inline'` 直書きが script-src / style-src から消えている

### Phase 4: 19 routes 動作検証

#### 目的

nonce 移行後も全画面が壊れないことを保証する。

#### 手順

1. ローカル `pnpm dev` で 19 routes すべてを表示
2. DevTools Console に CSP violation が出ていないことを確認
3. Cloudflare staging へデプロイし同じ確認を実施
4. Playwright smoke で CSP violation 検出を自動化（可能なら）

#### 成果物

19 routes 検証ログ / スクリーンショット

#### 完了条件

全 routes で CSP violation 0 件

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/web/middleware.ts` で nonce が request 毎に生成されている
- [ ] `buildCspDirective` が nonce 引数を受け取る形に変更されている
- [ ] script-src / style-src から `'unsafe-inline'` が削除されている
- [ ] 19 routes で CSP violation が 0 件

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm --filter @repo/web test` 成功

### ドキュメント要件

- [ ] `docs/00-getting-started-manual/specs/` の関連 spec に nonce 方式を追記
- [ ] 不変条件として「`'unsafe-inline'` 直書き禁止」を明文化

---

## 6. 検証方法

### テストケース

- middleware が request 毎に異なる nonce を生成する
- response header の CSP に `'nonce-<value>'` が含まれる
- response header の CSP に `'unsafe-inline'` が含まれない
- inline `<Script>` に nonce 属性が付与される

### 検証手順

```bash
rg -n "'unsafe-inline'" apps/web/src
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web test
mise exec -- pnpm --filter @repo/web dev
# DevTools Console で CSP violation を 19 routes 分目視確認
```

---

## 7. リスクと対策

| リスク                                                        | 影響度 | 発生確率 | 対策                                                                 |
| ------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| Next.js 自動生成 inline script に nonce が伝播せず画面が壊れる | 高     | 中       | Next.js 公式 nonce 例に準拠し、layout で `<Script nonce>` を必ず渡す |
| Cloudflare Workers の `headers()` が同期取得できず nonce 流通失敗 | 中     | 中       | OpenNext build bundle で事前検証、ダメなら request context 経由に切替 |
| 第三者 script が nonce 非対応で壊れる                         | 中     | 低       | Phase 1 棚卸しで第三者 script を全列挙し移行可否を判定               |
| CSP violation が staging で発生し production 移行できない     | 高     | 中       | Phase 4 で staging smoke を必須化し、production 切替前に違反 0 を確認 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md`
- `apps/web/src/lib/security-headers.ts`
- `apps/web/middleware.ts`
- `docs/30-workflows/unassigned-task/awshh-followup-001-csp-enforce-switch.md`（存在する場合）

### 参考資料

- W3C Content Security Policy Level 3（nonce-source）
- Next.js 公式 docs: Content Security Policy
- `@opennextjs/cloudflare` runtime headers 仕様

---

## 9. 備考

### 苦戦箇所【記入必須】

> apps-web-security-headers-hardening cycle 実施時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | Next.js 16 + `@opennextjs/cloudflare` 環境で nonce-based CSP を設定すると、middleware で request 毎に nonce を発行して response header と inline script tag 双方に注入する必要があり、影響範囲が apps/web 全体に及ぶ |
| 原因     | Pages Router 時代と異なり App Router での nonce 流通は server component / client component 境界で context を伝播する仕組みが必要。Next.js 自動生成 inline script への nonce 伝播も Cloudflare Workers runtime での `headers()` 同期取得可否に依存し、検証コストが大きい |
| 対応     | 今 cycle では実装/テスト/レビューのスコープを `apps/web` 局所に保つため `'unsafe-inline'` を一時的に許可した状態で導入を完了させ、nonce 化は本 followup タスクとして分離した |
| 再発防止 | CSP `'unsafe-inline'` 直書きを将来的に不変条件として禁止し、nonce 化完了後は CI gate で `rg "'unsafe-inline'"` の検出を fail 化する想定                              |

### レビュー指摘の原文（該当する場合）

```
apps-web-security-headers-hardening Phase 12 unassigned-task-detection.md にて
script-src / style-src の 'unsafe-inline' 削除と nonce 化を後続タスクとして識別
```

### 補足事項

本タスクは U-AWSHH-001（CSP enforce 切替）完了後に着手するのが最小リスク。enforce 状態で nonce 移行を行うことで違反検出が即座にユーザー影響として可視化され、漏れの発見が早くなる。逆に report-only のままで nonce 移行を進めると、violation report の解析と nonce 流通バグの切り分けが困難になる。
