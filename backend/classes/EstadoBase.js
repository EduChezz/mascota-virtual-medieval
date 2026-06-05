// ============================================
// CLASE: EstadoBase
// Clase abstracta base para el patrón STATE
// Cada estado hereda de esta clase y define
// su propio comportamiento
// ============================================

export class EstadoBase {

    constructor(nombre) {
        if (new.target === EstadoBase) {
            throw new Error('EstadoBase es una clase abstracta')
        }
        this.nombre = nombre
    }

    // ── Métodos abstractos ────────────────────
    // Cada estado concreto DEBE implementarlos

    getMensaje()        { throw new Error(`${this.nombre} debe implementar getMensaje()`)     }
    getAnimacion()      { throw new Error(`${this.nombre} debe implementar getAnimacion()`)   }
    getImagenCriatura() { throw new Error(`${this.nombre} debe implementar getImagenCriatura()`) }
    getSonidoAmbiente() { throw new Error(`${this.nombre} debe implementar getSonidoAmbiente()`) }
    getSonidoCriatura() { throw new Error(`${this.nombre} debe implementar getSonidoCriatura()`) }
    getColorBosque()    { throw new Error(`${this.nombre} debe implementar getColorBosque()`) }

    // ── Método que define qué acciones ────────
    // están disponibles en este estado

    getAccionesDisponibles() {
        return ['alimentar', 'jugar', 'dormir', 'bañar', 'meditar', 'hablar']
    }

    // ── Nombre del estado ─────────────────────

    getNombre() { return this.nombre }

    // ── Serialización ─────────────────────────

    toObject() {
        return {
            nombre         : this.nombre,
            mensaje        : this.getMensaje(),
            animacion      : this.getAnimacion(),
            imagenCriatura : this.getImagenCriatura(),
            sonidoAmbiente : this.getSonidoAmbiente(),
            sonidoCriatura : this.getSonidoCriatura(),
            colorBosque    : this.getColorBosque(),
            acciones       : this.getAccionesDisponibles()
        }
    }
}