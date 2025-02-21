// Takım isimlerini normalize etmek için eşleştirme tablosu
const teamNameMappings = {
    // Süper Lig
    'Goztep': 'Göztepe',
    'Goztepe': 'Göztepe',
    'Ad. Demirspor': 'Adana Demirspor',
    'A. Demirspor': 'Adana Demirspor',
    'Buyuksehyr': 'Başakşehir',
    'Basaksehir': 'Başakşehir',
    'Istanbul Basaksehir': 'Başakşehir',
    'Ist Basaksehir': 'Başakşehir',
    'Kasimpasa': 'Kasımpaşa',
    'Kas.Pasa': 'Kasımpaşa',
    'Hatay': 'Hatayspor',
    'Samsun': 'Samsunspor',
    'Pendik': 'Pendikspor',
    'Ankaragucu': 'Ankaragücü',
    'MKE Ankaragucu': 'Ankaragücü',
    'Fenerbahce': 'Fenerbahçe',
    'FB': 'Fenerbahçe',
    'Galatasaray': 'Galatasaray',
    'GS': 'Galatasaray',
    'Besiktas': 'Beşiktaş',
    'BJK': 'Beşiktaş',
    'Trabzonspor': 'Trabzonspor',
    'TS': 'Trabzonspor',
    'Karagumruk': 'Fatih Karagümrük',
    'F. Karagumruk': 'Fatih Karagümrük',
    'Rizespor': 'Çaykur Rizespor',
    'C. Rizespor': 'Çaykur Rizespor',
    'Kayserispor': 'Kayserispor',
    'Kayseri': 'Kayserispor',
    'Alanyaspor': 'Alanyaspor',
    'Alanya': 'Alanyaspor',
    'Gaziantep': 'Gaziantep FK',
    'Gaz. FK': 'Gaziantep FK',
    'Sivasspor': 'Sivasspor',
    'Sivas': 'Sivasspor',
    'Antalyaspor': 'Antalyaspor',
    'Antalya': 'Antalyaspor',
    'Konyaspor': 'Konyaspor',
    'Konya': 'Konyaspor',
    'Istanbulspor': 'İstanbulspor',
    'Ist.Spor': 'İstanbulspor',
    'Giresunspor': 'Giresunspor',
    'Giresun': 'Giresunspor'
};
export function normalizeTeamName(name) {
    // Boşlukları temizle ve büyük/küçük harf duyarlılığını kaldır
    const normalizedInput = name.trim();
    // Eşleştirme tablosunda varsa düzeltilmiş ismi döndür
    return teamNameMappings[normalizedInput] || name;
}
// Birden fazla olası takım ismini kontrol et
export function findTeamName(name) {
    const normalizedInput = name.trim();
    // Tam eşleşme varsa döndür
    if (teamNameMappings[normalizedInput]) {
        return teamNameMappings[normalizedInput];
    }
    // Kısmi eşleşmeleri kontrol et
    const possibleMatches = Object.entries(teamNameMappings).filter(([key]) => key.toLowerCase().includes(normalizedInput.toLowerCase()) ||
        normalizedInput.toLowerCase().includes(key.toLowerCase()));
    if (possibleMatches.length > 0) {
        // En uzun eşleşmeyi seç (genellikle en doğru olan)
        return possibleMatches.sort(([a], [b]) => b.length - a.length)[0][1];
    }
    return name;
}
