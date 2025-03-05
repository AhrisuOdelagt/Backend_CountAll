import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
/* Importación de los modelos */
import Usuario from '../models/Usuario.model';
import Tarea from '../models/Tarea.model';
import Estimacion from '../models/Estimacion.model';
import Etapa from '../models/Etapa.model';
import PaginaWeb from '../models/PaginaWeb.model';
import Proyecto from '../models/Proyecto.model';
import Recompensa from '../models/Recompensa.model';
import Riesgo from '../models/Riesgo.model';
import Equipo from '../models/Equipo.model';
import Comentario from '../models/Comentario.model';
import EquipoProyecto from '../models/EquipoProyecto.model';
import PaginaBloqueada from '../models/PaginaBloqueada.model';
import UsuarioRecompensa from '../models/UsuarioRecompensa.model';
import UsuarioEquipo from '../models/UsuarioEquipo.model';
import UsuarioTareaEquipo from '../models/UsuarioTareaEquipo.model';

dotenv.config();

// Manually define __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colocar ssl=true al final de la URI
const db = new Sequelize(process.env.DB_URI!, {
    models: [path.join(__dirname, '/../models/**/*.ts')]  // Use path.join to properly form the path
});

/* Carga manual de los modelos para evitar errores */
db.addModels([Usuario, Tarea, Estimacion, Etapa, PaginaWeb, Proyecto, Recompensa, Riesgo, Equipo, Comentario, EquipoProyecto, PaginaBloqueada, UsuarioRecompensa, UsuarioEquipo, UsuarioTareaEquipo])

export default db
