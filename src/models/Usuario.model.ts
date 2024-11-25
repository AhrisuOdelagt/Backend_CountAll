import { Table, Column, Model, DataType, HasMany, Default } from 'sequelize-typescript';
import { generarTokenAleatorio } from '../helpers/functions'
import UsuarioEquipo from './UsuarioEquipo.model';
import UsuarioTareaEquipo from './UsuarioTareaEquipo.model';
import UsuarioRecompensa from './UsuarioRecompensa.model';
import Proyecto from './Proyecto.model';
import PaginaBloqueada from './PaginaBloqueada.model';
import Comentario from './Comentario.model';

@Table({
    tableName: 'usuario'
})
class Usuario extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_usuario: number;

    @Column({
        type: DataType.STRING(256),
    })
    name_usuario: string;

    @Column({
        type: DataType.STRING(256)
    })
    surname_usuario: string;

    @Column({
        type: DataType.STRING(256),
        unique: true,
        allowNull: false
    })
    nombre_usuario: string;

    @Column({
        type: DataType.STRING(256),
        unique: true,
        allowNull: false
    })
    email_usuario: string;

    @Column({
        type: DataType.STRING(256)
    })
    password_usuario: string;

    @Default('Sin número telefónico')
    @Column({
        type: DataType.STRING(256)
    })
    numero_telefonico: string;

    @Default(generarTokenAleatorio)
    @Column({
        type: DataType.STRING(10)
    })
    token_usuario: string

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    puntuacion_global: number

    @Column({
        type: DataType.INTEGER
    })
    tareas_completadas_global: number;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    is_confirmed: boolean

    @Default('src/assets/img/avatars/A1.jpg')
    @Column({
        type: DataType.STRING(256)
    })
    url_avatar: string;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN
    })
    pref_actividades: boolean

    @Default(true)
    @Column({
        type: DataType.BOOLEAN
    })
    pref_recordatorio: boolean

    @Default(true)
    @Column({
        type: DataType.BOOLEAN
    })
    pref_puntajes: boolean

    @HasMany(() => UsuarioEquipo)
    usuarioEquipos: UsuarioEquipo[];

    @HasMany(() => UsuarioTareaEquipo)
    usuarioTareaEquipos: UsuarioTareaEquipo[];

    @HasMany(() => UsuarioRecompensa)
    usuarioRecompensas: UsuarioRecompensa[];

    @HasMany(() => PaginaBloqueada)
    PaginaBloqueadas: PaginaBloqueada[];

    @HasMany(() => Proyecto)
    proyectos: Proyecto[];

    @HasMany(() => Comentario)
    comentarios: Comentario[];
}

export default Usuario;
