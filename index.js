const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "finanzasrd2026";

app.use(express.json());

let clientes = [
    { id: "1", nombre: "juan perez", correo: "juan@correo.com", telefono: "8095551234" },
    { id: "2", nombre: "maria rodriguez", correo: "maria@correo.com", telefono: "8295555678" }
];

// LOGIN
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;

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

    const token = authHeader.split(" ")[1];

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
app.get('/clientes', verificarToken, (req, res) => {
    res.json(clientes);
});

app.get('/clientes/:id', verificarToken, (req, res) => {
    const idBuscado = req.params.id;
    const cliente = clientes.find(c => c.id === idBuscado);

    if (!cliente) {
        return res.status(404).json({
            mensaje: "Cliente no encontrado"
        });
    }

    res.json(cliente);
});

app.post('/clientes', verificarToken, (req, res) => {

    const { nombre, correo, telefono } = req.body;

    if (!nombre || !correo || !telefono) {
        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios."
        });
    }

    const nuevoCliente = {
        id: Date.now().toString(),
        nombre,
        correo,
        telefono
    };

    clientes.push(nuevoCliente);

    res.status(201).json({
        mensaje: "Cliente registrado exitosamente",
        cliente: nuevoCliente
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



