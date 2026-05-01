# Drift Detection Log

## Probe

未登録 stable_key (`q_section1_company_name`) を `MetadataResolver` に渡し、`buildSections` で正しく `__unknown__` section へ隔離されることを観測する。

## Resolver signal

```ts
defaultMetadataResolver.resolveSectionKey("q_section1_company_name")
// => { ok: false, error: { kind: "unknownStableKey", stableKey: "q_section1_company_name" } }

defaultMetadataResolver.resolveFieldKind("q_section1_company_name")
// => { ok: false, error: { kind: "unknownStableKey", stableKey: "q_section1_company_name" } }

defaultMetadataResolver.resolveLabel("q_section1_company_name")
// => { ok: false, error: { kind: "unknownStableKey", stableKey: "q_section1_company_name" } }
```

## Repository capture point

`apps/api/src/repository/_shared/builder.ts` の `buildSections()` 内で `resolveSectionKey` が `ok=false` を返した行は `UNKNOWN_SECTION_KEY (= "__unknown__")` に振り分けられ、`label = ""` / `kind = "unknown"` で出力される。stable_key を label に流用する旧 fallback は除去済み。

## Test evidence

- `metadata.test.ts > returns Result.err with unknownStableKey for drift (AC-6)`
- `builder.test.ts > isolates unknown stable_keys into __unknown__ section (AC-6)`

両 testcase は 2026-05-01 実行で PASS（`builder-unit-test-result.txt` 参照）。

## Sample log line（運用想定）

drift を上位レイヤーで観測する際は `Result.err` の error.kind を info ログとして出力する想定:

```
[metadata-resolver] drift kind=unknownStableKey stableKey=q_section1_company_name caller=buildSections view=admin
```

実ログ出力の挿入は 03a alias queue 接続時 (`AliasQueueAdapter.dryRunAlias` 呼び出しフック内) で行う。本タスクでは Result 表現で観測可能性を担保するに留める。
