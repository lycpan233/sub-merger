import YAML from "yaml";
import { getSelfNodeData } from "../data/selfNodeData";
import { filterProxyForStash } from "./filterForStash";

function filterNodes(
  nodes: any[],
  pattern: string,
  exclude: boolean = false,
): any[] {
  if (pattern === "") {
    return nodes;
  }
  const regex = new RegExp(pattern);
  return nodes.filter((node) =>
    exclude ? !regex.test(node.name) : regex.test(node.name),
  );
}

function filterNodesForStash(
  nodes: any[],
  pattern: string,
  exclude: boolean = false,
): any[] {
  if (pattern === "") {
    return nodes;
  }
  const regex = new RegExp(pattern);
  return nodes
    .filter((node) =>
      exclude ? !regex.test(node.name) : regex.test(node.name),
    )
    .filter((node) => filterProxyForStash(node));
}

function uniqueNodesArr(nodeNameArr: string[]) {
  return Array.from(new Set(nodeNameArr));
}

// 匹配中文地区名、旗帜及独立地区代码，避免把 AUS 等名称误当成 US。
const defaultTransitPattern =
  "美国|美國|新加坡|狮城|獅城|香港|🇺🇸|🇸🇬|🇭🇰|(?:^|[^A-Za-z])(?:[Uu][Ss][Aa]?|[Ss][Gg][Pp]?|[Hh][Kk][Gg]?)(?=$|[^A-Za-z])";

/** 各业务组默认跟随中转代理，同时保留其它流量及单节点选项。 */
function withTransitProxyGroup(nodeNames: string[]): string[] {
  const unique = uniqueNodesArr(nodeNames);
  return ["中转代理", "其它流量", ...unique];
}

interface IProxyYamlInfo {
  normalYaml: string;
  stashYaml: string;
}

