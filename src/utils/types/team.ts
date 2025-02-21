// DO NOT DELETE START - Core Team Type Definitions
export interface Team {
  name: string;
  logoUrl: string;
  shortDisplayName?: string;
}

export interface TeamMapping {
  [key: string]: Team;
}
// DO NOT DELETE END - Core Team Type Definitions