// ============================================
// ESTADOS CONCRETOS — Patrón STATE
// Cada clase representa un estado de la
// criatura con su comportamiento único
//
// CONDICIONES POR ESTADO:
// ─────────────────────────────────────────────
// EstadoPaz        → todo entre 40-100, equilibrado
// EstadoAlegre     → espiritu > 80 AND vinculo > 70
// EstadoHambriento → hambre > 70
// EstadoSomnoliento→ energia < 30
// EstadoTriste     → vinculo < 30 OR espiritu < 20
// EstadoPeligro    → vitalidad < 20
// EstadoRetorno    → diasVividos >= diasMaximos
// EstadoPerdido    → vitalidad === 0
// ─────────────────────────────────────────────
// ============================================

import { EstadoBase } from './EstadoBase.js'

// ── 1. ESTADO PAZ ─────────────────────────────
export class EstadoPaz extends EstadoBase {
    constructor() { super('paz') }

    getMensaje()        { return 'El bosque respira en calma... la criatura está en paz.' }
    getAnimacion()      { return 'idle_paz' }
    getImagenCriatura() { return '/assets/images/criatura/cria_paz.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#1a4a2e' }
}

// ── 2. ESTADO ALEGRE ──────────────────────────
export class EstadoAlegre extends EstadoBase {
    constructor() { super('alegre') }

    getMensaje()        { return '¡El espíritu del bosque brilla! La criatura irradia alegría.' }
    getAnimacion()      { return 'idle_alegre' }
    getImagenCriatura() { return '/assets/images/criatura/cria_alegre.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#2d6e4e' }

    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }
}

// ── 3. ESTADO HAMBRIENTO ──────────────────────
export class EstadoHambriento extends EstadoBase {
    constructor() { super('hambriento') }

    getMensaje()        { return 'La criatura busca alimento... el bosque se debilita.' }
    getAnimacion()      { return 'idle_hambre' }
    getImagenCriatura() { return '/assets/images/criatura/cria_hambre.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#3d3520' }

    getAccionesDisponibles() {
        return ['alimentar', 'dormir', 'hablar']
    }
}

// ── 4. ESTADO SOMNOLIENTO ─────────────────────
export class EstadoSomnoliento extends EstadoBase {
    constructor() { super('somnoliento') }

    getMensaje()        { return 'Los ojos de la criatura se cierran... necesita descanso.' }
    getAnimacion()      { return 'idle_somnoliento' }
    getImagenCriatura() { return '/assets/images/criatura/cria_paz.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#1a2a3a' }

    getAccionesDisponibles() {
        return ['dormir', 'hablar']
    }
}

// ── 5. ESTADO TRISTE ──────────────────────────
export class EstadoTriste extends EstadoBase {
    constructor() { super('triste') }

    getMensaje()        { return 'El vínculo se debilita... la criatura siente el abandono.' }
    getAnimacion()      { return 'idle_triste' }
    getImagenCriatura() { return '/assets/images/criatura/cria_triste.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#2a1a2a' }

    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'hablar', 'meditar']
    }
}

// ── 6. ESTADO PELIGRO ─────────────────────────
export class EstadoPeligro extends EstadoBase {
    constructor() { super('peligro') }

    getMensaje()        { return '⚠️ El bosque se oscurece... la criatura está en peligro.' }
    getAnimacion()      { return 'idle_peligro' }
    getImagenCriatura() { return '/assets/images/criatura/cria_triste.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/peligro.mp3' }
    getColorBosque()    { return '#1a0a0a' }

    getAccionesDisponibles() {
        return ['alimentar', 'dormir', 'meditar']
    }
}

// ── 7. ESTADO RETORNO ─────────────────────────
export class EstadoRetorno extends EstadoBase {
    constructor() { super('retorno') }

    getMensaje()        { return '✨ El ciclo se completa... la criatura regresa al bosque espiritual.' }
    getAnimacion()      { return 'retorno' }
    getImagenCriatura() { return '/assets/images/criatura/guardian_paz.png' }
    getSonidoAmbiente() { return '/assets/sounds/eventos/retorno.mp3' }
    getSonidoCriatura() { return '/assets/sounds/eventos/retorno.mp3' }
    getColorBosque()    { return '#4a3a1a' }

    getAccionesDisponibles() {
        return ['hablar']
    }
}

// ── 8. ESTADO PERDIDO ─────────────────────────
export class EstadoPerdido extends EstadoBase {
    constructor() { super('perdido') }

    getMensaje()        { return '💔 El bosque se ha oscurecido... el vínculo se ha roto.' }
    getAnimacion()      { return 'perdido' }
    getImagenCriatura() { return '/assets/images/criatura/huevo.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#0a0a0a' }

    getAccionesDisponibles() {
        return []
    }
}

// ════════════════════════════════════════════
// EVALUADOR DE ESTADO
// Analiza las estadísticas y determina
// qué estado debe estar activo
// ════════════════════════════════════════════

export function evaluarEstado(stats, diasVividos, diasMaximos) {

    const { vitalidad, hambre, espiritu, energia, vinculo } = stats

    if (vitalidad === 0)
        return new EstadoPerdido()

    if (diasVividos >= diasMaximos)
        return new EstadoRetorno()

    if (vitalidad < 20)
        return new EstadoPeligro()

    if (hambre > 70)
        return new EstadoHambriento()

    if (energia < 30)
        return new EstadoSomnoliento()

    if (vinculo < 30 || espiritu < 20)
        return new EstadoTriste()

    if (espiritu > 80 && vinculo > 70)
        return new EstadoAlegre()

    return new EstadoPaz()
}