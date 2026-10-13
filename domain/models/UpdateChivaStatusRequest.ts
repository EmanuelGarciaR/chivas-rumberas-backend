import { ChivaStatus } from "./Chiva";

/**
 * DTO de entrada para actualizar el estado de una chiva.
 * Se mantiene en domain/models como tipo de datos compartido.
 */
export interface UpdateChivaStatusRequest {
  chivaId: string;
  newStatus: ChivaStatus;
}
