import * as localForage from 'localforage'

function configStorage() {
  localForage.config({
    driver: localForage.INDEXEDDB,
    name: 'OpenCRVS'
  })
}

async function getItem(key: string): Promise<string> {
  return await localForage.getItem<string>(key)
}

async function setItem(key: string, value: string) {
  return await localForage.setItem(key, value)
}

export const storage = {
  configStorage,
  getItem,
  setItem
}
