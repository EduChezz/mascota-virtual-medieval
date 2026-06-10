// ============================================
// APP.JS — El Juramento del Bosque Vivo
// Version completa con semillas + minijuegos
// ============================================

const API = '/api/mascota'

// ════════════════════════════════════════════
// CONFIGURACIÓN DE MODOS
// ════════════════════════════════════════════

const MODOS = {
    normal : {
        nombre    : 'Normal',
        cooldowns : {
            alimentar : 30,
            jugar     : 30,
            dormir    : 30,
            bañar     : 30,
            meditar   : 30,
            hablar    : 30
        }
    },
    demo : {
        nombre    : 'Demo',
        cooldowns : {
            alimentar : 5,
            jugar     : 5,
            dormir    : 5,
            bañar     : 5,
            meditar   : 5,
            hablar    : 5
        }
    }
}

let modoActual = 'normal'

// ════════════════════════════════════════════
// GESTOR DE AUDIO — 3 canales separados
// ════════════════════════════════════════════

const GestorAudio = {
    canales   : { musica: null, efecto: null, criatura: null },
    volumenes : { musica: 0.4, efecto: 0.6, criatura: 0.25 },
    silenciado : false,
    ultimaSonidoCriatura : 0,
    cooldownCriatura     : 45000,
    _timers      : new Map(),   // audio → setInterval ID activo
    _efectoTimer : null,        // timeout del duracionMax del efecto
    _pausaTimer  : null,        // timeout de restaurar música tras pausarMusica

    silenciar() {
        this.silenciado = true
        Object.values(this.canales).forEach(c => { if (c) c.volume = 0 })
        const btn = document.getElementById('btn-silenciar')
        if (btn) btn.textContent = '🔇'
    },

    activar() {
        this.silenciado = false
        if (this.canales.musica)   this.canales.musica.volume   = this.volumenes.musica
        if (this.canales.efecto)   this.canales.efecto.volume   = this.volumenes.efecto
        if (this.canales.criatura) this.canales.criatura.volume = this.volumenes.criatura
        const btn = document.getElementById('btn-silenciar')
        if (btn) btn.textContent = '🔊'
    },

    toggleSilencio() { this.silenciado ? this.activar() : this.silenciar() },

    reproducirMusica(ruta) {
        if (this.silenciado) return
        if (this.canales.musica?.src?.includes(ruta)) return
        this._fadeOut(this.canales.musica, 2000, () => {
            const audio        = new Audio(ruta)
            audio.loop         = true
            audio.volume       = 0
            this.canales.musica = audio
            audio.play().catch(() => {})
            this._fadeIn(audio, 2000, this.volumenes.musica)
        })
    },

    pausarMusica(duracion = 0) {
        if (!this.canales.musica) return
        if (this._pausaTimer) { clearTimeout(this._pausaTimer); this._pausaTimer = null }
        this._fadeOut(this.canales.musica, 800, () => {
            if (!this.canales.musica) return
            this.canales.musica.pause()
            if (duracion > 0) {
                this._pausaTimer = setTimeout(() => {
                    this._pausaTimer = null
                    if (!this.canales.musica) return
                    this.canales.musica.play().catch(() => {})
                    this._fadeIn(this.canales.musica, 800, this.volumenes.musica)
                }, duracion)
            }
        })
    },

    reproducirEfecto(ruta, duracionMax = 8000) {
        if (this.silenciado) return
        // cancelar efecto anterior
        if (this._efectoTimer) { clearTimeout(this._efectoTimer); this._efectoTimer = null }
        if (this.canales.efecto) {
            this._cancelarFade(this.canales.efecto)
            this.canales.efecto.pause()
            this.canales.efecto = null
        }
        // bajar volumen de música
        if (this.canales.musica) {
            this._fadeVolumen(this.canales.musica, this.volumenes.musica * 0.4, 400)
        }
        const audio        = new Audio(ruta)
        audio.volume       = this.volumenes.efecto
        this.canales.efecto = audio
        audio.play().catch(() => {})
        const restaurar = () => {
            if (this.canales.efecto === audio) this.canales.efecto = null
            this._restaurarMusica()
        }
        this._efectoTimer = setTimeout(() => {
            this._efectoTimer = null
            this._cancelarFade(audio)
            audio.pause()
            restaurar()
        }, duracionMax)
        audio.onended = () => {
            clearTimeout(this._efectoTimer)
            this._efectoTimer = null
            restaurar()
        }
    },

    reproducirCriatura(ruta) {
        if (this.silenciado) return
        const ahora = Date.now()
        if (ahora - this.ultimaSonidoCriatura < this.cooldownCriatura) return
        this.ultimaSonidoCriatura = ahora
        if (this.canales.criatura) {
            this._cancelarFade(this.canales.criatura)
            this.canales.criatura.pause()
            this.canales.criatura = null
        }
        const audio          = new Audio(ruta)
        audio.volume         = this.volumenes.criatura
        this.canales.criatura = audio
        audio.play().catch(() => {})
        audio.onended = () => { if (this.canales.criatura === audio) this.canales.criatura = null }
    },

    reproducirEvento(ruta, duracion = 6000) {
        // reproducirEfecto ya se encarga de bajar y restaurar la música
        this.reproducirEfecto(ruta, duracion)
    },

    detenerTodo() {
        if (this._efectoTimer) { clearTimeout(this._efectoTimer); this._efectoTimer = null }
        if (this._pausaTimer)  { clearTimeout(this._pausaTimer);  this._pausaTimer  = null }
        ;['musica','efecto','criatura'].forEach(canal => {
            if (this.canales[canal]) {
                this._cancelarFade(this.canales[canal])
                this.canales[canal].pause()
                this.canales[canal].currentTime = 0
                this.canales[canal] = null
            }
        })
        this._timers.clear()
    },

    _restaurarMusica() {
        if (this.canales.musica) {
            this._fadeVolumen(this.canales.musica, this.volumenes.musica, 800)
        }
    },

    _cancelarFade(audio) {
        if (!audio) return
        const t = this._timers.get(audio)
        if (t !== undefined) { clearInterval(t); this._timers.delete(audio) }
    },

    _fadeIn(audio, duracion, volumenFinal) {
        if (!audio) return
        this._cancelarFade(audio)
        audio.volume = 0
        const pasos = 20, intervalo = duracion / pasos
        const incremento = volumenFinal / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.min(volumenFinal, audio.volume + incremento)
            if (paso >= pasos) { clearInterval(timer); this._timers.delete(audio) }
        }, intervalo)
        this._timers.set(audio, timer)
    },

    _fadeOut(audio, duracion, callback) {
        if (!audio) { if (callback) callback(); return }
        this._cancelarFade(audio)
        const pasos = 20, intervalo = duracion / pasos
        const decremento = Math.max(audio.volume, 0.01) / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.max(0, audio.volume - decremento)
            if (paso >= pasos) {
                clearInterval(timer)
                this._timers.delete(audio)
                audio.pause()
                if (callback) callback()
            }
        }, intervalo)
        this._timers.set(audio, timer)
    },

    _fadeVolumen(audio, volumenFinal, duracion) {
        if (!audio) return
        this._cancelarFade(audio)
        const pasos = 10, intervalo = duracion / pasos
        const diferencia = (volumenFinal - audio.volume) / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.max(0, Math.min(1, audio.volume + diferencia))
            if (paso >= pasos) { clearInterval(timer); this._timers.delete(audio) }
        }, intervalo)
        this._timers.set(audio, timer)
    },

    getMusicaBosque(salud) {
        return salud >= 50
            ? '/assets/sounds/ambiente/bosque_sano.mp3'
            : '/assets/sounds/ambiente/bosque_enfermo.mp3'
    },

    getSonidoCriatura(estadoNombre) {
        const mapa = {
            alegre      : '/assets/sounds/criatura/feliz.mp3',
            paz         : '/assets/sounds/criatura/feliz.mp3',
            hambriento  : '/assets/sounds/criatura/triste.mp3',
            triste      : '/assets/sounds/criatura/triste.mp3',
            somnoliento : '/assets/sounds/criatura/triste.mp3',
            peligro     : '/assets/sounds/criatura/peligro.mp3',
            perdido     : '/assets/sounds/criatura/peligro.mp3'
        }
        return mapa[estadoNombre] || '/assets/sounds/criatura/feliz.mp3'
    }
}

// ════════════════════════════════════════════
// SISTEMA DE COOLDOWN VISUAL
// ════════════════════════════════════════════

const CooldownManager = {
    timers: {}, intervalos: {},

    iniciar(accion, segundos) {
        const btn   = document.querySelector(`[data-accion="${accion}"]`)
        const barra = document.getElementById(`cd-${accion}`)
        const texto = document.getElementById(`txt-${accion}`)
        if (!btn || !barra || !texto) return
        this.limpiar(accion)
        btn.disabled = true
        btn.classList.add('en-cooldown')
        btn.classList.remove('listo')
        let restante = segundos
        barra.style.width = '100%'
        barra.classList.remove('urgente')
        this.intervalos[accion] = setInterval(() => {
            restante--
            const porcentaje = (restante / segundos) * 100
            barra.style.width = `${porcentaje}%`
            texto.textContent = this._formatearTiempo(restante)
            if (porcentaje < 20) barra.classList.add('urgente')
            if (restante <= 0) this.completar(accion)
        }, 1000)
        texto.textContent = this._formatearTiempo(restante)
    },

    completar(accion) {
        this.limpiar(accion)
        const btn   = document.querySelector(`[data-accion="${accion}"]`)
        const barra = document.getElementById(`cd-${accion}`)
        const texto = document.getElementById(`txt-${accion}`)
        if (!btn) return
        btn.disabled = false
        btn.classList.remove('en-cooldown')
        btn.classList.add('listo')
        if (barra) { barra.style.width = '0%'; barra.classList.remove('urgente') }
        if (texto) texto.textContent = '✅ Listo'
        setTimeout(() => {
            btn.classList.remove('listo')
            if (texto) texto.textContent = ''
        }, 2000)
    },

    limpiar(accion) {
        if (this.intervalos[accion]) {
            clearInterval(this.intervalos[accion])
            delete this.intervalos[accion]
        }
    },

    limpiarTodos() {
        Object.keys(this.intervalos).forEach(a => this.limpiar(a))
    },

    _formatearTiempo(segundos) {
        if (segundos <= 0) return ''
        if (segundos < 60) return `${segundos}s`
        const min = Math.floor(segundos / 60)
        const sec = segundos % 60
        if (min < 60) return `${min}m ${sec}s`
        return `${Math.floor(min/60)}h ${min%60}m`
    }
}

