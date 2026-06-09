// ============================================
// APP.JS — El Juramento del Bosque Vivo
// Version completa con semillas + minijuegos
// ============================================

const API = 'https://mascota-virtual-medieval.onrender.com/api/mascota'

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
    canales : { musica: null, efecto: null, criatura: null },
    volumenes : { musica: 0.4, efecto: 0.6, criatura: 0.25 },
    ultimaSonidoCriatura : 0,
    cooldownCriatura     : 45000,

    reproducirMusica(ruta) {
        if (this.canales.musica?.src?.includes(ruta)) return
        this._fadeOut(this.canales.musica, 2000, () => {
            this.canales.musica        = new Audio(ruta)
            this.canales.musica.loop   = true
            this.canales.musica.volume = 0
            this.canales.musica.play().catch(() => {})
            this._fadeIn(this.canales.musica, 2000, this.volumenes.musica)
        })
    },

    pausarMusica(duracion = 0) {
        if (!this.canales.musica) return
        this._fadeOut(this.canales.musica, 1000, () => {
            this.canales.musica.pause()
            if (duracion > 0) {
                setTimeout(() => {
                    this.canales.musica.play().catch(() => {})
                    this._fadeIn(this.canales.musica, 1000, this.volumenes.musica)
                }, duracion)
            }
        })
    },

    reproducirEfecto(ruta, duracionMax = 30000) {
        if (this.canales.efecto) {
            this.canales.efecto.pause()
            this.canales.efecto = null
        }
        if (this.canales.musica) {
            this._fadeVolumen(this.canales.musica, this.volumenes.musica * 0.4, 500)
        }
        this.canales.efecto        = new Audio(ruta)
        this.canales.efecto.volume = this.volumenes.efecto
        this.canales.efecto.play().catch(() => {})
        const timeout = setTimeout(() => {
            if (this.canales.efecto) {
                this._fadeOut(this.canales.efecto, 1000)
                this.canales.efecto = null
            }
            this._restaurarMusica()
        }, duracionMax)
        this.canales.efecto.onended = () => {
            clearTimeout(timeout)
            this.canales.efecto = null
            this._restaurarMusica()
        }
    },

    reproducirCriatura(ruta) {
        const ahora = Date.now()
        if (ahora - this.ultimaSonidoCriatura < this.cooldownCriatura) return
        this.ultimaSonidoCriatura    = ahora
        this.canales.criatura        = new Audio(ruta)
        this.canales.criatura.volume = this.volumenes.criatura
        this.canales.criatura.play().catch(() => {})
    },

    reproducirEvento(ruta, pausaMusica = 4000) {
        this.pausarMusica(pausaMusica)
        setTimeout(() => this.reproducirEfecto(ruta, pausaMusica), 500)
    },

    detenerTodo() {
        ['musica','efecto','criatura'].forEach(canal => {
            if (this.canales[canal]) {
                this.canales[canal].pause()
                this.canales[canal].currentTime = 0
                this.canales[canal] = null
            }
        })
    },

    _restaurarMusica() {
        if (this.canales.musica) {
            this._fadeVolumen(this.canales.musica, this.volumenes.musica, 1000)
        }
    },

    _fadeIn(audio, duracion, volumenFinal) {
        if (!audio) return
        audio.volume = 0
        const pasos = 20, intervalo = duracion / pasos
        const incremento = volumenFinal / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.min(volumenFinal, audio.volume + incremento)
            if (paso >= pasos) clearInterval(timer)
        }, intervalo)
    },

    _fadeOut(audio, duracion, callback) {
        if (!audio) { if (callback) callback(); return }
        const pasos = 20, intervalo = duracion / pasos
        const decremento = audio.volume / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.max(0, audio.volume - decremento)
            if (paso >= pasos) {
                clearInterval(timer)
                audio.pause()
                if (callback) callback()
            }
        }, intervalo)
    },

    _fadeVolumen(audio, volumenFinal, duracion) {
        if (!audio) return
        const pasos = 10, intervalo = duracion / pasos
        const diferencia = (volumenFinal - audio.volume) / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.max(0, Math.min(1, audio.volume + diferencia))
            if (paso >= pasos) clearInterval(timer)
        }, intervalo)
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
    pantalla           : 'intro',
    slideActual        : 0,
    totalSlides        : 5,
    datosCriatura      : null,
    tickInterval       : null,
    particulasInterval : null,
    estadoAnterior     : null
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
    tituloParticulas   : document.getElementById('titulo-particulas')
}

// ════════════════════════════════════════════
// BOTÓN MODO DEMO / NORMAL
// ════════════════════════════════════════════

