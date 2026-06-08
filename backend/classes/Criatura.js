// ============================================
// CLASE: Criatura
// Núcleo principal del juego
// Implementa: State, Observer, Strategy
// ============================================

import { Estadisticas }  from './Estadisticas.js'
import { evaluarEstado } from './EstadosCriatura.js'

export class Criatura {

    constructor(nombre) {
        this.nombre          = nombre
        this.fase            = 'huevo'
        this.tipoEvolucion   = null
        this.diasVividos     = 0
        this.diasMaximos     = 15
        this.estadisticas    = new Estadisticas()
        this.estadoActual    = null
        this.observadores    = []
        this.createdAt       = new Date()
        this._logrosObtenidos   = []
        this._contadorAcciones  = {}
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

        const logros = this._verificarLogros(accion.getNombre())
        return { exito: true, resultado, logros }
    }

    // ════════════════════════════════════════
    // SISTEMA DE EVOLUCIÓN
    // ════════════════════════════════════════

    _determinarEvolucion() {
        const s = this.estadisticas.toObject()

        if (s.vitalidad > 60 && s.espiritu > 60 &&
            s.energia > 60   && s.vinculo > 60 && s.hambre < 40) {
            return 'aether'
        }

        const puntuaciones = {
            natura  : s.vinculo,
            umbra   : s.energia,
            ignis   : s.espiritu,
            aqua    : s.vitalidad
        }

        const dominante = Object.entries(puntuaciones)
            .sort((a, b) => b[1] - a[1])[0]

        if (dominante[1] > 70) return dominante[0]
        return 'umbris'
    }

    _evaluarEvolucion() {
        if (this.diasVividos === 1 && this.fase === 'huevo') {
            this.fase = 'base'
            this._notificarObservadores('evolucion', {
                faseAnterior : 'huevo',
                faseNueva    : 'base',
                tipo         : null
            })
            return
        }

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

        if (this.diasVividos >= this.diasMaximos) {
            this.fase = 'retorno'
            this._notificarObservadores('evolucion', {
                faseAnterior : 'evolucionada',
                faseNueva    : 'retorno',
                tipo         : this.tipoEvolucion
            })
        }
    }


    // ════════════════════════════════════════════
    // EVENTOS ESPECIALES ALEATORIOS
    // ════════════════════════════════════════════

