// ============================================
// APP.JS — Lógica del Frontend
// El Juramento del Bosque Vivo
// Con sistema de sonidos completo
// ============================================

const API = 'https://mascota-virtual-medieval.onrender.com/api/mascota'

// ════════════════════════════════════════════
// GESTOR DE AUDIO
// ════════════════════════════════════════════

const Audio_ = {
    musicaActual : null,
    efectoActual : null,
    volumenMusica: 0.4,
    volumenEfecto: 0.7,

    reproducirMusica(ruta) {
        if (this.musicaActual) {
            this.musicaActual.pause()
            this.musicaActual.currentTime = 0
        }
        this.musicaActual = new Audio(ruta)
        this.musicaActual.loop   = true
        this.musicaActual.volume = this.volumenMusica
        this.musicaActual.play().catch(() => {})
    },

    reproducirEfecto(ruta) {
        const efecto = new Audio(ruta)
        efecto.volume = this.volumenEfecto
        efecto.play().catch(() => {})
    },

    pausarMusica() {
        if (this.musicaActual) this.musicaActual.pause()
    },

    getMusicaBosque(salud) {
        if (salud >= 50) return '/assets/sounds/ambiente/bosque_sano.mp3'
        return '/assets/sounds/ambiente/bosque_enfermo.mp3'
    },

    getSonidoCriatura(estado) {
        const sonidos = {
            alegre      : '/assets/sounds/criatura/feliz.mp3',
            paz         : '/assets/sounds/criatura/feliz.mp3',
            hambriento  : '/assets/sounds/criatura/triste.mp3',
            triste      : '/assets/sounds/criatura/triste.mp3',
            somnoliento : '/assets/sounds/criatura/triste.mp3',
            peligro     : '/assets/sounds/criatura/peligro.mp3',
            perdido     : '/assets/sounds/criatura/peligro.mp3'
        }
        return sonidos[estado] || '/assets/sounds/criatura/feliz.mp3'
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
    btnReiniciar: document.getElementById('btn-reiniciar')
}

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
    // música de intro
    Audio_.reproducirMusica('/assets/sounds/ambiente/intro_medieval.mp3')
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
    Audio_.pausarMusica()
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
            // sonido de nacimiento
            Audio_.reproducirEfecto('/assets/sounds/eventos/nacimiento.mp3')
            setTimeout(() => {
                mostrarPantalla('juego')
                actualizarJuego(data.datos)
                iniciarTickAutomatico()
                iniciarParticulas(data.datos)
                // música del bosque
                Audio_.reproducirMusica(Audio_.getMusicaBosque(data.datos.bosque?.salud ?? 100))
            }, 1500)
            mostrarNotificacion(`¡${nombre} ha despertado del huevo espiritual!`)
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
            Audio_.reproducirMusica(Audio_.getMusicaBosque(data.datos.bosque?.salud ?? 100))
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

    // header
    dom.nombreCriatura.textContent = nombre
    dom.faseCriatura.textContent   = obtenerLabelFase(fase, tipoEvolucion)
    dom.diasVividos.textContent    = diasVividos

    // bosque
    const saludBosque = bosque?.salud ?? 100
    dom.barraBosque.style.width = `${saludBosque}%`
    dom.valorBosque.textContent = saludBosque
    actualizarFondoBosque(saludBosque)

    // estadísticas
    if (estadisticas) {
        actualizarStat('vitalidad', estadisticas.vitalidad)
        actualizarStat('hambre',    estadisticas.hambre)
        actualizarStat('espiritu',  estadisticas.espiritu)
        actualizarStat('energia',   estadisticas.energia)
        actualizarStat('vinculo',   estadisticas.vinculo)
    }

    // imagen
    actualizarImagenCriatura(imagenActual, fase, tipoEvolucion)

    // mensaje
    if (est?.mensaje) dom.estadoMensaje.textContent = est.mensaje

    // aura
    actualizarAura(est?.nombre, tipoEvolucion)

    // botones
    if (est?.acciones) actualizarBotonesAccion(est.acciones)

    // partículas
    actualizarParticulas(saludBosque, tipoEvolucion)

    // sonido criatura cuando cambia estado
    if (estado.estadoAnterior !== est?.nombre) {
        if (est?.nombre && estado.estadoAnterior !== null) {
            setTimeout(() => {
                Audio_.reproducirEfecto(Audio_.getSonidoCriatura(est.nombre))
            }, 500)
        }
        estado.estadoAnterior = est?.nombre
    }

    // música según salud del bosque
    const musicaCorrecta = Audio_.getMusicaBosque(saludBosque)
    if (Audio_.musicaActual?.src && !Audio_.musicaActual.src.includes(musicaCorrecta)) {
        Audio_.reproducirMusica(musicaCorrecta)
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
        dom.criaturaSprite.innerHTML  = fase === 'huevo' ? '🥚' : '🐾'
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
        btn.disabled = !accionesDisponibles.includes(btn.dataset.accion)
    })
}