// ════════════════════════════════════════════
// ESTADO LOCAL
// ════════════════════════════════════════════

const estado = {
    pantalla              : 'intro',
    slideActual           : 0,
    totalSlides           : 5,
    datosCriatura         : null,
    tickInterval          : null,
    particulasInterval    : null,
    estadoAnterior        : null,
    alertaBosqueCritico   : false
}

// ════════════════════════════════════════════
// ELEMENTOS DEL DOM
// ════════════════════════════════════════════

const dom = {
    pantallas : {
        intro  : document.getElementById('pantalla-intro'),
        crear  : document.getElementById('pantalla-crear'),
        juego  : document.getElementById('pantalla-juego'),
        fin    : document.getElementById('pantalla-fin')
    },
    slides            : document.querySelectorAll('.intro-slide'),
    btnAnterior       : document.getElementById('btn-anterior'),
    btnSiguiente      : document.getElementById('btn-siguiente'),
    btnComenzar       : document.getElementById('btn-comenzar'),
    introPuntos       : document.getElementById('intro-puntos'),
    inputNombre       : document.getElementById('input-nombre'),
    btnCrear          : document.getElementById('btn-crear'),
    crearError        : document.getElementById('crear-error'),
    bosqueFondo       : document.getElementById('bosque-fondo'),
    bosqueOverlay     : document.getElementById('bosque-overlay'),
    barraBosque       : document.getElementById('barra-bosque'),
    valorBosque       : document.getElementById('valor-bosque'),
    nombreCriatura    : document.getElementById('nombre-criatura'),
    faseCriatura      : document.getElementById('fase-criatura'),
    diasVividos       : document.getElementById('dias-vividos'),
    diasMaximos       : document.getElementById('dias-maximos'),
    criaturaSprite    : document.getElementById('criatura-sprite'),
    criaturaAura      : document.getElementById('criatura-aura'),
    estadoMensaje     : document.getElementById('estado-mensaje'),
    accionesPanel     : document.getElementById('acciones-panel'),
    botonesAccion     : document.querySelectorAll('.btn-accion'),
    notificacion      : document.getElementById('notificacion'),
    btnModo           : document.getElementById('btn-modo'),
    stats : {
        vitalidad : { barra: document.getElementById('barra-vitalidad'), val: document.getElementById('val-vitalidad') },
        hambre    : { barra: document.getElementById('barra-hambre'),    val: document.getElementById('val-hambre')    },
        espiritu  : { barra: document.getElementById('barra-espiritu'),  val: document.getElementById('val-espiritu')  },
        energia   : { barra: document.getElementById('barra-energia'),   val: document.getElementById('val-energia')   },
        vinculo   : { barra: document.getElementById('barra-vinculo'),   val: document.getElementById('val-vinculo')   }
    },
    finIcono          : document.getElementById('fin-icono'),
    finTitulo         : document.getElementById('fin-titulo'),
    finMensaje        : document.getElementById('fin-mensaje'),
    btnReiniciar      : document.getElementById('btn-reiniciar'),
    btnTituloComenzar  : document.getElementById('btn-titulo-comenzar'),
    btnTituloContinuar : document.getElementById('btn-titulo-continuar'),
    continuarInfo      : document.getElementById('continuar-info'),
    pantallaTitulo     : document.getElementById('pantalla-titulo'),
    tituloParticulas   : document.getElementById('titulo-particulas'),
    btnSilenciar       : document.getElementById('btn-silenciar')
}

// ════════════════════════════════════════════
// BOTÓN MODO DEMO / NORMAL
// ════════════════════════════════════════════

let tickDemoInterval = null

function activarModoDemo() {
    modoActual = 'demo'
    dom.btnModo.querySelector('.accion-label').textContent = '⚡ Demo ON'
    dom.btnModo.classList.add('demo-activo')
    mostrarNotificacion('⚡ Modo Demo — cooldowns 5s, ticks rápidos, avance manual')

    // Tick cada 3 segundos en demo
    if (estado.tickInterval) clearInterval(estado.tickInterval)
    if (tickDemoInterval)    clearInterval(tickDemoInterval)
    tickDemoInterval = setInterval(async () => {
        if (document.hidden || estado.pantalla !== 'juego') return
        try {
            const res  = await fetch(`${API}/tick`, { method: 'POST' })
            const data = await res.json()
            if (data.exito) {
                actualizarJuego(data.datos)
                if (data.evento) setTimeout(() => mostrarEventoEspecial(data.evento), 500)
                if (data.logros?.length) {
                    data.logros.forEach((logro, i) => setTimeout(() => mostrarLogro(logro), 500 + i * 2000))
                }
                if (data.semillasBonus) {
                    setTimeout(() => mostrarNotificacion('🌳 +1 semilla — ¡El bosque prospera!'), 700)
                }
            }
        } catch(e) {}
    }, 3000)

    // Mostrar botón avanzar día
    let btnAvanzar = document.getElementById('btn-avanzar-demo')
    if (!btnAvanzar) {
        btnAvanzar = document.createElement('button')
        btnAvanzar.id        = 'btn-avanzar-demo'
        btnAvanzar.className = 'btn-accion demo-avanzar'
        btnAvanzar.innerHTML = '<span class="accion-icono">⏭️</span><span class="accion-label">+10 días</span>'
        btnAvanzar.addEventListener('click', async () => {
            mostrarNotificacion('⚡ Avanzando 10 días...')
            for (let i = 0; i < 10; i++) {
                try {
                    const res  = await fetch(`${API}/tick`, { method: 'POST' })
                    const data = await res.json()
                    if (data.exito) actualizarJuego(data.datos)
                    await new Promise(r => setTimeout(r, 200))
                } catch(e) {}
            }
        })
        dom.accionesPanel?.appendChild(btnAvanzar)
    }
    btnAvanzar.style.display = 'flex'
}

function desactivarModoDemo() {
    modoActual = 'normal'
    dom.btnModo.querySelector('.accion-label').textContent = 'Modo Demo'
    dom.btnModo.classList.remove('demo-activo')
    mostrarNotificacion('🌿 Modo Normal activado')
    if (tickDemoInterval) { clearInterval(tickDemoInterval); tickDemoInterval = null }
    iniciarTickAutomatico()
    const btnAvanzar = document.getElementById('btn-avanzar-demo')
    if (btnAvanzar) btnAvanzar.style.display = 'none'
}

dom.btnModo.addEventListener('click', () => {
    modoActual === 'normal' ? activarModoDemo() : desactivarModoDemo()
})

// ════════════════════════════════════════════
// NAVEGACIÓN ENTRE PANTALLAS
// ════════════════════════════════════════════

function mostrarPantalla(nombre) {
    Object.values(dom.pantallas).forEach(p => {
        p.classList.remove('activa')
        p.style.display = 'none'
        p.style.opacity = '0'
    })
    const pantalla = dom.pantallas[nombre]
    pantalla.style.display = 'flex'
    setTimeout(() => {
        pantalla.style.opacity = '1'
        pantalla.classList.add('activa')
    }, 50)
    estado.pantalla = nombre
    mostrarBotonesJuego(nombre === 'juego')
    document.getElementById('panel-historial')?.classList.add('oculto')
}

// ════════════════════════════════════════════
// INTRO
// ════════════════════════════════════════════

function iniciarIntro() {
    dom.introPuntos.innerHTML = ''
    for (let i = 0; i < estado.totalSlides; i++) {
        const punto = document.createElement('div')
        punto.classList.add('punto')
        if (i === 0) punto.classList.add('activo')
        punto.addEventListener('click', () => irASlide(i))
        dom.introPuntos.appendChild(punto)
    }
    mostrarSlide(0)
    GestorAudio.reproducirMusica('/assets/sounds/ambiente/intro_medieval.mp3')
}

function mostrarSlide(indice) {
    dom.slides.forEach((s, i) => s.classList.toggle('activo', i === indice))
    document.querySelectorAll('.punto').forEach((p, i) => p.classList.toggle('activo', i === indice))
    dom.btnComenzar.style.display = indice === estado.totalSlides - 1 ? 'inline-block' : 'none'
    dom.btnAnterior.style.display = indice === 0 ? 'none' : 'inline-block'
    estado.slideActual = indice
}

function irASlide(indice) {
    if (indice < 0 || indice >= estado.totalSlides) return
    mostrarSlide(indice)
}

dom.btnSiguiente.addEventListener('click', () => irASlide(estado.slideActual + 1))
dom.btnAnterior.addEventListener('click',  () => irASlide(estado.slideActual - 1))
dom.btnComenzar.addEventListener('click',  () => {
    GestorAudio.pausarMusica()
    mostrarPantalla('crear')
    setTimeout(() => Huevo.init(), 300)
})

// ════════════════════════════════════════════
// MINIJUEGO DEL HUEVO
// ════════════════════════════════════════════

