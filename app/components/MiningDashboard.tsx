// app/components/MiningDashboard.tsx
'use client';

import { useState, useEffect } from 'react'; 
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem'; 

// 导入 ABI 和常量 (V4)
import { miningDAppAbi } from '../../abi/miningDAppAbi'; 
import { DAPP_ADDRESS, TARGET_CHAIN_ID } from '../constants';

export function MiningDashboard() {
  // 0. 获取用户账户信息
  const { address, chain } = useAccount();
  const [referrer, setReferrer] = useState(''); 
  const [referrerError, setReferrerError] = useState('');
  const [copyStatus, setCopyStatus] = useState('复制'); 

  // 1. (读取) 检查用户数据 (V4)
  const { data: userData, refetch: refetchUserData } = useReadContract({
    abi: miningDAppAbi,
    address: DAPP_ADDRESS,
    functionName: 'users',
    args: [address!], 
    query: {
      enabled: !!address, 
    },
  });
  
  // --- (V4) 解析 Struct 数据 ---
  // V4 结构体: [isActivated, referrer, directReferrals, L2Referrals, miningPower, rewardDebt]
  // 索引:         [0]          [1]       [2]               [3]           [4]           [5]
  
  const isActivated = userData && Array.isArray(userData) ? (userData[0] as boolean) : false;
  
  // (V4) 直接下级 (索引 [2])
  const directReferrals = userData && Array.isArray(userData) && userData.length > 2 ? (userData[2] as bigint) : BigInt(0);
  // (V4) L2 下级 (索引 [3])
  const L2Referrals = userData && Array.isArray(userData) && userData.length > 3 ? (userData[3] as bigint) : BigInt(0);
  // (V4) 总算力 (索引 [4])
  const totalMiningPower = userData && Array.isArray(userData) && userData.length > 4 ? (userData[4] as bigint) : BigInt(0);
  
  // (V4) 计算收益
  const estimatedL1Rewards = (Number(directReferrals) * 0.004).toFixed(3);
  const estimatedL2Rewards = (Number(L2Referrals) * 0.002).toFixed(3); // 新增 L2 收益

  // 2. (读取) 获取 MMT (不变)
  const { data: pendingMmt, refetch: refetchPendingMmt } = useReadContract({
    abi: miningDAppAbi,
    address: DAPP_ADDRESS,
    functionName: 'getPendingMmt',
    args: [address!],
    query: {
      enabled: !!address && isActivated, 
      refetchInterval: 5000,
    },
  });

  // 3. (写入) 激活 (不变)
  const { 
    data: activateHash, 
    isPending: isActivating, 
    error: activationError, 
    writeContract: activateMining,
    reset: resetActivate
  } = useWriteContract();

  // 4. (写入) 领取 (不变)
  const { 
    data: claimHash, 
    isPending: isClaiming, 
    error: claimError,
    writeContract: claimMiningRewards 
  } = useWriteContract();

  // 5. (等待) 监听 (不变)
  const { isSuccess: isActivationSuccess, data: activationReceipt } = useWaitForTransactionReceipt({
    hash: activateHash,
  });
  const { isSuccess: isClaimSuccess, data: claimReceipt } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // 监视激活 (不变)
  useEffect(() => {
    if (isActivationSuccess) {
      console.log('V4 Activation successful!', activationReceipt);
      refetchUserData(); 
      refetchPendingMmt();
      resetActivate(); 
    }
  }, [isActivationSuccess, activationReceipt, refetchUserData, refetchPendingMmt, resetActivate]); 

  // 监视领取 (不变)
  useEffect(() => {
    if (isClaimSuccess) {
      console.log('V4 Claim successful!', claimReceipt);
      refetchPendingMmt(); 
    }
  }, [isClaimSuccess, claimReceipt, refetchPendingMmt]);

  // --- 辅助函数 (不变) ---
  const handleCopyReferral = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopyStatus('已复制!');
      setTimeout(() => { setCopyStatus('复制'); }, 2000);
    }
  };
  const validateReferrer = (addr: string) => {
    if (addr.trim() === '') { setReferrerError(''); return true; }
    if (!isAddress(addr.trim())) { setReferrerError('请输入一个有效的 tBNB 地址'); return false; }
    setReferrerError(''); return true;
  };

  // --- 渲染逻辑 (不变) ---
  if (chain && chain.id !== TARGET_CHAIN_ID) {
    return <div className="text-red-500">请切换到 BNB Testnet！</div>;
  }
  
  // A. 如果用户未激活 (不变)
  if (!isActivated) {
    return (
      <div className="p-6 border rounded-lg bg-gray-800 text-white w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">激活挖矿 (V4)</h2>
        <p className="mb-4">支付 0.01 tBNB 以永久激活你的挖矿账户。</p>
        <input
          type="text"
          placeholder="输入推荐人地址 (或留空)"
          value={referrer}
          onChange={(e) => {
            setReferrer(e.target.value);
            validateReferrer(e.target.value); 
          }}
          className={`w-full p-2 mb-2 bg-gray-700 rounded text-white ${referrerError ? 'border border-red-500' : ''}`}
        />
        {referrerError && <div className="text-sm text-red-500 mb-4">{referrerError}</div>}
        <button
          onClick={() => {
            if (!validateReferrer(referrer)) return; 
            const referrerAddress = (referrer.trim() || '0x0000000000000000000000000000000000000000') as `0x${string}`;
            activateMining({
              abi: miningDAppAbi,
              address: DAPP_ADDRESS,
              functionName: 'activateMining',
              args: [referrerAddress],
              value: parseEther('0.01'), 
            });
          }}
          disabled={isActivating || !!referrerError} 
          className="w-full p-3 bg-blue-600 rounded text-white font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {isActivating ? '正在激活...' : '支付 0.01 tBNB 激活'}
        </button>
        {activateHash && <div className="mt-2 text-sm text-gray-400 break-all">交易已发送: {activateHash}</div>}
        {activationError && (
          <div className="mt-2 text-sm text-red-500">
            <strong>激活失败:</strong> {activationError.message.includes('Referrer not activated') ? '推荐人未激活！' : activationError.message}
          </div>
        )}
      </div>
    );
  }

  // B. 如果用户已激活 (V4 升级)
  return (
    <div className="p-6 border rounded-lg bg-gray-800 text-white w-full max-w-md">
      {/* (V4) 挖矿数据统计板块
      */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">挖矿控制台 (V4)</h2>
        <p className="text-lg flex justify-between">
          <span>状态:</span>
          <span className="text-green-400">已激活</span>
        </p>
        <p className="text-lg flex justify-between">
          <span>总算力:</span>
          <span className="text-white">{totalMiningPower.toString()} P</span>
        </p>
         <p className="text-lg flex justify-between">
          <span>直接下级 (L1):</span>
          <span className="text-white">{directReferrals.toString()} 人</span>
        </p>
         <p className="text-lg flex justify-between">
          <span>L1 收益 (tBNB):</span>
          <span className="text-white">{estimatedL1Rewards} tBNB</span>
        </p>
         {/* --- V4 新增行 --- */}
         <p className="text-lg flex justify-between">
          <span>间接下级 (L2):</span>
          <span className="text-white">{L2Referrals.toString()} 人</span>
        </p>
         <p className="text-lg flex justify-between">
          <span>L2 收益 (tBNB):</span>
          <span className="text-white">{estimatedL2Rewards} tBNB</span>
        </p>
         {/* --- V4 新增行结束 --- */}
      </div>
      
      {/* (V4) MMT 领取板块
      */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-lg flex justify-between mb-2">
          <span>待领取 MMT:</span>
          <span className="text-yellow-400">
            {(typeof pendingMmt === 'bigint') ? parseFloat(formatEther(pendingMmt)).toFixed(6) : '0.00'}
          </span>
        </p>
        <button
          onClick={() => {
            claimMiningRewards({
              abi: miningDAppAbi,
              address: DAPP_ADDRESS,
              functionName: 'claimMiningRewards',
            });
          }}
          disabled={isClaiming || !pendingMmt || (typeof pendingMmt === 'bigint' && pendingMmt === BigInt(0))} 
          className="w-full p-3 bg-green-600 rounded text-white font-bold hover:bg-green-700 disabled:opacity-50"
        >
          {isClaiming ? '正在领取...' : '领取 MMT 收益'}
        </button>
        {claimHash && <div className="mt-2 text-sm text-gray-400 break-all">交易已发送: {claimHash}</div>}
        {claimError && (
          <div className="mt-2 text-sm text-red-500">
            <strong>领取失败:</strong> {claimError.message}
          </div>
        )}
      </div>

      {/* (V4) 邀请好友板块
      */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-xl font-bold mb-2">邀请好友</h3>
        <p className="text-sm text-gray-400 mb-3">
          复制你的钱包地址分享给好友。他们激活时使用你的地址作为推荐人，你将获得算力提升和 tBNB 奖励！
        </p>
        <div className="flex">
          <input
            type="text"
            readOnly
            value={address || ''} 
            className="w-full p-2 bg-gray-900 text-gray-300 rounded-l-md"
          />
          <button
            onClick={handleCopyReferral} 
            className="p-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            style={{ minWidth: '80px' }} 
          >
            {copyStatus}
          </button>
        </div>
      </div>

    </div>
  );
}