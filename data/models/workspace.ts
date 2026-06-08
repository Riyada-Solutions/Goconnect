/** A medical-center branch the nurse can be assigned to / switch between. */
export interface Branch {
  id: number
  branch_code: string
  name: string
  medical_center_name: string | null
  address: string | null
  phone: string | null
  email: string | null
}

/** A working "system" the nurse can operate under (e.g. "center" | "home"). */
export type WorkspaceSystem = string

/**
 * Options the user can pick from when switching workspace.
 * Returned by `GET /settings/workspace`.
 */
export interface Workspace {
  branches: Branch[]
  systems: WorkspaceSystem[]
}