const Huevo = {
    calor: 0, maxCalor: 100,
    countdownActivo: false, countdownValor: 5,
    intervalBajada: null, intervalCountdown: null,
    listo: false, _ultimoClick: null,

    elementos : {
        barra      : document.getElementById('calor-barra'),
        porcentaje : document.getElementById('calor-porcentaje'),
        mensaje    : document.getElementById('calor-mensaje'),
        sprite     : document.getElementById('huevo-sprite'),
        aura       : document.getElementById('huevo-aura'),
        countdown  : document.getElementById('calor-countdown'),
        btnCalentar: document.getElementById('btn-calentar'),
        particulas : document.getElementById('calor-particulas')
    },

    mensajes : {
        frio    : 'El huevo espiritual duerme... caliéntalo para despertarlo',
        tibio   : 'El huevo empieza a sentir el calor... ¡sigue!',
        caliente: '¡El espíritu despierta! ¡No te detengas!',
        maximo  : '✨ ¡El huevo está listo para nacer! ¡Mantén el calor!'
    },

    init() {
        this.calor = 0
        this.listo = false
        this.countdownActivo = false
        this._ultimoClick = null
        GestorAudio.reproducirMusica('/assets/sounds/eventos/nacimiento.mp3')
        const sprite = this.elementos.sprite
        if (sprite) {
            sprite.innerHTML = ''
            sprite.style.fontSize = 'unset'
            const img = document.createElement('img')
            img.src = '/assets/images/criatura/huevo.png'
            img.style.cssText = 'width:180px;height:180px;object-fit:contain;filter:drop-shadow(0 0 20px rgba(200,169,110,0.5));'
            sprite.appendChild(img)
        }
        this.actualizarUI()
        this.iniciarBajadaAutomatica()
    },

    calentar() {
        if (this.listo) return
        let incremento = 4
        if (this.calor >= 67) incremento = 2
        else if (this.calor >= 34) incremento = 3
        const ahora = Date.now()
        if (this._ultimoClick && (ahora - this._ultimoClick) < 400) incremento += 1
        this._ultimoClick = ahora
        this.calor = Math.min(this.maxCalor, this.calor + incremento)
        this.elementos.btnCalentar.style.transform = 'scale(0.95)'
        setTimeout(() => { if (this.elementos.btnCalentar) this.elementos.btnCalentar.style.transform = 'scale(1)' }, 100)
        this.crearParticulaCalor()
        GestorAudio.reproducirEfecto('/assets/sounds/acciones/alimentar.mp3', 500)
        this.actualizarUI()
        if (this.calor >= this.maxCalor && !this.countdownActivo) this.iniciarCountdown()
    },

    actualizarUI() {
        const p = this.calor
        const e = this.elementos
        e.barra.style.width = `${p}%`
        e.porcentaje.textContent = `${Math.round(p)}%`
        e.barra.className = 'calor-barra'
        if (p >= 100) e.barra.classList.add('maximo')
        else if (p >= 67) e.barra.classList.add('caliente')
        else if (p >= 34) e.barra.classList.add('tibio')
        const img = e.sprite?.querySelector('img')
        if (img) {
            if (p >= 100) { img.style.filter = 'drop-shadow(0 0 40px rgba(255,215,100,0.9)) brightness(1.5)'; img.style.animation = 'vibrar 0.1s ease-in-out infinite' }
            else if (p >= 67) { img.style.filter = 'drop-shadow(0 0 25px rgba(226,74,74,0.8)) brightness(1.3) hue-rotate(-20deg)'; img.style.animation = 'vibrar 0.2s ease-in-out infinite' }
            else if (p >= 34) { img.style.filter = 'drop-shadow(0 0 15px rgba(226,144,74,0.6)) brightness(1.1) hue-rotate(10deg)'; img.style.animation = 'flotar 2s ease-in-out infinite' }
            else { img.style.filter = 'drop-shadow(0 0 10px rgba(74,144,226,0.4)) brightness(0.9) hue-rotate(180deg)'; img.style.animation = 'flotar 3s ease-in-out infinite' }
        }
        if (p >= 100) {
            e.aura.style.background = 'radial-gradient(circle, rgba(255,215,100,0.6) 0%, transparent 70%)'
            e.btnCalentar.classList.add('maximo')
            e.mensaje.textContent = this.mensajes.maximo
        } else if (p >= 67) {
            e.aura.style.background = 'radial-gradient(circle, rgba(226,74,74,0.5) 0%, transparent 70%)'
            e.btnCalentar.classList.remove('maximo')
            e.mensaje.textContent = this.mensajes.caliente
        } else if (p >= 34) {
            e.aura.style.background = 'radial-gradient(circle, rgba(226,144,74,0.3) 0%, transparent 70%)'
            e.btnCalentar.classList.remove('maximo')
            e.mensaje.textContent = this.mensajes.tibio
        } else {
            e.aura.style.background = 'radial-gradient(circle, rgba(74,144,226,0.2) 0%, transparent 70%)'
            e.btnCalentar.classList.remove('maximo')
            e.mensaje.textContent = this.mensajes.frio
        }
    },

    iniciarBajadaAutomatica() {
        if (this.intervalBajada) clearInterval(this.intervalBajada)
        this.intervalBajada = setInterval(() => {
            if (this.listo) return
            if (this.countdownActivo && this.calor >= this.maxCalor) return
            if (this.countdownActivo && this.calor < this.maxCalor) {
                this.countdownActivo = false
                clearInterval(this.intervalCountdown)
            }
            let bajada = 5
            if (this.calor >= 67) bajada = 2
            else if (this.calor >= 34) bajada = 3
            this.calor = Math.max(0, this.calor - bajada)
            this.actualizarUI()
        }, 800)
    },

    iniciarCountdown() {
        this.countdownActivo = true
        this.countdownValor  = 5
        GestorAudio.reproducirEfecto('/assets/sounds/eventos/evolucion.mp3', 7000)
        this.intervalCountdown = setInterval(() => {
            if (this.calor < this.maxCalor) {
                this.countdownActivo = false
                clearInterval(this.intervalCountdown)
                if (GestorAudio.canales.efecto) {
                    GestorAudio._fadeOut(GestorAudio.canales.efecto, 500, () => {
                        GestorAudio.canales.efecto = null
                        GestorAudio._restaurarMusica()
                    })
                }
                return
            }
            this.countdownValor--
            if (this.countdownValor <= 0) {
                clearInterval(this.intervalCountdown)
                this.eclosionar()
            }
        }, 1000)
    },

    eclosionar() {
        this.listo = true
        if (this.intervalBajada) clearInterval(this.intervalBajada)
        const e = this.elementos
        const flash = document.createElement('div')
        flash.style.cssText = 'position:fixed;inset:0;background:white;opacity:0;z-index:999;transition:opacity 0.3s ease;pointer-events:none;'
        document.body.appendChild(flash)
        setTimeout(() => flash.style.opacity = '1', 50)
        GestorAudio.detenerTodo()
        setTimeout(() => {
            flash.style.transition = 'opacity 0.8s ease'
            flash.style.opacity    = '0'
            const fondo = document.querySelector('.crear-fondo')
            if (fondo) { fondo.style.filter = 'brightness(0.7)'; fondo.style.transition = 'filter 1s ease' }
            _lanzarParticulasEclosion()
        }, 400)
        setTimeout(() => flash.remove(), 1500)
        setTimeout(() => {
            GestorAudio.detenerTodo()
            setTimeout(() => GestorAudio.reproducirMusica('/assets/sounds/ambiente/bosque_sano.mp3'), 500)
        }, 1200)
        setTimeout(() => {
            document.getElementById('fase-calentamiento').classList.add('oculto')
            document.getElementById('fase-nombre').classList.remove('oculto')
        }, 1800)
    },

    crearParticulaCalor() {
        if (!this.elementos.particulas) return
        const el = document.createElement('div')
        const emojis = ['🔥','✨','⚡','💫']
        el.textContent = this.calor > 66 ? emojis[Math.floor(Math.random()*emojis.length)] : '✨'
        const x = 35 + Math.random() * 30
        const duration = 1000 + Math.random() * 1000
        el.style.cssText = `position:absolute;font-size:${0.5+Math.random()*0.8}rem;left:${x}vw;bottom:40%;opacity:0.8;animation:volarMariposa ${duration}ms ease-out forwards;pointer-events:none;`
        this.elementos.particulas.appendChild(el)
        setTimeout(() => el.remove(), duration)
    },

    reset() {
        this.calor = 0
        this.listo = false
        this.countdownActivo = false
        this.countdownValor  = 5
        if (this.intervalBajada)    clearInterval(this.intervalBajada)
        if (this.intervalCountdown) clearInterval(this.intervalCountdown)
        document.getElementById('fase-calentamiento')?.classList.remove('oculto')
        document.getElementById('fase-nombre')?.classList.add('oculto')
        this.actualizarUI()
    }
}

function _lanzarParticulasEclosion() {
    const contenedor = document.getElementById('calor-particulas')
    if (!contenedor) return
    const emojis = ['✨','🌟','💫','⭐','🌿','🍃']
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const el = document.createElement('div')
            const x  = Math.random() * 100
            const duration = 1500 + Math.random() * 2000
            el.textContent = emojis[Math.floor(Math.random()*emojis.length)]
            el.style.cssText = `position:fixed;font-size:${0.8+Math.random()*1.5}rem;left:${x}vw;bottom:-30px;opacity:0.9;animation:volarMariposa ${duration}ms ease-out forwards;pointer-events:none;z-index:100;`
            contenedor.appendChild(el)
            setTimeout(() => el.remove(), duration)
        }, i * 80)
    }
}

function _reaccionSylvae(accion) {
    const clasesReaccion = ['sylvae-reaccion-alimentar','sylvae-reaccion-jugar','sylvae-reaccion-dormir','sylvae-reaccion-meditar']
    clasesReaccion.forEach(c => dom.criaturaSprite.classList.remove(c))
    const mapaReacciones = { alimentar:'sylvae-reaccion-alimentar', jugar:'sylvae-reaccion-jugar', dormir:'sylvae-reaccion-dormir', meditar:'sylvae-reaccion-meditar' }
    const claseReaccion = mapaReacciones[accion]
    if (!claseReaccion) return
    dom.criaturaSprite.classList.add(claseReaccion)
    setTimeout(() => dom.criaturaSprite.classList.remove(claseReaccion), 1200)
}

document.getElementById('btn-calentar')?.addEventListener('click', () => Huevo.calentar())

// ════════════════════════════════════════════
// CREAR CRIATURA
// ════════════════════════════════════════════

dom.btnCrear.addEventListener('click', async () => {
    const nombre = dom.inputNombre.value.trim()
    if (nombre.length < 2) {
        dom.crearError.textContent = 'El nombre debe tener al menos 2 caracteres'
        dom.inputNombre.classList.add('shake')
        setTimeout(() => dom.inputNombre.classList.remove('shake'), 400)
        return
    }
    dom.btnCrear.disabled    = true
    dom.btnCrear.textContent = '✨ Despertando...'
    dom.crearError.textContent = ''
    try {
        const res  = await fetch(`${API}/crear`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ nombre })
        })
        const data = await res.json()
        if (data.exito) {
            estado.datosCriatura = data.datos
            mostrarNotificacion(`¡${nombre} ha despertado del huevo espiritual!`)
            setTimeout(() => {
                GestorAudio.detenerTodo()
                mostrarPantalla('juego')
                actualizarJuego(data.datos)
                iniciarTickAutomatico()
                iniciarParticulas(data.datos)
                Huevo.reset()
                setTimeout(() => {
                    GestorAudio.detenerTodo()
                    GestorAudio.reproducirMusica(GestorAudio.getMusicaBosque(data.datos.bosque?.salud ?? 100))
                }, 800)
            }, 1000)
        } else {
            if (data.mensaje.includes('Ya existe')) await cargarEstado()
            else dom.crearError.textContent = data.mensaje
        }
    } catch (error) {
        dom.crearError.textContent = 'Error al conectar con el bosque.'
        console.error(error)
    } finally {
        dom.btnCrear.disabled    = false
        dom.btnCrear.textContent = '✨ Despertar'
    }
})

