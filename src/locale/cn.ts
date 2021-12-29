const cn = {
  tab: {
    Sign: '签名',
    CreateAddress: '创建地址',
    CreateTx: '创建交易'
  },
  sign: {
    sign1: '请填入待签名的HEX',
    sign2: '业务信息',
    sign3: '交易类型',
    sign4: '转账',
    sign5: '金额',
    sign6: '发送地址',
    sign7: '接收地址',
    sign8: '多签信息',
    sign9: '已签名数量',
    sign10: '仍需签名数',
    sign11:
      '*本次签名为该笔多签交易最后一次签名，完成签名后交易将被广播至网络中',
    sign12: '签名结果HEX',
    sign13: '已签名',
    sign14: '当前账户无签名权限'
  },
  createAddress: {
    createAddress1:
      '粘贴多个公钥，每个公钥之间用逗号隔开，应用将自动将信息拆分并填写在下方',
    createAddress2: '公钥列表 丨 已添加数量：',
    createAddress3: '请输入签名地址公钥',
    createAddress4: '最少签名数量',
    createAddress5: '地址: ',
    createAddress6: '已生成多签地址',
    createAddress7: '无效的公钥'
  },
  createTx: {
    createTx1: '请选择多签地址',
    createTx2: '请选择资产',
    createTx3: '可用：',
    createTx4: '请输入转账金额',
    createTx5: '请输入接收地址',
    createTx6: '最大',
    createTx7: '新增多签地址',
    createTx8: '交易HEX'
  },
  public: {
    public1: '生成多链地址',
    public2: '已复制到剪切板',
    public3: '公钥',
    public4: '断开',
    public5: '浏览器中查看',
    public6: '如何使用？'
  },
  tip: {
    tip1: '请输入最少签名数量',
    tip2: '请输入数字',
    tip3: '最少签名数量范围为2-15',
    tip4: '最少签名数量不能超过公钥数量',
    tip5: '请输入正确的地址',
    tip6: '只支持普通转账交易',
    tip7: '请输入有效转账数量',
    tip8: '余额不足',
    tip9: '解析HEX失败',
    tip10: '交易已发出，等待区块确认',
    tip11: '公钥数量不能超过15',
    tip12: '含有重复公钥',
    tip13: '广播交易失败'
  },
  type: {
    type0: '全部交易',
    type1: '共识奖励',
    type2: '转账交易',
    type3: '设置别名',
    type4: '创建节点',
    type5: '加入共识',
    type6: '退出共识',
    type7: '黄牌惩罚',
    type8: '红牌惩罚',
    type9: '注销节点',
    type10: '跨链交易',
    type11: '注册跨链',
    type12: '注销跨链',
    type13: '新增跨链资产',
    type14: '注销跨链资产',
    type15: '创建合约',
    type16: '调用合约',
    type17: '删除合约',
    type18: '合约转账',
    type19: '合约返还',
    type20: '合约创建节点',
    type21: '合约参与共识',
    type22: '合约退出共识',
    type23: '合约注销节点',
    type24: '验证人变更',
    type25: '验证人初始化',
    type26: 'token跨链转账'
  },
  error: {
    lg_0001: '参数错误',
    lg_0002: '链初始化异常',
    lg_1001: '孤儿交易',
    lg_1002: '双花',
    lg_1003: '交易已存在',
    lg_1004: '余额不足',
    lg_1005: '发送的TX量小于接收量。',
    lg_1010: '失败',
    lg_1011: '资产默认设置错误',
    lg_1012: '资产符号错误',
    lg_1013: '资产名称错误',
    lg_1014: '地址错误',
    lg_1015: 'TX签名错误',
    lg_1016: 'TX RPC错误'
  }
};

export default cn;