// ════════════════════════════════════════════
// SISTEMA DE PARTÍCULAS
// ════════════════════════════════════════════

let contenedorParticulas = null

function iniciarParticulas(datos) {
    if (!contenedorParticulas) {
        contenedorParticulas = document.createElement('div')
        contenedorParticulas.id = 'particulas-contenedor'
        contenedorParticulas.style.cssText = `
            position: fixed; inset: 0;
            pointer-events: none; z-index: 5; overflow: hidden;
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
    el.style.cssText = `
        position:absolute; font-size:${0.8 + Math.random() * 0.8}rem;
        left:${Math.random() * window.innerWidth}px; bottom:-30px;
        opacity:0; animation:volarMariposa ${duration}ms ease-in-out forwards;
        pointer-events:none;
    `
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearLuciernaga() {
    const el = document.createElement('div')
    const duration = 3000 + Math.random() * 3000
    el.style.cssText = `
        position:absolute; width:6px; height:6px;
        background:radial-gradient(circle,#7fff7f,transparent);
        border-radius:50%; left:${Math.random() * window.innerWidth}px;
        top:${Math.random() * window.innerHeight}px;
        animation:pulsarLuciernaga ${duration}ms ease-in-out forwards;
        pointer-events:none; box-shadow:0 0 8px #7fff7f;
    `
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearHoja() {
    const el = document.createElement('div')
    const emojis = ['🍃', '🌿', '🍀']
    const duration = 4000 + Math.random() * 3000
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
    el.style.cssText = `
        position:absolute; font-size:${0.6 + Math.random() * 0.6}rem;
        left:${Math.random() * window.innerWidth}px; top:-20px;
        opacity:0.7; animation:caerHoja ${duration}ms ease-in forwards;
        pointer-events:none;
    `
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearHojaSeca() {
    const el = document.createElement('div')
    const emojis = ['🍂', '🍁', '🍂']
    const duration = 3000 + Math.random() * 2000
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
    el.style.cssText = `
        position:absolute; font-size:${0.6 + Math.random() * 0.8}rem;
        left:${Math.random() * window.innerWidth}px; top:-20px;
        opacity:0.6; animation:caerHoja ${duration}ms ease-in forwards;
        pointer-events:none;
    `
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

function crearCeniza() {
    const el = document.createElement('div')
    const duration = 4000 + Math.random() * 3000
    el.style.cssText = `
        position:absolute; width:${3 + Math.random() * 4}px;
        height:${3 + Math.random() * 4}px;
        background:rgba(150,100,100,0.6); border-radius:50%;
        left:${Math.random() * window.innerWidth}px; top:-10px;
        animation:caerHoja ${duration}ms ease-in forwards;
        pointer-events:none;
    `
    contenedorParticulas.appendChild(el)
    setTimeout(() => el.remove(), duration)
}

// ════════════════════════════════════════════
// EJECUTAR ACCIONES
// ════════════════════════════════════════════

dom.botonesAccion.forEach(btn => {
    btn.addEventListener('click', async () => {
        await ejecutarAccion(btn.dataset.accion, btn)
    })
})

async function ejecutarAccion(nombreAccion, btn) {
    btn.disabled = true

    // sonido de la acción
    Audio_.reproducirEfecto(`/assets/sounds/acciones/${nombreAccion}.mp3`)

    try {
        const res  = await fetch(`${API}/accion`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ nombreAccion })
        })
        const data = await res.json()

        if (data.exito) {
            // verificar si hubo evolución
            const faseAnterior = estado.datosCriatura?.fase
            const faseNueva    = data.datos?.fase

            if (faseAnterior !== faseNueva) {
                Audio_.reproducirEfecto('/assets/sounds/eventos/evolucion.mp3')
                mostrarNotificacion(`✨ ¡${data.datos.nombre} ha evolucionado!`)
            }

            estado.datosCriatura = data.datos
            actualizarJuego(data.datos)
            mostrarNotificacion(data.mensaje)
        } else {
            mostrarNotificacion(data.mensaje, true)
        }
    } catch (error) {
        mostrarNotificacion('Error al conectar con el bosque', true)
        console.error(error)
    } finally {
        btn.disabled = false
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

    Audio_.reproducirEfecto('/assets/sounds/eventos/retorno.mp3')
    Audio_.pausarMusica()

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
    estado.datosCriatura   = null
    estado.estadoAnterior  = null
    dom.inputNombre.value  = ''
    if (contenedorParticulas) contenedorParticulas.innerHTML = ''
    Audio_.pausarMusica()
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
            Audio_.reproducirMusica(Audio_.getMusicaBosque(data.datos.bosque?.salud ?? 100))
        }
    } catch (error) {
        console.log('No hay criatura activa, mostrando intro')
    }
}

inicializar()