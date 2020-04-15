import { FileContent, CID } from '../ipfs'

export type FileSystemOptions = {
  version?: FileSystemVersion
  keyName?: string
}

export enum FileSystemVersion {
  v0_0_0 = "0.0.0",
  v1_0_0 = "1.0.0"
}

export type AddLinkOpts = {
  shouldOverwrite?: boolean
}

export type NonEmptyPath = [string, ...string[]]

export type TreeData = {
  links: Links
}

export type PrivateTreeData = TreeData & {
  key: string
}

export type BasicLink = {
  name: string
  cid: CID
  size?: number 
}

export type Link = BasicLink & {
  mtime?: number
  isFile: boolean
}

export type Links = { [name: string]: Link }
export type BasicLinks = { [name: string]: BasicLink }

export type Metadata = {
  isFile?: boolean
  mtime?: number
}

export type PinMap = {
  [cid: string]: CID[]
}

export type Header = Metadata & {
  version?: FileSystemVersion
  key?: string
  pins?: PinMap
}

export interface FileStatic {
  create: (content: FileContent, version?: FileSystemVersion) => File
  fromCID: (cid: CID) => Promise<File>
}

export interface PrivateFileStatic extends FileStatic{
  fromCIDWithKey: (cid: CID, key: string) => Promise<File>
}

export interface File {
  content: FileContent
  put(): Promise<CID>
}

export interface TreeStatic {
  empty: (version?: FileSystemVersion) => Promise<Tree>
  fromCID: (cid: CID) => Promise<Tree>
}

export interface PrivateTreeStatic extends TreeStatic {
  fromCIDWithKey: (cid: CID, key: string) => Promise<Tree>
}

export interface Tree {
  version: FileSystemVersion
  links: Links
  isFile: boolean
  static: {
    tree: TreeStatic
    file: FileStatic
  }


  ls(path: string): Promise<Links>
  mkdir(path: string): Promise<Tree>
  cat(path: string): Promise<FileContent>
  add(path: string, content: FileContent): Promise<Tree>
  get(path: string): Promise<Tree | File | null>
  pathExists(path: string): Promise<boolean> 
  addChild(path: string, toAdd: Tree | File): Promise<Tree>

  put(): Promise<CID>
  updateDirectChild(child: Tree | File, name: string): Promise<Tree>
  getDirectChild(name: string): Promise<Tree | File | null>
  getOrCreateDirectChild(name: string): Promise<Tree | File>

  data(): TreeData
  findLink(name: string): Link | null
  updateLink(link: Link): Tree
  rmLink(name: string): Tree
  copyWithLinks(links: Links): Tree
}