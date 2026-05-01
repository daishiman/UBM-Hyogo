export interface AdminAuditFilters {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface AdminAuditListItem {
  readonly auditId: string;
  readonly actorEmail: string | null;
  readonly action: string;
  readonly targetType: string | null;
  readonly targetId: string | null;
  readonly maskedBefore?: unknown;
  readonly maskedAfter?: unknown;
  readonly beforeJson?: unknown;
  readonly afterJson?: unknown;
  readonly parseError?: boolean;
  readonly createdAt: string;
}

export interface AdminAuditListResponse {
  readonly items: AdminAuditListItem[];
  readonly nextCursor: string | null;
  readonly appliedFilters?: AdminAuditFilters;
}
