import { Table, Column, Model, ForeignKey, DataType, PrimaryKey, Default } from 'sequelize-typescript';
import Usuario from './Usuario.model';
import PaginaWeb from './PaginaWeb.model';

@Table({
    tableName: 'pagina_bloqueada'
})
class PaginaBloqueada extends Model {
    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    nivel_bloqueo: number

    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_bloqueo: number;

    @ForeignKey(() => PaginaWeb)
    @Column({
        type: DataType.INTEGER
    })
    id_pagina_fk_bloqueo: number;
}

export default PaginaBloqueada;
