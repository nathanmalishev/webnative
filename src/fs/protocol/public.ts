/** @internal */

/** @internal */
import { Links, PutDetails, Metadata, TreeInfo, FileInfo, Skeleton, ChildrenMetadata } from '../types'
import { isString } from '../../common/type-checks'
import * as check from '../types/check'

import { isValue } from '../../common'
import ipfs, { CID, FileContent } from '../../ipfs'
import * as link from '../link'

import * as basic from './basic'

export const putTree = async (
    links: Links,
    skeletonVal: Skeleton,
    childrenVal: ChildrenMetadata,
    metadataVal: Metadata
  ): Promise<PutDetails> => {
  const userlandInfo = await basic.putLinks(links)
  const userland = link.make('userland', userlandInfo.cid, true, userlandInfo.size)
  const [metadata, skeleton, children] = await Promise.all([
    putAndMakeLink('metadata', metadataVal),
    putAndMakeLink('skeleton', skeletonVal),
    putAndMakeLink('children', childrenVal),
  ])
  const internalLinks = { metadata, skeleton, children, userland } as Links
  const { cid, size } = await basic.putLinks(internalLinks)
  return { cid, userland: userland.cid, metadata: metadata.cid, size }
}

export const putFile = async (
    content: FileContent,
    metadataVal: Metadata
  ): Promise<PutDetails> => {
  const userlandInfo = await basic.putFile(content)
  const userland = link.make('userland', userlandInfo.cid, true, userlandInfo.size)
  const metadata = await putAndMakeLink('metadata', metadataVal)
  const internalLinks = { metadata, userland } as Links
  const { cid, size } = await basic.putLinks(internalLinks)
  return { cid, userland: userland.cid, metadata: metadata.cid, size }
}

export const putAndMakeLink = async (name: string, val: FileContent) => {
  const { cid, size } = await ipfs.encoded.add(val, null)
  return link.make(name, cid, true, size)
}

export const get = async (cid: CID): Promise<TreeInfo | FileInfo> => {
  const links = await basic.getLinks(cid)
  const metadata = await getAndCheckValue(links, 'metadata', check.isMetadata)
  let skeleton, children
  if(!metadata.isFile){
    [skeleton, children] = await Promise.all([
      getAndCheckValue(links, 'skeleton', check.isSkeleton),
      getAndCheckValue(links, 'children', check.isChildrenMetadata),
      ipfs.size(cid),
    ])
  }

  const userland = links['userland']?.cid || null
  if(!check.isCID(userland)) throw new Error("Could not find userland")

  return { userland, metadata, skeleton, children }
}

export const getValue = async (
  linksOrCID: Links | CID,
  name: string,
): Promise<unknown> => {
  if (isString(linksOrCID)) {
    const links = await basic.getLinks(linksOrCID)
    return getValueFromLinks(links, name)
  }

  return getValueFromLinks(linksOrCID, name)
}

export const getValueFromLinks = async (
  links: Links,
  name: string,
): Promise<unknown> => {
  const linkCID = links[name]?.cid
  if (!linkCID) return null

  return ipfs.encoded.catAndDecode(linkCID, null)
}
export const getAndCheckValue = async <T>(
  linksOrCid: Links | CID,
  name: string,
  checkFn: (val: any) => val is T,
  canBeNull = false
): Promise<T> => {
  const val = await getValue(linksOrCid, name)
  return checkValue(val, name, checkFn, canBeNull)
}

export const checkValue = <T>(val: any, name: string, checkFn: (val: any) => val is T, canBeNull = false): T => {
  if(!isValue(val)){
    if(canBeNull) return val
    throw new Error(`Could not find header value: ${name}`)
  }
  if(checkFn(val)){
    return val
  }
  throw new Error(`Improperly formatted header value: ${name}`)
}
