# Phase 3: 設計レビュー — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: Phase 2 で確定した「manifest hash 検証 / 決定論的再生成 / diagnostics 構造化ログ / adapter contract test / retirement 条件正本反映」の設計を、(a) 不変条件、(b) 真の論点、(c) 因果と境界、(d) 価値とコスト、(e) 4 条件評価（必要性 / 妥当性 / 一貫性 / 完全性）、で検証して GO/NO-GO を判定する。設計対象が docs-only ではないため本 Phase も実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| phase | 3 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-2 で設計した hardening 案が、UT-02A baseline の不変性と 03a 完成までの暫定運用責務に整合しているかを検証する。特に、(a) 自動生成の自動化レベル、(b) diagnostics の出力先選択、(c) contract test の十分性、(d) retirement 条件の operability、を真の論点として検証する。

## 実行タスク

- 不変条件 #1 / #5 / #14 への抵触有無を確認する
- manifest 自動化、diagnostics 出力、contract test、retirement 条件の論点をレビューする
- Phase 4-13 が参照する確定事項を表に固定する

## 不変条件チェック

| 条件 | チェック内容 | 判定 |
| --- | --- | --- |
| **#1 実フォーム schema をコードに固定しすぎない** | manifest source は `docs/00-getting-started-manual/specs/01-api-schema.md`。`sourceSpecHash` で drift を検知し、コード側に schema duplication が増えない。regenerate スクリプトは markdown を parse する一方向のみで、コード→spec の逆流を作らない | GO |
| **#5 apps/web は D1 直アクセス禁止 / D1 は apps/api に閉じる** | diagnostics ログは apps/api 内 logger 経由のみ。apps/web から diagnostics を呼ぶ API を新設しない | GO |
| **#14 Cloudflare free-tier** | CI gate 1 つ追加（GitHub Actions 内）のみで Cloudflare 課金は発生しない。Workers ランタイム上では `logWarn` 呼び出しが追加されるのみで requests / D1 reads が増えない | GO |
| 本タスク固有 #1: 03a 本体実装の混入禁止 | adapter contract test は `vi.fn()` ベース fake adapter のみで実装。D1 / fetch を一切使わない。実装側の D1-backed adapter は scope out として明示済 | GO |
| 本タスク固有 #2: 決定論性 | regenerate スクリプトは `Date.now()` を使わず source spec の最終 commit ISO を採用。出力キー順序は固定。2 回連続実行 byte-identical を Phase 11 evidence で検証 | GO |
| 本タスク固有 #3: 構造化ログの redaction 不要性 | 出力対象は schema label / stableKey のみ。PII を含まないため redaction policy 不要。Phase 1 で確認済 | GO |

## 真の論点（深掘り）

### 論点A: manifest 再生成を完全自動化（CI で auto-commit）すべきか

判断: **しない**。

- 完全自動化すると spec PR が manifest 自動 commit を含み、レビュー fork が複雑化する。
- 代替: regenerate は **手動コマンド** とし、CI は **検証のみ**（hash drift があれば fail）。drift 発生時は開発者が手元で `pnpm regenerate:static-manifest` を実行して commit に含める。
- これにより、spec を更新した PR が必ず manifest 更新も含む形になり、レビュー単位が明確になる。

### 論点B: diagnostics の出力先 — 戻り値か / ログか / 両方か

判断: **両方**。

- 戻り値: 既存呼び出し側互換のため維持。
- ログ: 構造化ログでランタイム evidence 化。CI test では mock spy で確認、本番では Workers structured log として観測可能。
- 戻り値だけだと呼び出し側がログ化を忘れた場合に observability が失われる。ログだけだと test 時に値検証ができない。両立が最低コスト。

### 論点C: contract test を本タスクで先行配備する是非

判断: **配備する**。

- 03a 本体実装の前にインターフェース契約を固定しておくことで、03a 実装時に test を満たすだけで済む。
- contract test は fake adapter のみで成立するため、本タスクのスコープ内で完結する。
- 03a 完成後は同一テストで実装側 adapter を差し替えるだけで retirement に進める。

### 論点D: retirement 条件の記載先

判断: **`01-api-schema.md`**。

- manifest は schema 由来であり、schema 正本の一節として retirement 条件を持つのが自然。
- `08-free-database.md` は D1 構成正本だが、retirement 条件の主体は「D1 schema_questions が populate された時」であり、参照リンクのみで十分。

## 因果と境界

| 因 | 果 | 境界 |
| --- | --- | --- |
| `sourceSpecHash` 追加 | source spec drift を CI が即検出 | 検出のみ。自動 commit / 自動修正は行わない |
| 決定論的 regenerate | 同入力で同出力 → diff レビュー可能 | `generatedAt` を `Date.now()` にしない（固定タイムスタンプ） |
| `logWarn(UBM-MANIFEST-UNKNOWN-KEY)` | runtime で unknown 件数が観測可能 | apps/api 内に閉じる。apps/web からは触らない |
| adapter contract test | 03a 本体実装の interface 契約固定 | 本タスクは fake adapter のみ。D1-backed 実装は別タスク |
| retirement 条件 spec 反映 | 03a 完成後の削除タスク基準が文書化 | 削除実行は別タスク。本タスクで manifest を消さない |

