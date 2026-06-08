package com.bidflow.service;

import com.bidflow.model.OtpToken;
import com.bidflow.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;

    // Optional — only injected if mail is configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpTokenRepository otpTokenRepository) {
        this.otpTokenRepository = otpTokenRepository;
    }

    private boolean isMailConfigured() {
        return mailSender != null
            && fromEmail != null
            && !fromEmail.isBlank()
            && !fromEmail.equals("your-gmail@gmail.com");
    }

    // Generate OTP, save to DB, and send async (non-blocking)
    @Async
    public void sendOtp(String email, String userName) throws Exception {
        otpTokenRepository.deleteByEmail(email);

        String otp = String.format("%06d", random.nextInt(1000000));

        OtpToken token = new OtpToken();
        token.setEmail(email);
        token.setOtp(otp);
        token.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        otpTokenRepository.save(token);

        if (isMailConfigured()) {
            sendOtpEmail(email, userName, otp);
            System.out.println("✅ OTP email sent to: " + email);
        } else {
            // Console fallback — show OTP in IntelliJ console for testing
            System.out.println("\n" +
                "╔══════════════════════════════════════╗\n" +
                "║         BidNova AuctionX Tracking — OTP CODE        ║\n" +
                "╠══════════════════════════════════════╣\n" +
                "║  Email : " + email + "\n" +
                "║  OTP   : " + otp + "                    ║\n" +
                "║  Valid : " + expiryMinutes + " minutes               ║\n" +
                "╚══════════════════════════════════════╝\n"
            );
        }
    }

    // Verify OTP
    public boolean verifyOtp(String email, String otp) {
        OtpToken token = otpTokenRepository.findTopByEmailOrderByCreatedAtDesc(email).orElse(null);
        if (token == null) return false;
        if (token.isUsed()) return false;
        if (Instant.now().isAfter(token.getExpiresAt())) return false;
        if (!token.getOtp().equals(otp)) return false;

        token.setUsed(true);
        otpTokenRepository.save(token);
        return true;
    }

    private void sendOtpEmail(String to, String userName, String otp) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("BidNova AuctionX Tracking — Your Login OTP");

        String html = """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e1a;color:#f9fafb;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <h1 style="color:#60a5fa;font-size:22px;margin:12px 0 4px;">BidNova AuctionX Tracking</h1>
                <p style="color:#9ca3af;font-size:13px;margin:0;">Login Verification</p>
              </div>
              <p style="font-size:15px;margin-bottom:8px;">Hello <strong>%s</strong>,</p>
              <p style="color:#9ca3af;font-size:13px;margin-bottom:24px;">Your OTP expires in <strong>%d minutes</strong>.</p>
              <div style="text-align:center;margin:24px 0;">
                <div style="display:inline-block;background:#1f2937;border:2px solid #3b82f6;border-radius:12px;padding:16px 40px;">
                  <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#60a5fa;">%s</span>
                </div>
              </div>
              <p style="color:#6b7280;font-size:12px;text-align:center;">If you didn't request this, ignore this email.</p>
            </div>
            """.formatted(userName, expiryMinutes, otp);

        helper.setText(html, true);
        mailSender.send(message);
    }
}
