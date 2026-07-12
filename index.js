const express = require("express");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const SECRET_KEY =
  process.env.JWT_SECRET || "finanzasrd2026";

// Permite funcionar correctamente detrás de Render
app.set("trust proxy", 1);

// CONTROL 1: Helmet
app.use(helmet());

// CONTROL 2: CORS
app.use(cors());

// Limita el tamaño de los datos recibidos
app.use(express.json({ limit: "10kb" }));

// CONTROL 3: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje:
      "Demasiadas solicitudes. Intente nuevamente en 15 minutos."
  }
});

app.use(limiter);

let clientes = [
  {
    id: "1",
    nombre: "juan perez",
    correo: "juan@correo.com",
    telefono: "8095551234"
  },
  {
    id: "2",
    nombre: "maria rodriguez",
    correo: "maria@correo.com",
    telefono: "8295555678"
  }
];

// Ruta principal para comprobar que la API funciona
app.get("/", (req, res) => {
  res.json({
    mensaje: "API segura de Finanzas RD funcionando."
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      mensaje: "Usuario y contraseña son obligatorios."
    });
  }

  if (usuario === "admin" && password === "1234") {
    const token = jwt.sign(
      { usuario },
      SECRET_KEY,
      { expiresIn: "15m" }
    );

    return res.json({
      mensaje: "Inicio de sesión exitoso",
      token
    });
  }

  res.status(401).json({
    mensaje: "Credenciales incorrectas"
  });
});

// Middleware para verificar el token
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      mensaje: "Token no proporcionado"
    });
  }

  const partes = authHeader.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer"
  ) {
    return res.status(401).json({
      mensaje:
        "Formato inválido. Utilice Bearer seguido del token."
    });
  }

  const token = partes[1];

  jwt.verify(token, SECRET_KEY, (err, usuario) => {
    if (err) {
      return res.status(403).json({
        mensaje: "Token inválido o expirado"
      });
    }

    req.usuario = usuario;
    next();
  });
}

// Rutas protegidas
app.get("/clientes", verificarToken, (req, res) => {
  res.json(clientes);
});

app.get("/clientes/:id", verificarToken, (req, res) => {
  const idBuscado = req.params.id;
  const cliente = clientes.find(
    (c) => c.id === idBuscado
  );

  if (!cliente) {
    return res.status(404).json({
      mensaje: "Cliente no encontrado"
    });
  }

  res.json(cliente);
});

app.post("/clientes", verificarToken, (req, res) => {
  const { nombre, correo, telefono } = req.body;

  // CONTROL 4: Validación de entradas
  if (!nombre || !correo || !telefono) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios."
    });
  }

  if (
    typeof nombre !== "string" ||
    nombre.trim().length < 2
  ) {
    return res.status(400).json({
      mensaje: "El nombre no es válido."
    });
  }

  const formatoCorreo =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formatoCorreo.test(correo)) {
    return res.status(400).json({
      mensaje: "El correo no es válido."
    });
  }

  const formatoTelefono =
    /^\+?[0-9\s-]{7,20}$/;

  if (!formatoTelefono.test(telefono)) {
    return res.status(400).json({
      mensaje: "El teléfono no es válido."
    });
  }

  const nuevoCliente = {
    id: Date.now().toString(),
    nombre: nombre.trim(),
    correo: correo.trim(),
    telefono: telefono.trim()
  };

  clientes.push(nuevoCliente);

  res.status(201).json({
    mensaje: "Cliente registrado exitosamente",
    cliente: nuevoCliente
  });
});

// Manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).json({
    mensaje: "Ruta no encontrada."
  });
});

// Manejo seguro de errores
app.use((err, req, res, next) => {
  console.error("Error interno:", err.message);

  res.status(500).json({
    mensaje:
      "Ocurrió un error interno en el servidor."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Servidor corriendo en el puerto ${PORT}`
  );
});