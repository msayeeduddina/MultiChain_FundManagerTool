import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { EvmChain } from "@moralisweb3/common-evm-utils";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CHAINS = [
  { name: "Ethereum", chain: EvmChain.ETHEREUM },
  { name: "BNB Chain", chain: EvmChain.BSC },
  { name: "Polygon", chain: EvmChain.POLYGON },
  { name: "Avalanche", chain: EvmChain.AVALANCHE },
  { name: "Arbitrum", chain: EvmChain.ARBITRUM },
  { name: "Optimism", chain: EvmChain.OPTIMISM },
  { name: "Base", chain: EvmChain.BASE },
];

const networkConfigs = [{
        name: "Ethereum Sepolia",
        chainId: 11155111,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://sepolia.etherscan.io/",
        rpcUrls: [
            `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            "https://rpc.sepolia.org",
            "https://ethereum-sepolia.publicnode.com",
            "https://sepolia.drpc.org"
        ],
    },
    {
        name: "Base Sepolia",
        chainId: 84532,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://sepolia-explorer.base.org",
        rpcUrls: [
            "https://sepolia.base.org",
            "https://base-sepolia.drpc.org",
            "https://base-sepolia-rpc.publicnode.com",
        ],
    },
    {
        name: "Avalanche Fuji C-Chain",
        chainId: 43113,
        currencySymbol: "AVAX",
        blockExplorerUrl: "https://testnet.snowtrace.io/",
        rpcUrls: [
            "https://api.avax-test.network/ext/bc/C/rpc",
            "https://avalanche-fuji-c-chain.publicnode.com",
            "https://ava-testnet.public.blastapi.io/ext/bc/C/rpc",
        ],
    },
    {
        name: "Optimism Sepolia",
        chainId: 11155420,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://sepolia-optimism.etherscan.io/",
        rpcUrls: [
            "https://sepolia.optimism.io",
            "https://optimism-sepolia.drpc.org",
            "https://optimism-sepolia.publicnode.com",
        ],
    },
    {
        name: "Polygon Amoy",
        chainId: 80002,
        currencySymbol: "MATIC",
        blockExplorerUrl: "https://amoy.polygonscan.com/",
        rpcUrls: [
            "https://rpc-amoy.polygon.technology",
            "https://polygon-amoy.drpc.org",
            "https://polygon-amoy-bor-rpc.publicnode.com",
        ],
    },
    {
        name: "Arbitrum Sepolia",
        chainId: 421614,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://sepolia.arbiscan.io/",
        rpcUrls: [
            "https://sepolia-rollup.arbitrum.io/rpc",
            "https://arbitrum-sepolia.drpc.org",
        ],
    },
    {
        name: "Binance Smart Chain Testnet",
        chainId: 97,
        currencySymbol: "BNB",
        blockExplorerUrl: "https://testnet.bscscan.com/",
        rpcUrls: [
            "https://data-seed-prebsc-1-s1.binance.org:8545/",
            "https://data-seed-prebsc-2-s1.binance.org:8545/",
        ],
    },
    {
        name: "Fantom Testnet",
        chainId: 4002,
        currencySymbol: "FTM",
        blockExplorerUrl: "https://testnet.ftmscan.com/",
        rpcUrls: [
            "https://rpc.testnet.fantom.network/",
            "https://fantom-testnet.public.blastapi.io/",
        ],
    },
    {
        name: "Goerli",
        chainId: 5,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://goerli.etherscan.io/",
        rpcUrls: [
            `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            "https://goerli.blockpi.network/v1/rpc/public",
        ],
    },
    {
        name: "Rinkeby",
        chainId: 4,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://rinkeby.etherscan.io/",
        rpcUrls: [
            `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        ],
    },
    {
        name: "Ropsten",
        chainId: 3,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://ropsten.etherscan.io/",
        rpcUrls: [
            `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        ],
    },
    {
        name: "Kovan",
        chainId: 42,
        currencySymbol: "ETH",
        blockExplorerUrl: "https://kovan.etherscan.io/",
        rpcUrls: [
            `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        ],
    },
    {
        name: "Moonbeam Testnet",
        chainId: 1287,
        currencySymbol: "GLMR",
        blockExplorerUrl: "https://moonbase.moonscan.io/",
        rpcUrls: [
            "https://rpc.testnet.moonbeam.network",
            "https://moonbeam-alpha.public.blastapi.io",
        ],
    }
];

export const ChainConfig = {
    CHAINS,
    networkConfigs,
};