## 価値とコスト

| 項目 | 価値 | コスト |
| --- | --- | --- |
| stale detection | spec ↔ manifest drift によるランタイム不具合を CI で先取り | scripts 2 本 + CI 1 step + manifest 2 フィールド追加 |
| 決定論的再生成 | 手動再生成のレビュアビリティ向上 | スクリプト保守（ただし source spec 構造変更時のみ） |
| diagnostics 構造化ログ | unknown stable key 件数が runtime evidence として残る | logger 呼び出し 1 行追加 + テスト 1 ケース |
| adapter contract test | 03a 本体実装の interface 固定で実装の手戻り削減 | test ファイル 1 本 + 4 ケース |
| retirement 条件正本反映 | 03a 完成時の削除タスクが mechanical に実行可能 | spec 1 節追記のみ |

総コストは CI gate 1 つ + scripts 2 本 + test 1 本 + spec 1 節で吸収可能。価値（stale 防止 + 03a 実装の手戻り削減 + retirement の operability）は明確に上回る。

## 4 条件評価

### 必要性

- 元 unassigned task の完了条件 5 項目を満たすには本設計が必要。
- 03a 完成時期が未確定な状況では、暫定 baseline の運用化（stale 検出 + 再生成 + 廃止条件）が無いと spec drift リスクが残る。

### 妥当性

- スクリプト配置（`scripts/`）は既存パターンに整合。
- schema 拡張（`sourceSpecHash` / `sourceSpecVersion`）は最小追加で stale 検出を成立させる。
- 構造化ログ統合は既存 `apps/api/src/lib/logger.ts` を再利用しており新規依存なし。

### 一貫性

- CLAUDE.md の「不変条件 #1（schema 固定しすぎない）」「#5（D1 / apps/api 境界）」「#14（free-tier）」と整合。
- 既存 lint scripts（`lint-stablekey-literal.mjs` など）と同等の運用パターン。
- branch 戦略 / pnpm workspace / mise exec ルールに整合。

### 完全性

- 元 unassigned task の完了条件 5 項目すべてに対応する設計が揃っている。
- adapter contract test は fake のみだが、03a 完成後に実装側を差し替える経路が retirement 条件として spec に明記される。
- CONST_007 の先送り表現は無い（03a 本体実装は scope out 明示で先送りではない）。

## 後続 Phase（4-13）が参照する設計確定事項

| # | 確定事項 | 参照 phase |
| --- | --- | --- |
| 1 | `verifyStaticManifest()` シグネチャと exit code 規約 | 4, 5, 6 |
| 2 | `regenerateStaticManifest()` 決定論性ルール（キー順 / 固定 timestamp / sha256） | 4, 5, 6 |
| 3 | manifest 追加フィールド `sourceSpecHash` / `sourceSpecVersion` のフォーマット | 5 |
| 4 | `buildSectionsWithDiagnostics()` への `logWarn` 呼び出し点（1 箇所） | 5, 11 |
| 5 | adapter contract test 4 ケース（success / failure / unknown transit / 未注入） | 4, 5, 7 |
| 6 | CI gate 配置: `.github/workflows/backend-ci.yml` の job step | 5, 9 |
| 7 | `package.json#scripts` 2 行追加 | 5 |
| 8 | retirement 条件記載先: `docs/00-getting-started-manual/specs/01-api-schema.md` 末尾節 | 12 |
| 9 | Phase 11 evidence 4 ファイル（verify / regenerate determinism / test / diagnostics sample log） | 11 |
| 10 | 不変条件 #1 / #5 / #14 への抵触なしの根拠 | 7, 9, 10 |

## レビュー結論

**GO**。Phase 1-2 設計は元 unassigned task の完了条件を網羅し、不変条件 #1 / #5 / #14 を侵さず、決定論性・観測性・契約固定の 3 軸で UT-02A baseline の hardening 責務を満たす。Phase 4 以降のテスト戦略・実装ランブックに進める。

## DoD

- [ ] 不変条件 3 件 + 本タスク固有不変条件 3 件すべてが GO
- [ ] 真の論点 4 件で判断と理由が明示されている
- [ ] 4 条件評価（必要性 / 妥当性 / 一貫性 / 完全性）すべてが充足
- [ ] 後続 Phase 参照表が 10 件以上で網羅されている
- [ ] CONST_007 の先送り表現なし

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] レビュー結論が GO で記載されている
- [ ] 後続 Phase 参照表が Phase 4 テスト戦略にそのまま渡せる粒度
- [ ] visualEvidence = NON_VISUAL の方針が再確認されている

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-01.md`
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-02.md`
- `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `generated/static-manifest.json`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `CLAUDE.md`
