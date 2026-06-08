// ============================================
// RUTAS: mascotaRoutes
// Define los endpoints REST de la API
//
// ENDPOINTS DISPONIBLES:
// ─────────────────────────────────────────────
// POST   /api/mascota/crear      → crear mascota
// GET    /api/mascota/estado     → obtener estado
// POST   /api/mascota/accion     → ejecutar acción
// POST   /api/mascota/tick       → tick diario
// DELETE /api/mascota/reiniciar  → reiniciar juego
// ─────────────────────────────────────────────
// ============================================

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
    comprarItem
} from '../controllers/mascotaController.js'

const router = Router()

router.post  ('/crear',      crearMascota)
router.get   ('/estado',     obtenerEstado)
router.post  ('/accion',     ejecutarAccion)
router.post  ('/tick',       ejecutarTick)
router.delete('/reiniciar',  reiniciarJuego)
router.post  ('/minijuego',  completarMinijuego)
router.post  ('/comprar',    comprarItem)

export default router