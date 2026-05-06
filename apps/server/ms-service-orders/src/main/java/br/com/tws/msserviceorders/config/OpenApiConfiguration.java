package br.com.tws.msserviceorders.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI msServiceOrdersOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("MS Service Orders API")
                        .version("v1")
                        .description("API reativa multi-tenant para ordens de servico, compartilhamento e assinatura.")
                        .contact(new Contact()
                                .name("Prevent Backend")
                                .email("backend@prevent.local"))
                        .license(new License()
                                .name("Uso interno")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .servers(List.of(
                        new Server()
                                .url("/")
                                .description("Acesso via API Gateway ou execucao local")
                ));
    }
}
