import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import Usuario from './Usuario.model';
import Equipo from './Equipo.model';

@Table({
    tableName: 'rol'
})
class Rol extends Model {
    @Column({
        type: DataType.STRING(256)
    })
    rol: string;

    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_rol: number;

    @ForeignKey(() => Equipo)
    @Column({
        type: DataType.INTEGER
    })
    id_equipo_fk_rol: number;
}

export default Rol;