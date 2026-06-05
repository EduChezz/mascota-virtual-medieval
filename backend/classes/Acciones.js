// ============================================
// ACCIONES — Patrón STRATEGY
// Cada acción encapsula su propia lógica
// de modificación de estadísticas
//
// TABLA DE EFECTOS:
// ─────────────────────────────────────────────
// Alimentar → hambre -30, vitalidad +10
// Jugar     → espiritu +25, energia -15, vinculo +10
// Dormir    → energia +40, vitalidad +5
// Bañar     → vitalidad +15, espiritu +5
// Meditar   → vinculo +20
// Hablar    → vinculo +5
// ─────────────────────────────────────────────
// ============================================

// ── Clase base abstracta ──────────────────────

class AccionBase {

    constructor(nombre, cooldownMinutos) {
        if (new.target === AccionBase) {
            throw new Error('AccionBase es abstracta')
        }
        this.nombre           = nombre
        this.cooldownMinutos  = cooldownMinutos
    }

    getNombre()          { return this.nombre          }
    getCooldown()        { return this.cooldownMinutos }

    // cada acción concreta implementa esto
    ejecutar(estadisticas) {
        throw new Error(`${this.nombre} debe implementar ejecutar()`)
    }

    // descripción de efectos para el frontend
    getEfectos() {
        throw new Error(`${this.nombre} debe implementar getEfectos()`)
    }
}

// ── 1. ALIMENTAR ──────────────────────────────
export class AccionAlimentar extends AccionBase {

    constructor() { super('alimentar', 120) }  // cooldown 2 horas

    ejecutar(estadisticas) {
        estadisticas.modificar('hambre',    -30)
        estadisticas.modificar('vitalidad', +10)
        return {
            mensaje : 'Le diste alimento a la criatura. El bosque agradece.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() {
        return { hambre: -30, vitalidad: +10 }
    }
}

// ── 2. JUGAR ──────────────────────────────────
export class AccionJugar extends AccionBase {

    constructor() { super('jugar', 60) }  // cooldown 1 hora

    ejecutar(estadisticas) {
        estadisticas.modificar('espiritu', +25)
        estadisticas.modificar('energia',  -15)
        estadisticas.modificar('vinculo',  +10)
        return {
            mensaje : '¡La criatura juega contigo! Su espíritu brilla.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() {
        return { espiritu: +25, energia: -15, vinculo: +10 }
    }
}

// ── 3. DORMIR ─────────────────────────────────
export class AccionDormir extends AccionBase {

    constructor() { super('dormir', 480) }  // cooldown 8 horas

    ejecutar(estadisticas) {
        estadisticas.modificar('energia',   +40)
        estadisticas.modificar('vitalidad', +5)
        return {
            mensaje : 'La criatura descansa... el bosque respira tranquilo.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() {
        return { energia: +40, vitalidad: +5 }
    }
}

// ── 4. BAÑAR ──────────────────────────────────
export class AccionBañar extends AccionBase {

    constructor() { super('bañar', 240) }  // cooldown 4 horas

    ejecutar(estadisticas) {
        estadisticas.modificar('vitalidad', +15)
        estadisticas.modificar('espiritu',  +5)
        return {
            mensaje : 'La criatura brilla limpia. Su vitalidad se renueva.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() {
        return { vitalidad: +15, espiritu: +5 }
    }
}

// ── 5. MEDITAR ────────────────────────────────
export class AccionMeditar extends AccionBase {

    constructor() { super('meditar', 360) }  // cooldown 6 horas

    ejecutar(estadisticas) {
        estadisticas.modificar('vinculo',  +20)
        estadisticas.modificar('espiritu', +10)
        return {
            mensaje : 'Meditas junto a la criatura. El vínculo se fortalece.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() {
        return { vinculo: +20, espiritu: +10 }
    }
}

// ── 6. HABLAR ─────────────────────────────────
export class AccionHablar extends AccionBase {

    constructor() { super('hablar', 30) }  // cooldown 30 minutos

    ejecutar(estadisticas) {
        estadisticas.modificar('vinculo',  +5)
        estadisticas.modificar('espiritu', +3)
        return {
            mensaje : 'Le hablas suavemente. La criatura escucha con atención.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() {
        return { vinculo: +5, espiritu: +3 }
    }
}

// ════════════════════════════════════════════
// FÁBRICA DE ACCIONES — Patrón FACTORY
// Crea la acción correcta según el nombre
// ════════════════════════════════════════════

export class AccionFactory {

    static crear(nombreAccion) {
        const acciones = {
            'alimentar' : () => new AccionAlimentar(),
            'jugar'     : () => new AccionJugar(),
            'dormir'    : () => new AccionDormir(),
            'bañar'     : () => new AccionBañar(),
            'meditar'   : () => new AccionMeditar(),
            'hablar'    : () => new AccionHablar()
        }

        const crear = acciones[nombreAccion]
        if (!crear) {
            throw new Error(`Acción desconocida: ${nombreAccion}`)
        }
        return crear()
    }

    static getTodasLasAcciones() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }
}