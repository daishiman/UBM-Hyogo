# Phase 6: 異常系・エッジケース

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 6 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 異常系一覧

| ID | 種別 | シナリオ | 対応 |
| --- | --- | --- | --- |
| E-1 | JSON parse 失敗 | 不正 JSON ファイル | exit 1 + stderr に file path / parse error |
| E-2 | schema 必須欠落 | `taskId` 等が無い | exit 1 + stderr に `instancePath` |
| E-3 | enum 違反 | `kind` が enum 外 | exit 1 + stderr に enum 候補 |
| E-4 | path pattern 違反 | `path` が `outputs/phase-11/` で始まらない | exit 1 + stderr に pattern |
| E-5 | additionalProperties | 未定義キーが混入 | exit 1（strict: true） |
| E-6 | id 重複 | 同 JSON 内で同一 id 複数 | exit 1 + stderr に重複 id 列挙 |
| E-7 | path 不存在（実体） | `--check-existence` 時に file が無い | exit 2 + stderr に absolute path |
| E-8 | optional field 型違反 | `requiredForCloseout` が boolean 以外、または `notes` が string 以外 | exit 1 |
| E-9 | `--workflow` 引数欠落 | `--workflow` の後に directory が無い | exit 3 + usage |
| E-10 | unknown option | `--foo` のような未定義オプション | exit 3 + stderr |
| E-11 | workflowDir traversal | `docs/30-workflows/../x` | exit 1 |
| E-12 | 巨大 evidence 配列 | 1000+ entries | パフォーマンス劣化なし（< 1s）想定 |
| E-13 | symlink path | path が symlink で実体は存在 | exit 0（`fs.existsSync` で許容） |
| E-14 | 空 evidence 配列 | `evidence: []` | exit 1（schema `minItems: 1`） |
| E-15 | workflowDir pattern 違反 | `docs/40-...` 等 | exit 1（pattern `^docs/30-workflows/...`） |

## エッジケース対応方針

- **known failure boundary**: manifest schema では `knownFailure` を扱わない。既知 failure は evidence log と Phase 12 compliance の説明責務であり、`--check-existence` の不存在を warn に格下げしない。
- **workflowDir traversal**: schema pattern と validator の safe path check の両方で `..` を拒否する。
- **E-13（symlink）**: 既存運用で symlink 経由の path 配置は想定しないが、`fs.existsSync` のデフォルト挙動（symlink 解決）を許容し、明示テストはしない。
- **E-12（巨大配列）**: 通常運用では 5〜10 件程度を想定。パフォーマンス計測は不要。

## 競合・並行運用

| 項目 | 影響 | 対応 |
| --- | --- | --- |
| 同 PR で複数 workflow が schema 採用 | 衝突なし（別ファイル別 instance） | 通常マージ |
| schema バージョンアップ | 後方互換性が破れる場合は `$id` を変える | 当面は v1 のみ、必要時に v2 追加 |

## 完了条件

- [x] 異常系 E-1〜E-15 が列挙されている
- [x] エッジケース対応方針が記載されている
- [x] 各異常系が Phase 4 のテストケースで網羅されている（または網羅外と明記）

## 成果物

- `outputs/phase-06/main.md`

## 参照資料

- `phase-04.md`（テスト設計）
