// ============================================
// MODELO: MascotaModel
// Define el esquema de MongoDB con Mongoose
// Actualizado con sistema de evoluciones Sylvae
// ============================================

import mongoose from 'mongoose'

// ── Esquema de Estadísticas ───────────────────
const EstadisticasSchema = new mongoose.Schema({
    vitalidad  : { type: Number, default: 100, min: 0, max: 100 },
    hambre     : { type: Number, default: 0,   min: 0, max: 100 },
    espiritu   : { type: Number, default: 100, min: 0, max: 100 },
    energia    : { type: Number, default: 100, min: 0, max: 100 },
    vinculo    : { type: Number, default: 50,  min: 0, max: 100 }
}, { _id: false })

// ── Esquema del Bosque ────────────────────────
const BosqueSchema = new mongoose.Schema({
    salud       : { type: Number, default: 100, min: 0, max: 100 },
    descripcion : { type: String, default: 'El bosque florece con vida' },
    color       : { type: String, default: '#2d6e4e' },
    fondo       : { type: String, default: 'bosque_100' }
}, { _id: false })

// ── Esquema de Registro del Historial ─────────
const RegistroSchema = new mongoose.Schema({
    tipo      : { type: String, enum: ['ACCION', 'ESTADO', 'EVOLUCION', 'DIA'] },
    datos     : { type: mongoose.Schema.Types.Mixed },
    timestamp : { type: String }
}, { _id: false })

// ── Esquema principal de la Mascota ───────────
const MascotaSchema = new mongoose.Schema({

    nombre : {
        type      : String,
        required  : [true, 'La criatura necesita un nombre'],
        trim      : true,
        minlength : [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength : [20, 'El nombre no puede superar 20 caracteres']
    },

    fase : {
        type    : String,
        enum    : ['huevo', 'base', 'evolucionada', 'retorno', 'perdido'],
        default : 'huevo'
    },

    // ── NUEVO: tipo de evolución Sylvae ───────
    tipoEvolucion : {
        type    : String,
        enum    : ['natura', 'umbra', 'ignis', 'aqua', 'aether', 'umbris', null],
        default : null
    },

    diasVividos : {
        type    : Number,
        default : 0,
        min     : 0
    },

    diasMaximos : {
        type    : Number,
        default : 15
    },

    estadisticas : {
        type    : EstadisticasSchema,
        default : () => ({})
    },

    bosque : {
        type    : BosqueSchema,
        default : () => ({})
    },

    historial : {
        type    : [RegistroSchema],
        default : []
    },

    estado : {
        type    : String,
        default : 'paz'
    },

    // imagen actual calculada
    imagenActual : {
        type    : String,
        default : '/assets/images/criatura/huevo.png'
    },

    ultimasAcciones : {
        alimentar : { type: Date, default: null },
        jugar     : { type: Date, default: null },
        dormir    : { type: Date, default: null },
        bañar     : { type: Date, default: null },
        meditar   : { type: Date, default: null },
        hablar    : { type: Date, default: null }
    },

    semillas : {
        type    : Number,
        default : 10,
        min     : 0,
        max     : 999
    },

    // contador de acciones para consecuencias
    contadorAcciones : {
        alimentar : { type: Number, default: 0 },
        jugar     : { type: Number, default: 0 },
        dormir    : { type: Number, default: 0 },
        meditar   : { type: Number, default: 0 },
        hablar    : { type: Number, default: 0 }
    },

    // estados especiales
    estadoEspecial : {
        tipo      : { type: String, default: null },
        diasRestantes : { type: Number, default: 0 }
    },

    activa : {
        type    : Boolean,
        default : true
    }

}, {
    timestamps : true
})

// ── Método para obtener datos completos ───────
MascotaSchema.methods.getDatosCompletos = function() {
    return {
        id            : this._id,
        nombre        : this.nombre,
        fase          : this.fase,
        tipoEvolucion : this.tipoEvolucion,
        diasVividos   : this.diasVividos,
        diasMaximos   : this.diasMaximos,
        estadisticas  : this.estadisticas,
        bosque        : this.bosque,
        estado        : this.estado,
        imagenActual  : this.imagenActual,
        activa        : this.activa,
        createdAt     : this.createdAt,
        updatedAt     : this.updatedAt
    }
}

// ── Método para verificar cooldown ────────────
MascotaSchema.methods.puedeEjecutar = function(accion, cooldownMinutos) {
    const ultima = this.ultimasAcciones[accion]
    if (!ultima) return true
    const ahora      = new Date()
    const diferencia = (ahora - ultima) / (1000 * 60)
    return diferencia >= cooldownMinutos
}

export const MascotaModel = mongoose.model('Mascota', MascotaSchema)