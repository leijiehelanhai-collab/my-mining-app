// app/components/MiningDashboard.tsx
'use client';

// (我们现在需要 'useState' 来处理“复制”按钮的状态)
import { useState, useEffect } from 'react'; 
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem'; 

// 导入 ABI 和常量
import { miningDAppAbi } from '../../abi/miningDAppAbi'; 
import { DAPP_ADDRESS, TARGET_CHAIN_ID } from '../constants';

export function MiningDashboard() {
  // 0. 获取用户账户信息
  const { address, chain } = useAccount();
  const [referrer, setReferrer] = useState(''); 
  const [referrerError, setReferrerError] = useState('');
  
  // (新增) "复制" 按钮的状态
  const [copyStatus, setCopyStatus] = useState('复制'); 

  // 1. (读取) 检查用户数据 (包括激活状态、下级数量、总算力)
  const { data: userData, refetch: refetchUserData } = useReadContract({
    abi: miningDAppAbi,
    address: DAPP_ADDRESS,
    functionName: 'users',
    args: [address!], 
    query: {
      enabled: !!address, 
    },
  });
  
  // --- (新增) 解析 Struct 数据 ---
  // userData 是一个数组: [isActivated, referrer, directReferrals, miningPower, rewardDebt]
  const isActivated = userData && Array.isArray(userData) ? (userData[0] as boolean) : false;
  // (新增) 直接下级数量 (bigint 类型)
  const directReferrals = userData && Array.isArray(userData) && userData.length > 2 ? (userData[2] as bigint) : BigInt(0);
  // (新增) 总算力 (bigint 类型)
  const totalMiningPower = userData && Array.isArray(userData) && userData.length > 3 ? (userData[3] as bigint) : BigInt(0);
  // (新增) 计算 L1 预估收益
  const estimatedL1Rewards = (Number(directReferrals) * 0.004).toFixed(3); // 0.004 tBNB per referral

  // 2. (读取) 获取用户待领取的 MMT 数量
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

  // 3. (写入) 准备 "activateMining" 函数
  const { 
    data: activateHash, 
    isPending: isActivating, 
    error: activationError, 
    writeContract: activateMining,
    reset: resetActivate
  } = useWriteContract();

  // 4. (写入) 准备 "claimMiningRewards" 函数
  const { 
    data: claimHash, 
    isPending: isClaiming, 
    error: claimError,
    writeContract: claimMiningRewards 
  } = useWriteContract();

  // 5. (等待) 监听交易是否成功
  const { isSuccess: isActivationSuccess, data: activationReceipt } = useWaitForTransactionReceipt({
    hash: activateHash,
  });

  const { isSuccess: isClaimSuccess, data: claimReceipt } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // 监视激活是否成功
  useEffect(() => {
    if (isActivationSuccess) {
      console.log('Activation successful!', activationReceipt);
      refetchUserData(); // (重要) 激活后, 重新查询 user 数据 (算力/下级)
      refetchPendingMmt();
      resetActivate(); 
    }
  }, [isActivationSuccess, activationReceipt, refetchUserData, refetchPendingMmt, resetActivate]); 

  // 监视领取是否成功
  useEffect(() => {
    if (isClaimSuccess) {
      console.log('Claim successful!', claimReceipt);
      refetchPendingMmt(); 
    }
  }, [isClaimSuccess, claimReceipt, refetchPendingMmt]);


  // --- 辅助函数 ---

  // (新增) 复制功能
  const handleCopyReferral = () => {
    if (address) {
      navigator.clipboard.writeText(address); // 复制当前用户的地址
      setCopyStatus('已复制!');
      setTimeout(() => {
        setCopyStatus('复制');
      }, 2000); // 2秒后重置按钮文字
    }
  };

  // 验证推荐人地址
  const validateReferrer = (addr: string) => {
    if (addr.trim() === '') {
      setReferrerError(''); 
      return true;
    }
    if (!isAddress(addr.trim())) {
      setReferrerError('请输入一个有效的 tBNB 地址');
      return false;
    }
    setReferrerError('');
    return true;
  };

  // --- 渲染逻辑 ---

  // 如果钱包连接的网络不是 BSC Testnet (ID: 97)
  if (chain && chain.id !== TARGET_CHAIN_ID) {
    return <div className="text-red-500">请切换到 BNB Testnet！</div>;
  }

  // --- 核心 UI ---
  
  // A. 如果用户未激活
  if (!isActivated) {
    return (
      <div className="p-6 border rounded-lg bg-gray-800 text-white w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">激活挖矿</h2>
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
        {activateHash && <div className="mt-2 text-sm text-gray-400">交易已发送: {activateHash}</div>}
        
        {activationError && (
          <div className="mt-2 text-sm text-red-500">
            <strong>激活失败:</strong> {activationError.message.includes('Referrer not activated') ? '推荐人未激活！' : activationError.message}
          </div>
        )}
      </div>
    );
  }

  // B. 如果用户已激活 (我们在这里添加新板块)
  return (
    <div className="p-6 border rounded-lg bg-gray-800 text-white w-full max-w-md">
      {/* (新增) 挖矿数据统计板块
      */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">挖矿控制台</h2>
        <p className="text-lg flex justify-between">
          <span>状态:</span>
          <span className="text-green-400">已激活</span>
        </p>
        <p className="text-lg flex justify-between">
          <span>总算力:</span>
          <span className="text-white">{totalMiningPower.toString()} P</span>
        </p>
         <p className="text-lg flex justify-between">
          <span>直接下级:</span>
          <span className="text-white">{directReferrals.toString()} 人</span>
        </p>
         <p className="text-lg flex justify-between">
          <span>预估 L1 收益:</span>
          <span className="text-white">{estimatedL1Rewards} tBNB</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">
          (L2 收益被合约自动秒结，此处不统计)
        </p>
      </div>
      
      {/* (修改) MMT 领取板块
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

      {/* (新增) 邀请好友板块
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
            value={address || ''} // 显示当前连接的钱包地址
            className="w-full p-2 bg-gray-900 text-gray-300 rounded-l-md"
          />
          <button
            onClick={handleCopyReferral} // 调用复制函数
            className="p-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            style={{ minWidth: '80px' }} // 防止按钮文字变化时跳动
          >
            {copyStatus}
          </button>
        </div>
      </div>

    </div>
  );
}