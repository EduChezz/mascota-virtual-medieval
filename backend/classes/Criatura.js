// ============================================
// CLASE: Criatura
// Núcleo principal del juego
// Implementa: State, Observer, Strategy
//
// FASES DE VIDA:
// huevo → cria → joven → guardian → retorno
//
// VARIABLES DE ESTADO:
// estadisticas → determina el estado activo
// fase         → fase de vida actual
// diasVividos  → contador de días
// diasMaximos  → 15 días de ciclo completo
// ============================================

import { Estadisticas }  from './Estadisticas.js'
import { evaluarEstado } from './EstadosCriatura.js'

export class Criatura {

    // ── Constructor ───────────────────────────

    constructor(nombre) {
        this.nombre       = nombre
        this.fase         = 'huevo'
        this.diasVividos  = 0
        this.diasMaximos  = 15
        this.estadisticas = new Estadisticas()
        this.estadoActual = null
        this.observadores = []          // patrón Observer
        this.createdAt    = new Date()

        // evaluar estado inicial
        this._actualizarEstado()
    }

    // ════════════════════════════════════════
    // PATRÓN OBSERVER
    // ════════════════════════════════════════

    agregarObservador(observador) {
        this.observadores.push(observador)
    }

    quitarObservador(observador) {
        this.observadores = this.observadores.filter(o => o !== observador)
    }

    _notificarObservadores(evento, datos) {
        this.observadores.forEach(obs => obs.actualizar(evento, datos, this))
    }

    // ════════════════════════════════════════
    // PATRÓN STATE — actualización automática
    // ════════════════════════════════════════

    _actualizarEstado() {
        const estadoAnterior = this.estadoActual?.getNombre()
        this.estadoActual    = evaluarEstado(
            this.estadisticas.toObject(),
            this.diasVividos,
            this.diasMaximos
        )
        const estadoNuevo = this.estadoActual.getNombre()

        // notificar solo si el estado cambió
        if (estadoAnterior !== estadoNuevo) {
            this._notificarObservadores('cambioEstado', {
                estadoAnterior,
                estadoNuevo
            })
        }
    }

    // ════════════════════════════════════════
    // PATRÓN STRATEGY — ejecutar acciones
    // ════════════════════════════════════════

    ejecutarAccion(accion) {

        // verificar si la acción está disponible en este estado
        const disponibles = this.estadoActual.getAccionesDisponibles()
        if (!disponibles.includes(accion.getNombre())) {
            return {
                exito   : false,
                mensaje : `La criatura no puede ${accion.getNombre()} en este momento.`
            }
        }

        // ejecutar la estrategia
        const resultado = accion.ejecutar(this.estadisticas)

        // actualizar estado tras la acción
        this._actualizarEstado()

        // notificar observadores
        this._notificarObservadores('accionEjecutada', {
            accion  : accion.getNombre(),
            resultado
        })

        return { exito: true, resultado }
    }

    // ════════════════════════════════════════
    // EVOLUCIÓN DE FASE
    // ════════════════════════════════════════

    _evaluarEvolucion() {
        const fases = ['huevo', 'cria', 'joven', 'guardian']
        const limites = {
            huevo   : 1,    // evoluciona al día 1
            cria    : 4,    // evoluciona al día 4
            joven   : 9,    // evoluciona al día 9
            guardian: 15    // retorno al día 15
        }

        const faseActual = this.fase
        const limite     = limites[faseActual]

        if (limite && this.diasVividos >= limite) {
            const siguienteFase = fases[fases.indexOf(faseActual) + 1]
            if (siguienteFase) {
                this.fase = siguienteFase
                this._notificarObservadores('evolucion', {
                    faseAnterior : faseActual,
                    faseNueva    : siguienteFase
                })
            }
        }
    }

    // ════════════════════════════════════════
    // TICK DIARIO — degradación natural
    // Se llama automáticamente cada cierto tiempo
    // ════════════════════════════════════════

    tickDiario() {
        this.diasVividos++
        this.estadisticas.degradar()
        this._evaluarEvolucion()
        this._actualizarEstado()
        this._notificarObservadores('tickDiario', {
            diasVividos : this.diasVividos
        })
    }

    // ════════════════════════════════════════
    // GETTERS PRINCIPALES
    // ════════════════════════════════════════

    getNombre()       { return this.nombre       }
    getFase()         { return this.fase         }
    getDiasVividos()  { return this.diasVividos  }
    getDiasMaximos()  { return this.diasMaximos  }
    getEstado()       { return this.estadoActual }
    getEstadisticas() { return this.estadisticas }

    // ════════════════════════════════════════
    // SERIALIZACIÓN para MongoDB
    // ════════════════════════════════════════

    toObject() {
        return {
            nombre       : this.nombre,
            fase         : this.fase,
            diasVividos  : this.diasVividos,
            diasMaximos  : this.diasMaximos,
            estadisticas : this.estadisticas.toObject(),
            estado       : this.estadoActual.toObject(),
            createdAt    : this.createdAt
        }
    }

    // ── Cargar desde MongoDB ──────────────────

    static fromObject(obj) {
        const c = new Criatura(obj.nombre)
        c.fase        = obj.fase
        c.diasVividos = obj.diasVividos
        c.diasMaximos = obj.diasMaximos
        c.estadisticas = Estadisticas.fromObject(obj.estadisticas)
        c.createdAt   = obj.createdAt
        c._actualizarEstado()
        return c
    }
}