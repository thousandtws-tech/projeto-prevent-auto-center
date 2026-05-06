package br.com.tws.msauth;

import br.com.tws.msauth.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class MsAuthApplicationTests extends AbstractPostgresIntegrationTest {

    @Test
    void contextLoads() {
    }
}
