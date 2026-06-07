// ============================================
// APP.JS — El Juramento del Bosque Vivo
// Con sistema de cooldown visual + audio
// + Modo Normal / Modo Demo
// ============================================

const API = 'https://mascota-virtual-medieval.onrender.com/api/mascota'

// ── Agregar pantalla título al objeto dom ──
// (agregar dentro del objeto dom existente)

// ════════════════════════════════════════════
// CONFIGURACIÓN DE MODOS
// ════════════════════════════════════════════

const MODOS = {
    normal : {
        nombre    : 'Normal',
        cooldowns : {
            alimentar : 7200,   // 2 horas
            jugar     : 3600,   // 1 hora
            dormir    : 28800,  // 8 horas
            bañar     : 14400,  // 4 horas
            meditar   : 21600,  // 6 horas
            hablar    : 1800    // 30 minutos
        }
    },
    demo : {
        nombre    : 'Demo',
        cooldowns : {
            alimentar : 120,   // 2 minutos
            jugar     : 60,    // 1 minuto
            dormir    : 240,   // 4 minutos
            bañar     : 180,   // 3 minutos
            meditar   : 180,   // 3 minutos
            hablar    : 30     // 30 segundos
        }
    }
}

let modoActual = 'normal'

// ════════════════════════════════════════════
// GESTOR DE AUDIO — 3 canales separados
// ════════════════════════════════════════════

