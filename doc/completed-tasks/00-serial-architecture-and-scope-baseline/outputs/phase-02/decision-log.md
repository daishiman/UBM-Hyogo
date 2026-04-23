# Phase 2 出力: decision-log.md
# 採用/非採用理由の判断ログ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 2 / 13 (設計) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-01/baseline-inventory.md, outputs/phase-02/canonical-baseline.md |

---

## 1. 採用決定ログ

各コンポーネントを採用した理由を記録する。

### DL-01: Cloudflare Pages (Web 層) 採用

| 項目 | 内容 |
| --- | --- |
| 採用決定 | Cloudflare Pages を Web 層のホスティングとして採用 |
| 採用理由 | (1) 無料枠が存在し、ユーザー要求の「無料運用」と整合する。(2) Edge Network により低レイテンシを実現。(3) Next.js App Router との統合が公式サポートされている。(4) Cloudflare Workers と同一プラットフォームのため、staging/production 環境管理が統一できる |
| 正本参照 | architecture-overview-core.md |

### DL-02: Cloudflare Workers + Hono (API 層) 採用

| 項目 | 内容 |
| --- | --- |
| 採用決定 | Cloudflare Workers + Hono を API 層として採用 |
| 採用理由 | (1) 無料枠 (100k req/day) でユーザー要求を満たす。(2) D1 への binding が Workers からのみ可能であり、DB アクセスのゲートウェイとして最適。(3) Hono は型安全な RPC 定義とミドルウェアチェーンが軽量に実現できる。(4) Edge Runtime で Pages と対称的な構成になる |
| 正本参照 | architecture-overview-core.md |

### DL-03: Cloudflare D1 (canonical DB) 採用

| 項目 | 内容 |
| --- | --- |
| 採用決定 | Cloudflare D1 を唯一の canonical DB として採用 |
| 採用理由 | (1) 無料枠 (5GB / 500k reads/day / 100k writes/day) でユーザー要求を満たす。(2) SQLite ベースのため既存の SQL 知識が流用可能。(3) WAL mode により読み書き競合を最小化。(4) Workers binding によりレイテンシゼロに近いアクセスが可能。(5) Cloudflare エコシステムで完結するため管理コストが低い |
| 正本参照 | architecture-overview-core.md |

### DL-04: Google Sheets (入力源) 採用

| 項目 | 内容 |
| --- | --- |
| 採用決定 | Google Sheets を入力源 (non-canonical) として採用 |
| 採用理由 | (1) ユーザー要求「Google Sheets を入力源として使用」を直接満たす。(2) 無料で利用可能。(3) 非エンジニアがデータ入力する際の UI として Excel 互換の使い慣れたインターフェースを提供できる。(4) canonical でない (D1 が正本) と明確に定義することで、データ整合性の責任を D1 に集約できる |
| 正本参照 | User request 2026-04-23 |

### DL-05: feature → dev → main ブランチ戦略採用

