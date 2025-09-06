// Contract addresses and ABIs for Base Sepolia
export const CONTRACTS = {
  ENROUTE_REGISTRY: process.env.NEXT_PUBLIC_ENROUTE_REGISTRY_ADDRESS as `0x${string}`,
  POLICY_FACTORY: process.env.NEXT_PUBLIC_POLICY_FACTORY_ADDRESS as `0x${string}`,
  L2_REGISTRY: process.env.NEXT_PUBLIC_L2_REGISTRY_ADDRESS as `0x${string}`,
  SIMPLE_SPLIT_IMPL: process.env.NEXT_PUBLIC_SIMPLE_SPLIT_IMPL as `0x${string}`,
} as const

// Policy types enum
export const POLICY_TYPES = {
  SCHOOL_FEES: 0,
  SAVINGS: 1,
  SPLIT_PAYMENT: 2,
  SIMPLE_SPLIT: 3, // Our SimpleSplitPaymentPolicy
} as const

// EnRouteRegistry ABI - only the functions we need
export const ENROUTE_REGISTRY_ABI = [
  {
    inputs: [{ name: "username", type: "string" }],
    name: "selfRegister",
    outputs: [{ name: "node", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "username", type: "string" },
      { name: "userAddress", type: "address" }
    ],
    name: "registerUser",
    outputs: [{ name: "node", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserNode",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUsernameByAddress",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "username", type: "string" }],
    name: "isUsernameAvailable",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "policyContract", type: "address" },
      { name: "policyName", type: "string" }
    ],
    name: "createPolicyFor",
    outputs: [{ name: "policyNode", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// PolicyFactory ABI - only the functions we need
export const POLICY_FACTORY_ABI = [
  {
    inputs: [
      { name: "policyType", type: "uint8" },
      { name: "policyName", type: "string" },
      { name: "initData", type: "bytes" }
    ],
    name: "createPolicy",
    outputs: [{ name: "policyContract", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPolicies",
    outputs: [
      {
        components: [
          { name: "policyContract", type: "address" },
          { name: "owner", type: "address" },
          { name: "policyType", type: "uint8" },
          { name: "name", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "active", type: "bool" }
        ],
        name: "policies",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "policyType", type: "uint8" }],
    name: "getCreationFee",
    outputs: [{ name: "fee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// SimpleSplitPaymentPolicy ABI - for initialization
export const SIMPLE_SPLIT_POLICY_ABI = [
  {
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_policyName", type: "string" },
      { name: "_description", type: "string" },
      { name: "_recipients", type: "address[]" },
      { name: "_percentages", type: "uint256[]" },
      { name: "_labels", type: "string[]" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "makePayment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getRecipients",
    outputs: [
      {
        components: [
          { name: "wallet", type: "address" },
          { name: "percentage", type: "uint256" },
          { name: "label", type: "string" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function",
  },
] as const
