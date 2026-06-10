// ============================================
// RUTAS: mascotaRoutes
// ============================================

import { Router } from 'express'
import {
    crearMascota,
    obtenerEstado,
    ejecutarAccion,
    ejecutarTick,
    reiniciarJuego,
    completarMinijuego,
    comprarItem,
    usarItem
} from '../controllers/mascotaController.js'

const router = Router()

router.post  ('/crear',      crearMascota)
router.get   ('/estado',     obtenerEstado)
router.post  ('/accion',     ejecutarAccion)
router.post  ('/tick',       ejecutarTick)
router.delete('/reiniciar',  reiniciarJuego)
router.post  ('/minijuego',  completarMinijuego)
router.post  ('/comprar',    comprarItem)
router.post  ('/usar-item',  usarItem)

export default router