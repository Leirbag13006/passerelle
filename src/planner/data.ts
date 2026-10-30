// Réseau de démonstration — Région Sud (Provence-Alpes-Côte d'Azur).
// Lignes, arrêts et coordonnées inspirés du réseau réel ; horaires, fréquences et
// informations d'accessibilité sont SIMULÉS pour la démo (aucune donnée temps réel).

export type Mode = 'metro' | 'tram' | 'bus' | 'navette' | 'ter' | 'grandes-lignes'

export type Stop = {
  id: string
  name: string
  city: string
  lat: number
  lon: number
  /** accès sans marche de la rue au quai */
  stepFree: boolean
  /** état (simulé) de l'ascenseur qui rend l'arrêt accessible */
  elevator?: 'ok' | 'panne'
  /** assistance en gare (Accès Plus) disponible */
  assistance?: boolean
  note?: string
}

export type Line = {
  id: string
  mode: Mode
  /** nom court affiché dans la pastille (jamais une couleur seule) */
  name: string
  long: string
  stops: string[]
  /** minutes entre deux passages */
  headway: number
  /** vitesse commerciale (km/h) et arrêt à chaque station (min) */
  speed: number
  dwell: number
  /** ligne souvent bondée aux heures de pointe */
  busy?: boolean
  bikes: 'oui' | 'reservation' | 'non'
  vehicle: string
}

export type Place = { id: string; name: string; city: string; lat: number; lon: number }

/** liaisons à pied particulières (correspondances internes, pentes, escaliers) */
export type Link = { a: string; b: string; minutes: number; steps?: boolean; slope?: boolean; note: string }

const S = (id: string, name: string, city: string, lat: number, lon: number, o: Partial<Stop> = {}): Stop => ({ id, name, city, lat, lon, stepFree: true, ...o })

