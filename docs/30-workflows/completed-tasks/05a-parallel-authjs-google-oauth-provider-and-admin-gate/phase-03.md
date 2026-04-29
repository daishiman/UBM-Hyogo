# Phase 3 — 設計レビュー: provider 構成 / admin gate / session storage 戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 3 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-02（設計） |
| 下流 | phase-04（テスト戦略） |

## 目的

Phase 2 の設計（Auth.js v5 GoogleProvider + JWT session + 二段防御 admin gate）に対して、3 件以上の代替案を比較検討し、PASS / MINOR / MAJOR で判定する。session storage（JWT vs DB）、admin gate の配置（middleware vs HOC vs API only）、`/auth/session-resolve` を public にする是非を扱う。

## 実行タスク

1. 代替案 5 件の整理（completion: outputs/phase-03/main.md）
2. PASS-MINOR-MAJOR 判定（completion: 各案に判定）
3. 採用案の理由と未解決事項を残す（completion: ADR フォーマット）
4. Phase 1 AC との整合確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 |
| 必須 | outputs/phase-02/architecture.md | 採用案の構造 |
| 必須 | outputs/phase-02/api-contract.md | API I/O |
| 必須 | outputs/phase-02/admin-gate-flow.md | 二段防御の責務分離 |
| 参考 | doc/00-getting-started-manual/specs/02-auth.md | 主導線 OAuth 方針 |
| 参考 | doc/00-getting-started-manual/specs/13-mvp-auth.md | admin 判定 |
| 参考 | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state/phase-03.md | session 共有 ADR |

## 実行手順

### ステップ 1: 代替案の整理

| 案 | 概要 | PASS-MINOR-MAJOR | 理由 |
| --- | --- | --- | --- |
| A: 採用案（JWT + middleware + requireAdmin の二段防御） | session を JWT に閉じ、admin gate は edge middleware と API middleware の両方で実施 | PASS | 不変条件 #5 / #10 / #11 すべて満たす。Cloudflare Edge runtime 互換 |
| B: session を D1 に保存（database strategy） | Auth.js の database session を採用、`sessions` テーブル追加 | MINOR | D1 row 数が user × アクティブ端末で増、不変条件 #10 への影響大、MVP 段階では over-engineering |
| C: middleware を使わず HOC（getServerSession in page）で gate | 各 admin page の top で `requireAdmin()` を呼ぶ | MINOR | UI bypass の漏れリスク、ページ追加のたびに gate 忘れ可能性、実装コスト分散 |
| D: API only gate（apps/web は素通し、apps/api でのみ 403） | middleware 削除、UI は誰でも開けるが API が落ちる | MAJOR | 非 admin に admin UI 構造が露出。情報漏洩リスク（不変条件 #11 違反） |
| E: `/auth/session-resolve` を skip し、session callback で D1 直接アクセス | apps/web の Auth.js callback から `getCloudflareContext()` 経由で D1 を直接読む | MAJOR | 不変条件 #5 違反、apps/web から D1 直接アクセス禁止 |

### ステップ 2: PASS-MINOR-MAJOR 集計

| 判定 | 件数 | 該当案 |
| --- | --- | --- |
| PASS | 1 | A（採用） |
| MINOR | 2 | B, C |
| MAJOR | 2 | D, E |

### ステップ 3: 採用理由（ADR）

A 案を採用。理由:
- **不変条件 #5 充足**: session-resolve endpoint を `apps/api` 経由にすることで、apps/web は D1 を直接触らない
- **不変条件 #10 充足**: JWT 採用で `sessions` テーブルを増やさず無料枠を温存（B 案不採用の決定打）
- **不変条件 #11 充足**: middleware と requireAdmin の二段防御で UI 構造の漏洩を防ぐ（D 案不採用の決定打）
- **Cloudflare Edge runtime 互換**: middleware.ts が edge で動く前提を Phase 2 で確認済み
- **Auth.js v5 公式パターン**: JWT strategy は @opennextjs/cloudflare の推奨

