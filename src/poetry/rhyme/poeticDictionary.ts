import { analyzeWord } from '../meter/finalStress';
import { extractRhymeFromWord, type RhymeEnding } from './extractRhyme';
import type { StressType } from '../syllabification/types';

export interface PoeticWordEntry {
  word: string
  syllables: number
  stressType: StressType
  consonant: string     // e.g. "usa", "ante", "or"
  assonant: string      // e.g. "u-a", "a-e", "o"
  rawEnding: string     // e.g. "usa", "ante", "or"
  tags?: string[]
}

/**
 * Curated Spanish poetic lexicon for rhyme suggestions and composition.
 * Contains evocative vocabulary from classic and modern Spanish lyrical traditions
 * (Garcilaso, Góngora, Quevedo, Bécquer, Machado, Lorca, etc.).
 */
const BASE_POETIC_WORDS: string[] = [
  // --- Terminaciones en -a, -as, -an (u-a, a-a, e-a, o-a, i-a) ---
  'musa', 'medusa', 'confusa', 'difusa', 'excusa', 'intrusa', 'rehusa', 'esclusa', 'lechuza',
  'luna', 'cuna', 'espuma', 'pluma', 'bruma', 'duda', 'muda', 'pura', 'figura', 'locura',
  'ternura', 'costura', 'tortura', 'altura', 'dulzura', 'amargura', 'ventura', 'criatura',
  'hermosura', 'sombra', 'alfombra', 'onda', 'honda', 'rosa', 'mariposa', 'diosa', 'preciosa',
  'famosa', 'gloriosa', 'esposa', 'prosa', 'cosa', 'fosa', 'hermosa', 'luminosa', 'graciosa',
  'alma', 'calma', 'palma', 'llama', 'cama', 'fama', 'rama', 'dama', 'escama', 'aurora',
  'hora', 'mora', 'flora', 'llorosa', 'ola', 'sola', 'amapola', 'corola', 'viola', 'esfera',
  'primavera', 'quimera', 'barrera', 'ribera', 'manera', 'espera', 'frontera', 'hoguera',
  'fiera', 'carrera', 'madera', 'estrella', 'huella', 'bella', 'doncella', 'centella', 'querella',
  'niebla', 'selva', 'tregua', 'lengua', 'yegua', 'vela', 'estela', 'tela', 'candela', 'novela',
  'pena', 'cadena', 'arena', 'serena', 'azucena', 'melena', 'faena', 'luzbel', 'dicha',
  'risa', 'brisa', 'prisa', 'camisa', 'repisa', 'espiga', 'amiga', 'enemiga', 'fatiga',
  'ira', 'lira', 'mira', 'suspira', 'mentira', 'tira', 'gira', 'cima', 'rima', 'estima',
  'víctima', 'lágrima', 'música', 'túnica', 'única', 'mágica', 'trágica', 'física',
  'gracia', 'desgracia', 'ansia', 'patria', 'gloria', 'memoria', 'historia', 'victoria',
  'furia', 'penuria', 'injuria', 'pluvia', 'lluvia', 'ausencia', 'presencia', 'inocencia',
  'esencia', 'clemencia', 'paciencia', 'conciencia', 'violencia', 'demencia', 'cadencia',

  // --- Terminaciones en -o, -os (e-o, o-o, a-o, u-o, i-o) ---
  'viento', 'aliento', 'pecho', 'hecho', 'lecho', 'techo', 'derecho', 'despecho', 'acecho',
  'tiempo', 'cuerpo', 'huerto', 'puerto', 'muerto', 'desierto', 'abierto', 'cierto', 'concierto',
  'cielo', 'suelo', 'vuelo', 'desvelo', 'anhelo', 'pañuelo', 'recelo', 'hielo', 'duelo',
  'fuego', 'juego', 'ruego', 'luego', 'ciego', 'sosiego', 'silencio', 'tormento', 'lamento',
  'pensamiento', 'juramento', 'sentimiento', 'momento', 'acento', 'contento', 'intento',
  'atento', 'sustento', 'fundamento', 'monumento', 'elemento', 'aposento', 'crecimiento',
  'sueño', 'dueño', 'empeño', 'diseño', 'pequeño', 'ceño', 'leño', 'ensueño',
  'noche', 'derroche', 'reproche', 'coche', 'trasnoche', 'bosque', 'torre', 'monte',
  'golpe', 'roble', 'sobre', 'noble', 'pobre', 'doble', 'bronce', 'conde', 'horizonte',
  'crepúsculo', 'músculo', 'vínculo', 'obstáculo', 'espectáculo',
  'cántaro', 'pájaro', 'árbol', 'mármol', 'trébol', 'símbolo', 'cáliz',
  'paso', 'vaso', 'caso', 'ocaso', 'fracaso', 'abrazo', 'lazo', 'pedazo', 'regazo',
  'canto', 'llanto', 'espanto', 'manto', 'encanto', 'quebranto', 'tanto', 'santo',
  'rayo', 'mayo', 'desmayo', 'ensayo', 'playo', 'despacio', 'palacio', 'espacio',
  'labio', 'sabio', 'agravio', 'naufragio', 'presagio', 'refugio', 'prodigio', 'vestigio',
  'ojos', 'despojos', 'rojos', 'enojos', 'abrojos', 'cerrojos', 'hinojos', 'antojos',
  'hijo', 'fijo', 'regocijo', 'espejo', 'consejo', 'reflejo', 'viejo', 'bosquejo',
  'río', 'desvío', 'frío', 'navío', 'estío', 'hío', 'gentío', 'bío', 'sombrío',
  'abismo', 'espejismo', 'cinismo', 'heroísmo', 'ritmo', 'signo', 'digno', 'indigno',

  // --- Terminaciones en -e, -es (e-e, o-e, a-e, i-e, u-e) ---
  'verde', 'pierde', 'muerde', 'recuerde', 'muerte', 'fuerte', 'suerte', 'vertiente',
  'fuente', 'puente', 'frente', 'mente', 'valiente', 'ardiente', 'doliente', 'brillante',
  'amante', 'constante', 'errante', 'diamante', 'gigante', 'semblante', 'instante',
  'distante', 'triunfante', 'cantante', 'radiante', 'vigilante', 'palpitante',
  'viajero', 'sendero', 'lucero', 'guerrero', 'acero', 'placentero', 'altanero',
  'certero', 'primero', 'postrero', 'extranjero', 'caballero', 'hechicero',
  'suave', 'grave', 'nave', 'ave', 'llave', 'clave', 'triste', 'existe', 'resiste',

  // --- Terminaciones Agudas (-ar, -er, -ir, -ón, -or, -al, -ad) ---
  'amor', 'clamor', 'dolor', 'fulgor', 'ardor', 'rigor', 'temor', 'candor', 'pundonor',
  'rubor', 'resplandor', 'primor', 'rumor', 'sudor', 'frenesí', 'alhelí', 'rubí', 'carmín',
  'mar', 'cantar', 'mirar', 'amar', 'llorar', 'volar', 'soñar', 'esperar', 'cruzar',
  'pasar', 'hallar', 'brillar', 'calmar', 'brotar', 'pesar', 'quedar', 'sonar',
  'cristal', 'raudal', 'caudal', 'letal', 'mortal', 'inmortal', 'puñal', 'coral', 'portal',
  'sol', 'farol', 'crisol', 'arrebol', 'caracol',
  'luz', 'cruz', 'andaluz', 'testuz', 'capuz',
  'paz', 'fugaz', 'capaz', 'tenaz', 'audaz', 'voraz', 'torcaz', 'vivaz', 'antifaz',
  'voz', 'feroz', 'veloz', 'precoz', 'arroz',
  'soledad', 'verdad', 'claridad', 'beldad', 'fidelidad', 'tempestad', 'libertad', 'majestad',
  'corazón', 'canción', 'pasión', 'ilusión', 'visión', 'razón', 'oración', 'mansión',
  'emoción', 'creación', 'fricción', 'estación', 'atención', 'dirección',
  'placer', 'amanecer', 'atardecer', 'florecer', 'crecer', 'renacer', 'arder', 'perder',
  'vencer', 'tejer', 'correr', 'beber', 'saber', 'tener', 'volver', 'envolver',
  'morir', 'vivir', 'sentir', 'partir', 'abrir', 'dormir', 'latir', 'gemir', 'subir',
  'herir', 'rugir', 'lucir', 'relucir', 'reír', 'sonreír',

  // --- Participios y Adjetivos Líricos Frecuentes ---
  'dormido', 'nacido', 'perdido', 'herido', 'vencido', 'olvidado', 'amado', 'dorado',
  'sagrado', 'alado', 'plateado', 'cansado', 'helado', 'callado', 'desolado', 'encantado',
  'sepultado', 'oculto', 'culto', 'enhiesto', 'dispuesto', 'compuesto', 'roto', 'devoto',
  'ignoto', 'remoto', 'fugitivo', 'cautivo', 'altivo', 'esquivo', 'furtivo', 'pensativo',
  'lejano', 'humano', 'vano', 'tirano', 'hermano', 'temprano', 'soberano', 'lozano',
  'divino', 'peregrino', 'camino', 'destino', 'marino', 'cristalino', 'puro', 'oscuro',
  'seguro', 'duro', 'maduro', 'conjuro', 'muro', 'futuro',

  // --- Vocabulario Culto y Barroco del Siglo de Oro (Silva y Góngora) ---
  'purpúreo', 'argénteo', 'fértil', 'estéril', 'pardo', 'cetro', 'émulo', 'líquido',
  'candente', 'ebúrneo', 'flébile', 'aurífero', 'armonioso', 'belicoso', 'cavernoso',
  'despeñado', 'ondulante', 'rugiente', 'gemebundo', 'fúlgido', 'nitente', 'argenteo',
  'cítara', 'plectro', 'laúd', 'clarín', 'trompa', 'arco', 'saeta', 'flecha',
  'amatista', 'zafiro', 'rubí', 'esmeralda', 'perla', 'nácar', 'topacio', 'diamante'
];