dom.inputNombre.addEventListener('keypress', (e) => { if (e.key === 'Enter') dom.btnCrear.click() })

// ════════════════════════════════════════════
// CARGAR ESTADO
// ════════════════════════════════════════════

async function cargarEstado() {
    GestorAudio.detenerTodo()
    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()
        if (data.exito) {
            estado.datosCriatura = data.datos
            GestorAudio.detenerTodo()
            mostrarPantalla('juego')
            actualizarJuego(data.datos)
            iniciarTickAutomatico()
            iniciarParticulas(data.datos)
            GestorAudio.reproducirMusica(GestorAudio.getMusicaBosque(data.datos.bosque?.salud ?? 100))
        }
    } catch (error) { console.error('Error al cargar estado:', error) }
}

// ════════════════════════════════════════════
// ACTUALIZAR UI DEL JUEGO
// ════════════════════════════════════════════

function actualizarJuego(datos) {
    if (!datos) return
    const { nombre, fase, tipoEvolucion, estado: est, estadisticas, bosque, diasVividos, diasMaximos, imagenActual, tendencia, urgencias } = datos

    dom.nombreCriatura.textContent = nombre
    dom.faseCriatura.textContent   = obtenerLabelFase(fase, tipoEvolucion)
    dom.diasVividos.textContent    = diasVividos + 1
    if (dom.diasMaximos) dom.diasMaximos.textContent = `/ ${diasMaximos ?? 100}`

    const saludBosque = bosque?.salud ?? 100
    dom.barraBosque.style.width = `${saludBosque}%`
    dom.valorBosque.textContent = saludBosque
    actualizarFondoBosque(saludBosque)

    if (estadisticas) {
        actualizarStat('vitalidad', estadisticas.vitalidad)
        actualizarStat('hambre',    estadisticas.hambre)
        actualizarStat('espiritu',  estadisticas.espiritu)
        actualizarStat('energia',   estadisticas.energia)
        actualizarStat('vinculo',   estadisticas.vinculo)
    }

    // semillas
    if (datos.semillas !== undefined) actualizarSemillas(datos.semillas)
    // inventario / mochila
    if (datos.inventario !== undefined) actualizarMochila(datos.inventario)

    actualizarImagenCriatura(imagenActual, fase, tipoEvolucion)
    if (est?.mensaje) dom.estadoMensaje.textContent = est.mensaje
    actualizarAura(est?.nombre, tipoEvolucion)
    if (est?.acciones) actualizarBotonesAccion(est.acciones)
    actualizarParticulas(saludBosque, tipoEvolucion)
    actualizarBadgeTendencia(tendencia, diasVividos, fase)
    actualizarUrgencias(urgencias, nombre)
    actualizarGuia(datos)

    // ── Alerta bosque crítico ────────────────
    const pantallaJuego = document.getElementById('pantalla-juego')
    if (saludBosque < 30) {
        pantallaJuego?.classList.add('bosque-critico')
        if (!estado.alertaBosqueCritico) {
            estado.alertaBosqueCritico = true
            mostrarNotificacion('🌑 ¡El bosque agoniza! Los árboles se marchitan... Sylvae necesita tu cuidado.', true)
            GestorAudio.reproducirCriatura(GestorAudio.getSonidoCriatura('peligro'))
        }
    } else {
        pantallaJuego?.classList.remove('bosque-critico')
        if (saludBosque >= 30) estado.alertaBosqueCritico = false
    }

    const musicaCorrecta = GestorAudio.getMusicaBosque(saludBosque)
    if (GestorAudio.canales.musica && !GestorAudio.canales.musica.src?.includes(musicaCorrecta.split('/').pop())) {
        GestorAudio.reproducirMusica(musicaCorrecta)
    }

    if (estado.estadoAnterior !== est?.nombre && estado.estadoAnterior !== null) {
        GestorAudio.reproducirCriatura(GestorAudio.getSonidoCriatura(est?.nombre))
    }
    estado.estadoAnterior = est?.nombre

    if (est?.nombre === 'retorno_feliz' || est?.nombre === 'retorno_triste' || est?.nombre === 'perdido') {
        setTimeout(() => mostrarPantallaFin(datos), 2500)
    }
}

function obtenerLabelFase(fase, tipo) {
    const tipoLabel = tipo ? ` · ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}` : ''
    const labels = {
        huevo          : '🥚 Huevo Espiritual',
        base           : '🐾 Sylvae · Fase Joven',
        adulta         : `🌿 Sylvae · Fase Adulta${tipoLabel}`,
        retorno_feliz  : `✨ Retorno al Bosque — Feliz${tipoLabel}`,
        retorno_triste : `💔 Retorno al Bosque — Triste${tipoLabel}`,
        perdido        : '💔 Perdido'
    }
    return labels[fase] || fase
}

function actualizarStat(nombre, valor) {
    const stat = dom.stats[nombre]
    if (!stat) return
    stat.barra.style.width = `${valor}%`
    stat.val.textContent   = Math.round(valor)

    // Color feedback: warn when stat is critical
    stat.barra.classList.remove('stat-critica', 'stat-aviso')
    const esCritica = (nombre === 'vitalidad' && valor < 25)
                   || (nombre === 'hambre'     && valor > 75)
                   || (nombre === 'energia'    && valor < 20)
                   || (nombre === 'vinculo'    && valor < 25)
    const esAviso   = (nombre === 'vitalidad' && valor < 50 && valor >= 25)
                   || (nombre === 'hambre'     && valor > 55 && valor <= 75)
                   || (nombre === 'espiritu'   && valor < 35)
                   || (nombre === 'energia'    && valor < 40 && valor >= 20)
                   || (nombre === 'vinculo'    && valor < 40 && valor >= 25)
    if (esCritica) stat.barra.classList.add('stat-critica')
    else if (esAviso) stat.barra.classList.add('stat-aviso')
}

function actualizarFondoBosque(salud) {
    let fondo = ''
    if (salud >= 75)      fondo = "url('/assets/images/bosque/bosque_100.png')"
    else if (salud >= 50) fondo = "url('/assets/images/bosque/bosque_75.png')"
    else if (salud >= 25) fondo = "url('/assets/images/bosque/bosque_50.png')"
    else                  fondo = "url('/assets/images/bosque/bosque_muerto.png')"
    dom.bosqueFondo.style.backgroundImage    = fondo
    dom.bosqueFondo.style.backgroundSize     = 'cover'
    dom.bosqueFondo.style.backgroundPosition = 'center'
}

// ── Alternancia de idle adulta (base/base2) ──────────────────────────────────
let _idleAdultaInterval = null
let _idleAdultaToggle   = false

function _iniciarIdleAdulta() {
    if (_idleAdultaInterval) return
    _idleAdultaInterval = setInterval(() => {
        // Solo alternar si el estado actual es adulta_paz
        if (estado.datosCriatura?.estado?.nombre !== 'adulta_paz') return
        _idleAdultaToggle = !_idleAdultaToggle
        const img = dom.criaturaSprite.querySelector('img')
        if (img) {
            img.src = _idleAdultaToggle
                ? '/assets/images/criatura/sylvae_adulta_base2.gif'
                : '/assets/images/criatura/sylvae_adulta_base.gif'
        }
    }, 5000)
}

function _detenerIdleAdulta() {
    if (_idleAdultaInterval) { clearInterval(_idleAdultaInterval); _idleAdultaInterval = null }
    _idleAdultaToggle = false
}

function actualizarImagenCriatura(imagenActual, fase, tipo) {
    dom.criaturaSprite.innerHTML = ''
    const img = document.createElement('img')
    img.src   = imagenActual || '/assets/images/criatura/huevo.png'
    img.alt   = 'Sylvae'
    img.onerror = () => {
        const rutaPng = imagenActual?.replace('.gif', '.png')
        if (rutaPng && !img.src.includes('.png')) {
            img.src = rutaPng
        } else if (fase === 'huevo') {
            dom.criaturaSprite.innerHTML      = '🥚'
            dom.criaturaSprite.style.fontSize = '7rem'
        } else {
            img.src = '/assets/images/criatura/sylvae_base_paz.gif'
        }
    }
    dom.criaturaSprite.appendChild(img)

    // Gestionar alternancia idle adulta
    const estadoNombre = estado.datosCriatura?.estado?.nombre || ''
    if (fase === 'adulta' && estadoNombre === 'adulta_paz') {
        _iniciarIdleAdulta()
    } else {
        _detenerIdleAdulta()
    }
}

function obtenerColorTipo(fase) {
    const colores = {
        base           : 'rgba(100,200,120,0.5)',
        adulta         : 'rgba(45,180,78,0.65)',
        retorno_feliz  : 'rgba(255,215,100,0.8)',
        retorno_triste : 'rgba(80,0,0,0.6)',
        perdido        : 'rgba(30,0,0,0.7)'
    }
    return colores[fase] || 'rgba(127,255,127,0.4)'
}

