package com.bidflow.config;

import com.bidflow.controller.SSHWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SSHWebSocketHandler sshWebSocketHandler;

    public WebSocketConfig(SSHWebSocketHandler sshWebSocketHandler) {
        this.sshWebSocketHandler = sshWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(sshWebSocketHandler, "/ws/ssh").setAllowedOrigins("*");
    }
}
