package com.bidflow.service;

import com.jcraft.jsch.ChannelShell;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.util.Properties;

@Service
public class SSHService {

    private static final Logger log = LoggerFactory.getLogger(SSHService.class);

    /**
     * Authentication spec passed from the WebSocket handler.
     */
    public static class AuthSpec {
        public String type;       // "password" or "privateKey"
        public String password;
        public String privateKey;
        public String passphrase;
    }

    /**
     * Holds an active SSH shell session's I/O streams.
     */
    public static class SSHSession {
        public Session    jschSession;
        public ChannelShell channel;
        public InputStream  stdout;
        public InputStream  stderr;
        public OutputStream stdin;
    }

    /**
     * Opens an interactive shell channel on the remote host and returns
     * the I/O streams so callers can forward data over WebSocket.
     */
    public SSHSession openShell(String host, int port, String username, AuthSpec auth) throws Exception {
        JSch jsch = new JSch();

        // Configure private-key auth if requested
        if ("privateKey".equalsIgnoreCase(auth.type) && auth.privateKey != null) {
            byte[] keyBytes = auth.privateKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            byte[] passphraseBytes = (auth.passphrase != null)
                    ? auth.passphrase.getBytes(java.nio.charset.StandardCharsets.UTF_8)
                    : null;
            jsch.addIdentity("key", keyBytes, null, passphraseBytes);
        }

        Session session = jsch.getSession(username, host, port);

        // Password auth
        if ("password".equalsIgnoreCase(auth.type) && auth.password != null) {
            session.setPassword(auth.password);
        }

        // Disable strict host-key checking (suitable for a controlled environment)
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        session.setTimeout(15_000);
        session.connect(15_000);

        // Open a shell channel
        ChannelShell channel = (ChannelShell) session.openChannel("shell");
        channel.setPtyType("xterm-256color");

        // ChannelShell does NOT have getErrStream() — stderr is merged into stdout
        // by the PTY on the server side. We pipe stdout only; stderr field gets
        // an always-empty stream so the WebSocket handler still compiles.
        channel.setOutputStream(null);

        OutputStream stdin  = channel.getOutputStream();
        InputStream  stdout = channel.getInputStream();

        // Provide a valid but empty stderr stream (PTY merges stderr → stdout)
        PipedOutputStream stderrSink   = new PipedOutputStream();
        InputStream       stderr       = new PipedInputStream(stderrSink);

        channel.connect(10_000);

        SSHSession sshSession = new SSHSession();
        sshSession.jschSession = session;
        sshSession.channel     = channel;
        sshSession.stdin       = stdin;
        sshSession.stdout      = stdout;
        sshSession.stderr      = stderr;

        log.info("SSH shell opened → {}@{}:{}", username, host, port);
        return sshSession;
    }

    /**
     * Closes the channel and underlying JSch session gracefully.
     */
    public void close(SSHSession sshSession) {
        if (sshSession == null) return;
        try {
            if (sshSession.channel != null && sshSession.channel.isConnected()) {
                sshSession.channel.disconnect();
            }
        } catch (Exception e) {
            log.warn("Error closing SSH channel", e);
        }
        try {
            if (sshSession.jschSession != null && sshSession.jschSession.isConnected()) {
                sshSession.jschSession.disconnect();
            }
        } catch (Exception e) {
            log.warn("Error closing SSH session", e);
        }
        log.info("SSH session closed");
    }
}
