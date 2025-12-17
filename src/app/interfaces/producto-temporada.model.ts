export interface ProductoTemporada {
    ID_PRODUCT: number;
    TEMPORADA: string;
    PLU: number;
    NOMBRE: string;
    EXISTENCIA: number;
    PRECIO_COMPRA: number;
    PRECIO_VENTA: number;
    GANANCIA: number;
    PROVEDOR: string;
    ULTIMO_INGRESO: Date;
    IMAGE_PATH: string;
}
