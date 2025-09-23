const helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],

      // Scripts (sempre com nonce nos <script> gerados pela view)
      scriptSrc: [
        "'self'",
        "'strict-dynamic'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
      ],
      scriptSrcElem: [
        "'self'",
        "'strict-dynamic'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
      ],

      // Estilos (links externos e <style nonce="...">)
      styleSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
        "https://cdn.jsdelivr.net",      // SweetAlert2 CSS
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://unpkg.com",
      ],
      styleSrcElem: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://unpkg.com",
      ],
      // Requer nonce para estilos em atributos/elementos (evita 'unsafe-inline')
      styleSrcAttr: [(req, res) => `'nonce-${res.locals.cspNonce}'`],

      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
        "data:",
      ],
      imgSrc: ["'self'", "data:", "blob:"],
  connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});
