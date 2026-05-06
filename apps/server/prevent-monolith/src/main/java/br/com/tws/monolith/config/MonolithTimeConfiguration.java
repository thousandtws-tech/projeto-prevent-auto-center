package br.com.tws.monolith.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MonolithTimeConfiguration {

    @Bean
    Clock systemClock() {
        return Clock.systemUTC();
    }
}
