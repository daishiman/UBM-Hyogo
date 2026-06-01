# Lessons Learned — Issue #224 public members tags batch fetch

## L-I224-001: helper return shape は Phase 1 で verbatim 固定する

`listTagsByMemberIds` は `Map` ではなく `MemberTagWithDefinition[]` のフラット配列を返す。既存 helper を再利用する設計では、Phase 1 で実コード signature と return shape を表にし、Phase 2 以降の擬似コードをそれに合わせる。

## L-I224-002: expand は opt-in response 拡張として扱う

`expand=tags` は repeated query / comma separated の両方を受け、unknown は黙って除外する。`appliedQuery` は既存 6 キー固定を維持し、`expand` 未指定時は response item に `tags` key を出さない。

## L-I224-003: public tag response は再構成して fail-close する

repository row は `source` / `confidence` / `assigned_by` などを含むため、そのまま公開 response に流さない。use-case で `code` / `label` / `category` だけへ再構成し、`PublicMemberTagZ.strict()` で nested extra field を reject する。

## L-I224-004: batch response は SQL order を持たせる

batch helper の `member_id IN (...)` は D1/SQLite の実行計画に順序を委ねない。公開 API の tag 配列は `ORDER BY mt.member_id ASC, td.category ASC, td.label ASC, td.code ASC` で安定化し、contract / snapshot の flake を防ぐ。

## L-I224-005: IN 句の placeholder はメンバー数から動的生成し bind で渡す

`member_id IN (...)` の placeholder を固定数にすると可変メンバー数に対応できない。`memberIds.map(() => '?').join(',')` で placeholder を動的生成し `.bind(...memberIds)` で展開し、可変長に対応しつつ SQL injection を避ける。

## L-I224-006: 空配列時は batch query を発行しない

visibility filter 通過後の memberId が 0 件のとき、空 IN 句は SQL エラーや無駄な往復になる。`memberIds.length === 0` の早期 return（空 Map）で query 自体を発行せず、N=0 で I/O を起こさない。

## L-I224-007: expand whitelist は repeated / comma 両形式を受け unknown は黙殺する

`expand=tags&expand=x` や `expand=tags,foo` の混在、未知値の扱いが不定にならないよう、`EXPAND_WHITELIST` に対し repeated・comma-separated 両対応で正規化し、未知値は黙って除外して常に配列を返す。公開クエリの enum 受け口は whitelist filter + 常時配列で防御的に正規化する。

## L-I224-008: repository はフラット配列のまま返し groupBy は use-case 層に置く

repository に groupBy を持たせると再利用性が落ち、Map / 配列の責務が曖昧化する。helper はフラット配列を返すまま、use-case 層で `member_id` キーの Map を構築し、data 取得（repository）と整形（use-case）の責務を分離する。

## L-I224-009: contract test は appliedQuery の key 集合を固定して shape 回帰を防ぐ

`expand` を `appliedQuery` に混ぜると既存 response shape が変わり後方互換が崩れる。`appliedQuery` は既存 key 集合を固定（expand を含めない）し、`tags` は optional + `strict()` で nested extra field を検知する。拡張は opt-in field でのみ増やす。

## L-I224-010: zod schema と type 導出を同一サイクルで連動更新する

`PublicMemberTagZ` / `PublicMemberListItemZ` の新規 export と type 導出・`strict()` を別々に変えると drift する。shared zod・type・`strict()` を同一サイクル内で連動更新し、`viewmodel.spec.ts` で parse 整合を assert して片側 drift を作らない。
