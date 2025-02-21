export interface Match {
  id?: string;
  Div: string;
  Date: string | number;
  Time: string;
  HomeTeam: string;
  AwayTeam: string;
  FTHG: number;
  FTAG: number;
  FTR: 'H' | 'A' | 'D';
  HTHG: number;
  HTAG: number;
  HTR: 'H' | 'A' | 'D';
  B365H?: number;
  B365D?: number;
  B365A?: number;
  B365CH?: number;
  B365CD?: number;
  B365CA?: number;
  'B365>2.5'?: number;
  'B365<2.5'?: number;
  'B365C>2.5'?: number;
  'B365C<2.5'?: number;
  RC?: number;
  Season?: string;
  isUEFA?: boolean;
  Cup?: 'CL' | 'EL' | 'ECL' | 'SC';
  Round?: string;
  [key: string]: any;
}

export interface OddsData {
  total: number;
  weight: number;
}