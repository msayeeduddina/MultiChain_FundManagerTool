import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import { ChainConfig } from './config/multichain.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const networkConfigs = ChainConfig.networkConfigs;
const recipientAddress = process.env.RECIPIENT_ADDRESS;

async function transferCompleteBalance(privateKey, networkConfig) {
    console.log(`\n--- Processing private key for ${networkConfig.name} ---`);

    let connectedWallet;
    let provider;
    let currentRpcIndex = 0;

    while (currentRpcIndex < networkConfig.rpcUrls.length) {
        const rpcUrl = networkConfig.rpcUrls[currentRpcIndex];
        console.log(`Attempting to connect to ${networkConfig.name} via RPC: ${rpcUrl}`);
        try {
            provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig.chainId);
            const wallet = new ethers.Wallet(privateKey);
            connectedWallet = wallet.connect(provider);

            const providerNetwork = await provider.getNetwork();
            if (providerNetwork.chainId !== BigInt(networkConfig.chainId)) {
                throw new Error(`Connected to wrong chain ID: ${providerNetwork.chainId}. Expected: ${networkConfig.chainId}`);
            }

            await provider.getBlockNumber();
            console.log(`Successfully connected to ${networkConfig.name} via ${rpcUrl}`);
            break;
        } catch (connectError) {
            console.error(`Failed to connect to ${networkConfig.name} via ${rpcUrl}:`, connectError.message);
            currentRpcIndex++;
            if (currentRpcIndex >= networkConfig.rpcUrls.length) {
                console.error(`All RPC providers for ${networkConfig.name} failed to connect. Skipping this network for this private key.`);
                return;
            }
        }
    }

    if (!provider || !connectedWallet) {
        console.error(`No valid provider or wallet connection established for ${networkConfig.name}. Exiting.`);
        return;
    }

    try {
        const balance = await provider.getBalance(connectedWallet.address);
        console.log(`Current balance of ${connectedWallet.address} on ${networkConfig.name}: ${ethers.formatEther(balance)} ${networkConfig.currencySymbol}`);

        if (balance === 0n) {
            console.log(`Account ${connectedWallet.address} has 0 balance on ${networkConfig.name}. Skipping.`);
            return;
        }

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice;

        if (!gasPrice) {
            console.error(`Could not retrieve gas price for ${connectedWallet.address} on ${networkConfig.name}. Skipping transaction.`);
            return;
        }

        const txForEstimation = {
            to: recipientAddress,
            value: 0n,
            gasPrice: gasPrice,
        };

        let estimatedGasLimit;
        try {
            estimatedGasLimit = await provider.estimateGas(txForEstimation);
            estimatedGasLimit = estimatedGasLimit + (estimatedGasLimit / 100n * 5n);
            console.log(`Estimated gas limit for ${connectedWallet.address} on ${networkConfig.name}: ${estimatedGasLimit}`);
        } catch (estimateError) {
            console.error(`Failed to estimate gas for ${connectedWallet.address} on ${networkConfig.name} using ${provider.connection.url}:`, estimateError.message);
            estimatedGasLimit = 21000n;
            console.warn(`Falling back to default gas limit of ${estimatedGasLimit} for ${connectedWallet.address} on ${networkConfig.name}.`);
        }

        const totalCost = gasPrice * estimatedGasLimit;
        const safetyMargin = 1000n;

        if (balance < totalCost + safetyMargin) {
            console.error(`Insufficient balance to cover transaction cost and safety margin for ${connectedWallet.address} on ${networkConfig.name}. Required: ${ethers.formatEther(totalCost + safetyMargin)} ${networkConfig.currencySymbol}, Available: ${ethers.formatEther(balance)} ${networkConfig.currencySymbol}.`);
            return;
        }

        let amountToSend = balance - totalCost - safetyMargin;

        if (amountToSend <= 0n) {
            console.error(`Calculated amount to send is zero or negative for ${connectedWallet.address} on ${networkConfig.name}. Skipping.`);
            return;
        }

        let sendSucceeded = false;
        const decrement = 1000n;
        let tries = 0;
        const maxTries = 5;

        let currentAmount = amountToSend;

        currentRpcIndex = 0;
        while (!sendSucceeded && currentRpcIndex < networkConfig.rpcUrls.length) {
            if (currentRpcIndex > 0) {
                const newRpcUrl = networkConfig.rpcUrls[currentRpcIndex];
                console.log(`Retrying transaction on ${networkConfig.name} with new RPC: ${newRpcUrl}`);
                try {
                    provider = new ethers.JsonRpcProvider(newRpcUrl, networkConfig.chainId);
                    connectedWallet = connectedWallet.connect(provider);
                    await provider.getBlockNumber();
                    console.log(`Successfully switched to ${newRpcUrl} for transaction on ${networkConfig.name}`);
                    currentAmount = amountToSend;
                    tries = 0;
                } catch (switchError) {
                    console.error(`Failed to switch to new RPC ${newRpcUrl} for ${networkConfig.name}:`, switchError.message);
                    currentRpcIndex++;
                    continue;
                }
            }

            while (!sendSucceeded && currentAmount > 0n && tries < maxTries) {
                try {
                    const tx = {
                        to: recipientAddress,
                        value: currentAmount,
                        gasPrice: gasPrice,
                        gasLimit: estimatedGasLimit,
                    };
                    console.log(`Attempt #${tries + 1} (using ${provider.connection.url} for ${networkConfig.name}): Trying to send ${ethers.formatEther(currentAmount)} ${networkConfig.currencySymbol}`);
                    const txResponse = await connectedWallet.sendTransaction(tx);
                    console.log(`Transaction hash for ${connectedWallet.address} on ${networkConfig.name}: ${txResponse.hash}`);
                    await txResponse.wait();
                    console.log(`Transaction completed successfully for ${connectedWallet.address} on ${networkConfig.name}.`);
                    sendSucceeded = true;
                } catch (error) {
                    if (error.code === 'INSUFFICIENT_FUNDS' || (error.info && error.info.error && error.info.error.message && error.info.error.message.includes('insufficient funds'))) {
                        console.warn(`Insufficient funds detected on ${networkConfig.name} for ${connectedWallet.address}. Decrementing amount.`);
                        currentAmount -= decrement;
                        tries++;
                    } else if (error.code === 'NETWORK_ERROR' || error.code === 'CALL_EXCEPTION' || (error.message && (error.message.includes('timeout') || error.message.includes('network')))) {
                        console.error(`Network error during transaction for ${connectedWallet.address} on ${networkConfig.name} using ${provider.connection.url}:`, error.message);
                        break;
                    } else {
                        console.error(`Unhandled error during transaction for ${connectedWallet.address} on ${networkConfig.name}:`, error);
                        sendSucceeded = true;
                    }
                }
            }
            if (!sendSucceeded) {
                currentRpcIndex++;
            }
        }

        if (!sendSucceeded) {
            console.error(`Failed to send from ${connectedWallet.address} on ${networkConfig.name} after trying all RPCs. Final attempted amount: ${ethers.formatEther(currentAmount)} ${networkConfig.currencySymbol}`);
        }
    } catch (error) {
        const address = connectedWallet ? connectedWallet.address : 'unknown address';
        console.error(`An unhandled error occurred for ${address} on ${networkConfig.name}:`, error);
    }
}

async function processPrivateKeysAcrossNetworks() {
    try {
        const data = fs.readFileSync('wallets.txt', 'utf8');
        const privateKeys = data.split('\n').map(key => key.trim()).filter(Boolean);

        if (!recipientAddress || recipientAddress === "0xYourRecipientAddressHere") {
            console.error("ERROR: Please set the 'recipientAddress' in the script.");
            process.exit(1);
        }

        for (const privateKey of privateKeys) {
            if (!privateKey.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
                console.error(`Skipping invalid private key format: ${privateKey.substring(0, 10)}...`);
                continue;
            }

            for (const networkConfig of networkConfigs) {
                await transferCompleteBalance(privateKey, networkConfig);
            }
        }
    } catch (error) {
        console.error("An error occurred while reading the private keys file:", error);
    }
}

processPrivateKeysAcrossNetworks();