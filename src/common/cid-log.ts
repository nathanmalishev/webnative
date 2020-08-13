import localforage from 'localforage'


const FS_CID_LOG = "fission_sdk.fs_cid_log"


// QUERYING


export async function get(): Promise<Array<string>> {
  return (await localforage.getItem(FS_CID_LOG)) || []
}

export async function index(cid: string): Promise<[number, number]> {
  const log = await get()
  return [ log.indexOf(cid), log.length ]
}

export async function newest(): Promise<string> {
  return (await get())[0]
}



// MUTATION


export async function add(cid: string): Promise<void> {
  const log = await get()
  const newLog = [ cid, ...log ].slice(0, 1000)
  await localforage.setItem(FS_CID_LOG, newLog)
}
