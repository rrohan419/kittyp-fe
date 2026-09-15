import net from "node:net";
import type { Plugin, ViteDevServer } from "vite";

export const MUX_PUBLIC_PORT = 8080;
export const MUX_INTERNAL_PORT = 18080;
const INTERNAL_HOST = "127.0.0.1";
const PUBLIC_ORIGIN = "https://localhost:8080";

/** HTTP service-worker scripts on :8080: unregister, then send clients to HTTPS. */
const KILL_SW = `self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",(e)=>{e.waitUntil((async()=>{
  await self.registration.unregister();
  const keys=await caches.keys();
  await Promise.all(keys.map((k)=>caches.delete(k)));
  const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  await Promise.all(clients.map((c)=>{
    try{
      const u=new URL(c.url);
      u.protocol="https:";
      return c.navigate(u.href);
    }catch{
      return c.navigate("${PUBLIC_ORIGIN}/");
    }
  }));
})())});
self.addEventListener("fetch",(e)=>{
  const u=new URL(e.request.url);
  e.respondWith(Response.redirect("${PUBLIC_ORIGIN}"+u.pathname+u.search,302));
});
`;

function isServiceWorkerPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return (
    lower.endsWith(".js") ||
    lower.endsWith(".mjs") ||
    lower === "/src/sw.ts" ||
    lower.includes("service-worker") ||
    lower.includes("workbox") ||
    lower.includes("/sw.")
  );
}

function parseRequest(head: Buffer): {
  pathname: string;
  search: string;
  isServiceWorker: boolean;
} {
  const text = head.toString("utf8");
  const requestLine = text.split("\r\n")[0] || "";
  const rawUrl = requestLine.match(/^[A-Z]+ (\S+)/)?.[1] || "/";
  let pathname = "/";
  let search = "";
  try {
    const parsed = new URL(rawUrl, "http://localhost");
    pathname = parsed.pathname;
    search = parsed.search;
  } catch {
    pathname = rawUrl.split("?")[0] || "/";
  }
  return {
    pathname,
    search,
    isServiceWorker:
      /^service-worker:\s*script/im.test(text) || isServiceWorkerPath(pathname),
  };
}

function handleHttp(socket: net.Socket, head: Buffer): void {
  const { pathname, search, isServiceWorker } = parseRequest(head);

  if (isServiceWorker) {
    socket.end(
      "HTTP/1.1 200 OK\r\n" +
        "Content-Type: application/javascript; charset=utf-8\r\n" +
        "Service-Worker-Allowed: /\r\n" +
        "Cache-Control: no-store\r\n" +
        "Connection: close\r\n" +
        `Content-Length: ${Buffer.byteLength(KILL_SW)}\r\n\r\n` +
        KILL_SW,
    );
    return;
  }

  const next = `${PUBLIC_ORIGIN}${pathname}${search}`;
  socket.end(
    "HTTP/1.1 301 Moved Permanently\r\n" +
      `Location: ${next}\r\n` +
      "Cache-Control: no-store\r\n" +
      "Connection: close\r\n" +
      "Content-Length: 0\r\n\r\n",
  );
}

function pipeTls(socket: net.Socket, head: Buffer): void {
  const dest = net.connect(MUX_INTERNAL_PORT, INTERNAL_HOST, () => {
    dest.write(head);
    socket.pipe(dest);
    dest.pipe(socket);
  });
  dest.on("error", () => socket.destroy());
  socket.on("error", () => dest.destroy());
}

/** Public :8080 speaks TLS and 301s HTTP to https://localhost:8080. Vite stays on :18080. */
export function localhostMuxPlugin(): Plugin {
  let mux: net.Server | undefined;

  const stopMux = () => {
    mux?.close();
    mux = undefined;
  };

  return {
    name: "localhost-http-https-mux",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const startMux = () => {
        if (mux) return;
        mux = net.createServer((socket) => {
          socket.once("data", (buf) => {
            if (buf[0] === 0x16) {
              pipeTls(socket, buf);
            } else {
              handleHttp(socket, buf);
            }
          });
          socket.on("error", () => socket.destroy());
        });
        mux.listen(MUX_PUBLIC_PORT, "127.0.0.1", () => {
          server.config.logger.info(
            `  ➜  Local: https://localhost:${MUX_PUBLIC_PORT}/`,
          );
        });
        mux.on("error", (err: NodeJS.ErrnoException) => {
          server.config.logger.error(`localhost mux: ${err.message}`);
        });
      };

      const httpServer = server.httpServer;
      if (httpServer?.listening) {
        startMux();
      } else {
        httpServer?.once("listening", startMux);
      }
      httpServer?.once("close", stopMux);
    },
  };
}