    _generarEventoEspecial() {
        // 30% de probabilidad por tick
        if (Math.random() > 0.30) return null

        const eventos = [
            {
                id      : 'luna_roja',
                icono   : '🌕',
                titulo  : '¡Luna Roja!',
                mensaje : 'Una luna roja ilumina el bosque. El vínculo se fortalece misteriosamente.',
                efecto  : (stats) => {
                    stats.modificar('vinculo',  +15)
                    stats.modificar('espiritu', +10)
                }
            },
            {
                id      : 'tormenta',
                icono   : '⛈️',
                titulo  : '¡Tormenta en el Bosque!',
                mensaje : 'Una tormenta sacude los árboles. Sylvae necesita consuelo urgente.',
                efecto  : (stats) => {
                    stats.modificar('espiritu', -15)
                    stats.modificar('energia',  -10)
                }
            },
            {
                id      : 'florecimiento',
                icono   : '🌺',
                titulo  : '¡Florecimiento Mágico!',
                mensaje : 'Flores mágicas brotan alrededor de Sylvae. El bosque celebra.',
                efecto  : (stats) => {
                    stats.modificar('vitalidad', +20)
                    stats.modificar('espiritu',  +15)
                }
            },
            {
                id      : 'hongos_magicos',
                icono   : '🍄',
                titulo  : '¡Hongos Mágicos!',
                mensaje : 'Sylvae encontró hongos mágicos. ¡Su hambre desaparece!',
                efecto  : (stats) => {
                    stats.modificar('hambre',    -40)
                    stats.modificar('vitalidad', +10)
                }
            },
            {
                id      : 'visita_sabio',
                icono   : '🧙',
                titulo  : '¡El Sabio Visita el Bosque!',
                mensaje : '"El amor que das a los seres vivos no desaparece... sigue cuidando."',
                efecto  : (stats) => {
                    stats.modificar('vinculo',  +20)
                    stats.modificar('espiritu', +20)
                }
            },
            {
                id      : 'lluvia_estelar',
                icono   : '🌠',
                titulo  : '¡Lluvia Estelar!',
                mensaje : 'Las estrellas caen sobre el bosque. Sylvae brilla con energía renovada.',
                efecto  : (stats) => {
                    stats.modificar('energia',  +30)
                    stats.modificar('espiritu', +10)
                }
            },
            {
                id      : 'espiritu_ancestral',
                icono   : '👁️',
                titulo  : '¡Espíritu Ancestral!',
                mensaje : 'Un espíritu antiguo bendice a Sylvae. Su vitalidad se restaura.',
                efecto  : (stats) => {
                    stats.modificar('vitalidad', +25)
                    stats.modificar('vinculo',   +10)
                }
            }
        ]

        const evento = eventos[Math.floor(Math.random() * eventos.length)]
        evento.efecto(this.estadisticas)
        return {
            id      : evento.id,
            icono   : evento.icono,
            titulo  : evento.titulo,
            mensaje : evento.mensaje
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

        // generar evento especial aleatorio
        const evento = this._generarEventoEspecial()

        this._notificarObservadores('tickDiario', {
            diasVividos : this.diasVividos,
            evento      : evento
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

    // ════════════════════════════════════════
    // SISTEMA DE MINI-LOGROS
    // ════════════════════════════════════════

    _verificarLogros(accionEjecutada) {
        const logros = []
        const stats  = this.estadisticas.toObject()

        this._contadorAcciones[accionEjecutada] =
            (this._contadorAcciones[accionEjecutada] || 0) + 1

        const h = this._contadorAcciones

        if (stats.vinculo >= 100 && !this._logrosObtenidos.includes('vinculo_max')) {
            logros.push({ icono: '💚', titulo: '¡Vínculo Eterno!', mensaje: 'Has alcanzado el vínculo máximo con Sylvae.' })
            this._registrarLogro('vinculo_max')
        }

        if (stats.vitalidad >= 100 && stats.hambre === 0 && !this._logrosObtenidos.includes('perfecto')) {
            logros.push({ icono: '⭐', titulo: '¡Cuidado Perfecto!', mensaje: 'Sylvae está en condiciones perfectas.' })
            this._registrarLogro('perfecto')
        }

        if (stats.espiritu >= 100 && !this._logrosObtenidos.includes('espiritu_max')) {
            logros.push({ icono: '✨', titulo: '¡Espíritu Pleno!', mensaje: 'El espíritu de Sylvae brilla al máximo.' })
            this._registrarLogro('espiritu_max')
        }

        if ((h['meditar'] || 0) >= 5 && !this._logrosObtenidos.includes('meditador')) {
            logros.push({ icono: '🌿', titulo: '¡Meditador del Bosque!', mensaje: '5 meditaciones completadas con Sylvae.' })
            this._registrarLogro('meditador')
        }

        if ((h['jugar'] || 0) >= 5 && !this._logrosObtenidos.includes('companero')) {
            logros.push({ icono: '🎵', titulo: '¡Compañero Fiel!', mensaje: 'Has jugado 5 veces con Sylvae.' })
            this._registrarLogro('companero')
        }

        if ((h['hablar'] || 0) >= 10 && !this._logrosObtenidos.includes('conversador')) {
            logros.push({ icono: '💬', titulo: '¡El Gran Conversador!', mensaje: 'Has hablado 10 veces con Sylvae.' })
            this._registrarLogro('conversador')
        }

        if (this.diasVividos >= 5 && !this._logrosObtenidos.includes('dia5')) {
            logros.push({ icono: '📅', titulo: '¡5 Días de Vínculo!', mensaje: 'Sylvae lleva 5 días contigo.' })
            this._registrarLogro('dia5')
        }

        if (this.diasVividos >= 10 && !this._logrosObtenidos.includes('dia10')) {
            logros.push({ icono: '🌟', titulo: '¡10 Días Juntos!', mensaje: 'Un vínculo que el bosque nunca olvidará.' })
            this._registrarLogro('dia10')
        }

        if (this.fase === 'evolucionada' && this.tipoEvolucion === 'aether'
            && !this._logrosObtenidos.includes('aether')) {
            logros.push({ icono: '👑', titulo: '¡Sylvae Aether!', mensaje: 'Has alcanzado la evolución perfecta.' })
            this._registrarLogro('aether')
        }

        return logros
    }

    _registrarLogro(id) {
        if (!this._logrosObtenidos.includes(id)) {
            this._logrosObtenidos.push(id)
        }
    }

    // ════════════════════════════════════════
    // RESUMEN FINAL DEL CICLO
    // ════════════════════════════════════════

    _generarResumen() {
        const stats  = this.estadisticas.toObject()
        const estado = this.estadoActual?.getNombre()

        const logros = [
            { nombre: 'Guardián del Bosque', valor: stats.vinculo,   icono: '💚' },
            { nombre: 'Espíritu Nocturno',   valor: stats.energia,   icono: '🌙' },
            { nombre: 'Llama Eterna',        valor: stats.espiritu,  icono: '🔥' },
            { nombre: 'Fuerza Vital',        valor: stats.vitalidad, icono: '❤️' }
        ]
        const logroMaximo = logros.sort((a, b) => b.valor - a.valor)[0]

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
        c.fase                = obj.fase
        c.tipoEvolucion       = obj.tipoEvolucion || null
        c.diasVividos         = obj.diasVividos
        c.diasMaximos         = obj.diasMaximos
        c.estadisticas        = Estadisticas.fromObject(obj.estadisticas)
        c.createdAt           = obj.createdAt
        c._logrosObtenidos    = obj.logrosObtenidos || []
        c._contadorAcciones   = obj.contadorAcciones || {}
        c._actualizarEstado()
        return c
    }
}