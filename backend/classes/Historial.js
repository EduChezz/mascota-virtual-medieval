// ============================================
// CLASE: Historial
// Implementa: Singleton + Observer
//
// Registra automáticamente TODAS las
// acciones y eventos del juego.
// Solo existe UNA instancia en el sistema.
//
// TIPOS DE REGISTRO:
// ─────────────────────────────────────────────
// accionEjecutada → cuando el usuario actúa
// cambioEstado    → cuando cambia el estado
// evolucion       → cuando la criatura evoluciona
// tickDiario      → registro diario automático
// ─────────────────────────────────────────────
// ============================================

export class Historial {

    // ── Singleton ─────────────────────────────
    static #instancia = null

    static getInstance() {
        if (!Historial.#instancia) {
            Historial.#instancia = new Historial()
        }
        return Historial.#instancia
    }

    constructor() {
        if (Historial.#instancia) {
            throw new Error('Historial es un Singleton. Usa Historial.getInstance()')
        }
        this.registros  = []
        this.maxRegistros = 100   // máximo de registros en memoria
    }

    // ════════════════════════════════════════
    // PATRÓN OBSERVER
    // Recibe notificaciones de la Criatura
    // ════════════════════════════════════════

    actualizar(evento, datos, criatura) {
        switch(evento) {

            case 'accionEjecutada':
                this._registrar('ACCION', {
                    accion   : datos.accion,
                    mensaje  : datos.resultado.mensaje,
                    efectos  : datos.resultado.efectos,
                    criatura : criatura.getNombre(),
                    fase     : criatura.getFase()
                })
                break

            case 'cambioEstado':
                this._registrar('ESTADO', {
                    de       : datos.estadoAnterior,
                    a        : datos.estadoNuevo,
                    criatura : criatura.getNombre()
                })
                break

            case 'evolucion':
                this._registrar('EVOLUCION', {
                    de       : datos.faseAnterior,
                    a        : datos.faseNueva,
                    criatura : criatura.getNombre(),
                    dia      : criatura.getDiasVividos()
                })
                break

            case 'tickDiario':
                this._registrar('DIA', {
                    dia      : datos.diasVividos,
                    criatura : criatura.getNombre(),
                    estado   : criatura.getEstado().getNombre(),
                    stats    : criatura.getEstadisticas().toObject()
                })
                break
        }
    }

    // ════════════════════════════════════════
    // REGISTRO INTERNO
    // ════════════════════════════════════════

    _registrar(tipo, datos) {
        const registro = {
            tipo      : tipo,
            datos     : datos,
            timestamp : new Date().toISOString()
        }

        this.registros.unshift(registro)   // más reciente primero

        // limitar registros en memoria
        if (this.registros.length > this.maxRegistros) {
            this.registros = this.registros.slice(0, this.maxRegistros)
        }
    }

    // ════════════════════════════════════════
    // CONSULTAS
    // ════════════════════════════════════════

    getRegistros(limite = 20) {
        return this.registros.slice(0, limite)
    }

    getRegistrosPorTipo(tipo, limite = 10) {
        return this.registros
            .filter(r => r.tipo === tipo)
            .slice(0, limite)
    }

    getUltimaAccion() {
        return this.registros.find(r => r.tipo === 'ACCION') ?? null
    }

    getResumen() {
        const acciones   = this.registros.filter(r => r.tipo === 'ACCION').length
        const evoluciones = this.registros.filter(r => r.tipo === 'EVOLUCION').length
        const diasVividos = this.registros.filter(r => r.tipo === 'DIA').length

        return {
            totalAcciones   : acciones,
            totalEvoluciones: evoluciones,
            diasRegistrados : diasVividos,
            totalRegistros  : this.registros.length
        }
    }

    // ════════════════════════════════════════
    // SERIALIZACIÓN para MongoDB
    // ════════════════════════════════════════

    toObject() {
        return {
            registros : this.registros,
            resumen   : this.getResumen()
        }
    }

    cargarDesdeObject(obj) {
        this.registros = obj.registros ?? []
    }

    limpiar() {
        this.registros = []
    }

    // reset del singleton
    static resetInstancia() {
        Historial.#instancia = null
    }
}