const GestorAudio = {

    canales : {
        musica  : null,   // música de fondo (loop)
        efecto  : null,   // efectos de acción
        criatura: null    // sonidos de criatura
    },

    volumenes : {
        musica  : 0.4,
        efecto  : 0.6,
        criatura: 0.25
    },

    ultimaSonidoCriatura : 0,
    cooldownCriatura     : 45000,  // 45 segundos

    // ── Música de fondo ───────────────────────
    reproducirMusica(ruta) {
        if (this.canales.musica?.src?.includes(ruta)) return
        this._fadeOut(this.canales.musica, 2000, () => {
            this.canales.musica     = new Audio(ruta)
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

    // ── Efectos de acción ─────────────────────
    reproducirEfecto(ruta, duracionMax = 30000) {
        if (this.canales.efecto) {
            this.canales.efecto.pause()
            this.canales.efecto = null
        }

        // bajar música mientras suena el efecto
        if (this.canales.musica) {
            this._fadeVolumen(this.canales.musica, this.volumenes.musica * 0.4, 500)
        }

        this.canales.efecto        = new Audio(ruta)
        this.canales.efecto.volume = this.volumenes.efecto
        this.canales.efecto.play().catch(() => {})

        // cortar si excede duracion máxima
        const timeout = setTimeout(() => {
            if (this.canales.efecto) {
                this._fadeOut(this.canales.efecto, 1000)
                this.canales.efecto = null
            }
            this._restaurarMusica()
        }, duracionMax)

        // cuando termina naturalmente
        this.canales.efecto.onended = () => {
            clearTimeout(timeout)
            this.canales.efecto = null
            this._restaurarMusica()
        }
    },

    // ── Sonidos de criatura ───────────────────
    reproducirCriatura(ruta) {
        const ahora = Date.now()
        if (ahora - this.ultimaSonidoCriatura < this.cooldownCriatura) return

        this.ultimaSonidoCriatura = ahora
        this.canales.criatura     = new Audio(ruta)
        this.canales.criatura.volume = this.volumenes.criatura
        this.canales.criatura.play().catch(() => {})
    },

    // ── Eventos especiales ────────────────────
    reproducirEvento(ruta, pausaMusica = 4000) {
        this.pausarMusica(pausaMusica)
        setTimeout(() => {
            this.reproducirEfecto(ruta, pausaMusica)
        }, 500)
    },

    // ── Helpers internos ──────────────────────
    _restaurarMusica() {
        if (this.canales.musica) {
            this._fadeVolumen(this.canales.musica, this.volumenes.musica, 1000)
        }
    },

    _fadeIn(audio, duracion, volumenFinal) {
        if (!audio) return
        audio.volume = 0
        const pasos     = 20
        const intervalo = duracion / pasos
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
        const pasos     = 20
        const intervalo = duracion / pasos
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
        const pasos      = 10
        const intervalo  = duracion / pasos
        const diferencia = (volumenFinal - audio.volume) / pasos
        let paso = 0
        const timer = setInterval(() => {
            paso++
            audio.volume = Math.max(0, Math.min(1, audio.volume + diferencia))
            if (paso >= pasos) clearInterval(timer)
        }, intervalo)
    },

    getMusicaBosque(salud) {
        if (salud >= 50) return '/assets/sounds/ambiente/bosque_sano.mp3'
        return '/assets/sounds/ambiente/bosque_enfermo.mp3'
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

    timers    : {},
    intervalos: {},

    iniciar(accion, segundos) {
        const btn     = document.querySelector(`[data-accion="${accion}"]`)
        const barra   = document.getElementById(`cd-${accion}`)
        const texto   = document.getElementById(`txt-${accion}`)
        if (!btn || !barra || !texto) return

        // limpiar timer anterior
        this.limpiar(accion)

        btn.disabled = true
        btn.classList.add('en-cooldown')
        btn.classList.remove('listo')

        let restante = segundos
        barra.style.width = '100%'
        barra.classList.remove('urgente')

        // actualizar cada segundo
        this.intervalos[accion] = setInterval(() => {
            restante--
            const porcentaje = (restante / segundos) * 100
            barra.style.width = `${porcentaje}%`
            texto.textContent = this._formatearTiempo(restante)

            // urgente cuando queda menos del 20%
            if (porcentaje < 20) {
                barra.classList.add('urgente')
            }

            if (restante <= 0) {
                this.completar(accion)
            }
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
        const hrs = Math.floor(min / 60)
        const mn  = min % 60
        return `${hrs}h ${mn}m`
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
    slides         : document.querySelectorAll('.intro-slide'),
    btnAnterior    : document.getElementById('btn-anterior'),
    btnSiguiente   : document.getElementById('btn-siguiente'),
    btnComenzar    : document.getElementById('btn-comenzar'),
    introPuntos    : document.getElementById('intro-puntos'),
    inputNombre    : document.getElementById('input-nombre'),
    btnCrear       : document.getElementById('btn-crear'),
    crearError     : document.getElementById('crear-error'),
    bosqueFondo    : document.getElementById('bosque-fondo'),
    bosqueOverlay  : document.getElementById('bosque-overlay'),
    barraBosque    : document.getElementById('barra-bosque'),
    valorBosque    : document.getElementById('valor-bosque'),
    nombreCriatura : document.getElementById('nombre-criatura'),
    faseCriatura   : document.getElementById('fase-criatura'),
    diasVividos    : document.getElementById('dias-vividos'),
    criaturaSprite : document.getElementById('criatura-sprite'),
    criaturaAura   : document.getElementById('criatura-aura'),
    estadoMensaje  : document.getElementById('estado-mensaje'),
    accionesPanel  : document.getElementById('acciones-panel'),
    botonesAccion  : document.querySelectorAll('.btn-accion'),
    notificacion   : document.getElementById('notificacion'),
    btnModo        : document.getElementById('btn-modo'),
    stats : {
        vitalidad : { barra: document.getElementById('barra-vitalidad'), val: document.getElementById('val-vitalidad') },
        hambre    : { barra: document.getElementById('barra-hambre'),    val: document.getElementById('val-hambre')    },
        espiritu  : { barra: document.getElementById('barra-espiritu'),  val: document.getElementById('val-espiritu')  },
        energia   : { barra: document.getElementById('barra-energia'),   val: document.getElementById('val-energia')   },
        vinculo   : { barra: document.getElementById('barra-vinculo'),   val: document.getElementById('val-vinculo')   }
    },
    finIcono    : document.getElementById('fin-icono'),
    finTitulo   : document.getElementById('fin-titulo'),
    finMensaje  : document.getElementById('fin-mensaje'),
    btnReiniciar: document.getElementById('btn-reiniciar'),
    btnTituloComenzar : document.getElementById('btn-titulo-comenzar'),
    pantallaTitulo    : document.getElementById('pantalla-titulo'),
    tituloParticulas  : document.getElementById('titulo-particulas')


}

// ════════════════════════════════════════════
// BOTÓN MODO DEMO / NORMAL
// ════════════════════════════════════════════

dom.btnModo.addEventListener('click', () => {
    modoActual = modoActual === 'normal' ? 'demo' : 'normal'
    const modo = MODOS[modoActual]

    dom.btnModo.querySelector('.accion-label').textContent =
        modoActual === 'demo' ? '⚡ Demo ON' : 'Modo Demo'
    dom.btnModo.classList.toggle('demo-activo', modoActual === 'demo')

    mostrarNotificacion(
        modoActual === 'demo'
            ? '⚡ Modo Demo activado — cooldowns reducidos'
            : '🌿 Modo Normal activado',
        false
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
})

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
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ nombre })
        })
        const data = await res.json()

        if (data.exito) {
            estado.datosCriatura = data.datos
            GestorAudio.reproducirEvento('/assets/sounds/eventos/nacimiento.mp3', 3000)
            mostrarNotificacion(`¡${nombre} ha despertado del huevo espiritual!`)
            setTimeout(() => {
                mostrarPantalla('juego')
                actualizarJuego(data.datos)
                iniciarTickAutomatico()
                iniciarParticulas(data.datos)
                GestorAudio.reproducirMusica(
                    GestorAudio.getMusicaBosque(data.datos.bosque?.salud ?? 100)
                )
            }, 2000)
        } else {
            if (data.mensaje.includes('Ya existe')) {
                await cargarEstado()
            } else {
                dom.crearError.textContent = data.mensaje
            }
        }
    } catch (error) {
        dom.crearError.textContent = 'Error al conectar con el bosque.'
        console.error(error)
    } finally {
        dom.btnCrear.disabled    = false
        dom.btnCrear.textContent = '✨ Despertar'
    }
})

dom.inputNombre.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') dom.btnCrear.click()
})

