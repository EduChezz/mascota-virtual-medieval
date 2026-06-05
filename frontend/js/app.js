// ============================================
// APP.JS — Lógica del Frontend
// El Juramento del Bosque Vivo
//
// Responsabilidades:
// → Manejar navegación entre pantallas
// → Comunicarse con la API del backend
// → Actualizar la UI según el estado
// → Manejar acciones del usuario
// ============================================

// ════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════

const API = 'https://mascota-virtual-medieval.onrender.com/api/mascota'

// ════════════════════════════════════════════
// ESTADO LOCAL
// ════════════════════════════════════════════

const estado = {
    pantalla     : 'intro',
    slideActual  : 0,
    totalSlides  : 5,
    datosCriatura: null,
    tickInterval : null
}

// ════════════════════════════════════════════
// ELEMENTOS DEL DOM
// ════════════════════════════════════════════

const dom = {
    // pantallas
    pantallas : {
        intro  : document.getElementById('pantalla-intro'),
        crear  : document.getElementById('pantalla-crear'),
        juego  : document.getElementById('pantalla-juego'),
        fin    : document.getElementById('pantalla-fin')
    },

    // intro
    slides       : document.querySelectorAll('.intro-slide'),
    btnAnterior  : document.getElementById('btn-anterior'),
    btnSiguiente : document.getElementById('btn-siguiente'),
    btnComenzar  : document.getElementById('btn-comenzar'),
    introPuntos  : document.getElementById('intro-puntos'),

    // crear
    inputNombre  : document.getElementById('input-nombre'),
    btnCrear     : document.getElementById('btn-crear'),
    crearError   : document.getElementById('crear-error'),

    // juego
    bosqueFondo  : document.getElementById('bosque-fondo'),
    bosqueOverlay: document.getElementById('bosque-overlay'),
    barraBosque  : document.getElementById('barra-bosque'),
    valorBosque  : document.getElementById('valor-bosque'),
    nombreCriatura: document.getElementById('nombre-criatura'),
    faseCriatura : document.getElementById('fase-criatura'),
    diasVividos  : document.getElementById('dias-vividos'),
    criaturaSprite: document.getElementById('criatura-sprite'),
    criaturaAura : document.getElementById('criatura-aura'),
    estadoMensaje: document.getElementById('estado-mensaje'),
    accionesPanel: document.getElementById('acciones-panel'),
    botonesAccion: document.querySelectorAll('.btn-accion'),
    notificacion : document.getElementById('notificacion'),
    musicaFondo  : document.getElementById('musica-fondo'),

    // stats
    stats : {
        vitalidad : { barra: document.getElementById('barra-vitalidad'), val: document.getElementById('val-vitalidad') },
        hambre    : { barra: document.getElementById('barra-hambre'),    val: document.getElementById('val-hambre')    },
        espiritu  : { barra: document.getElementById('barra-espiritu'),  val: document.getElementById('val-espiritu')  },
        energia   : { barra: document.getElementById('barra-energia'),   val: document.getElementById('val-energia')   },
        vinculo   : { barra: document.getElementById('barra-vinculo'),   val: document.getElementById('val-vinculo')   }
    },

    // fin
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
// INTRO — Navegación de slides
// ════════════════════════════════════════════

function iniciarIntro() {
    // crear puntos de navegación
    dom.introPuntos.innerHTML = ''
    for (let i = 0; i < estado.totalSlides; i++) {
        const punto = document.createElement('div')
        punto.classList.add('punto')
        if (i === 0) punto.classList.add('activo')
        punto.addEventListener('click', () => irASlide(i))
        dom.introPuntos.appendChild(punto)
    }

    mostrarSlide(0)
}

function mostrarSlide(indice) {
    dom.slides.forEach((s, i) => {
        s.classList.toggle('activo', i === indice)
    })

    document.querySelectorAll('.punto').forEach((p, i) => {
        p.classList.toggle('activo', i === indice)
    })

    // mostrar/ocultar botón comenzar
    const esUltimo = indice === estado.totalSlides - 1
    dom.btnComenzar.style.display = esUltimo ? 'inline-block' : 'none'
    dom.btnAnterior.style.display = indice === 0 ? 'none' : 'inline-block'

    estado.slideActual = indice
}

function irASlide(indice) {
    if (indice < 0 || indice >= estado.totalSlides) return
    mostrarSlide(indice)
}

// eventos intro
dom.btnSiguiente.addEventListener('click', () => {
    irASlide(estado.slideActual + 1)
})

dom.btnAnterior.addEventListener('click', () => {
    irASlide(estado.slideActual - 1)
})

dom.btnComenzar.addEventListener('click', () => {
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
            mostrarPantalla('juego')
            actualizarJuego(data.datos)
            iniciarTickAutomatico()
            mostrarNotificacion(`¡${nombre} ha despertado del huevo espiritual!`)
        } else {
            // si ya existe una criatura activa, cargar el juego
            if (data.mensaje.includes('Ya existe')) {
                await cargarEstado()
            } else {
                dom.crearError.textContent = data.mensaje
            }
        }

    } catch (error) {
        dom.crearError.textContent = 'Error al conectar con el bosque. Intenta de nuevo.'
        console.error(error)
    } finally {
        dom.btnCrear.disabled    = false
        dom.btnCrear.textContent = '✨ Despertar'
    }
})

