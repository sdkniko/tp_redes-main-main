const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

app.use(cors()); 
app.use(express.json());

// Conectar a MongoDB
mongoose.connect('mongodb+srv://sdkgastaldi:nqgFvwFoTp2o0tlc@cluster0.0fh4emf.mongodb.net/?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch((error) => console.error('Error al conectar a MongoDB:', error));

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    direccion: { type: String, required: true },
    user: { type: String, required: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'user' },
    estado: { type: String, default: 'activo' },
});

const User = mongoose.model('User', userSchema);

app.use(express.json());
app.use(cors());


const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    jwt.verify(token, 'secreto', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    });
};

app.post('/usuarios', autenticarToken, async(req, res) => {
    try {
        const { nombre, apellido, direccion, user, password } = req.body;
        const nuevoUsuario = new User({ nombre, apellido, direccion, user, password });
        console.log('Nuevo usuario:', nuevoUsuario);

        const usuarioGuardado = await nuevoUsuario.save();
        console.log('Usuario guardado:', usuarioGuardado);

        res.status(201).json(usuarioGuardado);
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        res.status(400).json({ error: error.message });
    }
});


app.get('/usuarios', autenticarToken, async(req, res) => {
    try {
        const usuarios = await User.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});


app.post('/usuarios/:id/cambiar-rol', autenticarToken, async(req, res) => {
    try {
        const userId = req.params.id;
        const usuario = await User.findByIdAndUpdate(userId, { rol: 'admin' }, { new: true });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar el rol del usuario' });
    }
});


app.post('/usuarios/:id/cambiar-estado', autenticarToken, async(req, res) => {
    try {
        const userId = req.params.id;
        const usuario = await User.findByIdAndUpdate(userId, { estado: 'inactivo' }, { new: true });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar el estado del usuario' });
    }
});


app.post('/usuarios/:id/activar', autenticarToken, async(req, res) => {
    try {
        const userId = req.params.id;
        const usuario = await User.findByIdAndUpdate(userId, { estado: 'activo' }, { new: true });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al activar el usuario' });
    }
});

app.post('/api/login', async(req, res) => {
    const { user, password } = req.body;

    try {
        const usuario = await User.findOne({ user, password });

        if (usuario) {
            // Generar un token JWT
            const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, 'secreto', { expiresIn: '1h' });

            res.json({ message: 'Inicio de sesión exitoso', token });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});