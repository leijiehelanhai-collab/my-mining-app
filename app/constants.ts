// constants.ts

// 从 wagmi 导入 bscTestnet 以获取 chainId
import { bscTestnet } from 'wagmi/chains';

// 你的合约地址
export const DAPP_ADDRESS = '0xC401677Acf6B865EC42386CFb79343Df281333b6' as const;
export const TOKEN_ADDRESS = '0xdB1C296EDC5AeFB7c51cC218Ed3Ac6fBd4370E53' as const;

// 目标链的 ID (97)
export const TARGET_CHAIN_ID = bscTestnet.id;