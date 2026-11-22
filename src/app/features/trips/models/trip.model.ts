export type TripStatus = 'draft' | 'open' | 'closed' | string;

/**
 * 📄 Trip Year DTO matching enterprise backend schema
 */
export interface TripYearDto {
  id: string;
  name: string;
  year: number;
  status: TripStatus;
  note?: string;
  createdAt: string;
}

/**
 * 🏷️ Row type with flexible dynamic index signature:
 * `TripYearDto & Record<string, unknown>`
 */
export type TripYearRow = TripYearDto & Record<string, unknown>;

// Aliases for compatibility
export type Trip = TripYearDto;
export type TripRow = TripYearRow;

export interface CreateTripDto {
  name: string;
  year: number;
  status?: TripStatus;
  note?: string;
}

export interface StatusTransition {
  targetStatus: TripStatus;
  label: string;
  requiredPermission: string;
}

// Extensible Status Display Names in English
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed'
};

// Extensible Status Badge Classes
export const TRIP_STATUS_BADGES: Record<TripStatus, string> = {
  draft: 'status-badge badge-draft',
  open: 'status-badge badge-open',
  closed: 'status-badge badge-closed'
};

export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, StatusTransition[]> = {
  draft: [
    {
      targetStatus: 'open',
      label: 'Open Trip',
      requiredPermission: 'TRIP_STATUS_CHANGE'
    }
  ],
  open: [
    {
      targetStatus: 'closed',
      label: 'Close Trip',
      requiredPermission: 'TRIP_STATUS_CHANGE'
    }
  ],
  closed: [
    {
      targetStatus: 'open',
      label: 'Re-open Trip',
      requiredPermission: 'TRIP_STATUS_CHANGE'
    }
  ]
};