export const stops: Stop[] = [
  // --- Marseille, métro M1 ---
  S('m-la-rose', 'La Rose', 'Marseille', 43.3361, 5.4269, { elevator: 'ok' }),
  S('m-frais-vallon', 'Frais Vallon', 'Marseille', 43.3268, 5.417, { elevator: 'ok' }),
  S('m-malpasse', 'Malpassé', 'Marseille', 43.3284, 5.4055, { elevator: 'ok' }),
  S('m-saint-just', 'Saint-Just', 'Marseille', 43.3176, 5.4045, { elevator: 'ok' }),
  S('m-chartreux', 'Chartreux', 'Marseille', 43.3112, 5.4012, { elevator: 'ok' }),
  S('m-cinq-avenues', 'Cinq-Avenues-Longchamp', 'Marseille', 43.3056, 5.3965, { elevator: 'ok' }),
  S('m-reformes', 'Réformés-Canebière', 'Marseille', 43.2998, 5.3858, { elevator: 'ok' }),
  S('m-saint-charles', 'Saint-Charles (métro)', 'Marseille', 43.3027, 5.3806, { elevator: 'ok' }),
  S('m-colbert', 'Colbert', 'Marseille', 43.2985, 5.3778, { stepFree: false, note: 'Accès par escaliers et escalators uniquement' }),
  S('m-vieux-port', 'Vieux-Port (métro)', 'Marseille', 43.2952, 5.376, { elevator: 'panne', note: 'Ascenseur en panne, remise en service prévue à 18 h' }),
  S('m-estrangin', 'Estrangin-Préfecture', 'Marseille', 43.2899, 5.3792, { elevator: 'ok' }),
  S('m-castellane', 'Castellane (métro)', 'Marseille', 43.2858, 5.3836, { elevator: 'ok' }),
  S('m-baille', 'Baille', 'Marseille', 43.2873, 5.392, { elevator: 'ok' }),
  S('m-timone', 'La Timone', 'Marseille', 43.288, 5.401, { elevator: 'ok' }),
  S('m-blancarde', 'La Blancarde (métro)', 'Marseille', 43.296, 5.406, { elevator: 'ok' }),
  S('m-louis-armand', 'Louis Armand', 'Marseille', 43.2985, 5.4135, { elevator: 'ok' }),
  S('m-saint-barnabe', 'Saint-Barnabé', 'Marseille', 43.302, 5.418, { elevator: 'ok' }),
  S('m-fourragere', 'La Fourragère', 'Marseille', 43.306, 5.427, { elevator: 'ok' }),
  // --- métro M2 ---
  S('m-bougainville', 'Bougainville', 'Marseille', 43.3247, 5.3626, { elevator: 'ok' }),
  S('m-national', 'National', 'Marseille', 43.3175, 5.367, { elevator: 'ok' }),
  S('m-desiree-clary', 'Désirée Clary', 'Marseille', 43.3133, 5.3665, { elevator: 'ok' }),
  S('m-joliette', 'Joliette (métro)', 'Marseille', 43.3049, 5.3663, { elevator: 'ok' }),
  S('m-jules-guesde', 'Jules Guesde', 'Marseille', 43.303, 5.3745, { elevator: 'ok' }),
  S('m-noailles', 'Noailles (métro)', 'Marseille', 43.2966, 5.383, { elevator: 'ok' }),
  S('m-ndm', 'Notre-Dame-du-Mont', 'Marseille', 43.2918, 5.385, { stepFree: false, note: 'Pas d’ascenseur : escaliers uniquement' }),
  S('m-perier', 'Périer', 'Marseille', 43.2797, 5.386, { elevator: 'ok' }),
  S('m-prado', 'Rond-Point du Prado (métro)', 'Marseille', 43.2712, 5.3922, { elevator: 'ok' }),
  S('m-dromel', 'Sainte-Marguerite Dromel', 'Marseille', 43.262, 5.4, { elevator: 'ok' }),
  // --- tram (plancher bas, quais de plain-pied) ---
  S('t-arenc', 'Arenc Le Silo', 'Marseille', 43.3127, 5.366),
  S('t-joliette', 'Joliette (tram)', 'Marseille', 43.3045, 5.3672),
  S('t-republique', 'République Dames', 'Marseille', 43.301, 5.3712),
  S('t-sadi-carnot', 'Sadi Carnot', 'Marseille', 43.299, 5.37),
  S('t-belsunce', 'Belsunce Alcazar', 'Marseille', 43.2995, 5.378),
  S('t-garibaldi', 'Canebière Garibaldi', 'Marseille', 43.2972, 5.382),
  S('t-capucins', 'Canebière Capucins', 'Marseille', 43.2975, 5.381),
  S('t-noailles', 'Noailles (tram)', 'Marseille', 43.2968, 5.384),
  S('t-eugene-pierre', 'Eugène Pierre', 'Marseille', 43.297, 5.395),
  S('t-cinq-avenues', 'Cinq Avenues (tram)', 'Marseille', 43.3045, 5.399),
  S('t-blancarde', 'La Blancarde (tram)', 'Marseille', 43.2955, 5.4065),
  S('t-rome', 'Rome Davso', 'Marseille', 43.292, 5.381),
  S('t-castellane', 'Castellane (tram)', 'Marseille', 43.2862, 5.383),
  // --- bus (plancher bas, palette rétractable) ---
  S('b-vieux-port', 'Vieux-Port (bus)', 'Marseille', 43.2945, 5.3738),
  S('b-mucem', 'Mucem – Fort Saint-Jean', 'Marseille', 43.2963, 5.3627),
  S('b-catalans', 'Catalans', 'Marseille', 43.2905, 5.36),
  S('b-vallon-auffes', 'Vallon des Auffes', 'Marseille', 43.2855, 5.35),
  S('b-david', 'David – Plages', 'Marseille', 43.2655, 5.373),
  S('b-prado', 'Rond-Point du Prado (bus)', 'Marseille', 43.2715, 5.3918),
  S('b-ndg', 'Notre-Dame de la Garde', 'Marseille', 43.2843, 5.3713, { note: 'Arrêt au sommet, parvis accessible par ascenseur' }),
  S('b-gare-routiere', 'Gare routière Saint-Charles', 'Marseille', 43.3035, 5.3812),
  S('b-aeroport', 'Aéroport Marseille Provence', 'Marignane', 43.4393, 5.2214),
  // --- gares (Accès Plus = assistance) ---
  S('g-marseille', 'Marseille Saint-Charles', 'Marseille', 43.3027, 5.3806, { assistance: true, elevator: 'ok' }),
  S('g-blancarde', 'Marseille Blancarde', 'Marseille', 43.295, 5.406, { elevator: 'ok' }),
  S('g-estaque', 'L’Estaque', 'Marseille', 43.363, 5.323, { stepFree: false, note: 'Passage souterrain avec escaliers' }),
  S('g-vitrolles', 'Vitrolles Aéroport Marseille Provence', 'Vitrolles', 43.417, 5.214, { elevator: 'ok' }),
  S('g-rognac', 'Rognac', 'Rognac', 43.488, 5.226, { stepFree: false, note: 'Changement de quai par escaliers' }),
  S('g-miramas', 'Miramas', 'Miramas', 43.5818, 5.001, { elevator: 'ok', assistance: true }),
  S('g-arles', 'Arles', 'Arles', 43.685, 4.631, { elevator: 'ok', assistance: true }),
  S('g-tarascon', 'Tarascon', 'Tarascon', 43.805, 4.661, { stepFree: false, note: 'Passage souterrain avec escaliers' }),
  S('g-avignon', 'Avignon Centre', 'Avignon', 43.9417, 4.8055, { elevator: 'ok', assistance: true }),
  S('g-avignon-tgv', 'Avignon TGV', 'Avignon', 43.922, 4.786, { elevator: 'ok', assistance: true }),
  S('g-aix-tgv', 'Aix-en-Provence TGV', 'Aix-en-Provence', 43.4553, 5.3172, { elevator: 'ok', assistance: true }),
  S('g-septemes', 'Septèmes', 'Septèmes-les-Vallons', 43.399, 5.362, { stepFree: false, note: 'Quai accessible par escaliers' }),
  S('g-simiane', 'Simiane', 'Simiane-Collongue', 43.426, 5.424, { stepFree: false, note: 'Quai accessible par escaliers' }),
  S('g-gardanne', 'Gardanne', 'Gardanne', 43.456, 5.469, { elevator: 'ok' }),
  S('g-aix', 'Aix-en-Provence (centre)', 'Aix-en-Provence', 43.523, 5.445, { elevator: 'ok', assistance: true }),
  S('g-la-penne', 'La Penne-sur-Huveaune', 'La Penne-sur-Huveaune', 43.281, 5.516, { stepFree: false, note: 'Passerelle avec escaliers' }),
  S('g-aubagne', 'Aubagne', 'Aubagne', 43.293, 5.565, { elevator: 'ok', assistance: true }),
  S('g-cassis', 'Cassis', 'Cassis', 43.229, 5.55, { stepFree: false, note: 'Souterrain avec escaliers. Gare à 3 km du port, sur les hauteurs' }),
  S('g-la-ciotat', 'La Ciotat', 'La Ciotat', 43.199, 5.606, { elevator: 'ok' }),
  S('g-saint-cyr', 'Saint-Cyr – Les Lecques', 'Saint-Cyr-sur-Mer', 43.183, 5.704, { stepFree: false, note: 'Quai accessible par escaliers' }),
  S('g-bandol', 'Bandol', 'Bandol', 43.138, 5.754, { elevator: 'ok' }),
  S('g-ollioules', 'Ollioules – Sanary', 'Ollioules', 43.131, 5.841, { elevator: 'ok' }),
  S('g-la-seyne', 'La Seyne – Six-Fours', 'La Seyne-sur-Mer', 43.108, 5.868, { elevator: 'ok' }),
  S('g-toulon', 'Toulon', 'Toulon', 43.128, 5.93, { elevator: 'ok', assistance: true }),
  S('g-les-arcs', 'Les Arcs – Draguignan', 'Les Arcs', 43.456, 6.479, { elevator: 'ok', assistance: true }),
  S('g-saint-raphael', 'Saint-Raphaël – Valescure', 'Saint-Raphaël', 43.423, 6.768, { elevator: 'ok', assistance: true }),
  S('g-cannes', 'Cannes', 'Cannes', 43.553, 7.019, { elevator: 'ok', assistance: true }),
  S('g-antibes', 'Antibes', 'Antibes', 43.586, 7.12, { elevator: 'ok', assistance: true }),
  S('g-nice', 'Nice Ville', 'Nice', 43.7046, 7.2618, { elevator: 'ok', assistance: true }),
  // --- navettes ---
  S('n-aix-tgv', 'Aix TGV (navette)', 'Aix-en-Provence', 43.4556, 5.3178),
  S('n-aix-gare-routiere', 'Aix gare routière', 'Aix-en-Provence', 43.524, 5.442),
  S('n-cassis-gare', 'Cassis gare (navette)', 'Cassis', 43.2292, 5.5503),
  S('n-cassis-centre', 'Cassis centre', 'Cassis', 43.2148, 5.5375),
  // --- Nice, tram T1 ---
  S('t-gare-thiers', 'Gare Thiers', 'Nice', 43.7045, 7.265),
  S('t-jean-medecin', 'Jean Médecin', 'Nice', 43.701, 7.268),
  S('t-massena', 'Masséna', 'Nice', 43.6975, 7.271),
  S('t-opera', 'Opéra – Vieille Ville', 'Nice', 43.696, 7.275),
  // --- Toulon, bus ---
  S('b-toulon-gare', 'Toulon gare (bus)', 'Toulon', 43.1265, 5.93),
  S('b-toulon-liberte', 'Place de la Liberté', 'Toulon', 43.125, 5.9335),
  S('b-mourillon', 'Le Mourillon – Plages', 'Toulon', 43.108, 5.94),
]

