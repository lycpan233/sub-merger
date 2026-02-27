/**
 * stash不支持包含以下内容的节点
 * flow: xtls-rprx-vision
 * cipher: 2022-blake3-aes-256-gcm
 */
export function filterProxyForStash(proxy: any): boolean {
  return true;
}
