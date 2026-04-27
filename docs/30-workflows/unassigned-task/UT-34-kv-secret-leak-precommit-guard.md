# UT-34: KV Namespace ID 混入防止 pre-commit guard

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-34 |
| タスク名 | KV Namespace ID 混入防止 pre-commit guard |
| 優先度 | LOW |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 種別 | developer-experience / security |
| 作成日 | 2026-04-27 |
| 検出元 | UT-13 Phase 12 unassigned-task-detection |
| 既存タスク組み込み | なし |

## 目的

Cloudflare KV Namespace ID（32 桁 hex）や Account ID のような実 ID がドキュメント・コードに混入する前に検出する仕組みを整備する。1Password 管理の実 ID が誤ってリポジトリにコミットされる事故を防止する。

## スコープ

### 含む

- 32 桁 hex パターン（Cloudflare Namespace ID 形式）を検出する正規表現の定義
- `docs/` や `apps/api/wrangler.toml` に placeholder 以外の実 ID が含まれないかチェックするスクリプト
- false positive の除外リスト（git SHA、テスト用フィクスチャ、既知の安全な hex 文字列）
- pre-commit hook または CI チェックとしての組み込み可否評価
- `.gitleaksrc` や `gitleaks` 利用の可否検討

### 含まない

- シークレット全般の検出（Cloudflare API Token 等は GitHub の secret scanning に委譲）
- UT-35 の実 ID 発行作業（本タスクは guard 実装のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 関連 | UT-35 KV Namespace 実 ID 発行 | 実 ID が存在してから guard の実効性を確認できる |
| 関連 | UT-05 CI/CD パイプライン実装 | CI ジョブへの組み込みルートを確認するため |

## 参照

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-09/quality-report.md`（secret hygiene チェック結果）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-06/failure-cases.md`（FC-05: 実 ID 漏洩 failure case）

## 苦戦箇所・知見

**32 桁 hex の誤検知**:
32 桁 hex は UUID（ハイフン除去版）や git commit SHA の短縮形など広く使われる。単純な `[0-9a-f]{32}` パターンだと誤検知が多い。`wrangler.toml` の `id = "..."` や `preview_id = "..."` キーとの組み合わせで検出すると精度が上がる。

**gitleaks の活用**:
`gitleaks` は Cloudflare-specific のルールセットを持っており、Account ID / API Token 等を検出できる。KV Namespace ID は専用ルールがない場合もあるため、カスタムルールで補完する必要がある。設定ファイル `.gitleaks.toml` で `[[rules]]` を追加するのが最小コストの実装方法。

**pre-commit hook vs CI の使い分け**:
pre-commit hook はコミット前に即時フィードバックを与えられるが、hook のインストールが各開発者の手動作業になる（`mise exec -- npx lefthook install` 等）。CI でも同一チェックを実施し、hook がない場合の最終防衛ラインとして機能させるのが堅牢な設計。
