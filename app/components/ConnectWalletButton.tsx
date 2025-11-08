// app/components/ConnectWalletButton.tsx
'use client'; // 客户端组件

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function ConnectWalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // 缩短地址的辅助函数
  const shortenAddress = (addr: string) => 
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  // 1. 如果已连接
  if (isConnected) {
    return (
      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
        {/* 显示网络和地址 */}
        <span style={{ padding: '8px 12px', background: '#333', borderRadius: '6px', color: 'white' }}>
          {chain?.name}: {shortenAddress(address!)}
        </span>
        {/* 断开连接按钮 */}
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
      {/* 我们只提供 MetaMask (injected) 连接按钮 
        'connect({ connector: injected() })' 是关键
      */}
      <button 
        onClick={() => connect({ connector: injected() })}
        style={{ padding: '8px 12px', background: '#004a99', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        Connect MetaMask
      </button>
    </div>
  );
}