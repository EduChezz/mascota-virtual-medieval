// ============================================
// ESTADOS CONCRETOS — Patrón STATE
// Sistema simplificado: base → adulta → retorno
// ============================================

import { EstadoBase } from './EstadoBase.js'

function mensajeAleatorio(mensajes) {
    return mensajes[Math.floor(Math.random() * mensajes.length)]
}

// ════════════════════════════════════════════
// FASE BASE — recién nacida del huevo
// ════════════════════════════════════════════

export class EstadoBaseFeliz extends EstadoBase {
    constructor() { super('base_feliz') }
    getMensaje() {
        return mensajeAleatorio([
            '¡La pequeña Sylvae brinca entre las hojas! El bosque despierta con ella.',
            '¡Sus ojos brillan como luciérnagas! Está llena de alegría.',
            '¡Sylvae trota feliz por el bosque! El vínculo crece con fuerza.',
            '¡Las flores brotan donde posa sus patas! Todo florece a su alrededor.',
            '¡El sabio sonríe desde lejos! La pequeña está en perfectas condiciones.'
        ])
    }
    getAnimacion()      { return 'base_feliz' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_base_feliz.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#2d6e4e' }
    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }
}

export class EstadoBasePaz extends EstadoBase {
    constructor() { super('base_paz') }
    getMensaje() {
        return mensajeAleatorio([
            'La pequeña Sylvae explora el bosque con curiosidad.',
            'El bosque respira en calma. Sylvae observa el mundo con sus grandes ojos.',
            'Sylvae descansa bajo un árbol antiguo. Todo está en orden.',
            'Las hojas susurran canciones antiguas. La pequeña está tranquila.',
            'El sabio observa desde lejos, satisfecho del vínculo que creaste.'
        ])
    }
    getAnimacion()      { return 'base_paz' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_base_paz.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#1a4a2e' }
    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }
}

