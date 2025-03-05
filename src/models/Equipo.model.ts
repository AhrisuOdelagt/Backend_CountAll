import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import UsuarioEquipo from './UsuarioEquipo.model';
import Proyecto from './Proyecto.model';
import EquipoProyecto from './EquipoProyecto.model';
import UsuarioTareaEquipo from './UsuarioTareaEquipo.model';

@Table({
    tableName: 'equipo'
})
class Equipo extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_equipo: number;

    @Column({
        type: DataType.STRING(256)
    })
    nombre_equipo: string;

    @Column({
        type: DataType.STRING(256)
    })
    descr_equipo: string;
}

export default Equipo;
