package br.com.tws.monolith;

import br.com.tws.msauth.security.JwtProperties;
import br.com.tws.msauth.service.EmailVerificationProperties;
import br.com.tws.msbackup.config.BackupProperties;
import br.com.tws.msserviceorders.config.ServiceOrdersProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties({
        JwtProperties.class,
        EmailVerificationProperties.class,
        BackupProperties.class,
        ServiceOrdersProperties.class
})
@EnableScheduling
@EnableR2dbcRepositories(basePackages = {
        "br.com.tws.msauth.repository",
        "br.com.tws.msbackup.repository",
        "br.com.tws.mscustomers.repository",
        "br.com.tws.msserviceorders.repository",
        "br.com.tws.msscheduling.repository"
})
@ComponentScan(
        basePackages = {
                "br.com.tws.monolith",
                "br.com.tws.msauth",
                "br.com.tws.msbackup",
                "br.com.tws.mscustomers",
                "br.com.tws.msserviceorders",
                "br.com.tws.msscheduling"
        },
        nameGenerator = FullyQualifiedAnnotationBeanNameGenerator.class,
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.REGEX,
                        pattern = "br\\.com\\.tws\\.(msauth|mscustomers|msserviceorders|msscheduling)\\..*Application"
                ),
                @ComponentScan.Filter(
                        type = FilterType.REGEX,
                        pattern = "br\\.com\\.tws\\.(msauth|mscustomers|msserviceorders|msscheduling)\\.(security|config|exception)\\.(SecurityConfiguration|OpenApiConfiguration|TimeConfiguration|GlobalExceptionHandler)"
                )
        }
)
public class PreventMonolithApplication {

    public static void main(String[] args) {
        SpringApplication.run(PreventMonolithApplication.class, args);
    }
}
