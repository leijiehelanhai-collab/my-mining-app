// constants.ts

// 从 wagmi 导入 bscTestnet 以获取 chainId
import { bscTestnet } from 'wagmi/chains';

// 你的合约地址
export const DAPP_ADDRESS = '0x9641515C95c6BCc8dBb1bfa0b05004B0b9b30da4' as const;
export const TOKEN_ADDRESS = '0x896fC7D9bA75C4ed4552a7Bcd3FD0577726FDb2a' as const;

// 目标链的 ID (97)
export const TARGET_CHAIN_ID = bscTestnet.id;