async function generateProxyConfigYaml(
  totalNode: any[],
  envConfig: Record<string, string>,
  env?: any,
): Promise<IProxyYamlInfo> {
  // console.debug('generateProxyConfigYaml: envConfig', envConfig)

  const selfNodes = await getSelfNodeData(env);
  const mergeNodes = selfNodes.concat(totalNode);

  // console.debug('generateProxyConfigYaml: selfNodes', selfNodes);
  // console.debug('generateProxyConfigYaml: mergeNodes', mergeNodes);

  const bMergeFlag = true; // proxy-groups 中是否合并自建节点
  const realTotalNode = bMergeFlag ? mergeNodes : totalNode;
  // console.debug('generateProxyConfigYaml: realTotalNode', realTotalNode);

  const allowNodes = filterNodes(
    realTotalNode,
    envConfig.EXCLUDE_PATTERN || "",
    true,
  );
  const totalAndSelfNodes =
    selfNodes.length > 0
      ? [{ name: "自建节点" }, ...selfNodes, ...allowNodes]
      : allowNodes;

  let otherNodes = filterNodes(
    allowNodes,
    envConfig.OTHER_MATCH_PATTERN || "",
    false,
  );
  otherNodes = filterNodes(
    otherNodes,
    envConfig.OTHER_EXCLUDE_PATTERN || "",
    true,
  );
  let proxyNodes = filterNodes(
    allowNodes,
    envConfig.PROXY_MATCH_PATTERN || defaultTransitPattern,
    false,
  );
  proxyNodes = filterNodes(
    proxyNodes,
    envConfig.PROXY_EXCLUDE_PATTERN || "",
    true,
  );
  let exitNodes = filterNodes(
    allowNodes,
    envConfig.EXIT_MATCH_PATTERN || "",
    false,
  );
  exitNodes = filterNodes(
    exitNodes,
    envConfig.EXIT_EXCLUDE_PATTERN || "",
    true,
  );
  let binanceNodes = filterNodes(
    allowNodes,
    envConfig.BINANCE_MATCH_PATTERN || "",
    false,
  );
  binanceNodes = filterNodes(
    binanceNodes,
    envConfig.BINANCE_EXCLUDE_PATTERN || "",
    true,
  );
  let mediaNodes = filterNodes(
    totalAndSelfNodes,
    envConfig.MEDIA_MATCH_PATTERN || "",
    false,
  );
  mediaNodes = filterNodes(
    mediaNodes,
    envConfig.MEDIA_EXCLUDE_PATTERN || "",
    true,
  );
  let embyNodes = filterNodes(
    totalAndSelfNodes,
    envConfig.EMBY_MATCH_PATTERN || "",
    false,
  );
  embyNodes = filterNodes(
    embyNodes,
    envConfig.EMBY_EXCLUDE_PATTERN || "",
    true,
  );
  let aiNodes = filterNodes(
    totalAndSelfNodes,
    envConfig.AI_MATCH_PATTERN || "",
    false,
  );
  aiNodes = filterNodes(aiNodes, envConfig.AI_EXCLUDE_PATTERN || "", true);
  let whatsappNodes = filterNodes(
    totalAndSelfNodes,
    envConfig.WHATSAPP_MATCH_PATTERN || "",
    false,
  );
  whatsappNodes = filterNodes(
    whatsappNodes,
    envConfig.WHATSAPP_EXCLUDE_PATTERN || "",
    true,
  );
  let steamNodes = filterNodes(
    allowNodes,
    envConfig.STEAM_MATCH_PATTERN || "",
    false,
  );
  steamNodes = filterNodes(
    steamNodes,
    envConfig.STEAM_EXCLUDE_PATTERN || "",
    true,
  );
  let pokerNodes = filterNodes(
    allowNodes,
    envConfig.POKER_MATCH_PATTERN || "",
    false,
  );
  pokerNodes = filterNodes(
    pokerNodes,
    envConfig.POKER_EXCLUDE_PATTERN || "",
    true,
  );
  let taiguoNodes = filterNodes(
    totalAndSelfNodes,
    envConfig.TAIGUO_MATCH_PATTERN || "",
    false,
  );
  taiguoNodes = filterNodes(
    taiguoNodes,
    envConfig.TAIGUO_EXCLUDE_PATTERN || "",
    true,
  );
  const allowNodesForStash = filterNodesForStash(
    realTotalNode,
    envConfig.EXCLUDE_PATTERN || "",
    true,
  );
  let otherNodesForStash = filterNodes(
    allowNodesForStash,
    envConfig.OTHER_MATCH_PATTERN || "",
    false,
  );
  otherNodesForStash = filterNodes(
    otherNodesForStash,
    envConfig.OTHER_EXCLUDE_PATTERN || "",
    true,
  );
  let proxyNodesForStash = filterNodes(
    allowNodesForStash,
    envConfig.PROXY_MATCH_PATTERN || defaultTransitPattern,
    false,
  );
  proxyNodesForStash = filterNodes(
    proxyNodesForStash,
    envConfig.PROXY_EXCLUDE_PATTERN || "",
    true,
  );
  let exitNodesForStash = filterNodes(
    allowNodesForStash,
    envConfig.EXIT_MATCH_PATTERN || "",
    false,
  );
  exitNodesForStash = filterNodes(
    exitNodesForStash,
    envConfig.EXIT_EXCLUDE_PATTERN || "",
    true,
  );
  let binanceNodesForStash = filterNodes(
    allowNodesForStash,
    envConfig.BINANCE_MATCH_PATTERN || "",
    false,
  );
  binanceNodesForStash = filterNodes(
    binanceNodesForStash,
    envConfig.BINANCE_EXCLUDE_PATTERN || "",
    true,
  );
  let mediaNodesForStash = filterNodes(
    totalAndSelfNodes,
    envConfig.MEDIA_MATCH_PATTERN || "",
    false,
  );
  mediaNodesForStash = filterNodes(
    mediaNodesForStash,
    envConfig.MEDIA_EXCLUDE_PATTERN || "",
    true,
  );
  let embyNodesForStash = filterNodes(
    totalAndSelfNodes,
    envConfig.EMBY_MATCH_PATTERN || "",
    false,
  );
  embyNodesForStash = filterNodes(
    embyNodesForStash,
    envConfig.EMBY_EXCLUDE_PATTERN || "",
    true,
  );
  let whatsappNodesForStash = filterNodes(
    totalAndSelfNodes,
    envConfig.WHATSAPP_MATCH_PATTERN || "",
    false,
  );
  whatsappNodesForStash = filterNodes(
    whatsappNodesForStash,
    envConfig.WHATSAPP_EXCLUDE_PATTERN || "",
    true,
  );
  let aiNodesForStash = filterNodes(
    totalAndSelfNodes,
    envConfig.AI_MATCH_PATTERN || "",
    false,
  );
  aiNodesForStash = filterNodes(
    aiNodesForStash,
    envConfig.AI_EXCLUDE_PATTERN || "",
    true,
  );
  let steamNodesForStash = filterNodes(
    allowNodesForStash,
    envConfig.STEAM_MATCH_PATTERN || "",
    false,
  );
  steamNodesForStash = filterNodes(
    steamNodesForStash,
    envConfig.STEAM_EXCLUDE_PATTERN || "",
    true,
  );
  let pokerNodesForStash = filterNodes(
    allowNodesForStash,
    envConfig.POKER_MATCH_PATTERN || "",
    false,
  );
  pokerNodesForStash = filterNodes(
    pokerNodesForStash,
    envConfig.POKER_EXCLUDE_PATTERN || "",
    true,
  );
  let taiguoNodesForStash = filterNodes(
    totalAndSelfNodes,
    envConfig.TAIGUO_MATCH_PATTERN || "",
    false,
  );
  taiguoNodesForStash = filterNodes(
    taiguoNodesForStash,
    envConfig.TAIGUO_EXCLUDE_PATTERN || "",
    true,
  );
  const allAvailableProxies = uniqueNodesArr(
    allowNodes.map((node: any) => node.name),
  );
  const allAvailableProxiesForStash = uniqueNodesArr(
    allowNodesForStash.map((node: any) => node.name),
  );

  // 中转代理只引用节点；其它流量和各业务组引用它，避免循环引用。
  const proxyGroups = [
    {
      name: "中转代理",
      type: "select",
      proxies: proxyNodes.length > 0
        ? uniqueNodesArr(proxyNodes.map((node: any) => node.name))
        : ["REJECT"],
    },
    {
      name: "其它流量",
      type: "select",
      proxies: ["中转代理", ...allAvailableProxies],
    },
    {
      name: "海外AI",
      type: "select",
      proxies: withTransitProxyGroup(
        aiNodes.map((node: any) => node.name),
      ),
    },
    {
      name: "海外媒体",
      type: "select",
      proxies: withTransitProxyGroup(
        mediaNodes.map((node: any) => node.name),
      ),
    },
    {
      name: "币安",
      type: "select",
      proxies: withTransitProxyGroup(
        binanceNodes.map((node: any) => node.name),
      ),
    },
    {
      name: "直接连接",
      type: "select",
      proxies: ["DIRECT"],
    },
  ];

  const proxyGroupsForStash = [
    {
      name: "中转代理",
      type: "select",
      proxies: proxyNodesForStash.length > 0
        ? uniqueNodesArr(proxyNodesForStash.map((node: any) => node.name))
        : ["REJECT"],
    },
    {
      name: "其它流量",
      type: "select",
      proxies: ["中转代理", ...allAvailableProxiesForStash],
    },
    {
      name: "海外AI",
      type: "select",
      proxies: withTransitProxyGroup(
        aiNodesForStash.map((node: any) => node.name),
      ),
    },
    {
      name: "海外媒体",
      type: "select",
      proxies: withTransitProxyGroup(
        mediaNodesForStash.map((node: any) => node.name),
      ),
    },
    {
      name: "币安",
      type: "select",
      proxies: withTransitProxyGroup(
        binanceNodesForStash.map((node: any) => node.name),
      ),
    },
    {
      name: "直接连接",
      type: "select",
      proxies: ["DIRECT"],
    },
  ];

  // 创建完整的配置对象
  const config = {
    proxies: bMergeFlag ? allowNodes : selfNodes.concat(allowNodes),
    "proxy-groups": proxyGroups,
  };

  const configForStash = {
    proxies: bMergeFlag
      ? allowNodesForStash
      : selfNodes.concat(allowNodesForStash),
    "proxy-groups": proxyGroupsForStash,
  };

  const proxyYamlObj: IProxyYamlInfo = {
    normalYaml: YAML.stringify(config),
    stashYaml: YAML.stringify(configForStash),
  };

  return proxyYamlObj;
}

export default generateProxyConfigYaml;
