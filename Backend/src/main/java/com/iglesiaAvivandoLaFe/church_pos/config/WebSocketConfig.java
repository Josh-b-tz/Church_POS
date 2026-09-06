package com.iglesiaAvivandoLaFe.church_pos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // El prefijo para que el frontend se suscriba
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // La puerta de entrada para la conexión inicial
        registry.addEndpoint("/ws-church")
                .setAllowedOrigins("http://localhost:5173") // O tu IP
                .withSockJS();
    }
}