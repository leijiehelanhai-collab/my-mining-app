// app/page.tsx
'use client'; 
// 导入 useState 和 useEffect
import { useState, useEffect } from 'react'; 
import { useAccount } from 'wagmi';
import { ConnectWalletButton } from './components/ConnectWalletButton';
import { MiningDashboard } from './components/MiningDashboard'; 
    
export default function Home() {
  // --- (新增) 修复水合作用错误 ---
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  // --- ----------------------- ---

  const { status } = useAccount(); 

  // (新增) 辅助函数：根据状态渲染内容
  const renderContent = () => {
    // 只有在 isClient 为 true 后，才检查钱包状态
    if (!isClient) {
      return (
        <div className="text-lg text-gray-400">
          正在加载DApp...
        </div>
      );
    }

    // A. 正在连接或重连时
    if (status === 'connecting' || status === 'reconnecting') {
      return (
        <div className="text-lg text-gray-400">
          正在连接钱包...
        </div>
      );
    }
        
    // B. 成功连接后
    if (status === 'connected') {
      return <MiningDashboard />;
    }
        
    // C. 其他情况 (disconnected)
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
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {/* 1. 连接按钮 (它现在自己处理水合作用) */}
      <ConnectWalletButton />
    
      {/* 2. 主内容区域 (它现在也处理水合作用) */}
      <div className="z-10 w-full max-w-lg items-center justify-between text-center">
        {renderContent()}
      </div>
    </main>
  );
}