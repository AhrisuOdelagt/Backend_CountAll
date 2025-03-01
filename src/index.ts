/* Comandos a instalar y usar para ejecutar código TS
npm i -D tsx
npx tsx src/index.ts */

import server from './server'
import colors from 'colors'
import dotenv from 'dotenv'
// import { russianRoulette } from './helpers/functions'
import { iniciarTareaCron } from './tasks/testcron'
dotenv.config()

// russianRoulette()

try {
    const port = process.env.PORT || 3000
    server.listen(port, () => {
    console.log(colors.magenta.bold(`REST API corriendo en el puerto ${port}`))

    // Iniciamos la tarea Cron
    iniciarTareaCron()
})
} catch (error) {
    console.log(colors.red.bold(error))
}