| 項目 | 内容 |
| --- | --- |
| 採用決定 | feature/* → dev → main の3層ブランチ戦略を採用 |
| 採用理由 | (1) feature/* によりローカル開発の独立性を確保。(2) dev ブランチが staging 環境に対応し、production 影響なしで統合テストが可能。(3) main ブランチが production に対応し、2名レビュー必須で品質ゲートを確保。(4) force push 禁止により誤った本番上書きを防止 |
| 正本参照 | deployment-branch-strategy.md |

### DL-06: Cloudflare / GitHub / 1Password のシークレット分離採用

| 項目 | 内容 |
| --- | --- |
| 採用決定 | ランタイムシークレットは Cloudflare Secrets、CI/CD シークレットは GitHub Secrets、ローカル秘密情報の正本は 1Password Environments で管理する構成を採用 |
| 採用理由 | (1) 各シークレットが使用される文脈に最適な管理場所に配置することで最小権限の原則を実現。(2) 1Password をローカル秘密情報の正本にすることで平文 .env ファイルのリポジトリコミットリスクをゼロにする。(3) Cloudflare Secrets は Workers/Pages が実行時に直接読み取れる唯一の方法。(4) GitHub Secrets は GitHub Actions の CI/CD パイプラインでのみ利用可能。(5) workspace-local `.env*` / dotfiles は implementation artifacts only であり、canonical secret source は 1Password Environments である |
| 正本参照 | deployment-secrets-management.md |

---

## 2. 非採用候補と理由

以下の代替案を検討したが、採用しなかった。

### NA-01: Google Sheets を正本 DB として使用する案

| 項目 | 内容 |
| --- | --- |
| 代替案 | Sheets をそのまま canonical DB として使用し、D1 を廃止する |
| 非採用理由 | (1) Sheets は RDBMS ではなくスプレッドシートであり、参照整合性・トランザクション・インデックスがない。(2) 複数ユーザーの同時書き込みで競合が発生しやすく、データ整合性が保証できない。(3) Sheets API のレート制限 (100 req/100s/user) がアプリケーション規模に対して制約になる。(4) Workers から Sheets を直接参照すると外部 API 呼び出しが毎リクエスト発生し、レイテンシと可用性に問題が生じる。(5) D1 の無料枠で十分に運用できるためコスト優位性もない |
| 採用した代替 | D1 を canonical DB, Sheets を入力源 (DL-03 / DL-04) |

### NA-02: OpenNext 単一構成 (Pages + Workers を分離しない) 案

| 項目 | 内容 |
| --- | --- |
| 代替案 | OpenNext を用いて Next.js をフルスタックで Cloudflare Workers に乗せ、API と Web を統合する |
| 非採用理由 | (1) apps/web と apps/api の責務が混在し、将来的な独立スケールが困難になる。(2) API 層の独立したバージョニングとデプロイが不可能になる。(3) テスト分離が困難になり、Unit / Integration テストのスコープが曖昧になる。(4) 正本仕様 (architecture-overview-core.md) が Pages / Workers 分離を明示しており整合しない |
| 採用した代替 | Pages (Web) + Workers (API) の分離構成 (DL-01 / DL-02) |

### NA-03: 通知基盤の同時導入案

| 項目 | 内容 |
| --- | --- |
| 代替案 | 本タスク (Wave 0) で通知基盤 (メール / Slack 等) も同時に設計・導入する |
| 非採用理由 | (1) アーキテクチャ基準線の固定が本タスクの唯一のゴールであり、通知基盤は別の責務を持つ。(2) 通知基盤を先行導入すると本タスクのスコープが肥大化し、完了判定が複雑になる。(3) 通知基盤は Wave 1 以降の実装フェーズでアプリケーションの要件が固まってから設計するほうが手戻りが少ない。(4) ユーザー要求にも含まれていない |
| 採用した代替 | 通知基盤は未タスク候補として分離 (セクション3 参照) |

---

## 3. スコープ外決定

以下の項目を初回スコープから明示的に除外する。

| # | 除外項目 | 除外理由 | 未タスク候補パス |
| --- | --- | --- | --- |
| OOS-01 | Sheets → D1 同期方式の詳細設計 | 本タスクは「Sheets が入力源, D1 が canonical」という方向性の固定が目的。実装詳細は下流タスクで決定 | 03-serial-data-source-and-storage-contract |
| OOS-02 | Sheets API 認証方式 (Service Account / OAuth) | 同期実装に付随する詳細。本タスクのスコープ外 | 03-serial-data-source-and-storage-contract |
| OOS-03 | D1 スキーマ定義 | データモデルはドメイン設計フェーズで決定する | 03-serial-data-source-and-storage-contract |
| OOS-04 | 通知基盤 | ユーザー要求になく、アーキテクチャ基準線とは独立した責務 | 未タスク (Wave 2 以降に検討) |
| OOS-05 | 本番デプロイの実行 | 本タスクはドキュメントのみ。デプロイは 02/03 タスク以降 | 02-serial-monorepo-runtime-foundation |
| OOS-06 | CI/CD パイプラインの実装 | 本タスクはブランチ戦略の定義のみ。実装は下流タスク | 02-serial-monorepo-runtime-foundation |
| OOS-07 | モニタリング / アラート | 運用監視は初期スコープに含まない | 未タスク (Wave 2 以降に検討) |
| OOS-08 | 実コード実装 (apps/web, apps/api) | 本タスクはドキュメントのみ | 02-serial-monorepo-runtime-foundation |

---

## 完了確認

- [x] 採用決定ログ 6件記録済み (DL-01 〜 DL-06)
- [x] 非採用候補と理由 3件記録済み (NA-01 〜 NA-03)
- [x] スコープ外決定 8件記録済み (OOS-01 〜 OOS-08)
- [x] Phase 3 レビューへの引き継ぎ準備完了

## Phase 3 への引き継ぎ

| 項目 | 内容 |
| --- | --- |
| 引き継ぎ事項 | Phase 3 レビューでは NA-01 〜 NA-03 の棄却が十分な根拠を持つかを確認すること |
| blockers | なし |
| open questions | なし |
