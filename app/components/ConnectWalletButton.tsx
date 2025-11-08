// app/components/ConnectWalletButton.tsx
'use client'; 

// 导入 useState 和 useEffect
import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function ConnectWalletButton() {
  // --- (新增) 修复水合作用错误 ---
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true); // 当组件在客户端挂载后，设为 true
  }, []);
  // --- ----------------------- ---

  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // 缩短地址的辅助函数
  const shortenAddress = (addr: string) => 
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  // --- (修改) ---
  // 只有在 isClient 为 true 后，才渲染钱包状态
  if (!isClient) {
    return null; // 在服务器渲染和水合作用期间，不渲染任何东西
  }

  // 1. 如果已连接
  if (isConnected) {
    return (
      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
        <span style={{ padding: '8px 12px', background: '#333', borderRadius: '6px', color: 'white' }}>
          {chain?.name}: {shortenAddress(address!)}
        </span>
        <button 
          onClick={() => disconnect()}
          style={{ padding: '8px 12px', background: '#800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // 2. 如果未连接
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px' }}>
      <button 
        onClick={() => connect({ connector: injected() })}
        style={{ padding: '8px 12px', background: '#004a99', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        Connect MetaMask
      </button>
    </div>
  );
}