function actualizarAura(estadoNombre, fase) {
    const color = obtenerColorTipo(fase)
    dom.criaturaAura.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`
    const todasClases = ['sylvae-paz','sylvae-alegre','sylvae-somnoliento','sylvae-hambriento',
        'sylvae-triste','sylvae-peligro','sylvae-retorno','sylvae-perdido',
        'sylvae-base-feliz','sylvae-base-triste','sylvae-base-peligro',
        'sylvae-adulta-feliz','sylvae-adulta-triste','sylvae-adulta-peligro',
        'sylvae-retorno-feliz','sylvae-retorno-triste']
    todasClases.forEach(c => dom.criaturaSprite.classList.remove(c))
    const mapaClases = {
        base_feliz     : 'sylvae-base-feliz',
        base_paz       : 'sylvae-paz',
        base_triste    : 'sylvae-base-triste',
        base_peligro   : 'sylvae-base-peligro',
        adulta_feliz   : 'sylvae-adulta-feliz',
        adulta_paz     : 'sylvae-paz',
        adulta_triste  : 'sylvae-adulta-triste',
        adulta_peligro : 'sylvae-adulta-peligro',
        retorno_feliz  : 'sylvae-retorno-feliz',
        retorno_triste : 'sylvae-retorno-triste',
        perdido        : 'sylvae-perdido'
    }
    dom.criaturaSprite.classList.add(mapaClases[estadoNombre] || 'sylvae-paz')
    const img = dom.criaturaSprite.querySelector('img')
    if (img) { img.style.width = '280px'; img.style.height = '280px' }
}

function actualizarBotonesAccion(accionesDisponibles) {
    dom.botonesAccion.forEach(btn => {
        const accion = btn.dataset.accion
        if (!accion) return  // botones sin acción de juego (mochila, etc.) nunca se deshabilitan aquí
        if (!accionesDisponibles.includes(accion) && !btn.classList.contains('en-cooldown')) {
            btn.disabled = true
        }
    })
}

function actualizarBadgeTendencia(tendencia, diasVividos, fase) {
    const badge = document.getElementById('badge-tendencia')
    if (!badge) return
    if (!tendencia) { badge.classList.add('oculto'); return }
    badge.classList.remove('oculto')
    ;['natura','umbra','ignis','aqua','aether','umbris'].forEach(c => badge.classList.remove(c))
    if (tendencia.tipo) badge.classList.add(tendencia.tipo)
    badge.textContent = `${tendencia.icono} ${tendencia.nombre}`
}

let urgenciaOverlay = null, urgenciaTimeout = null

function actualizarUrgencias(urgencias, nombre) {
    if (!urgencias || urgencias.length === 0) { limpiarUrgencias(); return }
    const critica = urgencias.find(u => u.nivel === 'critica')
    const actual  = critica || urgencias[0]
    if (!urgenciaOverlay) {
        urgenciaOverlay = document.createElement('div')
        urgenciaOverlay.className = 'urgencia-overlay'
        document.getElementById('pantalla-juego').appendChild(urgenciaOverlay)
    }
    urgenciaOverlay.className = `urgencia-overlay ${actual.nivel}`
    if (!urgenciaTimeout) {
        mostrarNotificacion(`${actual.icono} ${actual.mensaje}`, true)
        GestorAudio.reproducirCriatura(GestorAudio.getSonidoCriatura(actual.nivel === 'critica' ? 'peligro' : 'triste'))
        urgenciaTimeout = setTimeout(() => { urgenciaTimeout = null }, 15000)
    }
}

function limpiarUrgencias() {
    if (urgenciaOverlay) urgenciaOverlay.className = 'urgencia-overlay'
}

// ════════════════════════════════════════════
// PANEL DE GUÍA — dice al jugador qué hacer
// ════════════════════════════════════════════

function actualizarGuia(datos) {
    const panel = document.getElementById('guia-panel')
    if (!panel) return
    const { estadisticas, bosque, inventario } = datos || {}
    if (!estadisticas) return

    const { vitalidad, hambre, espiritu, energia, vinculo } = estadisticas
    const saludBosque = bosque?.salud ?? 50

    // Determinar la situación más urgente
    let prioridad    = 'ok'
    let icono        = '✨'
    let titulo       = '¡Sylvae está bien!'
    let consejo      = 'Sigue cuidando a Sylvae. Cada acción mantiene el bosque vivo.'
    let accionBtn    = null
    let accionLabel  = ''

    if (vitalidad < 20) {
        prioridad   = 'peligro'
        icono       = '🚨'
        titulo      = '¡PELIGRO! Sylvae puede morir'
        consejo     = 'La vitalidad está crítica. Báñala (❤️+15) o aliméntala (❤️+10) ahora mismo.'
        accionBtn   = 'bañar'
        accionLabel = '💧 Bañar ahora'
    } else if (hambre > 80) {
        prioridad   = 'urgente'
        icono       = '🍃'
        titulo      = 'Sylvae tiene mucha hambre'
        consejo     = 'El hambre alta daña la vitalidad con cada minuto. ¡Aliméntala pronto!'
        accionBtn   = 'alimentar'
        accionLabel = '🍃 Alimentar'
    } else if (energia < 20) {
        prioridad   = 'urgente'
        icono       = '💤'
        titulo      = 'Sylvae está agotada'
        consejo     = 'Sin energía no puede jugar ni crecer bien. Hazla dormir (⚡+40).'
        accionBtn   = 'dormir'
        accionLabel = '🌙 Dormir'
    } else if (vinculo < 25) {
        prioridad   = 'urgente'
        icono       = '💔'
        titulo      = 'El vínculo se está rompiendo'
        consejo     = 'Sylvae se siente sola. Háblale (💚+5) o medita juntos (💚+20, 🌱+3 semillas).'
        accionBtn   = 'hablar'
        accionLabel = '💬 Hablar'
    } else if (hambre > 60) {
        prioridad   = 'aviso'
        icono       = '🍃'
        titulo      = 'Sylvae empieza a tener hambre'
        consejo     = 'Si el hambre pasa de 70, la vitalidad empieza a bajar. ¡Aliméntala!'
        accionBtn   = 'alimentar'
        accionLabel = '🍃 Alimentar'
    } else if (espiritu < 35) {
        prioridad   = 'aviso'
        icono       = '✨'
        titulo      = 'El espíritu de Sylvae decae'
        consejo     = 'Para estar feliz necesita espíritu > 75. Juega con ella (✨+25) o medita (✨+10).'
        accionBtn   = 'jugar'
        accionLabel = '🎵 Jugar'
    } else if (saludBosque < 30) {
        if ((inventario?.semilla_sagrada ?? 0) > 0) {
            prioridad   = 'urgente'
            icono       = '🌿'
            titulo      = 'El bosque agoniza — ¡usa tu Semilla!'
            consejo     = 'Tienes una Semilla Sagrada en la mochila. Úsala para sanar el bosque (+25).'
            accionBtn   = 'mochila'
            accionLabel = '🎒 Abrir mochila'
        } else {
            prioridad   = 'aviso'
            icono       = '🌿'
            titulo      = 'El bosque enferma'
            consejo     = 'Cuida más a Sylvae. Cada acción da salud al bosque. Meditar da +6.'
            accionBtn   = 'meditar'
            accionLabel = '🌿 Meditar'
        }
    } else if (vitalidad < 50) {
        prioridad   = 'info'
        icono       = '💡'
        titulo      = 'Tip: la vitalidad baja'
        consejo     = 'Báñala (❤️+15) o aliméntala (❤️+10) para recuperar vitalidad.'
        accionBtn   = 'bañar'
        accionLabel = '💧 Bañar'
    } else if (vinculo < 50) {
        prioridad   = 'info'
        icono       = '💡'
        titulo      = 'Tip: el vínculo puede mejorar'
        consejo     = 'Habla con Sylvae o medita juntos. La meditación también da 3 semillas 🌱.'
        accionBtn   = 'meditar'
        accionLabel = '🌿 Meditar'
    } else if (espiritu < 65) {
        prioridad   = 'info'
        icono       = '💡'
        titulo      = 'Tip: sube el espíritu'
        consejo     = 'Para que Sylvae esté feliz necesita espíritu > 75. Juega con ella.'
        accionBtn   = 'jugar'
        accionLabel = '🎵 Jugar'
    } else if (saludBosque < 60) {
        prioridad   = 'info'
        icono       = '🌿'
        titulo      = 'Tip: el bosque puede mejorar'
        consejo     = 'Meditar da +6 al bosque y 3 semillas 🌱. ¡La mejor acción para el bosque!'
        accionBtn   = 'meditar'
        accionLabel = '🌿 Meditar'
    } else {
        // Todo bien — sugerir para llegar a estado feliz
        if (espiritu < 75 || vinculo < 65) {
            prioridad   = 'ok'
            icono       = '🌟'
            titulo      = 'Casi perfecta'
            if (espiritu < 75) {
                consejo   = 'Para que Sylvae esté feliz necesita espíritu > 75. ¡Juega con ella!'
                accionBtn = 'jugar'
                accionLabel = '🎵 Jugar'
            } else {
                consejo   = 'El vínculo necesita > 65 para que Sylvae sea feliz. ¡Medita o habla!'
                accionBtn = 'meditar'
                accionLabel = '🌿 Meditar'
            }
        }
    }

    // Construir HTML
    const btnHTML = accionBtn
        ? `<button class="guia-btn" data-guia-accion="${accionBtn}">${accionLabel}</button>`
        : ''

    panel.innerHTML = `
        <div class="guia-indicador"></div>
        <div class="guia-contenido">
            <div class="guia-titulo">${icono} ${titulo}</div>
            <div class="guia-consejo">${consejo}</div>
            ${btnHTML}
        </div>`
    panel.className = `guia-panel guia-${prioridad}`

    // Listener del botón de acción rápida
    const btn = panel.querySelector('.guia-btn')
    if (btn) {
        btn.addEventListener('click', () => {
            const accion = btn.dataset.guiaAccion
            if (accion === 'mochila') {
                document.getElementById('btn-mochila')?.click()
            } else {
                document.querySelector(`.btn-accion[data-accion="${accion}"]`)?.click()
            }
        })
    }
}

// ════════════════════════════════════════════
// EJECUTAR ACCIONES
// ════════════════════════════════════════════

dom.botonesAccion.forEach(btn => {
    btn.addEventListener('click', async () => {
        if (btn.disabled) return
        await ejecutarAccion(btn.dataset.accion, btn)
    })
})

async function ejecutarAccion(nombreAccion, btn) {
    btn.disabled = true
    const cooldownSegundos = MODOS[modoActual].cooldowns[nombreAccion] || 60
    GestorAudio.reproducirEfecto(`/assets/sounds/acciones/${nombreAccion}.mp3`, 8000)
    _reaccionSylvae(nombreAccion)
    try {
        const res  = await fetch(`${API}/accion`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ nombreAccion, demo: modoActual === 'demo' })
        })
        const data = await res.json()
        if (data.exito) {
            const faseAnterior = estado.datosCriatura?.fase
            const faseNueva    = data.datos?.fase
            if (faseAnterior !== faseNueva) {
                GestorAudio.reproducirEvento('/assets/sounds/eventos/evolucion.mp3', 4000)
                mostrarNotificacion(`✨ ¡${data.datos.nombre} ha evolucionado a ${obtenerLabelFase(faseNueva, data.datos.tipoEvolucion)}!`)
            }
            estado.datosCriatura = data.datos
            actualizarJuego(data.datos)
            mostrarNotificacion(data.mensaje)
            // mostrar logros desbloqueados
            if (data.logros?.length) {
                data.logros.forEach((logro, i) => setTimeout(() => mostrarLogro(logro), 500 + i * 2000))
            }
            // mostrar advertencias por exceso
            if (data.advertencias?.length) {
                data.advertencias.forEach((adv, i) => {
                    setTimeout(() => mostrarNotificacion(`${adv.icono} ${adv.mensaje}`, true), i * 1500)
                })
            }
            CooldownManager.iniciar(nombreAccion, cooldownSegundos)
        } else {
            mostrarNotificacion(data.mensaje, true)
            btn.disabled = false
        }
    } catch (error) {
        mostrarNotificacion('Error al conectar con el bosque', true)
        btn.disabled = false
        console.error(error)
    }
}

// ════════════════════════════════════════════
// TICK AUTOMÁTICO — con pausa al salir de pestaña
// ════════════════════════════════════════════

function iniciarTickAutomatico() {
    if (estado.tickInterval) clearInterval(estado.tickInterval)
    estado.tickInterval = setInterval(async () => {
        // no hacer tick si la pestaña está oculta
        if (document.hidden) return
        try {
            const res  = await fetch(`${API}/tick`, { method: 'POST' })
            const data = await res.json()
            if (data.exito) {
                actualizarJuego(data.datos)
                if (data.evento) setTimeout(() => mostrarEventoEspecial(data.evento), 1000)
                if (data.logros?.length) {
                    data.logros.forEach((logro, i) => setTimeout(() => mostrarLogro(logro), 800 + i * 2000))
                }
                if (data.semillasBonus) {
                    setTimeout(() => mostrarNotificacion('🌳 +1 semilla — ¡El bosque prospera!'), 1200)
                }
            }
        } catch (error) { console.error('Error en tick:', error) }
    }, 30000)
}

// ── Pausa visual cuando el usuario cambia de pestaña ─────────────────────────
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pausar música al salir
        if (estado.pantalla === 'juego') {
            GestorAudio.pausarMusica()
        }
    } else {
        // Reanudar música al volver
        if (estado.pantalla === 'juego' && estado.datosCriatura) {
            const salud = estado.datosCriatura.bosque?.salud ?? 100
            GestorAudio.reproducirMusica(GestorAudio.getMusicaBosque(salud))
        }
    }
})

// ════════════════════════════════════════════
// PARTÍCULAS
// ════════════════════════════════════════════

let contenedorParticulas = null

function iniciarParticulas(datos) {
    if (!contenedorParticulas) {
        contenedorParticulas = document.createElement('div')
        contenedorParticulas.id = 'particulas-contenedor'
        contenedorParticulas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden;'
        document.getElementById('pantalla-juego').appendChild(contenedorParticulas)
    }
    actualizarParticulas(datos?.bosque?.salud ?? 100, datos?.tipoEvolucion)
}

function actualizarParticulas(saludBosque, tipo) {
    if (!contenedorParticulas) return
    contenedorParticulas.innerHTML = ''
    if (estado.particulasInterval) clearInterval(estado.particulasInterval)
    if (saludBosque >= 75) {
        estado.particulasInterval = setInterval(() => { crearMariposa(); if (Math.random() > 0.5) crearLuciernaga() }, 800)
    } else if (saludBosque >= 50) {
        estado.particulasInterval = setInterval(() => crearHoja(), 600)
    } else if (saludBosque >= 25) {
        estado.particulasInterval = setInterval(() => { crearHojaSeca(); if (Math.random() > 0.7) crearHoja() }, 400)
    } else {
        estado.particulasInterval = setInterval(() => crearCeniza(), 300)
    }
}

function crearMariposa() {
    const el = document.createElement('div')
    const emojis = ['🦋','🦋','🌸','🦋']
    const duration = 6000 + Math.random() * 4000
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)]
    el.style.cssText = `position:absolute;font-size:${0.8+Math.random()*0.8}rem;left:${Math.random()*window.innerWidth}px;bottom:-30px;opacity:0;animation:volarMariposa ${duration}ms ease-in-out forwards;pointer-events:none;`
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearLuciernaga() {
    const el = document.createElement('div')
    const duration = 3000 + Math.random() * 3000
    el.style.cssText = `position:absolute;width:6px;height:6px;background:radial-gradient(circle,#7fff7f,transparent);border-radius:50%;left:${Math.random()*window.innerWidth}px;top:${Math.random()*window.innerHeight}px;animation:pulsarLuciernaga ${duration}ms ease-in-out forwards;pointer-events:none;box-shadow:0 0 8px #7fff7f;`
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearHoja() {
    const el = document.createElement('div')
    const emojis = ['🍃','🌿','🍀']
    const duration = 4000 + Math.random() * 3000
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)]
    el.style.cssText = `position:absolute;font-size:${0.6+Math.random()*0.6}rem;left:${Math.random()*window.innerWidth}px;top:-20px;opacity:0.7;animation:caerHoja ${duration}ms ease-in forwards;pointer-events:none;`
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearHojaSeca() {
    const el = document.createElement('div')
    const emojis = ['🍂','🍁','🍂']
    const duration = 3000 + Math.random() * 2000
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)]
    el.style.cssText = `position:absolute;font-size:${0.6+Math.random()*0.8}rem;left:${Math.random()*window.innerWidth}px;top:-20px;opacity:0.6;animation:caerHoja ${duration}ms ease-in forwards;pointer-events:none;`
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearCeniza() {
    const el = document.createElement('div')
    const duration = 4000 + Math.random() * 3000
    el.style.cssText = `position:absolute;width:${3+Math.random()*4}px;height:${3+Math.random()*4}px;background:rgba(150,100,100,0.6);border-radius:50%;left:${Math.random()*window.innerWidth}px;top:-10px;animation:caerHoja ${duration}ms ease-in forwards;pointer-events:none;`
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

// ════════════════════════════════════════════
// NOTIFICACIONES
// ════════════════════════════════════════════

let notifTimeout = null

function mostrarNotificacion(mensaje, esError = false) {
    dom.notificacion.textContent = mensaje
    dom.notificacion.classList.toggle('error', esError)
    dom.notificacion.classList.add('visible')
    if (notifTimeout) clearTimeout(notifTimeout)
    notifTimeout = setTimeout(() => dom.notificacion.classList.remove('visible'), 3000)
}

// ════════════════════════════════════════════
// SISTEMA DE LOGROS
// ════════════════════════════════════════════

function mostrarLogro(logro) {
    const el = document.createElement('div')
    el.className = 'logro-notificacion'
    el.innerHTML = `<div class="logro-icono">${logro.icono}</div><div class="logro-contenido"><div class="logro-titulo">${logro.titulo}</div><div class="logro-mensaje">${logro.mensaje}</div></div>`
    document.body.appendChild(el)
    GestorAudio.reproducirEfecto('/assets/sounds/eventos/evolucion.mp3', 2000)
    setTimeout(() => el.classList.add('visible'), 100)
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 500) }, 4000)
}

