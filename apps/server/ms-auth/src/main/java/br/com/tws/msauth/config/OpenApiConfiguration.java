package br.com.tws.msauth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI msAuthOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("MS Auth API")
                        .version("v1")
                        .description("API reativa de autenticacao multi-tenant para oficinas.")
                        .contact(new Contact()
                                .name("Prevent Backend")
                                .email("backend@prevent.local"))
                        .license(new License()
                                .name("Uso interno")))
                .servers(List.of(
                        new Server()
                                .url("/")
                                .description("Acesso via API Gateway ou execucao local")
                ));
    }
}
