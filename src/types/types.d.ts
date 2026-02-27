declare enum SubscriptionType {
  Monthly = "包年/包月",
  TrafficPackage = "流量包",
}

declare interface SubUserInfo {
  upload: number;
  download: number;
  total: number;
  expire: number;
}

declare interface FinalObj {
  subUserInfo: SubUserInfo;
  normalYaml: string;
  stashYaml: string;
}

export { SubscriptionType, SubUserInfo, FinalObj };

declare module "*.json" {
  const value: any;
  export default value;
}
