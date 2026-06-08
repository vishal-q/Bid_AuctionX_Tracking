package com.bidflow.service;

import com.jcraft.jsch.ChannelShell;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;

@Service
public class SSHService {

    public SSHSession openShell(String host, int port, String username, AuthSpec auth) throws Exception {
        JSch jsch = new JSch();

        if ("key" .equalsIgnoreCase(auth.type)) {
            if (auth.privateKey == null || auth.privateKey.isEmpty()) {
                throw new IllegalArgumentException("Private key is required for key authentication");
            }
            byte[] privateKeyBytes = auth.privateKey.getBytes();
            byte[] passphrase = auth.passphrase != null ? auth.passphrase.getBytes() : null;
            jsch.addIdentity(username, privateKeyBytes, null, passphrase);
        }

        Session session = jsch.getSession(username, host, port);
        session.setConfig("StrictHostKeyChecking", "no");
        if ("password" .equalsIgnoreCase(auth.type)) {
            session.setPassword(auth.password);
        }
        session.connect(10000);

        ChannelShell channel = (ChannelShell) session.openChannel("shell");
        channel.setPtyType("xterm");
        channel.setPtySize(120, 40, 800, 600);

        InputStream stdout = channel.getInputStream();
        InputStream stderr = channel.getExtInputStream();
        OutputStream stdin = channel.getOutputStream();

        channel.connect(5000);

        SSHSession sshSession = new SSHSession();
        sshSession.session = session;
        sshSession.channel = channel;
        sshSession.stdin = stdin;
        sshSession.stdout = stdout;
        sshSession.stderr = stderr;

        return sshSession;
    }

    public void close(SSHSession session) {
        try {
            if (session != null) {
                if (session.channel != null) {
                    session.channel.disconnect();
                }
                if (session.session != null) {
                    session.session.disconnect();
                }
            }
        } catch (Exception ignored) {
        }
    }

    public static class SSHSession {
        public Session session;
        public ChannelShell channel;
        public OutputStream stdin;
        public InputStream stdout;
        public InputStream stderr;
    }

    public static class AuthSpec {
        public String type;
        public String password;
        public String privateKey;
        public String passphrase;
    }
}