// ════════════════════════════════════════════
// CARGAR ESTADO
// ════════════════════════════════════════════

async function cargarEstado() {
    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()
        if (data.exito) {
            estado.datosCriatura = data.datos
            mostrarPantalla('juego')
            actualizarJuego(data.datos)
            iniciarTickAutomatico()
            iniciarParticulas(data.datos)
            GestorAudio.reproducirMusica(
                GestorAudio.getMusicaBosque(data.datos.bosque?.salud ?? 100)
            )
        }
    } catch (error) {
        console.error('Error al cargar estado:', error)
    }
}

// ════════════════════════════════════════════
// ACTUALIZAR UI DEL JUEGO
// ════════════════════════════════════════════

function actualizarJuego(datos) {
    if (!datos) return

    const { nombre, fase, tipoEvolucion, estado: est,
            estadisticas, bosque, diasVividos, imagenActual } = datos

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

    actualizarImagenCriatura(imagenActual, fase, tipoEvolucion)
    if (est?.mensaje) dom.estadoMensaje.textContent = est.mensaje
    actualizarAura(est?.nombre, tipoEvolucion)
    if (est?.acciones) actualizarBotonesAccion(est.acciones)
    actualizarParticulas(saludBosque, tipoEvolucion)

    // sonido criatura cuando cambia estado
    if (estado.estadoAnterior !== est?.nombre && estado.estadoAnterior !== null) {
        GestorAudio.reproducirCriatura(GestorAudio.getSonidoCriatura(est?.nombre))
    }
    estado.estadoAnterior = est?.nombre

    // cambiar música según bosque
    const musicaCorrecta = GestorAudio.getMusicaBosque(saludBosque)
    if (GestorAudio.canales.musica &&
        !GestorAudio.canales.musica.src?.includes(
            musicaCorrecta.split('/').pop()
        )) {
        GestorAudio.reproducirMusica(musicaCorrecta)
    }

    // fin de juego
    if (est?.nombre === 'retorno' || est?.nombre === 'perdido') {
        setTimeout(() => mostrarPantallaFin(est.nombre, nombre), 2000)
    }
}