class PoeticDictionaryService {
  private indexedWords: PoeticWordEntry[] = [];
  private byConsonant = new Map<string, PoeticWordEntry[]>();
  private byAssonant = new Map<string, PoeticWordEntry[]>();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    const seen = new Set<string>();

    for (const rawWord of BASE_POETIC_WORDS) {
      const cleanWord = rawWord.trim().toLowerCase();
      if (!cleanWord || seen.has(cleanWord)) continue;
      seen.add(cleanWord);

      const wordAnalysis = analyzeWord(cleanWord, cleanWord);
      const rhymeEnding = extractRhymeFromWord(wordAnalysis);

      if (!rhymeEnding) continue;

      const entry: PoeticWordEntry = {
        word: cleanWord,
        syllables: wordAnalysis.syllables.length,
        stressType: wordAnalysis.stressType,
        consonant: rhymeEnding.normalized,
        assonant: rhymeEnding.assonantEnding || rhymeEnding.vowelsOnly,
        rawEnding: rhymeEnding.raw,
      };

      this.indexedWords.push(entry);

      // Index by consonant
      const consKey = entry.consonant;
      if (!this.byConsonant.has(consKey)) {
        this.byConsonant.set(consKey, []);
      }
      this.byConsonant.get(consKey)!.push(entry);

      // Index by assonant
      const assonKey = entry.assonant;
      if (!this.byAssonant.has(assonKey)) {
        this.byAssonant.set(assonKey, []);
      }
      this.byAssonant.get(assonKey)!.push(entry);
    }

