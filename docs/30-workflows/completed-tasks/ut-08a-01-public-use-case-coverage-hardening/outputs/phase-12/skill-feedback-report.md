# Skill Feedback Report — ut-08a-01-public-use-case-coverage-hardening

skill-creator 観点で、本タスクの `outputs/phase-12/implementation-guide.md` §「設計上の判断」を lessons 形式に再録し、将来の use-case coverage hardening タスクで再利用すべき pattern を抽出する。task-specification-creator skill / int-test-skill が今後同種タスクを起票する際のテンプレート補強候補として記録する。

## 背景: docs-only 表記とタスク実態の乖離

既存 task spec は `taskType: docs-only` と記録されていたが、実態は public use-case 4 本と public route handler の coverage hardening のためテストファイル追加が必須だった。CONST_004 に従い `implementation` へ再分類し、変更対象ファイル / シグネチャ / テスト / コマンド / DoD を必須化した。

**スキルへの観察事項**: テスト追加タスクは「コードに新規ロジックを足さない」場合でも `taskType: implementation` とすべき。既存 use-case のテスト網羅率向上は仕様書のドキュメント差分では完結しないため、docs-only 判定は構造的に誤り。

## Lessons

### L1: D1Database 互換 mock の SQL fragment dispatch 設計

| 項目 | 内容 |
| --- | --- |
| 課題 | `D1Database` の `prepare(sql).bind(...).first()/all()` チェーンを use-case 単体テストごとに毎回手書きすると、SQL 文字列の些細な揺れで test 同士が独立に壊れる。 |
| 採用判断 | `createPublicD1Mock` は SQL fragment（例: `FROM schema_versions ... state = 'active'`、`SELECT 1 AS hit FROM member_status s`）でディスパッチし、`PublicD1MockOptions` の fixture を返す方式とした。`schemaFields` / `publicMembers` / `memberStatusById` などをオプションで上書きするだけで複数 use-case を共通 mock で覆える。 |
| 効果 | use-case 4 本 + route handler test の合計 17 ケースを単一 mock 実装で構築でき、SQL 表現変更にも fragment regex 1 箇所修正で追随可能。 |
| 再利用 pattern 名 | **SQL Fragment Dispatch Mock** |

### L2: `failOnSql` による D1 失敗系の 1 オプション網羅

| 項目 | 内容 |
| --- | --- |
| 課題 | D1 例外パスを use-case ごとにカスタム mock で再現すると失敗パターンが散乱し、メンテコストが線形に増える。 |
| 採用判断 | `PublicD1MockOptions.failOnSql: RegExp \| string` 1 オプションで「マッチした SQL fragment が実行されたら throw」を実現。例: `failOnSql=/FROM schema_questions/` で schema field query のみ落とし、他は通す。 |
| 効果 | use-case 4 本それぞれの D1 failure ケースを 1 行のオプション指定で書ける。失敗箇所の局所化が test 内宣言として表現でき、grep 容易性が高い。 |
| 再利用 pattern 名 | **Predicate-driven Failure Injection** |

### L3: `existsPublicMember` の eligible 条件解釈

| 項目 | 内容 |
| --- | --- |
| 課題 | 公開不適格 member（`public_consent != 'consented'` / `publish_state != 'public'` / `is_deleted = 1`）と、`identity_aliases` テーブルでの旧 ID マッピングのどちらを mock 射程に含めるかが不明瞭。 |
| 採用判断 | `existsPublicMember` は `memberStatusById[memberId]` の 3 条件のみで eligible 判定するスコープに固定。`identity_aliases` は public mock の射程外とし、route handler レイヤで 404 境界が ApiError(UBM-1404) として観測できれば十分とした。 |
| 効果 | mock の責務を「現在の member_status 行の有無＋状態列」に限定でき、alias ルックアップを跨いだ複雑な join mock を避けられた。 |
| 再利用 pattern 名 | **Layer-Bounded Mock Scope** |

### L4: route handler test での親 Hono + errorHandler 装着

| 項目 | 内容 |
| --- | --- |
| 課題 | `createPublicRouter()` を単独で `app.request()` すると、本番で適用される `errorHandler` middleware が外れ、`ApiError(UBM-1404)` が 500 として観測されてしまう。 |
| 採用判断 | route handler test では本番と同じ `errorHandler` を親 Hono にセットし、`createPublicRouter()` を `/public` で mount する構成を採用。これにより 404 / 200 / Cache-Control 検証が本番挙動と一致する。 |
| 効果 | route 単体テストでも error mapping を含む E2E に近い境界検証が可能。auth middleware を装着しないことで「public route は session guard なしで到達できる」性質も同時に担保。 |
| 再利用 pattern 名 | **Production-Equivalent Middleware Composition for Route Tests** |

## 再利用 pattern まとめ（skill-creator 観点）

将来の use-case coverage hardening タスクでは、以下 4 pattern を `int-test-skill` / `task-specification-creator` の references 候補として登録することを推奨する:

| pattern | 適用範囲 | テンプレート化候補 |
| --- | --- | --- |
| SQL Fragment Dispatch Mock | D1 binding 依存 use-case 単体テスト | `int-test-skill/references/d1-mock-pattern.md` |
| Predicate-driven Failure Injection | repository / use-case の失敗系網羅 | 同上 |
| Layer-Bounded Mock Scope | mock 射程と layer 境界の整合 | 同上 |
| Production-Equivalent Middleware Composition for Route Tests | Hono route handler 単体テスト | `int-test-skill/references/route-test-pattern.md` |

## skill-creator 観点での観察事項

1. `task-specification-creator` の Phase 12 テンプレートは「coverage hardening タスクは implementation と判定する」ガイドが弱い。`taskType` 判定マトリクスに「テスト追加のみでも implementation」行を明示追加すべき。
2. `int-test-skill` は service 層契約テストが主用途だが、本タスクで蓄積された D1 mock pattern は use-case / route layer にも適用可能。射程拡張を検討する価値あり。
3. NON_VISUAL 代替証跡として「focused vitest 実行ログ + テストファイルパス」を Phase 11 / Phase 12 で必須化する運用が効果的だった（既存 inventory にも追記済）。
