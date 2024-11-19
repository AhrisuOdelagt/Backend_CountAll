import { Router } from 'express'
/* Middleware de protección de enlaces */
import checkAuth from '../middleware/CheckAuth'
/* Funciones de Usuario */
import {
    registrarUsuario,
    iniciarSesion,
    confirmarUsuario,
    olvidePassword,
    comprobarToken,
    restablecerPassword,
    verPerfil,
    modificarDatos,
    reenviarCorreoConfirmacion,
    obtenerUsuarioActual
} from '../handlers/usuario'
 /* Funciones de Proyecto */
 import { 
    verProyectos,
    verProyecto,
    crearProyecto,
    proporcionarDetalles,
    modificarProyecto
} from '../handlers/proyecto'
/* Funciones Etapa */
import {
    verEtapas,
    verEtapa,
    agregarEtapa,
    modificarEtapa,
    eliminarEtapa
} from '../handlers/etapas'
/* Funciones de Equipo */
import { 
    verEquipos,
    verEquipo,
    crearEquipo,
    aceptarInvitacion,
    asignarRoles,
    agregarMiembro,
    eliminarMiembro
} from '../handlers/equipo'
 /* Funciones de Riesgo */
 import {
    crearRiesgo,
    modificarRiesgo,
    eliminarRiesgo
} from '../handlers/riesgo'
/* Funciones de página */
import {
    bloquearPagina,
    desbloquearPagina,
    bloquearPaginaEquipo,
    desbloquearPaginaEquipo,
    verPaginasBloqueadas
} from '../handlers/paginaWeb'
/* Funciones de clasificación */
import {
    obtenerClasificaciones
} from '../handlers/clasificacion'
/* Funciones de recompensa */
import { 
    otorgarRecompensa, 
    cambiarAvatar,
    obtenerRecompensas
}   from '../handlers/recompensa'
/* Funciones de estimaciones */
import {
    realizarCOCOMO,
    verCOCOMO
} from '../handlers/estimacion'
/* Funciones de tareas */
import {
    verTareas,
    verTarea,
    asignarTarea,
    editarTarea,
    enviarTarea,
    revisarTarea,
    desbloquearTarea,
    eliminarTarea
} from '../handlers/tarea'

const router = Router()

/* Usuario */
// Registro, Login y Restablecimiento de contraseña
router.post('/usuario/registrarUsuario', registrarUsuario)
router.post('/usuario/iniciarSesion', iniciarSesion)
router.get('/usuario/confirmarUsuario/:token_usuario', confirmarUsuario);
router.post('/usuario/olvidePassword', olvidePassword)
router.get('/usuario/comprobarToken/:token_usuario', comprobarToken)
router.post('/usuario/reestablecerPassword/:token_usuario', restablecerPassword)
router.post('/usuario/reenviarCorreoConfirmacion', reenviarCorreoConfirmacion);
// Ver y modificar información
router.get('/usuario/verPerfil', checkAuth, verPerfil)
router.get('/usuario/actual', checkAuth, obtenerUsuarioActual)
router.post('/usuario/modificarDatos', checkAuth, modificarDatos)

/* Proyecto */
// Visualizar proyectos
router.get('/proyecto/misProyectos', checkAuth, verProyectos)
router.get('/proyecto/misProyectos/:nombre_proyecto', checkAuth, verProyecto)
// Creación del proyecto
router.post('/proyecto/crearProyecto', checkAuth, crearProyecto)
router.post('/proyecto/crearProyecto/:nombre_proyecto', checkAuth, proporcionarDetalles)
router.put('/proyecto/modificarProyecto/:nombre_proyecto', checkAuth, modificarProyecto)

/* Etapa */
// Visualizar etapas
router.get('/etapa/verEtapas/:nombre_proyecto', checkAuth, verEtapas)
router.get('/etapa/verEtapa/:id_etapa', checkAuth, verEtapa)
// Modificación de etapas
router.post('/etapa/agregarEtapa/:nombre_proyecto', checkAuth, agregarEtapa)
router.put('/etapa/modificarEtapa/:id_etapa', checkAuth, modificarEtapa)
router.delete('/etapa/eliminarEtapa/:id_etapa', checkAuth, eliminarEtapa)

/* Tarea */
// Visualizar tareas
router.get('/tarea/verTareas/:id_equipo', checkAuth, verTareas)
router.get('/tarea/verTarea/:id_tarea', checkAuth, verTarea)
router.post('/tarea/asignarTarea/:id_equipo', checkAuth, asignarTarea)
// Manejar tareas

// Entrega de tareas

/* Equipo */
// Crear y gestionar equipo
router.post('/equipo/crearEquipo', checkAuth, crearEquipo)
router.get('/equipo/aceptarInvitacion/:token_UE', aceptarInvitacion)
router.put('/equipo/misEquipos/:id_equipo/asignarRoles', checkAuth, asignarRoles)
router.put('/equipo/misEquipos/:id_equipo/agregarMiembro', checkAuth, agregarMiembro)
router.delete('/equipo/misEquipos/:id_equipo/eliminarMiembro', checkAuth, eliminarMiembro)
// Ver equipos
router.get('/equipo/misEquipos', checkAuth, verEquipos)
router.get('/equipo/misEquipos/:id_equipo', checkAuth, verEquipo)

/* Riesgo */
router.post('/riesgo/crearRiesgo/:nombre_proyecto', checkAuth, crearRiesgo)
router.put('/riesgo/modificarRiesgo/:id_riesgo', checkAuth, modificarRiesgo)
router.delete('/riesgo/eliminarRiesgo/:id_riesgo', checkAuth, eliminarRiesgo)

/* Página Web */
router.get('/paginaWeb/verPaginasBloqueadas', checkAuth, verPaginasBloqueadas)
router.post('/paginaWeb/bloquearPagina', checkAuth, bloquearPagina)
router.delete('/paginaWeb/desbloquearPagina/:id_pagina', checkAuth, desbloquearPagina)
router.post('/paginaWeb/bloquearPaginaEquipo/:id_equipo', checkAuth, bloquearPaginaEquipo)
router.delete('/paginaWeb/desbloquearPaginaEquipo/:id_equipo/:id_pagina', checkAuth, desbloquearPaginaEquipo)

/* Clasificación */
router.get('/clasificaciones', checkAuth, obtenerClasificaciones);

/* Recompensa */
router.get('/obtenerRecompensas', obtenerRecompensas);
router.post('/otorgar-recompensa', otorgarRecompensa);
router.post('/cambiar-avatar', cambiarAvatar);

/* Estimación */
router.post('/estimacion/realizarCOCOMO/:nombre_proyecto', checkAuth, realizarCOCOMO)
router.get('/estimacion/verCOCOMO/:id_estimacion', checkAuth, verCOCOMO)

/* Auth Check */
router.get('/auth/check', checkAuth, (req, res) => {
    res.status(200).json({ msg: 'Authenticated' });
});

export default router