function obtenerLabelFase(fase, tipo) {
    const labels = {
        huevo        : '🥚 Huevo Espiritual',
        base         : '🐾 Sylvae',
        evolucionada : {
            natura  : '🌿 Sylvae Natura',
            umbra   : '🌙 Sylvae Umbra',
            ignis   : '🔥 Sylvae Ignis',
            aqua    : '💧 Sylvae Aqua',
            aether  : '✨ Sylvae Aether',
            umbris  : '💔 Sylvae Umbris'
        },
        retorno : '🌿 Retorno al Bosque',
        perdido : '💔 Perdido'
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
    img.onerror = () => {
        dom.criaturaSprite.innerHTML      = fase === 'huevo' ? '🥚' : '🐾'
        dom.criaturaSprite.style.fontSize = '7rem'
    }
    dom.criaturaSprite.appendChild(img)
}

function obtenerColorTipo(tipo) {
    const colores = {
        natura  : 'rgba(45, 200, 78, 0.6)',
        umbra   : 'rgba(107, 78, 200, 0.6)',
        ignis   : 'rgba(255, 140, 0, 0.6)',
        aqua    : 'rgba(0, 180, 220, 0.6)',
        aether  : 'rgba(255, 215, 100, 0.6)',
        umbris  : 'rgba(80, 0, 0, 0.6)',
        retorno : 'rgba(255, 215, 100, 0.8)'
    }
    return colores[tipo] || 'rgba(127, 255, 127, 0.4)'
}

function actualizarAura(estadoNombre, tipo) {
    const color = obtenerColorTipo(tipo)
    dom.criaturaAura.style.background =
        `radial-gradient(circle, ${color} 0%, transparent 70%)`
}

function actualizarBotonesAccion(accionesDisponibles) {
    dom.botonesAccion.forEach(btn => {
        const accion = btn.dataset.accion
        if (!accionesDisponibles.includes(accion)) {
            if (!btn.classList.contains('en-cooldown')) {
                btn.disabled = true
            }
        }
    })
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

    // reproducir efecto de acción (máximo 30s)
    GestorAudio.reproducirEfecto(
        `/assets/sounds/acciones/${nombreAccion}.mp3`,
        30000
    )

    try {
        const res  = await fetch(`${API}/accion`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ nombreAccion })
        })
        const data = await res.json()

        if (data.exito) {
            // verificar evolución
            const faseAnterior = estado.datosCriatura?.fase
            const faseNueva    = data.datos?.fase
            if (faseAnterior !== faseNueva) {
                GestorAudio.reproducirEvento('/assets/sounds/eventos/evolucion.mp3', 4000)
                mostrarNotificacion(`✨ ¡${data.datos.nombre} ha evolucionado a ${obtenerLabelFase(faseNueva, data.datos.tipoEvolucion)}!`)
            }

            estado.datosCriatura = data.datos
            actualizarJuego(data.datos)
            mostrarNotificacion(data.mensaje)

            // iniciar cooldown visual
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
// TICK AUTOMÁTICO
// ════════════════════════════════════════════

function iniciarTickAutomatico() {
    if (estado.tickInterval) clearInterval(estado.tickInterval)
    estado.tickInterval = setInterval(async () => {
        try {
            const res  = await fetch(`${API}/tick`, { method: 'POST' })
            const data = await res.json()
            if (data.exito) actualizarJuego(data.datos)
        } catch (error) {
            console.error('Error en tick:', error)
        }
    }, 30000)
}

// ════════════════════════════════════════════
// PARTÍCULAS
// ════════════════════════════════════════════

let contenedorParticulas = null

function iniciarParticulas(datos) {
    if (!contenedorParticulas) {
        contenedorParticulas = document.createElement('div')
        contenedorParticulas.id = 'particulas-contenedor'
        contenedorParticulas.style.cssText = `
            position:fixed; inset:0; pointer-events:none; z-index:5; overflow:hidden;
        `
        document.getElementById('pantalla-juego').appendChild(contenedorParticulas)
    }
    actualizarParticulas(datos?.bosque?.salud ?? 100, datos?.tipoEvolucion)
}

function actualizarParticulas(saludBosque, tipo) {
    if (!contenedorParticulas) return
    contenedorParticulas.innerHTML = ''
    if (estado.particulasInterval) clearInterval(estado.particulasInterval)

    if (saludBosque >= 75) {
        estado.particulasInterval = setInterval(() => {
            crearMariposa()
            if (Math.random() > 0.5) crearLuciernaga()
        }, 800)
    } else if (saludBosque >= 50) {
        estado.particulasInterval = setInterval(() => crearHoja(), 600)
    } else if (saludBosque >= 25) {
        estado.particulasInterval = setInterval(() => {
            crearHojaSeca()
            if (Math.random() > 0.7) crearHoja()
        }, 400)
    } else {
        estado.particulasInterval = setInterval(() => crearCeniza(), 300)
    }
}

function crearMariposa() {
    const el = document.createElement('div')
    const emojis = ['🦋', '🦋', '🌸', '🦋']
    const duration = 6000 + Math.random() * 4000
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
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
    notifTimeout = setTimeout(() => {
        dom.notificacion.classList.remove('visible')
    }, 3000)
}

// ════════════════════════════════════════════
// PANTALLA FIN
// ════════════════════════════════════════════

function mostrarPantallaFin(tipoFin, nombre) {
    if (estado.tickInterval) clearInterval(estado.tickInterval)
    if (estado.particulasInterval) clearInterval(estado.particulasInterval)
    CooldownManager.limpiarTodos()
    GestorAudio.reproducirEvento('/assets/sounds/eventos/retorno.mp3', 5000)

    if (tipoFin === 'retorno') {
        dom.finIcono.textContent   = '✨'
        dom.finTitulo.textContent  = 'El ciclo se completa'
        dom.finMensaje.textContent = `${nombre} ha completado su ciclo y regresa al bosque espiritual.`
    } else {
        dom.finIcono.textContent   = '💔'
        dom.finTitulo.textContent  = 'El bosque se ha oscurecido'
        dom.finMensaje.textContent = `${nombre} no pudo completar su ciclo. El bosque lo recuerda.`
    }
    mostrarPantalla('fin')
}

dom.btnReiniciar.addEventListener('click', async () => {
    try { await fetch(`${API}/reiniciar`, { method: 'DELETE' }) } catch(e) {}
    estado.datosCriatura  = null
    estado.estadoAnterior = null
    dom.inputNombre.value = ''
    if (contenedorParticulas) contenedorParticulas.innerHTML = ''
    CooldownManager.limpiarTodos()
    GestorAudio.pausarMusica()
    mostrarPantalla('crear')
})

// ════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════

async function inicializar() {
    iniciarIntro()
    mostrarPantalla('intro')

    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()
        if (data.exito) {
            estado.datosCriatura = data.datos
            mostrarPantalla('juego')
            actualizarJuego(data.datos)
            iniciarTickAutomatico()
            iniciarParticulas(data.datos)
            GestorAudio.reproducirMusica(
                GestorAudio.getMusicaBosque(data.datos.bosque?.salud ?? 100)
            )
        }
    } catch (error) {
        console.log('No hay criatura activa, mostrando intro')
    }
}

