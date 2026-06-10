// ============================================
// CONTROLADOR: mascotaController
// Actualizado con sistema de evoluciones Sylvae
// ============================================

import { MascotaModel }  from '../models/MascotaModel.js'
import { Criatura }      from '../classes/Criatura.js'
import { Bosque }        from '../classes/Bosque.js'
import { Historial }     from '../classes/Historial.js'
import { AccionFactory } from '../classes/Acciones.js'

// ════════════════════════════════════════════
// HELPER — reconstruir criatura desde MongoDB
// ════════════════════════════════════════════

function reconstruirCriatura(doc) {
    const criatura = Criatura.fromObject({
        nombre        : doc.nombre,
        fase          : doc.fase,
        tipoEvolucion : doc.tipoEvolucion,
        diasVividos   : doc.diasVividos,
        diasMaximos   : doc.diasMaximos,
        estadisticas  : doc.estadisticas,
        createdAt     : doc.createdAt,
        logrosObtenidos  : doc.logrosObtenidos  || [],   
        contadorAcciones : doc.contadorAcciones || {}    
    })

    const bosque = Bosque.getInstance()
    bosque.cargarDesdeObject(doc.bosque)

    const historial = Historial.getInstance()
    historial.cargarDesdeObject({ registros: doc.historial })

    criatura.agregarObservador(bosque)
    criatura.agregarObservador(historial)

    return { criatura, bosque, historial }
}

// ════════════════════════════════════════════
// HELPER — guardar criatura en MongoDB
// ════════════════════════════════════════════

async function guardarCriatura(doc, criatura, bosque, historial) {
    const datos = criatura.toObject()
    doc.nombre           = criatura.getNombre()
    doc.fase             = criatura.getFase()
    doc.tipoEvolucion    = criatura.getTipoEvolucion()
    doc.diasVividos      = criatura.getDiasVividos()
    doc.estadisticas     = criatura.getEstadisticas().toObject()
    doc.estado           = criatura.getEstado().getNombre()
    doc.imagenActual     = criatura.getImagenActual()
    doc.bosque           = bosque.toObject()
    doc.historial        = historial.getRegistros(50)
    doc.logrosObtenidos  = datos.logrosObtenidos  || []  
    doc.contadorAcciones = datos.contadorAcciones || {}   
    doc.markModified('logrosObtenidos')
    doc.markModified('contadorAcciones')
    await doc.save()
    return doc
}

// ════════════════════════════════════════════
// HELPER — construir respuesta completa
// ════════════════════════════════════════════

function construirRespuesta(criatura, bosque, historial, doc) {
    const datos = criatura.toObject()
    return {
        id            : doc._id,
        nombre        : criatura.getNombre(),
        fase          : criatura.getFase(),
        tipoEvolucion : criatura.getTipoEvolucion(),
        estado        : criatura.getEstado().toObject(),
        estadisticas  : datos.estadisticas,
        bosque        : bosque.toObject(),
        diasVividos   : criatura.getDiasVividos(),
        diasMaximos   : criatura.getDiasMaximos(),
        imagenActual  : criatura.getImagenActual(),
        tendencia     : datos.tendencia,
        urgencias     : datos.urgencias,
        resumen       : datos.resumen,
        semillas      : doc.semillas || 0,
        inventario    : doc.inventario || {}
    }
}

// ════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════