// enter en el input
dom.inputNombre.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') dom.btnCrear.click()
})

// ════════════════════════════════════════════
// CARGAR ESTADO DESDE EL BACKEND
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

    const { nombre, fase, estado: est, estadisticas, bosque, diasVividos } = datos

    // header
    dom.nombreCriatura.textContent = nombre
    dom.faseCriatura.textContent   = fase
    dom.diasVividos.textContent    = diasVividos

    // bosque
    const saludBosque = bosque?.salud ?? 100
    dom.barraBosque.style.width  = `${saludBosque}%`
    dom.valorBosque.textContent  = saludBosque
    actualizarFondoBosque(saludBosque, bosque?.color)

    // estadísticas
    if (estadisticas) {
        actualizarStat('vitalidad', estadisticas.vitalidad)
        actualizarStat('hambre',    estadisticas.hambre)
        actualizarStat('espiritu',  estadisticas.espiritu)
        actualizarStat('energia',   estadisticas.energia)
        actualizarStat('vinculo',   estadisticas.vinculo)
    }

    // criatura — sprite según fase y estado
    actualizarSpriteCriatura(fase, est?.nombre)

    // mensaje del estado
    if (est?.mensaje) {
        dom.estadoMensaje.textContent = est.mensaje
    }

    // aura según estado
    actualizarAura(est?.nombre)

    // botones de acción disponibles
    if (est?.acciones) {
        actualizarBotonesAccion(est.acciones)
    }

    // verificar fin de juego
    if (est?.nombre === 'retorno' || est?.nombre === 'perdido') {
        setTimeout(() => mostrarPantallaFin(est.nombre, nombre), 2000)
    }
}

function actualizarStat(nombre, valor) {
    const stat = dom.stats[nombre]
    if (!stat) return
    // hambre: la barra se invierte (más hambre = más llena la barra)
    const porcentaje = nombre === 'hambre' ? valor : valor
    stat.barra.style.width  = `${porcentaje}%`
    stat.val.textContent    = Math.round(valor)
}

function actualizarFondoBosque(salud, color) {
    let gradiente = ''
    if (salud >= 75) {
        gradiente = 'radial-gradient(ellipse at center bottom, #0d1f0d 0%, #050a05 60%, #000000 100%)'
    } else if (salud >= 50) {
        gradiente = 'radial-gradient(ellipse at center bottom, #1a1f0d 0%, #080a05 60%, #000000 100%)'
    } else if (salud >= 25) {
        gradiente = 'radial-gradient(ellipse at center bottom, #1f150d 0%, #0a0805 60%, #000000 100%)'
    } else {
        gradiente = 'radial-gradient(ellipse at center bottom, #1f0d0d 0%, #0a0505 60%, #000000 100%)'
    }
    dom.bosqueFondo.style.background = gradiente
}

function actualizarSpriteCriatura(fase, estadoNombre) {
    const sprites = {
        huevo   : '🥚',
        cria    : {
            paz         : '🌱',
            alegre      : '✨',
            hambriento  : '😿',
            somnoliento : '😴',
            triste      : '🌧️',
            peligro     : '⚠️',
            default     : '🌱'
        },
        joven   : {
            paz         : '🦋',
            alegre      : '🌟',
            hambriento  : '🍂',
            somnoliento : '🌙',
            triste      : '🌫️',
            peligro     : '🔥',
            default     : '🦋'
        },
        guardian: {
            paz         : '🐉',
            alegre      : '💫',
            default     : '🐉'
        },
        retorno : '🌿',
        perdido : '💔'
    }

    let sprite = '🥚'

    if (fase === 'huevo') {
        sprite = sprites.huevo
    } else if (sprites[fase]) {
        const faseSprits = sprites[fase]
        sprite = faseSprits[estadoNombre] || faseSprits.default || '🌱'
    } else if (fase === 'retorno') {
        sprite = sprites.retorno
    } else if (fase === 'perdido') {
        sprite = sprites.perdido
    }

    dom.criaturaSprite.textContent = sprite
}

