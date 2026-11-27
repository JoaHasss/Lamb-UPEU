package pe.edu.upeu.lamb.notificacion;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/*
 * Test que genera Initializr. Levanta TODO el contexto (BD, Kafka, Config) y falla si no estan
 * arriba, rompiendo "mvnw package". Por eso esta con @Disabled. En el examen: borralo o ponle @Disabled.
 */
@SpringBootTest
class JoaquinsanchezNotificacionMsApplicationTests {

	@Disabled
	@Test
	void contextLoads() {
	}

}