export class EstadoBaseTriste extends EstadoBase {
    constructor() { super('base_triste') }
    getMensaje() {
        return mensajeAleatorio([
            'La pequeña Sylvae se acurruca sola. El bosque siente su tristeza.',
            'Sylvae te busca con ojos húmedos. Necesita sentir tu presencia.',
            'Las flores se cierran alrededor de ella. Sylvae necesita tu amor.',
            'Un sollozo suave... la pequeña se siente sola. Háblale.',
            'El sabio advierte: el vínculo se debilita. Cuida a la pequeña.'
        ])
    }
    getAnimacion()      { return 'base_triste' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_base_triste.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#2a1a2a' }
    getAccionesDisponibles() { return ['alimentar', 'jugar', 'hablar', 'meditar'] }
}

export class EstadoBasePeligro extends EstadoBase {
    constructor() { super('base_peligro') }
    getMensaje() {
        return mensajeAleatorio([
            '⚠️ La pequeña Sylvae tiembla. El bosque oscila en peligro.',
            '⚠️ ¡Actúa ahora! La pequeña está en estado crítico.',
            '⚠️ Las sombras rodean a Sylvae. ¡Necesita ayuda urgente!',
            '⚠️ El sabio grita desde lejos: ¡cuida a Sylvae ahora mismo!',
            '⚠️ El bosque agoniza. Solo tu cuidado puede salvar a la pequeña.'
        ])
    }
    getAnimacion()      { return 'base_peligro' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_base_peligro.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/peligro.mp3' }
    getColorBosque()    { return '#1a0a0a' }
    getAccionesDisponibles() { return ['alimentar', 'dormir', 'meditar', 'hablar'] }
}

// ════════════════════════════════════════════
// FASE ADULTA — días 50-99
// Tiene dos idle (base/base2) que rotan en frontend
// ════════════════════════════════════════════

export class EstadoAdultaFeliz extends EstadoBase {
    constructor() { super('adulta_feliz') }
    getMensaje() {
        return mensajeAleatorio([
            '¡Sylvae brilla con todo su esplendor adulto! El bosque celebra.',
            '¡Su espíritu ilumina cada rincón del bosque! Está radiante de alegría.',
            '¡Las mariposas siguen a Sylvae por doquier! El vínculo está en su plenitud.',
            '¡El bosque entero canta! La criatura adulta irradia una energía poderosa.',
            '¡Sylvae te mira con sus ojos dorados! Está en su momento más hermoso.'
        ])
    }
    getAnimacion()      { return 'adulta_feliz' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_adulta_feliz.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#2d6e4e' }
    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }
}

export class EstadoAdultaPaz extends EstadoBase {
    constructor() { super('adulta_paz') }
    getMensaje() {
        return mensajeAleatorio([
            'Sylvae camina con gracia entre los árboles. Ha madurado con fuerza.',
            'El bosque respira en calma. Sylvae adulta contempla el horizonte.',
            'La criatura adulta descansa serena. El ciclo avanza con belleza.',
            'Sylvae marca su territorio con suavidad. El bosque la reconoce como guardiana.',
            'El sabio asiente con orgullo. Sylvae ha crecido bien bajo tu cuidado.'
        ])
    }
    getAnimacion()      { return 'adulta_paz' }
    // En estado paz, el frontend alterna entre base y base2
    getImagenCriatura() { return '/assets/images/criatura/sylvae_adulta_base.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_sano.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/feliz.mp3' }
    getColorBosque()    { return '#1a4a2e' }
    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }
}

export class EstadoAdultaTriste extends EstadoBase {
    constructor() { super('adulta_triste') }
    getMensaje() {
        return mensajeAleatorio([
            'Sylvae inclina la cabeza con pesadumbre. El bosque llora con ella.',
            'La criatura adulta te busca con ojos cansados. Siente el abandono.',
            'El vínculo se tensiona. Sylvae adulta necesita sentir que la cuidas.',
            'Las hojas caen antes de tiempo. Sylvae necesita tu presencia.',
            'El sabio advierte con voz grave: el vínculo se rompe sin cuidado.'
        ])
    }
    getAnimacion()      { return 'adulta_triste' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_adulta_triste.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#2a1a2a' }
    getAccionesDisponibles() { return ['alimentar', 'jugar', 'hablar', 'meditar'] }
}

export class EstadoAdultaPeligro extends EstadoBase {
    constructor() { super('adulta_peligro') }
    getMensaje() {
        return mensajeAleatorio([
            '⚠️ Sylvae adulta ruge de dolor. El bosque tiembla con ella.',
            '⚠️ ¡El bosque se oscurece! La criatura adulta está en peligro crítico.',
            '⚠️ Las sombras consumen los árboles. ¡Actúa ahora o se perderá todo!',
            '⚠️ El sabio grita con urgencia: ¡el vínculo está a punto de romperse!',
            '⚠️ Sylvae te mira por última vez con esperanza. ¡No la abandones!'
        ])
    }
    getAnimacion()      { return 'adulta_peligro' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_adulta_peligro.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/peligro.mp3' }
    getColorBosque()    { return '#1a0a0a' }
    getAccionesDisponibles() { return ['alimentar', 'dormir', 'meditar', 'hablar'] }
}

// ════════════════════════════════════════════
// FASE RETORNO — día 100
// ════════════════════════════════════════════

export class EstadoRetornoFeliz extends EstadoBase {
    constructor() { super('retorno_feliz') }
    getMensaje() {
        return mensajeAleatorio([
            '✨ El ciclo se completa con amor... Sylvae regresa al bosque espiritual.',
            '✨ Sylvae brilla con luz dorada. Ha cumplido su misión con honor.',
            '✨ Las flores brotan en cada rincón. El bosque celebra el retorno.',
            '✨ El sabio llora de alegría. Has cumplido el juramento del bosque vivo.',
            '✨ Sylvae te mira una última vez con amor eterno antes de partir.',
            '✨ El espíritu del bosque se renueva. Gracias por tu cuidado infinito.'
        ])
    }
    getAnimacion()      { return 'retorno_feliz' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_retorno_feliz.gif' }
    getSonidoAmbiente() { return '/assets/sounds/eventos/retorno.mp3' }
    getSonidoCriatura() { return '/assets/sounds/eventos/retorno.mp3' }
    getColorBosque()    { return '#4a7a2e' }
    getAccionesDisponibles() { return [] }
}

export class EstadoRetornoTriste extends EstadoBase {
    constructor() { super('retorno_triste') }
    getMensaje() {
        return mensajeAleatorio([
            '💔 El bosque se oscurece... Sylvae parte con el corazón partido.',
            '💔 Sylvae baja la cabeza con tristeza. El bosque llora su partida.',
            '💔 Las hojas caen negras. El ciclo terminó sin el amor que merecía.',
            '💔 El sabio baja la mirada. El juramento no fue cumplido con amor.',
            '💔 Sylvae se desvanece entre las sombras. El bosque recuerda el dolor.',
            '💔 Un nuevo ciclo espera. El bosque siempre da una segunda oportunidad.'
        ])
    }
    getAnimacion()      { return 'retorno_triste' }
    getImagenCriatura() { return '/assets/images/criatura/sylvae_retorno_triste.gif' }
    getSonidoAmbiente() { return '/assets/sounds/ambiente/bosque_enfermo.mp3' }
    getSonidoCriatura() { return '/assets/sounds/criatura/triste.mp3' }
    getColorBosque()    { return '#0a0a0a' }
    getAccionesDisponibles() { return [] }
}

// ── Muerte antes de tiempo ────────────────────
export class EstadoPerdido extends EstadoBase {
    constructor() { super('perdido') }
    getMensaje() {
        return mensajeAleatorio([
            '💔 El bosque se ha oscurecido... el vínculo se ha roto.',
            '💔 Sylvae se desvanece en las sombras. El bosque llora.',
            '💔 El sabio baja la cabeza. El juramento no fue cumplido.',
            '💔 Las sombras consumen el bosque. Sylvae se ha ido.',
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
// Determina el estado según fase + estadísticas
// ════════════════════════════════════════════

export function evaluarEstado(stats, diasVividos, diasMaximos) {
    const { vitalidad, hambre, espiritu, energia, vinculo } = stats

    // ── Muerte ───────────────────────────────
    if (vitalidad === 0) return new EstadoPerdido()

    // ── Retorno día 100 ──────────────────────
    if (diasVividos >= diasMaximos) {
        // Retorno feliz: stats generales bien mantenidas
        const retornoFeliz = vitalidad > 50 && vinculo > 50 && espiritu > 40
        return retornoFeliz ? new EstadoRetornoFeliz() : new EstadoRetornoTriste()
    }

    // ── Fase ADULTA (días 50-99) ─────────────
    const esAdulta = diasVividos >= 50

    if (esAdulta) {
        if (vitalidad < 20)                        return new EstadoAdultaPeligro()
        if (hambre > 75 || vinculo < 20)           return new EstadoAdultaTriste()
        if (espiritu > 75 && vinculo > 65 && hambre < 35) return new EstadoAdultaFeliz()
        return new EstadoAdultaPaz()
    }

    // ── Fase BASE (días 1-49) ────────────────
    if (vitalidad < 20)                            return new EstadoBasePeligro()
    if (hambre > 75 || vinculo < 20)               return new EstadoBaseTriste()
    if (espiritu > 75 && vinculo > 65 && hambre < 35) return new EstadoBaseFeliz()
    return new EstadoBasePaz()
}