import { Table, Column, Model, DataType, ForeignKey, Default, HasMany } from 'sequelize-typescript';
import Etapa from './Etapa.model';
import UsuarioTareaEquipo from './UsuarioTareaEquipo.model';
import Comentario from './Comentario.model';

@Table({
    tableName: 'tarea'
})
class Tarea extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_tarea: number;

    @Column({
        type: DataType.STRING(256)
    })
    nombre_tarea: string;

    @Column({
        type: DataType.STRING(256)
    })
    descr_tarea: string;

    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_inicio_tarea: Date;

    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_optima_tarea: Date;

    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_fin_tarea: Date;

    @Default('Por hacer')
    @Column({
        type: DataType.STRING(256)
    })
    estado_tarea: string;

    @Default('Baja')
    @Column({
        type: DataType.STRING(256)
    })
    prioridad_tarea: string;

    @Default('Fácil')
    @Column({
        type: DataType.STRING(256)
    })
    dificultad_tarea: string;

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    comentarios_tarea: number;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    is_locked: boolean;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    first_time_comp: boolean;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN
    })
    amonestacion: boolean;

    @ForeignKey(() => Etapa)
    @Column({
        type: DataType.INTEGER
    })
    id_etapa_fk_tarea: number;
}

export default Tarea;
