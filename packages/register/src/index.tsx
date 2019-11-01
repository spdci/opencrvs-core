import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { injectGlobal } from '@register/styledComponents'
import { App } from '@register/App'
import registerServiceWorker from '@register/registerServiceWorker'
import { createStore } from '@register/store'
import * as actions from '@register/notification/actions'
import { storage } from '@register/storage'
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/browser'
import * as LogRocket from 'logrocket'
import { SubmissionController } from '@register/SubmissionController'
import * as pdfjsLib from 'pdfjs-dist'
import { InboxController } from './InboxController'
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`

storage.configStorage('OpenCRVS')

// Injecting global styles for the body tag - used only once
// eslint-disable-line
injectGlobal`
  body {
    margin: 0;
    padding: 0;
    overflow-y: scroll;
  }
`

const { store, history } = createStore()

if (
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
) {
  // setup error reporting using sentry
  Sentry.init({
    dsn: window.config.SENTRY
  })

  // setup log rocket to ship log messages and record user errors
  LogRocket.init(window.config.LOGROCKET)

  // Integrate the two
  Sentry.configureScope(scope => {
    scope.addEventProcessor(async event => {
      if (!event.extra) {
        event.extra = {}
      }
      const sessionUrl = await new Promise(resolve => {
        LogRocket.getSessionURL(url => {
          resolve(url)
        })
      })
      event.extra.sessionURL = sessionUrl
      return event
    })
  })
}

function onNewContentAvailable(waitingSW: ServiceWorker | null) {
  if (waitingSW) {
    waitingSW.postMessage('skipWaiting')
    window.location.reload()
  }
}

function onBackGroundSync() {
  if (typeof BroadcastChannel === 'undefined') {
    return
  }
  const channel = new BroadcastChannel(
    window.config.BACKGROUND_SYNC_BROADCAST_CHANNEL
  )
  channel.onmessage = e => {
    const action = actions.showBackgroundSyncedNotification()
    store.dispatch(action)
  }
}

onBackGroundSync()

ReactDOM.render(
  <App store={store} history={history} />,
  document.getElementById('root')
)

registerServiceWorker(onNewContentAvailable)
new SubmissionController(store).start()
new InboxController(store).start()
