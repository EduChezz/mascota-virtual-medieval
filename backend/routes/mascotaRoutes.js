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

import { Router } from 'express'
import {
    crearMascota,
    obtenerEstado,
    ejecutarAccion,
    ejecutarTick,
    reiniciarJuego
} from '../controllers/mascotaController.js'

const router = Router()

// ── Rutas ─────────────────────────────────────

router.post  ('/crear',     crearMascota)
router.get   ('/estado',    obtenerEstado)
router.post  ('/accion',    ejecutarAccion)
router.post  ('/tick',      ejecutarTick)
router.delete('/reiniciar', reiniciarJuego)

export default router