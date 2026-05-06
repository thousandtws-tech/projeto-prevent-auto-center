package br.com.tws.monolith.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MonolithOpenApiConfiguration {

    @Bean
    OpenAPI preventMonolithOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Prevent Modular Monolith API")
                        .version("v1")
                        .description("Backend monolitico modular com auth, clientes, ordens de servico e agendamentos.")
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
                                .description("Execucao local ou container unico")
                ));
    }

    @Bean
    GroupedOpenApi authOpenApiGroup() {
        return GroupedOpenApi.builder()
                .group("auth")
                .pathsToMatch("/auth/**")
                .build();
    }

    @Bean
    GroupedOpenApi customersOpenApiGroup() {
        return GroupedOpenApi.builder()
                .group("customers")
                .pathsToMatch("/customers/**", "/vehicles/**")
                .build();
    }

    @Bean
    GroupedOpenApi serviceOrdersOpenApiGroup() {
        return GroupedOpenApi.builder()
                .group("service-orders")
                .pathsToMatch("/service-orders/**")
                .build();
    }

    @Bean
    GroupedOpenApi schedulingOpenApiGroup() {
        return GroupedOpenApi.builder()
                .group("scheduling")
                .pathsToMatch("/scheduling/**")
                .build();
    }
}
