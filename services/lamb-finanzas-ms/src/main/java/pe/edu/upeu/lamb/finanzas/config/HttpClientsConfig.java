package pe.edu.upeu.lamb.finanzas.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientsConfig {

    // @Primary y sin @LoadBalanced: si no existiera, el unico RestClient.Builder del contexto
    // seria el load-balanced de abajo, y el cliente Eureka lo tomaria para hablarle al propio
    // servidor Eureka (http://localhost:18761/eureka), intentando resolver "localhost" como si
    // fuera un nombre de servicio registrado -> "No instances available for localhost" y el
    // servicio nunca se registra (aunque el resto de la app funcione bien).
    @Bean
    @Primary
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    @LoadBalanced
    public RestClient.Builder loadBalancedRestClientBuilder() {
        return RestClient.builder();
    }

    // Llamada directa via Eureka (nombre de servicio), sin pasar por el Gateway: comunicacion M2M.
    @Bean
    public RestClient ingresosPagosRestClient(@LoadBalanced RestClient.Builder loadBalancedRestClientBuilder) {
        return loadBalancedRestClientBuilder.baseUrl("http://ingresos-pagos-ms").build();
    }
}
