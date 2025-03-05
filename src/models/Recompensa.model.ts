import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import UsuarioRecompensa from './UsuarioRecompensa.model';

@Table({
    tableName: 'recompensa'
})
class Recompensa extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_recompensa: number;

    @Column({
        type: DataType.STRING(256)
    })
    nombre_recompensa: string;

    @Column({
        type: DataType.STRING(256)
    })
    descr_recompensa: string;

    @Column({
        type: DataType.STRING(256)
    })
    rareza: string; 

    @Column({
        type: DataType.STRING(256),
        field: 'url_avatar'
    })
    url_avatar: string;
}

export default Recompensa;