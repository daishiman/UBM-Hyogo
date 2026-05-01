# Implementation Guide

## Part 1: 中学生レベル

なぜこれをやるのか。学校の名簿で「出席番号」だけを書いた紙を渡されても、それが誰か分かりません。だから、出席番号と名前と学年を結びつけた「正本台帳」を 1 冊だけ用意します。名簿を見せる人が先生向け、本人向け、掲示板向けの 3 種類に分かれていても、全員が同じ台帳を見れば、同じ人を別の名前で呼んだり、別のクラスに入れたりしません。

このタスクでやることも同じです。フォームの項目には `stableKey` という番号のようなものがあります。今のままだと、番号から名前や種類をその場の勘で決めてしまう場所があります。これをやめて、正本台帳を引く係の人を 1 人置きます。その係の人が「この番号はどの章に入るか」「これは文章を書く欄か、選ぶ欄か、同意ボタンか」「画面に出す名前は何か」を決めます。

### 専門用語セルフチェック

| 専門用語 | 中学生レベルの言い換え |
| --- | --- |
| canonical schema | 正本となる答え合わせの台帳 |
| resolver | 台帳を引く係の人 |
| stableKey | フォーム項目につけた出席番号のような ID |
| field_kind | 項目の種類タグ |
| section_key | 項目が所属する章のラベル |
| drift | 台帳と実物がズレた状態 |
| fallback | 台帳なしの間に合わせ判定 |

## Part 2: 技術者レベル

### Interface

```ts
type ResolveError =
  | { kind: "unknownStableKey"; stableKey: string }
  | { kind: "aliasFailed"; stableKey: string; reason: string }
  | { kind: "manifestStale"; source: string };

interface MetadataResolver {
  resolveSectionKey(stableKey: string, context?: ResolveContext): Result<SectionKey, ResolveError>;
  resolveFieldKind(stableKey: string, context?: ResolveContext): Result<FieldKind, ResolveError>;
  resolveLabel(stableKey: string, context?: ResolveContext): Result<string, ResolveError>;
}
```

### Usage

`builder.ts` may read row `stable_key` and pass it to `MetadataResolver`. AC-2 bans old guessing branches, not resolver input.

```ts
const sectionKey = resolver.resolveSectionKey(row.stable_key, context);
const fieldKind = resolver.resolveFieldKind(row.stable_key, context);
const label = resolver.resolveLabel(row.stable_key, context);
```

For repository-level drift evidence, use `buildSectionsWithDiagnostics()`. The legacy-compatible `buildSections()` wrapper still returns only sections, while the diagnostics variant exposes `unknownStableKeys` and resolver errors for Phase 11 / CI evidence.

### Generated Baseline

While 03a is incomplete, use `apps/api/src/repository/_shared/generated/static-manifest.json` as generated baseline. It includes source spec, generation time, manual regeneration note, and retirement condition after 03a alias queue readiness. Deterministic regeneration and stale detection are tracked by `docs/30-workflows/unassigned-task/task-ut02a-canonical-metadata-diagnostics-hardening-001.md`.

### Contracts Handed Off

| Task | Contract |
| --- | --- |
| 03a | Alias queue adapter hook and generated manifest retirement condition |
| 04a | Public view consumes canonical `section_key`, `field_kind`, and label |
| 04b | Member view consumes the same canonical output while preserving read-only boundary |

### Errors And Edge Cases

- Unknown stableKey returns `Result.err({ kind: "unknownStableKey" })`.
- Alias adapter failure returns `aliasFailed`; it must not silently relabel a field.
- Manifest freshness failure returns `manifestStale`.
- D1 migration is conditional and must use `bash scripts/cf.sh`.
