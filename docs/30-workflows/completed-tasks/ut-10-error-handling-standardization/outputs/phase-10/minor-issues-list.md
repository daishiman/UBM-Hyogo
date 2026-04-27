# MINOR 指摘一覧（Phase 10 成果物）

## MINOR 件数: 2 件

「機能影響なし」を理由に未タスク化しない方針（[Phase 12 漏れ防止] 準拠）。全件に対応 Phase / 別タスク化 / 意図的見送りのいずれかを付与。

## MINOR-1: i18n 多言語化 未対応（locale パラメータ非対応）

| 項目 | 内容 |
| --- | --- |
| 観点 | 観点 5（i18n 拡張容易性）|
| 内容 | `UBM_ERROR_CODES[code].defaultDetail` が ja-JP 単言語固定。locale 切り替え非対応 |
| 影響範囲 | クライアント側で英語等の他言語が必要になった場合、`UBM_ERROR_CODES` の構造変更が必要 |
| 機能影響 | なし（MVP は ja-JP のみ） |
| 処置区分 | **意図的見送り** |
| 理由 | MVP スコープでは ja-JP のみで十分。多言語化は将来の i18n タスク（未起票）で扱う |
| 再評価時期 | 公開ディレクトリ多言語化要件が発生した時点（現状未予定） |
| 拡張パス | `defaultDetail: string` → `defaultDetail: Record<Locale, string>` への構造変更 + `errorHandler` 内で `Accept-Language` header を解釈 |

## MINOR-2: `originalMessage` 値内 Bearer トークン残存リスク

| 項目 | 内容 |
| --- | --- |
| 観点 | 観点 3（機密情報非開示） |
| 内容 | sanitize は key 名 substring マッチで REDACT する。`originalMessage` という key 自体は redact 対象でないため、その値に `Bearer eyJ...` 文字列が含まれていればサーバーログに残る |
| 影響範囲 | サーバーログのみ（クライアント返却 body には含まれないため、ユーザー漏洩はゼロ） |
| 機能影響 | なし（クライアント側 SLA に影響なし） |
| 処置区分 | **別タスク化** |
| 対応先 | UT-08（モニタリング）でログ集約時に値レベル redact パターンを追加検討 |
| 理由 | クライアント漏洩リスクはゼロ。サーバーログ集約時点での pattern-based redact が現実的（`Bearer\s+\S+` / `Cookie:\s+\S+` 等） |
| トラッキング | outputs/phase-06/security-leak-tests.md L-1 にも同内容を記録 |

## CONDITIONAL PASS / PENDING の追跡

以下は MINOR ではないが、UT-10 内では完成しないため別途追跡:

| ID | 項目 | 区分 | 対応 Phase / タスク |
| --- | --- | --- | --- |
| FOLLOW-1 | vitest 未導入による AC-2 の実行ベース検証未到達 | 既知の限界 | テストインフラ整備タスク（UT-10 スコープ外、未起票）|
| FOLLOW-2 | `apps/api/docs/error-handling.md` 作成 | 解消済み | Phase 12 で完了 |

## MAJOR 指摘一覧

なし（0 件）。

## NO-GO トリガー

なし。機密情報非開示 MAJOR ゼロ、AC FAIL ゼロ。

## 処置一覧サマリー

| 処置区分 | 件数 | 件名 |
| --- | --- | --- |
| Phase 11 で対応 | 0 | – |
| Phase 12 で対応 | 0（FOLLOW-2 を除く） | – |
| Phase 13 で対応 | 0 | – |
| 別タスク化 | 1 | MINOR-2（UT-08 でフォロー） |
| 意図的見送り | 1 | MINOR-1（i18n、再評価時期明示） |
| **合計** | **2** | – |

## 完了条件

- [x] 全 MINOR が対応 Phase / 別タスク化 / 見送りのいずれかで処置されている
- [x] 「機能影響なし」を理由とした未タスク化はない（全件で根拠を明示）
- [x] 意図的見送りの再評価時期が記録されている
