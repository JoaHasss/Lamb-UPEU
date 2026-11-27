package pe.edu.upeu.lamb.notificacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/*
 * Clase principal. La genera Spring Initializr (PASO 0): NO hay que cambiar nada aqui.
 * Su nombre sale del artifactId (ej. joaquinsanchez-reserva-ms -> JoaquinsanchezReservaMsApplication).
 * Todo el codigo debe estar en este paquete o en subpaquetes (controller, entity, event, ...);
 * si no, Spring no lo encuentra.
 *
 * El flujo de cambios empieza en pom.xml (PASO 1). Ver GUIA-EXAMEN.md en la raiz del servicio.
 */
@SpringBootApplication
public class JoaquinsanchezNotificacionMsApplication {

	public static void main(String[] args) {
		SpringApplication.run(JoaquinsanchezNotificacionMsApplication.class, args);
	}

}