// ── POST /api/mascota/crear ───────────────────
export async function crearMascota(req, res) {
    try {
        const { nombre } = req.body

        if (!nombre || nombre.trim().length < 2) {
            return res.status(400).json({
                exito   : false,
                mensaje : 'El nombre debe tener al menos 2 caracteres'
            })
        }

        const existente = await MascotaModel.findOne({ activa: true })
        if (existente) {
            return res.status(400).json({
                exito   : false,
                mensaje : 'Ya existe una criatura activa. Cuídala bien.'
            })
        }

        Bosque.resetInstancia()
        Historial.resetInstancia()

        const criatura  = new Criatura(nombre.trim())
        const bosque    = Bosque.getInstance()
        const historial = Historial.getInstance()

        criatura.agregarObservador(bosque)
        criatura.agregarObservador(historial)

        const doc = new MascotaModel({
            nombre        : criatura.getNombre(),
            fase          : criatura.getFase(),
            tipoEvolucion : criatura.getTipoEvolucion(),
            diasVividos   : criatura.getDiasVividos(),
            estadisticas  : criatura.getEstadisticas().toObject(),
            estado        : criatura.getEstado().getNombre(),
            imagenActual  : criatura.getImagenActual(),
            bosque        : bosque.toObject(),
            historial     : []
        })

        await doc.save()

        return res.status(201).json({
            exito   : true,
            mensaje : `¡${nombre} ha nacido del huevo espiritual!`,
            datos   : construirRespuesta(criatura, bosque, historial, doc)
        })

    } catch (error) {
        console.error('Error al crear mascota:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── GET /api/mascota/estado ───────────────────
export async function obtenerEstado(req, res) {
    try {
        const doc = await MascotaModel.findOne({ activa: true })

        if (!doc) {
            return res.status(404).json({
                exito   : false,
                mensaje : 'No hay ninguna criatura activa'
            })
        }

        const { criatura, bosque, historial } = reconstruirCriatura(doc)

        return res.json({
            exito : true,
            datos : {
                ...construirRespuesta(criatura, bosque, historial, doc),
                historial : historial.getRegistros(10),
                resumen   : historial.getResumen()
            }
        })

    } catch (error) {
        console.error('Error al obtener estado:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── POST /api/mascota/accion ──────────────────
export async function ejecutarAccion(req, res) {
    try {
        const { nombreAccion } = req.body

        if (!nombreAccion) {
            return res.status(400).json({
                exito   : false,
                mensaje : 'Debes especificar una acción'
            })
        }

        const doc = await MascotaModel.findOne({ activa: true })

        if (!doc) {
            return res.status(404).json({
                exito   : false,
                mensaje : 'No hay ninguna criatura activa'
            })
        }

        const cooldowns = {
            alimentar : 120,
            jugar     : 60,
            dormir    : 480,
            bañar     : 240,
            meditar   : 360,
            hablar    : 30
        }

        const cooldown = cooldowns[nombreAccion]
        if (cooldown && !doc.puedeEjecutar(nombreAccion, cooldown)) {
            return res.status(429).json({
                exito   : false,
                mensaje : `La criatura necesita descansar antes de ${nombreAccion} de nuevo.`
            })
        }

        const { criatura, bosque, historial } = reconstruirCriatura(doc)
        const accion    = AccionFactory.crear(nombreAccion)
        const resultado = criatura.ejecutarAccion(accion)

        if (!resultado.exito) {
            return res.status(400).json({
                exito   : false,
                mensaje : resultado.mensaje
            })
        }

        doc.ultimasAcciones[nombreAccion] = new Date()
        doc.markModified('ultimasAcciones')

        await guardarCriatura(doc, criatura, bosque, historial)

        return res.json({
            exito   : true,
            mensaje : resultado.resultado.mensaje,
            logros  : resultado.logros || [],        // ← agregar
            datos   : {
                ...construirRespuesta(criatura, bosque, historial, doc),
                efectos : resultado.resultado.efectos
            }
        })

    } catch (error) {
        console.error('Error al ejecutar acción:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── POST /api/mascota/tick ────────────────────
export async function ejecutarTick(req, res) {
    try {
        const doc = await MascotaModel.findOne({ activa: true })

        if (!doc) {
            return res.status(404).json({
                exito   : false,
                mensaje : 'No hay ninguna criatura activa'
            })
        }

        const { criatura, bosque, historial } = reconstruirCriatura(doc)
        criatura.tickDiario()

        if (criatura.getEstado().getNombre() === 'perdido') {
            doc.activa = false
        }

        await guardarCriatura(doc, criatura, bosque, historial)

        // extraer evento del historial reciente
        const registros     = historial.getRegistros(1)
        const ultimoRegistro = registros[0]
        const eventoActual   = ultimoRegistro?.datos?.evento || null

        return res.json({
            exito   : true,
            mensaje : `Día ${criatura.getDiasVividos()} del ciclo`,
            datos   : construirRespuesta(criatura, bosque, historial, doc),
            evento  : eventoActual
        })

    } catch (error) {
        console.error('Error en tick:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── POST /api/mascota/minijuego ───────────────
export async function completarMinijuego(req, res) {
    try {
        const { semillasGanadas } = req.body

        if (!semillasGanadas || semillasGanadas < 0 || semillasGanadas > 50) {
            return res.status(400).json({
                exito   : false,
                mensaje : 'Semillas inválidas'
            })
        }

        const doc = await MascotaModel.findOne({ activa: true })
        if (!doc) {
            return res.status(404).json({
                exito   : false,
                mensaje : 'No hay criatura activa'
            })
        }

        const { criatura, bosque, historial } = reconstruirCriatura(doc)

        // agregar semillas
        doc.semillas = Math.min(999, (doc.semillas || 0) + semillasGanadas)

        // la criatura pierde energía por trabajar
        criatura.getEstadisticas().modificar('energia', -10)
        criatura.getEstadisticas().modificar('vinculo', +5)

        await guardarCriatura(doc, criatura, bosque, historial)

        return res.json({
            exito    : true,
            mensaje  : `¡Ganaste ${semillasGanadas} semillas de luz! 🌱`,
            semillas : doc.semillas,
            datos    : construirRespuesta(criatura, bosque, historial, doc)
        })

    } catch (error) {
        console.error('Error en minijuego:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── POST /api/mascota/comprar ─────────────────
export async function comprarItem(req, res) {
    try {
        const { item } = req.body

        const costos = {
            hierba_fresca   : 3,
            fruta_encantada : 8,
            miel_bosque     : 15,
            nectar_sagrado  : 25,
            pocion_energia  : 10,
            pocion_vinculo  : 15,
            pocion_curativa : 20
        }

        const costo = costos[item]
        if (!costo) {
            return res.status(400).json({ exito: false, mensaje: 'Item no encontrado en la tienda' })
        }

        const doc = await MascotaModel.findOne({ activa: true })
        if (!doc) {
            return res.status(404).json({ exito: false, mensaje: 'No hay criatura activa' })
        }

        if ((doc.semillas || 0) < costo) {
            return res.status(400).json({
                exito   : false,
                mensaje : `No tienes suficientes semillas. Necesitas ${costo} 🌱`
            })
        }

        // ── Descontar semillas y guardar en inventario ──
        doc.semillas = (doc.semillas || 0) - costo
        if (!doc.inventario) doc.inventario = {}
        doc.inventario[item] = (doc.inventario[item] || 0) + 1
        doc.markModified('inventario')
        await doc.save()

        const nombresItems = {
            hierba_fresca   : 'Hierba Fresca',
            fruta_encantada : 'Fruta Encantada',
            miel_bosque     : 'Miel del Bosque',
            nectar_sagrado  : 'Néctar Sagrado',
            pocion_energia  : 'Poción de Energía',
            pocion_vinculo  : 'Poción de Vínculo',
            pocion_curativa : 'Poción Curativa'
        }

        return res.json({
            exito      : true,
            mensaje    : `🎒 ${nombresItems[item]} guardado en tu mochila`,
            semillas   : doc.semillas,
            inventario : doc.inventario
        })

    } catch (error) {
        console.error('Error al comprar:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── POST /api/mascota/usar-item ───────────────
export async function usarItem(req, res) {
    try {
        const { item } = req.body

        const doc = await MascotaModel.findOne({ activa: true })
        if (!doc) {
            return res.status(404).json({ exito: false, mensaje: 'No hay criatura activa' })
        }

        const cantidad = doc.inventario?.[item] || 0
        if (cantidad <= 0) {
            return res.status(400).json({ exito: false, mensaje: 'No tienes ese ítem en tu mochila' })
        }

        const { criatura, bosque, historial } = reconstruirCriatura(doc)

        // aplicar efecto del ítem
        const accion    = AccionFactory.crear('comprar', { item })
        const resultado = accion.ejecutar(criatura.getEstadisticas())

        // descontar del inventario
        doc.inventario[item] = cantidad - 1
        doc.markModified('inventario')

        await guardarCriatura(doc, criatura, bosque, historial)

        return res.json({
            exito      : true,
            mensaje    : resultado.mensaje,
            efectos    : resultado.efectos,
            inventario : doc.inventario,
            datos      : construirRespuesta(criatura, bosque, historial, doc)
        })

    } catch (error) {
        console.error('Error al usar ítem:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}

// ── DELETE /api/mascota/reiniciar ─────────────
export async function reiniciarJuego(req, res) {
    try {
        await MascotaModel.updateMany({}, { activa: false })
        Bosque.resetInstancia()
        Historial.resetInstancia()

        return res.json({
            exito   : true,
            mensaje : 'El bosque se ha reiniciado. Una nueva criatura puede nacer.'
        })

    } catch (error) {
        console.error('Error al reiniciar:', error)
        res.status(500).json({ exito: false, mensaje: error.message })
    }
}