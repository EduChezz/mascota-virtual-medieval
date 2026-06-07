// ============================================
// CLASE: Estadisticas
// Maneja todas las variables numéricas
// que determinan el estado de la criatura
//
// SISTEMA DE URGENCIA:
// ─────────────────────────────────────────────
// hambre > 70    → urgencia alimentar
// energia < 20   → urgencia dormir
// vinculo < 20   → urgencia vinculo
// vitalidad < 20 → peligro critica
// ─────────────────────────────────────────────
// ============================================

export class Estadisticas {

    constructor() {
        this.vitalidad = 100
        this.hambre    = 0
        this.espiritu  = 100
        this.energia   = 100
        this.vinculo   = 50
    }

    // ── Getters ──────────────────────────────

    getVitalidad() { return this.vitalidad }
    getHambre()    { return this.hambre    }
    getEspiritu()  { return this.espiritu  }
    getEnergia()   { return this.energia   }
    getVinculo()   { return this.vinculo   }

    // ── Modificadores con límites 0-100 ──────

    modificar(atributo, cantidad) {
        this[atributo] = Math.max(0, Math.min(100, this[atributo] + cantidad))
    }

    // ── Degradación natural con el tiempo ────

    degradar() {
        // hambre sube sola
        this.modificar('hambre', +3)

        // espíritu baja solo
        this.modificar('espiritu', -2)

        // energía baja sola
        this.modificar('energia', -1)

        // vitalidad baja más rápido si hay urgencias
        if (this.hambre > 70) {
            this.modificar('vitalidad', -5)  // urgencia hambre
        } else if (this.vinculo < 20) {
            this.modificar('vitalidad', -3)  // urgencia vínculo
        } else {
            this.modificar('vitalidad', -1)  // normal
        }
    }

    // ── Sistema de urgencias ─────────────────

    getUrgencias() {
        const urgencias = []

        if (this.hambre > 70) {
            urgencias.push({
                tipo     : 'hambre',
                nivel    : this.hambre > 90 ? 'critica' : 'alta',
                mensaje  : '¡La criatura tiene hambre! El bosque se debilita.',
                icono    : '🍃',
                accion   : 'alimentar'
            })
        }

        if (this.energia < 20) {
            urgencias.push({
                tipo     : 'energia',
                nivel    : this.energia < 10 ? 'critica' : 'alta',
                mensaje  : 'La criatura está agotada... necesita descanso.',
                icono    : '🌙',
                accion   : 'dormir'
            })
        }

        if (this.vinculo < 20) {
            urgencias.push({
                tipo     : 'vinculo',
                nivel    : this.vinculo < 10 ? 'critica' : 'alta',
                mensaje  : 'El vínculo se rompe... habla con tu criatura.',
                icono    : '💔',
                accion   : 'hablar'
            })
        }

        if (this.vitalidad < 20) {
            urgencias.push({
                tipo     : 'vitalidad',
                nivel    : 'critica',
                mensaje  : '⚠️ La criatura está en peligro crítico.',
                icono    : '❤️',
                accion   : 'alimentar'
            })
        }

        return urgencias
    }

    // ── Tendencia de evolución ────────────────

    getTendenciaEvolucion() {
        const s = this

        // verificar si todo está bajo → umbris
        if (s.vitalidad < 40 && s.espiritu < 40 &&
            s.energia < 40   && s.vinculo < 40) {
            return { tipo: 'umbris', icono: '💔', nombre: 'Umbris' }
        }

        // verificar equilibrio → aether
        if (s.vitalidad > 60 && s.espiritu > 60 &&
            s.energia > 60   && s.vinculo > 60 && s.hambre < 40) {
            return { tipo: 'aether', icono: '✨', nombre: 'Aether' }
        }

        // estadística dominante
        const puntuaciones = {
            natura  : s.vinculo,
            umbra   : s.energia,
            ignis   : s.espiritu,
            aqua    : s.vitalidad
        }

        const iconos = {
            natura : '🌿',
            umbra  : '🌙',
            ignis  : '🔥',
            aqua   : '💧'
        }

        const nombres = {
            natura : 'Natura',
            umbra  : 'Umbra',
            ignis  : 'Ignis',
            aqua   : 'Aqua'
        }

        const dominante = Object.entries(puntuaciones)
            .sort((a, b) => b[1] - a[1])[0]

        return {
            tipo   : dominante[0],
            icono  : iconos[dominante[0]],
            nombre : nombres[dominante[0]]
        }
    }

    // ── Serialización ─────────────────────────

    toObject() {
        return {
            vitalidad : this.vitalidad,
            hambre    : this.hambre,
            espiritu  : this.espiritu,
            energia   : this.energia,
            vinculo   : this.vinculo,
            urgencias : this.getUrgencias(),
            tendencia : this.getTendenciaEvolucion()
        }
    }

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