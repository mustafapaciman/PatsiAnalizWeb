export interface Match {
  Date: string;
  Time: string;
  Div: string;
  HomeTeam: string;
  AwayTeam: string;
  FTHG: number;
  FTAG: number;
  HTHG: number;
  HTAG: number;
  B365CH: number;
  B365CD: number;
  B365CA: number;
  'B365C>2.5': number;
  'B365C<2.5': number;
}