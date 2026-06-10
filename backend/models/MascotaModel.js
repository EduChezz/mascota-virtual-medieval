import mongoose from 'mongoose'

const EstadisticasSchema = new mongoose.Schema({
    vitalidad : { type: Number, default: 100, min: 0, max: 100 },
    hambre    : { type: Number, default: 0,   min: 0, max: 100 },
    espiritu  : { type: Number, default: 100, min: 0, max: 100 },
    energia   : { type: Number, default: 100, min: 0, max: 100 },
    vinculo   : { type: Number, default: 50,  min: 0, max: 100 }
}, { _id: false })

const BosqueSchema = new mongoose.Schema({
    salud       : { type: Number, default: 50,  min: 0, max: 100 },
    descripcion : { type: String, default: 'El bosque aguarda tu cuidado' },
    color       : { type: String, default: '#4a6e3a' },
    fondo       : { type: String, default: 'bosque_75' },
    rachaAlta   : { type: Number, default: 0,   min: 0 }
}, { _id: false })

const RegistroSchema = new mongoose.Schema({
    tipo      : { type: String, enum: ['ACCION', 'ESTADO', 'EVOLUCION', 'DIA'] },
    datos     : { type: mongoose.Schema.Types.Mixed },
    timestamp : { type: String }
}, { _id: false })

const MascotaSchema = new mongoose.Schema({
    nombre : { type: String, required: true, trim: true, minlength: 2, maxlength: 20 },
    fase   : { type: String, enum: ['huevo','base','adulta','retorno_feliz','retorno_triste','perdido'], default: 'base' },
    tipoEvolucion   : { type: String, default: null },
    diasVividos     : { type: Number, default: 0, min: 0 },
    diasMaximos     : { type: Number, default: 100 },
    estadisticas    : { type: EstadisticasSchema, default: () => ({}) },
    bosque          : { type: BosqueSchema, default: () => ({}) },
    historial       : { type: [RegistroSchema], default: [] },
    estado          : { type: String, default: 'base_paz' },
    imagenActual    : { type: String, default: '/assets/images/criatura/huevo.png' },
    ultimasAcciones : {
        alimentar : { type: Date, default: null },
        jugar     : { type: Date, default: null },
        dormir    : { type: Date, default: null },
        bañar     : { type: Date, default: null },
        meditar   : { type: Date, default: null },
        hablar    : { type: Date, default: null }
    },
    semillas         : { type: Number, default: 10, min: 0, max: 999 },

    // ── Inventario de ítems comprados ─────────
    inventario : {
        hierba_fresca   : { type: Number, default: 0, min: 0 },
        fruta_encantada : { type: Number, default: 0, min: 0 },
        miel_bosque     : { type: Number, default: 0, min: 0 },
        nectar_sagrado  : { type: Number, default: 0, min: 0 },
        pocion_energia  : { type: Number, default: 0, min: 0 },
        pocion_vinculo  : { type: Number, default: 0, min: 0 },
        pocion_curativa : { type: Number, default: 0, min: 0 },
        semilla_sagrada : { type: Number, default: 0, min: 0 }
    },
    logrosObtenidos : { type: [String], default: [] },
    contadorAcciones : {
        alimentar : { type: Number, default: 0 },
        jugar     : { type: Number, default: 0 },
        dormir    : { type: Number, default: 0 },
        meditar   : { type: Number, default: 0 },
        hablar    : { type: Number, default: 0 }
    },
    estadoEspecial : {
        tipo          : { type: String, default: null },
        diasRestantes : { type: Number, default: 0 }
    },
    activa : { type: Boolean, default: true }
}, { timestamps: true })

MascotaSchema.methods.getDatosCompletos = function() {
    return {
        id: this._id, nombre: this.nombre, fase: this.fase,
        tipoEvolucion: this.tipoEvolucion,
        diasVividos: this.diasVividos, diasMaximos: this.diasMaximos,
        estadisticas: this.estadisticas, bosque: this.bosque,
        estado: this.estado, imagenActual: this.imagenActual,
        activa: this.activa, createdAt: this.createdAt, updatedAt: this.updatedAt
    }
}

MascotaSchema.methods.puedeEjecutar = function(accion, cooldownMinutos) {
    const ultima = this.ultimasAcciones[accion]
    if (!ultima) return true
    return (new Date() - ultima) / (1000 * 60) >= cooldownMinutos
}

export const MascotaModel = mongoose.model('Mascota', MascotaSchema)