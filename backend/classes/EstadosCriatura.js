// ============================================
// ESTADOS CONCRETOS — Patrón STATE
// Con mensajes aleatorios por estado
// ============================================

import { EstadoBase } from './EstadoBase.js'

// ── Helper para mensaje aleatorio ────────────
function mensajeAleatorio(mensajes) {
    return mensajes[Math.floor(Math.random() * mensajes.length)]
}

// ── 1. ESTADO PAZ ─────────────────────────────
export class EstadoPaz extends EstadoBase {
    constructor() { super('paz') }

    getMensaje() {
        return mensajeAleatorio([
            'El bosque respira en calma... la criatura está en paz.',
            'Las hojas susurran canciones antiguas. Todo está bien.',
            'El espíritu del bosque sonríe. Sylvae descansa tranquila.',
            'Una brisa suave mece los árboles. La criatura contempla el horizonte.',
            'El sabio observa desde lejos, satisfecho del vínculo que creaste.',
            'Las luciérnagas bailan alrededor de Sylvae. El bosque prospera.'
        ])
    }
    getAnimacion()      { return 'idle_paz' }
    getImagenCriatura() { return '/assets/images/criatura/cria_paz.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#1a4a2e' }
}

// ── 2. ESTADO ALEGRE ──────────────────────────
export class EstadoAlegre extends EstadoBase {
    constructor() { super('alegre') }

    getMensaje() {
        return mensajeAleatorio([
            '¡El espíritu del bosque brilla! La criatura irradia alegría.',
            '¡Sylvae salta entre los árboles! Su felicidad ilumina el bosque.',
            '¡Las flores brotan donde pisa! El vínculo está en su punto más alto.',
            '¡El bosque canta! Nunca había estado tan lleno de vida.',
            '¡Sylvae te mira con sus ojos brillantes! Está muy feliz de tenerte.',
            '¡Las mariposas siguen a Sylvae por doquier! El bosque celebra.'
        ])
    }
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

    getMensaje() {
        return mensajeAleatorio([
            'La criatura busca alimento... el bosque se debilita.',
            'Sylvae te mira con ojos tristes. Tiene hambre.',
            'Los árboles pierden hojas. Sylvae necesita alimentarse.',
            'Un gruñido suave... Sylvae lleva tiempo sin comer.',
            'El bosque se oscurece levemente. ¡Dale de comer a Sylvae!',
            'Sylvae olfatea el aire buscando comida. El bosque lo siente.'
        ])
    }
    getAnimacion()      { return 'idle_hambre' }
    getImagenCriatura() { return '/assets/images/criatura/cria_hambre.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#3d3520' }
    getAccionesDisponibles() { return ['alimentar', 'dormir', 'hablar'] }
}

// ── 4. ESTADO SOMNOLIENTO ─────────────────────
export class EstadoSomnoliento extends EstadoBase {
    constructor() { super('somnoliento') }

    getMensaje() {
        return mensajeAleatorio([
            'Los ojos de la criatura se cierran... necesita descanso.',
            'Sylvae bosteza. La luna llama al sueño.',
            'El bosque se adormece con Sylvae. Es hora de descansar.',
            'Sylvae camina despacio... sus patas pesan de cansancio.',
            'Una melodía nocturna envuelve el bosque. Sylvae necesita dormir.',
            'Los párpados de Sylvae caen... dale un descanso merecido.'
        ])
    }
    getAnimacion()      { return 'idle_somnoliento' }
    getImagenCriatura() { return '/assets/images/criatura/cria_paz.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#1a2a3a' }
    getAccionesDisponibles() { return ['dormir', 'hablar'] }
}

// ── 5. ESTADO TRISTE ──────────────────────────
export class EstadoTriste extends EstadoBase {
    constructor() { super('triste') }

    getMensaje() {
        return mensajeAleatorio([
            'El vínculo se debilita... la criatura siente el abandono.',
            'Sylvae te busca con la mirada. Extraña tu presencia.',
            'Las flores se marchitan. Sylvae necesita sentir tu amor.',
            'Un sollozo suave recorre el bosque. Habla con Sylvae.',
            'El sabio advierte: el vínculo se rompe sin cuidado.',
            'Sylvae se acurruca sola bajo un árbol. El bosque llora con ella.'
        ])
    }
    getAnimacion()      { return 'idle_triste' }
    getImagenCriatura() { return '/assets/images/criatura/cria_triste.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#2a1a2a' }
    getAccionesDisponibles() { return ['alimentar', 'jugar', 'hablar', 'meditar'] }
}