// ════════════════════════════════════════════
// EVENTOS ESPECIALES
// ════════════════════════════════════════════

function mostrarEventoEspecial(evento) {
    if (!evento) return
    const el = document.createElement('div')
    el.className = 'evento-especial'
    el.innerHTML = `<div class="evento-fondo"></div><div class="evento-contenido"><div class="evento-icono">${evento.icono}</div><div class="evento-titulo">${evento.titulo}</div><div class="evento-mensaje">${evento.mensaje}</div><button class="evento-cerrar" onclick="this.parentElement.parentElement.remove()">Continuar →</button></div>`
    document.body.appendChild(el)
    setTimeout(() => el.classList.add('visible'), 100)
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 500) }, 8000)
    GestorAudio.reproducirEfecto('/assets/sounds/eventos/evolucion.mp3', 3000)
}

// ════════════════════════════════════════════
// PANTALLA FIN
// ════════════════════════════════════════════

function mostrarPantallaFin(datos) {
    if (estado.tickInterval)     clearInterval(estado.tickInterval)
    if (tickDemoInterval)        clearInterval(tickDemoInterval)
    if (estado.particulasInterval) clearInterval(estado.particulasInterval)
    _detenerIdleAdulta()
    CooldownManager.limpiarTodos()
    GestorAudio.detenerTodo()

    const resumen     = datos.resumen
    const estadoNom   = datos.estado?.nombre
    const esRetornoFeliz = estadoNom === 'retorno_feliz'
    const esPerdido      = estadoNom === 'perdido'

    // música de fin
    setTimeout(() => {
        if (esRetornoFeliz) {
            GestorAudio.reproducirMusica('/assets/sounds/eventos/retorno.mp3')
        } else {
            GestorAudio.reproducirMusica('/assets/sounds/ambiente/bosque_enfermo.mp3')
        }
    }, 500)

    document.getElementById('fin-icono').textContent  = esRetornoFeliz ? '✨' : '💔'
    document.getElementById('fin-titulo').textContent = esRetornoFeliz
        ? '¡El ciclo se completa con amor!'
        : esPerdido ? 'El vínculo se ha roto...' : 'El ciclo termina en tristeza...'

    const imgFin = document.getElementById('fin-criatura-img')
    if (imgFin) imgFin.src = datos.imagenActual || '/assets/images/criatura/huevo.png'

    const auraFin = document.getElementById('fin-criatura-aura')
    if (auraFin) auraFin.style.background = `radial-gradient(circle, ${obtenerColorTipo(datos.fase)} 0%, transparent 70%)`

    document.getElementById('fin-dias').textContent   = `${resumen?.diasVividos ?? 0}/${resumen?.diasMaximos ?? 100}`
    document.getElementById('fin-bosque').textContent = `${datos.bosque?.salud ?? 0}%`

    if (resumen?.logroMaximo) {
        document.getElementById('fin-logro-icono').textContent = resumen.logroMaximo.icono
        document.getElementById('fin-logro').textContent       = resumen.logroMaximo.nombre
    }

    document.getElementById('fin-evolucion-valor').textContent = obtenerLabelFase(datos.fase, null)
    document.getElementById('fin-mensaje').textContent         = resumen?.mensaje || 'El bosque recuerda.'

    mostrarPantalla('fin')
}

dom.btnReiniciar.addEventListener('click', async () => {
    try { await fetch(`${API}/reiniciar`, { method: 'DELETE' }) } catch(e) {}
    estado.datosCriatura = null
    estado.estadoAnterior = null
    dom.inputNombre.value = ''
    if (contenedorParticulas) contenedorParticulas.innerHTML = ''
    CooldownManager.limpiarTodos()
    GestorAudio.pausarMusica()
    mostrarPantalla('crear')
    setTimeout(() => Huevo.init(), 300)
})

document.getElementById('btn-ver-historial')?.addEventListener('click', () => {
    const panel = document.getElementById('panel-historial')
    if (panel) {
        panel.classList.remove('oculto')
        cargarHistorial()
    }
})

// ════════════════════════════════════════════
// PANEL HISTORIAL
// ════════════════════════════════════════════

const btnAbrirHistorial  = document.getElementById('btn-abrir-historial')
const btnCerrarHistorial = document.getElementById('btn-cerrar-historial')
const panelHistorial     = document.getElementById('panel-historial')
const historialContenido = document.getElementById('historial-contenido')

