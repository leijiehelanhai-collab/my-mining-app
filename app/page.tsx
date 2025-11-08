// app/page.tsx
'use client'; 
import { useState, useEffect } from 'react'; 
import { useAccount } from 'wagmi';
import { ConnectWalletButton } from './components/ConnectWalletButton';
import { MiningDashboard } from './components/MiningDashboard'; 

export default function Home() {
  // (水合作用修复)
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { status } = useAccount(); 

  const renderContent = () => {
    if (!isClient) {
      return (
        <div className="text-lg text-gray-400">
          正在加载DApp...
        </div>
      );
    }

    if (status === 'connecting' || status === 'reconnecting') {
      return (
        <div className="text-lg text-gray-400">
          正在连接钱包...
        </div>
      );
    }

    if (status === 'connected') {
      // (重要) 确保你在这里使用的是 V4 版本的 Dashboard
      // (如果你还没部署 V4, 它会显示 V4 激活界面)
      return <MiningDashboard />; 
    }

    return (
      <div>
        <h1 className="text-4xl font-bold mb-4">
          欢迎来到 MMT 挖矿 DApp
        </h1>
        <p className="text-lg text-gray-400">
          请先连接你的钱包以激活挖矿。
        </p>
      </div>
    );
  };

  return (
    // ------------------------------------
    // 👇 (响应式修复) 
    // 我们把 p-24 改成了 p-4 md:p-24
    // ------------------------------------
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">

      {/* 1. 连接按钮 */}
      <ConnectWalletButton />

      {/* 2. 主内容区域 */}
      <div className="z-10 w-full max-w-lg items-center justify-between text-center">
        {renderContent()}
      </div>
    </main>
  );
}