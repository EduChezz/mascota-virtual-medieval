// ============================================
// SERVER.JS — Entrada principal del backend
// El Juramento del Bosque Vivo
//
// Responsabilidades:
// → Conectar con MongoDB Atlas
// → Configurar Express
// → Registrar rutas
// → Iniciar servidor
// ============================================

import express    from 'express'
import mongoose   from 'mongoose'
import cors       from 'cors'
import dotenv     from 'dotenv'
import path       from 'path'
import { fileURLToPath } from 'url'
import mascotaRoutes     from './routes/mascotaRoutes.js'

// ── Configuración de rutas para ES Modules ────
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// ── Cargar variables de entorno ───────────────
dotenv.config()

// ── Crear aplicación Express ──────────────────
const app  = express()
const PORT = process.env.PORT || 3000

// ════════════════════════════════════════════
// MIDDLEWARES
// ════════════════════════════════════════════

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')))

// ════════════════════════════════════════════
// RUTAS API
// ════════════════════════════════════════════

app.use('/api/mascota', mascotaRoutes)

// ── Ruta raíz → sirve el frontend ────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

// ── Ruta de salud del servidor ────────────────
app.get('/api/health', (req, res) => {
    res.json({
        estado    : 'El servidor del bosque está activo 🌿',
        timestamp : new Date().toISOString(),
        mongodb   : mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado'
    })
})

// ── Ruta 404 ──────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        exito   : false,
        mensaje : 'Ruta no encontrada en el bosque'
    })
})

// ── Manejo global de errores ──────────────────
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err)
    res.status(500).json({
        exito   : false,
        mensaje : 'Error interno del bosque'
    })
})

// ════════════════════════════════════════════
// CONEXIÓN MONGODB + INICIO DEL SERVIDOR
// ════════════════════════════════════════════

async function iniciarServidor() {
    try {
        console.log('🌿 Conectando con MongoDB Atlas...')

        await mongoose.connect(process.env.MONGODB_URI)

        console.log('✅ MongoDB Atlas conectado — El bosque despierta')

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║   🌙 El Juramento del Bosque Vivo      ║
║   Servidor activo en puerto ${PORT}       ║
║   http://localhost:${PORT}                ║
╚════════════════════════════════════════╝
            `)
        })

    } catch (error) {
        console.error('❌ Error al conectar MongoDB:', error.message)
        process.exit(1)
    }
}

iniciarServidor()