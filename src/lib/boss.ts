import crypto from 'crypto';

/**
 * Boss Types: 14 mitologici creatures con loro caratteristiche
 * - key: identificatore univoco
 * - name: nome visualizzato
 * - rarity: 1-5 stelle (rarità/difficoltà)
 * - hp: punti vita fissi
 * - weight: probabilità relativa di spawn
 */
export const BOSS_TYPES = [
  // 5⭐ - Rarissimi (draghi e bestie primordiali)
  { key: 'drago_bianco', name: 'White Dragon', rarity: 5, hp: 2200, weight: 1 },
  { key: 'drago_nero', name: 'Black Dragon', rarity: 5, hp: 2150, weight: 1 },
  { key: 'drago_rosso', name: 'Red Dragon', rarity: 5, hp: 2000, weight: 1 },
  { key: 'drago_verde', name: 'Green Dragon', rarity: 5, hp: 1900, weight: 2 },
  { key: 'drago_comune', name: 'Common Dragon', rarity: 5, hp: 1700, weight: 2 },
  { key: 'kraken', name: 'Kraken', rarity: 5, hp: 1800, weight: 2 },
  { key: 'leviatano', name: 'Leviathan', rarity: 5, hp: 1600, weight: 3 },

  // 4⭐ - Molto rari (bestie mitologiche avanzate)
  { key: 'idra', name: 'Hydra', rarity: 4, hp: 1400, weight: 5 },
  { key: 'fenice', name: 'Phoenix', rarity: 4, hp: 1250, weight: 7 },
  { key: 'basilisco', name: 'Basilisk', rarity: 4, hp: 1150, weight: 9 },

  // 3⭐ - Comuni difficili
  { key: 'gigante', name: 'Giant', rarity: 3, hp: 1000, weight: 10 },
  { key: 'grifone', name: 'Griffin', rarity: 3, hp: 850, weight: 12 },
  { key: 'ippogrifo', name: 'Hippogriff', rarity: 3, hp: 750, weight: 14 },

  // 2⭐ - Rari medi
  { key: 'lupo_mannaro', name: 'Werewolf', rarity: 2, hp: 700, weight: 16 },
  { key: 'minotauro', name: 'Minotaur', rarity: 2, hp: 650, weight: 19 },
  { key: 'gnomo', name: 'Gnome', rarity: 2, hp: 550, weight: 22 },

  // 1⭐ - Comuni facili
  { key: 'goblin', name: 'Goblin', rarity: 1, hp: 550, weight: 24 },
  { key: 'fata', name: 'Fairy', rarity: 1, hp: 450, weight: 26 },
];

/**
 * Parametri di danno e bonus (tunabili)
 */
export const DAMAGE_CONFIG = {
  // BASE_DAMAGE = scores.total * 1.5
  BASE_DAMAGE_MULTIPLIER: 1.5,

  // Moltiplicatori per ruolo
  ROLE_MULTIPLIER: {
    leader: 1.0,
    royal_knight: 1.2,
    wizard: 1.5,
    member: 1.0,
  },

  // Critico: se almeno ceil(guild_size/4) membri ottengono scores.total >= 80
  CRIT_THRESHOLD_DIVISOR: 4,
  CRIT_SCORE_THRESHOLD: 80,
  CRIT_BONUS_DAMAGE: 150, // danni extra piatti alla gilda

  // Bonus per uccisione boss
  KILL_BONUS_GUILD_MULTIPLIER: 75, // RARITY * 75
  KILL_BONUS_USER_DIVISOR: 10, // floor((DMG_USER * RARITY) / 10)
};

/**
 * Determina se siamo nella finestra di weekend
 * Weekend = Sabato 00:00 UTC → Domenica 23:59 UTC
 */
export function isBossWeekend(date: Date = new Date()): boolean {
  const dayOfWeek = date.getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  return dayOfWeek === 0 || dayOfWeek === 6; // Sabato o Domenica
}