// ════════════════════════════════════════════
// PANTALLA TÍTULO
// ════════════════════════════════════════════

function iniciarParticulasTitulo() {
    if (!dom.tituloParticulas) return

    setInterval(() => {
        const el       = document.createElement('div')
        const emojis   = ['🦋', '🌸', '✨', '🍃', '🌿']
        const emoji    = emojis[Math.floor(Math.random() * emojis.length)]
        const startX   = Math.random() * window.innerWidth
        const duration = 5000 + Math.random() * 5000

        el.textContent = emoji
        el.style.cssText = `
            position   : absolute;
            font-size  : ${0.6 + Math.random() * 1}rem;
            left       : ${startX}px;
            bottom     : -30px;
            opacity    : 0;
            animation  : volarMariposa ${duration}ms ease-in-out forwards;
            pointer-events : none;
        `
        dom.tituloParticulas.appendChild(el)
        setTimeout(() => el.remove(), duration)
    }, 600)
}

// botón comenzar juego
document.getElementById('btn-titulo-comenzar').addEventListener('click', () => {

    // arrancar música con interacción del usuario
    GestorAudio.reproducirMusica('/assets/sounds/ambiente/intro_medieval.mp3')

    // ocultar pantalla título con fade
    const pantallaTitulo = document.getElementById('pantalla-titulo')
    pantallaTitulo.style.transition = 'opacity 1s ease'
    pantallaTitulo.style.opacity    = '0'

    setTimeout(() => {
        pantallaTitulo.style.display = 'none'
        pantallaTitulo.classList.remove('activa')
        // mostrar intro
        iniciarIntro()
        mostrarPantalla('intro')
    }, 1000)
})

// ════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════

async function inicializar() {

    // iniciar partículas de la pantalla título
    iniciarParticulasTitulo()

    // verificar si ya existe una criatura activa
    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()

        if (data.exito) {
            // hay criatura activa → saltar título e ir directo al juego
            const pantallaTitulo = document.getElementById('pantalla-titulo')
            pantallaTitulo.style.display = 'none'
            pantallaTitulo.classList.remove('activa')

            estado.datosCriatura = data.datos
            mostrarPantalla('juego')
            actualizarJuego(data.datos)
            iniciarTickAutomatico()
            iniciarParticulas(data.datos)
            GestorAudio.reproducirMusica(
                GestorAudio.getMusicaBosque(data.datos.bosque?.salud ?? 100)
            )
        }
        // si no hay criatura → se queda en pantalla título
    } catch (error) {
        // no hay criatura → mostrar pantalla título normalmente
        console.log('Mostrando pantalla título')
    }
}

inicializar()