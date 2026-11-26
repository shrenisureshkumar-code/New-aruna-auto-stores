import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class ShopServer {
    private static final int PORT = 8080;
    private static final Path SITE_DIR =
            Path.of(".").toAbsolutePath().normalize();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(
                new InetSocketAddress(PORT), 0);

        server.createContext("/", ShopServer::handleRequest);
        server.start();

        System.out.println(
                "Website running at http://localhost:" + PORT);
    }

    private static void handleRequest(HttpExchange exchange)
            throws IOException {
        String requestPath = exchange.getRequestURI().getPath();

        if (requestPath.equals("/")) {
            requestPath = "/index.html";
        }

        String fileName = switch (requestPath) {
            case "/index.html" -> "index.html";
            case "/style.css" -> "style.css";
            default -> null;
        };

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())
                || fileName == null) {
            send(exchange, 404, "text/plain; charset=utf-8", "Not found");
            return;
        }

        Path file = SITE_DIR.resolve(fileName);

        if (!Files.isRegularFile(file)) {
            send(exchange, 500, "text/plain; charset=utf-8",
                    "Website file missing: " + fileName);
            return;
        }

        String contentType = fileName.endsWith(".css")
                ? "text/css; charset=utf-8"
                : "text/html; charset=utf-8";

        byte[] content = Files.readAllBytes(file);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, content.length);
        exchange.getResponseBody().write(content);
        exchange.close();
    }

    private static void send(
            HttpExchange exchange,
            int status,
            String contentType,
            String body) throws IOException {
        byte[] content = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, content.length);
        exchange.getResponseBody().write(content);
        exchange.close();
    }
}