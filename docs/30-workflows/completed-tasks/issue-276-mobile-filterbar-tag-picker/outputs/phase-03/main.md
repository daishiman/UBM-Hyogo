# Phase 3 Main

Architecture decision: keep tag candidates inside `GET /public/members` as additive `topTags`, avoiding a new endpoint. UI composition is `MemberFilters` plus `FiltersSummaryMobile`, `TagPicker`, and `SelectedTagsBar`.