const L = (o: Line) => o

export const lines: Line[] = [
  L({ id: 'M1', mode: 'metro', name: 'M1', long: 'Métro M1', headway: 5, speed: 32, dwell: 0.5, busy: true, bikes: 'non', vehicle: 'Rames accessibles, annonces sonores et visuelles',
    stops: ['m-la-rose', 'm-frais-vallon', 'm-malpasse', 'm-saint-just', 'm-chartreux', 'm-cinq-avenues', 'm-reformes', 'm-saint-charles', 'm-colbert', 'm-vieux-port', 'm-estrangin', 'm-castellane', 'm-baille', 'm-timone', 'm-blancarde', 'm-louis-armand', 'm-saint-barnabe', 'm-fourragere'] }),
  L({ id: 'M2', mode: 'metro', name: 'M2', long: 'Métro M2', headway: 5, speed: 32, dwell: 0.5, busy: true, bikes: 'non', vehicle: 'Rames accessibles, annonces sonores et visuelles',
    stops: ['m-bougainville', 'm-national', 'm-desiree-clary', 'm-joliette', 'm-jules-guesde', 'm-saint-charles', 'm-noailles', 'm-ndm', 'm-castellane', 'm-perier', 'm-prado', 'm-dromel'] }),
  L({ id: 'T2', mode: 'tram', name: 'T2', long: 'Tram T2', headway: 8, speed: 17, dwell: 0.4, busy: true, bikes: 'non', vehicle: 'Plancher bas intégral, places réservées',
    stops: ['t-arenc', 't-joliette', 't-republique', 't-belsunce', 't-garibaldi', 't-noailles', 't-eugene-pierre', 't-cinq-avenues', 't-blancarde'] }),
  L({ id: 'T3', mode: 'tram', name: 'T3', long: 'Tram T3', headway: 8, speed: 17, dwell: 0.4, bikes: 'non', vehicle: 'Plancher bas intégral, places réservées',
    stops: ['t-arenc', 't-joliette', 't-sadi-carnot', 't-belsunce', 't-capucins', 't-rome', 't-castellane'] }),
  L({ id: 'B60', mode: 'bus', name: '60', long: 'Bus 60', headway: 20, speed: 11, dwell: 0.5, bikes: 'non', vehicle: 'Bus à plancher bas avec palette',
    stops: ['b-vieux-port', 'b-ndg'] }),
  L({ id: 'B82', mode: 'bus', name: '82', long: 'Bus 82', headway: 15, speed: 13, dwell: 0.5, bikes: 'non', vehicle: 'Bus à plancher bas avec palette',
    stops: ['b-vieux-port', 'b-mucem', 't-joliette'] }),
  L({ id: 'B83', mode: 'bus', name: '83', long: 'Bus 83 – Corniche', headway: 15, speed: 16, dwell: 0.5, bikes: 'non', vehicle: 'Bus à plancher bas avec palette',
    stops: ['b-vieux-port', 'b-catalans', 'b-vallon-auffes', 'b-david', 'b-prado'] }),
  L({ id: 'B91', mode: 'navette', name: 'Navette', long: 'Navette Aéroport (ligne 91)', headway: 20, speed: 45, dwell: 0, bikes: 'non', vehicle: 'Car accessible avec élévateur, soute à bagages',
    stops: ['b-gare-routiere', 'b-aeroport'] }),
  L({ id: 'TER-TLN', mode: 'ter', name: 'TER', long: 'TER Marseille – Toulon', headway: 30, speed: 78, dwell: 1, busy: true, bikes: 'oui', vehicle: 'Train Regio 2N : plancher bas, espace fauteuil, rampe sur demande',
    stops: ['g-marseille', 'g-blancarde', 'g-la-penne', 'g-aubagne', 'g-cassis', 'g-la-ciotat', 'g-saint-cyr', 'g-bandol', 'g-ollioules', 'g-la-seyne', 'g-toulon'] }),
  L({ id: 'TER-AIX', mode: 'ter', name: 'TER', long: 'TER Marseille – Aix-en-Provence', headway: 30, speed: 62, dwell: 1, busy: true, bikes: 'oui', vehicle: 'Train Regio 2N : plancher bas, espace fauteuil, rampe sur demande',
    stops: ['g-marseille', 'g-septemes', 'g-simiane', 'g-gardanne', 'g-aix'] }),
  L({ id: 'TER-AVI', mode: 'ter', name: 'TER', long: 'TER Marseille – Avignon (par Arles)', headway: 60, speed: 82, dwell: 1.5, bikes: 'oui', vehicle: 'Train Régiolis : espace fauteuil, rampe sur demande',
    stops: ['g-marseille', 'g-estaque', 'g-vitrolles', 'g-rognac', 'g-miramas', 'g-arles', 'g-tarascon', 'g-avignon'] }),
  L({ id: 'TGV-AVI', mode: 'grandes-lignes', name: 'TGV', long: 'TGV INOUI Marseille – Avignon TGV', headway: 60, speed: 165, dwell: 2, bikes: 'reservation', vehicle: 'TGV : place PMR à réserver, rampe avec l’assistance',
    stops: ['g-marseille', 'g-aix-tgv', 'g-avignon-tgv'] }),
  L({ id: 'IC-NICE', mode: 'grandes-lignes', name: 'Intercités', long: 'Train Marseille – Nice (côte)', headway: 120, speed: 92, dwell: 2, bikes: 'reservation', vehicle: 'Place PMR à réserver, rampe avec l’assistance',
    stops: ['g-marseille', 'g-toulon', 'g-les-arcs', 'g-saint-raphael', 'g-cannes', 'g-antibes', 'g-nice'] }),
  L({ id: 'N-AIX', mode: 'navette', name: 'Navette', long: 'Navette Aix TGV – Aix centre (ligne 40)', headway: 15, speed: 45, dwell: 0, bikes: 'non', vehicle: 'Car accessible avec élévateur',
    stops: ['n-aix-tgv', 'n-aix-gare-routiere'] }),
  L({ id: 'N-AVI', mode: 'navette', name: 'Navette', long: 'Navette ferroviaire Avignon TGV – Centre', headway: 30, speed: 40, dwell: 0, bikes: 'oui', vehicle: 'Train accessible de plain-pied',
    stops: ['g-avignon-tgv', 'g-avignon'] }),
  L({ id: 'N-CASSIS', mode: 'navette', name: 'Navette', long: 'Navette Cassis gare – centre', headway: 30, speed: 25, dwell: 0, bikes: 'non', vehicle: 'Minibus à plancher bas',
    stops: ['n-cassis-gare', 'n-cassis-centre'] }),
  L({ id: 'NICE-T1', mode: 'tram', name: 'T1', long: 'Tram T1 (Nice)', headway: 6, speed: 16, dwell: 0.4, busy: true, bikes: 'non', vehicle: 'Plancher bas intégral',
    stops: ['t-gare-thiers', 't-jean-medecin', 't-massena', 't-opera'] }),
  L({ id: 'TLN-3', mode: 'bus', name: '3', long: 'Bus 3 (Toulon)', headway: 15, speed: 14, dwell: 0.5, bikes: 'non', vehicle: 'Bus à plancher bas avec palette',
    stops: ['b-toulon-gare', 'b-toulon-liberte', 'b-mourillon'] }),
]