// ── 6. ESTADO PELIGRO ─────────────────────────
export class EstadoPeligro extends EstadoBase {
    constructor() { super('peligro') }

    getMensaje() {
        return mensajeAleatorio([
            '⚠️ El bosque se oscurece... la criatura está en peligro.',
            '⚠️ Sylvae tiembla. El bosque siente que algo va mal.',
            '⚠️ Las sombras avanzan. ¡Actúa ahora antes de que sea tarde!',
            '⚠️ El sabio grita desde lejos: ¡cuida a Sylvae ahora mismo!',
            '⚠️ El vínculo casi se rompe. Sylvae necesita ayuda urgente.',
            '⚠️ El bosque agoniza. Solo tu cuidado puede salvar a Sylvae.'
        ])
    }
    getAnimacion()      { return 'idle_peligro' }
    getImagenCriatura() { return '/assets/images/criatura/cria_triste.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/peligro.mp3' }
    getColorBosque()    { return '#1a0a0a' }
    getAccionesDisponibles() { return ['alimentar', 'dormir', 'meditar'] }
}

// ── 7. ESTADO RETORNO ─────────────────────────
export class EstadoRetorno extends EstadoBase {
    constructor() { super('retorno') }

    getMensaje() {
        return mensajeAleatorio([
            '✨ El ciclo se completa... la criatura regresa al bosque espiritual.',
            '✨ Sylvae brilla intensamente. Ha completado su misión.',
            '✨ Las hojas doradas caen. El bosque celebra el retorno.',
            '✨ El sabio sonríe. Has cumplido el juramento del bosque vivo.',
            '✨ Sylvae te mira una última vez con amor antes de partir.',
            '✨ El espíritu del bosque se renueva. Gracias por tu cuidado.'
        ])
    }
    getAnimacion()      { return 'retorno' }
    getImagenCriatura() { return '/assets/images/criatura/guardian_paz.png' }
    getSonidoAmbiente() { return '/assets/sounds/eventos/retorno.mp3' }
    getSonidoCriatura() { return '/assets/sounds/eventos/retorno.mp3' }
    getColorBosque()    { return '#4a3a1a' }
    getAccionesDisponibles() { return ['hablar'] }
}

// ── 8. ESTADO PERDIDO ─────────────────────────
export class EstadoPerdido extends EstadoBase {
    constructor() { super('perdido') }

    getMensaje() {
        return mensajeAleatorio([
            '💔 El bosque se ha oscurecido... el vínculo se ha roto.',
            '💔 Sylvae se desvanece en las sombras. El bosque llora.',
            '💔 El sabio baja la cabeza. El juramento no fue cumplido.',
            '💔 Las sombras consumen el bosque. Sylvae se ha ido.',
            '💔 El ciclo terminó antes de tiempo. El bosque lo recuerda.',
            '💔 Un nuevo ciclo espera. El bosque siempre perdona.'
        ])
    }
    getAnimacion()      { return 'perdido' }
    getImagenCriatura() { return '/assets/images/criatura/huevo.png' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#0a0a0a' }
    getAccionesDisponibles() { return [] }
}

// ════════════════════════════════════════════
// EVALUADOR DE ESTADO
// ════════════════════════════════════════════

export function evaluarEstado(stats, diasVividos, diasMaximos) {
    const { vitalidad, hambre, espiritu, energia, vinculo } = stats

    if (vitalidad === 0)             return new EstadoPerdido()
    if (diasVividos >= diasMaximos)  return new EstadoRetorno()
    if (vitalidad < 20)              return new EstadoPeligro()
    if (hambre > 70)                 return new EstadoHambriento()
    if (energia < 30)                return new EstadoSomnoliento()
    if (vinculo < 30 || espiritu < 20) return new EstadoTriste()
    if (espiritu > 80 && vinculo > 70) return new EstadoAlegre()

    return new EstadoPaz()
}