export interface CareTeamMember {
  id?: string | number
  name: string
  role: string
  phone?: string
  avatarUrl?: string | null
  isPrimary?: boolean
  /** True once the slot has been confirmed for this member via /confirm/{nurseId}. */
  confirmed?: boolean
}
