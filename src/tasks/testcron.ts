import cron from 'node-cron'
import colors from 'colors'

const iniciarTareaCron = () => {
    cron.schedule('* * * * *', () => {
        console.log(colors.green.bold('Este mensaje se ejecuta cada minuto.'))
    })
}

export {
    iniciarTareaCron
}
