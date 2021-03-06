import aes from 'keystore-idb/aes'
import * as keystore from './config'


export const getKeyByName = async (keyName: string): Promise<string> => {
  const ks = await keystore.get()
  return ks.exportSymmKey(keyName)
}

export const encrypt = async (data: Uint8Array, keyStr: string): Promise<Uint8Array> => {
  const key = await aes.importKey(keyStr)
  const encrypted = await aes.encryptBytes(data.buffer, key)
  return new Uint8Array(encrypted)
}

export const decrypt = async (encrypted: Uint8Array, keyStr: string): Promise<Uint8Array> => {
  const key = await aes.importKey(keyStr)
  const decryptedBuf = await aes.decryptBytes(encrypted.buffer, key)
  return new Uint8Array(decryptedBuf)
}

export const genKeyStr = async (): Promise<string> => {
  const key = await aes.makeKey()
  return aes.exportKey(key)
}
