// app/page.tsx
'use client'; // 确保是客户端组件

import { useAccount } from 'wagmi';
import { ConnectWalletButton } from './components/ConnectWalletButton';
import { MiningDashboard } from './components/MiningDashboard'; 
    
export default function Home() {
  // 修复：不使用 isConnected，而是使用 'status'
  const { status } = useAccount(); 
    
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {/* 1. 连接按钮 (始终显示在右上角) */}
      <ConnectWalletButton />
    
      {/* 2. 主内容区域 */}
      <div className="z-10 w-full max-w-lg items-center justify-between text-center">
            
        {/* A. 正在连接或重连时，显示加载中 */}
        {status === 'connecting' || status === 'reconnecting' ? (
          <div>正在连接钱包...</div>
        ) : 
        // B. 成功连接后，显示控制台
        status === 'connected' ? (
          <MiningDashboard />
        ) : (
          // C. 其他情况 (disconnected)，显示欢迎信息
          <div>
            <h1 className="text-4xl font-bold mb-4">
              欢迎来到 MMT 挖矿 DApp
            </h1>
            <p className="text-lg text-gray-400">
              请先连接你的钱包以激活挖矿。
            </p>
          </div>
        )}
    
      </div>
    </main>
  );
}