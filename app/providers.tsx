// app/providers.tsx
'use client'; // 必须标记为客户端组件

import { WagmiProvider, createConfig, http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains'; // 导入 BSC 测试网
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors'; // 导入 MetaMask (injected) 连接器

// 1. 初始化 React Query 客户端
const queryClient = new QueryClient();

// 2. 创建 Wagmi 配置 (纯 Wagmi 方式)
const config = createConfig({
  // 配置我们要支持的链
  chains: [bscTestnet],
  
  // 配置连接器 (我们只用 MetaMask)
  connectors: [
    injected(), // 对应 MetaMask, TrustWallet 等浏览器插件
  ],

  // 告诉 Wagmi 如何连接到这些链
  transports: {
    [bscTestnet.id]: http(), // 使用 http RPC
  },
});

// 3. 导出一个 Providers 组件
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children} 
      </QueryClientProvider>
    </WagmiProvider>
  );
}