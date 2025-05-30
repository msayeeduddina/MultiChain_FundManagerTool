import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import Moralis from "moralis";
import { ethers } from 'ethers';
import { ChainConfig } from "./config/multichain.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CHAINS = ChainConfig.CHAINS;
const apiKey = process.env.MORALIS_API_KEY;
if (!apiKey) {
  console.error("Please set your MORALIS_API_KEY environment variable in a .env file.");
  process.exit(1);
}

// Read wallets.txt (one private key per line)
let privateKeys;
try {
  privateKeys = fs.readFileSync('wallets.txt', 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
} catch (err) {
  console.error('Could not read wallets.txt:', err.message);
  process.exit(1);
}

async function getBalancesAndExport() {
  await Moralis.start({ apiKey });
  let rows = [];

  for (const pk of privateKeys) {
    let wallet, address;
    try {
      wallet = new ethers.Wallet(pk.startsWith('0x') ? pk : '0x' + pk);
      address = wallet.address;
    } catch (e) {
      console.error(`Invalid private key: ${pk}`);
      continue;
    }

    for (const { name, chain } of CHAINS) {
      // Native balance
      let nativeBalance = '';
      let nativeSymbol = '';
      try {
        const nativeRes = await Moralis.EvmApi.balance.getNativeBalance({ address, chain });
        const native = nativeRes.toJSON();
        nativeBalance = (native.balance / 10 ** 18).toFixed(6);
        nativeSymbol = native.symbol || "ETH";
      } catch (err) {
        nativeBalance = "ERROR";
        nativeSymbol = "";
      }

      // ERC-20 balances
      let tokens = [];
      try {
        const tokenRes = await Moralis.EvmApi.token.getWalletTokenBalances({ address, chain });
        tokens = tokenRes.toJSON();
      } catch (err) {
        // If error, just skip ERC-20s
      }

      if (tokens.length === 0) {
        // Row for native only
        rows.push({
          'Wallet Address': address,
          'Chain': name,
          'Native Balance': nativeBalance,
          'Native Symbol': nativeSymbol,
          'Token Name': '',
          'Token Symbol': '',
          'Token Balance': '',
          'Token Contract Address': ''
        });
      } else {
        // Row for native + each token
        tokens.forEach(token => {
          const tokenBalance = (token.balance / 10 ** token.decimals).toFixed(token.decimals > 6 ? 6 : token.decimals);
          rows.push({
            'Wallet Address': address,
            'Chain': name,
            'Native Balance': nativeBalance,
            'Native Symbol': nativeSymbol,
            'Token Name': token.name,
            'Token Symbol': token.symbol,
            'Token Balance': tokenBalance,
            'Token Contract Address': token.token_address
          });
        });
      }
    }
  }

  // Write to Excel
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Balances");
  XLSX.writeFile(wb, "wallet_balances.xlsx");
  console.log("Excel file 'wallet_balances.xlsx' created!");
}

getBalancesAndExport();
