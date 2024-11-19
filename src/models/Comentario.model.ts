import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import Tarea from './Tarea.model';
import Usuario from './Usuario.model';

@Table({
    tableName: 'comentario'
})
class Comentario extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_comentario: number;

    @Column({
        type: DataType.STRING(256)
    })
    contenido_comentario: string;

    @ForeignKey(() => Tarea)
    @Column({
        type: DataType.INTEGER
    })
    id_tarea_fk_comentario: number;

    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_comentario: number;
}

export default Comentario;
