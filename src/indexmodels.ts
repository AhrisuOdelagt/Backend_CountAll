import { Sequelize } from 'sequelize-typescript';
import Usuario from './models/Usuario.model';
import Tarea from './models/Tarea.model';
import Estimacion from './models/Estimacion.model';
import Etapa from './models/Etapa.model';
import PaginaWeb from './models/PaginaWeb.model';
import Proyecto from './models/Proyecto.model';
import Recompensa from './models/Recompensa.model';
import Riesgo from './models/Riesgo.model';
import Equipo from './models/Equipo.model';
import Comentario from './models/Comentario.model';
import EquipoProyecto from './models/EquipoProyecto.model';
import PaginaBloqueada from './models/PaginaBloqueada.model';
import UsuarioRecompensa from './models/UsuarioRecompensa.model';
import UsuarioEquipo from './models/UsuarioEquipo.model';
import UsuarioTareaEquipo from './models/UsuarioTareaEquipo.model';

// Instancia de Sequelize
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST, // Cambia la configuración de acuerdo a tu DB
    username: process.env.DB_USER, // Tu usuario de base de datos
    password: process.env.DB_PASS, // Tu contraseña de base de datos
    database: process.env.DB_NAME, // Nombre de tu base de datos
    models: [
        Usuario,
        UsuarioEquipo,
        UsuarioTareaEquipo,
        UsuarioRecompensa,
        PaginaBloqueada,
        EquipoProyecto,
        Comentario,
        Equipo,
        Riesgo,
        Recompensa,
        Proyecto,
        PaginaWeb,
        Etapa,
        Estimacion,
        Tarea
    ]
});

// Agregar los modelos a Sequelize
sequelize.addModels([
    Usuario,
    Tarea,
    Estimacion,
    Etapa,
    PaginaWeb,
    Proyecto,
    Recompensa,
    Riesgo,
    Equipo,
    Comentario,
    EquipoProyecto,
    PaginaBloqueada,
    UsuarioRecompensa,
    UsuarioEquipo,
    UsuarioTareaEquipo,
]);

// Dependencias de usuario
Usuario.hasMany(UsuarioEquipo)
Usuario.hasMany(UsuarioTareaEquipo)
Usuario.hasMany(UsuarioRecompensa)
Usuario.hasMany(PaginaBloqueada)
Usuario.hasMany(Proyecto)
Usuario.hasMany(Comentario)
// Dependencias de tarea
Tarea.hasMany(UsuarioTareaEquipo)
Tarea.hasMany(Comentario)
// Dependencias de Página Web
PaginaWeb.hasMany(PaginaBloqueada)
// Dependencias de Proyecto
Proyecto.hasMany(Etapa)
Proyecto.hasMany(Riesgo)
Proyecto.hasMany(Estimacion)
Proyecto.belongsTo(Equipo)
Proyecto.belongsTo(EquipoProyecto)
// Dependencias de Recompensa
Recompensa.hasMany(UsuarioRecompensa)
// Dependencias de Equipo
Equipo.hasMany(UsuarioEquipo)
Equipo.hasMany(UsuarioTareaEquipo)
Equipo.belongsTo(Proyecto)
Equipo.belongsTo(EquipoProyecto)
// Dependencias de Usuario Recompensa
UsuarioRecompensa.belongsTo(Usuario)
UsuarioRecompensa.belongsTo(Recompensa)
// Dependencias de Usuario Equipo
UsuarioEquipo.belongsTo(Usuario)
UsuarioEquipo.belongsTo(Equipo)
// Dependencias de Usuario Tarea Equipo
UsuarioTareaEquipo.belongsTo(Usuario)
UsuarioTareaEquipo.belongsTo(Tarea)
UsuarioTareaEquipo.belongsTo(Equipo)

export {
    Usuario,
    Tarea,
    Estimacion,
    Etapa,
    PaginaWeb,
    Proyecto,
    Recompensa,
    Riesgo,
    Equipo,
    Comentario,
    EquipoProyecto,
    PaginaBloqueada,
    UsuarioRecompensa,
    UsuarioEquipo,
    UsuarioTareaEquipo,
}
