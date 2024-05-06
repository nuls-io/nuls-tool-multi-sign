const en = {
  tab: {
    Sign: 'Sign',
    CreateAddress: 'Create Address',
    CreateTx: 'Create Transaction'
  },
  sign: {
    sign1: 'Please fill in the HEX to be signed',
    sign2: 'Business Information',
    sign3: 'Transaction Type',
    sign4: 'Transfer',
    sign5: 'Amount',
    sign6: 'From',
    sign7: 'To',
    sign8: 'Multi-sign information',
    sign9: 'Signed quantity',
    sign10: 'Number of signatures still required',
    sign11:
      '*This signature is the last signature of this multi-signature transaction.The transaction will be broadcast to the network after the signature is completed, ',
    sign12: 'Signed HEX',
    sign13: 'Signed',
    sign14: 'The current account has no signature permission',
    sign15: 'Sign And Broadcast'
  },
  createAddress: {
    createAddress1:
      'Paste multiple public keys, separate each public key with a comma, the application will automatically split the information and fill in the following',
    createAddress2: 'Public Key List',
    createAddress3: 'Please enter the public key of the signature address',
    createAddress4: 'Minimum number of signatures',
    createAddress5: 'Address:',
    createAddress6: 'Multi-signature address has been generated',
    createAddress7: 'Invalid pub'
  },
  createTx: {
    createTx1: 'Please choose a multi-signature address',
    createTx2: 'Please select an asset',
    createTx3: 'Available:',
    createTx4: 'Please enter the transfer amount',
    createTx5: 'Please enter the receiving address',
    createTx6: 'Max',
    createTx7: 'Add A Multi-Sign Address',
    createTx8: 'Trading HEX'
  },
  public: {
    public1: 'Generate Multi-Chain Address',
    public2: 'Copied to clipboard',
    public3: 'Public Key',
    public4: 'Disconnect',
    public5: 'View In Browser',
    public6: 'How to use?',
    public7: 'Connect Wallet'
  },
  tip: {
    tip1: 'Please enter the minimum number of signatures',
    tip2: 'Please enter a number',
    tip3: 'The minimum number of signatures is in the range of 2-15',
    tip4: 'The minimum number of signatures cannot exceed the number of public keys',
    tip5: 'Please enter the correct address',
    tip6: 'Only support ordinary transfer transactions',
    tip7: 'Please enter a valid transfer quantity',
    tip8: 'Insufficient balance',
    tip9: 'Failed to parse HEX',
    tip10: 'Transaction has been sent, waiting for block confirmation',
    tip11: 'The number of public keys cannot exceed 15',
    tip12: 'Contains duplicate public keys',
    tip13: 'Broadcast tx failed'
  },
  type: {
    undefined: '',
    type0: 'All',
    type1: 'Consensus Reward',
    type2: 'Transfer',
    type3: 'Register Alias',
    type4: 'Register Node',
    type5: 'Stake',
    type6: 'Unstake',
    type7: 'Yellow Card',
    type8: 'Red Card',
    type9: 'Unregister Node',
    type10: 'Cross Transfer',
    type11: 'Register Cross-Chain',
    type12: 'Unregister Cross-Chain',
    type13: 'Register Cross-Chain Asset',
    type14: 'Unregister Cross-Chain Asset',
    type15: 'Contract Deploy',
    type16: 'Contract Call',
    type17: 'Contract Delete',
    type18: 'Contract Transfer',
    type19: 'Contract Return',
    type20: 'Contract Register Node',
    type21: 'Contract Stake',
    type22: 'Consensus Unstake',
    type23: 'Contract Unregister Node',
    type24: 'Validator Change',
    type25: 'Validator Initialization',
    type26: 'Contract Cross Transfer'
  },
  error: {
    lg_0001: 'Parameter error',
    lg_0002: 'Chain initialization exception',
    lg_1001: 'orphan transaction',
    lg_1002: 'Double spend',
    lg_1003: 'The transaction already exists',
    lg_1004: 'Balance not enough',
    lg_1005: 'TX amount from sending  is less than receiving.',
    lg_1010: 'Failed',
    lg_1011: 'Asset deciaml set error',
    lg_1012: 'Asset symbol error',
    lg_1013: 'Asset name error',
    lg_1014: 'Address error',
    lg_1015: 'TX signature error',
    lg_1016: 'TX RPC error'
  }
};

export default en;
