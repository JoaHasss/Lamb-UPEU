package pe.edu.upeu.lamb.finanzas.entity;

public enum MetodoPago {
    TARJETA,
    YAPE,
    PLIN,
    TRANSFERENCIA,
    EFECTIVO,
    /** Checkout Pro: el metodo se elige en la pagina de Mercado Pago. Al confirmar se reemplaza
     *  por el metodo real (TARJETA, YAPE, EFECTIVO...) si se puede deducir; si no, queda asi. */
    MERCADOPAGO
}