function actualizarAura(estadoNombre) {
    const colores = {
        paz         : 'rgba(45, 110, 78, 0.3)',
        alegre      : 'rgba(127, 255, 127, 0.4)',
        hambriento  : 'rgba(200, 169, 110, 0.3)',
        somnoliento : 'rgba(107, 159, 255, 0.3)',
        triste      : 'rgba(150, 100, 200, 0.3)',
        peligro     : 'rgba(139, 32, 32, 0.5)',
        retorno     : 'rgba(255, 215, 100, 0.5)',
        perdido     : 'rgba(0, 0, 0, 0.8)'
    }

    const color = colores[estadoNombre] || colores.paz
    dom.criaturaAura.style.background =
        `radial-gradient(circle, ${color} 0%, transparent 70%)`
}

function actualizarBotonesAccion(accionesDisponibles) {
    dom.botonesAccion.forEach(btn => {
        const accion = btn.dataset.accion
        btn.disabled = !accionesDisponibles.includes(accion)
    })
}

// ════════════════════════════════════════════
// EJECUTAR ACCIONES
// ════════════════════════════════════════════

dom.botonesAccion.forEach(btn => {
    btn.addEventListener('click', async () => {
        const nombreAccion = btn.dataset.accion
        await ejecutarAccion(nombreAccion, btn)
    })
})

async function ejecutarAccion(nombreAccion, btn) {
    btn.disabled = true

    try {
        const res  = await fetch(`${API}/accion`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ nombreAccion })
        })

        const data = await res.json()

        if (data.exito) {
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
// TICK AUTOMÁTICO — degradación natural
// ════════════════════════════════════════════

function iniciarTickAutomatico() {
    if (estado.tickInterval) clearInterval(estado.tickInterval)

    // tick cada 5 minutos (300000ms)
    // para pruebas usamos 30 segundos (30000ms)
    estado.tickInterval = setInterval(async () => {
        try {
            const res  = await fetch(`${API}/tick`, { method: 'POST' })
            const data = await res.json()

            if (data.exito) {
                actualizarJuego(data.datos)
            }
        } catch (error) {
            console.error('Error en tick:', error)
        }
    }, 30000)  // ← cambia a 300000 para producción
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

    if (tipoFin === 'retorno') {
        dom.finIcono.textContent  = '✨'
        dom.finTitulo.textContent = 'El ciclo se completa'
        dom.finMensaje.textContent =
            `${nombre} ha completado su ciclo y regresa al bosque espiritual. Gracias por tu cuidado.`
    } else {
        dom.finIcono.textContent  = '💔'
        dom.finTitulo.textContent = 'El bosque se ha oscurecido'
        dom.finMensaje.textContent =
            `${nombre} no pudo completar su ciclo. El bosque lo recuerda. ¿Lo intentas de nuevo?`
    }

    mostrarPantalla('fin')
}

// reiniciar juego
dom.btnReiniciar.addEventListener('click', async () => {
    try {
        await fetch(`${API}/reiniciar`, { method: 'DELETE' })
        Bosque_resetInstancia()
    } catch (e) {}

    estado.datosCriatura = null
    dom.inputNombre.value = ''
    mostrarPantalla('crear')
})

// ════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════

async function inicializar() {
    iniciarIntro()
    mostrarPantalla('intro')

    // verificar si ya existe una criatura activa
    try {
        const res  = await fetch(`${API}/estado`)
        const data = await res.json()

        if (data.exito) {
            // ya hay una criatura — ir directo al juego
            estado.datosCriatura = data.datos
            mostrarPantalla('juego')
            actualizarJuego(data.datos)
            iniciarTickAutomatico()
        }
    } catch (error) {
        // no hay criatura — mostrar intro normalmente
        console.log('No hay criatura activa, mostrando intro')
    }
}

// arrancar
inicializar()