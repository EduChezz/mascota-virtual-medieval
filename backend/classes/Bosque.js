// ============================================
// CLASE: Bosque
// Implementa: Singleton + Observer
//
// El Bosque es único en todo el sistema
// y observa a la Criatura automáticamente.
// Su salud refleja el cuidado recibido.
//
// CONDICIONES DE SALUD:
// ─────────────────────────────────────────────
// 75-100 → Bosque próspero   (verde brillante)
// 50-74  → Bosque estable    (verde opaco)
// 25-49  → Bosque enfermo    (amarillo oscuro)
// 0-24   → Bosque agonizante (rojo oscuro)
// ─────────────────────────────────────────────
// ============================================

export class Bosque {

    // ── Singleton ─────────────────────────────
    static #instancia = null

    static getInstance() {
        if (!Bosque.#instancia) {
            Bosque.#instancia = new Bosque()
        }
        return Bosque.#instancia
    }

    // constructor privado
    constructor() {
        if (Bosque.#instancia) {
            throw new Error('Bosque es un Singleton. Usa Bosque.getInstance()')
        }
        this.salud         = 50
        this.descripcion   = 'El bosque aguarda tu cuidado'
        this.color         = '#4a6e3a'
        this.fondo         = 'bosque_75'
        this._rachaAlta    = 0
    }

    // ════════════════════════════════════════
    // PATRÓN OBSERVER
    // Recibe notificaciones de la Criatura
    // ════════════════════════════════════════

    actualizar(evento, datos, criatura) {
        switch(evento) {

            case 'cambioEstado':
                this._reaccionarAlEstado(datos.estadoNuevo, criatura)
                break

            case 'accionEjecutada':
                this._reaccionarAAccion(datos.accion)
                break

            case 'tickDiario':
                this._degradarNatural(criatura.getEstado().getNombre())
                this._rachaAlta = this.salud >= 75 ? this._rachaAlta + 1 : 0
                break

            case 'evolucion':
                this._reaccionarEvolucion(datos.faseNueva)
                break
        }

        // recalcular descripción y visual tras cualquier evento
        this._actualizarVisual()
    }

    // ════════════════════════════════════════
    // REACCIONES A EVENTOS
    // ════════════════════════════════════════

    _reaccionarAlEstado(estadoNuevo, criatura) {
        const efectos = {
            'base_feliz'     :  +5,
            'adulta_feliz'   :  +5,
            'base_paz'       :   0,
            'adulta_paz'     :   0,
            'base_triste'    :  -5,
            'adulta_triste'  :  -5,
            'base_peligro'   : -10,
            'adulta_peligro' : -10,
            'retorno_feliz'  : +10,
            'retorno_triste' :  -5,
            'perdido'        : -20
        }
        const efecto = efectos[estadoNuevo] ?? 0
        this._modificarSalud(efecto)
    }

    _reaccionarAAccion(nombreAccion) {
        const efectos = {
            'alimentar' : +3,
            'jugar'     : +4,
            'dormir'    : +2,
            'bañar'     : +2,
            'meditar'   : +6,
            'hablar'    : +1
        }
        const efecto = efectos[nombreAccion] ?? 0
        this._modificarSalud(efecto)
    }

    _degradarNatural(estadoCriatura = 'base_paz') {
        // Criatura feliz → bosque se recupera
        // Criatura en paz → desgaste leve
        // Criatura triste/peligro → bosque sufre
        const cambios = {
            'base_feliz'     :  +1,
            'adulta_feliz'   :  +1,
            'base_paz'       :  -1,
            'adulta_paz'     :  -1,
            'base_triste'    :  -3,
            'adulta_triste'  :  -3,
            'base_peligro'   :  -5,
            'adulta_peligro' :  -5,
            'retorno_feliz'  :  +2,
            'retorno_triste' :  -3,
            'perdido'        : -10
        }
        this._modificarSalud(cambios[estadoCriatura] ?? -1)
    }

    _reaccionarEvolucion(faseNueva) {
        const bonus = {
            'cria'    : +5,
            'joven'   : +10,
            'guardian': +20,
            'retorno' : +15
        }
        this._modificarSalud(bonus[faseNueva] ?? 0)
    }

    // ════════════════════════════════════════
    // LÓGICA INTERNA
    // ════════════════════════════════════════

    _modificarSalud(cantidad) {
        this.salud = Math.max(0, Math.min(100, this.salud + cantidad))
    }

    _actualizarVisual() {
        if (this.salud >= 75) {
            this.descripcion = 'El bosque florece con vida y magia'
            this.color       = '#2d6e4e'
            this.fondo       = 'bosque_100'
        } else if (this.salud >= 50) {
            this.descripcion = 'El bosque se mantiene, aunque algo lo inquieta'
            this.color       = '#4a6e3a'
            this.fondo       = 'bosque_75'
        } else if (this.salud >= 25) {
            this.descripcion = 'El bosque enferma... los árboles pierden color'
            this.color       = '#6e5a2a'
            this.fondo       = 'bosque_50'
        } else {
            this.descripcion = 'El bosque agoniza... la oscuridad lo consume'
            this.color       = '#3a0a0a'
            this.fondo       = 'bosque_muerto'
        }
    }

    // ════════════════════════════════════════
    // GETTERS
    // ════════════════════════════════════════

    getSalud()       { return this.salud        }
    getDescripcion() { return this.descripcion  }
    getColor()       { return this.color        }
    getFondo()       { return this.fondo        }
    getRachaAlta()   { return this._rachaAlta   }

    sanar(cantidad) {
        this._modificarSalud(cantidad)
        this._actualizarVisual()
    }

    // ════════════════════════════════════════
    // SERIALIZACIÓN
    // ════════════════════════════════════════

    toObject() {
        return {
            salud       : this.salud,
            descripcion : this.descripcion,
            color       : this.color,
            fondo       : this.fondo,
            rachaAlta   : this._rachaAlta
        }
    }

    cargarDesdeObject(obj) {
        this.salud        = obj.salud       ?? 50
        this.descripcion  = obj.descripcion ?? 'El bosque aguarda tu cuidado'
        this.color        = obj.color       ?? '#4a6e3a'
        this.fondo        = obj.fondo       ?? 'bosque_75'
        this._rachaAlta   = obj.rachaAlta   ?? 0
    }

    // reset del singleton (útil para tests)
    static resetInstancia() {
        Bosque.#instancia = null
    }
}