btnAbrirHistorial?.addEventListener('click', async () => {
    panelHistorial.classList.toggle('oculto')
    if (!panelHistorial.classList.contains('oculto')) await cargarHistorial()
})

btnCerrarHistorial?.addEventListener('click', () => panelHistorial.classList.add('oculto'))

async function cargarHistorial() {
    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()
        if (!data.exito) return
        const registros = data.datos.historial || []
        historialContenido.innerHTML = ''
        if (registros.length === 0) {
            historialContenido.innerHTML = '<p style="color:var(--color-texto-suave);font-size:0.8rem;text-align:center;padding:1rem">Sin registros aún</p>'
            return
        }
        const iconosTipo = { ACCION:'⚡', EVOLUCION:'✨', DIA:'📅', ESTADO:'🔄' }
        registros.forEach(reg => {
            const el = document.createElement('div')
            el.className = `historial-item ${reg.tipo}`
            const tiempo = new Date(reg.timestamp).toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })
            let texto = ''
            if (reg.tipo === 'ACCION')    texto = `${reg.datos.accion} → ${reg.datos.mensaje}`
            if (reg.tipo === 'EVOLUCION') texto = `${reg.datos.de} → ${reg.datos.a}`
            if (reg.tipo === 'DIA')       texto = `Día ${reg.datos.dia} — ${reg.datos.estado}`
            if (reg.tipo === 'ESTADO')    texto = `${reg.datos.de || '?'} → ${reg.datos.a}`
            el.innerHTML = `<span class="historial-icono">${iconosTipo[reg.tipo] || '📌'}</span><div class="historial-texto"><span class="historial-accion">${texto}</span><span class="historial-tiempo">${tiempo}</span></div>`
            historialContenido.appendChild(el)
        })
    } catch (error) { console.error('Error cargando historial:', error) }
}

function mostrarBotonesJuego(visible) {
    const btnH = document.getElementById('btn-abrir-historial')
    const btnT = document.getElementById('btn-tienda')
    const btnM = document.getElementById('btn-minijuegos')
    if (btnH) btnH.style.display = visible ? 'flex' : 'none'
    if (btnT) btnT.style.display = visible ? 'inline-flex' : 'none'
    if (btnM) btnM.style.display = visible ? 'inline-flex' : 'none'
}

// ════════════════════════════════════════════
// SISTEMA DE SEMILLAS Y TIENDA
// ════════════════════════════════════════════

function actualizarSemillas(cantidad) {
    const el1 = document.getElementById('semillas-valor')
    const el2 = document.getElementById('tienda-semillas')
    if (el1) el1.textContent = cantidad
    if (el2) el2.textContent = cantidad
}

document.getElementById('btn-tienda')?.addEventListener('click', () => {
    document.getElementById('panel-tienda').classList.remove('oculto')
})

document.getElementById('btn-cerrar-tienda')?.addEventListener('click', () => {
    document.getElementById('panel-tienda').classList.add('oculto')
})

document.querySelectorAll('.tienda-item .btn-comprar').forEach(btn => {
    btn.addEventListener('click', async () => {
        const item = btn.closest('.tienda-item').dataset.item
        await comprarItemTienda(item, btn)
    })
})

async function comprarItemTienda(item, btn) {
    btn.disabled = true
    btn.textContent = '...'
    try {
        const res  = await fetch(`${API}/comprar`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ item })
        })
        const data = await res.json()
        if (data.exito) {
            actualizarSemillas(data.semillas)
            if (data.datos) {
                estado.datosCriatura = data.datos
                actualizarJuego(data.datos)
            } else if (data.inventario) {
                actualizarMochila(data.inventario)
            }
            mostrarNotificacion(data.mensaje)
            document.getElementById('panel-tienda').classList.add('oculto')
        } else {
            mostrarNotificacion(data.mensaje, true)
        }
    } catch (error) {
        mostrarNotificacion('Error al conectar con la tienda', true)
    } finally {
        btn.disabled    = false
        btn.textContent = 'Comprar'
    }
}

// ════════════════════════════════════════════
// MOCHILA / INVENTARIO
// ════════════════════════════════════════════

const ITEMS_INFO = {
    hierba_fresca   : { nombre: 'Hierba Fresca',      icono: '🍃', efecto: 'Hambre -20' },
    fruta_encantada : { nombre: 'Fruta Encantada',    icono: '🍎', efecto: 'Hambre -40 · Espíritu +10' },
    miel_bosque     : { nombre: 'Miel del Bosque',    icono: '🍯', efecto: 'Hambre -60 · Vitalidad +20' },
    nectar_sagrado  : { nombre: 'Néctar Sagrado',     icono: '🌺', efecto: 'Cura hambre · Todo +10' },
    pocion_energia  : { nombre: 'Poción de Energía',  icono: '💊', efecto: 'Energía +50' },
    pocion_vinculo  : { nombre: 'Poción de Vínculo',  icono: '💜', efecto: 'Vínculo +30' },
    pocion_curativa : { nombre: 'Poción Curativa',    icono: '🔮', efecto: 'Vitalidad +30 · Espíritu +20' },
    semilla_sagrada : { nombre: 'Semilla Sagrada',    icono: '🌱', efecto: 'Bosque +25 salud' }
}

function actualizarMochila(inventario) {
    if (!inventario) return
    const btn   = document.getElementById('btn-mochila')
    const badge = document.getElementById('mochila-badge')
    const total = Object.values(inventario).reduce((s, q) => s + q, 0)
    if (badge) badge.textContent = total > 0 ? total : ''
    if (btn)   btn.disabled = false  // nunca debe quedar bloqueada
    const panel = document.getElementById('panel-mochila')
    if (panel && !panel.classList.contains('oculto')) renderMochila(inventario)
}

function renderMochila(inventario) {
    const contenido = document.getElementById('mochila-contenido')
    if (!contenido) return
    const items = Object.entries(inventario || {}).filter(([, qty]) => qty > 0)
    if (items.length === 0) {
        contenido.innerHTML = '<p style="color:var(--color-texto-suave);text-align:center;padding:2rem;font-size:0.85rem">Tu mochila está vacía.<br>Visita la tienda para comprar ítems.</p>'
        return
    }
    contenido.innerHTML = ''
    items.forEach(([id, qty]) => {
        const info = ITEMS_INFO[id] || { nombre: id, icono: '📦', efecto: '' }
        const el   = document.createElement('div')
        el.className = 'mochila-item'
        el.dataset.item = id
        el.innerHTML = `
            <div class="item-icono">${info.icono}</div>
            <div class="item-info">
                <div class="item-nombre">${info.nombre}</div>
                <div class="item-efecto">${info.efecto}</div>
            </div>
            <div class="item-cantidad">x${qty}</div>
            <button class="btn-usar-item" data-item="${id}">Usar</button>`
        contenido.appendChild(el)
    })
}

document.getElementById('btn-mochila')?.addEventListener('click', () => {
    const panel = document.getElementById('panel-mochila')
    if (!panel) return
    panel.classList.remove('oculto')
    renderMochila(estado.datosCriatura?.inventario || {})
})

document.getElementById('btn-cerrar-mochila')?.addEventListener('click', () => {
    document.getElementById('panel-mochila')?.classList.add('oculto')
})

document.addEventListener('click', async (e) => {
    const btnUsar = e.target.closest('.btn-usar-item')
    if (!btnUsar) return
    const item = btnUsar.dataset.item
    if (!item) return
    btnUsar.disabled    = true
    btnUsar.textContent = '...'
    try {
        const res  = await fetch(`${API}/usar-item`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ item })
        })
        const data = await res.json()
        if (data.exito) {
            if (data.datos) {
                estado.datosCriatura = data.datos
                actualizarJuego(data.datos)
            } else if (data.inventario) {
                actualizarMochila(data.inventario)
            }
            mostrarNotificacion(data.mensaje)
            GestorAudio.reproducirEfecto('/assets/sounds/acciones/alimentar.mp3', 1500)
        } else {
            mostrarNotificacion(data.mensaje, true)
            btnUsar.disabled    = false
            btnUsar.textContent = 'Usar'
        }
    } catch (error) {
        mostrarNotificacion('Error al usar el ítem', true)
        btnUsar.disabled    = false
        btnUsar.textContent = 'Usar'
    }
})

// ════════════════════════════════════════════
// MINIJUEGOS CON ALDEANOS
// ════════════════════════════════════════════

