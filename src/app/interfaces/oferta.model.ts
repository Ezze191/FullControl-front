export interface Oferta {
    ID_OFERTA: number;
    PLU?: number;
    NOMBRE: string;
    DESCRIPCION: string;
    PRECIO: number;
    EXISTENCIA: number;
    FECHA_INICIO?: string;
    FECHA_FIN?: string;
    IMAGE_PATH: string;
}
