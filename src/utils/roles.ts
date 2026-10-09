export type Role =
  | 'RANGER'
  | 'COMMUNITY_LIAISON_OFFICER'
  | 'PARK_MANAGER'
  | 'CONSERVATION_RESEARCHER'
  | 'VILLAGER';

export const ROLE_LABEL: Record<Role, string> = {
  RANGER: 'Park Ranger',
  COMMUNITY_LIAISON_OFFICER: 'Community Liaison Officer',
  PARK_MANAGER: 'Park Manager',
  CONSERVATION_RESEARCHER: 'Conservation Researcher',
  VILLAGER: 'Villager',
};

export const ROLE_SHORT: Record<Role, string> = {
  RANGER: 'Ranger',
  COMMUNITY_LIAISON_OFFICER: 'Liaison Officer',
  PARK_MANAGER: 'Park Manager',
  CONSERVATION_RESEARCHER: 'Researcher',
  VILLAGER: 'Villager',
};

/** People who work in the field and use the mobile tabs. */
export const MOBILE_ROLES: Role[] = ['RANGER', 'COMMUNITY_LIAISON_OFFICER', 'VILLAGER'];

/** People who plan and analyse from the dashboard. */
export const DASHBOARD_ROLES: Role[] = ['PARK_MANAGER', 'CONSERVATION_RESEARCHER'];

/** Everyone who works for the park. */
export const STAFF_ROLES: Role[] = ['RANGER', 'COMMUNITY_LIAISON_OFFICER', 'PARK_MANAGER', 'CONSERVATION_RESEARCHER'];

export const isDashboardRole = (role?: Role | null) => !!role && DASHBOARD_ROLES.includes(role);
export const isStaff = (role?: Role | null) => !!role && STAFF_ROLES.includes(role);

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  profilePicture?: { url: string | null } | null;
}

export const fullName = (u?: { firstName: string; lastName: string } | null) =>
  u ? `${u.firstName} ${u.lastName}`.trim() : '';
