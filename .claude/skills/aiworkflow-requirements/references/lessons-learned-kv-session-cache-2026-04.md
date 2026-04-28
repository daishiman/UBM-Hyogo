# Lessons Learned — UT-13 Cloudflare KV session cache（2026-04）

> 親ファイル: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)
> 集約 reference: [observability-monitoring.md](observability-monitoring.md)（KV 書き込み計装の `kv_op` イベントは observability-monitoring 側で集約）
> 分離理由: UT-13 由来の KV 設定 / 認証連携設計教訓を独立ファイル化（責務分離）。

---

## 対象タスク

UT-13 Cloudflare KV セッションキャッシュ設定（unassigned / 検出元 01b-parallel-cloudflare-base-bootstrap UN-02）

---

## L-KV-001: KV 最終的一貫性（Eventual Consistency）の制約

- **症状**: Cloudflare KV は最終的一貫性モデルで、書き込み後に他リージョンへの反映に最大 60 秒かかる。セッション無効化（ログアウト）/ 権限変更を即時反映する用途に KV を直接使うと、ログアウト直後にも旧セッションで API が通る window が発生する。
- **解決**: KV を「読み多 / 書き少 / 即時整合不要」のキャッシュ層に限定する設計を不変条件として固定する。即時無効化が必要なセキュリティ操作（ログアウト、権限剥奪、緊急ブロック）には KV を使わず、JWT + 短い TTL（例: 5 分）+ blacklist は別ストア（D1 or Durable Objects）で扱う。
- **Why**: 認証はセキュリティ要件が最も厳しい領域で、最大 60 秒のグレースが許容される運用は稀。一貫性モデルの不一致は「設計時に明文化されないと、実装時に気付かないまま脆弱性として残る」典型ケース。
- **How to apply**: KV を使う設計書には「即時整合が必要か / 不要か」のチェック欄を必須化し、「必要」と判定された操作は KV を使わない設計に強制する。Phase 2 設計レビューでこのチェック欄を見ない通過を禁止する。

---

## L-KV-002: 無料枠の書き込み制限（1,000 件 / 日）

- **症状**: KV 無料枠の書き込みは 1,000 件 / 日。セッション作成のたびに KV 書き込みが発生する設計だと、アクティブユーザー数百人規模で枯渇する。「ログイン → セッション保存」を素朴に実装すると、想定より早く運用が破綻する。
- **解決**:
  1. セッション本体は JWT（署名検証のみで読める）にし、KV は revocation blacklist（ログアウト時のみ書き込み）に限定する設計を採る。
  2. もしくは「セッション更新の間引き」（例: 既存 TTL 残り 50% を切ってから更新）でセッションあたり書き込み回数を 1/n に減らす。
  3. `kv_op` WAE イベントで書き込み回数を継続観測し、`quota_pulse` で日次消費率（target 60% 未満）を監視する。
- **Why**: 無料枠の制限はサービス障害として表面化する前に「書き込みが silently throttle される」「429 が散発的に出る」など曖昧な症状を出す。事前に書き込み回数の上限設計と実測の両方を持たないと、原因特定が困難になる。
- **How to apply**: KV を使う設計書には「想定 DAU × 想定書き込み回数 / 日」を必須計算欄として記入し、無料枠（1,000 件 / 日）の 60% を上限として設計する。超過する見積りなら設計を見直す（書き込み間引き / 別ストア併用 / 有料プラン検討）。

---

## L-KV-003: Namespace 命名と環境分離

- **症状**: `wrangler.toml` の `[env.production]` / `[env.staging]` で KV Namespace ID を取り違えると、staging の操作が production データに影響する致命的な事故が起きる。Namespace ID は UUID 風文字列で目視チェックが効きにくい。
- **解決**:
  1. Namespace 名は環境 suffix を必須化（`ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`）し、wrangler の binding 名と Namespace 名の env suffix を一致させる。
  2. `wrangler.toml` の KV binding セクション直前に「ID 取り違え禁止コメント」を必ず付ける。
  3. CI で `wrangler.toml` をパースし、`[env.production]` の KV ID と `[env.staging]` の KV ID が異なることを検証するチェックを追加する（同一値なら fail）。
  4. PR レビューで KV ID 変更を含む差分は、運用代表 + 別レビューアの 2 名承認を必須化する。
- **Why**: 設定ファイルの ID 取り違えは「動作確認では検出できない」（staging で動いてしまうと production に書く）類の事故で、事後発覚すると影響範囲の特定とロールバックに時間がかかる。configuration-as-code のレビューゲートで止めるのが唯一の恒久対策。
- **How to apply**: `wrangler.toml` の environment 別 binding 設定変更は code review 必須項目とし、CI の static check に env 別 ID 一致禁止チェックを組み込む。設定値そのものは `references/deployment-cloudflare.md` の binding テーブルに正本を持つ。
