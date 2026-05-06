package br.com.tws.msauth.service.impl;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import br.com.tws.msauth.exception.ServiceUnavailableException;
import br.com.tws.msauth.service.EmailVerificationEmailService;
import br.com.tws.msauth.service.EmailVerificationProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
public class ThymeleafEmailVerificationService implements EmailVerificationEmailService {

    private final JavaMailSender javaMailSender;
    private final SpringTemplateEngine templateEngine;
    private final EmailVerificationProperties properties;

    @Override
    public Mono<Void> sendSignupVerificationEmail(WorkshopEntity workshop, AuthUserEntity user, String rawToken) {
        return Mono.<Void>fromRunnable(() -> {
                    if (!StringUtils.hasText(properties.mailFrom())) {
                        throw new ServiceUnavailableException("Configuracao de e-mail de verificacao incompleta.");
                    }

                    Context context = new Context();
                    context.setVariable("ownerName", user.getFullName());
                    context.setVariable("workshopName", workshop.getName());
                    context.setVariable("verificationCode", rawToken);
                    context.setVariable("expirationLabel", formatDuration(properties.tokenTtl()));

                    String html = templateEngine.process("mail/email-verification", context);

                    try {
                        MimeMessage message = javaMailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
                        helper.setFrom(properties.mailFrom());
                        helper.setTo(user.getEmail());
                        helper.setSubject("Confirme seu e-mail para ativar a oficina");
                        helper.setText(html, true);
                        javaMailSender.send(message);
                    } catch (MessagingException exception) {
                        throw new ServiceUnavailableException("Nao foi possivel montar o e-mail de verificacao.", exception);
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorResume(exception -> {
                    if (exception instanceof ServiceUnavailableException serviceUnavailableException) {
                        return Mono.error(serviceUnavailableException);
                    }

                    return Mono.error(new ServiceUnavailableException(
                            "Nao foi possivel enviar o e-mail de verificacao.",
                            exception
                    ));
                });
    }

    private String formatDuration(Duration duration) {
        long hours = Math.max(1, duration.toHours());

        if (hours < 24) {
            return hours == 1 ? "1 hora" : hours + " horas";
        }

        long days = Math.max(1, hours / 24);
        return days == 1 ? "1 dia" : days + " dias";
    }
}