// Correspondances internes et cheminements particuliers
export const links: Link[] = [
  { a: 'm-saint-charles', b: 'g-marseille', minutes: 6, note: 'Correspondance métro – gare par les ascenseurs du hall' },
  { a: 'b-gare-routiere', b: 'g-marseille', minutes: 4, note: 'Gare routière attenante au hall' },
  { a: 'm-blancarde', b: 'g-blancarde', minutes: 3, note: 'Pôle d’échanges de la Blancarde' },
  { a: 't-blancarde', b: 'g-blancarde', minutes: 2, note: 'Pôle d’échanges de la Blancarde' },
  { a: 'g-aix-tgv', b: 'n-aix-tgv', minutes: 4, note: 'Navettes au pied de la gare' },
  { a: 'g-aix', b: 'n-aix-gare-routiere', minutes: 4, note: 'Gare routière en face de la gare' },
  { a: 'g-cassis', b: 'n-cassis-gare', minutes: 2, note: 'Arrêt devant la gare' },
  { a: 'g-cassis', b: 'n-cassis-centre', minutes: 38, slope: true, note: '3 km de descente raide, sans trottoir par endroits' },
  { a: 'g-nice', b: 't-gare-thiers', minutes: 4, note: 'Sortie avenue Thiers, trottoirs abaissés' },
  { a: 'g-toulon', b: 'b-toulon-gare', minutes: 2, note: 'Arrêt sur le parvis' },
  { a: 'g-vitrolles', b: 'b-aeroport', minutes: 7, note: 'Navette gratuite gare – aérogare (accessible)' },
  { a: 'b-ndg', b: 'b-vieux-port', minutes: 32, steps: true, slope: true, note: 'Montée très raide avec de nombreux escaliers' },
]