    this.isInitialized = true;
  }

  /**
   * Searches poetic words that rhyme in consonant or assonant mode.
   * Query can be:
   * 1. A word (e.g. "musa", "noche", "cantar") -> will extract its rhyme and search matches.
   * 2. An ending (e.g. "-usa", "-ante", "u-a", "o-e").
   */
  public search(
    query: string,
    mode: 'consonant' | 'assonant' = 'consonant',
    options?: {
      syllables?: number
      stressType?: StressType
      excludeWord?: string
      limit?: number
    }
  ): {
    matchedEnding: string
    assonantScheme: string
    results: PoeticWordEntry[]
  } {
    this.init();

    const cleanQuery = query.trim().toLowerCase().replace(/^[-/]+/, '');
    if (!cleanQuery) {
      return { matchedEnding: '', assonantScheme: '', results: [] };
    }

    // Determine target rhyme keys
    let targetConsonant = '';
    let targetAssonant = '';

    // If query has a hyphen between vowels like "u-a" or "o-e", treat directly as assonant pattern
    if (/^[aeiou]-[aeiou]$/.test(cleanQuery) || /^[aeiou]$/.test(cleanQuery)) {
      targetAssonant = cleanQuery;
    } else {
      // Analyze word to get rhyme ending
      const analysis = analyzeWord(cleanQuery, cleanQuery);
      const ending = extractRhymeFromWord(analysis);
      if (ending) {
        targetConsonant = ending.normalized;
        targetAssonant = ending.assonantEnding || ending.vowelsOnly;
      } else {
        targetConsonant = cleanQuery;
        targetAssonant = cleanQuery;
      }
    }

    let candidates: PoeticWordEntry[] = [];

    if (mode === 'consonant') {
      candidates = this.byConsonant.get(targetConsonant) || [];
      // If exact consonant match has few results, try suffix match on normalized endings
      if (candidates.length === 0 && targetConsonant.length >= 2) {
        for (const [key, entries] of this.byConsonant.entries()) {
          if (key.endsWith(targetConsonant) || targetConsonant.endsWith(key)) {
            candidates.push(...entries);
          }
        }
      }
    } else {
      // Assonant mode
      candidates = this.byAssonant.get(targetAssonant) || [];
    }

    // Filter options
    const exclude = options?.excludeWord?.trim().toLowerCase();
    let filtered = candidates.filter(item => {
      if (exclude && item.word === exclude) return false;
      if (options?.syllables && item.syllables !== options.syllables) return false;
      if (options?.stressType && item.stressType !== options.stressType) return false;
      return true;
    });

    // Remove duplicates if any
    const uniqueMap = new Map<string, PoeticWordEntry>();
    for (const item of filtered) {
      if (!uniqueMap.has(item.word)) {
        uniqueMap.set(item.word, item);
      }
    }
    filtered = Array.from(uniqueMap.values());

    // Sort: shorter words first, then alphabetical
    filtered.sort((a, b) => a.syllables - b.syllables || a.word.localeCompare(b.word));

    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      matchedEnding: targetConsonant,
      assonantScheme: targetAssonant,
      results: filtered,
    };
  }

  /**
   * Suggests words for a specific verse line analysis.
   */
  public suggestForVerseEnding(
    rhymeEnding: RhymeEnding,
    mode: 'consonant' | 'assonant',
    options?: {
      syllables?: number
      excludeWord?: string
      limit?: number
    }
  ): PoeticWordEntry[] {
    this.init();

    const targetKey = mode === 'consonant'
      ? rhymeEnding.normalized
      : (rhymeEnding.assonantEnding || rhymeEnding.vowelsOnly);

    const candidates = mode === 'consonant'
      ? (this.byConsonant.get(targetKey) || [])
      : (this.byAssonant.get(targetKey) || []);

    const exclude = options?.excludeWord?.trim().toLowerCase();
    let filtered = candidates.filter(item => {
      if (exclude && item.word === exclude) return false;
      if (options?.syllables && item.syllables !== options.syllables) return false;
      return true;
    });

    // Sort by syllables then alphabetically
    filtered.sort((a, b) => a.syllables - b.syllables || a.word.localeCompare(b.word));

    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}

export const poeticDictionary = new PoeticDictionaryService();