const Minijuego = {
    activo: false, puntos: 0, timer: null, intervalo: null,

    abrir() {
        document.getElementById('panel-minijuegos').classList.remove('oculto')
        document.getElementById('area-minijuego').classList.add('oculto')
        document.getElementById('mj-resultado').classList.add('oculto')
    },

    cerrar() {
        document.getElementById('panel-minijuegos').classList.add('oculto')
        this.limpiar()
    },

    limpiar() {
        if (this.timer)     clearTimeout(this.timer)
        if (this.intervalo) clearInterval(this.intervalo)
        this.activo = false
        this.puntos = 0
        document.getElementById('mj-pantalla').innerHTML = ''
    },

    iniciarHierbas() {
        this.limpiar()
        this.activo = true
        this.puntos = 0
        const pantalla = document.getElementById('mj-pantalla')
        document.getElementById('area-minijuego').classList.remove('oculto')
        document.getElementById('mj-resultado').classList.add('oculto')
        let tiempoRestante = 15
        pantalla.innerHTML = `<div class="mj-timer" id="mj-timer">⏱ ${tiempoRestante}s | 🌿 0</div>`
        this.intervalo = setInterval(() => {
            if (!this.activo) return
            const hierba = document.createElement('div')
            hierba.className  = 'mj-objeto'
            hierba.textContent = ['🌿','🍃','🌱','🌾'][Math.floor(Math.random()*4)]
            hierba.style.left = `${10+Math.random()*80}%`
            hierba.style.top  = `${10+Math.random()*70}%`
            hierba.addEventListener('click', () => {
                this.puntos++
                const t = document.getElementById('mj-timer')
                if (t) t.textContent = `⏱ ${tiempoRestante}s | 🌿 ${this.puntos}`
                hierba.remove()
                GestorAudio.reproducirEfecto('/assets/sounds/acciones/alimentar.mp3', 500)
            })
            pantalla.appendChild(hierba)
            setTimeout(() => hierba.remove(), 2000)
        }, 800)
        const countdown = setInterval(() => {
            tiempoRestante--
            const t = document.getElementById('mj-timer')
            if (t) t.textContent = `⏱ ${tiempoRestante}s | 🌿 ${this.puntos}`
            if (tiempoRestante <= 0) clearInterval(countdown)
        }, 1000)
        this.timer = setTimeout(() => {
            this.activo = false
            clearInterval(this.intervalo)
            this.mostrarResultado(Math.min(15, 5+this.puntos), `¡Recolectaste ${this.puntos} hierbas!`)
        }, 15000)
    },

    iniciarRunas() {
        this.limpiar()
        this.activo = true
        const pantalla = document.getElementById('mj-pantalla')
        document.getElementById('area-minijuego').classList.remove('oculto')
        const runas = ['🔥','💧','🌿','⚡','🌙','✨','🌀','💎']
        const secuencia = [], respuesta = []
        let mostrandoSecuencia = false, nivel = 1

        const generarSecuencia = () => {
            secuencia.push(runas[Math.floor(Math.random()*runas.length)])
            mostrandoSecuencia = true
            pantalla.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--color-texto-suave);font-size:0.85rem">Memoriza la secuencia...</div><div class="runas-grid">${secuencia.map(r=>`<div class="runa-btn activa">${r}</div>`).join('')}</div>`
            setTimeout(() => {
                mostrandoSecuencia = false
                respuesta.length = 0
                pantalla.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--color-texto);font-size:0.85rem">¡Repite la secuencia! (${secuencia.length} runas)</div><div class="runas-grid">${runas.map(r=>`<button class="runa-btn" data-runa="${r}">${r}</button>`).join('')}</div>`
                pantalla.querySelectorAll('.runa-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (mostrandoSecuencia) return
                        respuesta.push(btn.dataset.runa)
                        const idx = respuesta.length - 1
                        if (respuesta[idx] === secuencia[idx]) {
                            btn.classList.add('correcta')
                            setTimeout(() => btn.classList.remove('correcta'), 300)
                            if (respuesta.length === secuencia.length) {
                                nivel++
                                if (nivel > 4) this.mostrarResultado(10+(nivel*2), `¡Completaste ${nivel-1} rondas!`)
                                else setTimeout(generarSecuencia, 800)
                            }
                        } else {
                            btn.classList.add('incorrecta')
                            setTimeout(() => this.mostrarResultado(Math.max(5,nivel*3), `Fallaste en ronda ${nivel}. ¡Bien hecho!`), 500)
                        }
                    })
                })
            }, secuencia.length * 600 + 500)
        }
        generarSecuencia()
    },

    iniciarLuciernagas() {
        this.limpiar()
        this.activo = true
        this.puntos = 0
        const pantalla = document.getElementById('mj-pantalla')
        document.getElementById('area-minijuego').classList.remove('oculto')
        let tiempoRestante = 20
        pantalla.innerHTML = `<div class="mj-timer" id="mj-timer">⏱ ${tiempoRestante}s | ✨ 0</div>`
        this.intervalo = setInterval(() => {
            if (!this.activo) return
            const luc = document.createElement('div')
            luc.className = 'mj-objeto'
            luc.textContent = '✨'
            luc.style.left = `${5+Math.random()*85}%`
            luc.style.top  = `${5+Math.random()*75}%`
            luc.style.transition = 'all 1.5s ease'
            luc.addEventListener('click', () => {
                this.puntos++
                const t = document.getElementById('mj-timer')
                if (t) t.textContent = `⏱ ${tiempoRestante}s | ✨ ${this.puntos}`
                luc.remove()
                GestorAudio.reproducirEfecto('/assets/sounds/acciones/meditar.mp3', 500)
            })
            pantalla.appendChild(luc)
            setTimeout(() => { luc.style.left = `${5+Math.random()*85}%`; luc.style.top = `${5+Math.random()*75}%` }, 100)
            setTimeout(() => luc.remove(), 2500)
        }, 600)
        const countdown = setInterval(() => {
            tiempoRestante--
            const t = document.getElementById('mj-timer')
            if (t) t.textContent = `⏱ ${tiempoRestante}s | ✨ ${this.puntos}`
            if (tiempoRestante <= 0) clearInterval(countdown)
        }, 1000)
        this.timer = setTimeout(() => {
            this.activo = false
            clearInterval(this.intervalo)
            this.mostrarResultado(Math.min(18, 8+this.puntos), `¡Atrapaste ${this.puntos} luciérnagas!`)
        }, 20000)
    },

    async mostrarResultado(semillas, mensaje) {
        this.limpiar()
        const resultado = document.getElementById('mj-resultado')
        document.getElementById('mj-pantalla').innerHTML = ''
        resultado.classList.remove('oculto')
        resultado.innerHTML = `<div style="font-size:2rem">🎉</div><div>${mensaje}</div><div style="color:#7fff7f;font-size:1.5rem">+${semillas} 🌱</div>`
        GestorAudio.reproducirEfecto('/assets/sounds/eventos/evolucion.mp3', 2000)
        try {
            const res  = await fetch(`${API}/minijuego`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ semillasGanadas: semillas })
            })
            const data = await res.json()
            if (data.exito) {
                actualizarSemillas(data.semillas)
                actualizarJuego(data.datos)
                mostrarNotificacion(`+${semillas} 🌱 Semillas ganadas!`)
            }
        } catch (error) { console.error('Error al guardar semillas:', error) }
        setTimeout(() => this.cerrar(), 3000)
    }
}

// ── Event delegation para minijuegos y tienda ──
document.addEventListener('click', (e) => {

    // abrir minijuegos
    if (e.target.closest('#btn-minijuegos')) {
        Minijuego.abrir()
        return
    }

    // cerrar minijuegos
    if (e.target.closest('#btn-cerrar-minijuegos')) {
        Minijuego.cerrar()
        return
    }

    // cerrar tienda
    if (e.target.closest('#btn-cerrar-tienda')) {
        document.getElementById('panel-tienda').classList.add('oculto')
        return
    }

    // cerrar historial
    if (e.target.closest('#btn-cerrar-historial')) {
        document.getElementById('panel-historial').classList.add('oculto')
        return
    }

    // botones jugar minijuego
    const btnJugar = e.target.closest('.btn-jugar-mini')
    if (btnJugar) {
        const juego = btnJugar.dataset.juego
        if (juego === 'hierbas')     Minijuego.iniciarHierbas()
        if (juego === 'runas')       Minijuego.iniciarRunas()
        if (juego === 'luciernagas') Minijuego.iniciarLuciernagas()
        return
    }

    // botones comprar tienda
    const btnComprar = e.target.closest('.tienda-item .btn-comprar')
    if (btnComprar) {
        const item = btnComprar.closest('.tienda-item').dataset.item
        comprarItemTienda(item, btnComprar)
        return
    }

    // cerrar modal al hacer click en el overlay (fondo oscuro, no en el contenido)
    if (e.target.matches('.panel-modal')) {
        e.target.classList.add('oculto')
        Minijuego.limpiar()
        return
    }
    if (e.target.matches('#panel-mochila')) {
        e.target.classList.add('oculto')
        return
    }
})

// ════════════════════════════════════════════
// PANTALLA TÍTULO
// ════════════════════════════════════════════

function iniciarParticulasTitulo() {
    if (!dom.tituloParticulas) return
    setInterval(() => {
        const el = document.createElement('div')
        const emojis = ['🦋','🌸','✨','🍃','🌿']
        const duration = 5000 + Math.random() * 5000
        el.textContent = emojis[Math.floor(Math.random()*emojis.length)]
        el.style.cssText = `position:absolute;font-size:${0.6+Math.random()*1}rem;left:${Math.random()*window.innerWidth}px;bottom:-30px;opacity:0;animation:volarMariposa ${duration}ms ease-in-out forwards;pointer-events:none;`
        dom.tituloParticulas.appendChild(el)
        setTimeout(() => el.remove(), duration)
    }, 600)
}

function ocultarPantallaTitulo() {
    const pantallaTitulo = document.getElementById('pantalla-titulo')
    pantallaTitulo.style.transition = 'opacity 1s ease'
    pantallaTitulo.style.opacity    = '0'
    setTimeout(() => {
        pantallaTitulo.style.display = 'none'
        pantallaTitulo.classList.remove('activa')
    }, 1000)
}

// ── Botón silenciar — global ──────────────────────────────────────────────────
document.getElementById('btn-silenciar')?.addEventListener('click', () => {
    GestorAudio.toggleSilencio()
})

// ── Botón "Comenzar el Juego" (nueva partida) ─────────────────────────────────
document.getElementById('btn-titulo-comenzar')?.addEventListener('click', () => {
    GestorAudio.reproducirMusica('/assets/sounds/ambiente/intro_medieval.mp3')
    ocultarPantallaTitulo()
    setTimeout(() => {
        iniciarIntro()
        mostrarPantalla('intro')
    }, 1000)
})

// ── Botón "Continuar Partida" (retomar partida activa) ────────────────────────
document.getElementById('btn-titulo-continuar')?.addEventListener('click', () => {
    if (!estado.datosCriatura) return
    ocultarPantallaTitulo()
    setTimeout(() => {
        GestorAudio.detenerTodo()
        mostrarPantalla('juego')
        actualizarJuego(estado.datosCriatura)
        iniciarTickAutomatico()
        iniciarParticulas(estado.datosCriatura)
        GestorAudio.reproducirMusica(GestorAudio.getMusicaBosque(estado.datosCriatura.bosque?.salud ?? 100))
    }, 1000)
})

// ════════════════════════════════════════════
// INICIALIZACIÓN — ÚNICA
// ════════════════════════════════════════════

async function inicializar() {
    iniciarParticulasTitulo()
    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()
        if (data.exito && data.datos) {
            // Hay partida activa → guardar datos y mostrar botón Continuar
            estado.datosCriatura = data.datos

            const btnContinuar = document.getElementById('btn-titulo-continuar')
            const infoEl       = document.getElementById('continuar-info')

            if (btnContinuar) {
                btnContinuar.classList.remove('oculto')

                // Info de la criatura en el botón (nombre + días)
                if (infoEl && data.datos.nombre) {
                    const dias = (data.datos.diasVividos ?? 0) + 1
                    const tipo = data.datos.tipoEvolucion
                        ? ` · ${data.datos.tipoEvolucion.charAt(0).toUpperCase() + data.datos.tipoEvolucion.slice(1)}`
                        : ''
                    infoEl.textContent = `${data.datos.nombre} · Día ${dias}${tipo}`
                }
            }
        }
    } catch (error) {
        console.log('Mostrando pantalla título — sin partida activa')
    }
}

inicializar()