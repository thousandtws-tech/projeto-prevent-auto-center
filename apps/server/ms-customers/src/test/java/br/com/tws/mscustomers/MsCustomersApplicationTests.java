package br.com.tws.mscustomers;

import br.com.tws.mscustomers.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class MsCustomersApplicationTests extends AbstractPostgresIntegrationTest {

    @Test
    void contextLoads() {
    }

}