### ステップ 4: 未解決事項

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | `/auth/session-resolve` をどう保護するか（public 公開すると email 列挙可能） | apps/api 内部 endpoint として、apps/web からは Worker-to-Worker 認証 header で呼ぶ | 4 / 5 |
| Q2 | JWT TTL を 24h vs 7d | 24h（spec で固定、refresh は 06b で別タスク） | - |
| Q3 | hosted domain 制限を ON にすべきか | OFF（ubmhyogo メンバーは個人 Gmail もありうる） | - |
| Q4 | session callback で profile 本文 fetch するか | NO（不変条件 #4/#11、本文は `/me` API を画面側から都度 fetch） | 2 で確定済み |
| Q5 | admin gate 拒否時の redirect 先（`/login?gate=admin_required` vs `/`） | `/login?gate=admin_required`（fail closed） | 5 / 6 |

### ステップ 5: Phase 1 AC との整合確認

| AC | 採用案 A での実現 |
| --- | --- |
| AC-1 | session.user.memberId は jwt callback で `token.memberId` から復元 |
| AC-2 | session-resolve が `null` を返したら `signIn` callback が `false` を返却 |
| AC-3 | session-resolve が isAdmin=true を返したら token に積む |
| AC-4 | middleware.ts で gate（302 to /login or 403） |
| AC-5 | requireAdmin で gate（401/403） |
| AC-6 | secrets は wrangler secret put のみ、リポジトリには placeholder 名のみ |
| AC-7 | infra 04 の secrets リストに準拠 |
| AC-8 | JWT 改ざん検出は Auth.js v5 の標準動作 |
| AC-9 | session-resolve の出力が provider 不変なため、05b と同じ memberId |
| AC-10 | middleware は edge runtime で動く（Phase 2 で確認済） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A の test 設計（unit / contract / E2E / authorization） |
| Phase 6 | 不採用案の漏洩を防ぐ異常系（D 案的に「UI が admin 構造を晒す」を防ぐ test） |
| Phase 7 | AC との整合再確認 |
| 05b Phase 3 | session 共有 ADR の整合確認 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | E 案不採用の根拠（apps/web から D1 直接アクセス）を ADR で明記 | #5 |
| privacy | A / B / C すべて JWT に profile 本文を載せない設計 | #4, #11 |
| 認可境界 | D 案不採用の根拠（API gate のみだと UI 漏洩） | #11 |
| 無料枠 | B 案の D1 row 増を回避 | #10 |
| Cloudflare 互換 | A 案の middleware.ts が edge runtime で動くこと（Phase 2 で確認） | - |
| 観測性 | gate 拒否を audit log に記録（07c で実装、本タスクでは hook を残す） | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 5 件列挙 | 3 | pending | A〜E |
| 2 | PASS-MINOR-MAJOR 判定 | 3 | pending | 集計表 |
| 3 | 採用理由 ADR | 3 | pending | 主成果物 |
| 4 | 未解決事項残し | 3 | pending | Q1〜Q5 |
| 5 | Phase 1 AC との整合確認 | 3 | pending | 10 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案、判定、採用理由、未解決事項 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 代替案 3 件以上（5 件で達成）
- [ ] PASS-MINOR-MAJOR が全案に付与
- [ ] 採用案 A の理由が明記
- [ ] 未解決事項が確定 Phase 付きで残る
- [ ] Phase 1 AC 10 件すべてに採用案での実現方法が紐付く

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-03/main.md が配置
- 全完了条件にチェック
- 不変条件 #5, #10, #11 違反案（D, E）が MAJOR と判定
- 次 Phase へ Q1〜Q5 を引継ぎ

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A の API contract と Mermaid を test 設計の入力に
- ブロック条件: 採用案が確定していない場合は進まない