dom.btnModo.addEventListener('click', () => {
    modoActual = modoActual === 'normal' ? 'demo' : 'normal'
    dom.btnModo.querySelector('.accion-label').textContent =
        modoActual === 'demo' ? '⚡ Demo ON' : 'Modo Demo'
    dom.btnModo.classList.toggle('demo-activo', modoActual === 'demo')
    mostrarNotificacion(
        modoActual === 'demo'
            ? '⚡ Modo Demo activado — cooldowns reducidos'
            : '🌿 Modo Normal activado'
    )
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
                this.elementos.countdown.textContent = ''
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
        const e = this.elementos
        e.countdown.textContent = `${this.countdownValor}...`
        GestorAudio._fadeOut(GestorAudio.canales.musica, 1000, () => {
            setTimeout(() => {
                GestorAudio.canales.efecto        = new Audio('/assets/sounds/eventos/evolucion.mp3')
                GestorAudio.canales.efecto.volume = 0.7
                GestorAudio.canales.efecto.play().catch(() => {})
            }, 300)
        })
        this.intervalCountdown = setInterval(() => {
            if (this.calor < this.maxCalor) {
                this.countdownActivo = false
                e.countdown.textContent = ''
                clearInterval(this.intervalCountdown)
                if (GestorAudio.canales.efecto) {
                    GestorAudio._fadeOut(GestorAudio.canales.efecto, 500, () => {
                        GestorAudio.canales.efecto = null
                        GestorAudio.reproducirMusica('/assets/sounds/eventos/nacimiento.mp3')
                    })
                }
                return
            }
            this.countdownValor--
            e.countdown.textContent = this.countdownValor > 0 ? `${this.countdownValor}...` : '✨'
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
            e.countdown.textContent = ''
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
    const { nombre, fase, tipoEvolucion, estado: est, estadisticas, bosque, diasVividos, imagenActual, tendencia, urgencias } = datos

    dom.nombreCriatura.textContent = nombre
    dom.faseCriatura.textContent   = obtenerLabelFase(fase, tipoEvolucion)
    dom.diasVividos.textContent    = diasVividos

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

    actualizarImagenCriatura(imagenActual, fase, tipoEvolucion)
    if (est?.mensaje) dom.estadoMensaje.textContent = est.mensaje
    actualizarAura(est?.nombre, tipoEvolucion)
    if (est?.acciones) actualizarBotonesAccion(est.acciones)
    actualizarParticulas(saludBosque, tipoEvolucion)
    actualizarBadgeTendencia(tendencia, diasVividos, fase)
    actualizarUrgencias(urgencias, nombre)

    const musicaCorrecta = GestorAudio.getMusicaBosque(saludBosque)
    if (GestorAudio.canales.musica && !GestorAudio.canales.musica.src?.includes(musicaCorrecta.split('/').pop())) {
        GestorAudio.reproducirMusica(musicaCorrecta)
    }

    if (estado.estadoAnterior !== est?.nombre && estado.estadoAnterior !== null) {
        GestorAudio.reproducirCriatura(GestorAudio.getSonidoCriatura(est?.nombre))
    }
    estado.estadoAnterior = est?.nombre

    if (est?.nombre === 'retorno' || est?.nombre === 'perdido') {
        setTimeout(() => mostrarPantallaFin(datos), 2000)
    }
}

function obtenerLabelFase(fase, tipo) {
    const labels = {
        huevo: '🥚 Huevo Espiritual', base: '🐾 Sylvae',
        evolucionada: { natura:'🌿 Sylvae Natura', umbra:'🌙 Sylvae Umbra', ignis:'🔥 Sylvae Ignis', aqua:'💧 Sylvae Aqua', aether:'✨ Sylvae Aether', umbris:'💔 Sylvae Umbris' },
        retorno: '🌿 Retorno al Bosque', perdido: '💔 Perdido'
    }
    if (fase === 'evolucionada' && tipo) return labels.evolucionada[tipo] || '✨ Sylvae'
    return labels[fase] || fase
}

function actualizarStat(nombre, valor) {
    const stat = dom.stats[nombre]
    if (!stat) return
    stat.barra.style.width = `${valor}%`
    stat.val.textContent   = Math.round(valor)
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

function actualizarImagenCriatura(imagenActual, fase, tipo) {
    dom.criaturaSprite.innerHTML = ''
    const img = document.createElement('img')
    img.src   = imagenActual || '/assets/images/criatura/huevo.png'
    img.alt   = 'Sylvae'

    // si el GIF no existe, usar PNG
    img.onerror = () => {
        const rutaPng = imagenActual?.replace('.gif', '.png')
        if (rutaPng && !img.src.includes('.png')) {
            img.src = rutaPng
        } else {
            dom.criaturaSprite.innerHTML      = fase === 'huevo' ? '🥚' : '🐾'
            dom.criaturaSprite.style.fontSize = '7rem'
        }
    }
    dom.criaturaSprite.appendChild(img)
}

function obtenerColorTipo(tipo) {
    const colores = { natura:'rgba(45,200,78,0.6)', umbra:'rgba(107,78,200,0.6)', ignis:'rgba(255,140,0,0.6)', aqua:'rgba(0,180,220,0.6)', aether:'rgba(255,215,100,0.6)', umbris:'rgba(80,0,0,0.6)', retorno:'rgba(255,215,100,0.8)' }
    return colores[tipo] || 'rgba(127,255,127,0.4)'
}

function actualizarAura(estadoNombre, tipo) {
    const color = obtenerColorTipo(tipo)
    dom.criaturaAura.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`
    const clases = ['sylvae-paz','sylvae-alegre','sylvae-somnoliento','sylvae-hambriento','sylvae-triste','sylvae-peligro','sylvae-retorno','sylvae-perdido']
    clases.forEach(c => dom.criaturaSprite.classList.remove(c))
    const mapaClases = { paz:'sylvae-paz', alegre:'sylvae-alegre', somnoliento:'sylvae-somnoliento', hambriento:'sylvae-hambriento', triste:'sylvae-triste', peligro:'sylvae-peligro', retorno:'sylvae-retorno', perdido:'sylvae-perdido' }
    dom.criaturaSprite.classList.add(mapaClases[estadoNombre] || 'sylvae-paz')
    const img = dom.criaturaSprite.querySelector('img')
    if (img) { img.style.width = '280px'; img.style.height = '280px' }
}

function actualizarBotonesAccion(accionesDisponibles) {
    dom.botonesAccion.forEach(btn => {
        const accion = btn.dataset.accion
        if (!accionesDisponibles.includes(accion) && !btn.classList.contains('en-cooldown')) {
            btn.disabled = true
        }
    })
}

function actualizarBadgeTendencia(tendencia, diasVividos, fase) {
    const badge = document.getElementById('badge-tendencia')
    if (!badge) return
    if (diasVividos < 3 || fase === 'huevo') { badge.classList.add('oculto'); return }
    if (!tendencia) return
    badge.classList.remove('oculto')
    badge.className   = `badge-tendencia ${tendencia.tipo}`
    badge.textContent = `${tendencia.icono} Afinidad: ${tendencia.nombre}`
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
    GestorAudio.reproducirEfecto(`/assets/sounds/acciones/${nombreAccion}.mp3`, 30000)
    _reaccionSylvae(nombreAccion)
    try {
        const res  = await fetch(`${API}/accion`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ nombreAccion })
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
            // mostrar advertencias por exceso
            if (data.advertencias && data.advertencias.length > 0) {
                data.advertencias.forEach((adv, i) => {
                    setTimeout(() => {
                        mostrarNotificacion(`${adv.icono} ${adv.mensaje}`, true)
                    }, i * 1500)
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
    if (estado.tickInterval) clearInterval(estado.tickInterval)
    if (estado.particulasInterval) clearInterval(estado.particulasInterval)
    CooldownManager.limpiarTodos()
    GestorAudio.detenerTodo()
    const resumen = datos.resumen
    const exitoso = datos.estado?.nombre === 'retorno'
    setTimeout(() => GestorAudio.reproducirMusica(exitoso ? '/assets/sounds/eventos/retorno.mp3' : '/assets/sounds/ambiente/bosque_enfermo.mp3'), 500)
    document.getElementById('fin-icono').textContent  = exitoso ? '✨' : '💔'
    document.getElementById('fin-titulo').textContent = exitoso ? 'El ciclo se completa' : 'El bosque se ha oscurecido'
    const imgFin = document.getElementById('fin-criatura-img')
    if (imgFin) imgFin.src = datos.imagenActual || '/assets/images/criatura/huevo.png'
    const auraFin = document.getElementById('fin-criatura-aura')
    if (auraFin) auraFin.style.background = `radial-gradient(circle, ${obtenerColorTipo(datos.tipoEvolucion)} 0%, transparent 70%)`
    document.getElementById('fin-dias').textContent    = `${resumen?.diasVividos ?? 0}/${resumen?.diasMaximos ?? 15}`
    document.getElementById('fin-bosque').textContent  = `${datos.bosque?.salud ?? 0}%`
    if (resumen?.logroMaximo) {
        document.getElementById('fin-logro-icono').textContent = resumen.logroMaximo.icono
        document.getElementById('fin-logro').textContent       = resumen.logroMaximo.nombre
    }
    document.getElementById('fin-evolucion-valor').textContent = obtenerLabelFase(datos.fase, datos.tipoEvolucion)
    document.getElementById('fin-mensaje').textContent = resumen?.mensaje || 'El bosque recuerda cada momento de cuidado.'
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
    mostrarNotificacion('📊 Historial próximamente disponible')
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
            actualizarJuego(data.datos)
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

    // cerrar modal al hacer click fuera
    if (e.target.classList.contains('panel-modal')) {
        e.target.classList.add('oculto')
        Minijuego.limpiar()
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
                    const dias = data.datos.diasVividos ?? 0
                    const tipo = data.datos.tipoEvolucion
                        ? ` · ${data.datos.tipoEvolucion}`
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