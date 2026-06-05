// ============================================
// CLASE: Estadisticas
// Maneja todas las variables numéricas
// que determinan el estado de la criatura
// ============================================

export class Estadisticas {

    constructor() {
        this.vitalidad  = 100   // 0-100: vida general
        this.hambre     = 0     // 0-100: 0=lleno, 100=muriendo de hambre
        this.espiritu   = 100   // 0-100: felicidad/animo
        this.energia    = 100   // 0-100: cansancio
        this.vinculo    = 50    // 0-100: lazos con el cuidador
    }

    // ── Getters ──────────────────────────────

    getVitalidad()  { return this.vitalidad }
    getHambre()     { return this.hambre    }
    getEspiritu()   { return this.espiritu  }
    getEnergia()    { return this.energia   }
    getVinculo()    { return this.vinculo   }

    // ── Modificadores con límites 0-100 ──────

    modificar(atributo, cantidad) {
        this[atributo] = Math.max(0, Math.min(100, this[atributo] + cantidad))
    }

    // ── Degradación natural con el tiempo ────
    // Se llama cada cierto intervalo automáticamente

    degradar() {
        this.modificar('hambre',    +3)   // hambre sube sola
        this.modificar('espiritu',  -2)   // espíritu baja sola
        this.modificar('energia',   -1)   // energía baja sola
        this.modificar('vitalidad', this.hambre > 80 ? -5 : -1)
    }

    // ── Serialización para MongoDB ────────────

    toObject() {
        return {
            vitalidad : this.vitalidad,
            hambre    : this.hambre,
            espiritu  : this.espiritu,
            energia   : this.energia,
            vinculo   : this.vinculo
        }
    }

    // ── Cargar desde MongoDB ──────────────────

    static fromObject(obj) {
        const e = new Estadisticas()
        e.vitalidad = obj.vitalidad ?? 100
        e.hambre    = obj.hambre    ?? 0
        e.espiritu  = obj.espiritu  ?? 100
        e.energia   = obj.energia   ?? 100
        e.vinculo   = obj.vinculo   ?? 50
        return e
    }
}