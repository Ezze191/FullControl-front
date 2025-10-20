import { HttpInterceptorFn } from '@angular/common/http';
import { catchError , throwError} from 'rxjs';

export const errorsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      let errorMsg = 'Ocurrió un error inesperado';

      if (error.status === 0) {
        errorMsg = 'No se pudo conectar al servidor';
      } else if (error.status === 400) {
        errorMsg = 'Petición incorrecta (400)';
      } else if (error.status === 401) {
        errorMsg = 'No autorizado. Inicia sesión nuevamente (401).';
      } else if (error.status === 403) {
        errorMsg = 'Acceso denegado (403)';
      } else if (error.status === 404) {
        errorMsg = 'Recurso no encontrado (404)';
      } else if (error.status >= 500) {
        errorMsg = 'Error del servidor (500+)';
      }

      if (error.error?.message) {
        errorMsg = error.error.message;
      }

      alert(errorMsg);
      return throwError(() => error);
    })
  );


};
