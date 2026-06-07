// ============================================
// CLASE: Criatura
// Núcleo principal del juego
// Implementa: State, Observer, Strategy
//
// FASES DE VIDA:
// huevo → base → evolucionada → retorno
//
// TIPOS DE EVOLUCIÓN (día 6):
// natura  → vínculo > 70
// umbra   → energía > 70
// ignis   → espíritu > 70
// aqua    → vitalidad > 70
// aether  → todo equilibrado > 60
// umbris  → negligencia general
// ============================================

import { Estadisticas }  from './Estadisticas.js'
import { evaluarEstado } from './EstadosCriatura.js'

export class Criatura {

    constructor(nombre) {
        this.nombre          = nombre
        this.fase            = 'huevo'
        this.tipoEvolucion   = null      // se determina en día 6
        this.diasVividos     = 0
        this.diasMaximos     = 15
        this.estadisticas    = new Estadisticas()
        this.estadoActual    = null
        this.observadores    = []
        this.createdAt       = new Date()
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
    // PATRÓN STATE
    // ════════════════════════════════════════

    _actualizarEstado() {
        const estadoAnterior = this.estadoActual?.getNombre()
        this.estadoActual    = evaluarEstado(
            this.estadisticas.toObject(),
            this.diasVividos,
            this.diasMaximos
        )
        const estadoNuevo = this.estadoActual.getNombre()

        if (estadoAnterior !== estadoNuevo) {
            this._notificarObservadores('cambioEstado', {
                estadoAnterior,
                estadoNuevo
            })
        }
    }

    // ════════════════════════════════════════
    // PATRÓN STRATEGY
    // ════════════════════════════════════════

    ejecutarAccion(accion) {
        const disponibles = this.estadoActual.getAccionesDisponibles()
        if (!disponibles.includes(accion.getNombre())) {
            return {
                exito   : false,
                mensaje : `La criatura no puede ${accion.getNombre()} en este momento.`
            }
        }

        const resultado = accion.ejecutar(this.estadisticas)
        this._actualizarEstado()
        this._notificarObservadores('accionEjecutada', {
            accion   : accion.getNombre(),
            resultado
        })

        return { exito: true, resultado }
    }

    // ════════════════════════════════════════
    // SISTEMA DE EVOLUCIÓN
    // ════════════════════════════════════════

    _determinarEvolucion() {
        const s = this.estadisticas.toObject()

        // Aether → todo equilibrado > 60
        if (s.vitalidad > 60 && s.espiritu > 60 &&
            s.energia > 60   && s.vinculo > 60 && s.hambre < 40) {
            return 'aether'
        }

        // encontrar la estadística dominante
        const puntuaciones = {
            natura  : s.vinculo,
            umbra   : s.energia,
            ignis   : s.espiritu,
            aqua    : s.vitalidad
        }

        const dominante = Object.entries(puntuaciones)
            .sort((a, b) => b[1] - a[1])[0]

        // si la dominante supera 70 → evoluciona a ese tipo
        if (dominante[1] > 70) {
            return dominante[0]
        }

        // si ninguna supera 70 → umbris (negligencia)
        return 'umbris'
    }

    _evaluarEvolucion() {
        // día 1 → huevo a base
        if (this.diasVividos === 1 && this.fase === 'huevo') {
            this.fase = 'base'
            this._notificarObservadores('evolucion', {
                faseAnterior : 'huevo',
                faseNueva    : 'base',
                tipo         : null
            })
            return
        }

        // día 6 → base a forma evolucionada
        if (this.diasVividos === 6 && this.fase === 'base') {
            this.tipoEvolucion = this._determinarEvolucion()
            this.fase          = 'evolucionada'
            this._notificarObservadores('evolucion', {
                faseAnterior : 'base',
                faseNueva    : 'evolucionada',
                tipo         : this.tipoEvolucion
            })
            return
        }

        // día 15 → retorno
        if (this.diasVividos >= this.diasMaximos) {
            this.fase = 'retorno'
            this._notificarObservadores('evolucion', {
                faseAnterior : 'evolucionada',
                faseNueva    : 'retorno',
                tipo         : this.tipoEvolucion
            })
        }
    }

    // ════════════════════════════════════════
    // TICK DIARIO
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
    // GETTERS
    // ════════════════════════════════════════

    getNombre()        { return this.nombre        }
    getFase()          { return this.fase          }
    getTipoEvolucion() { return this.tipoEvolucion }
    getDiasVividos()   { return this.diasVividos   }
    getDiasMaximos()   { return this.diasMaximos   }
    getEstado()        { return this.estadoActual  }
    getEstadisticas()  { return this.estadisticas  }

    // imagen correcta según fase + tipo + estado
    getImagenActual() {
        const estadoNombre = this.estadoActual?.getNombre() || 'paz'
        const tipo         = this.tipoEvolucion || 'base'

        if (this.fase === 'huevo') {
            return '/assets/images/criatura/sylvae_base_paz.png'
        }

        if (this.fase === 'base') {
            const estadoBase = ['paz','alegre','triste','peligro','hambriento','somnoliento']
            const estado     = estadoBase.includes(estadoNombre) ? estadoNombre : 'paz'
            return `/assets/images/criatura/sylvae_base_${estado}.png`
        }

        if (this.fase === 'evolucionada') {
            const estadosValidos = ['paz','alegre','triste','peligro']
            const estado         = estadosValidos.includes(estadoNombre) ? estadoNombre : 'paz'
            return `/assets/images/criatura/sylvae_${tipo}_${estado}.png`
        }

        if (this.fase === 'retorno') {
            const estadosRetorno = ['paz','alegre','triste','final']
            const estado         = estadosRetorno.includes(estadoNombre) ? estadoNombre : 'paz'
            return `/assets/images/criatura/sylvae_retorno_${estado}.png`
        }

        return '/assets/images/criatura/huevo.png'
    }

    // ════════════════════════════════════════════
    // RESUMEN FINAL DEL CICLO
    // ════════════════════════════════════════════

    _generarResumen() {
        const stats  = this.estadisticas.toObject()
        const estado = this.estadoActual?.getNombre()

        // estadística más alta
        const logros = [
            { nombre: 'Guardián del Bosque',  valor: stats.vinculo,   icono: '💚' },
            { nombre: 'Espíritu Nocturno',    valor: stats.energia,   icono: '🌙' },
            { nombre: 'Llama Eterna',         valor: stats.espiritu,  icono: '🔥' },
            { nombre: 'Fuerza Vital',         valor: stats.vitalidad, icono: '❤️' }
        ]
        const logroMaximo = logros.sort((a, b) => b.valor - a.valor)[0]

        // mensaje según tipo de evolución
        const mensajes = {
            natura  : 'El bosque florecerá donde camines. Tu vínculo con la vida es eterno.',
            umbra   : 'Las estrellas te guiarán siempre. Tu espíritu brilla en la oscuridad.',
            ignis   : 'Tu llama nunca se apagará. El calor de tu cuidado ilumina el mundo.',
            aqua    : 'Las aguas recuerdan tu nombre. Tu vitalidad fluye como un río eterno.',
            aether  : 'Has alcanzado el equilibrio perfecto. Eres uno con el espíritu del bosque.',
            umbris  : 'El bosque llora tu partida. Una nueva oportunidad espera en el horizonte.',
            default : 'El ciclo continúa. El bosque recuerda cada momento de cuidado.'
        }

        const tipo    = this.tipoEvolucion || 'default'
        const mensaje = estado === 'perdido'
            ? 'El bosque se ha oscurecido... pero cada final es un nuevo comienzo.'
            : (mensajes[tipo] || mensajes.default)

        return {
            nombre       : this.nombre,
            fase         : this.fase,
            tipo         : this.tipoEvolucion,
            diasVividos  : this.diasVividos,
            diasMaximos  : this.diasMaximos,
            estadisticas : stats,
            logroMaximo  : logroMaximo,
            mensaje      : mensaje,
            exitoso      : estado === 'retorno',
            imagenFinal  : this.getImagenActual()
        }
    }

    // ════════════════════════════════════════
    // SERIALIZACIÓN
    // ════════════════════════════════════════

    toObject() {
        return {
            nombre        : this.nombre,
            fase          : this.fase,
            tipoEvolucion : this.tipoEvolucion,
            diasVividos   : this.diasVividos,
            diasMaximos   : this.diasMaximos,
            estadisticas  : this.estadisticas.toObject(),
            estado        : this.estadoActual.toObject(),
            imagenActual  : this.getImagenActual(),
            tendencia     : this.estadisticas.getTendenciaEvolucion(),
            urgencias     : this.estadisticas.getUrgencias(),
            resumen       : this._generarResumen(),
            createdAt     : this.createdAt
        }
    }

    static fromObject(obj) {
        const c = new Criatura(obj.nombre)
        c.fase           = obj.fase
        c.tipoEvolucion  = obj.tipoEvolucion || null
        c.diasVividos    = obj.diasVividos
        c.diasMaximos    = obj.diasMaximos
        c.estadisticas   = Estadisticas.fromObject(obj.estadisticas)
        c.createdAt      = obj.createdAt
        c._actualizarEstado()
        return c
    }
}