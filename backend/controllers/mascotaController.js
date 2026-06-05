// ============================================
// CONTROLADOR: mascotaController
// Maneja la lógica de cada endpoint
// Conecta la API con las clases POO
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

    // reconstruir criatura desde el documento
    const criatura = Criatura.fromObject({
        nombre      : doc.nombre,
        fase        : doc.fase,
        diasVividos : doc.diasVividos,
        diasMaximos : doc.diasMaximos,
        estadisticas: doc.estadisticas,
        createdAt   : doc.createdAt
    })

    // reconstruir bosque (singleton)
    const bosque = Bosque.getInstance()
    bosque.cargarDesdeObject(doc.bosque)

    // reconstruir historial (singleton)
    const historial = Historial.getInstance()
    historial.cargarDesdeObject({ registros: doc.historial })

    // conectar observadores
    criatura.agregarObservador(bosque)
    criatura.agregarObservador(historial)

    return { criatura, bosque, historial }
}

// ════════════════════════════════════════════
// HELPER — guardar criatura en MongoDB
// ════════════════════════════════════════════

async function guardarCriatura(doc, criatura, bosque, historial) {

    doc.nombre       = criatura.getNombre()
    doc.fase         = criatura.getFase()
    doc.diasVividos  = criatura.getDiasVividos()
    doc.estadisticas = criatura.getEstadisticas().toObject()
    doc.estado       = criatura.getEstado().getNombre()
    doc.bosque       = bosque.toObject()
    doc.historial    = historial.getRegistros(50)

    await doc.save()
    return doc
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

        // verificar si ya existe una mascota activa
        const existente = await MascotaModel.findOne({ activa: true })
        if (existente) {
            return res.status(400).json({
                exito   : false,
                mensaje : 'Ya existe una criatura activa. Cuídala bien.'
            })
        }

        // resetear singletons para nueva criatura
        Bosque.resetInstancia()
        Historial.resetInstancia()

        // crear nueva criatura con POO
        const criatura  = new Criatura(nombre.trim())
        const bosque    = Bosque.getInstance()
        const historial = Historial.getInstance()

        // conectar observadores
        criatura.agregarObservador(bosque)
        criatura.agregarObservador(historial)

        // guardar en MongoDB
        const doc = new MascotaModel({
            nombre       : criatura.getNombre(),
            fase         : criatura.getFase(),
            diasVividos  : criatura.getDiasVividos(),
            estadisticas : criatura.getEstadisticas().toObject(),
            estado       : criatura.getEstado().getNombre(),
            bosque       : bosque.toObject(),
            historial    : []
        })

        await doc.save()

        return res.status(201).json({
            exito   : true,
            mensaje : `¡${nombre} ha nacido del huevo espiritual!`,
            datos   : {
                id           : doc._id,
                nombre       : criatura.getNombre(),
                fase         : criatura.getFase(),
                estado       : criatura.getEstado().toObject(),
                estadisticas : criatura.getEstadisticas().toObject(),
                bosque       : bosque.toObject(),
                diasVividos  : criatura.getDiasVividos(),
                diasMaximos  : criatura.getDiasMaximos()
            }
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
                id           : doc._id,
                nombre       : criatura.getNombre(),
                fase         : criatura.getFase(),
                estado       : criatura.getEstado().toObject(),
                estadisticas : criatura.getEstadisticas().toObject(),
                bosque       : bosque.toObject(),
                diasVividos  : criatura.getDiasVividos(),
                diasMaximos  : criatura.getDiasMaximos(),
                historial    : historial.getRegistros(10),
                resumen      : historial.getResumen()
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

        // verificar cooldown
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

        // reconstruir criatura
        const { criatura, bosque, historial } = reconstruirCriatura(doc)

        // crear acción con Factory
        const accion    = AccionFactory.crear(nombreAccion)
        const resultado = criatura.ejecutarAccion(accion)

        if (!resultado.exito) {
            return res.status(400).json({
                exito   : false,
                mensaje : resultado.mensaje
            })
        }

        // actualizar timestamp de la acción
        doc.ultimasAcciones[nombreAccion] = new Date()
        doc.markModified('ultimasAcciones')

        // guardar en MongoDB
        await guardarCriatura(doc, criatura, bosque, historial)

        return res.json({
            exito   : true,
            mensaje : resultado.resultado.mensaje,
            datos   : {
                nombre       : criatura.getNombre(),
                fase         : criatura.getFase(),
                estado       : criatura.getEstado().toObject(),
                estadisticas : criatura.getEstadisticas().toObject(),
                bosque       : bosque.toObject(),
                efectos      : resultado.resultado.efectos
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

        // ejecutar degradación diaria
        criatura.tickDiario()

        // verificar si la criatura está perdida
        if (criatura.getEstado().getNombre() === 'perdido') {
            doc.activa = false
        }

        await guardarCriatura(doc, criatura, bosque, historial)

        return res.json({
            exito   : true,
            mensaje : `Día ${criatura.getDiasVividos()} del ciclo`,
            datos   : {
                nombre       : criatura.getNombre(),
                fase         : criatura.getFase(),
                estado       : criatura.getEstado().toObject(),
                estadisticas : criatura.getEstadisticas().toObject(),
                bosque       : bosque.toObject(),
                diasVividos  : criatura.getDiasVividos()
            }
        })

    } catch (error) {
        console.error('Error en tick:', error)
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