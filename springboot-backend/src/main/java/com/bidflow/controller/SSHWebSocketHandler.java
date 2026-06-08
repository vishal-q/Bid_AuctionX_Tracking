package com.bidflow.controller;

import com.bidflow.security.JwtUtil;
import com.bidflow.service.SSHService;
import com.bidflow.service.SSHService.AuthSpec;
import com.bidflow.service.SSHService.SSHSession;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

@Component
public class SSHWebSocketHandler extends AbstractWebSocketHandler {

    private final SSHService sshService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Logger log = LoggerFactory.getLogger(SSHWebSocketHandler.class);

    public SSHWebSocketHandler(SSHService sshService, JwtUtil jwtUtil) {
        this.sshService = sshService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = extractToken(session);
        if (token == null || !jwtUtil.validateToken(token)) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing or invalid token"));
            return;
        }
        session.getAttributes().put("sshSession", null);
    }

    private String extractToken(WebSocketSession session) {
        String authHeader = session.getHandshakeHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            String[] pairs = uri.getQuery().split("&");
            for (String pair : pairs) {
                int idx = pair.indexOf('=');
                if (idx > 0 && "token".equals(pair.substring(0, idx))) {
                    return pair.substring(idx + 1);
                }
            }
        }
        return null;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode node = objectMapper.readTree(message.getPayload());
            String action = node.path("action").asText();
            if ("connect".equals(action)) {
                handleConnect(session, node);
                return;
            }
            if ("input".equals(action)) {
                String data = node.path("data").asText();
                Object saved = session.getAttributes().get("sshSession");
                if (saved instanceof SSHSession) {
                    SSHSession sshSession = (SSHSession) saved;
                    sshSession.stdin.write(data.getBytes(StandardCharsets.UTF_8));
                    sshSession.stdin.flush();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to handle WS message", e);
        }
    }

    private void handleConnect(WebSocketSession session, JsonNode node) {
        String host = node.path("host").asText();
        int port = node.path("port").asInt(22);
        String username = node.path("username").asText();
        JsonNode authNode = node.path("auth");

        AuthSpec auth = new AuthSpec();
        auth.type = authNode.path("type").asText("password");
        auth.password = authNode.path("password").asText(null);
        auth.privateKey = authNode.path("privateKey").asText(null);
        auth.passphrase = authNode.path("passphrase").asText(null);

        try {
            SSHSession sshSession = sshService.openShell(host, port, username, auth);
            session.getAttributes().put("sshSession", sshSession);

            Executors.newSingleThreadExecutor().submit(() -> forwardStream(session, sshSession.stdout));
            Executors.newSingleThreadExecutor().submit(() -> forwardStream(session, sshSession.stderr));
        } catch (Exception e) {
            try {
                String errorMessage = objectMapper.createObjectNode()
                        .put("type", "error")
                        .put("message", e.getMessage() == null ? "SSH connect failed" : e.getMessage())
                        .toString();
                session.sendMessage(new TextMessage(errorMessage));
            } catch (Exception ignore) {
            }
            try {
                session.close(CloseStatus.SERVER_ERROR.withReason("SSH connect failed"));
            } catch (Exception ignore) {
            }
        }
    }

    private void forwardStream(WebSocketSession session, InputStream inputStream) {
        try {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1 && session.isOpen()) {
                session.sendMessage(new BinaryMessage(java.util.Arrays.copyOf(buffer, read)));
            }
        } catch (Exception e) {
            log.warn("SSH stream ended", e);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error", exception);
        closeSSH(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        closeSSH(session);
    }

    private void closeSSH(WebSocketSession session) {
        Object saved = session.getAttributes().get("sshSession");
        if (saved instanceof SSHSession) {
            sshService.close((SSHSession) saved);
            session.getAttributes().put("sshSession", null);
        }
    }
}