export const places: Place[] = [
  { id: 'saint-charles', name: 'Gare Saint-Charles', city: 'Marseille', lat: 43.3027, lon: 5.3806 },
  { id: 'vieux-port', name: 'Vieux-Port', city: 'Marseille', lat: 43.2951, lon: 5.3745 },
  { id: 'mucem', name: 'Mucem', city: 'Marseille', lat: 43.2967, lon: 5.3612 },
  { id: 'ndg', name: 'Notre-Dame de la Garde', city: 'Marseille', lat: 43.2841, lon: 5.3711 },
  { id: 'timone', name: 'Hôpital de la Timone', city: 'Marseille', lat: 43.2895, lon: 5.4025 },
  { id: 'velodrome', name: 'Stade Vélodrome', city: 'Marseille', lat: 43.2698, lon: 5.3959 },
  { id: 'joliette', name: 'Les Docks – Joliette', city: 'Marseille', lat: 43.3055, lon: 5.367 },
  { id: 'castellane', name: 'Place Castellane', city: 'Marseille', lat: 43.2858, lon: 5.3836 },
  { id: 'plages', name: 'Plages du Prado', city: 'Marseille', lat: 43.2648, lon: 5.3735 },
  { id: 'aeroport', name: 'Aéroport Marseille Provence', city: 'Marignane', lat: 43.4393, lon: 5.2214 },
  { id: 'aix-mirabeau', name: 'Cours Mirabeau', city: 'Aix-en-Provence', lat: 43.5265, lon: 5.447 },
  { id: 'aubagne', name: 'Centre d’Aubagne', city: 'Aubagne', lat: 43.2925, lon: 5.5685 },
  { id: 'cassis-port', name: 'Port de Cassis', city: 'Cassis', lat: 43.2145, lon: 5.538 },
  { id: 'la-ciotat', name: 'La Ciotat', city: 'La Ciotat', lat: 43.1995, lon: 5.6065 },
  { id: 'bandol', name: 'Bandol', city: 'Bandol', lat: 43.1375, lon: 5.7545 },
  { id: 'toulon-mourillon', name: 'Plages du Mourillon', city: 'Toulon', lat: 43.1075, lon: 5.9405 },
  { id: 'toulon-centre', name: 'Centre de Toulon', city: 'Toulon', lat: 43.1245, lon: 5.934 },
  { id: 'arles-arenes', name: 'Arènes d’Arles', city: 'Arles', lat: 43.6777, lon: 4.6309 },
  { id: 'avignon-papes', name: 'Palais des Papes', city: 'Avignon', lat: 43.9508, lon: 4.8075 },
  { id: 'cannes', name: 'La Croisette', city: 'Cannes', lat: 43.551, lon: 7.022 },
  { id: 'antibes', name: 'Vieil Antibes', city: 'Antibes', lat: 43.5815, lon: 7.1255 },
  { id: 'nice-promenade', name: 'Promenade des Anglais', city: 'Nice', lat: 43.6953, lon: 7.2683 },
  { id: 'nice-vieille-ville', name: 'Vieux Nice', city: 'Nice', lat: 43.6965, lon: 7.276 },
]

// Infos trafic simulées, affichées sur la page et prises en compte par le calcul
export const disruptions = [
  { id: 'asc-vieux-port', text: 'Métro Vieux-Port : ascenseur en panne jusqu’à 18 h. Les trajets sans marches l’évitent.' },
  { id: 'ndm', text: 'Métro Notre-Dame-du-Mont : station sans ascenseur.' },
  { id: 'cassis', text: 'Gare de Cassis : accès par escaliers, et à 3 km du port. Navette conseillée.' },
]

export const stopById = new Map(stops.map((s) => [s.id, s]))
export const lineById = new Map(lines.map((l) => [l.id, l]))
export const placeById = new Map(places.map((p) => [p.id, p]))