/**
 * Estrae il lunedì di inizio settimana (in UTC)
 * Usato come chiave per boss deterministico
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);

  // Calcola giorni da lunedì
  const dayOfWeek = d.getUTCDay(); // 0=Dom, 1=Lun, ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  d.setUTCDate(d.getUTCDate() - daysToMonday);

  // Ritorna formato YYYY-MM-DD
  return d.toISOString().split('T')[0];
}

/**
 * Estrae il boss per una gilda in una settimana
 * Usa hash deterministico pesato
 *
 * @param guildId ID della gilda
 * @param weekStart Data inizio settimana (YYYY-MM-DD)
 * @returns Boss estratto
 */
export function pickBoss(guildId: string, weekStart: string): (typeof BOSS_TYPES)[0] {
  // Crea seed deterministico da guildId + weekStart
  const seed = `${guildId}:${weekStart}`;
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const seedNum = parseInt(hash.slice(0, 8), 16);

  // Cumulative weights
  let totalWeight = 0;
  const cumulativeWeights: number[] = [];

  for (const boss of BOSS_TYPES) {
    totalWeight += boss.weight;
    cumulativeWeights.push(totalWeight);
  }

  // Normalizza seed a [0, totalWeight)
  const normalizedSeed = seedNum % totalWeight;

  // Trova boss corrispondente
  for (let i = 0; i < BOSS_TYPES.length; i++) {
    if (normalizedSeed < cumulativeWeights[i]) {
      return BOSS_TYPES[i];
    }
  }

  // Fallback (non dovrebbe mai accadere)
  return BOSS_TYPES[BOSS_TYPES.length - 1];
}

/**
 * Calcola il danno finale dato un punteggio di missione e ruolo
 *
 * @param missionScore Punteggio totale della missione (0-100)
 * @param userRole Ruolo del giocatore in gilda
 * @returns Danno finale calcolato
 */
export function calculateDamage(
  missionScore: number,
  userRole: 'leader' | 'royal_knight' | 'wizard' | 'member' = 'member',
): number {
  const baseDamage = missionScore * DAMAGE_CONFIG.BASE_DAMAGE_MULTIPLIER;
  const roleMultiplier = DAMAGE_CONFIG.ROLE_MULTIPLIER[userRole] ?? 1.0;
  const finalDamage = Math.floor(baseDamage * roleMultiplier);

  return finalDamage;
}

/**
 * Calcola il bonus di uccisione per la gilda
 *
 * @param bossRarity Rarità del boss (1-5)
 * @returns Bonus XP per la gilda
 */
export function calculateKillBonusGuild(bossRarity: number): number {
  return bossRarity * DAMAGE_CONFIG.KILL_BONUS_GUILD_MULTIPLIER;
}

/**
 * Calcola il bonus di uccisione per l'utente
 *
 * @param userDamage Danno inflitto dall'utente
 * @param bossRarity Rarità del boss
 * @returns Bonus XP per l'utente
 */
export function calculateKillBonusUser(userDamage: number, bossRarity: number): number {
  return Math.floor((userDamage * bossRarity) / DAMAGE_CONFIG.KILL_BONUS_USER_DIVISOR);
}

/**
 * Determina se un attacco boss attiva il critico
 *
 * @param guildMemberCount Numero di membri in gilda
 * @param scoredAboveThreshold Numero di membri con score >= 80
 * @returns True se condizioni critiche soddisfatte
 */
export function isCriticalStrike(guildMemberCount: number, scoredAboveThreshold: number): boolean {
  const critThreshold = Math.ceil(guildMemberCount / DAMAGE_CONFIG.CRIT_THRESHOLD_DIVISOR);
  return scoredAboveThreshold >= critThreshold;
}

/**
 * Calcola bonus danni critici
 *
 * @returns Danno extra critico
 */
export function getCriticalBonus(): number {
  return DAMAGE_CONFIG.CRIT_BONUS_DAMAGE;
}

/**
 * Ottiene il boss per una gilda nella settimana corrente
 *
 * @param guildId ID della gilda
 * @param date Data di riferimento (default: oggi)
 * @returns Boss della settimana
 */
export function getWeekBoss(guildId: string, date: Date = new Date()): (typeof BOSS_TYPES)[0] {
  const weekStart = getWeekStart(date);
  return pickBoss(guildId, weekStart);
}
