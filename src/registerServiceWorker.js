import winston from 'winston'
import { register } from 'register-service-worker'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'my-app' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      logger.info('App is being served from cache by a service worker.')
    },
    registered () {
      logger.info('Service worker has been registered.')
    },
    cached () {
      logger.info('Content has been cached for offline use.')
    },
    updatefound () {
      logger.info('New content is downloading.')
    },
    updated () {
      logger.info('New content is available; please refresh.')
    },
    offline () {
      logger.info('No internet connection found. App is running in offline mode.')
    },
    error (error) {
      logger.error('Error during service worker registration:', error)
    }
  })
}
