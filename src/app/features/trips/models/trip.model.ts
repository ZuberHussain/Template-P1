export type TripStatus = 'draft' | 'open' | 'closed' | string;

export interface Trip {
  id: string;
  name: string;
  year: number;
  status: TripStatus;
  note: string;
  createdAt: string;
}

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

/**
 * Enterprise Extensible Status Transition Rules:
 * - 'draft' can transition to 'open'
 * - 'open' can transition to 'closed'
 * - 'closed' can be re-opened back to 'open'
 * (Can easily add more statuses here based on future requirements)
 */
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
