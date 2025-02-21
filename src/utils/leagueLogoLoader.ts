import { LeagueMapping } from './types/league';

// DO NOT DELETE START - League Logo Mapping
export const getLeagueLogo = (leagueName: string): string => {
  const leagueLogoMap: { [key: string]: string } = {
    // Premier League
    'Premier League': 'https://tmssl.akamaized.net/images/logo/normal/gb1.png',
    'English Premier League': 'https://tmssl.akamaized.net/images/logo/normal/gb1.png',
    'GB1': 'https://tmssl.akamaized.net/images/logo/normal/gb1.png',

    // Türkiye Süper Lig
    'Super Lig': 'https://tmssl.akamaized.net/images/logo/normal/tr1.png',
    'Süper Lig': 'https://tmssl.akamaized.net/images/logo/normal/tr1.png',
    'Turkish Super Lig': 'https://tmssl.akamaized.net/images/logo/normal/tr1.png',
    'TR1': 'https://tmssl.akamaized.net/images/logo/normal/tr1.png',

    // La Liga
    'La Liga': 'https://tmssl.akamaized.net/images/logo/normal/es1.png',
    'LaLiga': 'https://tmssl.akamaized.net/images/logo/normal/es1.png',
    'Spanish La Liga': 'https://tmssl.akamaized.net/images/logo/normal/es1.png',
    'ES1': 'https://tmssl.akamaized.net/images/logo/normal/es1.png',

    // Bundesliga
    'Bundesliga': 'https://tmssl.akamaized.net/images/logo/normal/l1.png',
    'German Bundesliga': 'https://tmssl.akamaized.net/images/logo/normal/l1.png',
    'L1': 'https://tmssl.akamaized.net/images/logo/normal/l1.png',

    // Serie A
    'Serie A': 'https://tmssl.akamaized.net/images/logo/normal/it1.png',
    'Italian Serie A': 'https://tmssl.akamaized.net/images/logo/normal/it1.png',
    'IT1': 'https://tmssl.akamaized.net/images/logo/normal/it1.png',

    // Ligue 1
    'Ligue 1': 'https://tmssl.akamaized.net/images/logo/normal/fr1.png',
    'French Ligue 1': 'https://tmssl.akamaized.net/images/logo/normal/fr1.png',
    'FR1': 'https://tmssl.akamaized.net/images/logo/normal/fr1.png',

    // Liga Portugal
    'Liga Portugal': 'https://tmssl.akamaized.net/images/logo/normal/po1.png',
    'Liga Portugal Bwin': 'https://tmssl.akamaized.net/images/logo/normal/po1.png',
    'Primeira Liga': 'https://tmssl.akamaized.net/images/logo/normal/po1.png',
    'PO1': 'https://tmssl.akamaized.net/images/logo/normal/po1.png',

    // Eredivisie
    'Eredivisie': 'https://tmssl.akamaized.net/images/logo/normal/nl1.png',
    'Dutch Eredivisie': 'https://tmssl.akamaized.net/images/logo/normal/nl1.png',
    'NL1': 'https://tmssl.akamaized.net/images/logo/normal/nl1.png',

    // Jupiler Pro League
    'Jupiler Pro League': 'https://tmssl.akamaized.net/images/logo/normal/be1.png',
    'Belgian Pro League': 'https://tmssl.akamaized.net/images/logo/normal/be1.png',
    'BE1': 'https://tmssl.akamaized.net/images/logo/normal/be1.png',

    // Russian Premier Liga
    'Premier Liga': 'https://tmssl.akamaized.net/images/logo/normal/ru1.png',
    'Russian Premier Liga': 'https://tmssl.akamaized.net/images/logo/normal/ru1.png',
    'RU1': 'https://tmssl.akamaized.net/images/logo/normal/ru1.png',

    // Ukrainian Premier Liga
    'Ukrainian Premier Liga': 'https://tmssl.akamaized.net/images/logo/normal/ukr1.png',
    'UKR1': 'https://tmssl.akamaized.net/images/logo/normal/ukr1.png',

    // Scottish Premiership
    'Scottish Premiership': 'https://tmssl.akamaized.net/images/logo/normal/sc1.png',
    'SC1': 'https://tmssl.akamaized.net/images/logo/normal/sc1.png',

    // Danish Superliga
    'Superligaen': 'https://tmssl.akamaized.net/images/logo/normal/dk1.png',
    'Danish Superliga': 'https://tmssl.akamaized.net/images/logo/normal/dk1.png',
    'DK1': 'https://tmssl.akamaized.net/images/logo/normal/dk1.png',

    // Greek Super League
    'Super League 1': 'https://tmssl.akamaized.net/images/logo/normal/gr1.png',
    'Greek Super League': 'https://tmssl.akamaized.net/images/logo/normal/gr1.png',
    'GR1': 'https://tmssl.akamaized.net/images/logo/normal/gr1.png',

    // European Competitions
    'UEFA Champions League': 'https://tmssl.akamaized.net/images/logo/normal/cl.png',
    'Champions League': 'https://tmssl.akamaized.net/images/logo/normal/cl.png',
    'CL': 'https://tmssl.akamaized.net/images/logo/normal/cl.png',

    'UEFA Europa League': 'https://tmssl.akamaized.net/images/logo/normal/el.png',
    'Europa League': 'https://tmssl.akamaized.net/images/logo/normal/el.png',
    'EL': 'https://tmssl.akamaized.net/images/logo/normal/el.png',

    'UEFA Conference League': 'https://tmssl.akamaized.net/images/logo/normal/eclq.png',
    'Conference League': 'https://tmssl.akamaized.net/images/logo/normal/eclq.png',
    'UECL': 'https://tmssl.akamaized.net/images/logo/normal/eclq.png',

    'UEFA Super Cup': 'https://tmssl.akamaized.net/images/logo/normal/usc.png',
    'European Super Cup': 'https://tmssl.akamaized.net/images/logo/normal/usc.png',
    'USC': 'https://tmssl.akamaized.net/images/logo/normal/usc.png',

    // Domestic Cups
    'FA Cup': 'https://tmssl.akamaized.net/images/logo/normal/fac.png',
    'EFL Cup': 'https://tmssl.akamaized.net/images/logo/normal/cgb.png',
    'Copa del Rey': 'https://tmssl.akamaized.net/images/logo/normal/cdr.png',
    'DFB-Pokal': 'https://tmssl.akamaized.net/images/logo/normal/dfb.png',
    'Coppa Italia': 'https://tmssl.akamaized.net/images/logo/normal/cit.png',
    'Coupe de France': 'https://tmssl.akamaized.net/images/logo/normal/cdlf.png',
    'Taça de Portugal': 'https://tmssl.akamaized.net/images/logo/normal/pocp.png',
    'KNVB Beker': 'https://tmssl.akamaized.net/images/logo/normal/nlp.png',
    'Belgian Cup': 'https://tmssl.akamaized.net/images/logo/normal/bep.png',
    'Russian Cup': 'https://tmssl.akamaized.net/images/logo/normal/rup.png',
    'Ukrainian Cup': 'https://tmssl.akamaized.net/images/logo/normal/ukrp.png',
    'Scottish Cup': 'https://tmssl.akamaized.net/images/logo/normal/sfa.png',
    'Danish Cup': 'https://tmssl.akamaized.net/images/logo/normal/dkp.png',
    'Greek Cup': 'https://tmssl.akamaized.net/images/logo/normal/grp.png',

    // Super Cups
    'Community Shield': 'https://tmssl.akamaized.net/images/logo/normal/gbcs.png',
    'Supercopa de España': 'https://tmssl.akamaized.net/images/logo/normal/suc.png',
    'DFL-Supercup': 'https://tmssl.akamaized.net/images/logo/normal/dfl.png',
    'Supercoppa Italiana': 'https://tmssl.akamaized.net/images/logo/normal/sci.png',
    'Trophée des Champions': 'https://tmssl.akamaized.net/images/logo/normal/frch.png',
    'Supertaça': 'https://tmssl.akamaized.net/images/logo/normal/posu.png',
    'Johan Cruijff Schaal': 'https://tmssl.akamaized.net/images/logo/normal/nlsc.png',
    'Belgian Super Cup': 'https://tmssl.akamaized.net/images/logo/normal/besc.png',
    'Russian Super Cup': 'https://tmssl.akamaized.net/images/logo/normal/russ.png',
    'Ukrainian Super Cup': 'https://tmssl.akamaized.net/images/logo/normal/ukrs.png'
  };

  // Lig ismini normalize et
  const normalizedName = leagueName.replace(/\s+/g, '').toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');

  const matchingLeague = Object.keys(leagueLogoMap).find(league => 
    league.replace(/\s+/g, '').toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/û/g, 'u') === normalizedName
  );

  return matchingLeague ? leagueLogoMap[matchingLeague] : '';
};
// DO NOT DELETE END - League Logo Mapping 