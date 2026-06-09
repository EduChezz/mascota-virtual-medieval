// ============================================
// CLASE: Criatura
// Núcleo principal del juego
// Implementa: State, Observer, Strategy
// Sistema: base (días 1-49) → adulta (50-99) → retorno (día 100)
// ============================================

import { Estadisticas }  from './Estadisticas.js'
import { evaluarEstado } from './EstadosCriatura.js'

export class Criatura {

    constructor(nombre) {
        this.nombre          = nombre
        this.fase            = 'huevo'
        this.tipoEvolucion   = null
        this.diasVividos     = 0
        this.diasMaximos     = 100
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

    agregarObservador(observador) { this.observadores.push(observador) }
    quitarObservador(observador)  { this.observadores = this.observadores.filter(o => o !== observador) }

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
            this._notificarObservadores('cambioEstado', { estadoAnterior, estadoNuevo })
        }
    }

    // ════════════════════════════════════════
    // PATRÓN STRATEGY
    // ════════════════════════════════════════

    ejecutarAccion(accion) {
        const disponibles = this.estadoActual.getAccionesDisponibles()
        if (!disponibles.includes(accion.getNombre())) {
            return { exito: false, mensaje: `La criatura no puede ${accion.getNombre()} en este momento.` }
        }
        const resultado    = accion.ejecutar(this.estadisticas)
        this._actualizarEstado()
        this._notificarObservadores('accionEjecutada', { accion: accion.getNombre(), resultado })
        const logros       = this._verificarLogros(accion.getNombre())
        const advertencias = this._verificarExcesos(accion.getNombre())
        return { exito: true, resultado, logros, advertencias }
    }

    // ════════════════════════════════════════
    // EVALUACIÓN DE FASE
    // ════════════════════════════════════════

    _evaluarFase() {
        if (this.diasVividos === 1 && this.fase === 'huevo') {
            this.fase = 'base'
            this._notificarObservadores('evolucion', {
                faseAnterior: 'huevo', faseNueva: 'base', tipo: null,
                mensaje: '¡El huevo ha eclosionado! Sylvae ha nacido.'
            })
            return
        }

        if (this.diasVividos === 50 && this.fase === 'base') {
            this.fase = 'adulta'
            this._notificarObservadores('evolucion', {
                faseAnterior: 'base', faseNueva: 'adulta', tipo: null,
                mensaje: '✨ ¡Sylvae ha crecido! Ha alcanzado su fase adulta.'
            })
            return
        }

        if (this.diasVividos >= this.diasMaximos && this.fase === 'adulta') {
            const stats        = this.estadisticas.toObject()
            const retornoFeliz = stats.vitalidad > 50 && stats.vinculo > 50 && stats.espiritu > 40
            this.fase          = retornoFeliz ? 'retorno_feliz' : 'retorno_triste'
            this._notificarObservadores('evolucion', {
                faseAnterior: 'adulta', faseNueva: this.fase, tipo: null,
                mensaje: retornoFeliz
                    ? '✨ Sylvae completa el ciclo con amor. El bosque florece.'
                    : '💔 Sylvae completa el ciclo con tristeza. El bosque llora.'
            })
        }
    }

    // ════════════════════════════════════════
    // EVENTOS ESPECIALES
    // ════════════════════════════════════════

    _generarEventoEspecial() {
        if (Math.random() > 0.30) return null
        const eventos = [
            { id:'luna_roja',         icono:'🌕', titulo:'¡Luna Roja!',              mensaje:'Una luna roja ilumina el bosque. El vínculo se fortalece.',     efecto:(s)=>{ s.modificar('vinculo',+15); s.modificar('espiritu',+10) } },
            { id:'tormenta',          icono:'⛈️', titulo:'¡Tormenta en el Bosque!',  mensaje:'Una tormenta sacude los árboles. Sylvae necesita consuelo.',    efecto:(s)=>{ s.modificar('espiritu',-15); s.modificar('energia',-10) } },
            { id:'florecimiento',     icono:'🌺', titulo:'¡Florecimiento Mágico!',   mensaje:'Flores mágicas brotan alrededor de Sylvae.',                    efecto:(s)=>{ s.modificar('vitalidad',+20); s.modificar('espiritu',+15) } },
            { id:'hongos_magicos',    icono:'🍄', titulo:'¡Hongos Mágicos!',         mensaje:'¡Sylvae encontró hongos mágicos! Su hambre desaparece.',        efecto:(s)=>{ s.modificar('hambre',-40); s.modificar('vitalidad',+10) } },
            { id:'visita_sabio',      icono:'🧙', titulo:'¡El Sabio Visita!',        mensaje:'"El amor que das a los seres vivos no desaparece..."',           efecto:(s)=>{ s.modificar('vinculo',+20); s.modificar('espiritu',+20) } },
            { id:'lluvia_estelar',    icono:'🌠', titulo:'¡Lluvia Estelar!',         mensaje:'Las estrellas caen. Sylvae brilla con energía renovada.',       efecto:(s)=>{ s.modificar('energia',+30); s.modificar('espiritu',+10) } },
            { id:'espiritu_ancestral',icono:'👁️', titulo:'¡Espíritu Ancestral!',    mensaje:'Un espíritu antiguo bendice a Sylvae. Vitalidad restaurada.',   efecto:(s)=>{ s.modificar('vitalidad',+25); s.modificar('vinculo',+10) } }
        ]
        const evento = eventos[Math.floor(Math.random() * eventos.length)]
        evento.efecto(this.estadisticas)
        return { id: evento.id, icono: evento.icono, titulo: evento.titulo, mensaje: evento.mensaje }
    }

    // ════════════════════════════════════════
    // TICK DIARIO
    // ════════════════════════════════════════

    tickDiario() {
        this.diasVividos++
        this.estadisticas.degradar()
        this._evaluarFase()
        this._actualizarEstado()
        const evento = this._generarEventoEspecial()
        this._notificarObservadores('tickDiario', { diasVividos: this.diasVividos, evento })
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
        if (this.fase === 'huevo') return '/assets/images/criatura/huevo.png'
        return this.estadoActual?.getImagenCriatura()
            || '/assets/images/criatura/sylvae_base_paz.gif'
    }

    // ════════════════════════════════════════
    // EXCESOS
    // ════════════════════════════════════════

    _verificarExcesos(accionEjecutada) {
        const h = this._contadorAcciones
        const s = this.estadisticas
        const advertencias = []

        if (accionEjecutada === 'alimentar' && s.getHambre() <= 10 && (h['alimentar']||0) > 0) {
            s.modificar('vitalidad',-15); s.modificar('espiritu',-10)
            advertencias.push({ tipo:'sobrealimento', mensaje:'🤢 ¡Sylvae comió demasiado! Su vitalidad baja.', icono:'🤢' })
        }

        if (accionEjecutada === 'dormir') {
            const c = (h['_dormir_consecutivo']||0) + 1
            h['_dormir_consecutivo'] = c
            if (c >= 2) {
                s.modificar('espiritu',-10); s.modificar('vinculo',-5)
                advertencias.push({ tipo:'perezoso', mensaje:'😪 Sylvae se está volviendo perezosa... ¡sácala a jugar!', icono:'😪' })
            }
        } else { h['_dormir_consecutivo'] = 0 }

        if (accionEjecutada === 'jugar' && s.getEnergia() < 20) {
            s.modificar('vitalidad',-10); s.modificar('energia',-10)
            advertencias.push({ tipo:'agotado', mensaje:'😵 ¡Sylvae está agotada de jugar!', icono:'😵' })
        }

        if (accionEjecutada === 'meditar' && (h['meditar']||0) >= 4 && (h['jugar']||0) === 0) {
            s.modificar('vinculo',-15)
            advertencias.push({ tipo:'distante', mensaje:'🌀 Sylvae está demasiado en el plano espiritual...', icono:'🌀' })
        }

        if (accionEjecutada === 'hablar' && (h['hablar']||0) >= 8) {
            s.modificar('espiritu',-8)
            advertencias.push({ tipo:'abrumado', mensaje:'😤 Sylvae se siente abrumada... dale silencio.', icono:'😤' })
        }

        return advertencias
    }

    // ════════════════════════════════════════
    // LOGROS
    // ════════════════════════════════════════

    _verificarLogros(accionEjecutada) {
        const logros = []
        const stats  = this.estadisticas.toObject()
        this._contadorAcciones[accionEjecutada] = (this._contadorAcciones[accionEjecutada]||0) + 1
        const h = this._contadorAcciones

        if (stats.vinculo >= 100   && !this._logrosObtenidos.includes('vinculo_max'))  { logros.push({ icono:'💚', titulo:'¡Vínculo Eterno!',        mensaje:'Has alcanzado el vínculo máximo.' }); this._registrarLogro('vinculo_max') }
        if (stats.vitalidad >= 100 && stats.hambre === 0 && !this._logrosObtenidos.includes('perfecto'))   { logros.push({ icono:'⭐', titulo:'¡Cuidado Perfecto!',      mensaje:'Sylvae está en condiciones perfectas.' }); this._registrarLogro('perfecto') }
        if (stats.espiritu >= 100  && !this._logrosObtenidos.includes('espiritu_max')) { logros.push({ icono:'✨', titulo:'¡Espíritu Pleno!',         mensaje:'El espíritu brilla al máximo.' }); this._registrarLogro('espiritu_max') }
        if ((h['meditar']||0) >= 5 && !this._logrosObtenidos.includes('meditador'))   { logros.push({ icono:'🌿', titulo:'¡Meditador del Bosque!',   mensaje:'5 meditaciones completadas.' }); this._registrarLogro('meditador') }
        if ((h['jugar']||0) >= 5   && !this._logrosObtenidos.includes('companero'))   { logros.push({ icono:'🎵', titulo:'¡Compañero Fiel!',         mensaje:'Has jugado 5 veces con Sylvae.' }); this._registrarLogro('companero') }
        if ((h['hablar']||0) >= 10 && !this._logrosObtenidos.includes('conversador')) { logros.push({ icono:'💬', titulo:'¡El Gran Conversador!',    mensaje:'Has hablado 10 veces.' }); this._registrarLogro('conversador') }
        if (this.diasVividos >= 10 && !this._logrosObtenidos.includes('dia10'))  { logros.push({ icono:'📅', titulo:'¡10 Días de Vínculo!',  mensaje:'Sylvae lleva 10 días contigo.' }); this._registrarLogro('dia10') }
        if (this.diasVividos >= 30 && !this._logrosObtenidos.includes('dia30'))  { logros.push({ icono:'🌟', titulo:'¡30 Días Juntos!',      mensaje:'Un mes de cuidado.' }); this._registrarLogro('dia30') }
        if (this.diasVividos >= 50 && !this._logrosObtenidos.includes('dia50'))  { logros.push({ icono:'🌿', titulo:'¡Sylvae ha crecido!',   mensaje:'Ha alcanzado su fase adulta.' }); this._registrarLogro('dia50') }
        if (this.diasVividos >= 75 && !this._logrosObtenidos.includes('dia75'))  { logros.push({ icono:'🔥', titulo:'¡75 Días de Juramento!',mensaje:'Solo 25 días para completar el ciclo.' }); this._registrarLogro('dia75') }

        return logros
    }

    _registrarLogro(id) {
        if (!this._logrosObtenidos.includes(id)) this._logrosObtenidos.push(id)
    }

    // ════════════════════════════════════════
    // RESUMEN FINAL
    // ════════════════════════════════════════

    _generarResumen() {
        const stats  = this.estadisticas.toObject()
        const estado = this.estadoActual?.getNombre()
        const logros = [
            { nombre:'Guardián del Bosque', valor:stats.vinculo,   icono:'💚' },
            { nombre:'Espíritu Nocturno',   valor:stats.energia,   icono:'🌙' },
            { nombre:'Llama Eterna',        valor:stats.espiritu,  icono:'🔥' },
            { nombre:'Fuerza Vital',        valor:stats.vitalidad, icono:'❤️' }
        ]
        const logroMaximo = logros.sort((a,b)=>b.valor-a.valor)[0]
        const mensajes = {
            retorno_feliz  : '✨ El bosque florece eternamente. Tu amor fue el juramento más puro. Sylvae regresa al espíritu del bosque, pero su luz permanece en cada hoja, en cada flor, en cada brisa.',
            retorno_triste : '💔 El bosque llora la partida de Sylvae. El ciclo terminó sin el amor que ella merecía. Pero el bosque es sabio... siempre da una segunda oportunidad.',
            perdido        : '💔 El bosque se ha oscurecido... pero cada final es un nuevo comienzo. El espíritu espera a quien esté listo para cumplir el juramento.'
        }
        return {
            nombre: this.nombre, fase: this.fase, tipo: null,
            diasVividos: this.diasVividos, diasMaximos: this.diasMaximos,
            estadisticas: stats, logroMaximo,
            mensaje : mensajes[estado] || 'El ciclo continúa. El bosque recuerda cada momento.',
            exitoso : estado === 'retorno_feliz',
            imagenFinal: this.getImagenActual()
        }
    }

    // ════════════════════════════════════════
    // SERIALIZACIÓN
    // ════════════════════════════════════════

    toObject() {
        return {
            nombre: this.nombre, fase: this.fase, tipoEvolucion: this.tipoEvolucion,
            diasVividos: this.diasVividos, diasMaximos: this.diasMaximos,
            estadisticas: this.estadisticas.toObject(),
            estado: this.estadoActual.toObject(),
            imagenActual: this.getImagenActual(),
            urgencias: this.estadisticas.getUrgencias(),
            resumen: this._generarResumen(),
            createdAt: this.createdAt,
            logrosObtenidos: this._logrosObtenidos,
            contadorAcciones: this._contadorAcciones
        }
    }

    static fromObject(obj) {
        const c = new Criatura(obj.nombre)
        c.fase              = obj.fase
        c.tipoEvolucion     = obj.tipoEvolucion || null
        c.diasVividos       = obj.diasVividos
        c.diasMaximos       = obj.diasMaximos || 100
        c.estadisticas      = Estadisticas.fromObject(obj.estadisticas)
        c.createdAt         = obj.createdAt
        c._logrosObtenidos  = obj.logrosObtenidos || []
        c._contadorAcciones = obj.contadorAcciones || {}
        c._actualizarEstado()
        return c
    }
}