// ============================================
// ACCIONES — Patrón STRATEGY
// Incluye sistema de semillas y tienda
// ============================================

// ── Clase base abstracta ──────────────────────

class AccionBase {
    constructor(nombre, cooldownMinutos) {
        if (new.target === AccionBase) {
            throw new Error('AccionBase es abstracta')
        }
        this.nombre          = nombre
        this.cooldownMinutos = cooldownMinutos
    }

    getNombre()  { return this.nombre          }
    getCooldown(){ return this.cooldownMinutos }

    ejecutar(estadisticas) {
        throw new Error(`${this.nombre} debe implementar ejecutar()`)
    }

    getEfectos() {
        throw new Error(`${this.nombre} debe implementar getEfectos()`)
    }
}

// ── 1. ALIMENTAR ──────────────────────────────
export class AccionAlimentar extends AccionBase {
    constructor() { super('alimentar', 120) }

    ejecutar(estadisticas) {
        // verificar sobrealimentación
        if (estadisticas.getHambre() <= 10) {
            return {
                mensaje       : '⚠️ Sylvae ya está llena. Comerla más la enfermará.',
                efectos       : {},
                sobrealimento : true
            }
        }
        estadisticas.modificar('hambre',    -25)
        estadisticas.modificar('vitalidad', +10)
        return {
            mensaje       : 'Le diste alimento a la criatura. El bosque agradece.',
            efectos       : this.getEfectos(),
            sobrealimento : false
        }
    }

    getEfectos() { return { hambre: -25, vitalidad: +10 } }
}

// ── 2. JUGAR ──────────────────────────────────
export class AccionJugar extends AccionBase {
    constructor() { super('jugar', 60) }

    ejecutar(estadisticas) {
        estadisticas.modificar('espiritu', +15)
        estadisticas.modificar('energia',  -15)
        estadisticas.modificar('vinculo',  +10)
        return {
            mensaje : '¡La criatura juega contigo! Su espíritu brilla.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() { return { espiritu: +15, energia: -15, vinculo: +10 } }
}

// ── 3. DORMIR ─────────────────────────────────
export class AccionDormir extends AccionBase {
    constructor() { super('dormir', 480) }

    ejecutar(estadisticas) {
        estadisticas.modificar('energia',   +30)
        estadisticas.modificar('vitalidad', +5)
        return {
            mensaje : 'La criatura descansa... el bosque respira tranquilo.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() { return { energia: +30, vitalidad: +5 } }
}

// ── 4. BAÑAR ──────────────────────────────────
export class AccionBañar extends AccionBase {
    constructor() { super('bañar', 240) }

    ejecutar(estadisticas) {
        estadisticas.modificar('vitalidad', +15)
        estadisticas.modificar('espiritu',  +5)
        return {
            mensaje : 'La criatura brilla limpia. Su vitalidad se renueva.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() { return { vitalidad: +15, espiritu: +5 } }
}

// ── 5. MEDITAR ────────────────────────────────
export class AccionMeditar extends AccionBase {
    constructor() { super('meditar', 360) }

    ejecutar(estadisticas) {
        estadisticas.modificar('vinculo',  +15)
        estadisticas.modificar('espiritu', +10)
        return {
            mensaje  : 'Meditas junto a la criatura. El vínculo se fortalece.',
            efectos  : this.getEfectos(),
            semillas : 3
        }
    }

    getEfectos() { return { vinculo: +15, espiritu: +10 } }
}

// ── 6. HABLAR ─────────────────────────────────
export class AccionHablar extends AccionBase {
    constructor() { super('hablar', 30) }

    ejecutar(estadisticas) {
        estadisticas.modificar('vinculo',  +5)
        estadisticas.modificar('espiritu', +3)
        return {
            mensaje : 'Le hablas suavemente. La criatura escucha con atención.',
            efectos : this.getEfectos()
        }
    }

    getEfectos() { return { vinculo: +5, espiritu: +3 } }
}

// ── 7. COMPRAR ITEM ───────────────────────────
export class AccionComprar extends AccionBase {
    constructor(item) {
        super('comprar', 0)
        this.item = item
    }

    ejecutar(estadisticas) {
        const items = {
            hierba_fresca   : { costo: 3,  efectos: { hambre: -20 },                          mensaje: '🍃 Hierba fresca consumida.' },
            fruta_encantada : { costo: 8,  efectos: { hambre: -40, espiritu: +10 },           mensaje: '🍎 Fruta encantada consumida.' },
            miel_bosque     : { costo: 15, efectos: { hambre: -60, vitalidad: +20 },          mensaje: '🍯 Miel del bosque consumida.' },
            nectar_sagrado  : { costo: 25, efectos: { hambre: -100, vitalidad: +10, espiritu: +10, vinculo: +10 }, mensaje: '🌺 Néctar sagrado consumido.' },
            pocion_energia  : { costo: 10, efectos: { energia: +50 },                         mensaje: '💊 Poción de energía consumida.' },
            pocion_vinculo  : { costo: 15, efectos: { vinculo: +30 },                         mensaje: '💜 Poción de vínculo consumida.' },
            pocion_curativa : { costo: 20, efectos: { vitalidad: +30, espiritu: +20 },        mensaje: '💊 Poción curativa aplicada.', cura: true }
        }

        const itemData = items[this.item]
        if (!itemData) return { exito: false, mensaje: 'Item no encontrado' }

        // aplicar efectos
        Object.entries(itemData.efectos).forEach(([stat, valor]) => {
            estadisticas.modificar(stat, valor)
        })

        return {
            mensaje  : itemData.mensaje,
            efectos  : itemData.efectos,
            costo    : itemData.costo,
            cura     : itemData.cura || false
        }
    }

    getEfectos() { return {} }
}

// ════════════════════════════════════════════
// FACTORY DE ACCIONES
// ════════════════════════════════════════════

export class AccionFactory {

    static crear(nombreAccion, params = {}) {
        const acciones = {
            'alimentar' : () => new AccionAlimentar(),
            'jugar'     : () => new AccionJugar(),
            'dormir'    : () => new AccionDormir(),
            'bañar'     : () => new AccionBañar(),
            'meditar'   : () => new AccionMeditar(),
            'hablar'    : () => new AccionHablar(),
            'comprar'   : () => new AccionComprar(params.item)
        }

        const crear = acciones[nombreAccion]
        if (!crear) throw new Error(`Acción desconocida: ${nombreAccion}`)
        return crear()
    }

    static getTodasLasAcciones() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }

    static getCostoItem(item) {
        const costos = {
            hierba_fresca   : 3,
            fruta_encantada : 8,
            miel_bosque     : 15,
            nectar_sagrado  : 25,
            pocion_energia  : 10,
            pocion_vinculo  : 15,
            pocion_curativa : 20
        }
        return costos[item] || 0
    }
}